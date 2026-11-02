<?php

use App\Http\Controllers\Central\CentralDashboardController;
use App\Http\Controllers\Store\StoreDashboardController;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Receipt;
use App\Models\StockMovement;
use App\Models\StoreStock;
use App\Models\User;
use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;
use GuzzleHttp\TransferStats;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (! $app->environment('local')) {
    throw new RuntimeException('Pemeriksaan ini hanya untuk database lokal.');
}

$checks = [];
$check = function (string $name, mixed $expected, mixed $actual) use (&$checks): void {
    $checks[] = ['check' => $name, 'expected' => $expected, 'actual' => $actual, 'passed' => $expected === $actual];
};
$dashboard = function (string $email, string $controller, array $period = []): array {
    $user = User::where('email', $email)->firstOrFail();
    Auth::setUser($user);
    $request = Request::create('/', 'GET', $period);
    $request->headers->set('X-Inertia', 'true');
    $request->setUserResolver(fn () => $user);

    return app($controller)($request)->toResponse($request)->getData(true)['props'];
};

$central = $dashboard('demo.admin@tulola.test', CentralDashboardController::class);
$a = $dashboard('demo.a@tulola.test', StoreDashboardController::class);
$b = $dashboard('demo.b@tulola.test', StoreDashboardController::class);
$check('central.metrics', ['pendingRequests' => 3, 'processedRequests' => 7, 'activeOrders' => 3, 'completedOrders' => 2, 'stockAlerts' => 2], $central['metrics']);
$check('central.status_total', 11, array_sum(array_column($central['requestStatusDist'], 'count')));
$check('central.current_requests', 10, collect($central['monthlyTrend'])->last()['requests']);
$check('central.current_completed_orders', 2, collect($central['monthlyTrend'])->last()['orders']);
$check('central.top_item', 'Demo Item Rutin', $central['topRequestedItems'][0]['name']);
$check('central.top_item_frequency', 5, $central['topRequestedItems'][0]['request_count']);
foreach (['a' => [$a, 1, 2, 3, 3], 'b' => [$b, 0, 1, 0, 1]] as $store => [$props, $drafts, $submitted, $incoming, $receipts]) {
    foreach (['myDrafts' => $drafts, 'submittedRequests' => $submitted, 'incomingOrders' => $incoming, 'confirmedReceipts' => $receipts] as $metric => $expected) {
        $check('store_'.$store.'.'.$metric, $expected, $props['metrics'][$metric]);
    }
    $check('store_'.$store.'.receipt_po', true, ! empty($props['recentReceipts'][0]['purchase_order']['number']));
}
$combined = PurchaseOrder::whereNull('purchase_request_id')->where('notes', 'DEMO: Gabungan dua PR')->firstOrFail();
$row = collect($central['recentOrders'])->firstWhere('id', $combined->id);
$check('combined_order.sources', 2, count($row['sources'] ?? []));
foreach ([['HO-JKT', 'DEMO-FREQ', 988], ['HO-JKT', 'DEMO-BULK', 993], ['DEMO-A', 'DEMO-FREQ', 12], ['DEMO-B', 'DEMO-BULK', 7]] as [$store, $sku, $quantity]) {
    $stock = StoreStock::whereHas('store', fn ($q) => $q->where('code', $store))->whereHas('item', fn ($q) => $q->where('sku', $sku))->firstOrFail();
    $check('stock.'.$store.'.'.$sku, $quantity, $stock->quantity);
    $check('value.'.$store.'.'.$sku, $quantity * 1000, $stock->total_value);
}
$previous = now()->subMonthNoOverflow();
$past = $dashboard('demo.admin@tulola.test', CentralDashboardController::class, ['month' => $previous->month, 'year' => $previous->year]);
$check('previous_month.status_total', 2, array_sum(array_column($past['requestStatusDist'], 'count')));
$check('previous_month.pending_backlog', 3, $past['metrics']['pendingRequests']);
$check('previous_month.active_backlog', 3, $past['metrics']['activeOrders']);

$baseUrl = rtrim(config('app.url'), '/').'/';
$version = app(HandleInertiaRequests::class)->version(Request::create($baseUrl));
foreach ([['demo.admin@tulola.test', 'central/dashboard', 'store/dashboard', $central], ['demo.a@tulola.test', 'store/dashboard', 'central/dashboard', $a], ['demo.b@tulola.test', 'store/dashboard', 'central/dashboard', $b]] as [$email, $path, $forbiddenPath, $expected]) {
    $cookies = new CookieJar;
    $client = new Client(['base_uri' => $baseUrl, 'cookies' => $cookies, 'http_errors' => false, 'timeout' => 20]);
    $effectiveUrl = $baseUrl;
    $loginPage = $client->get('login', ['on_stats' => function (TransferStats $stats) use (&$effectiveUrl): void {
        $effectiveUrl = (string) $stats->getEffectiveUri();
    }]);
    $client = new Client(['base_uri' => $effectiveUrl, 'cookies' => $cookies, 'http_errors' => false, 'timeout' => 20]);
    $check('http.'.$email.'.login_page', 200, $loginPage->getStatusCode());
    $token = $cookies->getCookieByName('XSRF-TOKEN');
    if (! $token) {
        throw new RuntimeException('Cookie CSRF tidak tersedia pada server lokal.');
    }
    $login = $client->post('login', [
        'allow_redirects' => false,
        'headers' => ['X-XSRF-TOKEN' => urldecode($token->getValue()), 'Accept' => 'application/json'],
        'form_params' => ['email' => $email, 'password' => 'password'],
    ]);
    $check('http.'.$email.'.login', 200, $login->getStatusCode());
    $headers = ['X-Inertia' => 'true', 'X-Inertia-Version' => $version ?? '', 'Accept' => 'text/html'];
    $response = $client->get($path, ['headers' => $headers]);
    $check('http.'.$email.'.dashboard', 200, $response->getStatusCode());
    $page = json_decode((string) $response->getBody(), true, flags: JSON_THROW_ON_ERROR);
    $check('http.'.$email.'.metrics', $expected['metrics'], $page['props']['metrics'] ?? null);
    $forbidden = $client->get($forbiddenPath, ['headers' => $headers]);
    $check('http.'.$email.'.role_scope', 403, $forbidden->getStatusCode());
}

$report = [
    'checked_at' => now()->toIso8601String(),
    'database' => config('database.default'),
    'counts' => ['requests' => PurchaseRequest::count(), 'orders' => PurchaseOrder::count(), 'receipts' => Receipt::count(), 'movements' => StockMovement::count()],
    'checks' => $checks,
    'dashboards' => ['central' => $central, 'store_a' => $a, 'store_b' => $b],
    'requests' => PurchaseRequest::where('notes', 'like', 'DEMO:%')->with(['store:id,code', 'items.item:id,sku,name'])->orderBy('id')->get()->toArray(),
];
$path = storage_path('app/local-dashboard-report.json');
file_put_contents($path, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES).PHP_EOL);
$failed = array_filter($checks, fn ($check) => ! $check['passed']);
foreach ($checks as $result) {
    echo ($result['passed'] ? 'PASS ' : 'FAIL ').$result['check'].PHP_EOL;
}
echo count($checks).' checks; '.count($failed).' failed'.PHP_EOL;
echo $path.PHP_EOL;
exit($failed === [] ? 0 : 1);
