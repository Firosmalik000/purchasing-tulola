<?php

namespace Database\Seeders;

use App\Actions\Inventory\UpdateStoreStock;
use App\Actions\Orders\CreateOrderFromBankRequests;
use App\Actions\Orders\PlacePurchaseOrder;
use App\Actions\Receipts\ConfirmReceipt;
use App\Actions\Requests\ProcessPurchaseRequest;
use App\Actions\Requests\RejectPurchaseRequest;
use App\Actions\Requests\SavePurchaseRequestDraft;
use App\Actions\Requests\SubmitPurchaseRequest;
use App\Actions\Requests\TransitionPurchaseRequestStatus;
use App\Enums\PurchaseRequestStatus;
use App\Enums\StockMovementType;
use App\Enums\UserRole;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class LocalDashboardDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Data simulasi hanya tersedia untuk local/testing.');
        }

        if (Store::query()->where('code', 'DEMO-A')->exists()) {
            $this->command?->info('Data DEMO sudah tersedia; tidak membuat duplikat.');

            return;
        }

        $previousUser = Auth::user();
        $previousClock = Carbon::getTestNow();
        $today = now()->startOfDay()->addHours(9);

        try {
            DB::transaction(function () use ($today): void {
                $admin = $this->user('demo.admin@tulola.test', 'Demo Admin Pusat', UserRole::CENTRAL_ADMIN);
                Auth::setUser($admin);
                $central = Store::centralStore() ?? Store::create(['code' => 'HO-JKT', 'name' => 'Head Office Jakarta', 'is_active' => true]);
                $a = Store::create(['code' => 'DEMO-A', 'name' => 'Demo Cabang A', 'is_active' => true]);
                $b = Store::create(['code' => 'DEMO-B', 'name' => 'Demo Cabang B', 'is_active' => true]);
                $picA = $this->user('demo.a@tulola.test', 'Demo PIC Cabang A', UserRole::STORE_PIC);
                $picB = $this->user('demo.b@tulola.test', 'Demo PIC Cabang B', UserRole::STORE_PIC);
                $a->users()->attach($picA, ['is_pic' => true, 'is_active' => true]);
                $b->users()->attach($picB, ['is_pic' => true, 'is_active' => true]);
                $unit = Unit::firstOrCreate(['symbol' => 'pcs'], ['name' => 'Piece', 'is_active' => true]);
                $box = Unit::firstOrCreate(['symbol' => 'carton'], ['name' => 'Carton', 'is_active' => true]);
                $category = ItemCategory::create(['code' => 'DEMO', 'name' => 'Simulasi Lokal', 'is_active' => true]);
                $frequent = $this->item('DEMO-FREQ', 'Demo Item Rutin', $category, $unit);
                $bulk = $this->item('DEMO-BULK', 'Demo Item Karton', $category, $box);
                $this->item('DEMO-EMPTY', 'Demo Stok Belum Tercatat', $category, $unit, 5);
                $edge = $this->item('DEMO-EDGE', 'Demo Stok Batas Minimum', $category, $unit, 5);
                $custom = $this->item('DEMO-CUSTOM', 'Demo Minimum Khusus', $category, $unit, 10);
                $inactive = $this->item('DEMO-INACTIVE', 'Demo Item Nonaktif', $category, $unit, 100);
                $inactive->update(['is_active' => false]);
                foreach ([[$frequent, 1000], [$bulk, 1000], [$edge, 5], [$custom, 5]] as [$item, $quantity]) {
                    app(UpdateStoreStock::class)->handle($central, $item, (string) $quantity, StockMovementType::OPENING_BALANCE, 'Saldo awal simulasi dashboard', actor: $admin, unitCost: '1000');
                }
                $central->stockStandards()->create(['item_id' => $custom->id, 'min_quantity' => 3, 'standard_quantity' => 20]);

                Carbon::setTestNow($today);
                $this->request($a, $picA, $bulk, 500, 'Draft', false);
                $this->request($a, $picA, $frequent, 3, 'Menunggu review A');
                $this->request($b, $picB, $frequent, 2, 'Menunggu review B');

                Carbon::setTestNow($today->copy()->subMonthNoOverflow()->startOfMonth()->addDays(9));
                $this->request($a, $picA, $frequent, 4, 'Antrean bulan lalu');
                $old = $this->approve($this->request($a, $picA, $frequent, 6, 'Order berjalan bulan lalu'), $admin);
                app(PlacePurchaseOrder::class)->handle($old);

                Carbon::setTestNow($today);
                $this->approve($this->request($a, $picA, $frequent, 5, 'Order draft'), $admin);
                $partial = $this->approve($this->request($a, $picA, $frequent, 10, 'Penerimaan parsial'), $admin);
                app(PlacePurchaseOrder::class)->handle($partial);
                $this->receive($partial, $a, $picA, 4);
                $complete = $this->approve($this->request($a, $picA, $frequent, 8, 'Penerimaan lengkap bertahap'), $admin);
                app(PlacePurchaseOrder::class)->handle($complete);
                $this->receive($complete, $a, $picA, 3);
                $this->receive($complete, $a, $picA, 5);
                $completeB = $this->approve($this->request($b, $picB, $bulk, 7, 'Penerimaan cabang B'), $admin);
                app(PlacePurchaseOrder::class)->handle($completeB);
                $this->receive($completeB, $b, $picB, 7);
                app(RejectPurchaseRequest::class)->handle($this->request($b, $picB, $bulk, 2, 'Ditolak'), $admin, 'Simulasi penolakan');
                app(TransitionPurchaseRequestStatus::class)->handle($this->request($b, $picB, $bulk, 1, 'Dibatalkan'), PurchaseRequestStatus::CANCELLED, $picB);

                $bankLines = [];
                foreach ([2, 3] as $quantity) {
                    $pr = app(SavePurchaseRequestDraft::class)->handle($a, $picA, [
                        'notes' => 'DEMO: Order gabungan bank permintaan',
                        'special_items' => [['name' => 'Demo Display Khusus', 'unit_id' => $unit->id, 'requested_quantity' => $quantity, 'reason' => 'Simulasi order gabungan']],
                    ]);
                    app(SubmitPurchaseRequest::class)->handle($pr, $picA);
                    $line = $pr->items()->firstOrFail();
                    app(ProcessPurchaseRequest::class)->handle($pr, $admin, [['id' => $line->id, 'approved_quantity' => 0, 'bank_quantity' => $quantity]]);
                    $bankLines[] = ['id' => $line->id, 'quantity' => $quantity];
                }
                $combined = app(CreateOrderFromBankRequests::class)->handle($bankLines, $admin, notes: 'DEMO: Gabungan dua PR')->firstOrFail();
                app(PlacePurchaseOrder::class)->handle($combined);
            });
        } finally {
            Carbon::setTestNow($previousClock);
            if ($previousUser) {
                Auth::setUser($previousUser);
            } else {
                Auth::forgetGuards();
            }
        }
    }

    private function user(string $email, string $name, UserRole $role): User
    {
        return User::firstOrCreate(['email' => $email], ['name' => $name, 'password' => 'password', 'role' => $role, 'is_active' => true, 'email_verified_at' => now()]);
    }

    private function item(string $sku, string $name, ItemCategory $category, Unit $unit, int $minimum = 0): Item
    {
        return Item::create(['sku' => $sku, 'name' => $name, 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true, 'min_stock' => $minimum, 'target_stock' => max(20, $minimum), 'cost_price' => 1000]);
    }

    private function request(Store $store, User $pic, Item $item, int $quantity, string $scenario, bool $submit = true): PurchaseRequest
    {
        $pr = app(SavePurchaseRequestDraft::class)->handle($store, $pic, ['notes' => 'DEMO: '.$scenario, 'required_date' => now()->addWeek()->toDateString(), 'stock_items' => [['item_id' => $item->id, 'requested_quantity' => $quantity]]]);

        return $submit ? app(SubmitPurchaseRequest::class)->handle($pr, $pic) : $pr;
    }

    private function approve(PurchaseRequest $pr, User $admin): PurchaseOrder
    {
        $line = $pr->items()->firstOrFail();
        app(ProcessPurchaseRequest::class)->handle($pr, $admin, [['id' => $line->id, 'approved_quantity' => $line->requested_quantity]]);

        return $pr->purchaseOrders()->firstOrFail();
    }

    private function receive(PurchaseOrder $order, Store $store, User $pic, int $quantity): void
    {
        $allocation = $order->items()->firstOrFail()->allocations()->firstOrFail();
        app(ConfirmReceipt::class)->handle($order, $store, $pic, ['received_at' => now()->toDateTimeString(), 'notes' => 'DEMO: Penerimaan simulasi', 'items' => [['allocation_id' => $allocation->id, 'received_quantity' => (string) $quantity]]]);
    }
}
