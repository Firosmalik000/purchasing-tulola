import { Form, Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpDown,
    CheckCircle2,
    FileSpreadsheet,
    History,
    PackageCheck,
    Search,
    SlidersHorizontal,
    Sparkles,
    Store as StoreIcon,
    Warehouse,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    items: { data: Item[]; links: PaginationLink[] };
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

    return (
        <>
            <Head title="Manajemen Inventaris Stok" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Inventaris & Logistik Pusat"
                    title="Manajemen Stok Butik"
                    description="Otorisasi pembaruan stok resmi dari tanda terima barang toko, sesuaikan kuantitas fisik, dan atur batas stok minimum per butik."
                />

                {/* Store Selector & Search Filter */}
                <Card className="border-border/70 shadow-xs">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end">
                            <div className="space-y-1.5 md:w-80">
                                <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                    <StoreIcon className="size-3.5 text-muted-foreground" />
                                    Pilih Lokasi Butik / Toko
                                </Label>
                                <select
                                    className="form-select-custom h-10 w-full"
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
                                className="flex flex-1 items-end gap-2"
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
                                        placeholder="Cari SKU atau nama perhiasan / material..."
                                        className="h-10 pl-9"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    className="h-10 px-5 font-medium"
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
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <PackageCheck className="size-5" />
                            </div>
                            <div>
                                <h2
                                    id="pending-receipts-title"
                                    className="text-base font-semibold text-foreground"
                                >
                                    Penerimaan Menunggu Update Stok ({pendingReceipts.length} Bukti Terima)
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Toko telah mengonfirmasi penerimaan fisik. Verifikasi usulan penambahan stok sebelum dibukukan ke saldo resmi.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {pendingReceipts.map((receipt) => (
                                <Card
                                    key={receipt.id}
                                    className="border-amber-500/30 bg-amber-500/[0.02] shadow-xs"
                                >
                                    <CardHeader className="border-b border-border/50 pb-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2.5">
                                                <CardTitle className="font-mono text-base font-bold text-foreground">
                                                    {receipt.number}
                                                </CardTitle>
                                                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                                    Menunggu Verifikasi Pusat
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Dari PO:{' '}
                                                <span className="font-mono font-medium text-foreground">
                                                    {receipt.purchase_order.number}
                                                </span>{' '}
                                                · Supplier:{' '}
                                                <span className="font-medium text-foreground">
                                                    {receipt.purchase_order.supplier?.name ?? 'Internal'}
                                                </span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Diterima fisik oleh:{' '}
                                                <span className="font-medium text-foreground">
                                                    {receipt.receiver.name}
                                                </span>{' '}
                                                pada{' '}
                                                <span className="font-mono">
                                                    {new Date(receipt.received_at).toLocaleString('id-ID', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short',
                                                    })}
                                                </span>
                                                {receipt.notes ? ` · Catatan Toko: "${receipt.notes}"` : ''}
                                            </p>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4 p-5">
                                        <div className="space-y-2.5">
                                            {receipt.stock_lines.map((line) => (
                                                <article
                                                    key={line.item_id}
                                                    className="grid gap-3.5 rounded-xl border border-border/70 bg-card p-3.5 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(7rem,1fr))] md:items-center"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-foreground">
                                                            {line.name}
                                                        </p>
                                                        <p className="font-mono text-xs text-muted-foreground">
                                                            {line.sku} · Satuan: {line.unit}
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
                                                        label="Usulan Stok Baru"
                                                        value={line.proposed_quantity}
                                                        accent="proposed"
                                                    />
                                                </article>
                                            ))}
                                        </div>

                                        {receipt.special_lines.length > 0 && (
                                            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-3.5">
                                                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                                    <Sparkles className="size-3.5 text-sky-500" />
                                                    Item Khusus (Pengadaan langsung / Non-Stok Katalog)
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-2">
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
                                            className="grid gap-3 border-t border-border/50 pt-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                                        >
                                            <Input
                                                name="notes"
                                                className="h-10"
                                                placeholder="Catatan persetujuan pembukuan pusat (opsional)"
                                                aria-label={`Catatan penerapan stok ${receipt.number}`}
                                            />
                                            <Button
                                                type="submit"
                                                className="h-10 gap-2 bg-emerald-600 font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                                            >
                                                <CheckCircle2 className="size-4" />
                                                Setujui & Terapkan ke Stok Resmi
                                            </Button>
                                        </Form>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Stock Position & Management List */}
                {stores.length === 0 ? (
                    <Card className="border-border/70">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Belum ada master toko terdaftar. Buat toko terlebih dahulu untuk mengelola stok.
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Warehouse className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">
                                        Posisi Stok Butik ({activeStore?.name ?? 'Pilih Toko'})
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        Perbarui saldo stok resmi dan ubah standar minimum operasional butik
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 p-5">
                            <div className="space-y-3.5">
                                {items.data.map((item) => {
                                    const current =
                                        item.stocks[0]?.quantity ?? '0.000';
                                    const standard =
                                        item.stock_standards[0]?.standard_quantity ?? '0.000';
                                    const isCritical = Number(current) < Number(standard);

                                    return (
                                        <article
                                            key={item.id}
                                            className="rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/40 pb-3">
                                                <div>
                                                    <p className="font-semibold text-foreground">
                                                        {item.name}
                                                    </p>
                                                    <p className="font-mono text-xs text-muted-foreground">
                                                        {item.sku} · Satuan: {item.unit.symbol}
                                                    </p>
                                                </div>
                                                {isCritical && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                                        <AlertCircle className="size-3.5" />
                                                        Di Bawah Standar Minimum
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-3.5 grid gap-4 lg:grid-cols-2">
                                                {/* Official Stock Adjustment Form */}
                                                <Form
                                                    action="/central/inventory/stock"
                                                    method="put"
                                                    className="grid gap-2.5 rounded-xl border border-border/50 bg-muted/20 p-3.5 sm:grid-cols-2"
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="store_id"
                                                        value={selectedStoreId ?? ''}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name="item_id"
                                                        value={item.id}
                                                    />
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-semibold text-foreground">
                                                            Saldo Stok Resmi
                                                        </Label>
                                                        <Input
                                                            name="quantity"
                                                            type="number"
                                                            min="0"
                                                            step="0.001"
                                                            defaultValue={current}
                                                            required
                                                            className="h-9 font-medium tabular-nums"
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-semibold text-foreground">
                                                            Jenis Penyesuaian
                                                        </Label>
                                                        <select
                                                            name="movement_type"
                                                            className="form-select-custom h-9 w-full"
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

                                                    <Input
                                                        name="reason"
                                                        required
                                                        placeholder="Alasan penyesuaian (wajib audit)*"
                                                        className="h-9 text-xs sm:col-span-2"
                                                    />
                                                    <Input
                                                        name="notes"
                                                        placeholder="Catatan tambahan (opsional)"
                                                        className="h-9 text-xs"
                                                    />
                                                    <Button
                                                        type="submit"
                                                        size="sm"
                                                        className="h-9 font-medium"
                                                    >
                                                        Perbarui Stok
                                                    </Button>
                                                </Form>

                                                {/* Store Minimum Standard Form */}
                                                <Form
                                                    action="/central/inventory/standard"
                                                    method="put"
                                                    className="grid content-start gap-2.5 rounded-xl border border-border/50 bg-muted/20 p-3.5 sm:grid-cols-[1fr_auto]"
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="store_id"
                                                        value={selectedStoreId ?? ''}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name="item_id"
                                                        value={item.id}
                                                    />
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-semibold text-foreground">
                                                            Standar Stok Minimum Butik
                                                        </Label>
                                                        <Input
                                                            name="standard_quantity"
                                                            type="number"
                                                            min="0"
                                                            step="0.001"
                                                            defaultValue={standard}
                                                            required
                                                            className="h-9 font-medium tabular-nums"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="submit"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 self-end font-medium"
                                                    >
                                                        Simpan Standar
                                                    </Button>
                                                </Form>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            <PaginationLinks links={items.links} />
                        </CardContent>
                    </Card>
                )}

                {/* Audit Movement History Card */}
                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <History className="size-4" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Riwayat Mutasi & Audit Stok
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Log historis semua perubahan kuantitas fisik dan saldo inventaris
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {movements.length === 0 ? (
                            <p className="p-8 text-center text-sm text-muted-foreground">
                                Belum ada riwayat pergerakan stok untuk toko ini.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3.5">Item Barang</th>
                                            <th className="px-4 py-3.5 text-right">Sebelum</th>
                                            <th className="px-4 py-3.5 text-right">Menjadi</th>
                                            <th className="px-4 py-3.5 text-right">Selisih</th>
                                            <th className="px-4 py-3.5">Alasan Perubahan</th>
                                            <th className="px-5 py-3.5">Diubah Oleh</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {movements.map((movement) => {
                                            const diff = Number(movement.quantity_difference);
                                            return (
                                                <tr
                                                    key={movement.id}
                                                    className="transition-colors hover:bg-muted/20"
                                                >
                                                    <td className="px-5 py-3.5">
                                                        <p className="font-semibold text-foreground">
                                                            {movement.item.name}
                                                        </p>
                                                        <p className="font-mono text-xs text-muted-foreground">
                                                            {movement.item.sku}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-muted-foreground">
                                                        {movement.previous_quantity}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-mono font-medium tabular-nums text-foreground">
                                                        {movement.new_quantity}
                                                    </td>
                                                    <td
                                                        className={`px-4 py-3.5 text-right font-mono font-bold tabular-nums ${
                                                            diff < 0
                                                                ? 'text-rose-600 dark:text-rose-400'
                                                                : 'text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        {diff > 0 ? `+${movement.quantity_difference}` : movement.quantity_difference}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-xs text-foreground">
                                                        {movement.reason}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
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
        <div className="rounded-lg bg-muted/40 p-2 text-center">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p
                className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${
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
