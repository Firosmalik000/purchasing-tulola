import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Clock, Store, Warehouse } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatQuantity } from '@/lib/utils';

type StoreType = { id: number; code: string; name: string };
type Item = {
    id: number;
    sku: string;
    name: string;
    min_stock?: number | null;
    target_stock?: number | null;
    unit: { symbol: string };
    stocks: { quantity: number }[];
    stock_standards: { standard_quantity: number; min_quantity?: number | null }[];
};
type Props = {
    stores: StoreType[];
    selectedStoreId: number;
    items: {
        data: Item[];
        links: PaginationLink[];
        current_page?: number;
        per_page?: number;
    };
};

export default function StoreInventory({
    stores,
    selectedStoreId,
    items,
}: Props) {
    const currentStore = stores.find((s) => s.id === selectedStoreId);
    const currentPage = items.current_page || 1;
    const perPage = items.per_page || 20;

    return (
        <>
            <Head title="Monitoring Stok Toko" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Inventaris"
                    title={`Stok Toko Cabang — ${currentStore ? `${currentStore.code} (${currentStore.name})` : ''}`}
                />

                {stores.length > 1 && (
                    <Card className="border-border/70 shadow-xs">
                        <CardContent className="p-3.5">
                            <label className="flex flex-col gap-2 text-xs font-semibold text-foreground sm:flex-row sm:items-center sm:gap-3">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <Store className="size-3.5" /> Pilih Toko
                                    Cabang:
                                </span>
                                <select
                                    className="form-select-custom h-9 max-w-xs text-xs"
                                    value={selectedStoreId}
                                    onChange={(event) =>
                                        router.get('/store/inventory', {
                                            store_id: event.target.value,
                                        })
                                    }
                                >
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id}>
                                            {store.code} — {store.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-border/70 shadow-xs">
                    <CardHeader className="border-b border-border/50 py-3.5">
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Warehouse className="size-3.5" />
                            </div>
                            <CardTitle className="text-sm font-semibold">
                                Daftar Stok Fisik & Kebutuhan
                            </CardTitle>
                        </div>
                    </CardHeader>

                    {(() => {
                        const criticalCount = items.data.filter((item) => {
                            const cur = Number(item.stocks[0]?.quantity ?? 0);
                            const minC = Number(item.stock_standards[0]?.min_quantity ?? item.min_stock ?? 0);
                            return minC > 0 && cur <= minC;
                        }).length;

                        return criticalCount > 0 ? (
                            <div className="flex items-center justify-between border-b border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-300">
                                <div className="flex items-center gap-2 font-medium">
                                    <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                    <span>
                                        <strong>Peringatan Stok Kritis:</strong> Terdapat {criticalCount} item di bawah standar minimal yang perlu diajukan permintaan (PR).
                                    </span>
                                </div>
                                <Link
                                    href="/store/requests/create"
                                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                                >
                                    Buat PR Sekarang &rarr;
                                </Link>
                            </div>
                        ) : null;
                    })()}

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border/60 bg-muted/40 font-semibold tracking-wider text-muted-foreground uppercase">
                                    <tr>
                                        <th className="w-12 px-3 py-3 text-center">
                                            #
                                        </th>
                                        <th className="px-4 py-3">
                                            Barang & SKU
                                        </th>
                                        <th className="px-3 py-3 text-center">
                                            Satuan
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Stok Fisik
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Min. Kritis
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Target Acuan
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Saran Permintaan
                                        </th>
                                        <th className="px-3 py-3 text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {items.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Belum ada data barang tercatat.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.data.map((item, index) => {
                                            const stock =
                                                Number(item.stocks[0]?.quantity ?? 0);
                                            const storeMin =
                                                item.stock_standards[0]?.min_quantity;
                                            const minCritical =
                                                Number(storeMin ?? item.min_stock ?? 0);

                                            const storeTarget =
                                                item.stock_standards[0]?.standard_quantity;
                                            const targetStock =
                                                Number(storeTarget ?? item.target_stock ?? minCritical);

                                            const suggested = Math.max(
                                                targetStock - stock,
                                                0,
                                            );
                                            const isCritical =
                                                minCritical > 0 &&
                                                stock <= minCritical;
                                            const isNeedRestock =
                                                !isCritical &&
                                                targetStock > 0 &&
                                                stock < targetStock;
                                            const rowNumber =
                                                (currentPage - 1) * perPage +
                                                index +
                                                1;

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={`transition-colors ${isCritical ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-muted/20'}`}
                                                >
                                                    <td className="px-3 py-3 text-center font-mono text-muted-foreground">
                                                        {rowNumber}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="font-semibold text-foreground">
                                                            {item.name}
                                                        </p>
                                                        <p className="font-mono text-[11px] text-muted-foreground">
                                                            {item.sku}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-3 text-center font-mono text-muted-foreground">
                                                        {item.unit.symbol}
                                                    </td>
                                                    <td className={`px-4 py-3 text-right font-mono font-bold tabular-nums ${isCritical ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-foreground'}`}>
                                                        {formatQuantity(stock)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400 font-medium tabular-nums">
                                                        {formatQuantity(
                                                            minCritical,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-foreground tabular-nums">
                                                        {formatQuantity(
                                                            targetStock,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                        {suggested > 0 ? (
                                                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                                                {formatQuantity(
                                                                    suggested,
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        {isCritical ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                                <AlertCircle className="size-3" />
                                                                Kritis (≤ Min)
                                                            </span>
                                                        ) : isNeedRestock ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                                <Clock className="size-3" />
                                                                Perlu Restock
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircle2 className="size-3" />
                                                                Aman
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-border/50 p-3">
                            <PaginationLinks pagination={items} />
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

StoreInventory.layout = {
    breadcrumbs: [
        { title: 'Portal Toko', href: '/store/dashboard' },
        { title: 'Stok', href: '/store/inventory' },
    ],
};
