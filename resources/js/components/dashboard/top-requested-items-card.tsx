import { Link } from '@inertiajs/react';
import { ArrowRight, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type TopRequestedItem = {
    item_id: number;
    name: string;
    sku: string;
    category: string;
    unit: string;
    request_count: number;
    total_quantity: number;
};

type Props = {
    items: TopRequestedItem[];
    title?: string;
    subtitle?: string;
    detailHref?: string;
};

const SLICE_COLORS = [
    {
        stroke: '#f59e0b',
        fill: 'bg-amber-500',
        badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        label: '#1',
    },
    {
        stroke: '#6366f1',
        fill: 'bg-indigo-500',
        badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        label: '#2',
    },
    {
        stroke: '#10b981',
        fill: 'bg-emerald-500',
        badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        label: '#3',
    },
];

export function TopRequestedItemsCard({
    items,
    title = 'Top 3 Item Sering Diminta',
    subtitle = 'Akumulasi seluruh cabang',
    detailHref,
}: Props) {
    const totalQuantity = items.reduce(
        (sum, item) => sum + item.total_quantity,
        0,
    );

    // SVG Donut calculation
    const radius = 38;
    const circumference = 2 * Math.PI * radius; // ~238.76

    let accumulatedLength = 0;
    const slices = items.map((item, idx) => {
        const percent =
            totalQuantity > 0 ? (item.total_quantity / totalQuantity) * 100 : 0;
        const dashLength = (percent / 100) * circumference;
        const offset = accumulatedLength;
        accumulatedLength += dashLength;

        return {
            ...item,
            percent: Math.round(percent),
            dashLength,
            offset,
            color: SLICE_COLORS[idx] || SLICE_COLORS[2],
        };
    });

    return (
        <Card className="border-border/70 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Trophy className="size-4" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-semibold">
                            {title}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground">
                            {subtitle}
                        </p>
                    </div>
                </div>
                {detailHref ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-7 text-xs"
                    >
                        <Link href={detailHref}>
                            Lihat Semua <ArrowRight className="ml-1 size-3" />
                        </Link>
                    </Button>
                ) : (
                    <Badge
                        variant="outline"
                        className="text-[10px] font-semibold text-muted-foreground"
                    >
                        Proporsi
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="p-4">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="relative mb-3 flex size-20 items-center justify-center rounded-full border-4 border-dashed border-muted-foreground/20">
                            <Trophy className="size-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Belum ada riwayat permintaan item pada periode ini.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Circular Donut Diagram */}
                        <div className="flex items-center justify-center pt-1">
                            <div className="relative size-32">
                                <svg
                                    className="size-full"
                                    viewBox="0 0 100 100"
                                >
                                    {/* Background track */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        className="text-muted/30"
                                    />
                                    {/* Slices */}
                                    {slices.map((slice, idx) => (
                                        <circle
                                            key={`slice-${idx}`}
                                            cx="50"
                                            cy="50"
                                            r={radius}
                                            fill="none"
                                            stroke={slice.color.stroke}
                                            strokeWidth="12"
                                            strokeDasharray={`${slice.dashLength} ${circumference - slice.dashLength}`}
                                            strokeDashoffset={-slice.offset}
                                            transform="rotate(-90 50 50)"
                                            className="transition-all duration-500"
                                        />
                                    ))}
                                </svg>
                                {/* Donut Center Metric */}
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                        Total
                                    </span>
                                    <span className="text-sm font-bold text-foreground tabular-nums">
                                        {totalQuantity.toLocaleString()}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground">
                                        unit diminta
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top 3 Breakdown List */}
                        <div className="divide-y divide-border/40 rounded-lg border border-border/60 bg-muted/10">
                            {slices.map((item, idx) => (
                                <div
                                    key={`${item.item_id}-${item.name}-${idx}`}
                                    className="flex items-center justify-between p-2.5 text-xs transition-colors hover:bg-muted/30"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5 pr-2">
                                        <span
                                            className={`flex size-5 shrink-0 items-center justify-center rounded-sm font-mono text-[10px] font-bold ${item.color.badge}`}
                                        >
                                            {item.color.label}
                                        </span>
                                        <div className="min-w-0">
                                            <p
                                                className="truncate text-xs font-medium text-foreground"
                                                title={item.name}
                                            >
                                                {item.name}
                                            </p>
                                            <div className="flex items-center gap-1.5 truncate text-[10px] text-muted-foreground">
                                                <span className="font-mono">
                                                    {item.sku}
                                                </span>
                                                {item.category &&
                                                    item.category !==
                                                        'Lainnya' && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate">
                                                                {item.category}
                                                            </span>
                                                        </>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="flex items-center justify-end gap-1.5 font-semibold text-foreground tabular-nums">
                                            <span
                                                className="size-2 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        item.color.stroke,
                                                }}
                                            />
                                            <span>{item.percent}%</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            {item.total_quantity.toLocaleString()}{' '}
                                            {item.unit} ({item.request_count}x)
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
