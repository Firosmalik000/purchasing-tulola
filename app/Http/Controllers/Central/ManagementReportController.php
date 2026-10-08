<?php

namespace App\Http\Controllers\Central;

use App\Actions\Reports\BuildManagementReport;
use App\Actions\Reports\ExportManagementReportToExcel;
use App\Enums\ManagementReportType;
use App\Enums\PurchaseOrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\ManagementReportRequest;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\Store;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ManagementReportController extends Controller
{
    public function index(ManagementReportRequest $request, BuildManagementReport $action): Response
    {
        $filters = $request->filters();

        return Inertia::render('central/reports/index', [
            'report' => $action->handle($filters),
            'reportTypes' => collect(ManagementReportType::cases())->map(fn ($type) => ['value' => $type->value, 'label' => $type->label(), 'description' => $type->description(), 'is_snapshot' => $type->isSnapshot()]),
            'stores' => Store::query()->orderBy('code')->get(['id', 'code', 'name']),
            'categories' => ItemCategory::query()->orderBy('name')->get(['id', 'code', 'name']),
            'orders' => PurchaseOrder::query()->where('status', '!=', PurchaseOrderStatus::CANCELLED)->latest('order_date')->limit(100)->get(['id', 'number', 'order_date']),
            'filters' => $filters,
        ]);
    }

    public function print(ManagementReportRequest $request, BuildManagementReport $action): HttpResponse
    {
        return response()->view('reports.management', ['report' => $action->handle($request->filters()), 'print' => true]);
    }

    public function pdf(ManagementReportRequest $request, BuildManagementReport $action): HttpResponse
    {
        $report = $action->handle($request->filters());
        $options = new Options;
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);
        $dompdf = new Dompdf($options);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->loadHtml(view('reports.management', ['report' => $report, 'print' => false])->render());
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$report['type'].'-'.now()->format('Ymd-His').'.pdf"',
        ]);
    }

    public function excel(ManagementReportRequest $request, BuildManagementReport $build, ExportManagementReportToExcel $export): StreamedResponse
    {
        return $export->handle($build->handle($request->filters()));
    }
}
