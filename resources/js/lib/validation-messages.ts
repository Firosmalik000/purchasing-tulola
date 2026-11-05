export function validationMessages(errors: Record<string, unknown>): string[] {
    const hasStockFields = Object.keys(errors).some((key) =>
        key.startsWith('stock_items.'),
    );

    const messages = Object.entries(errors)
        .filter(([key]) => !(key === 'stock' && hasStockFields))
        .flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string =>
            typeof value === 'string' && value.trim() !== '',
        )
        .map((value) => value.trim());

    return [...new Set(messages)];
}
