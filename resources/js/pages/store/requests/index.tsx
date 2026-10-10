import { Form, Head, Link, router } from '@inertiajs/react';
import {
    ClipboardList,
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Send,
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
import { Input } from '@/components/ui/input';
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
    requests: {
        data: RequestItem[];
        links: PaginationLink[];
        current_page?: number;
        per_page?: number;
    };
    stores: Store[];
    selectedStoreId: number;
    statuses: { value: string; label: string }[];
    filters: {
        status: string;
        store_id?: string;
        date_from?: string;
        date_to?: string;
    };
};

export default function StoreRequestIndex({
    requests,
    stores,
    selectedStoreId,
    statuses,
    filters,
}: Props) {
    const hasActiveFilters = Boolean(
        filters.status || filters.date_from || filters.date_to,
    );

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
                        <Button
                            size="sm"
                            asChild
                            className="h-8 text-xs shadow-xs"
                        >
                            <Link href="/store/requests/create">
                                <Plus className="mr-1.5 size-3.5" />
                                Permintaan Baru
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
                                    aria-label="Pilih toko cabang"
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
                                : 'Mulai buat draft permintaan pertama untuk kebutuhan toko cabang Anda.'
                        }
                        action={
                            <Button asChild size="sm" className="h-8 text-xs">
                                <Link href="/store/requests/create">
                                    <Plus className="mr-1.5 size-3.5" />
                                    Permintaan Baru
                                </Link>
                            </Button>
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
                                            Nomor Pengajuan
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Toko Cabang
                                        </th>
                                        <th className="px-3 py-2.5 text-center">
                                            Item
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Tanggal Dibuat
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Dibutuhkan
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
                                                    href={`/store/requests/${request.id}`}
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
                                            <td className="px-3 py-2.5 text-muted-foreground">
                                                {request.required_date
                                                    ? new Date(
                                                          request.required_date,
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
                                                                href={`/store/requests/${request.id}`}
                                                                className="flex cursor-pointer items-center"
                                                            >
                                                                <Eye className="mr-2 size-3.5" />
                                                                Detail
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {request.status ===
                                                            'DRAFT' && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={`/store/requests/${request.id}/edit`}
                                                                        className="flex cursor-pointer items-center"
                                                                    >
                                                                        <Pencil className="mr-2 size-3.5" />
                                                                        Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        if (
                                                                            confirm(
                                                                                `Ajukan pengajuan ${request.number} ke kantor pusat?`,
                                                                            )
                                                                        ) {
                                                                            router.post(
                                                                                `/store/requests/${request.id}/submit`,
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="flex cursor-pointer items-center text-amber-600 focus:text-amber-600 dark:text-amber-400"
                                                                >
                                                                    <Send className="mr-2 size-3.5" />
                                                                    Ajukan
                                                                </DropdownMenuItem>
                                                            </>
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
                            <PaginationLinks pagination={requests} />
                        </div>
                    </Card>
                )}
            </main>
        </>
    );
}

StoreRequestIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Toko Cabang', href: '/store/dashboard' },
        { title: 'Permintaan Toko', href: '/store/requests' },
    ],
};
