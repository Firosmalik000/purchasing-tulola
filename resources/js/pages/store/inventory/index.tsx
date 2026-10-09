import { Head, router } from '@inertiajs/react';
import { AlertCircle, Store, Warehouse } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type StoreType = { id: number; code: string; name: string };
type Item = {
    id: number;
    sku: string;
    name: string;
    unit: { symbol: string };
    stocks: { quantity: string }[];
    stock_standards: { standard_quantity: string }[];
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
                                Daftar Posisi Saldo Fisik & Kebutuhan
                            </CardTitle>
                        </div>
                    </CardHeader>

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
                                            Saldo Saat Ini
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Standar Min
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
                                                colSpan={7}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Belum ada data barang tercatat.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.data.map((item, index) => {
                                            const stock =
                                                item.stocks[0]?.quantity ??
                                                '0.000';
                                            const standard =
                                                item.stock_standards[0]
                                                    ?.standard_quantity ??
                                                '0.000';
                                            const suggested = Math.max(
                                                Number(standard) -
                                                    Number(stock),
                                                0,
                                            );
                                            const isLow =
                                                Number(stock) <
                                                Number(standard);
                                            const rowNumber =
                                                (currentPage - 1) * perPage +
                                                index +
                                                1;

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="transition-colors hover:bg-muted/20"
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
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-foreground tabular-nums">
                                                        {stock}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-muted-foreground tabular-nums">
                                                        {standard}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                        {suggested > 0 ? (
                                                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                                                {suggested.toFixed(
                                                                    3,
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        {isLow ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                                <AlertCircle className="size-3" />
                                                                Kritis
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
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
