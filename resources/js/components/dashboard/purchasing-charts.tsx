import { useMemo } from 'react';

type ChartDataPoint = {
    month: string;
    requests: number;
    orders: number;
};

type Props = {
    data: ChartDataPoint[];
    height?: number;
};

export function PurchasingBarChart({ data, height = 200 }: Props) {
    const maxValue = useMemo(() => {
        const max = Math.max(...data.flatMap((d) => [d.requests, d.orders]), 5);
        return Math.ceil(max * 1.2);
    }, [data]);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between pb-3 text-xs">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 font-medium">
                        <span className="size-2.5 rounded-xs bg-amber-500" />
                        <span className="text-muted-foreground">Permintaan (PR)</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                        <span className="size-2.5 rounded-xs bg-indigo-500" />
                        <span className="text-muted-foreground">Pesanan (PO)</span>
                    </div>
                </div>
                <span className="text-[11px] text-muted-foreground/70">6 Bulan Terakhir</span>
            </div>

            <div className="relative flex items-end gap-3 pt-4" style={{ height }}>
                {/* Horizontal guide lines */}
                <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col justify-between h-[calc(100%-2rem)]">
                    <div className="border-b border-border/40 w-full" />
                    <div className="border-b border-border/40 w-full" />
                    <div className="border-b border-border/40 w-full" />
                </div>

                {data.map((item) => {
                    const reqHeight = Math.max((item.requests / maxValue) * (height - 35), 4);
                    const orderHeight = Math.max((item.orders / maxValue) * (height - 35), 4);

                    return (
                        <div
                            key={item.month}
                            className="group relative z-1 flex flex-1 flex-col items-center justify-end h-full"
                        >
                            <div className="flex items-end gap-1.5 w-full justify-center">
                                {/* Bar 1: Requests */}
                                <div
                                    className="w-full max-w-[1.25rem] rounded-t-sm bg-amber-500/85 transition-all duration-300 hover:bg-amber-500 group-hover:brightness-105"
                                    style={{ height: `${reqHeight}px` }}
                                    title={`Permintaan: ${item.requests}`}
                                />
                                {/* Bar 2: Orders */}
                                <div
                                    className="w-full max-w-[1.25rem] rounded-t-sm bg-indigo-500/85 transition-all duration-300 hover:bg-indigo-500 group-hover:brightness-105"
                                    style={{ height: `${orderHeight}px` }}
                                    title={`Pesanan: ${item.orders}`}
                                />
                            </div>
                            <span className="mt-2 text-[11px] font-semibold text-muted-foreground">
                                {item.month}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function StatusProgressChart({
    items,
}: {
    items: { name: string; count: number; color: string }[];
}) {
    const total = useMemo(() => items.reduce((acc, curr) => acc + curr.count, 0), [items]);

    return (
        <div className="space-y-3">
            {/* Multi-segmented bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/60 p-0.5">
                {items.map((item, idx) => {
                    const percent = total > 0 ? (item.count / total) * 100 : 0;
                    if (percent <= 0) return null;
                    return (
                        <div
                            key={idx}
                            style={{ width: `${percent}%`, backgroundColor: item.color }}
                            className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                            title={`${item.name}: ${item.count}`}
                        />
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                {items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-md border border-border/50 bg-card/60 p-2">
                        <div className="flex items-center gap-1.5 truncate">
                            <span
                                className="size-2 rounded-full shrink-0"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-bold text-foreground pl-1">{item.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
