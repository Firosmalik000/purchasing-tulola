import { usePage } from '@inertiajs/react';
import { Calendar, Store, Building2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props;
    const isStore = auth?.user?.role === 'STORE_PIC';

    const formattedDate = new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date());

    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card/60 px-4 backdrop-blur-xs transition-[width,height] ease-linear md:px-6">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
                <div className="h-4 w-px bg-border/80" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-2.5">
                <ThemeToggle />
                <div className="hidden items-center gap-3 sm:flex">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3.5 text-amber-600 dark:text-amber-400" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
                        {isStore ? (
                            <>
                                <Store className="size-3 text-amber-600 dark:text-amber-400" />
                                <span>Butik Toko</span>
                            </>
                        ) : (
                            <>
                                <Building2 className="size-3 text-amber-600 dark:text-amber-400" />
                                <span>Purchasing Pusat</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
