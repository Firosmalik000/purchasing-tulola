import { Check, Clock, AlertCircle, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepItem = {
    key: string;
    label: string;
    description?: string;
    status: 'complete' | 'current' | 'upcoming' | 'danger';
};

type WorkflowStepperProps = {
    steps: StepItem[];
    className?: string;
};

export function WorkflowStepper({ steps, className }: WorkflowStepperProps) {
    return (
        <div className={cn('w-full rounded-xl border border-border/70 bg-card p-4 shadow-xs md:p-5', className)}>
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span className="uppercase tracking-wider">Tahapan Alur Purchasing</span>
                <span>
                    {steps.findIndex((s) => s.status === 'current') !== -1
                        ? `Langkah ${steps.findIndex((s) => s.status === 'current') + 1} dari ${steps.length}`
                        : 'Selesai'}
                </span>
            </div>

            <div className="relative">
                <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5 md:gap-2">
                    {steps.map((step, idx) => {
                        const isComplete = step.status === 'complete';
                        const isCurrent = step.status === 'current';
                        const isDanger = step.status === 'danger';
                        const isUpcoming = step.status === 'upcoming';

                        return (
                            <li
                                key={step.key}
                                className={cn(
                                    'group relative flex flex-row items-center gap-3 rounded-lg border p-3 transition-all md:flex-col md:items-start md:p-3.5',
                                    isCurrent && 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30 dark:bg-amber-500/10',
                                    isComplete && 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10',
                                    isDanger && 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
                                    isUpcoming && 'border-border/60 bg-muted/20 opacity-70',
                                )}
                            >
                                <div className="flex shrink-0 items-center justify-center">
                                    {isComplete && (
                                        <div className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                            <Check className="size-4 stroke-[2.5]" />
                                        </div>
                                    )}
                                    {isCurrent && (
                                        <div className="relative flex size-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                                            <span className="absolute -inset-1 animate-ping rounded-full bg-amber-400/30" />
                                            <CircleDot className="size-4" />
                                        </div>
                                    )}
                                    {isDanger && (
                                        <div className="flex size-7 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs">
                                            <AlertCircle className="size-4" />
                                        </div>
                                    )}
                                    {isUpcoming && (
                                        <div className="flex size-7 items-center justify-center rounded-full border border-muted-foreground/30 bg-muted text-muted-foreground text-xs font-semibold">
                                            {idx + 1}
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p
                                            className={cn(
                                                'text-xs font-semibold leading-tight md:text-sm',
                                                isCurrent && 'text-amber-950 font-bold dark:text-amber-300',
                                                isComplete && 'text-emerald-950 dark:text-emerald-300',
                                                isDanger && 'text-rose-700 dark:text-rose-400',
                                                isUpcoming && 'text-muted-foreground',
                                            )}
                                        >
                                            {step.label}
                                        </p>
                                    </div>
                                    {step.description && (
                                        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground leading-normal">
                                            {step.description}
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </div>
    );
}

export function getPurchaseRequestSteps(status: string): StepItem[] {
    const isRejected = status === 'REJECTED';
    const isCancelled = status === 'CANCELLED';

    if (isRejected || isCancelled) {
        return [
            { key: 'DRAFT', label: '1. Draft Toko', description: 'Kebutuhan disusun', status: 'complete' },
            { key: 'SUBMITTED', label: '2. Diajukan', description: 'Dikirim ke pusat', status: 'complete' },
            {
                key: status,
                label: isRejected ? '3. Ditolak' : '3. Dibatalkan',
                description: isRejected ? 'Permintaan ditolak pusat' : 'Dibatalkan',
                status: 'danger',
            },
        ];
    }

    const order = ['DRAFT', 'SUBMITTED', 'PROCESSED', 'ORDERED', 'COMPLETED'];
    const currentIdx = order.indexOf(status);

    return [
        {
            key: 'DRAFT',
            label: '1. Draft Toko',
            description: 'Item & stok diverifikasi',
            status: currentIdx > 0 ? 'complete' : currentIdx === 0 ? 'current' : 'upcoming',
        },
        {
            key: 'SUBMITTED',
            label: '2. Diajukan',
            description: 'Menunggu review pusat',
            status: currentIdx > 1 ? 'complete' : currentIdx === 1 ? 'current' : 'upcoming',
        },
        {
            key: 'PROCESSED',
            label: '3. Disetujui',
            description: 'Kuantitas disetujui',
            status: currentIdx > 2 ? 'complete' : currentIdx === 2 ? 'current' : 'upcoming',
        },
        {
            key: 'ORDERED',
            label: '4. Dipesan (PO)',
            description: 'Masuk planning & PO',
            status: currentIdx > 3 ? 'complete' : currentIdx === 3 ? 'current' : 'upcoming',
        },
        {
            key: 'COMPLETED',
            label: '5. Selesai',
            description: 'Barang diterima toko',
            status: currentIdx >= 4 ? 'complete' : 'upcoming',
        },
    ];
}

export function getPurchaseOrderSteps(status: string): StepItem[] {
    const isCancelled = status === 'CANCELLED';

    if (isCancelled) {
        return [
            { key: 'DRAFT', label: '1. Draft PO', description: 'Konsolidasi item', status: 'complete' },
            { key: 'CANCELLED', label: '2. Dibatalkan', description: 'Pesanan dibatalkan', status: 'danger' },
        ];
    }

    const order = ['DRAFT', 'ORDERED', 'WAITING_RECEIPT', 'PARTIALLY_RECEIVED', 'COMPLETED'];
    const currentIdx = order.indexOf(status);

    return [
        {
            key: 'DRAFT',
            label: '1. Draft PO',
            description: 'Konsolidasi & supplier',
            status: currentIdx > 0 ? 'complete' : currentIdx === 0 ? 'current' : 'upcoming',
        },
        {
            key: 'ORDERED',
            label: '2. Dipesan',
            description: 'Terkirim ke vendor',
            status: currentIdx > 1 ? 'complete' : currentIdx === 1 ? 'current' : 'upcoming',
        },
        {
            key: 'WAITING_RECEIPT',
            label: '3. Pengiriman',
            description: 'Menunggu penerimaan',
            status: currentIdx > 2 ? 'complete' : currentIdx === 2 ? 'current' : 'upcoming',
        },
        {
            key: 'PARTIALLY_RECEIVED',
            label: '4. Penerimaan',
            description: status === 'PARTIALLY_RECEIVED' ? 'Diterima sebagian' : 'Verifikasi fisik',
            status: currentIdx > 3 ? 'complete' : currentIdx === 3 ? 'current' : 'upcoming',
        },
        {
            key: 'COMPLETED',
            label: '5. Selesai',
            description: 'Lengkap & stok terupdate',
            status: currentIdx >= 4 ? 'complete' : 'upcoming',
        },
    ];
}
