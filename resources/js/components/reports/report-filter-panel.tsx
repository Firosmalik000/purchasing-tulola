import { Form, Link } from '@inertiajs/react';
import { CalendarRange, Filter, Info, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    CategoryOption,
    OrderOption,
    ReportData,
    ReportFilters,
    StoreOption,
} from '@/types/report';

type Props = {
    report: ReportData;
    filters: ReportFilters;
    stores: StoreOption[];
    categories: CategoryOption[];
    orders: OrderOption[];
};

export function ReportFilterPanel({
    report,
    filters,
    stores,
    categories,
    orders,
}: Props) {
    const hasActiveFilters = Boolean(
        filters.store_id ||
        filters.category_id ||
        filters.order_id ||
        (!report.is_snapshot &&
            (filters.date_from !== '' || filters.date_to !== '')),
    );

    return (
        <Card className="border-border/70 shadow-2xs">
            {/* Header Banner */}
            <div className="border-b border-border/60 bg-muted/20 p-4 md:p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-bold text-foreground">
                                {report.title}
                            </h2>
                            {report.is_snapshot ? (
                                <Badge
                                    variant="secondary"
                                    className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                >
                                    Real-time Snapshot
                                </Badge>
                            ) : (
                                <Badge variant="outline">Rentang Tanggal</Badge>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {report.description}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-foreground">
                        <CalendarRange className="size-4 text-primary" />
                        <span>Periode: {report.period}</span>
                    </div>
                </div>
            </div>

            {/* Filter Inputs Form */}
            <CardContent className="p-4 md:p-5">
                <Form
                    action="/central/reports"
                    method="get"
                    className="space-y-4"
                >
                    <input type="hidden" name="report" value={filters.report} />

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {report.is_snapshot ? (
                            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 sm:col-span-2">
                                <div className="flex items-start gap-2">
                                    <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                        Laporan Snapshot menampilkan posisi
                                        stok aktual saat ini. Filter rentang
                                        tanggal tidak diperlukan.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Dari Tanggal
                                    </Label>
                                    <Input
                                        type="date"
                                        name="date_from"
                                        className="h-9.5"
                                        defaultValue={filters.date_from}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Sampai Tanggal
                                    </Label>
                                    <Input
                                        type="date"
                                        name="date_to"
                                        className="h-9.5"
                                        defaultValue={filters.date_to}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-foreground">
                                Toko Cabang
                            </Label>
                            <select
                                name="store_id"
                                defaultValue={filters.store_id ?? ''}
                                className="form-select-custom h-9.5 w-full"
                            >
                                <option value="">Semua Lokasi Toko</option>
                                {stores.map((store) => (
                                    <option key={store.id} value={store.id}>
                                        {store.code} — {store.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-foreground">
                                Kategori Barang
                            </Label>
                            <select
                                name="category_id"
                                defaultValue={filters.category_id ?? ''}
                                className="form-select-custom h-9.5 w-full"
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
                        </div>
                    </div>

                    {/* Order Selection for Purchasing Request */}
                    {filters.report === 'purchasing-request' && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Pilih Dokumen Pesanan (PO Target)
                                </Label>
                                <select
                                    name="order_id"
                                    defaultValue={filters.order_id ?? ''}
                                    className="form-select-custom mt-1 h-9.5 w-full bg-card"
                                >
                                    <option value="">
                                        Pesanan Terakhir dalam Periode
                                        (Otomatis)
                                    </option>
                                    {orders.map((order) => (
                                        <option key={order.id} value={order.id}>
                                            {order.number} —{' '}
                                            {order.order_date.slice(0, 10)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Filter Actions Footer */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                        <span className="text-xs text-muted-foreground">
                            Ditemukan:{' '}
                            <strong className="text-foreground">
                                {report.rows.length}
                            </strong>{' '}
                            baris data
                        </span>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 gap-1 text-xs"
                                    asChild
                                >
                                    <Link
                                        href={`/central/reports?report=${filters.report}`}
                                    >
                                        <RotateCcw className="size-3.5" /> Reset
                                        Filter
                                    </Link>
                                </Button>
                            )}
                            <Button
                                size="sm"
                                className="h-9 gap-1.5 px-4 font-medium"
                            >
                                <Filter className="size-3.5" /> Terapkan Filter
                            </Button>
                        </div>
                    </div>
                </Form>
            </CardContent>
        </Card>
    );
}
