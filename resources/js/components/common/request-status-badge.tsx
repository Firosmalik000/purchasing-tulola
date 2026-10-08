import { cn } from '@/lib/utils';

const config: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string }
> = {
    DRAFT: {
        label: 'Draft',
        bg: 'bg-slate-100 dark:bg-slate-800/70',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
    },
    SUBMITTED: {
        label: 'Diajukan',
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/60',
        dot: 'bg-amber-500 animate-pulse',
    },
    PROCESSED: {
        label: 'Diproses',
        bg: 'bg-indigo-50 dark:bg-indigo-950/50',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800/60',
        dot: 'bg-indigo-500',
    },
    ORDERED: {
        label: 'Dipesan (PO)',
        bg: 'bg-purple-50 dark:bg-purple-950/50',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/60',
        dot: 'bg-purple-500',
    },
    COMPLETED: {
        label: 'Selesai',
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/60',
        dot: 'bg-emerald-500',
    },
    REJECTED: {
        label: 'Ditolak',
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/60',
        dot: 'bg-rose-500',
    },
    CANCELLED: {
        label: 'Dibatalkan',
        bg: 'bg-stone-100 dark:bg-stone-800/70',
        text: 'text-stone-600 dark:text-stone-400 line-through',
        border: 'border-stone-200 dark:border-stone-700',
        dot: 'bg-stone-400',
    },
};

export function requestStatusLabel(status: string | null): string {
    if (!status) return '—';
    return config[status]?.label ?? status;
}

export function RequestStatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const item = config[status] ?? {
        label: status,
        bg: 'bg-muted',
        text: 'text-foreground',
        border: 'border-border',
        dot: 'bg-muted-foreground',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide shadow-2xs',
                item.bg,
                item.text,
                item.border,
                className,
            )}
        >
            <span className={cn('size-1.5 rounded-full shrink-0', item.dot)} />
            {item.label}
        </span>
    );
}
