import { Form, Head, Link } from '@inertiajs/react';
import { Search, ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { MoneyDisplay } from '@/components/common/money-display';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Order = {
    id: number;
    number: string;
    status: string;
    order_date: string;
    items_count: number;
    grand_total: string | null;
    supplier: { code: string; name: string } | null;
    creator: { name: string };
};
type Props = {
    orders: { data: Order[]; links: PaginationLink[] };
    suppliers: { id: number; code: string; name: string }[];
    statuses: { value: string; label: string }[];
    filters: { status: string; supplier_id: string; keyword: string };
};
const selectClass =
    'h-9 w-full rounded-md border border-input bg-card px-3 text-xs text-foreground shadow-xs transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20';

export default function OrderIndex({
    orders,
    suppliers,
    statuses,
    filters,
}: Props) {
    const hasActiveFilters = Boolean(
        filters.keyword || filters.supplier_id || filters.status,
    );

    return (
        <>
            <Head title="Pesanan Pembelian (PO) — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    badge="Manajemen PO"
                    title="Pesanan Pembelian (PO)"
                    description="Pantau seluruh Purchase Order ke rekanan supplier, penetapan harga, termin pembayaran, dan pemenuhan barang."
                    actions={
                        <Button asChild className="h-9 shadow-xs">
                            <Link href="/central/purchase-planning">
                                <ShoppingCart className="mr-1.5 size-4" />
                                Buat PO Baru via Planning
                            </Link>
                        </Button>
                    }
                />

                {/* Filter Toolbar */}
                <Card className="border border-border/70 shadow-xs">
                    <CardContent className="p-4">
                        <Form
                            action="/central/orders"
                            method="get"
                            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_240px_180px_auto_auto]"
                        >
                            <div className="relative">
                                <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    name="keyword"
                                    defaultValue={filters.keyword}
                                    placeholder="Cari nomor PO atau nama supplier..."
                                    className="h-9 pl-9 text-xs"
                                />
                            </div>
                            <div>
                                <select
                                    name="supplier_id"
                                    defaultValue={filters.supplier_id}
                                    className={selectClass}
                                    aria-label="Filter supplier"
                                >
                                    <option value="">Semua rekanan supplier</option>
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
                            <div>
                                <select
                                    name="status"
                                    defaultValue={filters.status}
                                    className={selectClass}
                                    aria-label="Filter status"
                                >
                                    <option value="">Semua status PO</option>
                                    {statuses.map((status) => (
                                        <option
                                            key={status.value}
                                            value={status.value}
                                        >
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button size="sm" className="h-9 px-4 font-medium shadow-xs">
                                Terapkan Filter
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" className="h-9 text-xs" asChild>
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
                                : 'Pilih kebutuhan yang disetujui di Purchase Planning untuk membuat PO perdana ke supplier.'
                        }
                        action={
                            <Button asChild size="sm">
                                <Link href="/central/purchase-planning">
                                    Buka Purchase Planning
                                </Link>
                            </Button>
                        }
                    />
                ) : (
                    <Card className="overflow-hidden border border-border/70 shadow-xs">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border/80 bg-muted/40 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-5 py-3.5">Nomor PO</th>
                                            <th className="px-5 py-3.5">Supplier Rekanan</th>
                                            <th className="px-5 py-3.5">Tanggal Order</th>
                                            <th className="px-5 py-3.5 text-center">Jumlah Item</th>
                                            <th className="px-5 py-3.5 text-right">Nilai Total</th>
                                            <th className="px-5 py-3.5">Status</th>
                                            <th className="px-5 py-3.5 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {orders.data.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-5 py-4 font-mono text-xs font-bold whitespace-nowrap">
                                                    <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-1">
                                                        {order.number}
                                                    </span>
                                                    <p className="mt-1 text-[11px] font-normal text-muted-foreground">
                                                        Oleh: {order.creator.name}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {order.supplier ? (
                                                        <>
                                                            <p className="font-semibold text-foreground">
                                                                {order.supplier.name}
                                                            </p>
                                                            <span className="font-mono text-[11px] text-muted-foreground">
                                                                {order.supplier.code}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs italic text-muted-foreground">
                                                            Belum ditentukan
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(order.order_date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-5 py-4 text-center font-serif text-sm font-semibold tabular-nums text-foreground">
                                                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                                        {order.items_count}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono font-bold text-foreground">
                                                    <MoneyDisplay
                                                        value={
                                                            order.grand_total ??
                                                            0
                                                        }
                                                    />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <OrderStatusBadge
                                                        status={order.status}
                                                    />
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs font-medium hover:border-amber-500/40 hover:text-amber-900 dark:hover:text-amber-300"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/central/orders/${order.id}`}
                                                        >
                                                            Detail PO
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t border-border/60 p-4">
                                <PaginationLinks links={orders.links} />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
}

OrderIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Pesanan (PO)', href: '/central/orders' },
    ],
};
