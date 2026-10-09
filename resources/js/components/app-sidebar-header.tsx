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
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/70 bg-card/80 px-4 backdrop-blur-xs transition-[width,height] ease-linear md:px-5">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
                <div className="h-3.5 w-px bg-border/80" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="hidden items-center gap-2.5 sm:flex">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                        {isStore ? (
                            <>
                                <Store className="size-3 text-muted-foreground" />
                                <span>Toko Cabang</span>
                            </>
                        ) : (
                            <>
                                <Building2 className="size-3 text-muted-foreground" />
                                <span>Purchasing Pusat</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
