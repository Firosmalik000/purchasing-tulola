import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginationMeta = {
    links?: PaginationLink[];
    current_page?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    per_page?: number;
};

export type PaginationLinksProps = {
    links?: PaginationLink[];
    pagination?: PaginationMeta;
    total?: number;
    from?: number | null;
    to?: number | null;
    perPage?: number;
    onPerPageChange?: (perPage: number) => void;
    perPageOptions?: number[];
    className?: string;
};

export function PaginationLinks({
    links: directLinks,
    pagination,
    total: directTotal,
    from: directFrom,
    to: directTo,
    perPage: directPerPage,
    onPerPageChange,
    perPageOptions = [15, 25, 50, 100],
    className = '',
}: PaginationLinksProps) {
    const links = directLinks || pagination?.links || [];
    const total = directTotal ?? pagination?.total;
    const from = directFrom ?? pagination?.from;
    const to = directTo ?? pagination?.to;
    const currentPerPage = directPerPage ?? pagination?.per_page ?? 15;

    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextPerPage = Number(e.target.value);
        if (onPerPageChange) {
            onPerPageChange(nextPerPage);
            return;
        }

        // Standard inertia reload preserving query params
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('per_page', String(nextPerPage));
        currentUrl.searchParams.set('page', '1');
        router.visit(currentUrl.pathname + currentUrl.search, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // If there is no pagination data at all
    if (links.length === 0 && total === undefined) {
        return null;
    }

    return (
        <div
            className={`flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between ${className}`}
        >
            {/* Left side: Rows per page selector & Total records */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-foreground">
                        Baris per halaman:
                    </span>
                    <select
                        value={currentPerPage}
                        onChange={handlePerPageChange}
                        aria-label="Jumlah baris per halaman"
                        className="form-select-custom h-7 rounded-md border border-input bg-card px-2 py-0.5 text-xs font-semibold text-foreground shadow-2xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        {perPageOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>

                {total !== undefined && (
                    <span className="text-[11px] text-muted-foreground">
                        {from !== null &&
                        from !== undefined &&
                        to !== null &&
                        to !== undefined ? (
                            <>
                                Menampilkan{' '}
                                <strong className="font-semibold text-foreground">
                                    {from}
                                </strong>{' '}
                                –{' '}
                                <strong className="font-semibold text-foreground">
                                    {to}
                                </strong>{' '}
                                dari{' '}
                                <strong className="font-semibold text-foreground">
                                    {total}
                                </strong>{' '}
                                data
                            </>
                        ) : (
                            <>
                                Total{' '}
                                <strong className="font-semibold text-foreground">
                                    {total}
                                </strong>{' '}
                                data
                            </>
                        )}
                    </span>
                )}
            </div>

            {/* Right side: Page links */}
            {links.length > 3 && (
                <nav
                    aria-label="Paginasi"
                    className="flex flex-wrap items-center gap-1 self-center sm:self-auto"
                >
                    {links.map((link, idx) => {
                        const isPrev =
                            idx === 0 ||
                            link.label.includes('Previous') ||
                            link.label.includes('&laquo;');
                        const isNext =
                            idx === links.length - 1 ||
                            link.label.includes('Next') ||
                            link.label.includes('&raquo;');

                        let labelContent: React.ReactNode = link.label;
                        if (isPrev) {
                            labelContent = (
                                <span className="flex items-center gap-1">
                                    <ChevronLeft className="size-3.5" />
                                    <span className="hidden sm:inline">
                                        Sebelumnya
                                    </span>
                                </span>
                            );
                        } else if (isNext) {
                            labelContent = (
                                <span className="flex items-center gap-1">
                                    <span className="hidden sm:inline">
                                        Berikutnya
                                    </span>
                                    <ChevronRight className="size-3.5" />
                                </span>
                            );
                        }

                        if (!link.url) {
                            return (
                                <Button
                                    key={link.label + idx}
                                    variant="ghost"
                                    size="sm"
                                    disabled
                                    className="h-7 cursor-not-allowed px-2 text-xs opacity-40"
                                >
                                    {labelContent}
                                </Button>
                            );
                        }

                        return (
                            <Button
                                key={link.label + idx}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                asChild
                                className={`h-7 px-2.5 text-xs font-medium ${
                                    link.active
                                        ? 'bg-primary font-semibold text-primary-foreground shadow-xs'
                                        : 'border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                            >
                                <Link
                                    href={link.url}
                                    preserveScroll
                                    preserveState
                                >
                                    {labelContent}
                                </Link>
                            </Button>
                        );
                    })}
                </nav>
            )}
        </div>
    );
}
