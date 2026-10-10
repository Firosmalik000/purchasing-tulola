import { Form, Head, Link } from '@inertiajs/react';
import { Eye, MoreHorizontal, Search, ShoppingCart } from 'lucide-react';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

type Order = {
    id: number;
    number: string;
    order_date: string;
    status: string;
    items_count: number;
    purchase_request?: {
        number: string;
        store: { code: string; name: string };
    } | null;
    creator: { id: number; name: string };
};
type Props = {
    orders: {
        data: Order[];
        links: PaginationLink[];
        current_page?: number;
        per_page?: number;
    };
    statuses: { value: string; label: string }[];
    filters: {
        status: string;
        keyword: string;
        date_from?: string;
        date_to?: string;
    };
};

export default function OrderIndex({ orders, statuses, filters }: Props) {
    const hasActiveFilters = Boolean(
        filters.status ||
        filters.keyword ||
        filters.date_from ||
        filters.date_to,
    );

    const selectClass =
        'h-8.5 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

    const currentPage = orders.current_page || 1;
    const perPage = orders.per_page || 15;

    return (
        <>
            <Head title="Order Internal — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Distribusi Internal"
                    title="Order Internal"
                />

                {/* Filter Toolbar */}
                <Card className="border border-border/70 shadow-2xs">
                    <CardContent className="p-3">
                        <Form
                            action="/central/orders"
                            method="get"
                            className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-[1fr_160px_135px_135px_auto]"
                        >
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                                <Input
                                    name="keyword"
                                    defaultValue={filters.keyword}
                                    placeholder="Cari order, request, atau toko..."
                                    className="h-8.5 pl-8 text-xs"
                                />
                            </div>
                            <div>
                                <select
                                    name="status"
                                    defaultValue={filters.status}
                                    className={selectClass}
                                    aria-label="Filter status"
                                >
                                    <option value="">Semua status</option>
                                    {statuses.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Input
                                    type="date"
                                    name="date_from"
                                    defaultValue={filters.date_from}
                                    className="h-8.5 text-xs"
                                    aria-label="Tanggal mulai"
                                    title="Tanggal mulai"
                                />
                            </div>
                            <div>
                                <Input
                                    type="date"
                                    name="date_to"
                                    defaultValue={filters.date_to}
                                    className="h-8.5 text-xs"
                                    aria-label="Tanggal akhir"
                                    title="Tanggal akhir"
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2 md:col-span-1">
                                <Button
                                    size="sm"
                                    className="h-8.5 px-3 text-xs font-medium shadow-xs"
                                >
                                    Filter
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8.5 text-xs"
                                        asChild
                                    >
                                        <Link href="/central/orders">
                                            Reset
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </Form>
                    </CardContent>
                </Card>

                {orders.data.length === 0 ? (
                    <EmptyState
                        icon={ShoppingCart}
                        title="Belum ada order internal"
                        description={
                            hasActiveFilters
                                ? 'Tidak ada pesanan yang sesuai dengan kriteria filter.'
                                : 'Order berstatus Proses dibuat otomatis saat request disetujui.'
                        }
                    />
                ) : (
                    <Card className="overflow-hidden border-border/70 shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/30 font-medium text-muted-foreground">
                                        <th className="w-12 px-3 py-2.5 text-center">
                                            #
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Nomor Order
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Request / Toko
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Tanggal Order
                                        </th>
                                        <th className="px-3 py-2.5 text-center">
                                            Item
                                        </th>
                                        <th className="px-3 py-2.5 text-center">
                                            Status
                                        </th>
                                        <th className="w-16 px-3 py-2.5 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {orders.data.map((order, idx) => (
                                        <tr
                                            key={order.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-3 py-2.5 text-center font-mono text-[11px] text-muted-foreground">
                                                {(currentPage - 1) * perPage +
                                                    idx +
                                                    1}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Link
                                                    href={`/central/orders/${order.id}`}
                                                    className="font-mono font-bold text-foreground hover:text-primary hover:underline"
                                                >
                                                    {order.number}
                                                </Link>
                                                <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                    Oleh: {order.creator.name}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="font-mono font-semibold">
                                                    {order.purchase_request
                                                        ?.number ?? 'Data lama'}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {order.purchase_request
                                                        ? `${order.purchase_request.store.code} — ${order.purchase_request.store.name}`
                                                        : 'Tanpa request langsung'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-muted-foreground">
                                                {new Date(
                                                    order.order_date,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-3 py-2.5 text-center font-mono font-semibold">
                                                {order.items_count}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <OrderStatusBadge
                                                    status={order.status}
                                                />
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                            <span className="sr-only">
                                                                Aksi
                                                            </span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-36 text-xs"
                                                    >
                                                        <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                                                            Tindakan
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/central/orders/${order.id}`}
                                                                className="flex cursor-pointer items-center"
                                                            >
                                                                <Eye className="mr-2 size-3.5" />
                                                                Lihat Detail
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t border-border/40 p-3">
                            <PaginationLinks pagination={orders} />
                        </div>
                    </Card>
                )}
            </main>
        </>
    );
}

OrderIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Order Internal', href: '/central/orders' },
    ],
};
