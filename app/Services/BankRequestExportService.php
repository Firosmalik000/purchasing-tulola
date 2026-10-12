<?php

namespace App\Services;

use App\Models\PurchaseRequestItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BankRequestExportService
{
    /**
     * Export Bank Request items to rich, professionally formatted Excel (.xlsx) with borders,
     * auto column widths, zebra striping, and calculation formulas.
     *
     * @param  Builder<PurchaseRequestItem>  $query
     * @param  array<string, mixed>  $filters
     */
    public function downloadExcel(Builder $query, array $filters, ?User $actor = null): StreamedResponse
    {
        $now = Carbon::now('Asia/Jakarta');
        $filename = 'bank-permintaan-tulola-'.$now->format('Ymd-His').'.xlsx';

        // Resolve store label if filtered
        $storeLabel = 'Semua Toko Cabang';
        if (! empty($filters['store_id'])) {
            $store = Store::query()->find($filters['store_id'], ['id', 'code', 'name']);
            if ($store) {
                $storeLabel = "{$store->code} — {$store->name}";
            }
        }

        // Resolve period label
        $dateFromFormatted = ! empty($filters['date_from'])
            ? Carbon::parse($filters['date_from'])->format('d/m/Y')
            : null;
        $dateToFormatted = ! empty($filters['date_to'])
            ? Carbon::parse($filters['date_to'])->format('d/m/Y')
            : null;

        if ($dateFromFormatted && $dateToFormatted) {
            $periodLabel = "{$dateFromFormatted} s/d {$dateToFormatted}";
        } elseif ($dateFromFormatted) {
            $periodLabel = "Mulai {$dateFromFormatted}";
        } elseif ($dateToFormatted) {
            $periodLabel = "Sampai {$dateToFormatted}";
        } else {
            $periodLabel = 'Semua Periode (Tanpa Batas Tanggal)';
        }

        $keywordLabel = ! empty($filters['keyword']) ? (string) $filters['keyword'] : '—';
        $actorName = $actor ? $actor->name : 'Central Purchasing Staff';

        $items = $query->get();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Bank Permintaan');

        // 1. Top Brand Banner
        $sheet->setCellValue('A1', 'TULOLA JEWELRY — CENTRAL PURCHASING SYSTEM');
        $sheet->mergeCells('A1:M1');
        $sheet->getStyle('A1:M1')->getFont()->setBold(true)->setSize(13)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A1:M1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF312E81');
        $sheet->getStyle('A1:M1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension(1)->setRowHeight(30);

        // 2. Subtitle Title
        $sheet->setCellValue('A2', 'LAPORAN DATA BANK PERMINTAAN BARANG (SPECIAL ORDER)');
        $sheet->mergeCells('A2:M2');
        $sheet->getStyle('A2:M2')->getFont()->setBold(true)->setSize(10)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A2:M2')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4338CA');
        $sheet->getStyle('A2:M2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension(2)->setRowHeight(22);

        // 3. Metadata Block (Left)
        $sheet->setCellValue('A4', 'Lokasi Cabang');
        $sheet->setCellValue('B4', ': '.$storeLabel);
        $sheet->setCellValue('A5', 'Periode Pengajuan');
        $sheet->setCellValue('B5', ': '.$periodLabel);
        $sheet->setCellValue('A6', 'Waktu Unduh');
        $sheet->setCellValue('B6', ': '.$now->format('d/m/Y H:i:s').' WIB');
        $sheet->setCellValue('A7', 'Diekspor Oleh');
        $sheet->setCellValue('B7', ': '.$actorName.($keywordLabel !== '—' ? ' (Filter: "'.$keywordLabel.'")' : ''));

        $sheet->getStyle('A4:A7')->getFont()->setBold(true)->setSize(9)->getColor()->setARGB('FF4B5563');
        $sheet->getStyle('B4:B7')->getFont()->setSize(9)->getColor()->setARGB('FF111827');

        // 4. Metric Summary Card (Right: Columns K to M)
        $totalQuantitySum = $items->sum(function ($item) {
            return (int) ($item->bank_quantity ?? $item->approved_quantity ?? $item->requested_quantity ?? 0);
        });

        $sheet->setCellValue('K4', 'Total Item');
        $sheet->setCellValue('L4', $items->count().' Item');
        $sheet->mergeCells('L4:M4');

        $sheet->setCellValue('K5', 'Total Kuantitas');
        $sheet->setCellValue('L5', number_format($totalQuantitySum, 0, ',', '.').' Unit');
        $sheet->mergeCells('L5:M5');

        $sheet->setCellValue('K6', 'Status');
        $sheet->setCellValue('L6', 'Siap Diproses PO');
        $sheet->mergeCells('L6:M6');

        $sheet->getStyle('K4:K6')->getFont()->setBold(true)->setSize(9)->getColor()->setARGB('FF4B5563');
        $sheet->getStyle('L4:L6')->getFont()->setBold(true)->setSize(9)->getColor()->setARGB('FF1F2937');
        $sheet->getStyle('K4:M6')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF8FAFC');
        $sheet->getStyle('K4:M6')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFE2E8F0');

        // 5. Table Header Row (Row 9)
        $headers = [
            'A9' => ['No', Alignment::HORIZONTAL_CENTER],
            'B9' => ['No. Permintaan (PR)', Alignment::HORIZONTAL_CENTER],
            'C9' => ['Tanggal PR', Alignment::HORIZONTAL_CENTER],
            'D9' => ['Target Dibutuhkan', Alignment::HORIZONTAL_CENTER],
            'E9' => ['Kode Cabang', Alignment::HORIZONTAL_CENTER],
            'Nama Toko / Cabang', // F9
            'Pemohon (PIC)', // G9
            'Nama Barang', // H9
            'Spesifikasi / Keterangan', // I9
            'Alasan Pengajuan', // J9
            'Qty Dianggarkan', // K9
            'Satuan', // L9
            'Status Item', // M9
        ];

        $columnHeaders = [
            'A9' => ['No', Alignment::HORIZONTAL_CENTER],
            'B9' => ['No. Permintaan (PR)', Alignment::HORIZONTAL_CENTER],
            'C9' => ['Tanggal PR', Alignment::HORIZONTAL_CENTER],
            'D9' => ['Target Dibutuhkan', Alignment::HORIZONTAL_CENTER],
            'E9' => ['Kode Cabang', Alignment::HORIZONTAL_CENTER],
            'F9' => ['Nama Toko / Cabang', Alignment::HORIZONTAL_LEFT],
            'G9' => ['Pemohon (PIC)', Alignment::HORIZONTAL_LEFT],
            'H9' => ['Nama Barang', Alignment::HORIZONTAL_LEFT],
            'I9' => ['Spesifikasi / Keterangan', Alignment::HORIZONTAL_LEFT],
            'J9' => ['Alasan Pengajuan', Alignment::HORIZONTAL_LEFT],
            'K9' => ['Qty Dianggarkan', Alignment::HORIZONTAL_RIGHT],
            'L9' => ['Satuan', Alignment::HORIZONTAL_CENTER],
            'M9' => ['Status Item', Alignment::HORIZONTAL_CENTER],
        ];

        foreach ($columnHeaders as $cell => [$label, $alignment]) {
            $sheet->setCellValue($cell, $label);
            $sheet->getStyle($cell)->getAlignment()->setHorizontal($alignment)->setVertical(Alignment::VERTICAL_CENTER);
        }

        $sheet->getStyle('A9:M9')->getFont()->setBold(true)->setSize(9)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A9:M9')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF312E81');
        $sheet->getRowDimension(9)->setRowHeight(26);

        // 6. Data Rows (Starting at Row 10)
        $startRow = 10;
        $currentRow = $startRow;

        foreach ($items as $index => $item) {
            $qty = (int) ($item->bank_quantity ?? $item->approved_quantity ?? $item->requested_quantity ?? 0);

            $prCreatedAt = $item->purchaseRequest?->created_at
                ? Carbon::parse($item->purchaseRequest->created_at)->format('d/m/Y H:i')
                : '—';

            $requiredDate = $item->required_date
                ? Carbon::parse($item->required_date)->format('d/m/Y')
                : ($item->purchaseRequest?->required_date
                    ? Carbon::parse($item->purchaseRequest->required_date)->format('d/m/Y')
                    : '—');

            $statusLabel = $item->status?->label() ?? 'Bank Permintaan';

            $sheet->setCellValueExplicit('A'.$currentRow, (string) ($index + 1), DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit('B'.$currentRow, (string) ($item->purchaseRequest?->number ?? '—'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('C'.$currentRow, $prCreatedAt, DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('D'.$currentRow, $requiredDate, DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('E'.$currentRow, (string) ($item->purchaseRequest?->store?->code ?? '—'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('F'.$currentRow, (string) ($item->purchaseRequest?->store?->name ?? '—'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('G'.$currentRow, (string) ($item->purchaseRequest?->requester?->name ?? '—'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('H'.$currentRow, (string) ($item->name ?? '—'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('I'.$currentRow, (string) ($item->description ? str_replace(["\r\n", "\r", "\n"], ' ', $item->description) : '—'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('J'.$currentRow, (string) ($item->reason ? str_replace(["\r\n", "\r", "\n"], ' ', $item->reason) : '—'), DataType::TYPE_STRING);
            $sheet->setCellValue('K'.$currentRow, $qty);
            $sheet->setCellValueExplicit('L'.$currentRow, (string) ($item->unit?->symbol ?? 'pcs'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('M'.$currentRow, $statusLabel, DataType::TYPE_STRING);

            // Alignments
            $sheet->getStyle('A'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('B'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('C'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('D'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('E'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('F'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('G'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('H'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('I'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('J'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('K'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle('L'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('M'.$currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Format Number
            $sheet->getStyle('K'.$currentRow)->getNumberFormat()->setFormatCode('#,##0');

            // Zebra striping
            $rowBg = ($currentRow % 2 === 0) ? 'FFF8FAFC' : 'FFFFFFFF';
            $sheet->getStyle("A{$currentRow}:L{$currentRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($rowBg);

            // Status Column Badge Style (Light amber background)
            $sheet->getStyle('M'.$currentRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFFEF3C7');
            $sheet->getStyle('M'.$currentRow)->getFont()->setBold(true)->setSize(8)->getColor()->setARGB('FF92400E');

            $sheet->getStyle("A{$currentRow}:M{$currentRow}")->getFont()->setSize(9);
            $sheet->getStyle('H'.$currentRow)->getFont()->setBold(true);

            $sheet->getRowDimension($currentRow)->setRowHeight(22);
            $currentRow++;
        }

        $lastDataRow = max($currentRow - 1, $startRow);

        // 7. Grand Total Row
        $sheet->setCellValue('A'.$currentRow, 'TOTAL KESELURUHAN');
        $sheet->mergeCells("A{$currentRow}:J{$currentRow}");
        $sheet->getStyle("A{$currentRow}:J{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        if ($items->isNotEmpty()) {
            $sheet->setCellValue('K'.$currentRow, "=SUM(K{$startRow}:K{$lastDataRow})");
        } else {
            $sheet->setCellValue('K'.$currentRow, 0);
        }

        $sheet->setCellValue('L'.$currentRow, 'Unit');
        $sheet->setCellValue('M'.$currentRow, $items->count().' Item');

        $sheet->getStyle("K{$currentRow}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("A{$currentRow}:M{$currentRow}")->getFont()->setBold(true)->setSize(9);
        $sheet->getStyle("A{$currentRow}:M{$currentRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFEEF2FF');
        $sheet->getStyle("K{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("L{$currentRow}:M{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getRowDimension($currentRow)->setRowHeight(24);

        // 8. BORDERS - Give clean, professional borders to the entire table!
        // All table cells border (Row 9 to last data row)
        $sheet->getStyle("A9:M{$lastDataRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFCBD5E1');

        // Total row borders (Accounting style: thin top, double bottom)
        $sheet->getStyle("A{$currentRow}:M{$currentRow}")->getBorders()->getTop()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FF312E81');
        $sheet->getStyle("A{$currentRow}:M{$currentRow}")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_DOUBLE)->getColor()->setARGB('FF312E81');
        $sheet->getStyle("A{$currentRow}:M{$currentRow}")->getBorders()->getLeft()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFCBD5E1');
        $sheet->getStyle("A{$currentRow}:M{$currentRow}")->getBorders()->getRight()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFCBD5E1');

        // 9. AutoFilter & Freeze Panes
        if ($items->isNotEmpty()) {
            $sheet->setAutoFilter("A9:M{$lastDataRow}");
        }
        $sheet->freezePane('A10');

        // 10. Column Auto-sizing so NO text is truncated or squished
        foreach (range(1, 13) as $colIdx) {
            $colLetter = Coordinate::stringFromColumnIndex($colIdx);
            $sheet->getColumnDimension($colLetter)->setAutoSize(true);
        }

        // 11. Page Setup for Printing / PDF
        $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
        $sheet->getPageSetup()->setPaperSize(PageSetup::PAPERSIZE_A4);
        $sheet->setShowGridLines(true);
        $sheet->setSelectedCell('A1');

        return response()->streamDownload(function () use ($spreadsheet): void {
            (new Xlsx($spreadsheet))->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Export Bank Request items to a cleanly formatted UTF-8 CSV with professional header metadata.
     *
     * @param  Builder<PurchaseRequestItem>  $query
     * @param  array<string, mixed>  $filters
     */
    public function downloadCsv(Builder $query, array $filters, ?User $actor = null): StreamedResponse
    {
        $now = Carbon::now('Asia/Jakarta');
        $filename = 'bank-permintaan-tulola-'.$now->format('Ymd-His').'.csv';

        // Resolve store label if filtered
        $storeLabel = 'Semua Toko Cabang';
        if (! empty($filters['store_id'])) {
            $store = Store::query()->find($filters['store_id'], ['id', 'code', 'name']);
            if ($store) {
                $storeLabel = "{$store->code} — {$store->name}";
            }
        }

        // Resolve period label
        $dateFromFormatted = ! empty($filters['date_from'])
            ? Carbon::parse($filters['date_from'])->format('d/m/Y')
            : null;
        $dateToFormatted = ! empty($filters['date_to'])
            ? Carbon::parse($filters['date_to'])->format('d/m/Y')
            : null;

        if ($dateFromFormatted && $dateToFormatted) {
            $periodLabel = "{$dateFromFormatted} s/d {$dateToFormatted}";
        } elseif ($dateFromFormatted) {
            $periodLabel = "Mulai {$dateFromFormatted}";
        } elseif ($dateToFormatted) {
            $periodLabel = "Sampai {$dateToFormatted}";
        } else {
            $periodLabel = 'Semua Periode (Tanpa Batas Tanggal)';
        }

        $keywordLabel = ! empty($filters['keyword']) ? (string) $filters['keyword'] : '—';
        $actorName = $actor ? $actor->name : 'Central Purchasing Staff';

        return response()->streamDownload(function () use (
            $query,
            $now,
            $storeLabel,
            $periodLabel,
            $keywordLabel,
            $actorName
        ): void {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }

            // Write UTF-8 BOM so Microsoft Excel (Windows & Mac) reads accents/characters cleanly
            fwrite($out, "\xEF\xBB\xBF");

            // 1. Professional Header Metadata Block
            fputcsv($out, ['LAPORAN DATA BANK PERMINTAAN BARANG (SPECIAL ORDER)']);
            fputcsv($out, ['Tulola Jewelry — Central Purchasing System']);
            fputcsv($out, ['Waktu Unduh', $now->format('d/m/Y H:i:s').' WIB']);
            fputcsv($out, ['Diekspor Oleh', $actorName]);
            fputcsv($out, ['Filter Cabang / Toko', $storeLabel]);
            fputcsv($out, ['Filter Periode Pengajuan', $periodLabel]);
            fputcsv($out, ['Filter Kata Kunci', $keywordLabel]);
            fputcsv($out, []); // Blank separator row

            // 2. Data Table Column Headers
            fputcsv($out, [
                'No',
                'No. Permintaan (PR)',
                'Tanggal PR',
                'Target Dibutuhkan',
                'Kode Cabang',
                'Nama Toko / Cabang',
                'Pemohon (PIC)',
                'Nama Barang',
                'Spesifikasi / Keterangan',
                'Alasan Pengajuan',
                'Kuantitas Dianggarkan',
                'Satuan',
                'Status Item',
            ]);

            // 3. Data Rows Streamed via Cursor
            $index = 1;
            $totalQuantity = 0;

            /** @var PurchaseRequestItem $item */
            foreach ($query->cursor() as $item) {
                $qty = (int) ($item->bank_quantity ?? $item->approved_quantity ?? $item->requested_quantity ?? 0);
                $totalQuantity += $qty;

                $prCreatedAt = $item->purchaseRequest?->created_at
                    ? Carbon::parse($item->purchaseRequest->created_at)->format('d/m/Y H:i')
                    : '—';

                $requiredDate = $item->required_date
                    ? Carbon::parse($item->required_date)->format('d/m/Y')
                    : ($item->purchaseRequest?->required_date
                        ? Carbon::parse($item->purchaseRequest->required_date)->format('d/m/Y')
                        : '—');

                $statusLabel = $item->status?->label() ?? 'Bank Permintaan';

                fputcsv($out, [
                    $index++,
                    $item->purchaseRequest?->number ?? '—',
                    $prCreatedAt,
                    $requiredDate,
                    $item->purchaseRequest?->store?->code ?? '—',
                    $item->purchaseRequest?->store?->name ?? '—',
                    $item->purchaseRequest?->requester?->name ?? '—',
                    $item->name ?? '—',
                    $item->description ? str_replace(["\r\n", "\r", "\n"], ' ', $item->description) : '—',
                    $item->reason ? str_replace(["\r\n", "\r", "\n"], ' ', $item->reason) : '—',
                    $qty,
                    $item->unit?->symbol ?? 'pcs',
                    $statusLabel,
                ]);
            }

            // 4. Summary / Footer Row
            fputcsv($out, []); // Blank separator row
            fputcsv($out, [
                'TOTAL',
                ($index - 1).' Item Permintaan',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                'Total Kuantitas:',
                $totalQuantity,
                'Unit',
                '',
            ]);

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
