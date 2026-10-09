import { Form, Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    Eye,
    History,
    MoreHorizontal,
    Plus,
    PlusCircle,
    RotateCcw,
    Search,
    Store as StoreIcon,
    Trash2,
    Warehouse,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { CatalogItemSelect } from '@/components/store/catalog-item-select';
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
import { formatQuantity } from '@/lib/utils';

type Store = { id: number; code: string; name: string };
type Item = {
    id: number;
    sku: string;
    name: string;
    cost_price?: string | null;
    min_stock?: string | null;
    unit: { symbol: string };
    stocks: {
        quantity: string;
        average_unit_cost: string;
        total_value: string;
    }[];
    stock_standards: { standard_quantity: string }[];
};
type SimpleItem = {
    id: number;
    sku: string;
    name: string;
    cost_price?: string | null;
    min_stock?: string | null;
    unit: { symbol: string };
};
type MovementItem = {
    id: number;
    item_id: number;
    sku: string;
    name: string;
    unit: string;
    previous_quantity: number;
    new_quantity: number;
    quantity_difference: number;
    unit_cost: number | null;
};
type Movement = {
    id: number;
    batch_id?: number | null;
    batch_number?: string;
    reference_type?: string | null;
    reference_id?: number | null;
    store_id?: number;
    movement_type: string;
    reason: string;
    notes?: string | null;
    created_at: string;
    total_items?: number;
    quantity_difference: number | string;
    previous_quantity?: number | string | null;
    new_quantity?: number | string | null;
    unit_cost?: number | string | null;
    movement_value?: number | string | null;
    new_value?: number | string | null;
    item: {
        id?: number | null;
        sku: string;
        name: string;
        unit?: string | null;
    };
    items?: MovementItem[];
    creator: { id?: number; name: string } | null;
    supplier: { id?: number; code?: string; name: string } | null;
};
type Props = {
    stores?: Store[];
    centralStore?: { id: number; code: string; name: string } | null;
    selectedStoreId: number | null;
    items: {
        data: Item[];
        links: PaginationLink[];
        current_page?: number;
        per_page?: number;
    };
    allItems: SimpleItem[];
    movements: {
        data: Movement[];
        links: PaginationLink[];
        current_page?: number;
        per_page?: number;
    };
    suppliers: { id: number; code: string; name: string }[];
    movementTypes: { value: string; label: string }[];
    filters: {
        search: string;
        tab?: string;
        movement_type?: string;
        date_from?: string;
        date_to?: string;
    };
};

type BulkRow = {
    item_id: number;
    quantity: number;
};

export default function InventoryIndex({
    stores = [],
    centralStore,
    selectedStoreId,
    items,
    allItems = [],
    movements,
    suppliers,
    movementTypes,
    filters,
}: Props) {
    const activeStore = centralStore ?? stores.find((s) => s.id === selectedStoreId) ?? {
        id: selectedStoreId ?? 1,
        code: 'HO-JKT',
        name: 'Head Office Jakarta',
    };
    const currentPage = items.current_page || 1;
    const perPage = items.per_page || 15;
    const activeTab = filters.tab || 'stocks';

    const [stockModalItem, setStockModalItem] = useState<Item | null>(null);
    const [standardModalItem, setStandardModalItem] = useState<Item | null>(null);

    // Bulk Stock Addition Modal State
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkMovementType, setBulkMovementType] = useState('STOCK_IN');
    const [bulkReason, setBulkReason] = useState('Penerimaan stok dari pusat / supplier');
    const [bulkSupplierId, setBulkSupplierId] = useState<string>('');
    const [bulkNotes, setBulkNotes] = useState('');
    const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);
    const [bulkError, setBulkError] = useState<string | null>(null);

    // Detail Modal State for Transaction
    const [detailMovement, setDetailMovement] = useState<Movement | null>(null);

    const handleOpenBulkModal = () => {
        setBulkError(null);
        setBulkMovementType('STOCK_IN');
        setBulkReason('Penerimaan stok dari pusat / supplier');
        setBulkSupplierId('');
        setBulkNotes('');

        if (allItems.length > 0) {
            setBulkRows([
                {
                    item_id: allItems[0].id,
                    quantity: 1,
                },
            ]);
        } else {
            setBulkRows([]);
        }
        setBulkModalOpen(true);
    };

    const handleAddBulkRow = () => {
        if (allItems.length === 0) return;
        const usedIds = new Set(bulkRows.map((r) => r.item_id));
        const available = allItems.find((it) => !usedIds.has(it.id)) || allItems[0];

        setBulkRows([
            ...bulkRows,
            {
                item_id: available.id,
                quantity: 1,
            },
        ]);
    };

    const handleRemoveBulkRow = (index: number) => {
        setBulkRows(bulkRows.filter((_, i) => i !== index));
    };

    const handleBulkItemChange = (index: number, itemId: number) => {
        setBulkRows(
            bulkRows.map((row, i) =>
                i === index
                    ? {
                          ...row,
                          item_id: itemId,
                      }
                    : row,
            ),
        );
    };

    const handleBulkQtyChange = (index: number, qty: number) => {
        setBulkRows(
            bulkRows.map((row, i) =>
                i === index ? { ...row, quantity: Math.max(1, qty) } : row,
            ),
        );
    };

    const handleBulkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStoreId) {
            setBulkError('Silakan pilih toko cabang terlebih dahulu.');
            return;
        }
        if (bulkRows.length === 0) {
            setBulkError('Minimal tambahkan 1 item barang.');
            return;
        }
        if (!bulkReason.trim()) {
            setBulkError('Alasan penambahan stok wajib diisi.');
            return;
        }

        setBulkSubmitting(true);
        setBulkError(null);

        router.post(
            '/central/inventory/bulk-stock',
            {
                store_id: selectedStoreId,
                movement_type: bulkMovementType,
                reason: bulkReason,
                supplier_id: bulkSupplierId ? Number(bulkSupplierId) : null,
                notes: bulkNotes || null,
                items: bulkRows,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setBulkModalOpen(false);
                    setBulkRows([]);
                },
                onError: (errors) => {
                    const firstMsg = Object.values(errors)[0] as string;
                    setBulkError(firstMsg || 'Gagal menambahkan stok kolektif.');
                },
                onFinish: () => {
                    setBulkSubmitting(false);
                },
            },
        );
    };

    const totalBulkQuantity = bulkRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

    const getMovementTypeBadge = (type: string) => {
        switch (type) {
            case 'STOCK_IN':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight className="size-3" />
                        Tambah Stok
                    </span>
                );
            case 'ORDER_RECEIVED':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                        <ArrowUpRight className="size-3" />
                        Penerimaan PO
                    </span>
                );
            case 'CORRECTION':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        <ArrowDownRight className="size-3" />
                        Koreksi
                    </span>
                );
            case 'OPENING_BALANCE':
                return (
                    <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                        Saldo Awal
                    </span>
                );
            case 'MANUAL_UPDATE':
                return (
                    <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        Pembaruan Manual
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {type}
                    </span>
                );
        }
    };

    return (
        <>
            <Head title="Manajemen Inventaris Stok & Mutasi" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Inventaris Pusat"
                    title="Stok & Mutasi Pusat"
                    actions={
                        <Button
                            size="sm"
                            className="h-8.5 text-xs shadow-xs"
                            onClick={handleOpenBulkModal}
                        >
                            <PlusCircle className="mr-1.5 size-3.5" />
                            Tambah Stok Kolektif
                        </Button>
                    }
                />

                {/* Filter and Tab Controller Card */}
                <Card className="border-border/70 shadow-xs">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Warehouse className="size-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-foreground">
                                            {activeStore?.name ?? 'Gudang Pusat (HO)'}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground font-mono">
                                            {activeStore?.code ?? 'HO-JKT'} &bull; Stok & Riwayat Internal Pusat
                                        </div>
                                    </div>
                                </div>

                                <Form
                                    action="/central/inventory"
                                    method="get"
                                    className="flex flex-1 items-center gap-2 md:max-w-md"
                                >
                                    <input
                                        type="hidden"
                                        name="tab"
                                        value={activeTab}
                                    />
                                    {filters.movement_type && (
                                        <input
                                            type="hidden"
                                            name="movement_type"
                                            value={filters.movement_type}
                                        />
                                    )}
                                    {filters.date_from && (
                                        <input
                                            type="hidden"
                                            name="date_from"
                                            value={filters.date_from}
                                        />
                                    )}
                                    {filters.date_to && (
                                        <input
                                            type="hidden"
                                            name="date_to"
                                            value={filters.date_to}
                                        />
                                    )}
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

                            {/* Tab Switcher */}
                            <div className="flex overflow-x-auto whitespace-nowrap border-b border-border/60 scrollbar-none">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.get(
                                            '/central/inventory',
                                            {
                                                tab: 'stocks',
                                                search: filters.search || undefined,
                                            },
                                            { preserveState: true, replace: true },
                                        )
                                    }
                                    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
                                        activeTab === 'stocks'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Warehouse className="size-3.5" />
                                    Stok Barang ({items.data.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.get(
                                            '/central/inventory',
                                            {
                                                tab: 'history',
                                                search: filters.search || undefined,
                                                movement_type: filters.movement_type || undefined,
                                                date_from: filters.date_from || undefined,
                                                date_to: filters.date_to || undefined,
                                            },
                                            { preserveState: true, replace: true },
                                        )
                                    }
                                    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
                                        activeTab === 'history'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <History className="size-3.5" />
                                    Riwayat Tambah Stok & Mutasi ({movements.data.length})
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* TAB 1: Posisi Saldo Stok Barang (Murni Tracking Stok) */}
                {activeTab === 'stocks' && (
                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 py-3.5">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Warehouse className="size-3.5" />
                                </div>
                                <CardTitle className="text-sm font-semibold">
                                    Posisi Stok Barang Pusat ({activeStore?.name ?? 'Pusat'})
                                </CardTitle>
                            </div>
                        </CardHeader>

                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="border-b border-border/60 bg-muted/40 font-semibold tracking-wider text-muted-foreground uppercase">
                                                <tr>
                                                    <th className="w-12 px-3 py-3 text-center">#</th>
                                                    <th className="px-4 py-3">Barang & SKU</th>
                                                    <th className="px-3 py-3 text-center">Satuan</th>
                                                    <th className="px-4 py-3 text-right">Stok Saat Ini</th>
                                                    <th className="px-4 py-3 text-right">Standar Min</th>
                                                    <th className="px-3 py-3 text-center">Status</th>
                                                    <th className="w-16 px-3 py-3 text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {items.data.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={7}
                                                            className="p-8 text-center text-muted-foreground"
                                                        >
                                                            Tidak ada data barang yang cocok.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.data.map((item, index) => {
                                                        const current =
                                                            item.stocks[0]?.quantity ?? '0';
                                                        const storeStandard =
                                                            item.stock_standards[0]?.standard_quantity;
                                                        const standard =
                                                            storeStandard ?? item.min_stock ?? '0';
                                                        const isCritical =
                                                            Number(current) < Number(standard);
                                                        const rowNumber =
                                                            (currentPage - 1) * perPage + index + 1;

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
                                                                    {formatQuantity(current)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono text-muted-foreground tabular-nums">
                                                                    <span>{formatQuantity(standard)}</span>
                                                                    {storeStandard ? (
                                                                        <span className="ml-1 text-[10px] text-primary" title="Override khusus toko">(toko)</span>
                                                                    ) : (
                                                                        <span className="ml-1 text-[10px] text-muted-foreground" title="Standar global master item">(master)</span>
                                                                    )}
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
                                                                        <DropdownMenuContent
                                                                            align="end"
                                                                            className="w-48"
                                                                        >
                                                                            <DropdownMenuLabel className="text-xs">
                                                                                Aksi Inventaris
                                                                            </DropdownMenuLabel>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    setStockModalItem(item)
                                                                                }
                                                                                className="cursor-pointer text-xs"
                                                                            >
                                                                                Sesuaikan Stok
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    setStandardModalItem(item)
                                                                                }
                                                                                className="cursor-pointer text-xs"
                                                                            >
                                                                                Atur Standar Toko Ini
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

                {/* TAB 2: Riwayat Tambah Stok & Mutasi (Murni Audit Pergerakan Stok) */}
                {activeTab === 'history' && (
                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 py-3.5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                        <History className="size-3.5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-semibold">
                                            Riwayat Transaksi Stok ({activeStore?.name ?? 'Pusat'})
                                        </CardTitle>
                                        <p className="text-[11px] text-muted-foreground">
                                            Daftar transaksi penambahan dan mutasi stok per request
                                        </p>
                                    </div>
                                </div>

                                {/* Filters: Date Range + Movement Type */}
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.currentTarget;
                                        const dateFromVal = (form.elements.namedItem('date_from') as HTMLInputElement)?.value;
                                        const dateToVal = (form.elements.namedItem('date_to') as HTMLInputElement)?.value;
                                        const moveTypeVal = (form.elements.namedItem('movement_type') as HTMLSelectElement)?.value;
                                        router.get(
                                            '/central/inventory',
                                            {
                                                tab: 'history',
                                                search: filters.search || undefined,
                                                movement_type: moveTypeVal || undefined,
                                                date_from: dateFromVal || undefined,
                                                date_to: dateToVal || undefined,
                                            },
                                            { preserveState: true, replace: true },
                                        );
                                    }}
                                    className="flex flex-wrap items-center gap-2"
                                >
                                    {/* Integrated Date Range Pill */}
                                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs shadow-2xs">
                                        <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                                        <input
                                            type="date"
                                            name="date_from"
                                            defaultValue={filters.date_from}
                                            className="w-[115px] bg-transparent text-xs font-mono text-foreground focus:outline-none"
                                            aria-label="Tanggal mulai"
                                            title="Tanggal mulai (Awal bulan)"
                                        />
                                        <span className="text-[11px] font-medium text-muted-foreground select-none">
                                            s/d
                                        </span>
                                        <input
                                            type="date"
                                            name="date_to"
                                            defaultValue={filters.date_to}
                                            className="w-[115px] bg-transparent text-xs font-mono text-foreground focus:outline-none"
                                            aria-label="Tanggal akhir"
                                            title="Tanggal akhir (Akhir bulan)"
                                        />
                                    </div>

                                    {/* Movement Type Select */}
                                    <select
                                        name="movement_type"
                                        className="form-select-custom h-8 rounded-lg border border-border/70 bg-background text-xs px-2.5 shadow-2xs"
                                        defaultValue={filters.movement_type || ''}
                                    >
                                        <option value="">Semua Tipe Mutasi</option>
                                        {movementTypes.map((mt) => (
                                            <option key={mt.value} value={mt.value}>
                                                {mt.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Action Buttons */}
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-medium shadow-2xs"
                                    >
                                        Terapkan
                                    </Button>

                                    {(filters.movement_type || (filters.date_from && filters.date_from !== '') || (filters.date_to && filters.date_to !== '')) && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                router.get(
                                                    '/central/inventory',
                                                    { tab: 'history' },
                                                    { preserveState: true, replace: true },
                                                );
                                            }}
                                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                                            title="Reset filter"
                                        >
                                            <RotateCcw className="size-3" />
                                            Reset
                                        </Button>
                                    )}
                                </form>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {movements.data.length === 0 ? (
                                <p className="p-8 text-center text-xs text-muted-foreground">
                                    Belum ada riwayat pergerakan atau penambahan stok untuk gudang pusat pada periode ini.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-border/60 bg-muted/30 font-semibold tracking-wider text-muted-foreground uppercase">
                                            <tr>
                                                <th className="w-10 px-3 py-2.5 text-center">#</th>
                                                <th className="px-3 py-2.5">Waktu</th>
                                                <th className="px-3 py-2.5">No. Referensi / Batch</th>
                                                <th className="px-3 py-2.5 text-center">Tipe</th>
                                                <th className="px-4 py-2.5">Item / Request</th>
                                                <th className="px-3 py-2.5 text-right">Total Perubahan</th>
                                                <th className="px-4 py-2.5">Supplier</th>
                                                <th className="px-4 py-2.5">Alasan</th>
                                                <th className="px-3 py-2.5">Oleh</th>
                                                <th className="w-20 px-3 py-2.5 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {movements.data.map((movement, idx) => {
                                                const diff = Number(movement.quantity_difference);
                                                const movePage = movements.current_page || 1;
                                                const movePerPage = movements.per_page || 20;
                                                const rowNo = (movePage - 1) * movePerPage + idx + 1;
                                                const totalItems = movement.total_items ?? (movement.items?.length || 1);

                                                return (
                                                    <tr
                                                        key={movement.id}
                                                        className="transition-colors hover:bg-muted/20"
                                                    >
                                                        <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
                                                            {rowNo}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap font-mono">
                                                            {movement.created_at
                                                                ? new Date(movement.created_at).toLocaleString('id-ID', {
                                                                      day: '2-digit',
                                                                      month: '2-digit',
                                                                      year: 'numeric',
                                                                      hour: '2-digit',
                                                                      minute: '2-digit',
                                                                  })
                                                                : '—'}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                                                            {movement.batch_number ? (
                                                                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground border border-border/50">
                                                                    {movement.batch_number}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            {getMovementTypeBadge(movement.movement_type)}
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            {totalItems > 1 ? (
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-semibold text-foreground">
                                                                            {totalItems} Item Barang
                                                                        </span>
                                                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                                                            Kolektif
                                                                        </span>
                                                                    </div>
                                                                    <p
                                                                        className="max-w-xs truncate text-[11px] text-muted-foreground"
                                                                        title={movement.items?.map((i) => i.name).join(', ')}
                                                                    >
                                                                        {movement.items?.slice(0, 2).map((i) => i.name).join(', ')}
                                                                        {(movement.items?.length ?? 0) > 2
                                                                            ? `, +${(movement.items?.length ?? 0) - 2} lainnya`
                                                                            : ''}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <p className="font-semibold text-foreground">
                                                                        {movement.items?.[0]?.name ?? movement.item?.name}
                                                                    </p>
                                                                    <p className="font-mono text-[11px] text-muted-foreground">
                                                                        {movement.items?.[0]?.sku ?? movement.item?.sku}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td
                                                            className={`px-3 py-2.5 text-right font-mono font-bold tabular-nums ${
                                                                diff < 0
                                                                    ? 'text-rose-600 dark:text-rose-400'
                                                                    : 'text-emerald-600 dark:text-emerald-400'
                                                                }`}
                                                        >
                                                            {diff > 0
                                                                ? `+${formatQuantity(movement.quantity_difference)}`
                                                                : formatQuantity(movement.quantity_difference)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-muted-foreground">
                                                            {movement.supplier?.name ?? 'Internal'}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-foreground max-w-[200px] truncate" title={movement.reason}>
                                                            {movement.reason}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-muted-foreground">
                                                            {movement.creator?.name ?? 'Sistem'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setDetailMovement(movement)}
                                                                className="h-7 px-2 text-xs gap-1 hover:bg-primary/5 hover:text-primary"
                                                                title="Lihat rincian item transaksi ini"
                                                            >
                                                                <Eye className="size-3" />
                                                                Detail
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="border-t border-border/50 p-3">
                                <PaginationLinks pagination={movements} />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>

            {/* Modal: Tambah Stok Kolektif (Bulk Stock) */}
            <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-1 border-b border-border/40">
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                            <PlusCircle className="size-4 text-primary" />
                            Tambah Stok Kolektif
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleBulkSubmit} className="space-y-4 pt-1">
                        {bulkError && (
                            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{bulkError}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground">Tipe Penyesuaian</Label>
                                <select
                                    value={bulkMovementType}
                                    onChange={(e) => setBulkMovementType(e.target.value)}
                                    className="form-select-custom h-9 w-full text-xs"
                                    required
                                >
                                    {movementTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground">Supplier</Label>
                                <select
                                    value={bulkSupplierId}
                                    onChange={(e) => setBulkSupplierId(e.target.value)}
                                    className="form-select-custom h-9 w-full text-xs"
                                >
                                    <option value="">Tanpa supplier / Internal</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.code} — {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground">Alasan Penambahan *</Label>
                                <Input
                                    value={bulkReason}
                                    onChange={(e) => setBulkReason(e.target.value)}
                                    required
                                    placeholder="Alasan penambahan stok"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground">No. Referensi / Catatan</Label>
                                <Input
                                    value={bulkNotes}
                                    onChange={(e) => setBulkNotes(e.target.value)}
                                    placeholder="No. surat jalan, nota, dll."
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        {/* Dynamic Multi-Item Table (Murni Kuantitas) */}
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-foreground">
                                    Daftar Barang ({bulkRows.length})
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddBulkRow}
                                    className="h-7 text-xs font-medium gap-1"
                                >
                                    <Plus className="size-3" />
                                    Tambah Baris
                                </Button>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-border/60">
                                <table className="w-full min-w-[360px] text-left text-xs">
                                    <thead className="bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px] border-b border-border/50">
                                        <tr>
                                            <th className="px-3 py-2">Barang</th>
                                            <th className="px-3 py-2 w-36 text-right">Jumlah (+Qty)</th>
                                            <th className="px-2 py-2 w-10 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {bulkRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                                    Belum ada baris barang. Klik &quot;Tambah Baris&quot;.
                                                </td>
                                            </tr>
                                        ) : (
                                            bulkRows.map((row, index) => {
                                                const currentItem = allItems.find((it) => it.id === row.item_id);
                                                return (
                                                    <tr key={index} className="hover:bg-muted/10">
                                                        <td className="px-3 py-2">
                                                            <CatalogItemSelect
                                                                name={`bulk_items[${index}][item_id]`}
                                                                value={String(row.item_id || '')}
                                                                onChange={(itemId) =>
                                                                    handleBulkItemChange(index, Number(itemId))
                                                                }
                                                                items={allItems}
                                                                required
                                                                placeholder="Pilih atau cari barang..."
                                                                className="w-full"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    step="1"
                                                                    value={row.quantity}
                                                                    onChange={(e) =>
                                                                        handleBulkQtyChange(index, Number(e.target.value))
                                                                    }
                                                                    required
                                                                    className="h-9 w-24 text-right font-mono font-bold text-xs tabular-nums"
                                                                />
                                                                <span className="font-mono text-muted-foreground text-[11px] w-8 text-left truncate">
                                                                    {currentItem?.unit.symbol}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemoveBulkRow(index)}
                                                                className="size-7 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Footer */}
                            <div className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2.5 text-xs border border-border/50">
                                <span className="text-muted-foreground">
                                    Total: <strong className="text-foreground font-mono">{bulkRows.length} item</strong>
                                </span>
                                <span className="text-muted-foreground">
                                    Total Unit: <strong className="font-mono font-bold text-primary">+{totalBulkQuantity}</strong>
                                </span>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setBulkModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={bulkSubmitting || bulkRows.length === 0}
                                className="font-medium"
                            >
                                {bulkSubmitting ? 'Menyimpan...' : 'Simpan Semua Stok (+)'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Sesuaikan Saldo Stok Tunggal (Murni Kuantitas) */}
            <Dialog
                open={!!stockModalItem}
                onOpenChange={(open) => !open && setStockModalItem(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            Sesuaikan Stok Barang
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">
                                        Jumlah Stok Fisik Baru *
                                    </Label>
                                    <Input
                                        name="quantity"
                                        type="number"
                                        min="0"
                                        step="1"
                                        defaultValue={
                                            stockModalItem.stocks[0]?.quantity ?? '0'
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
                                        defaultValue="CORRECTION"
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
                                            {supplier.code} — {supplier.name}
                                        </option>
                                    ))}
                                </select>
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

            {/* Modal: Atur Standar Minimum Khusus Toko */}
            <Dialog
                open={!!standardModalItem}
                onOpenChange={(open) => !open && setStandardModalItem(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            Standar Stok Minimum Pusat
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

                            <div className="rounded-lg border bg-muted/20 p-2.5 text-xs text-muted-foreground">
                                Standar default katalog master: <strong className="font-mono text-foreground">{formatQuantity(standardModalItem.min_stock ?? 0)} {standardModalItem.unit.symbol}</strong>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">
                                    Batas Standar Minimum Pusat ({standardModalItem.unit.symbol})
                                </Label>
                                <Input
                                    name="standard_quantity"
                                    type="number"
                                    min="0"
                                    step="1"
                                    defaultValue={
                                        standardModalItem.stock_standards[0]?.standard_quantity ??
                                        standardModalItem.min_stock ??
                                        '0'
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

            {/* Modal Detail Transaksi Tambah Stok */}
            <Dialog open={!!detailMovement} onOpenChange={(open) => !open && setDetailMovement(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-base font-semibold text-foreground">
                                        Rincian Transaksi Stok
                                    </DialogTitle>
                                    {detailMovement?.batch_number && (
                                        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                                            {detailMovement.batch_number}
                                        </span>
                                    )}
                                </div>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Waktu:{' '}
                                    {detailMovement?.created_at
                                        ? new Date(detailMovement.created_at).toLocaleString('id-ID', {
                                              day: '2-digit',
                                              month: 'long',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                        : '—'}
                                </DialogDescription>
                            </div>
                            {detailMovement && getMovementTypeBadge(detailMovement.movement_type)}
                        </div>

                        {/* Metadata Summary */}
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg border border-border/60 bg-background/80 p-2.5 text-xs">
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Supplier</span>
                                <p className="font-medium text-foreground truncate">{detailMovement?.supplier?.name ?? 'Internal'}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Petugas</span>
                                <p className="font-medium text-foreground truncate">{detailMovement?.creator?.name ?? 'Sistem'}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Item</span>
                                <p className="font-semibold text-foreground">{detailMovement?.total_items ?? (detailMovement?.items?.length || 1)} Item</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Perubahan</span>
                                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    {Number(detailMovement?.quantity_difference ?? 0) > 0 ? `+` : ''}
                                    {formatQuantity(detailMovement?.quantity_difference ?? 0)}
                                </p>
                            </div>
                        </div>

                        {detailMovement?.reason && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Alasan:</span> {detailMovement.reason}
                                {detailMovement.notes && (
                                    <span className="ml-2">({detailMovement.notes})</span>
                                )}
                            </div>
                        )}
                    </DialogHeader>

                    {/* Items Table */}
                    <div className="flex-1 overflow-y-auto p-5 pt-3">
                        <h4 className="mb-2 text-xs font-semibold text-foreground uppercase tracking-wider">
                            Daftar Item Barang ({detailMovement?.items?.length ?? (detailMovement ? 1 : 0)})
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-border/60">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="w-10 px-3 py-2 text-center">#</th>
                                        <th className="px-3 py-2">Item Barang</th>
                                        <th className="px-2 py-2 text-center">Satuan</th>
                                        <th className="px-3 py-2 text-right">Stok Sebelum</th>
                                        <th className="px-3 py-2 text-right">Perubahan</th>
                                        <th className="px-3 py-2 text-right">Stok Akhir</th>
                                        <th className="px-3 py-2 text-right">Biaya / Pcs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {(detailMovement?.items && detailMovement.items.length > 0
                                        ? detailMovement.items
                                        : [
                                              {
                                                  id: detailMovement?.id ?? 0,
                                                  item_id: detailMovement?.item?.id ?? 0,
                                                  sku: detailMovement?.item?.sku ?? '—',
                                                  name: detailMovement?.item?.name ?? '—',
                                                  unit: detailMovement?.item?.unit ?? 'pcs',
                                                  previous_quantity: Number(detailMovement?.previous_quantity ?? 0),
                                                  new_quantity: Number(detailMovement?.new_quantity ?? 0),
                                                  quantity_difference: Number(detailMovement?.quantity_difference ?? 0),
                                                  unit_cost: null,
                                              },
                                          ]
                                    ).map((itm, idx) => (
                                        <tr key={itm.id || idx} className="hover:bg-muted/10">
                                            <td className="px-3 py-2 text-center font-mono text-muted-foreground">
                                                {idx + 1}
                                            </td>
                                            <td className="px-3 py-2">
                                                <p className="font-semibold text-foreground">{itm.name}</p>
                                                <p className="font-mono text-[10px] text-muted-foreground">{itm.sku}</p>
                                            </td>
                                            <td className="px-2 py-2 text-center text-muted-foreground font-mono">
                                                {itm.unit}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-muted-foreground tabular-nums">
                                                {formatQuantity(itm.previous_quantity)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                {itm.quantity_difference > 0 ? `+${formatQuantity(itm.quantity_difference)}` : formatQuantity(itm.quantity_difference)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono font-semibold text-foreground tabular-nums">
                                                {formatQuantity(itm.new_quantity)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-muted-foreground tabular-nums">
                                                {itm.unit_cost !== null && itm.unit_cost !== undefined
                                                    ? `Rp ${Number(itm.unit_cost).toLocaleString('id-ID')}`
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <DialogFooter className="p-3 border-t border-border/50 bg-muted/10">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDetailMovement(null)}
                            className="h-8 text-xs font-medium px-4"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

InventoryIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Stok & Mutasi', href: '/central/inventory' },
    ],
};
