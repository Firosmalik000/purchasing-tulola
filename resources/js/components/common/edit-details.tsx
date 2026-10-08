import { Pencil } from 'lucide-react';
import type { ReactNode } from 'react';

export function EditDetails({
    children,
    label = 'Edit',
}: {
    children: ReactNode;
    label?: string;
}) {
    return (
        <details className="group mt-3 rounded-md border bg-muted/20">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted/40">
                <Pencil className="size-3.5" /> {label}
            </summary>
            <div className="border-t p-3">{children}</div>
        </details>
    );
}
