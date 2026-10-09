import { Form, Head, Link } from '@inertiajs/react';
import { Eye, MoreHorizontal, PackageCheck } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatQuantity } from '@/lib/utils';

type IncomingSummary = {
    id: number;
    number: string;
    order_date: string;
    expected_date?: string | null;
    status: string;
    line_count: number;
    ordered_quantity: number;
    received_quantity: number;
    outstanding_quantity: number;
};
type Store = { id: number; code: string; name: string };
type Props = {
    orders: {
        data: IncomingSummary[];
        links: PaginationLink[];
        current_page?: number;
        per_page?: number;
    };
    stores: Store[];
    selectedStoreId: number;
    statuses: { value: string; label: string }[];
    filters: {
        status: string;
        date_from?: string;
        date_to?: string;
    };
};

export default function IncomingOrderIndex({
    orders,
    stores,
    selectedStoreId,
    statuses,
    filters,
}: Props) {
    const hasActiveFilters = Boolean(
        filters.status ||
        filters.date_from ||
        filters.date_to,
    );

    const selectClass =
        'h-8.5 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

    const currentPage = orders.current_page || 1;
    const perPage = orders.per_page || 15;

    return (
        <>
            <Head title="Order Toko — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader badge="Pengadaan" title="Order Toko" />

                {/* Filter Toolbar */}
                <Card className="border border-border/70 shadow-2xs">
                    <CardContent className="p-3">
                        <Form
                            action="/store/incoming"
                            method="get"
                            className="flex flex-wrap items-center gap-2.5"
                        >
                            {stores.length > 1 && (
                                <select
                                    name="store_id"
                                    defaultValue={selectedStoreId}
                                    className={selectClass}
                                    aria-label="Pilih toko"
                                >
                                    {stores.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code})
                                        </option>
                                    ))}
                                </select>
                            )}

                            <select
                                name="status"
                                defaultValue={filters.status}
                                className={selectClass}
                                aria-label="Filter status order"
                            >
                                <option value="">Semua Status Order</option>
                                {statuses.map((status) => (
                                    <option
                                        key={status.value}
                                        value={status.value}
                                    >
                                        {status.label}
                                    </option>
                                ))}
                            </select>

                            <Input
                                type="date"
                                name="date_from"
                                defaultValue={filters.date_from}
                                className="h-8.5 w-auto text-xs"
                                aria-label="Tanggal mulai"
                                title="Tanggal mulai"
                            />

                            <Input
                                type="date"
                                name="date_to"
                                defaultValue={filters.date_to}
                                className="h-8.5 w-auto text-xs"
                                aria-label="Tanggal akhir"
                                title="Tanggal akhir"
                            />

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
                                    <Link href="/store/incoming">Reset</Link>
                                </Button>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                {orders.data.length === 0 ? (
                    <EmptyState
                        icon={PackageCheck}
                        title="Belum ada order untuk toko cabang ini"
                        description="Order otomatis muncul setelah permintaan disetujui pusat. Status proses, pengiriman, dan penerimaan dapat dipantau dari sini."
                    />
                ) : (
                    <Card className="overflow-hidden border border-border/70 shadow-2xs">
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
                                        <th className="px-3 py-2.5">Sumber</th>
                                        <th className="px-3 py-2.5">
                                            Estimasi Kedatangan
                                        </th>
                                        <th className="px-3 py-2.5 text-center">
                                            Dialokasikan
                                        </th>
                                        <th className="px-3 py-2.5 text-center">
                                            Diterima
                                        </th>
                                        <th className="px-3 py-2.5 text-center">
                                            Sisa (Outstanding)
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
                                    {orders.data.map((order, idx) => {
                                        const isComplete =
                                            Number(
                                                order.outstanding_quantity,
                                            ) <= 0;
                                        const canReceive = [
                                            'ORDERED',
                                            'PARTIALLY_RECEIVED',
                                        ].includes(order.status);
                                        return (
                                            <tr
                                                key={order.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-3 py-2.5 text-center font-mono text-[11px] text-muted-foreground">
                                                    {(currentPage - 1) *
                                                        perPage +
                                                        idx +
                                                        1}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <Link
                                                        href={`/store/incoming/${order.id}?store_id=${selectedStoreId}`}
                                                        className="font-mono font-bold text-foreground hover:text-primary hover:underline"
                                                    >
                                                        {order.number}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-2.5 font-medium text-foreground">
                                                    Purchasing Pusat
                                                </td>
                                                <td className="px-3 py-2.5 text-muted-foreground">
                                                    {order.expected_date
                                                        ? new Date(
                                                              order.expected_date,
                                                          ).toLocaleDateString(
                                                              'id-ID',
                                                              {
                                                                  day: 'numeric',
                                                                  month: 'short',
                                                                  year: 'numeric',
                                                              },
                                                          )
                                                        : '-'}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono font-semibold">
                                                    {formatQuantity(
                                                        order.ordered_quantity,
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatQuantity(
                                                        order.received_quantity,
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono font-bold">
                                                    {isComplete ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-emerald-500/30 text-[10px] text-emerald-600"
                                                        >
                                                            Lengkap
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-amber-600 dark:text-amber-400">
                                                            {formatQuantity(
                                                                order.outstanding_quantity,
                                                            )}
                                                        </span>
                                                    )}
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
                                                                    href={`/store/incoming/${order.id}?store_id=${selectedStoreId}`}
                                                                    className="flex cursor-pointer items-center"
                                                                >
                                                                    {canReceive ? (
                                                                        <PackageCheck className="mr-2 size-3.5" />
                                                                    ) : (
                                                                        <Eye className="mr-2 size-3.5" />
                                                                    )}
                                                                    {canReceive
                                                                        ? 'Terima Barang'
                                                                        : 'Lihat Detail'}
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })}
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

IncomingOrderIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Toko Cabang', href: '/store/dashboard' },
        { title: 'Order Toko', href: '/store/incoming' },
    ],
};
