import { Form, Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    FileSpreadsheet,
    History,
    MoreHorizontal,
    PackageCheck,
    Search,
    SlidersHorizontal,
    Sparkles,
    Store as StoreIcon,
    Warehouse,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Store = { id: number; code: string; name: string };
type Item = {
    id: number;
    sku: string;
    name: string;
    unit: { symbol: string };
    stocks: { quantity: string }[];
    stock_standards: { standard_quantity: string }[];
};
type Movement = {
    id: number;
    previous_quantity: string;
    new_quantity: string;
    quantity_difference: string;
    reason: string;
    item: { sku: string; name: string };
    creator: { name: string } | null;
};
type PendingReceipt = {
    id: number;
    number: string;
    received_at: string;
    notes: string | null;
    purchase_order: {
        id: number;
        number: string;
        supplier: { code: string; name: string } | null;
    };
    receiver: { name: string };
    stock_lines: {
        item_id: number;
        sku: string;
        name: string;
        unit: string;
        current_quantity: string;
        received_quantity: string;
        proposed_quantity: string;
    }[];
    special_lines: {
        name: string;
        unit: string;
        received_quantity: string;
    }[];
};
type Props = {
    stores: Store[];
    selectedStoreId: number | null;
    items: {
        data: Item[];
        links: PaginationLink[];
        current_page?: number;
        per_page?: number;
    };
    movements: Movement[];
    pendingReceipts: PendingReceipt[];
    movementTypes: { value: string; label: string }[];
    filters: { search: string };
};

export default function InventoryIndex({
    stores,
    selectedStoreId,
    items,
    movements,
    pendingReceipts,
    movementTypes,
    filters,
}: Props) {
    const activeStore = stores.find((s) => s.id === selectedStoreId);
    const currentPage = items.current_page || 1;
    const perPage = items.per_page || 15;

    const [stockModalItem, setStockModalItem] = useState<Item | null>(null);
    const [standardModalItem, setStandardModalItem] = useState<Item | null>(null);

    return (
        <>
            <Head title="Manajemen Inventaris Stok" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Inventaris & Logistik Pusat"
                    title="Manajemen Stok Butik"
                />

                {/* Store Selector & Compact Search Filter */}
                <Card className="border-border/70 shadow-xs">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                                <StoreIcon className="size-4 shrink-0 text-muted-foreground" />
                                <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                                    Lokasi Butik:
                                </span>
                                <select
                                    className="form-select-custom h-9 min-w-56"
                                    value={selectedStoreId ?? ''}
                                    onChange={(event) =>
                                        router.get(
                                            '/central/inventory',
                                            { store_id: event.target.value },
                                            {
                                                preserveState: true,
                                                replace: true,
                                            },
                                        )
                                    }
                                    aria-label="Pilih toko"
                                >
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id}>
                                            {store.code} — {store.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Form
                                action="/central/inventory"
                                method="get"
                                className="flex flex-1 items-center gap-2 md:max-w-md"
                            >
                                <input
                                    type="hidden"
                                    name="store_id"
                                    value={selectedStoreId ?? ''}
                                />
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        name="search"
                                        defaultValue={filters.search}
                                        placeholder="Cari SKU atau nama barang..."
                                        className="h-9 pl-9 text-xs"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 font-medium"
                                >
                                    Cari
                                </Button>
                            </Form>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Receipts Alert Section */}
                {pendingReceipts.length > 0 && (
                    <section
                        className="space-y-4"
                        aria-labelledby="pending-receipts-title"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <PackageCheck className="size-4" />
                            </div>
                            <div>
                                <h2
                                    id="pending-receipts-title"
                                    className="text-sm font-semibold text-foreground"
                                >
                                    Penerimaan Menunggu Update Stok ({pendingReceipts.length} Bukti Terima)
                                </h2>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {pendingReceipts.map((receipt) => (
                                <Card
                                    key={receipt.id}
                                    className="border-amber-500/30 bg-amber-500/[0.02] shadow-xs"
                                >
                                    <CardHeader className="border-b border-border/50 py-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="font-mono text-sm font-bold text-foreground">
                                                    {receipt.number}
                                                </CardTitle>
                                                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                                    Menunggu Verifikasi Pusat
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                PO:{' '}
                                                <span className="font-mono font-medium text-foreground">
                                                    {receipt.purchase_order.number}
                                                </span>{' '}
                                                · Supplier:{' '}
                                                <span className="font-medium text-foreground">
                                                    {receipt.purchase_order.supplier?.name ?? 'Internal'}
                                                </span>{' '}
                                                · Oleh:{' '}
                                                <span className="font-medium text-foreground">
                                                    {receipt.receiver.name}
                                                </span>
                                            </p>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3 p-4">
                                        <div className="space-y-2">
                                            {receipt.stock_lines.map((line) => (
                                                <div
                                                    key={line.item_id}
                                                    className="grid gap-2 rounded-lg border border-border/70 bg-card p-2.5 text-xs md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(6rem,1fr))] md:items-center"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-foreground">
                                                            {line.name}
                                                        </p>
                                                        <p className="font-mono text-[11px] text-muted-foreground">
                                                            {line.sku} · {line.unit}
                                                        </p>
                                                    </div>
                                                    <StockProposal
                                                        label="Stok Saat Ini"
                                                        value={line.current_quantity}
                                                    />
                                                    <StockProposal
                                                        label="Fisik Diterima"
                                                        value={`+${line.received_quantity}`}
                                                        accent="positive"
                                                    />
                                                    <StockProposal
                                                        label="Usulan Baru"
                                                        value={line.proposed_quantity}
                                                        accent="proposed"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {receipt.special_lines.length > 0 && (
                                            <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-2.5">
                                                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                                    <Sparkles className="size-3 text-sky-500" />
                                                    Item Khusus (Non-Katalog)
                                                </p>
                                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                    {receipt.special_lines.map((line, index) => (
                                                        <Badge
                                                            key={`${line.name}-${index}`}
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {line.name}: {line.received_quantity} {line.unit}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <Form
                                            action={`/central/inventory/receipts/${receipt.id}/apply`}
                                            method="post"
                                            options={{ preserveScroll: true }}
                                            className="grid gap-2 pt-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                                        >
                                            <Input
                                                name="notes"
                                                className="h-9 text-xs"
                                                placeholder="Catatan persetujuan pembukuan pusat (opsional)"
                                                aria-label={`Catatan penerapan stok ${receipt.number}`}
                                            />
                                            <Button
                                                type="submit"
                                                size="sm"
                                                className="h-9 gap-1.5 bg-emerald-600 font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                                            >
                                                <CheckCircle2 className="size-3.5" />
                                                Setujui & Terapkan ke Stok
                                            </Button>
                                        </Form>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Stock Position Table */}
                {stores.length === 0 ? (
                    <Card className="border-border/70">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Belum ada master toko terdaftar. Buat toko terlebih dahulu untuk mengelola stok.
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 py-3.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Warehouse className="size-3.5" />
                                    </div>
                                    <CardTitle className="text-sm font-semibold">
                                        Posisi Stok Butik ({activeStore?.name ?? 'Pilih Toko'})
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th className="w-12 px-3 py-3 text-center">#</th>
                                            <th className="px-4 py-3">Barang & SKU</th>
                                            <th className="px-3 py-3 text-center">Satuan</th>
                                            <th className="px-4 py-3 text-right">Saldo Stok</th>
                                            <th className="px-4 py-3 text-right">Standar Min</th>
                                            <th className="px-3 py-3 text-center">Status</th>
                                            <th className="w-16 px-3 py-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {items.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                    Tidak ada data barang yang cocok.
                                                </td>
                                            </tr>
                                        ) : (
                                            items.data.map((item, index) => {
                                                const current = item.stocks[0]?.quantity ?? '0.000';
                                                const standard = item.stock_standards[0]?.standard_quantity ?? '0.000';
                                                const isCritical = Number(current) < Number(standard);
                                                const rowNumber = (currentPage - 1) * perPage + index + 1;

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className="transition-colors hover:bg-muted/20"
                                                    >
                                                        <td className="px-3 py-3 text-center font-mono text-muted-foreground">
                                                            {rowNumber}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="font-semibold text-foreground">
                                                                {item.name}
                                                            </p>
                                                            <p className="font-mono text-[11px] text-muted-foreground">
                                                                {item.sku}
                                                            </p>
                                                        </td>
                                                        <td className="px-3 py-3 text-center font-mono text-muted-foreground">
                                                            {item.unit.symbol}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-foreground">
                                                            {current}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                                                            {standard}
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            {isCritical ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                                                    <AlertCircle className="size-3" />
                                                                    Di Bawah Min
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                    Aman
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-7"
                                                                    >
                                                                        <MoreHorizontal className="size-3.5" />
                                                                        <span className="sr-only">Aksi</span>
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48">
                                                                    <DropdownMenuLabel className="text-xs">
                                                                        Aksi Inventaris
                                                                    </DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => setStockModalItem(item)}
                                                                        className="text-xs cursor-pointer"
                                                                    >
                                                                        Perbarui Saldo Stok
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => setStandardModalItem(item)}
                                                                        className="text-xs cursor-pointer"
                                                                    >
                                                                        Atur Standar Minimum
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-border/50 p-3">
                                <PaginationLinks links={items.links} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Audit Movement History Card */}
                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="border-b border-border/50 py-3.5">
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <History className="size-3.5" />
                            </div>
                            <CardTitle className="text-sm font-semibold">
                                Riwayat Mutasi & Audit Stok Terkini
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {movements.length === 0 ? (
                            <p className="p-6 text-center text-xs text-muted-foreground">
                                Belum ada riwayat pergerakan stok untuk toko ini.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border/60 bg-muted/30 font-semibold text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th className="w-12 px-3 py-2.5 text-center">#</th>
                                            <th className="px-4 py-2.5">Item Barang</th>
                                            <th className="px-3 py-2.5 text-right">Sebelum</th>
                                            <th className="px-3 py-2.5 text-right">Menjadi</th>
                                            <th className="px-3 py-2.5 text-right">Selisih</th>
                                            <th className="px-4 py-2.5">Alasan Perubahan</th>
                                            <th className="px-4 py-2.5">Diubah Oleh</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {movements.map((movement, idx) => {
                                            const diff = Number(movement.quantity_difference);
                                            return (
                                                <tr
                                                    key={movement.id}
                                                    className="transition-colors hover:bg-muted/20"
                                                >
                                                    <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <p className="font-semibold text-foreground">
                                                            {movement.item.name}
                                                        </p>
                                                        <p className="font-mono text-[11px] text-muted-foreground">
                                                            {movement.item.sku}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                                                        {movement.previous_quantity}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-medium tabular-nums text-foreground">
                                                        {movement.new_quantity}
                                                    </td>
                                                    <td
                                                        className={`px-3 py-2.5 text-right font-mono font-bold tabular-nums ${
                                                            diff < 0
                                                                ? 'text-rose-600 dark:text-rose-400'
                                                                : 'text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        {diff > 0 ? `+${movement.quantity_difference}` : movement.quantity_difference}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-foreground">
                                                        {movement.reason}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-muted-foreground">
                                                        {movement.creator?.name ?? 'Sistem Otomatis'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Modal Update Stock */}
            <Dialog open={!!stockModalItem} onOpenChange={(open) => !open && setStockModalItem(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            Perbarui Saldo Stok Resmi
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {stockModalItem ? `${stockModalItem.sku} — ${stockModalItem.name} (${stockModalItem.unit.symbol})` : ''}
                        </DialogDescription>
                    </DialogHeader>

                    {stockModalItem && (
                        <Form
                            action="/central/inventory/stock"
                            method="put"
                            onSuccess={() => setStockModalItem(null)}
                            className="space-y-3 pt-2"
                        >
                            <input
                                type="hidden"
                                name="store_id"
                                value={selectedStoreId ?? ''}
                            />
                            <input
                                type="hidden"
                                name="item_id"
                                value={stockModalItem.id}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Saldo Stok Resmi</Label>
                                    <Input
                                        name="quantity"
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        defaultValue={stockModalItem.stocks[0]?.quantity ?? '0.000'}
                                        required
                                        className="h-9 font-medium tabular-nums text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Jenis Penyesuaian</Label>
                                    <select
                                        name="movement_type"
                                        className="form-select-custom h-9 w-full text-xs"
                                    >
                                        {movementTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Alasan Penyesuaian *</Label>
                                <Input
                                    name="reason"
                                    required
                                    placeholder="Contoh: Stok opname berkala / koreksi fisik"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Catatan Tambahan (Opsional)</Label>
                                <Input
                                    name="notes"
                                    placeholder="Keterangan audit atau dokumen pendukung"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setStockModalItem(null)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" size="sm" className="font-medium">
                                    Simpan Perubahan
                                </Button>
                            </DialogFooter>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal Update Standard */}
            <Dialog open={!!standardModalItem} onOpenChange={(open) => !open && setStandardModalItem(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            Standar Stok Minimum Butik
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {standardModalItem ? `${standardModalItem.sku} — ${standardModalItem.name}` : ''}
                        </DialogDescription>
                    </DialogHeader>

                    {standardModalItem && (
                        <Form
                            action="/central/inventory/standard"
                            method="put"
                            onSuccess={() => setStandardModalItem(null)}
                            className="space-y-3 pt-2"
                        >
                            <input
                                type="hidden"
                                name="store_id"
                                value={selectedStoreId ?? ''}
                            />
                            <input
                                type="hidden"
                                name="item_id"
                                value={standardModalItem.id}
                            />

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">
                                    Batas Standar Minimum ({standardModalItem.unit.symbol})
                                </Label>
                                <Input
                                    name="standard_quantity"
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    defaultValue={standardModalItem.stock_standards[0]?.standard_quantity ?? '0.000'}
                                    required
                                    className="h-9 font-medium tabular-nums text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setStandardModalItem(null)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" size="sm" className="font-medium">
                                    Simpan Standar
                                </Button>
                            </DialogFooter>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function StockProposal({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: 'positive' | 'proposed';
}) {
    return (
        <div className="rounded-lg bg-muted/40 p-1.5 text-center">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p
                className={`mt-0.5 font-mono text-xs font-semibold tabular-nums ${
                    accent === 'positive'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : accent === 'proposed'
                          ? 'font-bold text-primary'
                          : 'text-foreground'
                }`}
            >
                {value}
            </p>
        </div>
    );
}

InventoryIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Stok', href: '/central/inventory' },
    ],
};
