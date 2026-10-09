import { Form, Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    History,
    MoreHorizontal,
    Search,
    Store as StoreIcon,
    Warehouse,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
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
    stocks: {
        quantity: string;
        average_unit_cost: string;
        total_value: string;
    }[];
    stock_standards: { standard_quantity: string }[];
};
type Movement = {
    id: number;
    previous_quantity: string;
    new_quantity: string;
    quantity_difference: string;
    unit_cost: string | null;
    movement_value: string | null;
    new_value: string;
    reason: string;
    item: { sku: string; name: string };
    creator: { name: string } | null;
    supplier: { code: string; name: string } | null;
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
    suppliers: { id: number; code: string; name: string }[];
    movementTypes: { value: string; label: string }[];
    filters: { search: string };
};

export default function InventoryIndex({
    stores,
    selectedStoreId,
    items,
    movements,
    suppliers,
    movementTypes,
    filters,
}: Props) {
    const activeStore = stores.find((s) => s.id === selectedStoreId);
    const currentPage = items.current_page || 1;
    const perPage = items.per_page || 15;

    const [stockModalItem, setStockModalItem] = useState<Item | null>(null);
    const [standardModalItem, setStandardModalItem] = useState<Item | null>(
        null,
    );

    return (
        <>
            <Head title="Manajemen Inventaris Stok" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader badge="Inventaris" title="Stok & Mutasi" />

                {/* Store Selector & Compact Search Filter */}
                <Card className="border-border/70 shadow-xs">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                                <StoreIcon className="size-4 shrink-0 text-muted-foreground" />
                                <span className="text-xs font-semibold whitespace-nowrap text-foreground">
                                    Lokasi Toko Cabang:
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
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
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

                {/* Stock Position Table */}
                {stores.length === 0 ? (
                    <Card className="border-border/70">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Belum ada master toko terdaftar. Buat toko terlebih
                            dahulu untuk mengelola stok.
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
                                        Posisi Stok Toko Cabang (
                                        {activeStore?.name ?? 'Pilih Toko'})
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border/60 bg-muted/40 font-semibold tracking-wider text-muted-foreground uppercase">
                                        <tr>
                                            <th className="w-12 px-3 py-3 text-center">
                                                #
                                            </th>
                                            <th className="px-4 py-3">
                                                Barang & SKU
                                            </th>
                                            <th className="px-3 py-3 text-center">
                                                Satuan
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Saldo Stok
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Harga Rata-rata
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Total Nilai
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Standar Min
                                            </th>
                                            <th className="px-3 py-3 text-center">
                                                Status
                                            </th>
                                            <th className="w-16 px-3 py-3 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {items.data.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={9}
                                                    className="p-8 text-center text-muted-foreground"
                                                >
                                                    Tidak ada data barang yang
                                                    cocok.
                                                </td>
                                            </tr>
                                        ) : (
                                            items.data.map((item, index) => {
                                                const current =
                                                    item.stocks[0]?.quantity ??
                                                    '0.000';
                                                const averageCost =
                                                    item.stocks[0]
                                                        ?.average_unit_cost ??
                                                    '0.00';
                                                const totalValue =
                                                    item.stocks[0]
                                                        ?.total_value ?? '0.00';
                                                const standard =
                                                    item.stock_standards[0]
                                                        ?.standard_quantity ??
                                                    '0.000';
                                                const isCritical =
                                                    Number(current) <
                                                    Number(standard);
                                                const rowNumber =
                                                    (currentPage - 1) *
                                                        perPage +
                                                    index +
                                                    1;

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
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground tabular-nums">
                                                            {current}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-muted-foreground tabular-nums">
                                                            Rp{' '}
                                                            {Number(
                                                                averageCost,
                                                            ).toLocaleString(
                                                                'id-ID',
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                                                            Rp{' '}
                                                            {Number(
                                                                totalValue,
                                                            ).toLocaleString(
                                                                'id-ID',
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-muted-foreground tabular-nums">
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
                                                                <DropdownMenuTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-7"
                                                                    >
                                                                        <MoreHorizontal className="size-3.5" />
                                                                        <span className="sr-only">
                                                                            Aksi
                                                                        </span>
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent
                                                                    align="end"
                                                                    className="w-48"
                                                                >
                                                                    <DropdownMenuLabel className="text-xs">
                                                                        Aksi
                                                                        Inventaris
                                                                    </DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setStockModalItem(
                                                                                item,
                                                                            )
                                                                        }
                                                                        className="cursor-pointer text-xs"
                                                                    >
                                                                        Perbarui
                                                                        Saldo
                                                                        Stok
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setStandardModalItem(
                                                                                item,
                                                                            )
                                                                        }
                                                                        className="cursor-pointer text-xs"
                                                                    >
                                                                        Atur
                                                                        Standar
                                                                        Minimum
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
                                <PaginationLinks pagination={items} />
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
                                Belum ada riwayat pergerakan stok untuk toko
                                ini.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border/60 bg-muted/30 font-semibold tracking-wider text-muted-foreground uppercase">
                                        <tr>
                                            <th className="w-12 px-3 py-2.5 text-center">
                                                #
                                            </th>
                                            <th className="px-4 py-2.5">
                                                Item Barang
                                            </th>
                                            <th className="px-3 py-2.5 text-right">
                                                Sebelum
                                            </th>
                                            <th className="px-3 py-2.5 text-right">
                                                Menjadi
                                            </th>
                                            <th className="px-3 py-2.5 text-right">
                                                Selisih
                                            </th>
                                            <th className="px-3 py-2.5 text-right">
                                                Nilai Akhir
                                            </th>
                                            <th className="px-4 py-2.5">
                                                Supplier
                                            </th>
                                            <th className="px-4 py-2.5">
                                                Alasan Perubahan
                                            </th>
                                            <th className="px-4 py-2.5">
                                                Diubah Oleh
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {movements.map((movement, idx) => {
                                            const diff = Number(
                                                movement.quantity_difference,
                                            );
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
                                                    <td className="px-3 py-2.5 text-right font-mono text-muted-foreground tabular-nums">
                                                        {
                                                            movement.previous_quantity
                                                        }
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-medium text-foreground tabular-nums">
                                                        {movement.new_quantity}
                                                    </td>
                                                    <td
                                                        className={`px-3 py-2.5 text-right font-mono font-bold tabular-nums ${
                                                            diff < 0
                                                                ? 'text-rose-600 dark:text-rose-400'
                                                                : 'text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        {diff > 0
                                                            ? `+${movement.quantity_difference}`
                                                            : movement.quantity_difference}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono text-foreground">
                                                        Rp{' '}
                                                        {Number(
                                                            movement.new_value,
                                                        ).toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-muted-foreground">
                                                        {movement.supplier
                                                            ?.name ??
                                                            'Internal / koreksi'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-foreground">
                                                        {movement.reason}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-muted-foreground">
                                                        {movement.creator
                                                            ?.name ??
                                                            'Sistem Otomatis'}
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
            <Dialog
                open={!!stockModalItem}
                onOpenChange={(open) => !open && setStockModalItem(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            Perbarui Saldo Stok Resmi
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {stockModalItem
                                ? `${stockModalItem.sku} — ${stockModalItem.name} (${stockModalItem.unit.symbol})`
                                : ''}
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
                                    <Label className="text-xs font-semibold">
                                        Saldo Stok Resmi
                                    </Label>
                                    <Input
                                        name="quantity"
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        defaultValue={
                                            stockModalItem.stocks[0]
                                                ?.quantity ?? '0.000'
                                        }
                                        required
                                        className="h-9 text-xs font-medium tabular-nums"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">
                                        Jenis Penyesuaian
                                    </Label>
                                    <select
                                        name="movement_type"
                                        className="form-select-custom h-9 w-full text-xs"
                                    >
                                        {movementTypes.map((type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-muted/20 p-3 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Nilai stok saat ini
                                    </span>
                                    <strong className="font-mono">
                                        Rp{' '}
                                        {Number(
                                            stockModalItem.stocks[0]
                                                ?.total_value ?? 0,
                                        ).toLocaleString('id-ID')}
                                    </strong>
                                </div>
                                <div className="mt-1 flex justify-between">
                                    <span className="text-muted-foreground">
                                        Harga rata-rata
                                    </span>
                                    <strong className="font-mono">
                                        Rp{' '}
                                        {Number(
                                            stockModalItem.stocks[0]
                                                ?.average_unit_cost ?? 0,
                                        ).toLocaleString('id-ID')}
                                    </strong>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">
                                        Supplier (Opsional)
                                    </Label>
                                    <select
                                        name="supplier_id"
                                        defaultValue=""
                                        className="form-select-custom h-9 w-full text-xs"
                                    >
                                        <option value="">Tanpa supplier</option>
                                        {suppliers.map((supplier) => (
                                            <option
                                                key={supplier.id}
                                                value={supplier.id}
                                            >
                                                {supplier.code} —{' '}
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">
                                        Harga Satuan (Opsional)
                                    </Label>
                                    <Input
                                        name="unit_cost"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        className="h-9 font-mono text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">
                                    Alasan Penyesuaian *
                                </Label>
                                <Input
                                    name="reason"
                                    required
                                    placeholder="Contoh: Stok opname berkala / koreksi fisik"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">
                                    Catatan Tambahan (Opsional)
                                </Label>
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
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="font-medium"
                                >
                                    Simpan Perubahan
                                </Button>
                            </DialogFooter>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal Update Standard */}
            <Dialog
                open={!!standardModalItem}
                onOpenChange={(open) => !open && setStandardModalItem(null)}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            Standar Stok Minimum Toko Cabang
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {standardModalItem
                                ? `${standardModalItem.sku} — ${standardModalItem.name}`
                                : ''}
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
                                    Batas Standar Minimum (
                                    {standardModalItem.unit.symbol})
                                </Label>
                                <Input
                                    name="standard_quantity"
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    defaultValue={
                                        standardModalItem.stock_standards[0]
                                            ?.standard_quantity ?? '0.000'
                                    }
                                    required
                                    className="h-9 text-xs font-medium tabular-nums"
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
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="font-medium"
                                >
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

InventoryIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Stok', href: '/central/inventory' },
    ],
};
