import { Form, Head, Link } from '@inertiajs/react';
import {
    ClipboardList,
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Store,
} from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { RequestStatusBadge } from '@/components/common/request-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type RequestItem = {
    id: number;
    number: string;
    created_at: string;
    required_date?: string | null;
    status: string;
    items_count: number;
    store: { id: number; code: string; name: string };
};
type Store = { id: number; code: string; name: string };
type Props = {
    requests: { data: RequestItem[]; links: PaginationLink[]; current_page?: number; per_page?: number };
    stores: Store[];
    selectedStoreId: number;
    statuses: { value: string; label: string }[];
    filters: { status: string; store_id?: string };
};

export default function StoreRequestIndex({
    requests,
    stores,
    selectedStoreId,
    statuses,
    filters,
}: Props) {
    const selectClass =
        'h-8.5 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

    const currentPage = requests.current_page || 1;
    const perPage = requests.per_page || 15;

    return (
        <>
            <Head title="Permintaan Toko — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Operasional"
                    title="Permintaan (PR)"
                    actions={
                        <Button size="sm" asChild className="h-8 text-xs shadow-xs">
                            <Link href="/store/requests/create">
                                <Plus className="mr-1.5 size-3.5" />
                                Buat Permintaan Baru
                            </Link>
                        </Button>
                    }
                />

                {/* Filter Toolbar */}
                <Card className="border border-border/70 shadow-2xs">
                    <CardContent className="p-3">
                        <Form
                            action="/store/requests"
                            method="get"
                            className="flex flex-wrap items-center gap-2.5"
                        >
                            {stores.length > 1 && (
                                <select
                                    name="store_id"
                                    defaultValue={selectedStoreId}
                                    className={selectClass}
                                    aria-label="Pilih cabang butik"
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
                                aria-label="Filter status"
                            >
                                <option value="">Semua status pengajuan</option>
                                {statuses.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>

                            <Button size="sm" className="h-8.5 px-3 text-xs font-medium shadow-xs">
                                Filter
                            </Button>
                            {filters.status && (
                                <Button variant="ghost" size="sm" className="h-8.5 text-xs" asChild>
                                    <Link href="/store/requests">Reset</Link>
                                </Button>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                {requests.data.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="Belum ada permintaan"
                        description={
                            filters.status
                                ? 'Tidak ada permintaan dengan status tersebut.'
                                : 'Mulai buat draft permintaan pertama untuk kebutuhan butik Anda.'
                        }
                        action={
                            <Button asChild size="sm" className="h-8 text-xs">
                                <Link href="/store/requests/create">
                                    <Plus className="mr-1.5 size-3.5" />
                                    Buat Permintaan Baru
                                </Link>
                            </Button>
                        }
                    />
                ) : (
                    <Card className="overflow-hidden border border-border/70 shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/30 font-medium text-muted-foreground">
                                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                                        <th className="py-2.5 px-3">Nomor Pengajuan</th>
                                        <th className="py-2.5 px-3">Butik Cabang</th>
                                        <th className="py-2.5 px-3 text-center">Item</th>
                                        <th className="py-2.5 px-3">Tanggal Dibuat</th>
                                        <th className="py-2.5 px-3">Dibutuhkan</th>
                                        <th className="py-2.5 px-3 text-center">Status</th>
                                        <th className="py-2.5 px-3 w-16 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {requests.data.map((request, idx) => (
                                        <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-muted-foreground">
                                                {(currentPage - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <Link
                                                    href={`/store/requests/${request.id}`}
                                                    className="font-mono font-bold text-foreground hover:text-primary hover:underline"
                                                >
                                                    {request.number}
                                                </Link>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className="font-semibold text-foreground">
                                                    {request.store.name}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground ml-1.5 font-mono">
                                                    ({request.store.code})
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-mono font-semibold">
                                                {request.items_count}
                                            </td>
                                            <td className="py-2.5 px-3 text-muted-foreground">
                                                {new Date(request.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="py-2.5 px-3 text-muted-foreground">
                                                {request.required_date
                                                    ? new Date(request.required_date).toLocaleDateString('id-ID', {
                                                          day: 'numeric',
                                                          month: 'short',
                                                          year: 'numeric',
                                                      })
                                                    : '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <RequestStatusBadge status={request.status} />
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
                                                                href={`/store/requests/${request.id}`}
                                                                className="flex items-center cursor-pointer"
                                                            >
                                                                <Eye className="mr-2 size-3.5" />
                                                                Lihat Detail
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {request.status === 'DRAFT' && (
                                                            <DropdownMenuItem asChild>
                                                                <Link
                                                                    href={`/store/requests/${request.id}/edit`}
                                                                    className="flex items-center cursor-pointer"
                                                                >
                                                                    <Pencil className="mr-2 size-3.5" />
                                                                    Edit Draft
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t border-border/40 p-3">
                            <PaginationLinks links={requests.links} />
                        </div>
                    </Card>
                )}
            </main>
        </>
    );
}

StoreRequestIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Butik', href: '/store/dashboard' },
        { title: 'Permintaan Toko', href: '/store/requests' },
    ],
};
