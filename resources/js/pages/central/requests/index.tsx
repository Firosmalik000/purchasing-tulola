import { Form, Head, Link } from '@inertiajs/react';
import { ClipboardList, Eye, MoreHorizontal, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { RequestStatusBadge } from '@/components/common/request-status-badge';
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

type RequestItem = {
    id: number;
    number: string;
    created_at: string;
    required_date?: string | null;
    status: string;
    items_count: number;
    store: { id: number; code: string; name: string };
    requester: { id: number; name: string };
};
type Props = {
    requests: {
        data: RequestItem[];
        links: PaginationLink[];
        current_page?: number;
        per_page?: number;
    };
    stores: { id: number; code: string; name: string }[];
    statuses: { value: string; label: string }[];
    types: { value: string; label: string }[];
    filters: {
        store_id: string;
        status: string;
        type: string;
        date_from: string;
        date_to: string;
        keyword: string;
    };
};

export default function CentralRequestIndex({
    requests,
    stores,
    statuses,
    types,
    filters,
}: Props) {
    const hasActiveFilters = Boolean(
        filters.store_id ||
        filters.status ||
        filters.type ||
        filters.date_from ||
        filters.date_to ||
        filters.keyword,
    );

    const selectClass =
        'h-8.5 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

    const currentPage = requests.current_page || 1;
    const perPage = requests.per_page || 15;

    return (
        <>
            <Head title="Antrean Permintaan Toko Cabang — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader badge="Pengadaan" title="Permintaan (PR)" />

                {/* Filter Toolbar */}
                <Card className="border border-border/70 bg-card shadow-2xs">
                    <CardContent className="p-3">
                        <Form
                            action="/central/requests"
                            method="get"
                            className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-[1.5fr_1fr_1fr_1fr_135px_135px_auto]"
                        >
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                                <Input
                                    name="keyword"
                                    defaultValue={filters.keyword}
                                    placeholder="Cari nomor, PIC, item..."
                                    className="h-8.5 pl-8 text-xs"
                                />
                            </div>
                            <div>
                                <select
                                    name="store_id"
                                    defaultValue={filters.store_id}
                                    className={selectClass}
                                    aria-label="Filter toko cabang"
                                >
                                    <option value="">Semua toko cabang</option>
                                    {stores.map((s) => (
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
                                    <option value="">Semua status</option>
                                    {statuses.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
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
                                    <option value="">Semua tipe</option>
                                    {types.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
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
                            <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-1">
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
                                        <Link href="/central/requests">
                                            Reset
                                        </Link>
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
                                ? 'Tidak ada data permintaan yang cocok dengan kriteria filter.'
                                : 'Belum ada permintaan yang diajukan oleh toko cabang.'
                        }
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
                                            Nomor PR
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Toko Cabang Asal
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Diajukan Oleh
                                        </th>
                                        <th className="px-3 py-2.5 text-center">
                                            Item
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Tanggal Dibuat
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
                                    {requests.data.map((request, idx) => (
                                        <tr
                                            key={request.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-3 py-2.5 text-center font-mono text-[11px] text-muted-foreground">
                                                {(currentPage - 1) * perPage +
                                                    idx +
                                                    1}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Link
                                                    href={`/central/requests/${request.id}`}
                                                    className="font-mono font-bold text-foreground hover:text-primary hover:underline"
                                                >
                                                    {request.number}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="font-semibold text-foreground">
                                                    {request.store.name}
                                                </span>
                                                <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                                                    ({request.store.code})
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 font-medium text-foreground">
                                                {request.requester.name}
                                            </td>
                                            <td className="px-3 py-2.5 text-center font-mono font-semibold">
                                                {request.items_count}
                                            </td>
                                            <td className="px-3 py-2.5 text-muted-foreground">
                                                {new Date(
                                                    request.created_at,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <RequestStatusBadge
                                                    status={request.status}
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
                                                                href={`/central/requests/${request.id}`}
                                                                className="flex cursor-pointer items-center"
                                                            >
                                                                <Eye className="mr-2 size-3.5" />
                                                                Tinjau & Proses
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
                            <PaginationLinks pagination={requests} />
                        </div>
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
