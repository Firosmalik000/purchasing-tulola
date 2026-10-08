import type { ReactNode } from 'react';

type PageHeaderProps = {
    title: string;
    description?: string;
    badge?: string;
    actions?: ReactNode;
};

export function PageHeader({ title, description, badge, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 border-b border-border/40 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
                {badge && (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-amber-700 uppercase dark:bg-amber-500/20 dark:text-amber-300">
                        {badge}
                    </span>
                )}
                <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {title}
                </h1>
                {description && (
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                    {actions}
                </div>
            )}
        </div>
    );
}
