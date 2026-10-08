import { Form, Head, Link } from '@inertiajs/react';
import { ClipboardList, Search, SlidersHorizontal } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { RequestStatusBadge } from '@/components/common/request-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Option = { value: string; label: string };
type RequestRow = {
    id: number;
    number: string;
    status: string;
    required_date: string | null;
    created_at: string;
    items_count: number;
    store: { code: string; name: string };
    requester: { name: string };
};
type Props = {
    requests: { data: RequestRow[]; links: PaginationLink[] };
    stores: { id: number; code: string; name: string }[];
    statuses: Option[];
    types: Option[];
    filters: Record<
        'store_id' | 'status' | 'type' | 'date_from' | 'date_to' | 'keyword',
        string
    >;
};
const selectClass =
    'h-9 w-full rounded-md border border-input bg-card px-3 text-xs text-foreground shadow-xs transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20';

export default function CentralRequestIndex({
    requests,
    stores,
    statuses,
    types,
    filters,
}: Props) {
    const hasActiveFilters = Boolean(
        filters.keyword ||
            filters.store_id ||
            filters.status ||
            filters.type ||
            filters.date_from ||
            filters.date_to,
    );

    return (
        <>
            <Head title="Antrean Permintaan — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    badge="Verifikasi Pengadaan"
                    title="Antrean Permintaan Butik"
                    description="Tinjau daftar kebutuhan yang diajukan oleh butik cabang, sesuaikan kuantitas persetujuan, dan kirim ke perencanaan pembelian."
                />

                {/* Filter Toolbar */}
                <Card className="border border-border/70 bg-card shadow-xs">
                    <CardContent className="p-4">
                        <Form
                            action="/central/requests"
                            method="get"
                            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7"
                        >
                            <div className="relative sm:col-span-2 xl:col-span-2">
                                <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    name="keyword"
                                    defaultValue={filters.keyword}
                                    placeholder="Cari nomor, butik, PIC, atau item..."
                                    className="h-9 pl-9 text-xs"
                                />
                            </div>
                            <div>
                                <select
                                    name="store_id"
                                    defaultValue={filters.store_id}
                                    className={selectClass}
                                    aria-label="Filter butik"
                                >
                                    <option value="">Semua butik</option>
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id}>
                                            {store.code} — {store.name}
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
                                    <option value="">Semua status</option>
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
                            <div>
                                <select
                                    name="type"
                                    defaultValue={filters.type}
                                    className={selectClass}
                                    aria-label="Filter tipe"
                                >
                                    <option value="">Semua tipe item</option>
                                    {types.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Input
                                    name="date_from"
                                    type="date"
                                    defaultValue={filters.date_from}
                                    aria-label="Tanggal mulai"
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div>
                                <Input
                                    name="date_to"
                                    type="date"
                                    defaultValue={filters.date_to}
                                    aria-label="Tanggal akhir"
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-7 xl:justify-end">
                                <Button size="sm" className="h-9 px-4 font-medium shadow-xs">
                                    <SlidersHorizontal className="mr-1.5 size-3.5" />
                                    Terapkan Filter
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 text-xs text-muted-foreground hover:text-foreground"
                                        asChild
                                    >
                                        <Link href="/central/requests">Reset Filter</Link>
                                    </Button>
                                )}
                            </div>
                        </Form>
                    </CardContent>
                </Card>

                {requests.data.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="Tidak ada antrean permintaan"
                        description={
                            hasActiveFilters
                                ? 'Tidak ada data permintaan yang cocok dengan kriteria filter saat ini.'
                                : 'Belum ada permintaan yang diajukan oleh butik.'
                        }
                    />
                ) : (
                    <Card className="overflow-hidden border border-border/70 shadow-xs">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border/80 bg-muted/40 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-5 py-3.5">Nomor PR</th>
                                            <th className="px-5 py-3.5">Butik Asal</th>
                                            <th className="px-5 py-3.5">Diajukan Oleh</th>
                                            <th className="px-5 py-3.5 text-center">Jumlah Item</th>
                                            <th className="px-5 py-3.5">Tanggal Buat</th>
                                            <th className="px-5 py-3.5">Status</th>
                                            <th className="px-5 py-3.5 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {requests.data.map((request) => (
                                            <tr
                                                key={request.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-5 py-4 font-mono text-xs font-bold text-foreground whitespace-nowrap">
                                                    <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-1">
                                                        {request.number}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-foreground">
                                                        {request.store.name}
                                                    </p>
                                                    <span className="font-mono text-[11px] text-muted-foreground">
                                                        {request.store.code}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-foreground font-medium">
                                                    {request.requester.name}
                                                </td>
                                                <td className="px-5 py-4 text-center font-serif text-sm font-semibold tabular-nums text-foreground">
                                                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                                        {request.items_count}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(
                                                        request.created_at,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        },
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <RequestStatusBadge
                                                        status={request.status}
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
                                                            href={`/central/requests/${request.id}`}
                                                        >
                                                            Tinjau
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t border-border/60 p-4">
                                <PaginationLinks links={requests.links} />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
}

CentralRequestIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Antrean Permintaan', href: '/central/requests' },
    ],
};
