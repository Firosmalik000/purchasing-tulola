import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Pencil,
    Printer,
    Store,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import {
    WorkflowStepper,
    getPurchaseOrderSteps,
} from '@/components/common/workflow-stepper';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatQuantity } from '@/lib/utils';

type Allocation = {
    id: number;
    allocated_quantity: number;
    purchase_request_item: {
        purchase_request: {
            id?: number;
            number: string;
            store: { code: string; name: string };
        };
    };
};

type OrderItem = {
    id: number;
    item_type: 'STOCK' | 'SPECIAL';
    item: { sku: string; name: string } | null;
    name: string | null;
    unit: { symbol: string; name?: string };
    quantity: number;
    allocations: Allocation[];
};

type ReceiptItem = {
    id: number;
    received_quantity: number;
};

type Receipt = {
    id: number;
    number: string;
    received_at: string;
    notes: string | null;
    status: string;
    store?: { code: string; name: string } | null;
    receiver?: { id: number; name: string } | null;
    items?: ReceiptItem[];
};

type Order = {
    id: number;
    number: string;
    status: string;
    order_date: string;
    expected_date: string | null;
    notes: string | null;
    creator?: { id: number; name: string } | null;
    purchase_request?: {
        id: number;
        number: string;
        store: { code: string; name: string };
    } | null;
    items: OrderItem[];
    receipts?: Receipt[];
};

type Props = {
    purchaseOrder: Order;
    canUpdate: boolean;
    canPlace: boolean;
    canCancel: boolean;
};

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

