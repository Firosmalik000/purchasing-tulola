import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function formatQuantity(value: string | number): string {
    const quantity = Number(value);

    return Number.isFinite(quantity)
        ? quantity.toLocaleString('id-ID', { maximumFractionDigits: 0 })
        : String(value);
}
