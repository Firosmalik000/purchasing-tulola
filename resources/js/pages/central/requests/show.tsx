import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { SampleImagePreview } from '@/components/common/sample-image-preview';
import {
    RequestStatusBadge,
    requestStatusLabel,
} from '@/components/common/request-status-badge';
import {
    WorkflowStepper,
    getPurchaseRequestSteps,
} from '@/components/common/workflow-stepper';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatQuantity } from '@/lib/utils';

type RequestItem = {
    id: number;
    type: 'STOCK' | 'SPECIAL';
    item: { sku: string; name: string } | null;
    name: string | null;
    description: string | null;
    sample_image_url: string | null;
    unit: { symbol: string };
    current_stock_snapshot: number | null;
    standard_stock_snapshot: number | null;
    suggested_quantity: number | null;
    requested_quantity: number;
    approved_quantity: number | null;
    required_date: string | null;
    reason: string | null;
    status: string | null;
};
type History = {
    id: number;
    from_status: string | null;
    to_status: string;
    notes: string | null;
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
    processed_at: string | null;
    store: { code: string; name: string };
    requester: { name: string; email: string };
    items: RequestItem[];
    status_histories: History[];
};
type Props = {
    purchaseRequest: PurchaseRequest;
    canProcess: boolean;
    canReject: boolean;
};

