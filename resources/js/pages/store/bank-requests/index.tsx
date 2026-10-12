import { Form, Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    Boxes,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    RotateCcw,
    Search,
    ShoppingBag,
    Truck,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
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
    bank_quantity: number | null;
    bank_ordered_at: string | null;
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
    order_allocations?: {
        id: number;
        allocated_quantity: number;
        purchase_order_item?: {
            id: number;
            purchase_order?: {
                id: number;
                number: string;
                status: string;
                order_date: string;
            } | null;
        } | null;
    }[];
};

type Store = { id: number; code: string; name: string };

type Props = {
    items: {
        data: BankRequestItem[];
        links: PaginationLink[];
        total?: number;
        current_page?: number;
        per_page?: number;
    };
    stores: Store[];
    selectedStoreId: number;
    stats: {
        pending_items: number;
        pending_quantity: number;
        ordered_items: number;
    };
    filters: {
        status: string;
        store_id: string;
        keyword: string;
        date_from: string;
        date_to: string;
    };
};

export default function StoreBankRequestIndex({
    items,
    stores,
    selectedStoreId,
    stats,
    filters,
}: Props) {
    const hasActiveFilters = Boolean(
        filters.keyword ||
        filters.date_from ||
        filters.date_to ||
        (filters.status && filters.status !== 'pending'),
    );

    const selectClass =
        'h-8.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

    return (
        <>
            <Head title="Bank Permintaan — Portal Toko Tulola" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Operasional Toko"
                    title="Bank Permintaan (Item Tertunda)"
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
                                    Menunggu Pengadaan
                                </p>
                                <p className="font-mono text-xl font-bold text-foreground">
                                    {stats.pending_items}{' '}
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
                                    Total Kuantitas Tertunda
                                </p>
                                <p className="font-mono text-xl font-bold text-foreground">
                                    {formatQuantity(stats.pending_quantity)}{' '}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        unit
                                    </span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-border/70 shadow-2xs">
                        <CardContent className="flex items-center gap-3.5 p-4">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Sudah Diproses ke Order
                                </p>
                                <p className="font-mono text-xl font-bold text-foreground">
                                    {stats.ordered_items}{' '}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        item
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
                            action="/store/bank-requests"
                            method="get"
                            className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-[1.5fr_1.2fr_135px_135px_140px_auto]"
                        >
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                                <Input
                                    name="keyword"
                                    defaultValue={filters.keyword}
                                    placeholder="Cari item, no. PR, alasan..."
                                    className="h-8.5 pl-8 text-xs"
                                />
                            </div>

                            {stores.length > 1 && (
                                <div>
                                    <select
                                        name="store_id"
                                        defaultValue={selectedStoreId}
                                        className={selectClass}
                                    >
                                        {stores.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.code} — {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <select
                                    name="status"
                                    defaultValue={filters.status || 'pending'}
                                    className={selectClass}
                                >
                                    <option value="pending">
                                        Menunggu Pengadaan
                                    </option>
                                    <option value="ordered">
                                        Sudah Dibuatkan PO
                                    </option>
                                    <option value="all">Semua Status</option>
                                </select>
                            </div>

                            <div>
                                <Input
                                    type="date"
                                    name="date_from"
                                    defaultValue={filters.date_from}
                                    className="h-8.5 text-xs font-mono"
                                    title="Dari Tanggal Pengajuan"
                                />
                            </div>

                            <div>
                                <Input
                                    type="date"
                                    name="date_to"
                                    defaultValue={filters.date_to}
                                    className="h-8.5 text-xs font-mono"
                                    title="Sampai Tanggal Pengajuan"
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
                                        <Link href="/store/bank-requests">
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
                                        ? 'Tidak ditemukan permintaan khusus yang cocok dengan kriteria filter.'
                                        : 'Toko saat ini tidak memiliki item permintaan khusus yang ditunda di Bank Permintaan.'
                                }
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-border/60 bg-muted/30 font-semibold text-muted-foreground">
                                            <th className="px-3 py-2.5">
                                                Item Permintaan Khusus
                                            </th>
                                            <th className="px-3 py-2.5">
                                                PR Asal
                                            </th>
                                            <th className="px-3 py-2.5 text-right">
                                                Qty di Bank
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Target Dibutuhkan
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Status Pengadaan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {items.data.map((item) => {
                                            const qty =
                                                item.bank_quantity ??
                                                item.approved_quantity ??
                                                item.requested_quantity;

                                            // Find order linked to this bank item if ordered
                                            const latestOrder =
                                                item.order_allocations?.[
                                                    item.order_allocations.length - 1
                                                ]?.purchase_order_item
                                                    ?.purchase_order;

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="transition-colors hover:bg-muted/30"
                                                >
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
                                                        <Link
                                                            href={`/store/requests/${item.purchase_request.id}`}
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
                                                            {formatQuantity(qty)}
                                                        </span>{' '}
                                                        <span className="text-muted-foreground">
                                                            {item.unit.symbol}
                                                        </span>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Diminta:{' '}
                                                            {formatQuantity(
                                                                item.requested_quantity,
                                                            )}
                                                        </p>
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
                                                    <td className="px-3 py-3">
                                                        {item.bank_ordered_at ? (
                                                            <div className="space-y-1">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-emerald-300 bg-emerald-500/10 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                                                                >
                                                                    <CheckCircle2 className="mr-1 size-3" />
                                                                    Sudah Diterbitkan PO
                                                                </Badge>
                                                                {latestOrder && (
                                                                    <div>
                                                                        <Link
                                                                            href={`/store/incoming/${latestOrder.id}`}
                                                                            className="font-mono text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                                                                        >
                                                                            <Truck className="size-3" />
                                                                            {
                                                                                latestOrder.number
                                                                            }
                                                                        </Link>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-0.5">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-amber-300 bg-amber-500/10 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
                                                                >
                                                                    <Clock className="mr-1 size-3" />
                                                                    Menunggu Stok
                                                                </Badge>
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    Dalam antrean Bank Permintaan
                                                                </p>
                                                            </div>
                                                        )}
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
            </main>
        </>
    );
}
