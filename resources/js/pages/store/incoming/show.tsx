import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    History as HistoryIcon,
    Package,
    PackageCheck,
    Truck,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Store = { id: number; code: string; name: string };
type Line = {
    allocation_id: number;
    purchase_order_item_id: number;
    type: 'STOCK' | 'SPECIAL';
    name: string;
    sku: string | null;
    unit: { name: string; symbol: string };
    request_number: string;
    ordered_quantity: string;
    received_quantity: string;
    outstanding_quantity: string;
};
type Receipt = {
    id: number;
    number: string;
    received_at: string;
    notes: string | null;
    status: string;
    receiver: { name: string };
    items: { id: number; received_quantity: string }[];
};
type Order = {
    id: number;
    number: string;
    order_date: string;
    expected_date: string | null;
    status: string;
    notes: string | null;
    lines: Line[];
    can_receive: boolean;
    receipts: Receipt[];
};

function localDateTime() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
}

export default function IncomingShow({
    purchaseOrder,
    store,
}: {
    purchaseOrder: Order;
    store: Store;
}) {
    const receivableLines = purchaseOrder.lines.filter(
        (line) => Number(line.outstanding_quantity) > 0,
    );
    const form = useForm({
        store_id: store.id,
        received_at: localDateTime(),
        notes: '',
        items: receivableLines.map((line) => ({
            allocation_id: line.allocation_id,
            received_quantity: '',
        })),
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            items: data.items.filter(
                (item) => Number(item.received_quantity) > 0,
            ),
        }));
        form.post(`/store/incoming/${purchaseOrder.id}/receipts`, {
            preserveScroll: true,
            preserveState: false,
        });
    }

    const allReceived = receivableLines.length === 0;

    return (
        <>
            <Head title={`Penerimaan ${purchaseOrder.number}`} />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Penerimaan"
                    title={purchaseOrder.number}
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            <OrderStatusBadge status={purchaseOrder.status} />
                            <Button variant="outline" asChild>
                                <Link
                                    href={`/store/incoming?store_id=${store.id}`}
                                >
                                    <ArrowLeft className="size-4" /> Kembali
                                </Link>
                            </Button>
                        </div>
                    }
                />

                {/* Information Header Card */}
                <Card className="border-border/70 shadow-xs">
                    <CardContent className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Truck className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Sumber Pengiriman
                                </p>
                                <p className="mt-0.5 font-medium text-foreground">
                                    Internal / Purchasing Pusat
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Calendar className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Tanggal Order
                                </p>
                                <p className="mt-0.5 font-medium text-foreground">
                                    {purchaseOrder.order_date.slice(0, 10)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Clock className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Estimasi Tiba
                                </p>
                                <p className="mt-0.5 font-medium text-foreground">
                                    {purchaseOrder.expected_date?.slice(
                                        0,
                                        10,
                                    ) ?? '—'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Instruksi / Catatan Pusat
                                </p>
                                <p className="mt-0.5 font-medium text-foreground">
                                    {purchaseOrder.notes || '—'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Store Allocations Card */}
                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Package className="size-4" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Daftar Alokasi Barang untuk Toko
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Rincian barang yang dialokasikan, total yang
                                    telah diterima sebelumnya, dan sisa
                                    outstanding
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                        {purchaseOrder.lines.map((line) => {
                            const isFulfilled =
                                Number(line.outstanding_quantity) <= 0;
                            return (
                                <article
                                    key={line.allocation_id}
                                    className="grid gap-3.5 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border md:grid-cols-2 xl:grid-cols-[2fr_1.2fr_repeat(3,1fr)] xl:items-center"
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-foreground">
                                                {line.name}
                                            </p>
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                                                {line.type === 'STOCK'
                                                    ? 'Stok'
                                                    : 'Khusus'}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                            {line.sku ?? 'Custom / Non-SKU'} ·
                                            Satuan: {line.unit.symbol}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Asal Permintaan (PR)
                                        </p>
                                        <p className="mt-0.5 font-mono text-xs font-semibold text-primary">
                                            {line.request_number}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-muted/40 p-2 text-center">
                                        <p className="text-[11px] text-muted-foreground">
                                            Dialokasikan
                                        </p>
                                        <p className="mt-0.5 font-mono text-sm font-medium tabular-nums">
                                            {line.ordered_quantity}{' '}
                                            {line.unit.symbol}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-center">
                                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                            Sudah Diterima
                                        </p>
                                        <p className="mt-0.5 font-mono text-sm font-bold text-emerald-700 tabular-nums dark:text-emerald-300">
                                            {line.received_quantity}{' '}
                                            {line.unit.symbol}
                                        </p>
                                    </div>

                                    <div
                                        className={`rounded-lg border p-2 text-center ${
                                            isFulfilled
                                                ? 'border-border/60 bg-muted/20 text-muted-foreground'
                                                : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                        }`}
                                    >
                                        <p className="text-[11px] font-semibold">
                                            {isFulfilled
                                                ? 'Selesai'
                                                : 'Outstanding Sisa'}
                                        </p>
                                        <p className="mt-0.5 font-mono text-sm font-bold tabular-nums">
                                            {line.outstanding_quantity}{' '}
                                            {line.unit.symbol}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Receiving Confirmation Form */}
                {purchaseOrder.can_receive && (
                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <PackageCheck className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">
                                        Form Konfirmasi Penerimaan Fisik
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        Input jumlah fisik yang benar-benar
                                        diperiksa dan diterima di toko saat ini
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            {allReceived ? (
                                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="size-5 shrink-0" />
                                    <p className="text-sm font-medium">
                                        Semua alokasi barang untuk pesanan ini
                                        telah diterima lengkap (outstanding 0).
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={submit} className="space-y-6">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="received_at"
                                                className="text-xs font-semibold"
                                            >
                                                Waktu Fisik Diterima *
                                            </Label>
                                            <Input
                                                id="received_at"
                                                type="datetime-local"
                                                className="h-10"
                                                value={form.data.received_at}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'received_at',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="notes"
                                                className="text-xs font-semibold"
                                            >
                                                Catatan Kondisi Barang
                                                (Opsional)
                                            </Label>
                                            <Input
                                                id="notes"
                                                className="h-10"
                                                value={form.data.notes}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'notes',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: Paket diterima utuh dan tersegel rapi"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Daftar Barang yang Siap Diterima
                                        </Label>
                                        {receivableLines.map((line, index) => (
                                            <div
                                                key={line.allocation_id}
                                                className="grid gap-4 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border sm:grid-cols-[minmax(0,1.8fr)_minmax(12rem,0.6fr)] sm:items-center"
                                            >
                                                <div>
                                                    <p className="font-semibold text-foreground">
                                                        {line.name}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {line.sku ?? 'Custom'} ·
                                                        Sisa belum diterima:{' '}
                                                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                                            {
                                                                line.outstanding_quantity
                                                            }{' '}
                                                            {line.unit.symbol}
                                                        </span>
                                                    </p>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <Label
                                                            htmlFor={`quantity-${line.allocation_id}`}
                                                            className="text-xs font-medium"
                                                        >
                                                            Kuantitas Diterima
                                                        </Label>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 px-1.5 text-[10px] text-primary hover:bg-primary/10"
                                                            onClick={() => {
                                                                const items = [
                                                                    ...form.data
                                                                        .items,
                                                                ];
                                                                items[index] = {
                                                                    ...items[
                                                                        index
                                                                    ],
                                                                    received_quantity:
                                                                        line.outstanding_quantity,
                                                                };
                                                                form.setData(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                        >
                                                            Terima Semua (
                                                            {
                                                                line.outstanding_quantity
                                                            }
                                                            )
                                                        </Button>
                                                    </div>
                                                    <div className="relative">
                                                        <Input
                                                            id={`quantity-${line.allocation_id}`}
                                                            type="number"
                                                            min="0"
                                                            max={
                                                                line.outstanding_quantity
                                                            }
                                                            step="0.001"
                                                            className="h-10 pr-12 text-right font-medium tabular-nums"
                                                            value={
                                                                form.data.items[
                                                                    index
                                                                ]
                                                                    ?.received_quantity ??
                                                                ''
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                const items = [
                                                                    ...form.data
                                                                        .items,
                                                                ];
                                                                items[index] = {
                                                                    ...items[
                                                                        index
                                                                    ],
                                                                    received_quantity:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                };
                                                                form.setData(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                            placeholder="0.000"
                                                        />
                                                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                                                            {line.unit.symbol}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {Object.keys(form.errors).length > 0 && (
                                        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                                            <AlertCircle className="size-4 shrink-0" />
                                            <span>
                                                Periksa jumlah penerimaan. Nilai
                                                harus lebih dari 0 dan tidak
                                                boleh melebihi sisa outstanding.
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            disabled={form.processing}
                                            className="gap-2 bg-emerald-600 font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                                        >
                                            <PackageCheck className="size-4" />
                                            {form.processing
                                                ? 'Menyimpan...'
                                                : 'Konfirmasi Terima'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Receiving Receipts History */}
                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <HistoryIcon className="size-4" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Riwayat Tanda Terima Toko (Goods Receipts)
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Bukti penerimaan fisik yang telah dibuat dan
                                    diverifikasi oleh staf toko
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                        {purchaseOrder.receipts.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Belum ada bukti tanda terima yang dikonfirmasi
                                untuk pesanan ini.
                            </p>
                        ) : (
                            purchaseOrder.receipts.map((receipt) => (
                                <article
                                    key={receipt.id}
                                    className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border sm:flex-row sm:items-center"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-sm font-bold text-foreground">
                                                {receipt.number}
                                            </p>
                                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                                Diterima
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Diverifikasi oleh:{' '}
                                            <span className="font-medium text-foreground">
                                                {receipt.receiver.name}
                                            </span>{' '}
                                            · {receipt.items.length} item
                                            diterima
                                            {receipt.notes
                                                ? ` · Catatan: "${receipt.notes}"`
                                                : ''}
                                        </p>
                                    </div>

                                    <time className="font-mono text-xs text-muted-foreground">
                                        {new Date(
                                            receipt.received_at,
                                        ).toLocaleString('id-ID', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        })}
                                    </time>
                                </article>
                            ))
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

IncomingShow.layout = {
    breadcrumbs: [
        { title: 'Portal Toko', href: '/store/dashboard' },
        { title: 'Barang Masuk', href: '/store/incoming' },
        { title: 'Detail', href: '#' },
    ],
};
