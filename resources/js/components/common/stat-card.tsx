import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
    label: string;
    value: string | number;
    helper: string;
    icon: LucideIcon;
    tone?: 'neutral' | 'warning' | 'success' | 'info' | 'danger';
    className?: string;
};

const toneStyles = {
    neutral: {
        container: 'hover:border-stone-300 dark:hover:border-stone-700',
        iconBg: 'bg-stone-100 text-stone-800 dark:bg-stone-800/80 dark:text-stone-200 border-stone-200 dark:border-stone-700',
        badge: 'text-stone-600 dark:text-stone-400',
    },
    warning: {
        container: 'hover:border-amber-300 dark:hover:border-amber-800/60',
        iconBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        badge: 'text-amber-700 dark:text-amber-400',
    },
    success: {
        container: 'hover:border-emerald-300 dark:hover:border-emerald-800/60',
        iconBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        badge: 'text-emerald-700 dark:text-emerald-400',
    },
    info: {
        container: 'hover:border-sky-300 dark:hover:border-sky-800/60',
        iconBg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        badge: 'text-sky-700 dark:text-sky-400',
    },
    danger: {
        container: 'hover:border-rose-300 dark:hover:border-rose-800/60',
        iconBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        badge: 'text-rose-700 dark:text-rose-400',
    },
};

export function StatCard({
    label,
    value,
    helper,
    icon: Icon,
    tone = 'neutral',
    className,
}: StatCardProps) {
    const style = toneStyles[tone] ?? toneStyles.neutral;

    return (
        <Card
            className={cn(
                'group relative overflow-hidden border border-border/80 bg-card transition-all duration-200 hover:shadow-sm',
                style.container,
                className,
            )}
        >
            <CardContent className="flex items-start justify-between p-5">
                <div className="space-y-1">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {label}
                    </p>
                    <p className="font-serif text-3xl font-bold tracking-tight text-foreground tabular-nums">
                        {value}
                    </p>
                    <p className={cn('text-xs font-medium', style.badge)}>
                        {helper}
                    </p>
                </div>
                <div
                    className={cn(
                        'flex size-11 items-center justify-center rounded-xl border p-2.5 shadow-2xs transition-transform duration-200 group-hover:scale-105',
                        style.iconBg,
                    )}
                >
                    <Icon className="size-5" aria-hidden="true" />
                </div>
            </CardContent>
        </Card>
    );
}

