import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export function PaginationLinks({ links }: { links: PaginationLink[] }) {
    if (links.length <= 3) return null;
    return (
        <nav aria-label="Paginasi" className="mt-4 flex flex-wrap gap-2">
            {links.map((link) =>
                link.url ? (
                    <Button
                        key={link.label}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        asChild
                    >
                        <Link
                            href={link.url}
                            preserveScroll
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    </Button>
                ) : null,
            )}
        </nav>
    );
}
