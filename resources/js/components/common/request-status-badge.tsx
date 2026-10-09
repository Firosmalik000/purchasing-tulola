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
        bg: 'bg-blue-50 dark:bg-blue-950/50',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/60',
        dot: 'bg-blue-500 animate-pulse',
    },
    PROCESSED: {
        label: 'Disetujui',
        bg: 'bg-indigo-50 dark:bg-indigo-950/50',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800/60',
        dot: 'bg-indigo-500',
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
        bg: 'bg-slate-100 dark:bg-slate-800/70',
        text: 'text-slate-500 dark:text-slate-400 line-through',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
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
            <span className={cn('size-1.5 shrink-0 rounded-full', item.dot)} />
            {item.label}
        </span>
    );
}
