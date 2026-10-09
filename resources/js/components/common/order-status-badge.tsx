import { cn } from '@/lib/utils';

const config: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string }
> = {
    DRAFT: {
        label: 'Proses',
        bg: 'bg-slate-100 dark:bg-slate-800/70',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
    },
    ORDERED: {
        label: 'Menunggu Diterima',
        bg: 'bg-purple-50 dark:bg-purple-950/50',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/60',
        dot: 'bg-purple-500',
    },
    PARTIALLY_RECEIVED: {
        label: 'Diterima Sebagian',
        bg: 'bg-cyan-50 dark:bg-cyan-950/50',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-200 dark:border-cyan-800/60',
        dot: 'bg-cyan-500',
    },
    COMPLETED: {
        label: 'Selesai',
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/60',
        dot: 'bg-emerald-500',
    },
    CANCELLED: {
        label: 'Dibatalkan',
        bg: 'bg-slate-100 dark:bg-slate-800/70',
        text: 'text-slate-500 dark:text-slate-400 line-through',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
    },
};

export function orderStatusLabel(status: string | null): string {
    if (!status) return '—';
    return config[status]?.label ?? status;
}

export function OrderStatusBadge({
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
