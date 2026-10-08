import { Form, Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    History as HistoryIcon,
    Package,
    Pencil,
    Send,
    Sparkles,
    Store,
    UserCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
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

type RequestItem = {
    id: number;
    type: 'STOCK' | 'SPECIAL';
    item: { sku: string; name: string } | null;
    name: string | null;
    description: string | null;
    unit: { name: string; symbol: string };
    current_stock_snapshot: string | null;
    standard_stock_snapshot: string | null;
    suggested_quantity: string | null;
    requested_quantity: string;
    approved_quantity: string | null;
    estimated_price: string | null;
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
    store: { code: string; name: string };
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

    return (
        <>
            <Head title={`Permintaan ${purchaseRequest.number}`} />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Detail Permintaan Butik"
                    title={purchaseRequest.number}
                    description={`Diajukan untuk butik: ${purchaseRequest.store.code} — ${purchaseRequest.store.name}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            <RequestStatusBadge
                                status={purchaseRequest.status}
                            />
                            {purchaseRequest.status === 'DRAFT' && (
                                <>
                                    <Button variant="outline" className="gap-2" asChild>
                                        <Link
                                            href={`/store/requests/${purchaseRequest.id}/edit`}
                                        >
                                            <Pencil className="size-4" /> Edit Draft
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
                                                    purchaseRequest.items.length === 0
                                                }
                                                className="gap-2 bg-amber-600 font-medium text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                                            >
                                                <Send className="size-4" /> Ajukan ke Pusat
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
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Alur Proses Pengadaan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <WorkflowStepper steps={steps} />
                    </CardContent>
                </Card>

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
                                    {purchaseRequest.required_date?.slice(0, 10) ?? 'Tidak ditentukan'}
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
                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Package className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">
                                        Item Stok Reguler ({regular.length} item)
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        Perbandingan stok toko pada saat pengajuan vs jumlah yang disetujui pusat
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 p-5">
                            {regular.map((line) => (
                                <div
                                    key={line.id}
                                    className="grid gap-3.5 rounded-xl border border-border/70 bg-card p-4 md:grid-cols-2 xl:grid-cols-[2fr_repeat(5,1fr)] xl:items-center"
                                >
                                    <div>
                                        <p className="font-semibold text-foreground">
                                            {line.item?.name}
                                        </p>
                                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                            {line.item?.sku} · Satuan: {line.unit.symbol}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-muted/40 p-2 text-center">
                                        <p className="text-[11px] text-muted-foreground">Stok Saat Diajukan</p>
                                        <p className="mt-0.5 font-mono text-sm font-medium tabular-nums">
                                            {line.current_stock_snapshot ?? '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-muted/40 p-2 text-center">
                                        <p className="text-[11px] text-muted-foreground">Standar Toko</p>
                                        <p className="mt-0.5 font-mono text-sm font-medium tabular-nums">
                                            {line.standard_stock_snapshot ?? '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-muted/40 p-2 text-center">
                                        <p className="text-[11px] text-muted-foreground">Saran Kebutuhan</p>
                                        <p className="mt-0.5 font-mono text-sm font-medium tabular-nums">
                                            {line.suggested_quantity ?? '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-center">
                                        <p className="text-[11px] font-semibold text-primary">Diminta Toko</p>
                                        <p className="mt-0.5 font-mono text-sm font-bold text-primary tabular-nums">
                                            {line.requested_quantity} {line.unit.symbol}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-center">
                                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                            Disetujui Pusat
                                        </p>
                                        <p className="mt-0.5 font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                                            {line.approved_quantity !== null
                                                ? `${line.approved_quantity} ${line.unit.symbol}`
                                                : 'Menunggu Review'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Special Items */}
                {special.length > 0 && (
                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                    <Sparkles className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">
                                        Permintaan Kebutuhan Khusus ({special.length} item)
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        Kebutuhan non-katalog atau perlengkapan butik dengan alasan pengajuan
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3.5 p-5">
                            {special.map((line) => (
                                <div
                                    key={line.id}
                                    className="rounded-xl border border-border/70 bg-card p-4"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-3">
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
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                                                Diminta: {line.requested_quantity} {line.unit.symbol}
                                            </span>
                                            <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                                Disetujui: {line.approved_quantity !== null ? `${line.approved_quantity} ${line.unit.symbol}` : 'Menunggu'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Estimasi Harga Satuan:</span>{' '}
                                            <span className="font-medium text-foreground">
                                                {line.estimated_price
                                                    ? `Rp ${Number(line.estimated_price).toLocaleString('id-ID')}`
                                                    : 'Tidak dicantumkan'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Target Dibutuhkan:</span>{' '}
                                            <span className="font-medium text-foreground">
                                                {line.required_date?.slice(0, 10) ?? '—'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Alasan Pengajuan:</span>{' '}
                                            <span className="font-medium text-foreground">
                                                {line.reason ?? '—'}
                                            </span>
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
                                    Catatan kronologis perubahan status oleh PIC toko dan tim pusat
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5">
                        {purchaseRequest.status_histories.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Belum ada riwayat tercatat.</p>
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
                                                Diperbarui oleh: {history.changer?.name ?? 'Sistem Otomatis'}
                                            </p>
                                        </div>
                                    </div>
                                    <time className="text-xs font-mono text-muted-foreground">
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
