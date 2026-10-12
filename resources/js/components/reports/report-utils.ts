import type { ReportColumn } from '@/types/report';

export function formatReportCell(
    value: string | number | null | undefined,
    format: string,
): string {
    if (value === null || value === undefined || value === '') return '—';

    if (format === 'currency' && !Number.isNaN(Number(value))) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(Number(value));
    }

    if (format === 'quantity' && !Number.isNaN(Number(value))) {
        return new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 0,
        }).format(Number(value));
    }

    return String(value);
}

export function getColumnAlignmentClass(align: ReportColumn['align']): string {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
}
