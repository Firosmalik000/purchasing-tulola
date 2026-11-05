export function stockRequestQuantity(value: string, available: number): string {
    if (value === '' || available <= 0 || !Number.isFinite(Number(value))) {
        return '';
    }

    return String(Math.min(available, Math.max(1, Math.floor(Number(value)))));
}
