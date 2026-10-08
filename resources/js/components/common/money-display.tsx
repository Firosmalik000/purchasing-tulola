export function formatMoney(value: string | number): string {
    return `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function MoneyDisplay({
    value,
    className = '',
}: {
    value: string | number;
    className?: string;
}) {
    return (
        <span className={`tabular-nums ${className}`}>
            {formatMoney(value)}
        </span>
    );
}
