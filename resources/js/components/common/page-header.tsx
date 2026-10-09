import type { ReactNode } from 'react';

type PageHeaderProps = {
    title: string;
    description?: string;
    badge?: string;
    actions?: ReactNode;
};

export function PageHeader({ title, badge, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                    {title}
                </h1>
                {badge && (
                    <span className="inline-flex shrink-0 items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        {badge}
                    </span>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
