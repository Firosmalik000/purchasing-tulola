import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
};

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 p-8 text-center backdrop-blur-xs',
                className,
            )}
        >
            <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-500/10 to-amber-500/5 ring-1 ring-amber-500/20">
                <Icon
                    className="size-7 text-amber-700 dark:text-amber-400"
                    aria-hidden="true"
                />
            </div>
            <h3 className="font-serif text-lg font-bold text-foreground">
                {title}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {description}
            </p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
