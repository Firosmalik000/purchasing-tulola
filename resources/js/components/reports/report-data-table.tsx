import { FileSpreadsheet } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import type { ReportColumn } from '@/types/report';
import {
    formatReportCell,
    getColumnAlignmentClass,
} from './report-utils';

type Props = {
    columns: ReportColumn[];
    rows: Record<string, string | number | null>[];
};

export function ReportDataTable({ columns, rows }: Props) {
    return (
        <Card className="overflow-hidden border-border/70 shadow-2xs">
            <CardContent className="p-0">
                {rows.length === 0 ? (
                    <div className="p-10">
                        <EmptyState
                            icon={FileSpreadsheet}
                            title="Tidak ada data untuk filter ini"
                            description="Tidak ditemukan catatan transaksi yang cocok dengan kriteria filter di atas. Coba ubah rentang tanggal atau pilih toko lain."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-left text-sm">
                            <thead className="border-b border-border/60 bg-muted/50 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column.key}
                                            className={`px-4 py-3.5 ${getColumnAlignmentClass(column.align)}`}
                                        >
                                            {column.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {rows.map((row, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className="transition-colors hover:bg-muted/25"
                                    >
                                        {columns.map((column) => (
                                            <td
                                                key={column.key}
                                                className={`max-w-72 px-4 py-3 align-middle text-xs ${getColumnAlignmentClass(column.align)} ${
                                                    column.align === 'right'
                                                        ? 'font-mono tabular-nums'
                                                        : ''
                                                }`}
                                            >
                                                {formatReportCell(
                                                    row[column.key],
                                                    column.format,
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
