import { Head, router } from '@inertiajs/react';
import { AlertCircle, Store, Warehouse } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Store = { id: number; code: string; name: string };
type Item = {
    id: number;
    sku: string;
    name: string;
    unit: { symbol: string };
    stocks: { quantity: string }[];
    stock_standards: { standard_quantity: string }[];
};
type Props = {
    stores: Store[];
    selectedStoreId: number;
    items: { data: Item[]; links: PaginationLink[] };
};

export default function StoreInventory({
    stores,
    selectedStoreId,
    items,
}: Props) {
    const currentStore = stores.find((s) => s.id === selectedStoreId);

    return (
        <>
            <Head title="Monitoring Stok Toko" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Inventaris & Butik"
                    title="Monitoring Stok Toko"
                    description={`Pantau saldo persediaan resmi dan batas standar minimum butik ${currentStore ? `${currentStore.code} — ${currentStore.name}` : ''}. Penyesuaian stok resmi diatur oleh Kantor Pusat.`}
                />

                {stores.length > 1 && (
                    <Card className="border-border/70 shadow-xs">
                        <CardContent className="p-4">
                            <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 text-xs font-semibold text-foreground">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <Store className="size-4" /> Pilih Butik:
                                </span>
                                <select
                                    className="form-select-custom h-9 max-w-sm"
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
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Warehouse className="size-4" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Daftar Posisi Saldo Fisik & Kebutuhan
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Perhitungan saran permintaan otomatis dihitung dari selisih standar minimum terhadap saldo stok saat ini
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5">
                        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                            {items.data.map((item) => {
                                const stock =
                                    item.stocks[0]?.quantity ?? '0.000';
                                const standard =
                                    item.stock_standards[0]?.standard_quantity ?? '0.000';
                                const suggested = Math.max(
                                    Number(standard) - Number(stock),
                                    0,
                                );
                                const isLow = Number(stock) < Number(standard);

                                return (
                                    <article
                                        key={item.id}
                                        className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border"
                                    >
                                        <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-foreground truncate">
                                                    {item.name}
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                                    {item.sku} · {item.unit.symbol}
                                                </p>
                                            </div>
                                            {isLow && (
                                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                    <AlertCircle className="size-3" />
                                                    Kritis
                                                </span>
                                            )}
                                        </div>

                                        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                                            <div
                                                className={`rounded-lg p-2 ${
                                                    isLow
                                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                        : 'bg-muted/40 text-foreground'
                                                }`}
                                            >
                                                <dt className="text-[11px] font-medium text-muted-foreground">
                                                    Stok Saat Ini
                                                </dt>
                                                <dd className="mt-0.5 font-mono text-sm font-bold tabular-nums">
                                                    {stock}
                                                </dd>
                                            </div>

                                            <div className="rounded-lg bg-muted/40 p-2 text-foreground">
                                                <dt className="text-[11px] font-medium text-muted-foreground">
                                                    Standar Butik
                                                </dt>
                                                <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                                                    {standard}
                                                </dd>
                                            </div>

                                            <div
                                                className={`rounded-lg p-2 ${
                                                    suggested > 0
                                                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                                        : 'bg-muted/40 text-muted-foreground'
                                                }`}
                                            >
                                                <dt className="text-[11px] font-medium text-muted-foreground">
                                                    Saran Minta
                                                </dt>
                                                <dd className="mt-0.5 font-mono text-sm font-bold tabular-nums">
                                                    {suggested.toFixed(3)}
                                                </dd>
                                            </div>
                                        </dl>
                                    </article>
                                );
                            })}
                        </div>

                        <div className="mt-6">
                            <PaginationLinks links={items.links} />
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
