import { Form, Head, Link } from '@inertiajs/react';
import {
    BarChart3,
    Calendar,
    CalendarRange,
    ChartNoAxesCombined,
    ChevronRight,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    Layers,
    Printer,
    Store,
    TrendingUp,
} from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Column = {
    key: string;
    label: string;
    format: 'text' | 'currency' | 'quantity' | 'integer';
    align: 'left' | 'right' | 'center';
};
type Report = {
    type: string;
    title: string;
    description: string;
    period: string;
    generated_at: string;
    is_snapshot: boolean;
    columns: Column[];
    rows: Record<string, string | number | null>[];
    context: Record<string, string>;
    summary: { label: string; value: string; format: string }[];
    signatures: Record<string, string>;
};
type Filters = {
    report: string;
    date_from: string;
    date_to: string;
    store_id: number | null;
    category_id: number | null;
    order_id: number | null;
};
type Props = {
    report: Report;
    reportTypes: {
        value: string;
        label: string;
        description: string;
        is_snapshot: boolean;
    }[];
    stores: { id: number; code: string; name: string }[];
    categories: { id: number; code: string; name: string }[];
    orders: { id: number; number: string; order_date: string }[];
    filters: Filters;
};

export default function ReportIndex({
    report,
    reportTypes,
    stores,
    categories,
    orders,
    filters,
}: Props) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '') query.set(key, String(value));
    });
    const exportQuery = query.toString();

    return (
        <>
            <Head title="Laporan & Rekapitulasi Purchasing" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Pusat Analisis & Audit"
                    title="Laporan & Rekapitulasi"
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button variant="outline" asChild>
                                <a
                                    href={`/central/reports/print?${exportQuery}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Printer className="size-4" /> Cetak Lembar
                                </a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={`/central/reports/pdf?${exportQuery}`}>
                                    <Download className="size-4" /> Unduh PDF
                                </a>
                            </Button>
                            <Button asChild className="gap-2 font-medium">
                                <a
                                    href={`/central/reports/excel?${exportQuery}`}
                                >
                                    <FileSpreadsheet className="size-4" /> Ekspor Excel
                                </a>
                            </Button>
                        </div>
                    }
                />

                {/* Report Type Selector Tabs */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {reportTypes.map((type) => {
                        const isSelected = type.value === report.type;
                        return (
                            <Link
                                key={type.value}
                                href={`/central/reports?report=${type.value}&date_from=${filters.date_from}&date_to=${filters.date_to}`}
                                className={`group flex flex-col justify-between rounded-xl border p-4 transition-all ${
                                    isSelected
                                        ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/25'
                                        : 'border-border/70 bg-card hover:border-border hover:bg-muted/20'
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div
                                            className={`flex size-8 items-center justify-center rounded-lg ${
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                            }`}
                                        >
                                            <ChartNoAxesCombined className="size-4" />
                                        </div>
                                        {type.is_snapshot && (
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                                                Snapshot
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">
                                            {type.label}
                                        </p>
                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                            {type.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Filter Control Parameters Card */}
                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="border-b border-border/50 pb-3.5">
                        <div className="flex items-center gap-2">
                            <Filter className="size-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-semibold">
                                Parameter & Filter Laporan
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 md:p-5">
                        <Form
                            action="/central/reports"
                            method="get"
                            className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"
                        >
                            <input type="hidden" name="report" value={filters.report} />

                            <Field label="Dari Tanggal">
                                <Input
                                    type="date"
                                    name="date_from"
                                    className="h-10"
                                    defaultValue={filters.date_from}
                                    disabled={report.is_snapshot}
                                />
                            </Field>

                            <Field label="Sampai Tanggal">
                                <Input
                                    type="date"
                                    name="date_to"
                                    className="h-10"
                                    defaultValue={filters.date_to}
                                    disabled={report.is_snapshot}
                                />
                            </Field>

                            <Field label="Toko / Butik">
                                <select
                                    name="store_id"
                                    defaultValue={filters.store_id ?? ''}
                                    className="form-select-custom h-10 w-full"
                                >
                                    <option value="">Semua Lokasi Toko</option>
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id}>
                                            {store.code} — {store.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Kategori Barang">
                                <select
                                    name="category_id"
                                    defaultValue={filters.category_id ?? ''}
                                    className="form-select-custom h-10 w-full"
                                >
                                    <option value="">Semua Kategori</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.code} — {category.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {filters.report === 'purchasing-request' && (
                                <Field
                                    label="Dokumen Pesanan"
                                    className="md:col-span-2 xl:col-span-2"
                                >
                                    <select
                                        name="order_id"
                                        defaultValue={filters.order_id ?? ''}
                                        className="form-select-custom h-10 w-full"
                                    >
                                        <option value="">
                                            Semua Pesanan dalam Periode
                                        </option>
                                        {orders.map((order) => (
                                            <option
                                                key={order.id}
                                                value={order.id}
                                            >
                                                {order.number} —{' '}
                                                {order.order_date.slice(0, 10)}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            )}

                            <div className="flex items-end gap-2 md:col-span-2 xl:col-span-2">
                                <Button className="h-10 flex-1 font-medium">
                                    Terapkan Filter
                                </Button>
                                <Button variant="outline" className="h-10" asChild>
                                    <Link href="/central/reports">Reset</Link>
                                </Button>
                            </div>
                        </Form>
                    </CardContent>
                </Card>

                {/* Main Report Document Table */}
                <Card className="overflow-hidden border-border/70 shadow-xs">
                    <CardHeader className="border-b border-border/60 bg-muted/20 p-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">
                                    {report.title}
                                </CardTitle>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {report.description}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-foreground">
                                <CalendarRange className="size-4 text-primary" />
                                Periode: {report.period}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {/* Context Pills */}
                        {Object.keys(report.context).length > 0 && (
                            <dl className="grid gap-px border-b border-border/60 bg-border/50 sm:grid-cols-2 lg:grid-cols-5">
                                {Object.entries(report.context).map(
                                    ([label, value]) => (
                                        <div
                                            key={label}
                                            className="bg-card p-3.5"
                                        >
                                            <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                {label}
                                            </dt>
                                            <dd className="mt-0.5 text-xs font-semibold text-foreground">
                                                {value}
                                            </dd>
                                        </div>
                                    ),
                                )}
                            </dl>
                        )}

                        {report.rows.length === 0 ? (
                            <div className="p-8">
                                <EmptyState
                                    icon={ChartNoAxesCombined}
                                    title="Tidak ada data ditemukan"
                                    description="Tidak ada catatan transaksi aktual sistem yang cocok dengan kriteria filter dan rentang tanggal di atas."
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-max text-left text-sm">
                                    <thead className="border-b border-border/60 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            {report.columns.map((column) => (
                                                <th
                                                    key={column.key}
                                                    className={`px-4 py-3.5 ${alignment(column.align)}`}
                                                >
                                                    {column.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {report.rows.map((row, rowIndex) => (
                                            <tr
                                                key={rowIndex}
                                                className="transition-colors hover:bg-muted/20"
                                            >
                                                {report.columns.map(
                                                    (column) => (
                                                        <td
                                                            key={column.key}
                                                            className={`max-w-72 px-4 py-3 align-top text-xs ${alignment(column.align)} ${
                                                                column.align ===
                                                                'right'
                                                                    ? 'font-mono tabular-nums'
                                                                    : ''
                                                            }`}
                                                        >
                                                            {formatCell(
                                                                row[column.key],
                                                                column.format,
                                                            )}
                                                        </td>
                                                    ),
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Summary Totals & Signatures */}
                        {(report.summary.length > 0 ||
                            Object.keys(report.signatures).length > 0) && (
                            <div className="grid gap-6 border-t border-border/60 bg-muted/10 p-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Ringkasan Total Akumulasi
                                    </p>
                                    {report.summary.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex max-w-md items-center justify-between gap-4 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-2xs"
                                        >
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {item.label}
                                            </span>
                                            <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                                                {formatCell(
                                                    item.value,
                                                    item.format,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {Object.keys(report.signatures).length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Otorisasi & Pengesahan
                                        </p>
                                        <div className="grid grid-cols-3 gap-2.5">
                                            {Object.entries(report.signatures).map(
                                                ([label, name]) => (
                                                    <div
                                                        key={label}
                                                        className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-3 text-center"
                                                    >
                                                        <p className="text-[11px] font-medium text-muted-foreground">
                                                            {label}
                                                        </p>
                                                        <div className="h-10" />
                                                        <p className="truncate text-xs font-semibold text-foreground border-t border-border/50 pt-1">
                                                            {name}
                                                        </p>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground">
                    Dokumen digenerate pada {report.generated_at} · Seluruh data bersumber dari catatan transaksi asli Tulola Purchasing System.
                </p>
            </main>
        </>
    );
}

function Field({
    label,
    className = '',
    children,
}: {
    label: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`space-y-1.5 ${className}`}>
            <Label className="text-xs font-semibold text-foreground">{label}</Label>
            {children}
        </div>
    );
}

function alignment(value: Column['align']): string {
    if (value === 'right') return 'text-right';
    if (value === 'center') return 'text-center';
    return 'text-left';
}

function formatCell(value: string | number | null | undefined, format: string) {
    if (value === null || value === undefined || value === '') return '—';
    if (format === 'currency' && !Number.isNaN(Number(value))) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
        }).format(Number(value));
    }
    if (format === 'quantity' && !Number.isNaN(Number(value))) {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        }).format(Number(value));
    }
    return String(value);
}

ReportIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Laporan', href: '/central/reports' },
    ],
};
