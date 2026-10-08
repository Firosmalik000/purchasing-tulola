import { Form, Head, Link } from '@inertiajs/react';
import {
    Eye,
    Filter,
    ListChecks,
    MoreHorizontal,
    Search,
    ShoppingCart,
} from 'lucide-react';
import { MoneyDisplay } from '@/components/common/money-display';
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
    grand_total: string | number | null;
    supplier?: { id: number; code: string; name: string } | null;
    creator: { id: number; name: string };
};
type Props = {
    orders: { data: Order[]; links: PaginationLink[]; current_page?: number; per_page?: number };
    suppliers: { id: number; code: string; name: string }[];
    statuses: { value: string; label: string }[];
    filters: { status: string; supplier_id: string; keyword: string };
};

export default function OrderIndex({
    orders,
    suppliers,
    statuses,
    filters,
}: Props) {
    const hasActiveFilters = Boolean(
        filters.status || filters.supplier_id || filters.keyword,
    );

    const selectClass =
        'h-8.5 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

    const currentPage = orders.current_page || 1;
    const perPage = orders.per_page || 15;

    return (
        <>
            <Head title="Pesanan Pembelian (PO) — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Pengadaan"
                    title="Pesanan (PO)"
                    actions={
                        <Button size="sm" asChild className="h-8 shadow-xs text-xs">
                            <Link href="/central/purchase-planning">
                                <ListChecks className="mr-1.5 size-3.5" />
                                Planning & Terbitkan PO
                            </Link>
                        </Button>
                    }
                />

                {/* Filter Toolbar */}
                <Card className="border border-border/70 shadow-2xs">
                    <CardContent className="p-3">
                        <Form
                            action="/central/orders"
                            method="get"
                            className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-[1fr_220px_180px_auto_auto]"
                        >
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                                <Input
                                    name="keyword"
                                    defaultValue={filters.keyword}
                                    placeholder="Cari nomor PO atau supplier..."
                                    className="h-8.5 pl-8 text-xs"
                                />
                            </div>
                            <div>
                                <select
                                    name="supplier_id"
                                    defaultValue={filters.supplier_id}
                                    className={selectClass}
                                    aria-label="Filter supplier"
                                >
                                    <option value="">Semua supplier</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.code} — {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select
                                    name="status"
                                    defaultValue={filters.status}
                                    className={selectClass}
                                    aria-label="Filter status"
                                >
                                    <option value="">Semua status PO</option>
                                    {statuses.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button size="sm" className="h-8.5 px-3 text-xs font-medium shadow-xs">
                                Filter
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" className="h-8.5 text-xs" asChild>
                                    <Link href="/central/orders">Reset</Link>
                                </Button>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                {orders.data.length === 0 ? (
                    <EmptyState
                        icon={ShoppingCart}
                        title="Belum ada pesanan pembelian"
                        description={
                            hasActiveFilters
                                ? 'Tidak ada pesanan yang sesuai dengan kriteria filter.'
                                : 'Pilih kebutuhan yang disetujui di Purchase Planning untuk membuat PO perdana.'
                        }
                        action={
                            <Button asChild size="sm" className="h-8 text-xs">
                                <Link href="/central/purchase-planning">
                                    Buka Purchase Planning
                                </Link>
                            </Button>
                        }
                    />
                ) : (
                    <Card className="border-border/70 shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/30 font-medium text-muted-foreground">
                                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                                        <th className="py-2.5 px-3">Nomor PO</th>
                                        <th className="py-2.5 px-3">Supplier Rekanan</th>
                                        <th className="py-2.5 px-3">Tanggal Order</th>
                                        <th className="py-2.5 px-3 text-center">Item</th>
                                        <th className="py-2.5 px-3 text-right">Nilai Total</th>
                                        <th className="py-2.5 px-3 text-center">Status</th>
                                        <th className="py-2.5 px-3 w-16 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {orders.data.map((order, idx) => (
                                        <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-muted-foreground">
                                                {(currentPage - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <Link
                                                    href={`/central/orders/${order.id}`}
                                                    className="font-mono font-bold text-foreground hover:text-primary hover:underline"
                                                >
                                                    {order.number}
                                                </Link>
                                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                                    Oleh: {order.creator.name}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                {order.supplier ? (
                                                    <div>
                                                        <span className="font-semibold text-foreground">
                                                            {order.supplier.name}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground ml-1.5 font-mono">
                                                            ({order.supplier.code})
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="italic text-muted-foreground text-[11px]">
                                                        Belum ditentukan
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-muted-foreground">
                                                {new Date(order.order_date).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-mono font-semibold">
                                                {order.items_count}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                                                <MoneyDisplay value={order.grand_total ?? 0} />
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <OrderStatusBadge status={order.status} />
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                            <span className="sr-only">Aksi</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-36 text-xs">
                                                        <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                                                            Tindakan
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link
                                                                href={`/central/orders/${order.id}`}
                                                                className="flex items-center cursor-pointer"
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
                            <PaginationLinks links={orders.links} />
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
        { title: 'Pesanan Pembelian', href: '/central/orders' },
    ],
};
