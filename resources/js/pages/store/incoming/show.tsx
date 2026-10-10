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
import { formatQuantity } from '@/lib/utils';

type Store = { id: number; code: string; name: string };
type Line = {
    allocation_id: number;
    purchase_order_item_id: number;
    type: 'STOCK' | 'SPECIAL';
    name: string;
    sku: string | null;
    unit: { name: string; symbol: string };
    request_number: string;
    ordered_quantity: number;
    received_quantity: number;
    outstanding_quantity: number;
};
type ReceiptItemDetail = {
    id: number;
    name: string;
    sku: string | null;
    unit: string;
    received_quantity: number;
    ordered_quantity: number;
};
type Receipt = {
    id: number;
    number: string;
    received_at: string;
    notes: string | null;
    status: string;
    receiver: { name: string };
    is_partial: boolean;
    total_quantity: number;
    items: ReceiptItemDetail[];
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
    const isCancelled = purchaseOrder.status === 'CANCELLED';
    const isCompleted = purchaseOrder.status === 'COMPLETED';

    return (
        <>
            <Head title={`Order ${purchaseOrder.number}`} />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Order Toko"
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

                {!purchaseOrder.can_receive && (
                    <div
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                            isCancelled
                                ? 'border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                                : isCompleted
                                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                                  : 'border-blue-500/25 bg-blue-500/10 text-blue-800 dark:text-blue-200'
                        }`}
                    >
                        {isCancelled ? (
                            <AlertCircle className="size-4 shrink-0" />
                        ) : isCompleted ? (
                            <CheckCircle2 className="size-4 shrink-0" />
                        ) : (
                            <Clock className="size-4 shrink-0" />
                        )}
                        <p className="font-medium">
                            {isCancelled
                                ? 'Order ini dibatalkan oleh purchasing pusat.'
                                : isCompleted
                                  ? 'Seluruh barang pesanan ini telah diterima lengkap.'
                                  : 'Order sedang diproses pusat. Penerimaan dapat dikonfirmasi setelah barang dikirim.'}
                        </p>
                    </div>
                )}

                {/* Information Header Card */}
                <Card className="border-border/70 shadow-xs">
                    <CardContent className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Truck className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Pengiriman
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                    Purchasing Pusat
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Calendar className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Tanggal Order
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                    {purchaseOrder.order_date.slice(0, 10)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Clock className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Estimasi Tiba
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                    {purchaseOrder.expected_date?.slice(
                                        0,
                                        10,
                                    ) ?? '—'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Catatan Pusat
                                </p>
                                <p
                                    className="max-w-[200px] truncate text-sm font-semibold text-foreground"
                                    title={purchaseOrder.notes ?? undefined}
                                >
                                    {purchaseOrder.notes || '—'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Store Allocations Card */}
                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="border-b border-border/50 px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Package className="size-3.5" />
                            </div>
                            <CardTitle className="text-sm font-semibold">
                                Alokasi Barang Pesanan
                            </CardTitle>
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
                                            {line.sku ?? 'Non-SKU'} · Satuan:{' '}
                                            {line.unit.symbol}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[11px] text-muted-foreground">
                                            No. Permintaan
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
                                            {formatQuantity(
                                                line.ordered_quantity,
                                            )}{' '}
                                            {line.unit.symbol}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-center">
                                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                            Diterima
                                        </p>
                                        <p className="mt-0.5 font-mono text-sm font-bold text-emerald-700 tabular-nums dark:text-emerald-300">
                                            {formatQuantity(
                                                line.received_quantity,
                                            )}{' '}
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
                                            {isFulfilled ? 'Selesai' : 'Sisa'}
                                        </p>
                                        <p className="mt-0.5 font-mono text-sm font-bold tabular-nums">
                                            {formatQuantity(
                                                line.outstanding_quantity,
                                            )}{' '}
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
                        <CardHeader className="border-b border-border/50 px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <PackageCheck className="size-3.5" />
                                </div>
                                <CardTitle className="text-sm font-semibold">
                                    Konfirmasi Penerimaan Fisik
                                </CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            {allReceived ? (
                                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="size-5 shrink-0" />
                                    <p className="text-sm font-medium">
                                        Semua alokasi barang untuk pesanan ini
                                        telah diterima lengkap.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={submit} className="space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="received_at"
                                                className="text-xs font-semibold"
                                            >
                                                Waktu Diterima *
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
                                            {form.errors.received_at && (
                                                <p className="text-xs font-medium text-destructive">
                                                    {form.errors.received_at}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="notes"
                                                className="text-xs font-semibold"
                                            >
                                                Catatan (Opsional)
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
                                                placeholder="Catatan kondisi barang jika ada..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
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
                                                        {line.sku ?? 'Non-SKU'}{' '}
                                                        · Sisa:{' '}
                                                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                                            {formatQuantity(
                                                                line.outstanding_quantity,
                                                            )}{' '}
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
                                                            Jumlah Diterima
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
                                                                        String(
                                                                            Number(
                                                                                line.outstanding_quantity,
                                                                            ),
                                                                        ),
                                                                };
                                                                form.setData(
                                                                    'items',
                                                                    items,
                                                                );
                                                            }}
                                                        >
                                                            Terima Semua (
                                                            {formatQuantity(
                                                                line.outstanding_quantity,
                                                            )}
                                                            )
                                                        </Button>
                                                    </div>
                                                    <div className="relative">
                                                        <Input
                                                            id={`quantity-${line.allocation_id}`}
                                                            type="number"
                                                            min="1"
                                                            max={
                                                                line.outstanding_quantity
                                                            }
                                                            step="1"
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
                                                            placeholder="0"
                                                        />
                                                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                                                            {line.unit.symbol}
                                                        </span>
                                                    </div>
                                                    {(form.errors[
                                                        `items.${index}.received_quantity`
                                                    ] ||
                                                        form.errors[
                                                            `items.${line.allocation_id}.received_quantity`
                                                        ]) && (
                                                        <p className="text-xs font-medium text-destructive">
                                                            {form.errors[
                                                                `items.${index}.received_quantity`
                                                            ] ||
                                                                form.errors[
                                                                    `items.${line.allocation_id}.received_quantity`
                                                                ]}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {Object.keys(form.errors).length > 0 && (
                                        <div className="flex flex-col gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <AlertCircle className="size-4 shrink-0" />
                                                <span>
                                                    Gagal memproses konfirmasi
                                                    penerimaan:
                                                </span>
                                            </div>
                                            <ul className="list-disc space-y-0.5 pl-6">
                                                {Object.entries(
                                                    form.errors,
                                                ).map(([key, error]) => (
                                                    <li key={key}>{error}</li>
                                                ))}
                                            </ul>
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
                    <CardHeader className="border-b border-border/50 px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <HistoryIcon className="size-3.5" />
                            </div>
                            <CardTitle className="text-sm font-semibold">
                                Riwayat Tanda Terima (Goods Receipts)
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                        {purchaseOrder.receipts.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Belum ada tanda terima untuk pesanan ini.
                            </p>
                        ) : (
                            purchaseOrder.receipts.map((receipt) => (
                                <article
                                    key={receipt.id}
                                    className="space-y-3 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border"
                                >
                                    <div className="flex flex-col justify-between gap-2 border-b border-border/40 pb-3 sm:flex-row sm:items-center">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <p className="font-mono text-sm font-bold text-foreground">
                                                {receipt.number}
                                            </p>
                                            {receipt.is_partial ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                                    <Clock className="size-3" />
                                                    Penerimaan Sebagian
                                                    (Parsial)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                                    <CheckCircle2 className="size-3" />
                                                    Penerimaan Lengkap (Selesai)
                                                </span>
                                            )}
                                        </div>

                                        <time className="font-mono text-xs text-muted-foreground">
                                            {new Date(
                                                receipt.received_at,
                                            ).toLocaleString('id-ID', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}
                                        </time>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <p>
                                            Diverifikasi oleh:{' '}
                                            <span className="font-medium text-foreground">
                                                {receipt.receiver.name}
                                            </span>
                                            {receipt.notes ? (
                                                <span>
                                                    {' '}
                                                    · Catatan:{' '}
                                                    <em className="text-foreground">
                                                        "{receipt.notes}"
                                                    </em>
                                                </span>
                                            ) : null}
                                        </p>
                                        <p className="font-medium text-foreground">
                                            Total Diterima:{' '}
                                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatQuantity(
                                                    receipt.total_quantity,
                                                )}
                                            </span>{' '}
                                            unit
                                        </p>
                                    </div>
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
        { title: 'Order Toko', href: '/store/incoming' },
        { title: 'Detail', href: '#' },
    ],
};
