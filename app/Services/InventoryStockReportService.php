<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Store;
use App\Models\User;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Response as HttpResponse;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InventoryStockReportService
{
    /**
     * Build rich, structured stock report data for central inventory.
     *
     * @return array<string, mixed>
     */
    public function buildReportData(
        ?int $storeId = null,
        ?string $search = null,
        ?User $actor = null,
        ?int $categoryId = null,
        ?string $statusFilter = null,
    ): array {
        $centralStore = null;

        if ($storeId) {
            $centralStore = Store::query()->where('is_active', true)->find($storeId);
        }

        if (! $centralStore) {
            $centralStore = Store::centralStore()
                ?? Store::query()->where('is_active', true)->orderBy('id')->first();
        }

        $resolvedStoreId = $centralStore?->id;
        $search = trim((string) $search);

        $query = Item::query()
            ->when($statusFilter === 'inactive', fn ($q) => $q->where('is_active', false), fn ($q) => $q->where('is_active', true))
            ->when($categoryId !== null, fn ($q) => $q->where('item_category_id', $categoryId))
            ->with([
                'category:id,name,code',
                'unit:id,name,symbol',
                'stocks' => fn ($q) => $q->where('store_id', $resolvedStoreId),
                'stockStandards' => fn ($q) => $q->where('store_id', $resolvedStoreId),
            ]);

        if ($search !== '') {
            $query->where(function ($nested) use ($search) {
                $nested->where('sku', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhereHas('category', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        $items = $query->orderBy('name')->get();

        $rows = [];
        $totalPhysicalQty = 0;
        $totalValuation = 0;
        $countHabis = 0;
        $countKritis = 0;
        $countMenipis = 0;
        $countAman = 0;

        foreach ($items as $index => $item) {
            $stock = $item->stocks->first();
            $standard = $item->stockStandards->first();

            $currentQty = (int) ($stock ? $stock->quantity : 0);
            $unitCost = (int) ($stock ? $stock->average_unit_cost : ($item->cost_price ?? 0));
            $itemTotalValue = (int) ($stock ? $stock->total_value : ($currentQty * $unitCost));

            // Standards & thresholds
            $minStock = $standard && $standard->min_quantity !== null
                ? (int) $standard->min_quantity
                : (int) ($item->min_stock ?? 0);

            $targetStock = $standard && (int) $standard->standard_quantity > 0
                ? (int) $standard->standard_quantity
                : (int) ($item->target_stock ?? $minStock);

            $standardQty = (int) ($standard ? $standard->standard_quantity : 0);

            // Stock Status
            if ($currentQty <= 0) {
                $status = 'HABIS';
                $statusLabel = 'Stok Habis';
                $statusBadge = 'danger';
                $excelBg = 'FFFEE2E2';
                $excelFg = 'FF991B1B';
                $countHabis++;
            } elseif ($minStock > 0 && $currentQty <= $minStock) {
                $status = 'KRITIS';
                $statusLabel = 'Stok Kritis';
                $statusBadge = 'critical';
                $excelBg = 'FFFEF3C7';
                $excelFg = 'FF92400E';
                $countKritis++;
            } elseif (($targetStock > 0 && $currentQty < $targetStock) || ($standardQty > 0 && $currentQty < $standardQty)) {
                $status = 'MENIPIS';
                $statusLabel = 'Di Bawah Standar';
                $statusBadge = 'warning';
                $excelBg = 'FFFEF9C3';
                $excelFg = 'FF854D0E';
                $countMenipis++;
            } else {
                $status = 'AMAN';
                $statusLabel = 'Stok Aman';
                $statusBadge = 'success';
                $excelBg = 'FFDCFCE7';
                $excelFg = 'FF166534';
                $countAman++;
            }

            if ($statusFilter !== null && $statusFilter !== '') {
                $matchesStatus = match (strtolower($statusFilter)) {
                    'habis' => $status === 'HABIS',
                    'kritis' => in_array($status, ['KRITIS', 'HABIS'], true),
                    'restock', 'menipis' => $status === 'MENIPIS',
                    'aman' => $status === 'AMAN',
                    'active', 'inactive' => true,
                    default => true,
                };
                if (! $matchesStatus) {
                    continue;
                }
            }

            $totalPhysicalQty += $currentQty;
            $totalValuation += $itemTotalValue;

            $rows[] = [
                'no' => count($rows) + 1,
                'id' => $item->id,
                'sku' => $item->sku,
                'name' => $item->name,
                'category_name' => $item->category ? $item->category->name : 'Tanpa Kategori',
                'category_code' => $item->category ? $item->category->code : '—',
                'unit_symbol' => $item->unit ? $item->unit->symbol : 'pcs',
                'current_quantity' => $currentQty,
                'min_stock' => $minStock,
                'target_stock' => $targetStock,
                'standard_quantity' => $standardQty,
                'unit_cost' => $unitCost,
                'total_value' => $itemTotalValue,
                'status' => $status,
                'status_label' => $statusLabel,
                'status_badge' => $statusBadge,
                'excel_bg' => $excelBg,
                'excel_fg' => $excelFg,
            ];
        }

        $now = now();
        $storeCode = $centralStore ? $centralStore->code : 'HO-JKT';
        $storeName = $centralStore ? $centralStore->name : 'Gudang Pusat (Head Office Jakarta)';
        $actorName = $actor ? $actor->name : 'Staff Inventory';

        return [
            'title' => 'Laporan Data Stok Fisik & Valuasi Aset',
            'subtitle' => 'Inventaris Gudang Pusat · Tulola Jewelry',
            'store' => [
                'id' => $centralStore?->id,
                'code' => $storeCode,
                'name' => $storeName,
            ],
            'generated_at' => $now->format('d/m/Y H:i').' WIB',
            'generated_date' => $now->format('d F Y'),
            'generated_by' => $actorName,
            'search_query' => $search,
            'summary' => [
                'total_items' => count($rows),
                'total_physical_qty' => $totalPhysicalQty,
                'total_valuation' => $totalValuation,
                'count_habis' => $countHabis,
                'count_kritis' => $countKritis,
                'count_menipis' => $countMenipis,
                'count_aman' => $countAman,
            ],
            'rows' => $rows,
            'signatures' => [
                'Dibuat Oleh' => $actorName,
                'Diperiksa Oleh' => 'Kepala Bagian Logistik',
                'Disetujui Oleh' => 'Purchasing Manager',
            ],
        ];
    }

    /**
     * Generate and download PDF using Dompdf from the Blade template.
     *
     * @param  array<string, mixed>  $report
     */
    public function downloadPdf(array $report): HttpResponse
    {
        $options = new Options;
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->loadHtml(view('reports.inventory-stock', ['report' => $report, 'print' => false])->render());
        $dompdf->render();

        $filename = 'laporan-stok-tulola-'.now()->format('Ymd-His').'.pdf';

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Export rich, professionally formatted Excel (.xlsx) using PhpSpreadsheet.
     *
     * @param  array<string, mixed>  $report
     */
    public function downloadExcel(array $report): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Stok Terbaru');

        // Brand Banner Header
        $sheet->setCellValue('A1', 'TULOLA JEWELRY');
        $sheet->mergeCells('A1:L1');
        $sheet->getStyle('A1:L1')->getFont()->setBold(true)->setSize(16)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A1:L1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4C1D95');
        $sheet->getStyle('A1:L1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension(1)->setRowHeight(32);

        $sheet->setCellValue('A2', 'LAPORAN DATA STOK FISIK TERBARU & ESTIMASI VALUASI ASET');
        $sheet->mergeCells('A2:L2');
        $sheet->getStyle('A2:L2')->getFont()->setBold(true)->setSize(11)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A2:L2')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF312E81');
        $sheet->getStyle('A2:L2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension(2)->setRowHeight(24);

        // Metadata Block
        $storeName = $report['store']['name'].' ('.$report['store']['code'].')';
        $sheet->setCellValue('A4', 'Lokasi Gudang');
        $sheet->setCellValue('B4', ': '.$storeName);
        $sheet->setCellValue('A5', 'Waktu Cetak');
        $sheet->setCellValue('B5', ': '.$report['generated_at']);
        $sheet->setCellValue('A6', 'Dicetak Oleh');
        $sheet->setCellValue('B6', ': '.$report['generated_by'].($report['search_query'] ? ' · Filter: "'.$report['search_query'].'"' : ''));

        $sheet->getStyle('A4:A6')->getFont()->setBold(true)->setSize(9)->getColor()->setARGB('FF4B5563');
        $sheet->getStyle('B4:B6')->getFont()->setSize(9)->getColor()->setARGB('FF111827');

        // KPI Summary Box in Excel (Columns I to L)
        $sheet->setCellValue('I4', 'Total SKU');
        $sheet->setCellValue('J4', (int) $report['summary']['total_items'].' Item');
        $sheet->setCellValue('K4', 'Stok Aman');
        $sheet->setCellValue('L4', (int) $report['summary']['count_aman'].' Item');

        $sheet->setCellValue('I5', 'Total Fisik');
        $sheet->setCellValue('J5', number_format((int) $report['summary']['total_physical_qty'], 0, ',', '.').' Unit');
        $sheet->setCellValue('K5', 'Di Bawah Standar');
        $sheet->setCellValue('L5', (int) $report['summary']['count_menipis'].' Item');

        $sheet->setCellValue('I6', 'Total Valuasi');
        $sheet->setCellValue('J6', 'Rp '.number_format((int) $report['summary']['total_valuation'], 0, ',', '.'));
        $sheet->setCellValue('K6', 'Kritis / Habis');
        $sheet->setCellValue('L6', ((int) $report['summary']['count_kritis'] + (int) $report['summary']['count_habis']).' Item');

        $sheet->getStyle('I4:I6')->getFont()->setBold(true)->setSize(9)->getColor()->setARGB('FF4B5563');
        $sheet->getStyle('K4:K6')->getFont()->setBold(true)->setSize(9)->getColor()->setARGB('FF4B5563');
        $sheet->getStyle('J4:J6')->getFont()->setBold(true)->setSize(9)->getColor()->setARGB('FF1F2937');
        $sheet->getStyle('L4:L6')->getFont()->setBold(true)->setSize(9)->getColor()->setARGB('FFDC2626');

        $sheet->getStyle('I4:L6')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF8FAFC');
        $sheet->getStyle('I4:L6')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFE2E8F0');

        // Table Header (Row 8)
        $headers = [
            'A8' => ['No', Alignment::HORIZONTAL_CENTER],
            'B8' => ['SKU Barang', Alignment::HORIZONTAL_CENTER],
            'C8' => ['Nama Barang', Alignment::HORIZONTAL_LEFT],
            'D8' => ['Kategori', Alignment::HORIZONTAL_LEFT],
            'E8' => ['Satuan', Alignment::HORIZONTAL_CENTER],
            'F8' => ['Stok Fisik', Alignment::HORIZONTAL_RIGHT],
            'G8' => ['Min. Stok', Alignment::HORIZONTAL_RIGHT],
            'H8' => ['Target Stok', Alignment::HORIZONTAL_RIGHT],
            'I8' => ['Standar Toko', Alignment::HORIZONTAL_RIGHT],
            'J8' => ['Harga Pokok (HPP)', Alignment::HORIZONTAL_RIGHT],
            'K8' => ['Total Valuasi Aset', Alignment::HORIZONTAL_RIGHT],
            'L8' => ['Status Stok', Alignment::HORIZONTAL_CENTER],
        ];

        foreach ($headers as $cell => [$label, $alignment]) {
            $sheet->setCellValue($cell, $label);
            $sheet->getStyle($cell)->getAlignment()->setHorizontal($alignment)->setVertical(Alignment::VERTICAL_CENTER);
        }

        $sheet->getStyle('A8:L8')->getFont()->setBold(true)->setSize(9)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A8:L8')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF312E81');
        $sheet->getRowDimension(8)->setRowHeight(26);

        // Data Rows starting at Row 9
        $startRow = 9;
        $currentRow = $startRow;

        foreach ($report['rows'] as $row) {
            $sheet->setCellValueExplicit('A'.$currentRow, (string) $row['no'], DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit('B'.$currentRow, (string) $row['sku'], DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('C'.$currentRow, (string) $row['name'], DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('D'.$currentRow, (string) $row['category_name'], DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('E'.$currentRow, (string) $row['unit_symbol'], DataType::TYPE_STRING);

            $sheet->setCellValue('F'.$currentRow, (int) $row['current_quantity']);
            $sheet->setCellValue('G'.$currentRow, (int) $row['min_stock']);
            $sheet->setCellValue('H'.$currentRow, (int) $row['target_stock']);
            $sheet->setCellValue('I'.$currentRow, (int) $row['standard_quantity']);
            $sheet->setCellValue('J'.$currentRow, (int) $row['unit_cost']);
            $sheet->setCellValue('K'.$currentRow, "=F{$currentRow}*J{$currentRow}");

            $sheet->setCellValueExplicit('L'.$currentRow, (string) $row['status_label'], DataType::TYPE_STRING);

            // Number Formats
            $sheet->getStyle('F'.$currentRow.':I'.$currentRow)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('J'.$currentRow.':K'.$currentRow)->getNumberFormat()->setFormatCode('[$Rp-id-ID] #,##0');

            // Alignments
            $sheet->getStyle('A'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('B'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('C'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('D'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('E'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('F'.$currentRow.':K'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle('L'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Alternating zebra striping
            $rowBg = ($currentRow % 2 === 0) ? 'FFF8FAFC' : 'FFFFFFFF';
            $sheet->getStyle("A{$currentRow}:K{$currentRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($rowBg);

            // Status Badge Column Fill & Color
            $sheet->getStyle('L'.$currentRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($row['excel_bg']);
            $sheet->getStyle('L'.$currentRow)->getFont()->setBold(true)->setSize(8)->getColor()->setARGB($row['excel_fg']);

            $sheet->getRowDimension($currentRow)->setRowHeight(20);
            $currentRow++;
        }

        $lastDataRow = max($currentRow - 1, $startRow);

        // Grand Total Row
        $sheet->setCellValue('A'.$currentRow, 'TOTAL KESELURUHAN');
        $sheet->mergeCells("A{$currentRow}:E{$currentRow}");
        $sheet->getStyle("A{$currentRow}:E{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        $sheet->setCellValue('F'.$currentRow, "=SUM(F{$startRow}:F{$lastDataRow})");
        $sheet->setCellValue('G'.$currentRow, '-');
        $sheet->setCellValue('H'.$currentRow, '-');
        $sheet->setCellValue('I'.$currentRow, '-');
        $sheet->setCellValue('J'.$currentRow, '-');
        $sheet->setCellValue('K'.$currentRow, "=SUM(K{$startRow}:K{$lastDataRow})");
        $sheet->setCellValue('L'.$currentRow, count($report['rows']).' SKU');

        $sheet->getStyle("F{$currentRow}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("K{$currentRow}")->getNumberFormat()->setFormatCode('[$Rp-id-ID] #,##0');
        $sheet->getStyle("A{$currentRow}:L{$currentRow}")->getFont()->setBold(true)->setSize(9);
        $sheet->getStyle("A{$currentRow}:L{$currentRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFEEF2FF');
        $sheet->getStyle("F{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("G{$currentRow}:J{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("K{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("L{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getRowDimension($currentRow)->setRowHeight(24);

        // Accounting borders for total row
        $sheet->getStyle("A{$currentRow}:L{$currentRow}")->getBorders()->getTop()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FF312E81');
        $sheet->getStyle("A{$currentRow}:L{$currentRow}")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_DOUBLE)->getColor()->setARGB('FF312E81');

        // General borders for data table
        $sheet->getStyle("A8:L{$lastDataRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFE5E7EB');

        // AutoFilter & Freeze Panes
        $sheet->setAutoFilter("A8:L{$lastDataRow}");
        $sheet->freezePane('A9');

        // Column Auto-sizing with safety minimums
        foreach (range(1, 12) as $colIdx) {
            $colLetter = Coordinate::stringFromColumnIndex($colIdx);
            $sheet->getColumnDimension($colLetter)->setAutoSize(true);
        }

        // Page setup for printing
        $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
        $sheet->getPageSetup()->setPaperSize(PageSetup::PAPERSIZE_A4);
        $sheet->setShowGridLines(true);
        $sheet->setSelectedCell('A1');

        $filename = 'laporan-stok-tulola-'.now()->format('Ymd-His').'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet): void {
            (new Xlsx($spreadsheet))->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $filename, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    /**
     * Export clean, standardized UTF-8 CSV with BOM for high compatibility with Excel and third-party tools.
     *
     * @param  array<string, mixed>  $report
     */
    public function downloadCsv(array $report): StreamedResponse
    {
        $filename = 'laporan-stok-tulola-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($report): void {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }

            // Write UTF-8 BOM so Excel opens special characters correctly
            fwrite($out, "\xEF\xBB\xBF");

            // CSV Header Row
            fputcsv($out, [
                'No',
                'SKU',
                'Nama Barang',
                'Kategori',
                'Satuan',
                'Stok Fisik',
                'Min. Stok',
                'Target Stok',
                'Standar Toko',
                'Harga Pokok (HPP IDR)',
                'Total Valuasi Aset (IDR)',
                'Status Stok',
            ]);

            foreach ($report['rows'] as $row) {
                fputcsv($out, [
                    $row['no'],
                    $row['sku'],
                    $row['name'],
                    $row['category_name'],
                    $row['unit_symbol'],
                    $row['current_quantity'],
                    $row['min_stock'],
                    $row['target_stock'],
                    $row['standard_quantity'],
                    $row['unit_cost'],
                    $row['total_value'],
                    $row['status_label'],
                ]);
            }

            // Summary row at bottom
            fputcsv($out, [
                'TOTAL',
                '',
                count($report['rows']).' SKU',
                '',
                '',
                $report['summary']['total_physical_qty'],
                '',
                '',
                '',
                '',
                $report['summary']['total_valuation'],
                '',
            ]);

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }
}
