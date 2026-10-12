import { Form, Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    Boxes,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Clock,
    Download,
    FileSpreadsheet,
    FileText,
    RotateCcw,
    Search,
    ShoppingCart,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { SampleImagePreview } from '@/components/common/sample-image-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatQuantity } from '@/lib/utils';

type BankRequestItem = {
    id: number;
    purchase_request_id: number;
    name: string | null;
    description: string | null;
    sample_image_url: string | null;
    unit: { id: number; name: string; symbol: string };
    requested_quantity: number;
    approved_quantity: number | null;
    bank_quantity?: number | null;
    required_date: string | null;
    reason: string | null;
    purchase_request: {
        id: number;
        number: string;
        created_at: string;
        required_date: string | null;
        store: { id: number; code: string; name: string };
        requester: { id: number; name: string };
    };
};

type Props = {
    items: {
        data: BankRequestItem[];
        links: PaginationLink[];
        total?: number;
        current_page?: number;
        per_page?: number;
    };
    stores: { id: number; code: string; name: string }[];
    stats: {
        total_items: number;
        total_quantity: number;
        total_stores: number;
    };
    filters: {
        store_id: string;
        keyword: string;
        date_from: string;
        date_to: string;
    };
};

export default function BankRequestIndex({
    items,
    stores,
    stats,
    filters,
}: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [createOrderOpen, setCreateOrderOpen] = useState(false);
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const hasActiveFilters = Boolean(
        filters.store_id ||
        filters.keyword ||
        filters.date_from ||
        filters.date_to,
    );

    const allOnPageIds = items.data.map((item) => item.id);
    const isAllSelected =
        allOnPageIds.length > 0 &&
        allOnPageIds.every((id) => selectedIds.includes(id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds((prev) =>
                prev.filter((id) => !allOnPageIds.includes(id)),
            );
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...allOnPageIds])));
        }
    };

    const toggleSelectRow = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
        );
    };

    const selectedItems = items.data.filter((item) =>
        selectedIds.includes(item.id),
    );

    // Group selected items by store for preview in modal
    const selectedStores = Array.from(
        new Set(
            selectedItems.map((item) => item.purchase_request.store.name),
        ),
    );

    const exportQuery = useMemo(() => {
        const params = new URLSearchParams();
        if (filters.store_id) params.set('store_id', filters.store_id);
        if (filters.keyword) params.set('keyword', filters.keyword);
        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    }, [filters]);

    const handleCreateOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedIds.length === 0) return;

        // Convert DD/MM/YYYY to YYYY-MM-DD if needed
        let normalizedExpectedDate = expectedDate || null;
        if (normalizedExpectedDate) {
            const match = normalizedExpectedDate.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (match) {
                normalizedExpectedDate = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
            }
        }

        setSubmitting(true);
        router.post(
            '/central/bank-requests/orders',
            {
                items: selectedIds.map((id) => ({ id })),
                expected_date: normalizedExpectedDate,
                notes: notes || null,
            },
            {
                onFinish: () => {
                    setSubmitting(false);
                    setCreateOrderOpen(false);
                    setSelectedIds([]);
                },
            },
        );
    };

    const selectClass =
        'h-8.5 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

    return (
        <>
            <Head title="Bank Permintaan — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Pengadaan"
                    title="Bank Permintaan"
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8.5 gap-1.5 text-xs shadow-2xs font-medium cursor-pointer"
                                    >
                                        <Download className="size-3.5 text-muted-foreground" />
                                        Export Data
                                        <ChevronDown className="size-3 text-muted-foreground opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-60">
                                    <DropdownMenuItem asChild>
                                        <a
                                            href={`/central/bank-requests/excel${exportQuery}`}
                                            className="flex cursor-pointer items-center gap-2.5 py-1.5"
                                        >
                                            <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-xs text-foreground">
                                                    Export Excel (.xlsx)
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Format resmi, border tabel & kolom rapi
                                                </span>
                                            </div>
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <a
                                            href={`/central/bank-requests/csv${exportQuery}`}
                                            className="flex cursor-pointer items-center gap-2.5 py-1.5"
                                        >
                                            <FileText className="size-4 text-sky-600 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-xs text-foreground">
                                                    Export CSV (.csv)
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Standar UTF-8 BOM teks data mentah
                                                </span>
                                            </div>
                                        </a>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {selectedIds.length > 0 && (
                                <Button
                                    size="sm"
                                    onClick={() => setCreateOrderOpen(true)}
                                    className="h-8.5 shadow-xs gap-1.5 font-medium text-xs"
                                >
                                    <ShoppingCart className="size-3.5" />
                                    Buat PO ({selectedIds.length} Item Terpilih)
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Metric Summary Cards */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="border border-border/70 shadow-2xs">
                        <CardContent className="flex items-center gap-3.5 p-4">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                <Clock className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Item Tertunda (Backlog)
                                </p>
                                <p className="font-mono text-xl font-bold text-foreground">
                                    {stats.total_items}{' '}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        item
                                    </span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-border/70 shadow-2xs">
                        <CardContent className="flex items-center gap-3.5 p-4">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Boxes className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Total Kuantitas
                                </p>
                                <p className="font-mono text-xl font-bold text-foreground">
                                    {formatQuantity(stats.total_quantity)}{' '}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        unit
                                    </span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-border/70 shadow-2xs">
                        <CardContent className="flex items-center gap-3.5 p-4">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
                                <Building2 className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Toko / Cabang Pemohon
                                </p>
                                <p className="font-mono text-xl font-bold text-foreground">
                                    {stats.total_stores}{' '}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        cabang
                                    </span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Toolbar */}
                <Card className="border border-border/70 bg-card shadow-2xs">
                    <CardContent className="p-3">
                        <Form
                            action="/central/bank-requests"
                            method="get"
                            className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-[1.5fr_1.2fr_135px_135px_auto]"
                        >
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                                <Input
                                    name="keyword"
                                    defaultValue={filters.keyword}
                                    placeholder="Cari item, nomor PR, alasan..."
                                    className="h-8.5 pl-8 text-xs"
                                />
                            </div>
                            <div>
                                <select
                                    name="store_id"
                                    defaultValue={filters.store_id}
                                    className={selectClass}
                                >
                                    <option value="">Semua Toko Cabang</option>
                                    {stores.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.code} — {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <DatePicker
                                    name="date_from"
                                    defaultValue={filters.date_from}
                                    placeholder="Dari DD/MM/YYYY"
                                    title="Dari Tanggal Pengajuan (DD/MM/YYYY)"
                                />
                            </div>
                            <div>
                                <DatePicker
                                    name="date_to"
                                    defaultValue={filters.date_to}
                                    placeholder="Sampai DD/MM/YYYY"
                                    title="Sampai Tanggal Pengajuan (DD/MM/YYYY)"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-8.5 px-3 text-xs"
                                >
                                    Filter
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8.5 px-2 text-xs text-muted-foreground"
                                        asChild
                                    >
                                        <Link href="/central/bank-requests">
                                            <RotateCcw className="size-3.5" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </Form>
                    </CardContent>
                </Card>

                {/* Items Table */}
                <Card className="border border-border/70 shadow-2xs">
                    <CardContent className="p-0">
                        {items.data.length === 0 ? (
                            <EmptyState
                                icon={Clock}
                                title="Tidak Ada Permintaan Tertunda"
                                description={
                                    hasActiveFilters
                                        ? 'Tidak ditemukan permintaan khusus yang cocok dengan filter aktif.'
                                        : 'Saat ini belum ada item permintaan khusus yang ditunda ke Bank Permintaan.'
                                }
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-border/60 bg-muted/30 font-semibold text-muted-foreground">
                                            <th className="w-10 px-3 py-2.5 text-center">
                                                <Checkbox
                                                    checked={isAllSelected}
                                                    onCheckedChange={toggleSelectAll}
                                                    aria-label="Pilih semua item"
                                                />
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Item Permintaan Khusus
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Toko Cabang
                                            </th>
                                            <th className="px-3 py-2.5">
                                                PR Asal
                                            </th>
                                            <th className="px-3 py-2.5 text-right">
                                                Qty Dianggarkan
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Target Dibutuhkan
                                            </th>
                                            <th className="px-3 py-2.5 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {items.data.map((item) => {
                                            const isSelected = selectedIds.includes(
                                                item.id,
                                            );
                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={`transition-colors hover:bg-muted/30 ${
                                                        isSelected
                                                            ? 'bg-amber-500/5'
                                                            : ''
                                                    }`}
                                                >
                                                    <td className="px-3 py-3 text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() =>
                                                                toggleSelectRow(
                                                                    item.id,
                                                                )
                                                            }
                                                            aria-label={`Pilih ${item.name}`}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-start gap-3">
                                                            {item.sample_image_url && (
                                                                <SampleImagePreview
                                                                    src={
                                                                        item.sample_image_url
                                                                    }
                                                                    itemName={
                                                                        item.name ??
                                                                        'Item'
                                                                    }
                                                                    className="size-12 rounded-lg shrink-0"
                                                                />
                                                            )}
                                                            <div className="min-w-0 space-y-0.5">
                                                                <p className="font-semibold text-foreground">
                                                                    {item.name}
                                                                </p>
                                                                {item.description && (
                                                                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                                                                        {
                                                                            item.description
                                                                        }
                                                                    </p>
                                                                )}
                                                                {item.reason && (
                                                                    <p className="text-[10px] text-muted-foreground/80 italic">
                                                                        Alasan:{' '}
                                                                        {
                                                                            item.reason
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] font-medium"
                                                        >
                                                            {
                                                                item
                                                                    .purchase_request
                                                                    .store.name
                                                            }
                                                        </Badge>
                                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                            PIC:{' '}
                                                            {
                                                                item
                                                                    .purchase_request
                                                                    .requester
                                                                    .name
                                                            }
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Link
                                                            href={`/central/requests/${item.purchase_request.id}`}
                                                            className="font-mono text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                                        >
                                                            {
                                                                item
                                                                    .purchase_request
                                                                    .number
                                                            }
                                                            <ArrowUpRight className="size-3" />
                                                        </Link>
                                                        <time className="text-[10px] text-muted-foreground font-mono">
                                                            {new Date(
                                                                item.purchase_request.created_at,
                                                            ).toLocaleDateString(
                                                                'id-ID',
                                                                {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                },
                                                            )}
                                                        </time>
                                                    </td>
                                                    <td className="px-3 py-3 text-right">
                                                        <span className="font-mono font-bold text-foreground">
                                                            {formatQuantity(
                                                                item.bank_quantity ??
                                                                    item.approved_quantity ??
                                                                    item.requested_quantity,
                                                            )}
                                                        </span>{' '}
                                                        <span className="text-muted-foreground">
                                                            {item.unit.symbol}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-muted-foreground">
                                                        {item.required_date ? (
                                                            <div className="flex items-center gap-1 text-[11px]">
                                                                <Calendar className="size-3 text-muted-foreground shrink-0" />
                                                                {new Date(
                                                                    item.required_date,
                                                                ).toLocaleDateString(
                                                                    'id-ID',
                                                                    {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                    },
                                                                )}
                                                            </div>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedIds([
                                                                    item.id,
                                                                ]);
                                                                setCreateOrderOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            className="text-xs h-7 gap-1"
                                                        >
                                                            <ShoppingCart className="size-3" />
                                                            Proses PO
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <PaginationLinks links={items.links} />
                    </CardContent>
                </Card>

                {/* Dialog Confirm Create Order */}
                <Dialog
                    open={createOrderOpen}
                    onOpenChange={setCreateOrderOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ShoppingCart className="size-5 text-primary" />
                                Buat Purchase Order dari Bank Permintaan
                            </DialogTitle>
                            <DialogDescription>
                                Item terpilih akan diproses ke draft order pengadaan dan dikeluarkan dari antrean Bank Permintaan.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateOrder} className="space-y-4">
                            <div className="rounded-lg border border-border/70 bg-muted/30 p-3 space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Jumlah Item Terpilih:</span>
                                    <strong className="font-mono text-foreground">{selectedIds.length} item</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Toko Penerima:</span>
                                    <span className="font-medium text-foreground text-right">{selectedStores.join(', ')}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="expected_date" className="text-xs">
                                    Target Tanggal Tiba (Opsional)
                                </Label>
                                <DatePicker
                                    value={expectedDate}
                                    onChange={setExpectedDate}
                                    placeholder="DD/MM/YYYY"
                                    title="Target Tanggal Tiba (DD/MM/YYYY)"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-xs">
                                    Catatan Pengadaan (Opsional)
                                </Label>
                                <Input
                                    id="notes"
                                    placeholder="Contoh: Pengadaan khusus display tambahan..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="h-8.5 text-xs"
                                />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCreateOrderOpen(false)}
                                    disabled={submitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={submitting}
                                    className="gap-1.5"
                                >
                                    <CheckCircle2 className="size-4" />
                                    {submitting ? 'Memproses...' : 'Terbitkan Draft PO'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </main>
        </>
    );
}
