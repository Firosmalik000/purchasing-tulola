import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowUpRight,
    Calendar,
    Clock,
    FileText,
    History as HistoryIcon,
    Package,
    Pencil,
    Send,
    Sparkles,
    Truck,
} from 'lucide-react';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { PageHeader } from '@/components/common/page-header';
import { SampleImagePreview } from '@/components/common/sample-image-preview';
import {
    RequestStatusBadge,
    requestStatusLabel,
} from '@/components/common/request-status-badge';
import {
    getPurchaseRequestSteps,
    WorkflowStepper,
} from '@/components/common/workflow-stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatQuantity } from '@/lib/utils';

type RequestItem = {
    id: number;
    type: 'STOCK' | 'SPECIAL';
    item: { sku: string; name: string } | null;
    name: string | null;
    description: string | null;
    sample_image_url: string | null;
    unit: { name: string; symbol: string };
    current_stock_snapshot: number | null;
    standard_stock_snapshot: number | null;
    suggested_quantity: number | null;
    requested_quantity: number;
    approved_quantity: number | null;
    required_date: string | null;
    reason: string | null;
};
type History = {
    id: number;
    from_status: string | null;
    to_status: string;
    created_at: string;
    changer: { name: string } | null;
};
type PurchaseRequest = {
    id: number;
    number: string;
    status: string;
    required_date: string | null;
    notes: string | null;
    submitted_at: string | null;
    store: { id: number; code: string; name: string };
    purchase_order: {
        id: number;
        number: string;
        status: string;
        expected_date: string | null;
    } | null;
    items: RequestItem[];
    status_histories: History[];
};

