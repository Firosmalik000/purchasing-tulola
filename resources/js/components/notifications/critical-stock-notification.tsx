import { Link, usePage } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, ArrowRight, Bell, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                            {count > 99 ? '99+' : count}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-80 sm:w-96 p-0 shadow-lg border-border/80"
                sideOffset={8}
            >
                <div className="flex items-center justify-between border-b border-border/60 px-3.5 py-2.5 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className={`size-4 ${count > 0 ? 'text-rose-500' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-semibold text-foreground">
                            Peringatan Stok Kritis
                        </span>
                    </div>
                    {count > 0 ? (
                        <Badge variant="destructive" className="text-[10px] h-5 px-1.5 font-bold">
                            {count} Item Kritis
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            Aman
                        </Badge>
                    )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
                    {count === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <p className="text-xs font-semibold text-foreground">Semua Stok Aman</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Tidak ada item dengan jumlah stok di bawah batas minimal kritis.
                            </p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <Link
                                key={`${item.store_id}-${item.item_id}`}
                                href={inventoryUrl}
                                className="flex flex-col gap-1 p-3 transition-colors hover:bg-muted/50 text-left block"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-foreground truncate">
                                            {item.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                            <span className="font-mono">{item.sku}</span>
                                            {!isStore && (
                                                <>
                                                    <span>•</span>
                                                    <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-foreground">
                                                        {item.store_code}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                        <AlertCircle className="size-2.5" />
                                        Kritis
                                    </span>
                                </div>

                                <div className="mt-1 flex items-center justify-between text-[11px] bg-muted/40 rounded-md px-2 py-1">
                                    <div>
                                        <span className="text-muted-foreground">Stok Fisik: </span>
                                        <strong className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                                            {item.current_stock.toLocaleString('id-ID')} {item.unit}
                                        </strong>
                                    </div>
                                    <div className="text-muted-foreground">
                                        Min: <span className="font-mono text-foreground font-medium">{item.min_stock.toLocaleString('id-ID')}</span>
                                        {' | '}
                                        Target: <span className="font-mono text-foreground font-medium">{item.target_stock.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                <div className="border-t border-border/60 p-2 bg-muted/20">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="w-full justify-center h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
                    >
                        <Link href={inventoryUrl}>
                            Lihat Manajemen Stok
                            <ArrowRight className="ml-1.5 size-3.5" />
                        </Link>
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
