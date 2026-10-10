import { Check, AlertCircle, CircleDot } from 'lucide-react';
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
    completionLabel?: string;
};

export function WorkflowStepper({
    steps,
    className,
    completionLabel = 'Selesai',
}: WorkflowStepperProps) {
    const gridColumns = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4',
        5: 'md:grid-cols-5',
    }[steps.length];

    return (
        <div
            className={cn(
                'w-full rounded-xl border border-border/70 bg-card p-3 shadow-xs md:p-3.5',
                className,
            )}
        >
            <div className="mb-2.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span className="tracking-wider uppercase">
                    Tahapan Alur Purchasing
                </span>
                <span>
                    {steps.findIndex((s) => s.status === 'current') !== -1
                        ? `Langkah ${steps.findIndex((s) => s.status === 'current') + 1} dari ${steps.length}`
                        : completionLabel}
                </span>
            </div>

            <div className="relative">
                <ol
                    className={cn(
                        'grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-2',
                        gridColumns,
                    )}
                >
                    {steps.map((step, idx) => {
                        const isComplete = step.status === 'complete';
                        const isCurrent = step.status === 'current';
                        const isDanger = step.status === 'danger';
                        const isUpcoming = step.status === 'upcoming';

                        return (
                            <li
                                key={step.key}
                                className={cn(
                                    'group relative flex flex-row items-center gap-2.5 rounded-lg border p-2.5 transition-all',
                                    isCurrent &&
                                        'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/30 dark:bg-blue-500/10',
                                    isComplete &&
                                        'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10',
                                    isDanger &&
                                        'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
                                    isUpcoming &&
                                        'border-border/60 bg-muted/20 opacity-70',
                                )}
                            >
                                <div className="flex shrink-0 items-center justify-center">
                                    {isComplete && (
                                        <div className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                            <Check className="size-3.5 stroke-[2.5]" />
                                        </div>
                                    )}
                                    {isCurrent && (
                                        <div className="relative flex size-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                                            <span className="absolute -inset-1 animate-ping rounded-full bg-blue-500/30" />
                                            <CircleDot className="size-3.5" />
                                        </div>
                                    )}
                                    {isDanger && (
                                        <div className="flex size-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs">
                                            <AlertCircle className="size-3.5" />
                                        </div>
                                    )}
                                    {isUpcoming && (
                                        <div className="flex size-6 items-center justify-center rounded-full border border-muted-foreground/30 bg-muted text-[11px] font-semibold text-muted-foreground">
                                            {idx + 1}
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p
                                        className={cn(
                                            'truncate text-xs font-semibold leading-tight',
                                            isCurrent &&
                                                'text-blue-700 dark:text-blue-300',
                                            isComplete &&
                                                'text-emerald-800 dark:text-emerald-300',
                                            isDanger &&
                                                'text-rose-700 dark:text-rose-400',
                                            isUpcoming &&
                                                'text-muted-foreground',
                                        )}
                                    >
                                        {step.label}
                                    </p>
                                    {step.description && (
                                        <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
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
            {
                key: 'DRAFT',
                label: '1. Draft Toko',
                description: 'Kebutuhan disusun',
                status: 'complete',
            },
            {
                key: 'SUBMITTED',
                label: '2. Diajukan',
                description: 'Dikirim ke pusat',
                status: 'complete',
            },
            {
                key: status,
                label: isRejected ? '3. Ditolak' : '3. Dibatalkan',
                description: isRejected
                    ? 'Permintaan ditolak pusat'
                    : 'Dibatalkan',
                status: 'danger',
            },
        ];
    }

    const isApproved = status === 'PROCESSED';

    return [
        {
            key: 'DRAFT',
            label: '1. Draft Toko',
            description: 'Item & stok diverifikasi',
            status:
                status !== 'DRAFT'
                    ? 'complete'
                    : status === 'DRAFT'
                      ? 'current'
                      : 'upcoming',
        },
        {
            key: 'SUBMITTED',
            label: '2. Diajukan',
            description: 'Menunggu review pusat',
            status: isApproved
                ? 'complete'
                : status === 'SUBMITTED'
                  ? 'current'
                  : 'upcoming',
        },
        {
            key: 'PROCESSED',
            label: '3. Disetujui',
            description: 'Kuantitas disetujui',
            status: isApproved ? 'complete' : 'upcoming',
        },
    ];
}

export function getPurchaseOrderSteps(status: string): StepItem[] {
    const isCancelled = status === 'CANCELLED';

    if (isCancelled) {
        return [
            {
                key: 'DRAFT',
                label: '1. Proses',
                description: 'Item request disetujui',
                status: 'complete',
            },
            {
                key: 'CANCELLED',
                label: '2. Dibatalkan',
                description: 'Pesanan dibatalkan',
                status: 'danger',
            },
        ];
    }

    const order = ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'COMPLETED'];
    const currentIdx = order.indexOf(status);

    return [
        {
            key: 'DRAFT',
            label: '1. Proses',
            description: 'Dibuat otomatis dari request',
            status:
                currentIdx > 0
                    ? 'complete'
                    : currentIdx === 0
                      ? 'current'
                      : 'upcoming',
        },
        {
            key: 'ORDERED',
            label: '2. Dikirim',
            description: 'Menunggu PIC toko',
            status:
                currentIdx > 1
                    ? 'complete'
                    : currentIdx === 1
                      ? 'current'
                      : 'upcoming',
        },
        {
            key: 'PARTIALLY_RECEIVED',
            label: '3. Penerimaan',
            description:
                status === 'PARTIALLY_RECEIVED'
                    ? 'Diterima sebagian'
                    : 'Konfirmasi fisik',
            status:
                currentIdx > 2
                    ? 'complete'
                    : currentIdx === 2
                      ? 'current'
                      : 'upcoming',
        },
        {
            key: 'COMPLETED',
            label: '4. Selesai',
            description: 'Lengkap & stok terupdate',
            status: currentIdx >= 3 ? 'complete' : 'upcoming',
        },
    ];
}