export default function RequestShow({
    purchaseRequest,
}: {
    purchaseRequest: PurchaseRequest;
}) {
    const regular = purchaseRequest.items.filter(
        (line) => line.type === 'STOCK',
    );
    const special = purchaseRequest.items.filter(
        (line) => line.type === 'SPECIAL',
    );

    const steps = getPurchaseRequestSteps(purchaseRequest.status);
    const order = purchaseRequest.purchase_order;
    const orderCanBeReceived = ['ORDERED', 'PARTIALLY_RECEIVED'].includes(
        order?.status ?? '',
    );

    return (
        <>
            <Head title={`Permintaan ${purchaseRequest.number}`} />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Detail PR"
                    title={purchaseRequest.number}
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            <RequestStatusBadge
                                status={purchaseRequest.status}
                            />
                            {purchaseRequest.status === 'DRAFT' && (
                                <>
                                    <Button
                                        variant="outline"
                                        className="gap-1.5"
                                        asChild
                                    >
                                        <Link
                                            href={`/store/requests/${purchaseRequest.id}/edit`}
                                        >
                                            <Pencil className="size-3.5" /> Edit
                                        </Link>
                                    </Button>
                                    <Form
                                        action={`/store/requests/${purchaseRequest.id}/submit`}
                                        method="post"
                                    >
                                        {({ processing }) => (
                                            <Button
                                                disabled={
                                                    processing ||
                                                    purchaseRequest.items
                                                        .length === 0
                                                }
                                                className="gap-1.5 bg-amber-600 font-medium text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                                            >
                                                <Send className="size-3.5" />{' '}
                                                Ajukan
                                            </Button>
                                        )}
                                    </Form>
                                </>
                            )}
                            <Button variant="outline" asChild>
                                <Link href="/store/requests">
                                    <ArrowLeft className="size-4" /> Kembali
                                </Link>
                            </Button>
                        </div>
                    }
                />

                {/* Workflow Stepper */}
                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                            Alur Proses Pengadaan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <WorkflowStepper
                            steps={steps}
                            completionLabel="Disetujui"
                        />
                    </CardContent>
                </Card>

                {order && (
                    <Card className="border-border/70 shadow-xs">
                        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
                                    <Truck className="size-5" />
                                </div>
                                <div className="min-w-0 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-mono text-sm font-bold text-foreground">
                                            {order.number}
                                        </p>
                                        <OrderStatusBadge
                                            status={order.status}
                                        />
                                    </div>
                                    <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                                        {order.status === 'DRAFT'
                                            ? 'Permintaan sudah menjadi order dan sedang diproses purchasing pusat.'
                                            : orderCanBeReceived
                                              ? 'Order sudah dikirim. Konfirmasikan jumlah barang setelah diterima dan diperiksa.'
                                              : order.status === 'COMPLETED'
                                                ? 'Seluruh barang pada order ini sudah diterima.'
                                                : 'Order dibatalkan oleh purchasing pusat.'}
                                    </p>
                                    {order.expected_date && (
                                        <p className="text-xs font-medium text-foreground">
                                            Estimasi tiba:{' '}
                                            {new Date(
                                                order.expected_date,
                                            ).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant={
                                    orderCanBeReceived ? 'default' : 'outline'
                                }
                                className="shrink-0 gap-1.5"
                                asChild
                            >
                                <Link
                                    href={`/store/incoming/${order.id}?store_id=${purchaseRequest.store.id}`}
                                >
                                    {orderCanBeReceived
                                        ? 'Terima Barang'
                                        : 'Lihat Order'}
                                    <ArrowUpRight className="size-3.5" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Document Information Meta */}
                <Card className="border-border/70 shadow-xs">
                    <CardContent className="grid gap-5 p-5 sm:grid-cols-3">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Calendar className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Target Tanggal Dibutuhkan
                                </p>
                                <p className="mt-1 font-medium text-foreground">
                                    {purchaseRequest.required_date?.slice(
                                        0,
                                        10,
                                    ) ?? 'Tidak ditentukan'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Clock className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Waktu Diajukan ke Pusat
                                </p>
                                <p className="mt-1 font-medium text-foreground">
                                    {purchaseRequest.submitted_at
                                        ? new Date(
                                              purchaseRequest.submitted_at,
                                          ).toLocaleString('id-ID', {
                                              dateStyle: 'medium',
                                              timeStyle: 'short',
                                          })
                                        : 'Belum diajukan (Draft)'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Catatan Pengajuan
                                </p>
                                <p className="mt-1 font-medium text-foreground">
                                    {purchaseRequest.notes || '—'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Regular Stock Items */}
                {regular.length > 0 && (
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="border-b border-border/40 px-5 py-3.5">
                            <div className="flex items-center gap-2">
                                <Package className="size-4 text-amber-600 dark:text-amber-400" />
                                <CardTitle className="text-sm font-semibold">
                                    Item Stok Reguler ({regular.length} item)
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2.5 p-5">
                            {regular.map((line) => (
                                <div
                                    key={line.id}
                                    className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {line.item?.name}
                                        </p>
                                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                            {line.item?.sku} · Satuan:{' '}
                                            {line.unit.symbol}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-center">
                                            <p className="text-[10px] font-semibold text-primary uppercase">
                                                Diminta Toko
                                            </p>
                                            <p className="font-mono text-xs font-bold text-primary tabular-nums">
                                                {formatQuantity(
                                                    line.requested_quantity,
                                                )}{' '}
                                                {line.unit.symbol}
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-center">
                                            <p className="text-[10px] font-semibold text-emerald-700 uppercase dark:text-emerald-300">
                                                Disetujui Pusat
                                            </p>
                                            <p className="font-mono text-xs font-bold text-emerald-700 tabular-nums dark:text-emerald-300">
                                                {line.approved_quantity !== null
                                                    ? `${formatQuantity(line.approved_quantity)} ${line.unit.symbol}`
                                                    : 'Menunggu Review'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Special Items */}
                {special.length > 0 && (
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="border-b border-border/40 px-5 py-3.5">
                            <div className="flex items-center gap-2">
                                <Sparkles className="size-4 text-sky-600 dark:text-sky-400" />
                                <CardTitle className="text-sm font-semibold">
                                    Permintaan Kebutuhan Khusus (
                                    {special.length} item)
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3.5 p-5">
                            {special.map((line) => (
                                <div
                                    key={line.id}
                                    className="rounded-xl border border-border/70 bg-card p-4"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row">
                                        {line.sample_image_url && (
                                            <SampleImagePreview
                                                src={line.sample_image_url}
                                                itemName={
                                                    line.name ??
                                                    'permintaan khusus'
                                                }
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="font-semibold text-foreground">
                                                        {line.name}
                                                    </p>
                                                    {line.description && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {line.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                                                        Diminta:{' '}
                                                        {formatQuantity(
                                                            line.requested_quantity,
                                                        )}{' '}
                                                        {line.unit.symbol}
                                                    </span>
                                                    <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                                        Disetujui:{' '}
                                                        {line.approved_quantity !==
                                                        null
                                                            ? `${formatQuantity(line.approved_quantity)} ${line.unit.symbol}`
                                                            : 'Menunggu'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        Target Dibutuhkan:
                                                    </span>{' '}
                                                    <span className="font-medium text-foreground">
                                                        {line.required_date?.slice(
                                                            0,
                                                            10,
                                                        ) ?? '—'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        Alasan Pengajuan:
                                                    </span>{' '}
                                                    <span className="font-medium text-foreground">
                                                        {line.reason ?? '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Audit Trail & History */}
                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <HistoryIcon className="size-4" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Riwayat & Jejak Status Dokumen
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Catatan kronologis perubahan status oleh PIC
                                    toko dan tim pusat
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5">
                        {purchaseRequest.status_histories.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Belum ada riwayat tercatat.
                            </p>
                        ) : (
                            purchaseRequest.status_histories.map((history) => (
                                <div
                                    key={history.id}
                                    className="flex flex-col justify-between gap-1.5 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-2 rounded-full bg-primary" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {history.from_status
                                                    ? `${requestStatusLabel(history.from_status)} → ${requestStatusLabel(history.to_status)}`
                                                    : requestStatusLabel(
                                                          history.to_status,
                                                      )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Diperbarui oleh:{' '}
                                                {history.changer?.name ??
                                                    'Sistem Otomatis'}
                                            </p>
                                        </div>
                                    </div>
                                    <time className="font-mono text-xs text-muted-foreground">
                                        {new Date(
                                            history.created_at,
                                        ).toLocaleString('id-ID', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        })}
                                    </time>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

RequestShow.layout = {
    breadcrumbs: [
        { title: 'Portal Toko', href: '/store/dashboard' },
        { title: 'Permintaan', href: '/store/requests' },
        { title: 'Detail', href: '#' },
    ],
};
