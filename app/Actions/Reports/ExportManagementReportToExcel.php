<?php

namespace App\Actions\Reports;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportManagementReportToExcel
{
    /** @param array<string, mixed> $report */
    public function handle(array $report): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Report');
        $columns = $report['columns'];
        $lastColumn = Coordinate::stringFromColumnIndex(max(count($columns), 1));

        $sheet->setCellValue('A1', $report['title']);
        $sheet->mergeCells("A1:{$lastColumn}1");
        $sheet->setCellValue('A2', $report['period'].' · Dibuat '.$report['generated_at']);
        $sheet->mergeCells("A2:{$lastColumn}2");
        $sheet->getStyle("A1:{$lastColumn}1")->getFont()->setBold(true)->setSize(16)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle("A1:{$lastColumn}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF7C3AED');

        foreach ($columns as $index => $column) {
            $coordinate = Coordinate::stringFromColumnIndex($index + 1).'4';
            $sheet->setCellValue($coordinate, $column['label']);
        }
        $sheet->getStyle("A4:{$lastColumn}4")->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle("A4:{$lastColumn}4")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF312E81');

        foreach ($report['rows'] as $rowIndex => $row) {
            $excelRow = $rowIndex + 5;
            foreach ($columns as $columnIndex => $column) {
                $cell = Coordinate::stringFromColumnIndex($columnIndex + 1).$excelRow;
                $value = $row[$column['key']] ?? '';
                if (in_array($column['format'], ['currency', 'quantity', 'integer'], true) && is_numeric($value)) {
                    $sheet->setCellValue($cell, (float) $value);
                    $sheet->getStyle($cell)->getNumberFormat()->setFormatCode(match ($column['format']) {
                        'currency' => '[$Rp-id-ID] #,##0.00',
                        'quantity' => '#,##0.000',
                        default => '0',
                    });
                } else {
                    $sheet->setCellValueExplicit($cell, (string) $value, DataType::TYPE_STRING);
                }
            }
        }

        $lastRow = max(count($report['rows']) + 4, 4);
        $sheet->setAutoFilter("A4:{$lastColumn}{$lastRow}");
        $sheet->freezePane('A5');
        $sheet->getStyle("A4:{$lastColumn}{$lastRow}")->getBorders()->getAllBorders()->setBorderStyle('thin')->getColor()->setARGB('FFD1D5DB');
        $sheet->getStyle("A4:{$lastColumn}{$lastRow}")->getAlignment()->setVertical(Alignment::VERTICAL_TOP)->setWrapText(true);
        foreach (range(1, count($columns)) as $index) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($index))->setAutoSize(true);
        }
        $sheet->setSelectedCell('A1');

        $filename = $report['type'].'-'.now()->format('Ymd-His').'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet): void {
            (new Xlsx($spreadsheet))->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $filename, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }
}
