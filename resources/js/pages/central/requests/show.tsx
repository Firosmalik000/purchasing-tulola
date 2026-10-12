import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    XCircle,
    Boxes,
    Calendar,
    Sparkles,
    MessageSquareQuote,
    Minus,
    Plus,
    AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
    bank_quantity?: number | null;
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

type BulkAction = {
    type: 'APPROVE_ALL' | 'BANK_ALL' | 'REJECT_ALL';
    timestamp: number;
} | null;

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
    const isSpecial = lines.some((l) => l.type === 'SPECIAL');
    const [bulkAction, setBulkAction] = useState<BulkAction>(null);

    return (
        <Card
            className={`border shadow-xs ${
                isSpecial ? 'border-amber-500/30' : 'border-border/70'
            }`}
        >
            <CardHeader className="flex flex-col gap-2.5 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-2">
                    {isSpecial ? (
                        <Sparkles className="size-4 shrink-0 text-amber-500" />
                    ) : (
                        <Boxes className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <CardTitle className="font-serif text-base font-bold tracking-tight">
                        {title} ({lines.length} Item)
                    </CardTitle>
                    <Badge
                        variant={isSpecial ? 'outline' : 'secondary'}
                        className={
                            isSpecial
                                ? 'border-amber-500/40 bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400'
                                : 'text-[11px]'
                        }
                    >
                        {isSpecial ? 'Permintaan Khusus' : 'Stok Reguler'}
                    </Badge>
                </div>

                {canProcess && lines.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                        <span className="mr-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Aksi Massal:
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setBulkAction({
                                    type: 'APPROVE_ALL',
                                    timestamp: Date.now(),
                                })
                            }
                            className="h-7 px-2.5 text-xs font-medium"
                            title="Setujui penuh seluruh item dalam grup ini"
                        >
                            <CheckCircle2 className="mr-1 size-3 text-emerald-600 dark:text-emerald-400" />
                            {isSpecial ? 'Kirim Semua' : 'Setujui Semua'}
                        </Button>
                        {isSpecial && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setBulkAction({
                                        type: 'BANK_ALL',
                                        timestamp: Date.now(),
                                    })
                                }
                                className="h-7 px-2.5 text-xs font-medium"
                                title="Tunda seluruh item ke antrean Bank Permintaan"
                            >
                                <Clock className="mr-1 size-3 text-amber-600 dark:text-amber-400" />
                                Semua ke Bank
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setBulkAction({
                                    type: 'REJECT_ALL',
                                    timestamp: Date.now(),
                                })
                            }
                            className="h-7 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                            title="Tolak seluruh item dalam grup ini"
                        >
                            <XCircle className="mr-1 size-3" />
                            Tolak Semua
                        </Button>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                <th className="w-10 px-3.5 py-2.5 text-center">#</th>
                                <th className="px-3.5 py-2.5">
                                    {isSpecial ? 'Item / Permintaan Khusus' : 'Barang / SKU'}
                                </th>
                                {!isSpecial && (
                                    <th className="px-3.5 py-2.5">Info Stok Toko</th>
                                )}
                                <th className="px-3.5 py-2.5 text-center">Diminta</th>
                                <th className="px-3.5 py-2.5">
                                    {canProcess ? 'Keputusan Disetujui' : 'Status Persetujuan'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {lines.map((line, idx) =>
                                line.type === 'STOCK' ? (
                                    <StockItemRow
                                        key={line.id}
                                        line={line}
                                        index={idx}
                                        canProcess={canProcess}
                                        errors={errors}
                                        bulkAction={bulkAction}
                                    />
                                ) : (
                                    <SpecialItemRow
                                        key={line.id}
                                        line={line}
                                        index={idx}
                                        canProcess={canProcess}
                                        errors={errors}
                                        bulkAction={bulkAction}
                                    />
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

function StockItemRow({
    line,
    index,
    canProcess,
    errors,
    bulkAction,
}: {
    line: RequestItem;
    index: number;
    canProcess: boolean;
    errors: Record<string, string>;
    bulkAction: BulkAction;
}) {
    const requested = Number(line.requested_quantity);
    const initialApproved =
        line.approved_quantity !== null && line.approved_quantity !== undefined
            ? Number(line.approved_quantity)
            : requested;

    const [approvedQty, setApprovedQty] = useState<number>(initialApproved);

    useEffect(() => {
        if (!bulkAction) return;
        if (bulkAction.type === 'APPROVE_ALL') {
            setApprovedQty(requested);
        } else if (bulkAction.type === 'REJECT_ALL') {
            setApprovedQty(0);
        }
    }, [bulkAction, requested]);

    const isExceeded = approvedQty > requested;
    const remainderRejected = Math.max(0, requested - approvedQty);

    return (
        <tr className="transition-colors hover:bg-muted/15">
            <td className="w-10 px-3.5 py-3 text-center font-mono text-xs text-muted-foreground">
                {index + 1}
            </td>
            <td className="px-3.5 py-3">
                <input
                    type="hidden"
                    name={`items[${line.id}][id]`}
                    value={line.id}
                />
                <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded border border-border/60 bg-muted/40 text-muted-foreground">
                        <Boxes className="size-4 text-muted-foreground/80" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-serif font-bold text-foreground">
                                {line.item?.name}
                            </span>
                            <Badge
                                variant="secondary"
                                className="h-4 px-1.5 font-mono text-[10px]"
                            >
                                {line.unit.symbol}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono text-[11px]">
                                {line.item?.sku}
                            </span>
                            {line.reason && (
                                <>
                                    <span className="text-border">·</span>
                                    <span
                                        className="truncate text-[11px] italic"
                                        title={line.reason}
                                    >
                                        "{line.reason}"
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-3.5 py-3 whitespace-nowrap">
                <div className="flex items-center gap-3 text-xs">
                    <div>
                        <span className="block text-[10px] text-muted-foreground">
                            Stok Saat Ini
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                            {line.current_stock_snapshot === null
                                ? '—'
                                : formatQuantity(line.current_stock_snapshot)}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-border/60" />
                    <div>
                        <span className="block text-[10px] text-muted-foreground">
                            Standar
                        </span>
                        <span className="font-mono font-medium text-muted-foreground">
                            {line.standard_stock_snapshot === null
                                ? '—'
                                : formatQuantity(line.standard_stock_snapshot)}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-border/60" />
                    <div>
                        <span className="block text-[10px] text-muted-foreground">
                            Saran PR
                        </span>
                        <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                            {line.suggested_quantity === null
                                ? '—'
                                : formatQuantity(line.suggested_quantity)}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-3.5 py-3 text-center whitespace-nowrap">
                <Badge
                    variant="outline"
                    className="font-mono text-xs font-semibold px-2 py-0.5"
                >
                    {formatQuantity(requested)} {line.unit.symbol}
                </Badge>
            </td>
            <td className="px-3.5 py-3">
                {canProcess ? (
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Quick Buttons */}
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant={
                                        approvedQty === requested
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => setApprovedQty(requested)}
                                    className="h-7 px-2 text-[11px] font-medium"
                                    title="Setujui penuh"
                                >
                                    <CheckCircle2 className="mr-1 size-3" />
                                    Semua
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        approvedQty === 0
                                            ? 'destructive'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => setApprovedQty(0)}
                                    className="h-7 px-2 text-[11px] font-medium"
                                    title="Tolak item ini"
                                >
                                    <XCircle className="mr-1 size-3" />
                                    0
                                </Button>
                            </div>

                            {/* Stepper */}
                            <div className="flex items-center rounded-md border border-input bg-background shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setApprovedQty(
                                            Math.max(0, approvedQty - 1),
                                        )
                                    }
                                    disabled={approvedQty <= 0}
                                    className="flex size-7 items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                                    aria-label="Kurangi kuantitas disetujui"
                                >
                                    <Minus className="size-3" />
                                </button>
                                <Input
                                    type="number"
                                    min="0"
                                    max={requested}
                                    step="1"
                                    value={approvedQty}
                                    onChange={(e) => {
                                        const val = parseInt(
                                            e.target.value,
                                            10,
                                        );
                                        setApprovedQty(
                                            isNaN(val) ? 0 : Math.max(0, val),
                                        );
                                    }}
                                    className="h-7 w-12 border-0 p-0 text-center font-mono text-xs font-bold shadow-none focus-visible:ring-0"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setApprovedQty(
                                            Math.min(
                                                requested,
                                                approvedQty + 1,
                                            ),
                                        )
                                    }
                                    disabled={approvedQty >= requested}
                                    className="flex size-7 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                                    aria-label="Tambah kuantitas disetujui"
                                >
                                    <Plus className="size-3" />
                                </button>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                                {line.unit.symbol}
                            </span>

                            {/* Status Badge */}
                            <div>
                                {isExceeded ? (
                                    <span className="text-[11px] font-semibold text-destructive">
                                        ⚠️ Melebihi ({approvedQty}/{requested})
                                    </span>
                                ) : approvedQty === requested ? (
                                    <Badge
                                        variant="outline"
                                        className="h-6 border-emerald-500/40 bg-emerald-500/10 text-[11px] text-emerald-700 dark:text-emerald-400"
                                    >
                                        Disetujui Penuh
                                    </Badge>
                                ) : approvedQty === 0 ? (
                                    <Badge
                                        variant="destructive"
                                        className="h-6 text-[11px]"
                                    >
                                        Ditolak
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className="h-6 border-amber-500/40 bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400"
                                    >
                                        {approvedQty} Disetujui ({remainderRejected} Tolak)
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <input
                            type="hidden"
                            name={`items[${line.id}][approved_quantity]`}
                            value={approvedQty}
                        />
                        <input
                            type="hidden"
                            name={`items[${line.id}][bank_quantity]`}
                            value="0"
                        />
                        <input
                            type="hidden"
                            name={`items[${line.id}][decision]`}
                            value={approvedQty > 0 ? 'APPROVED' : 'REJECTED'}
                        />
                        <InputError
                            message={
                                errors[`items.${line.id}.approved_quantity`]
                            }
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                            {formatQuantity(Number(line.approved_quantity ?? 0))} {line.unit.symbol}
                        </span>
                        {line.status === 'APPROVED' && (
                            <Badge
                                variant="outline"
                                className="border-emerald-500/40 bg-emerald-500/10 text-[11px] text-emerald-700 dark:text-emerald-400"
                            >
                                Disetujui Penuh
                            </Badge>
                        )}
                        {line.status === 'PARTIALLY_APPROVED' && (
                            <Badge
                                variant="outline"
                                className="border-amber-500/40 bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400"
                            >
                                Disetujui Sebagian
                            </Badge>
                        )}
                        {line.status === 'REJECTED' && (
                            <Badge variant="destructive" className="text-[11px]">
                                Ditolak
                            </Badge>
                        )}
                        {!line.status && (
                            <Badge variant="secondary" className="text-[11px]">
                                Menunggu Peninjauan
                            </Badge>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );
}

function SpecialItemRow({
    line,
    index,
    canProcess,
    errors,
    bulkAction,
}: {
    line: RequestItem;
    index: number;
    canProcess: boolean;
    errors: Record<string, string>;
    bulkAction: BulkAction;
}) {
    const requested = Number(line.requested_quantity);
    const initialApproved =
        line.approved_quantity !== null && line.approved_quantity !== undefined
            ? Number(line.approved_quantity)
            : requested;
    const initialBank =
        line.bank_quantity !== null && line.bank_quantity !== undefined
            ? Number(line.bank_quantity)
            : 0;

    const [approvedQty, setApprovedQty] = useState<number>(initialApproved);
    const [bankQty, setBankQty] = useState<number>(initialBank);

    useEffect(() => {
        if (!bulkAction) return;
        if (bulkAction.type === 'APPROVE_ALL') {
            setApprovedQty(requested);
            setBankQty(0);
        } else if (bulkAction.type === 'BANK_ALL') {
            setApprovedQty(0);
            setBankQty(requested);
        } else if (bulkAction.type === 'REJECT_ALL') {
            setApprovedQty(0);
            setBankQty(0);
        }
    }, [bulkAction, requested]);

    const totalAllocated = approvedQty + bankQty;
    const isExceeded = totalAllocated > requested;
    const remainderRejected = Math.max(0, requested - totalAllocated);

    const calculatedDecision =
        approvedQty > 0 && bankQty > 0
            ? 'SPLIT'
            : bankQty > 0 && approvedQty === 0
              ? 'BANK_PERMINTAAN'
              : approvedQty === 0 && bankQty === 0
                ? 'REJECTED'
                : 'APPROVED';

    return (
        <tr className="transition-colors hover:bg-muted/15">
            <td className="w-10 px-3.5 py-3 text-center font-mono text-xs text-muted-foreground align-top sm:align-middle">
                {index + 1}
            </td>
            <td className="px-3.5 py-3">
                <input
                    type="hidden"
                    name={`items[${line.id}][id]`}
                    value={line.id}
                />
                <div className="flex items-start gap-2.5">
                    {line.sample_image_url ? (
                        <SampleImagePreview
                            src={line.sample_image_url}
                            itemName={line.name ?? 'permintaan khusus'}
                            className="size-11 shrink-0 rounded-md border border-border/70 object-cover shadow-2xs"
                        />
                    ) : (
                        <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/30 text-muted-foreground">
                            <Sparkles className="size-3.5 text-amber-500/70" />
                            <span className="text-[8px]">No Foto</span>
                        </div>
                    )}
                    <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-serif font-bold text-foreground">
                                {line.name}
                            </span>
                            <Badge
                                variant="secondary"
                                className="h-4 px-1.5 font-mono text-[10px]"
                            >
                                Satuan: {line.unit.symbol}
                            </Badge>
                            {line.required_date && (
                                <Badge
                                    variant="outline"
                                    className="h-4 gap-1 border-amber-500/30 bg-amber-500/5 px-1.5 text-[10px] text-amber-700 dark:text-amber-400"
                                >
                                    <Calendar className="size-2.5" />
                                    Butuh:{' '}
                                    {new Date(
                                        line.required_date,
                                    ).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </Badge>
                            )}
                        </div>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                            {line.description || 'Permintaan khusus non-katalog'}
                        </p>
                        {line.reason && (
                            <div className="inline-flex max-w-full items-center gap-1.5 rounded border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-xs text-foreground/90">
                                <MessageSquareQuote className="size-3 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                    Alasan:
                                </span>
                                <span className="truncate text-[10px] italic">
                                    "{line.reason}"
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-3.5 py-3 text-center whitespace-nowrap align-top sm:align-middle">
                <Badge
                    variant="outline"
                    className="font-mono text-xs font-semibold px-2 py-0.5"
                >
                    {formatQuantity(requested)} {line.unit.symbol}
                </Badge>
            </td>
            <td className="px-3.5 py-3 align-top sm:align-middle">
                {canProcess ? (
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Quick buttons */}
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant={
                                        approvedQty === requested &&
                                        bankQty === 0
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => {
                                        setApprovedQty(requested);
                                        setBankQty(0);
                                    }}
                                    className="h-7 px-2 text-[11px] font-medium"
                                    title="Kirim semua sekarang"
                                >
                                    <CheckCircle2 className="mr-1 size-3" />
                                    Kirim
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        approvedQty === 0 &&
                                        bankQty === requested
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => {
                                        setApprovedQty(0);
                                        setBankQty(requested);
                                    }}
                                    className={`h-7 px-2 text-[11px] font-medium ${
                                        approvedQty === 0 &&
                                        bankQty === requested
                                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                                            : ''
                                    }`}
                                    title="Simpan semua ke antrean Bank Permintaan"
                                >
                                    <Clock className="mr-1 size-3" />
                                    Bank
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        approvedQty === 0 && bankQty === 0
                                            ? 'destructive'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => {
                                        setApprovedQty(0);
                                        setBankQty(0);
                                    }}
                                    className="h-7 px-2 text-[11px] font-medium"
                                    title="Tolak item ini"
                                >
                                    <XCircle className="mr-1 size-3" />
                                    Tolak
                                </Button>
                            </div>

                            {/* Steppers */}
                            <div className="flex items-center gap-2">
                                {/* Kirim Stepper */}
                                <div className="flex items-center gap-1 rounded border border-border/60 bg-card px-1.5 py-0.5 shadow-2xs">
                                    <span
                                        className="size-2 shrink-0 rounded-full bg-emerald-500"
                                        title="Kirim Sekarang"
                                    />
                                    <span className="text-[11px] font-medium text-foreground">
                                        Kirim:
                                    </span>
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setApprovedQty(
                                                    Math.max(
                                                        0,
                                                        approvedQty - 1,
                                                    ),
                                                )
                                            }
                                            disabled={approvedQty <= 0}
                                            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
                                            aria-label="Kurangi kuantitas kirim"
                                        >
                                            <Minus className="size-2.5" />
                                        </button>
                                        <Input
                                            type="number"
                                            min="0"
                                            max={requested}
                                            value={approvedQty}
                                            onChange={(e) => {
                                                const val = parseInt(
                                                    e.target.value,
                                                    10,
                                                );
                                                setApprovedQty(
                                                    isNaN(val)
                                                        ? 0
                                                        : Math.max(0, val),
                                                );
                                            }}
                                            className="h-6 w-9 border-0 p-0 text-center font-mono text-xs font-bold shadow-none focus-visible:ring-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setApprovedQty(
                                                    Math.min(
                                                        requested,
                                                        approvedQty + 1,
                                                    ),
                                                )
                                            }
                                            disabled={approvedQty >= requested}
                                            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
                                            aria-label="Tambah kuantitas kirim"
                                        >
                                            <Plus className="size-2.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Bank Stepper */}
                                <div className="flex items-center gap-1 rounded border border-border/60 bg-card px-1.5 py-0.5 shadow-2xs">
                                    <span
                                        className="size-2 shrink-0 rounded-full bg-amber-500"
                                        title="Bank Permintaan"
                                    />
                                    <span className="text-[11px] font-medium text-foreground">
                                        Bank:
                                    </span>
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setBankQty(
                                                    Math.max(0, bankQty - 1),
                                                )
                                            }
                                            disabled={bankQty <= 0}
                                            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
                                            aria-label="Kurangi kuantitas bank"
                                        >
                                            <Minus className="size-2.5" />
                                        </button>
                                        <Input
                                            type="number"
                                            min="0"
                                            max={requested}
                                            value={bankQty}
                                            onChange={(e) => {
                                                const val = parseInt(
                                                    e.target.value,
                                                    10,
                                                );
                                                setBankQty(
                                                    isNaN(val)
                                                        ? 0
                                                        : Math.max(0, val),
                                                );
                                            }}
                                            className="h-6 w-9 border-0 p-0 text-center font-mono text-xs font-bold shadow-none focus-visible:ring-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setBankQty(
                                                    Math.min(
                                                        requested,
                                                        bankQty + 1,
                                                    ),
                                                )
                                            }
                                            disabled={bankQty >= requested}
                                            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
                                            aria-label="Tambah kuantitas bank"
                                        >
                                            <Plus className="size-2.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                                {isExceeded ? (
                                    <span className="text-[11px] font-semibold text-destructive">
                                        ⚠️ Melebihi ({totalAllocated}/{requested})
                                    </span>
                                ) : approvedQty === requested &&
                                  bankQty === 0 ? (
                                    <Badge
                                        variant="outline"
                                        className="h-6 border-emerald-500/40 bg-emerald-500/10 text-[11px] text-emerald-700 dark:text-emerald-400"
                                    >
                                        Kirim Penuh
                                    </Badge>
                                ) : approvedQty === 0 &&
                                  bankQty === requested ? (
                                    <Badge
                                        variant="outline"
                                        className="h-6 border-amber-500/40 bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400"
                                    >
                                        Masuk Bank
                                    </Badge>
                                ) : approvedQty === 0 && bankQty === 0 ? (
                                    <Badge
                                        variant="destructive"
                                        className="h-6 text-[11px]"
                                    >
                                        Ditolak
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className="h-6 border-indigo-500/40 bg-indigo-500/10 text-[11px] text-indigo-700 dark:text-indigo-400"
                                    >
                                        {approvedQty} Kirim · {bankQty} Bank
                                        {remainderRejected > 0
                                            ? ` · ${remainderRejected} Tolak`
                                            : ''}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <input
                            type="hidden"
                            name={`items[${line.id}][decision]`}
                            value={calculatedDecision}
                        />
                        <input
                            type="hidden"
                            name={`items[${line.id}][approved_quantity]`}
                            value={approvedQty}
                        />
                        <input
                            type="hidden"
                            name={`items[${line.id}][bank_quantity]`}
                            value={bankQty}
                        />
                        <InputError
                            message={
                                errors[`items.${line.id}.approved_quantity`] ||
                                errors[`items.${line.id}.bank_quantity`]
                            }
                        />
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            Kirim:{' '}
                            <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                                {formatQuantity(Number(line.approved_quantity ?? 0))}
                            </strong>
                        </span>
                        <span className="text-border">·</span>
                        <span className="text-xs text-muted-foreground">
                            Bank:{' '}
                            <strong className="font-mono text-amber-700 dark:text-amber-400">
                                {formatQuantity(Number(line.bank_quantity ?? 0))}
                            </strong>
                        </span>
                        {line.status === 'APPROVED' && (
                            <Badge
                                variant="outline"
                                className="border-emerald-500/40 bg-emerald-500/10 text-[11px] text-emerald-700 dark:text-emerald-400"
                            >
                                Kirim Penuh
                            </Badge>
                        )}
                        {line.status === 'BANK_PERMINTAAN' && (
                            <Badge
                                variant="outline"
                                className="border-amber-500/40 bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400"
                            >
                                Masuk Bank
                            </Badge>
                        )}
                        {line.status === 'PARTIALLY_APPROVED' && (
                            <Badge
                                variant="outline"
                                className="border-indigo-500/40 bg-indigo-500/10 text-[11px] text-indigo-700 dark:text-indigo-400"
                            >
                                Sebagian & Bank
                            </Badge>
                        )}
                        {line.status === 'REJECTED' && (
                            <Badge variant="destructive" className="text-[11px]">
                                Ditolak
                            </Badge>
                        )}
                        {!line.status && (
                            <Badge variant="secondary" className="text-[11px]">
                                Menunggu Peninjauan
                            </Badge>
                        )}
                    </div>
                )}
            </td>
        </tr>
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