export default function OrderShow({
    purchaseOrder,
    canUpdate,
    canPlace,
    canCancel,
}: Props) {
    const [editOpen, setEditOpen] = useState(false);
    const [placeOpen, setPlaceOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    const editForm = useForm({
        expected_date: purchaseOrder.expected_date
            ? purchaseOrder.expected_date.slice(0, 10)
            : '',
        notes: purchaseOrder.notes ?? '',
    });

    const placeForm = useForm({});
    const cancelForm = useForm({});

    function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        editForm.put(`/central/orders/${purchaseOrder.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditOpen(false),
        });
    }

    function handlePlaceSubmit(e: React.FormEvent) {
        e.preventDefault();
        placeForm.post(`/central/orders/${purchaseOrder.id}/place`, {
            preserveScroll: true,
            onSuccess: () => setPlaceOpen(false),
        });
    }

    function handleCancelSubmit(e: React.FormEvent) {
        e.preventDefault();
        cancelForm.post(`/central/orders/${purchaseOrder.id}/cancel`, {
            preserveScroll: true,
            onSuccess: () => setCancelOpen(false),
        });
    }

    const totalItemsCount = purchaseOrder.items.length;
    const totalQuantityCount = purchaseOrder.items.reduce(
        (acc, item) => acc + Number(item.quantity || 0),
        0,
    );

    const targetStore =
        purchaseOrder.purchase_request?.store ??
        purchaseOrder.items[0]?.allocations[0]?.purchase_request_item
            ?.purchase_request?.store ??
        null;

    return (
        <>
            <Head title={`Order ${purchaseOrder.number} — Tulola Purchasing`} />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">
                {/* Header Section */}
                <div className="flex flex-col gap-4 border-b border-border/60 pb-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 gap-1.5 px-2.5 text-xs print:hidden"
                        >
                            <Link href="/central/orders">
                                <ArrowLeft className="size-3.5" />
                                <span>Daftar Order</span>
                            </Link>
                        </Button>

                        <h1 className="font-serif text-xl font-bold tracking-tight text-foreground">
                            {purchaseOrder.number}
                        </h1>

                        <OrderStatusBadge status={purchaseOrder.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 print:hidden">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <Printer className="size-3.5" />
                            Cetak
                        </Button>

                        {canUpdate && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditOpen(true)}
                                className="h-8 gap-1.5 text-xs"
                            >
                                <Pencil className="size-3.5" />
                                Ubah Catatan & Target
                            </Button>
                        )}

                        {canCancel && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCancelOpen(true)}
                                className="h-8 gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Ban className="size-3.5" />
                                Batalkan Order
                            </Button>
                        )}

                        {canPlace && (
                            <Button
                                size="sm"
                                onClick={() => setPlaceOpen(true)}
                                className="h-8 gap-1.5 text-xs font-medium shadow-xs"
                            >
                                <Truck className="size-3.5" />
                                Kirim Order ke Toko
                            </Button>
                        )}
                    </div>
                </div>

                {/* Workflow Stepper */}
                <div className="print:hidden">
                    <WorkflowStepper
                        steps={getPurchaseOrderSteps(purchaseOrder.status)}
                    />
                </div>

                {/* Summary Metadata Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-border/70 shadow-xs">
                        <CardContent className="flex items-start gap-3.5 p-4">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Store className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Toko Tujuan
                                </p>
                                <p className="truncate font-serif text-sm font-bold text-foreground">
                                    {targetStore
                                        ? `${targetStore.code} — ${targetStore.name}`
                                        : 'Internal / Pusat'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-xs">
                        <CardContent className="flex items-start gap-3.5 p-4">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <FileText className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Sumber Permintaan (PR)
                                </p>
                                {purchaseOrder.purchase_request ? (
                                    <Link
                                        href={`/central/requests/${purchaseOrder.purchase_request.id}`}
                                        className="inline-block truncate font-mono text-sm font-semibold text-primary underline-offset-4 hover:underline"
                                    >
                                        {purchaseOrder.purchase_request.number}
                                    </Link>
                                ) : (
                                    <p className="truncate font-mono text-sm font-semibold text-foreground">
                                        Data Terakumulasi
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-xs">
                        <CardContent className="flex items-start gap-3.5 p-4">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Calendar className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Tanggal Order
                                </p>
                                <p className="font-serif text-sm font-bold text-foreground">
                                    {formatDate(purchaseOrder.order_date)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-xs">
                        <CardContent className="flex items-start gap-3.5 p-4">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Clock className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Target Tiba di Toko
                                </p>
                                <p className="font-serif text-sm font-bold text-foreground">
                                    {purchaseOrder.expected_date
                                        ? formatDate(purchaseOrder.expected_date)
                                        : '—'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Catatan Internal Card */}
                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 px-5 py-3">
                        <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            <FileText className="size-4 text-primary" />
                            Catatan Internal
                        </CardTitle>
                        {canUpdate && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditOpen(true)}
                                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground print:hidden"
                            >
                                <Pencil className="size-3" />
                                {purchaseOrder.notes ? 'Ubah' : 'Tambah Catatan'}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-4">
                        {purchaseOrder.notes ? (
                            <p className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm leading-relaxed text-foreground whitespace-pre-line">
                                {purchaseOrder.notes}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                Tidak ada catatan.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Line Items Card */}
                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-3.5">
                        <CardTitle className="font-serif text-base font-bold text-foreground">
                            Rincian Item & Alokasi Toko
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Badge variant="outline" className="font-mono text-xs">
                                {totalItemsCount} Item
                            </Badge>
                            <Badge variant="secondary" className="font-mono text-xs">
                                Total: {formatQuantity(totalQuantityCount)} Unit
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        <th className="w-12 px-4 py-3 text-center">#</th>
                                        <th className="px-4 py-3">Barang</th>
                                        <th className="px-4 py-3">Tipe</th>
                                        <th className="px-4 py-3">Alokasi Permintaan</th>
                                        <th className="px-4 py-3 text-right">Kuantitas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {purchaseOrder.items.map((item, index) => {
                                        const itemName =
                                            item.item_type === 'STOCK'
                                                ? item.item?.name
                                                : item.name;
                                        const sku = item.item?.sku;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="transition-colors hover:bg-muted/20"
                                            >
                                                <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-serif font-bold text-foreground">
                                                        {itemName ?? 'Item Tanpa Nama'}
                                                    </p>
                                                    {sku && (
                                                        <p className="font-mono text-xs text-muted-foreground">
                                                            SKU: {sku}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.item_type === 'STOCK' ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-700 dark:text-amber-400"
                                                        >
                                                            Stok Reguler
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-purple-500/30 bg-purple-500/5 text-[11px] text-purple-700 dark:text-purple-400"
                                                        >
                                                            Permintaan Khusus
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.allocations.length > 0 ? (
                                                            item.allocations.map(
                                                                (allocation) => (
                                                                    <span
                                                                        key={allocation.id}
                                                                        className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-2 py-0.5 font-mono text-xs shadow-2xs"
                                                                    >
                                                                        <Store className="size-3 text-muted-foreground" />
                                                                        <span className="font-semibold text-foreground">
                                                                            {
                                                                                allocation
                                                                                    .purchase_request_item
                                                                                    .purchase_request
                                                                                    .store.code
                                                                            }
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            (
                                                                            {
                                                                                allocation
                                                                                    .purchase_request_item
                                                                                    .purchase_request
                                                                                    .number
                                                                            }
                                                                            )
                                                                        </span>
                                                                        <strong className="text-primary">
                                                                            {formatQuantity(
                                                                                allocation.allocated_quantity,
                                                                            )}
                                                                        </strong>
                                                                    </span>
                                                                ),
                                                            )
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                —
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-mono text-sm font-bold text-foreground">
                                                        {formatQuantity(item.quantity)}{' '}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.unit.symbol}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-border/80 bg-muted/30 font-medium">
                                        <td
                                            colSpan={4}
                                            className="px-4 py-3 text-right text-xs tracking-wider text-muted-foreground uppercase"
                                        >
                                            Total:
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="font-mono text-base font-bold text-foreground">
                                                {formatQuantity(totalQuantityCount)}
                                            </span>
                                            <span className="ml-1 text-xs text-muted-foreground">
                                                Unit
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Riwayat Penerimaan Barang di Toko */}
                {purchaseOrder.receipts && purchaseOrder.receipts.length > 0 && (
                    <Card className="border border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/60 px-5 py-3.5">
                            <CardTitle className="font-serif text-base font-bold text-foreground">
                                Riwayat Penerimaan di Toko
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y divide-border/50 p-0">
                            {purchaseOrder.receipts.map((receipt) => {
                                const totalUnits = (receipt.items ?? []).reduce(
                                    (sum, item) => sum + Number(item.received_quantity),
                                    0,
                                );
                                return (
                                    <div
                                        key={receipt.id}
                                        className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-xs font-semibold text-foreground">
                                                    {receipt.number}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="border-emerald-500/30 bg-emerald-500/5 text-[10px] text-emerald-700 dark:text-emerald-300"
                                                >
                                                    Diterima
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Diverifikasi oleh:{' '}
                                                <strong className="text-foreground">
                                                    {receipt.receiver?.name ?? 'Staf Toko'}
                                                </strong>
                                                {receipt.store ? ` (${receipt.store.name})` : ''}{' '}
                                                · {formatDateTime(receipt.received_at)}
                                                {receipt.notes && (
                                                    <span>
                                                        {' '}
                                                        · Catatan:{' '}
                                                        <em className="text-foreground">
                                                            "{receipt.notes}"
                                                        </em>
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs">
                                            <span className="text-muted-foreground">
                                                Total Diterima:{' '}
                                            </span>
                                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatQuantity(totalUnits)}
                                            </span>{' '}
                                            <span className="text-muted-foreground">
                                                unit
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* Dialog: Edit Catatan & Target Kedatangan */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-serif">
                                Ubah Catatan & Target Kedatangan
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="expected_date" className="text-xs">
                                    Target Diterima Toko
                                </Label>
                                <Input
                                    id="expected_date"
                                    type="date"
                                    value={editForm.data.expected_date}
                                    onChange={(e) =>
                                        editForm.setData('expected_date', e.target.value)
                                    }
                                    className="h-9 text-xs"
                                />
                                <InputError message={editForm.errors.expected_date} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-xs">
                                    Catatan Internal
                                </Label>
                                <textarea
                                    id="notes"
                                    rows={4}
                                    value={editForm.data.notes}
                                    onChange={(e) =>
                                        editForm.setData('notes', e.target.value)
                                    }
                                    className="w-full rounded-md border border-input bg-card p-3 text-xs leading-relaxed text-foreground shadow-2xs transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                />
                                <InputError message={editForm.errors.notes} />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={editForm.processing}
                                >
                                    Simpan Perubahan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Konfirmasi Kirim Order ke Toko */}
                <Dialog open={placeOpen} onOpenChange={setPlaceOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 font-serif text-base font-bold text-foreground">
                                <Truck className="size-5 text-primary" />
                                Kirim Order ke Toko?
                            </DialogTitle>
                        </DialogHeader>

                        <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs space-y-1 text-muted-foreground">
                            <p>
                                Order <strong className="text-foreground">{purchaseOrder.number}</strong> akan dikirim ke cabang <strong className="text-foreground">{targetStore?.name ?? 'Toko'}</strong> ({totalItemsCount} item, {formatQuantity(totalQuantityCount)} unit).
                            </p>
                        </div>

                        <form onSubmit={handlePlaceSubmit}>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPlaceOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={placeForm.processing}
                                    className="shadow-xs"
                                >
                                    <CheckCircle2 className="mr-1.5 size-4" />
                                    Ya, Kirim Sekarang
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Konfirmasi Batalkan Order */}
                <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 font-serif text-base font-bold text-destructive">
                                <Ban className="size-5" />
                                Batalkan Order Internal?
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleCancelSubmit}>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCancelOpen(false)}
                                >
                                    Kembali
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    size="sm"
                                    disabled={cancelForm.processing}
                                >
                                    Ya, Batalkan Order
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </main>
        </>
    );
}

OrderShow.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Order Internal', href: '/central/orders' },
        { title: 'Detail Order', href: '#' },
    ],
};