export default function CentralRequestShow({
    purchaseRequest,
    canProcess,
    canReject,
}: Props) {
    const [rejectOpen, setRejectOpen] = useState(false);
    const regular = purchaseRequest.items.filter(
        (line) => line.type === 'STOCK',
    );
    const special = purchaseRequest.items.filter(
        (line) => line.type === 'SPECIAL',
    );

    return (
        <>
            <Head
                title={`Tinjau PR ${purchaseRequest.number} — Tulola Purchasing`}
            />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    badge="Review PR"
                    title={purchaseRequest.number}
                    actions={
                        <div className="flex flex-wrap items-center justify-end gap-2.5">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/central/requests">
                                    <ArrowLeft className="mr-1.5 size-4" />
                                    Kembali ke Antrean
                                </Link>
                            </Button>
                            <RequestStatusBadge
                                status={purchaseRequest.status}
                            />
                            <RejectDialog
                                open={rejectOpen}
                                onOpenChange={setRejectOpen}
                                requestId={purchaseRequest.id}
                                enabled={canReject}
                            />
                        </div>
                    }
                />

                {/* Workflow Stepper */}
                <WorkflowStepper
                    steps={getPurchaseRequestSteps(purchaseRequest.status)}
                    completionLabel="Disetujui"
                />

                {/* Metadata Card */}
                <Card className="border border-border/70 shadow-xs">
                    <CardContent className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
                        <Info
                            label="Diajukan Oleh (PIC)"
                            value={purchaseRequest.requester.name}
                            detail={purchaseRequest.requester.email}
                        />
                        <Info
                            label="Target Tanggal Dibutuhkan"
                            value={
                                purchaseRequest.required_date
                                    ? new Date(
                                          purchaseRequest.required_date,
                                      ).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                      })
                                    : 'Segera / Standar'
                            }
                        />
                        <Info
                            label="Waktu Pengajuan"
                            value={
                                purchaseRequest.submitted_at
                                    ? new Date(
                                          purchaseRequest.submitted_at,
                                      ).toLocaleString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })
                                    : '—'
                            }
                        />
                        <Info
                            label="Catatan Khusus Toko Cabang"
                            value={purchaseRequest.notes || 'Tidak ada catatan'}
                        />
                    </CardContent>
                </Card>
                <Form
                    action={`/central/requests/${purchaseRequest.id}/process`}
                    method="post"
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            {regular.length > 0 && (
                                <RequestSection
                                    title="Stok Reguler"
                                    lines={regular}
                                    canProcess={canProcess}
                                    errors={errors}
                                />
                            )}
                            {special.length > 0 && (
                                <RequestSection
                                    title="Permintaan Khusus"
                                    lines={special}
                                    canProcess={canProcess}
                                    errors={errors}
                                />
                            )}
                            <InputError message={errors.items} />
                            {canProcess && (
                                <Card className="border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent shadow-xs">
                                    <CardContent className="space-y-4 p-5">
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="notes"
                                                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                                            >
                                                Catatan Verifikasi Purchasing
                                                Pusat
                                            </Label>
                                            <textarea
                                                id="notes"
                                                name="notes"
                                                rows={3}
                                                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                                                placeholder="Contoh: Kuantitas disetujui sesuai kebutuhan dan stok toko..."
                                            />
                                            <InputError
                                                message={errors.notes}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                disabled={processing}
                                                className="h-10 px-6 font-medium shadow-xs"
                                            >
                                                <CheckCircle2 className="mr-2 size-4" />
                                                Setujui & Tandai Diproses
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </Form>

                {/* Audit Timeline */}
                <Card className="border border-border/70 shadow-xs">
                    <CardHeader className="border-b border-border/60 pb-3">
                        <CardTitle className="flex items-center gap-2 font-serif text-base font-bold">
                            <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                            Riwayat Perubahan & Audit Trail
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        {purchaseRequest.status_histories.map((history) => (
                            <div
                                key={history.id}
                                className="flex flex-col justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-amber-500" />
                                        <p className="text-xs font-semibold text-foreground">
                                            {history.from_status
                                                ? `${requestStatusLabel(history.from_status)} → ${requestStatusLabel(history.to_status)}`
                                                : requestStatusLabel(
                                                      history.to_status,
                                                  )}
                                        </p>
                                    </div>
                                    <p className="pl-4 text-[11px] text-muted-foreground">
                                        Diproses oleh:{' '}
                                        <strong className="text-foreground">
                                            {history.changer?.name ?? 'Sistem'}
                                        </strong>
                                        {history.notes
                                            ? ` · "${history.notes}"`
                                            : ''}
                                    </p>
                                </div>
                                <time className="font-mono text-[11px] text-muted-foreground">
                                    {new Date(
                                        history.created_at,
                                    ).toLocaleString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </time>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

function RequestSection({
    title,
    lines,
    canProcess,
    errors,
}: {
    title: string;
    lines: RequestItem[];
    canProcess: boolean;
    errors: Record<string, string>;
}) {
    return (
        <Card className="border border-border/70 shadow-xs">
            <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="font-serif text-base font-bold tracking-tight">
                    {title} ({lines.length} Item)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
                {lines.map((line) => (
                    <div
                        key={line.id}
                        className="grid gap-4 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-border hover:shadow-2xs md:grid-cols-2 xl:grid-cols-6"
                    >
                        <input
                            type="hidden"
                            name={`items[${line.id}][id]`}
                            value={line.id}
                        />
                        <div className="flex min-w-0 gap-3 xl:col-span-2">
                            {line.type === 'SPECIAL' &&
                                line.sample_image_url && (
                                    <SampleImagePreview
                                        src={line.sample_image_url}
                                        itemName={
                                            line.name ?? 'permintaan khusus'
                                        }
                                        className="size-20"
                                    />
                                )}
                            <div className="min-w-0 flex-1">
                                <p className="font-serif text-sm font-bold text-foreground">
                                    {line.type === 'STOCK'
                                        ? line.item?.name
                                        : line.name}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {line.type === 'STOCK'
                                        ? `${line.item?.sku} · Satuan: ${line.unit.symbol}`
                                        : (line.description ??
                                          line.unit.symbol)}
                                </p>
                                {line.reason && (
                                    <p className="mt-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                                        <strong className="text-foreground">
                                            Alasan:
                                        </strong>{' '}
                                        {line.reason}
                                    </p>
                                )}
                            </div>
                        </div>

                        {line.type === 'STOCK' ? (
                            <>
                                <Info
                                    label="Stok Saat Ini"
                                    value={
                                        line.current_stock_snapshot === null
                                            ? '—'
                                            : formatQuantity(
                                                  line.current_stock_snapshot,
                                              )
                                    }
                                />
                                <Info
                                    label="Standar Toko"
                                    value={
                                        line.standard_stock_snapshot === null
                                            ? '—'
                                            : formatQuantity(
                                                  line.standard_stock_snapshot,
                                              )
                                    }
                                />
                                <Info
                                    label="Saran Pengadaan"
                                    value={
                                        line.suggested_quantity === null
                                            ? '—'
                                            : formatQuantity(
                                                  line.suggested_quantity,
                                              )
                                    }
                                />
                            </>
                        ) : (
                            <>
                                <Info
                                    label="Tanggal Dibutuhkan"
                                    value={
                                        line.required_date
                                            ? new Date(
                                                  line.required_date,
                                              ).toLocaleDateString('id-ID')
                                            : '—'
                                    }
                                />
                                <div />
                            </>
                        )}

                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                            {canProcess ? (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <Label
                                            htmlFor={`approved-${line.id}`}
                                            className="text-xs"
                                        >
                                            Qty Disetujui
                                        </Label>
                                        <span className="text-[11px] text-muted-foreground">
                                            Diminta:{' '}
                                            {formatQuantity(
                                                line.requested_quantity,
                                            )}
                                        </span>
                                    </div>
                                    <Input
                                        id={`approved-${line.id}`}
                                        name={`items[${line.id}][approved_quantity]`}
                                        type="number"
                                        min="0"
                                        max={line.requested_quantity}
                                        step="1"
                                        defaultValue={String(
                                            Number(
                                                line.approved_quantity ??
                                                    line.requested_quantity,
                                            ),
                                        )}
                                        required
                                        className="h-9 bg-card font-mono text-sm font-semibold"
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `items.${line.id}.approved_quantity`
                                            ]
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Info
                                        label="Kuantitas Disetujui / Diminta"
                                        value={`${line.approved_quantity === null ? '—' : formatQuantity(line.approved_quantity)} / ${formatQuantity(line.requested_quantity)} ${line.unit.symbol}`}
                                    />
                                    {line.status && (
                                        <Badge
                                            variant={
                                                line.status === 'REJECTED'
                                                    ? 'destructive'
                                                    : 'secondary'
                                            }
                                            className="mt-2 text-[10px]"
                                        >
                                            {line.status === 'APPROVED'
                                                ? 'Disetujui'
                                                : 'Ditolak'}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function RejectDialog({
    open,
    onOpenChange,
    requestId,
    enabled,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    requestId: number;
    enabled: boolean;
}) {
    if (!enabled) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-9 shadow-xs"
                >
                    <XCircle className="mr-1.5 size-4" /> Tolak Permintaan
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-serif text-lg font-bold">
                        Tolak Seluruh Permintaan?
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Semua item dalam pengajuan ini akan ditandai ditolak dan
                        toko cabang tidak dapat mengeditnya kembali.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action={`/central/requests/${requestId}/reject`}
                    method="post"
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="reason"
                                    className="text-xs font-semibold"
                                >
                                    Alasan Penolakan Resmi
                                </Label>
                                <textarea
                                    id="reason"
                                    name="reason"
                                    rows={4}
                                    required
                                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus:border-destructive focus:ring-2 focus:ring-destructive/20 focus:outline-none"
                                    placeholder="Tuliskan alasan penolakan untuk catatan PIC toko cabang..."
                                />
                                <InputError message={errors.reason} />
                            </div>
                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    Konfirmasi Tolak Permintaan
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function Info({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail?: string;
}) {
    return (
        <div className="space-y-0.5">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </p>
            <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
                {value}
            </p>
            {detail && (
                <p className="text-xs text-muted-foreground">{detail}</p>
            )}
        </div>
    );
}

CentralRequestShow.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Antrean Permintaan', href: '/central/requests' },
        { title: 'Tinjau Detail', href: '#' },
    ],
};
