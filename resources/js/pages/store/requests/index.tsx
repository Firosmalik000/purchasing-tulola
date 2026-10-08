import { Form, Head, Link } from '@inertiajs/react';
import { Calendar, ClipboardList, Plus, Store } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { RequestStatusBadge } from '@/components/common/request-status-badge';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type RequestRow = {
    id: number;
    number: string;
    status: string;
    required_date: string | null;
    created_at: string;
    items_count: number;
    store: { code: string; name: string };
};
type Props = {
    requests: { data: RequestRow[]; links: PaginationLink[] };
    statuses: { value: string; label: string }[];
    filters: { status: string };
};
const selectClass =
    'h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground shadow-xs transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20';

export default function RequestIndex({ requests, statuses, filters }: Props) {
    return (
        <>
            <Head title="Permintaan Butik — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    badge="Pengajuan Butik"
                    title="Permintaan Pengadaan (PR)"
                    description="Ajukan kebutuhan restock rutin dan pesanan khusus display perhiasan ke kantor pusat."
                    actions={
                        <Button asChild className="h-9 shadow-xs">
                            <Link href="/store/requests/create">
                                <Plus className="mr-1.5 size-4" /> Permintaan Baru
                            </Link>
                        </Button>
                    }
                />

                {/* Filter Toolbar */}
                <Card className="border border-border/70 shadow-xs">
                    <CardContent className="p-4">
                        <Form
                            action="/store/requests"
                            method="get"
                            className="flex flex-wrap items-center gap-3"
                        >
                            <select
                                name="status"
                                defaultValue={filters.status}
                                className={selectClass}
                                aria-label="Filter status pengajuan"
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
                            <Button size="sm" className="h-9 px-4 font-medium shadow-xs">
                                Filter
                            </Button>
                            {filters.status && (
                                <Button variant="ghost" size="sm" className="h-9 text-xs" asChild>
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
                            <Button asChild size="sm">
                                <Link href="/store/requests/create">
                                    <Plus className="mr-1.5 size-4" />
                                    Buat Permintaan Baru
                                </Link>
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-4">
                        <div className="grid gap-3">
                            {requests.data.map((request) => (
                                <Card
                                    key={request.id}
                                    className="border border-border/70 shadow-2xs transition-all hover:border-amber-500/40 hover:shadow-xs"
                                >
                                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                        <Link
                                            href={`/store/requests/${request.id}`}
                                            className="min-w-0 flex-1 space-y-1.5"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-xs font-bold text-foreground">
                                                    {request.number}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Store className="size-3" />
                                                    {request.store.code} — {request.store.name}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                <span>
                                                    <strong className="text-foreground">{request.items_count}</strong> item diajukan
                                                </span>
                                                <span>·</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="size-3" />
                                                    Dibuat:{' '}
                                                    {new Date(
                                                        request.created_at,
                                                    ).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                                {request.required_date && (
                                                    <>
                                                        <span>·</span>
                                                        <span>
                                                            Dibutuhkan:{' '}
                                                            {new Date(
                                                                request.required_date,
                                                            ).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                            })}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </Link>

                                        <div className="flex shrink-0 items-center gap-2.5">
                                            <RequestStatusBadge
                                                status={request.status}
                                            />
                                            {request.status === 'DRAFT' ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs font-medium hover:border-amber-500/40 hover:text-amber-900 dark:hover:text-amber-300"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/store/requests/${request.id}/edit`}
                                                    >
                                                        Edit Draft
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/store/requests/${request.id}`}
                                                    >
                                                        Detail
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <PaginationLinks links={requests.links} />
                    </div>
                )}
            </main>
        </>
    );
}

RequestIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Butik', href: '/store/dashboard' },
        { title: 'Permintaan', href: '/store/requests' },
    ],
};

