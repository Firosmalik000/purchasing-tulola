import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
    label: string;
    value: string | number;
    helper?: string;
    icon: LucideIcon;
    tone?: 'neutral' | 'warning' | 'success' | 'info' | 'danger';
    className?: string;
};

const toneStyles = {
    neutral: {
        iconBg: 'bg-muted text-muted-foreground',
    },
    warning: {
        iconBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    success: {
        iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    info: {
        iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    danger: {
        iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
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
                'group relative overflow-hidden border border-border/70 bg-card p-3.5 shadow-2xs transition-all hover:border-border',
                className,
            )}
        >
            <CardContent className="flex items-center justify-between p-0">
                <div className="space-y-0.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
                        {value}
                    </p>
                    {helper && (
                        <p className="text-[10px] text-muted-foreground/80">
                            {helper}
                        </p>
                    )}
                </div>
                <div
                    className={cn(
                        'flex size-9 items-center justify-center rounded-lg',
                        style.iconBg,
                    )}
                >
                    <Icon className="size-4" aria-hidden="true" />
                </div>
            </CardContent>
        </Card>
    );
}
