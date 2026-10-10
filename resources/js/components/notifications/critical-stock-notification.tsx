import { Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Bell,
    CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type CriticalStockItem = {
    item_id: number;
    name: string;
    sku: string;
    unit: string;
    store_id: number;
    store_code: string;
    store_name: string;
    current_stock: number;
    min_stock: number;
    target_stock: number;
    deficit: number;
};

type CriticalStockData = {
    count: number;
    items: CriticalStockItem[];
};

export function CriticalStockNotification() {
    const { criticalStock, auth } = usePage().props as unknown as {
        criticalStock?: CriticalStockData;
        auth?: { user?: { role?: string } };
    };

    const isStore = auth?.user?.role === 'STORE_PIC';
    const inventoryUrl = isStore ? '/store/inventory' : '/central/inventory';

    const count = criticalStock?.count ?? 0;
    const items = criticalStock?.items ?? [];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={
                        count > 0
                            ? `${count} item stok dalam kondisi kritis`
                            : 'Notifikasi stok: Semua stok aman'
                    }
                    aria-label="Notifikasi Stok Kritis"
                >
                    <Bell className="size-4" />
                    {count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
                            {count > 99 ? '99+' : count}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-80 border-border/80 p-0 shadow-lg sm:w-96"
                sideOffset={8}
            >
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                        <AlertTriangle
                            className={`size-4 ${count > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}
                        />
                        <span className="text-xs font-semibold text-foreground">
                            Peringatan Stok Gudang Pusat
                        </span>
                    </div>
                    {count > 0 ? (
                        <Badge
                            variant="destructive"
                            className="h-5 px-1.5 text-[10px] font-bold"
                        >
                            {count} Item Kritis
                        </Badge>
                    ) : (
                        <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                        >
                            Aman
                        </Badge>
                    )}
                </div>

                <div className="max-h-80 divide-y divide-border/40 overflow-y-auto">
                    {count === 0 ? (
                        <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                            <div className="mb-2 flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <p className="text-xs font-semibold text-foreground">
                                Semua Stok Gudang Pusat Aman
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Tidak ada item dengan jumlah stok di bawah batas
                                minimal kritis di Gudang Pusat.
                            </p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <Link
                                key={`${item.store_id}-${item.item_id}`}
                                href={inventoryUrl}
                                className="block flex flex-col gap-1 p-3 text-left transition-colors hover:bg-muted/50"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-foreground">
                                            {item.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                            <span className="font-mono">
                                                {item.sku}
                                            </span>
                                            {!isStore && (
                                                <>
                                                    <span>•</span>
                                                    <span className="py-0.2 rounded bg-muted px-1.5 text-[10px] font-medium text-foreground">
                                                        Gudang Pusat
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                        <AlertCircle className="size-2.5" />
                                        Kritis
                                    </span>
                                </div>

                                <div className="mt-1 flex items-center justify-between rounded-md bg-muted/40 px-2 py-1 text-[11px]">
                                    <div>
                                        <span className="text-muted-foreground">
                                            Stok Fisik:{' '}
                                        </span>
                                        <strong className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                            {item.current_stock.toLocaleString(
                                                'id-ID',
                                            )}{' '}
                                            {item.unit}
                                        </strong>
                                    </div>
                                    <div className="text-muted-foreground">
                                        Min:{' '}
                                        <span className="font-mono font-medium text-foreground">
                                            {item.min_stock.toLocaleString(
                                                'id-ID',
                                            )}
                                        </span>
                                        {' | '}
                                        Target:{' '}
                                        <span className="font-mono font-medium text-foreground">
                                            {item.target_stock.toLocaleString(
                                                'id-ID',
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                <div className="border-t border-border/60 bg-muted/20 p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-full justify-center text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
                    >
                        <Link href={inventoryUrl}>
                            Lihat Manajemen Stok Gudang Pusat
                            <ArrowRight className="ml-1.5 size-3.5" />
                        </Link>
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
