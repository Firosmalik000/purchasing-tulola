import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Filter,
    PackageCheck,
    Store as StoreIcon,
    Truck,
} from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Store = { id: number; code: string; name: string };
type Order = {
    id: number;
    number: string;
    order_date: string;
    expected_date: string | null;
    status: string;
    supplier: { code: string; name: string } | null;
    line_count: number;
    ordered_quantity: string;
    received_quantity: string;
    outstanding_quantity: string;
};
type Props = {
    orders: { data: Order[]; links: PaginationLink[] };
    stores: { id: number; code: string; name: string }[];
    selectedStoreId: number;
    statuses: { value: string; label: string }[];
    filters: { status: string };
};

export default function IncomingIndex({
    orders,
    stores,
    selectedStoreId,
    statuses,
    filters,
}: Props) {
    const activeStore = stores.find((s) => s.id === selectedStoreId);

    return (
        <>
            <Head title="Penerimaan Barang Masuk" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Logistik & Penerimaan Toko"
                    title="Penerimaan Barang Masuk"
                    description={`Pantau kiriman Purchase Order dari supplier untuk alokasi butik ${activeStore ? `${activeStore.code} — ${activeStore.name}` : ''}, dan verifikasi kuantitas fisik yang diterima.`}
                />

                {/* Filter Toolbar Card */}
                <Card className="border-border/70 shadow-xs">
                    <CardContent className="p-4 sm:p-5">
                        <Form
                            action="/store/incoming"
                            method="get"
                            className="flex flex-col gap-4 lg:flex-row lg:items-end"
                        >
                            <div className="grid flex-1 gap-4 sm:grid-cols-2">
                                <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <StoreIcon className="size-3.5 text-muted-foreground" />
                                        Toko / Butik
                                    </span>
                                    <select
                                        name="store_id"
                                        defaultValue={selectedStoreId}
                                        className="form-select-custom h-10 w-full"
                                    >
                                        {stores.map((store) => (
                                            <option key={store.id} value={store.id}>
                                                {store.code} — {store.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Filter className="size-3.5 text-muted-foreground" />
                                        Status Pesanan
                                    </span>
                                    <select
                                        name="status"
                                        defaultValue={filters.status}
                                        className="form-select-custom h-10 w-full"
                                    >
                                        <option value="">Semua Status Pengiriman</option>
                                        {statuses.map((status) => (
                                            <option
                                                key={status.value}
                                                value={status.value}
                                            >
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <Button variant="outline" className="h-10 px-5 font-medium">
                                Terapkan Filter
                            </Button>
                        </Form>
                    </CardContent>
                </Card>

                {orders.data.length === 0 ? (
                    <EmptyState
                        icon={PackageCheck}
                        title="Tidak ada kiriman barang untuk butik ini"
                        description="Purchase Order pusat yang mengalokasikan barang ke toko Anda dan berstatus dikirim akan tampil di sini untuk diverifikasi."
                    />
                ) : (
                    <div className="space-y-3.5">
                        {orders.data.map((order) => {
                            const orderedNum = Number(order.ordered_quantity) || 1;
                            const receivedNum = Number(order.received_quantity) || 0;
                            const percent = Math.min(Math.round((receivedNum / orderedNum) * 100), 100);
                            const isComplete = Number(order.outstanding_quantity) <= 0;

                            return (
                                <Card
                                    key={order.id}
                                    className="border-border/70 shadow-xs transition-colors hover:border-border"
                                >
                                    <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(6.5rem,0.8fr))_auto] lg:items-center">
                                        <div className="min-w-0 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={`/store/incoming/${order.id}?store_id=${selectedStoreId}`}
                                                    className="font-mono text-sm font-bold text-primary hover:underline"
                                                >
                                                    {order.number}
                                                </Link>
                                                <OrderStatusBadge
                                                    status={order.status}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Supplier:{' '}
                                                <span className="font-medium text-foreground">
                                                    {order.supplier?.name ?? 'Pusat / Internal'}
                                                </span>{' '}
                                                · {order.line_count} baris alokasi · Tgl Order: {order.order_date.slice(0, 10)}
                                            </p>
                                            {/* Receiving progress indicator */}
                                            <div className="flex items-center gap-2 pt-1">
                                                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            isComplete
                                                                ? 'bg-emerald-500'
                                                                : 'bg-amber-500'
                                                        }`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <span className="text-[11px] font-medium text-muted-foreground">
                                                    {percent}% diterima
                                                </span>
                                            </div>
                                        </div>

                                        <QuantityBox
                                            label="Total Dialokasi"
                                            value={order.ordered_quantity}
                                            tone="neutral"
                                        />

                                        <QuantityBox
                                            label="Sudah Diterima"
                                            value={order.received_quantity}
                                            tone="success"
                                        />

                                        <QuantityBox
                                            label="Outstanding Sisa"
                                            value={order.outstanding_quantity}
                                            tone={isComplete ? 'neutral' : 'warning'}
                                        />

                                        <div className="flex items-center justify-end">
                                            <Button
                                                size="sm"
                                                className="gap-2 font-medium"
                                                asChild
                                            >
                                                <Link
                                                    href={`/store/incoming/${order.id}?store_id=${selectedStoreId}`}
                                                >
                                                    Buka Penerimaan
                                                    <ArrowRight className="size-3.5" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        <PaginationLinks links={orders.links} />
                    </div>
                )}
            </main>
        </>
    );
}

function QuantityBox({
    label,
    value,
    tone = 'neutral',
}: {
    label: string;
    value: string;
    tone?: 'neutral' | 'success' | 'warning';
}) {
    const toneStyles = {
        neutral: 'bg-muted/40 text-foreground',
        success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold',
    }[tone];

    return (
        <div className={`rounded-lg p-2.5 text-center ${toneStyles}`}>
            <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
            <p className="mt-0.5 font-mono text-sm tabular-nums">{value}</p>
        </div>
    );
}

IncomingIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Toko', href: '/store/dashboard' },
        { title: 'Barang Masuk', href: '#' },
    ],
};
