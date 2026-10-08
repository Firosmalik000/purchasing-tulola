import { Form, Head, Link } from '@inertiajs/react';
import {
    Boxes,
    Check,
    CheckSquare,
    ListChecks,
    Search,
    ShoppingCart,
    Store,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { formatMoney } from '@/components/common/money-display';
import { PageHeader } from '@/components/common/page-header';
import {
    PaginationLinks,
    type PaginationLink,
} from '@/components/common/pagination-links';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PlanLine = {
    id: number;
    type: 'STOCK' | 'SPECIAL';
    label: string;
    sku: string | null;
    unit: string;
    store: { code: string; name: string };
    request_number: string;
    requested_quantity: string;
    approved_quantity: string;
    allocated_quantity: string;
    available_quantity: string;
    last_unit_price: string;
    estimated_total: string;
};
type Group = {
    key: string;
    label: string;
    stores: string[];
    total_requested: string;
    total_approved: string;
    total_available: string;
    estimated_total: string;
    lines: PlanLine[];
};
type Props = {
    plan: { data: Group[]; links: PaginationLink[] };
    suppliers: {
        id: number;
        code: string;
        name: string;
        payment_term: string | null;
    }[];
    filters: { group_by: string; keyword: string };
};
const selectClass =
    'h-9 w-full rounded-md border border-input bg-card px-3 text-xs text-foreground shadow-xs transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20';

export default function PlanningIndex({ plan, suppliers, filters }: Props) {
    const lines = plan.data.flatMap((group) => group.lines);
    const [selected, setSelected] = useState<number[]>([]);
    const [quantities, setQuantities] = useState<Record<number, string>>(() =>
        Object.fromEntries(
            lines.map((line) => [line.id, line.available_quantity]),
        ),
    );
    const toggle = (id: number, checked: boolean) =>
        setSelected((values) =>
            checked
                ? [...new Set([...values, id])]
                : values.filter((value) => value !== id),
        );
    const selectedLines = lines.filter((line) => selected.includes(line.id));

    return (
        <>
            <Head title="Purchase Planning — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 pb-24">
                <PageHeader
                    badge="Konsolidasi Pengadaan"
                    title="Purchase Planning (Perencanaan PO)"
                    description="Gabungkan approved request dari berbagai butik menjadi draft pesanan grosir (PO) yang efisien ke rekanan supplier."
                    actions={
                        <Button variant="outline" asChild className="h-9 shadow-xs">
                            <Link href="/central/orders">
                                <ShoppingCart className="mr-1.5 size-4" />
                                Lihat Daftar Pesanan (PO)
                            </Link>
                        </Button>
                    }
                />

                {/* Filter Toolbar */}
                <Card className="border border-border/70 shadow-xs">
                    <CardContent className="p-4">
                        <Form
                            action="/central/purchase-planning"
                            method="get"
                            className="grid gap-3 sm:grid-cols-[1fr_200px_auto_auto]"
                        >
                            <div className="relative">
                                <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    name="keyword"
                                    defaultValue={filters.keyword}
                                    placeholder="Cari item, SKU, atau butik..."
                                    className="h-9 pl-9 text-xs"
                                />
                            </div>
                            <div>
                                <select
                                    name="group_by"
                                    defaultValue={filters.group_by}
                                    className={selectClass}
                                    aria-label="Kelompokkan berdasarkan"
                                >
                                    <option value="item">Grup: Per Item</option>
                                    <option value="store">Grup: Per Butik</option>
                                    <option value="category">Grup: Per Kategori</option>
                                </select>
                            </div>
                            <Button size="sm" className="h-9 px-4 font-medium shadow-xs">
                                Terapkan
                            </Button>
                            {(filters.keyword || filters.group_by) && (
                                <Button variant="ghost" size="sm" className="h-9 text-xs" asChild>
                                    <Link href="/central/purchase-planning">
                                        Reset
                                    </Link>
                                </Button>
                            )}
                        </Form>
                    </CardContent>
                </Card>
                <Form
                    action="/central/orders"
                    method="post"
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            {plan.data.length === 0 ? (
                                <EmptyState
                                    icon={ListChecks}
                                    title="Tidak ada kebutuhan terbuka"
                                    description="Semua kuantitas yang disetujui telah dialokasikan ke PO atau belum ada permintaan yang disetujui."
                                />
                            ) : (
                                <>
                                    {plan.data.map((group) => (
                                        <Card key={group.key} className="border border-border/70 shadow-xs">
                                            <CardHeader className="border-b border-border/60 pb-3">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <CardTitle className="font-serif text-base font-bold">
                                                            {group.label}
                                                        </CardTitle>
                                                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Store className="size-3.5 text-muted-foreground" />
                                                            Butik: {group.stores.join(', ')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs sm:text-right">
                                                        <div className="rounded-md border border-border/60 bg-muted/30 px-2.5 py-1">
                                                            <span className="text-muted-foreground">Tersedia: </span>
                                                            <strong className="font-mono text-foreground font-semibold">
                                                                {group.total_available}
                                                            </strong>
                                                        </div>
                                                        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-900 dark:text-amber-200">
                                                            <span className="text-[11px]">Estimasi: </span>
                                                            <strong className="font-mono font-semibold">
                                                                {formatMoney(group.estimated_total)}
                                                            </strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-2.5 pt-4">
                                                {group.lines.map((line) => {
                                                    const checked = selected.includes(line.id);
                                                    return (
                                                        <div
                                                            key={line.id}
                                                            className={`grid gap-3 rounded-xl border p-4 transition-all sm:grid-cols-[auto_2fr_repeat(4,1fr)] sm:items-center ${
                                                                checked
                                                                    ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20 dark:bg-amber-500/10'
                                                                    : 'border-border/60 bg-card hover:border-border'
                                                            }`}
                                                        >
                                                            <Checkbox
                                                                checked={checked}
                                                                onCheckedChange={(value) =>
                                                                    toggle(line.id, value === true)
                                                                }
                                                                aria-label={`Pilih ${line.label} ${line.store.code}`}
                                                                className="size-4"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="font-serif text-sm font-bold text-foreground">
                                                                    {line.label}
                                                                </p>
                                                                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                                                                    <span className="rounded bg-muted px-1.5 py-0.5 text-foreground font-medium">
                                                                        {line.request_number}
                                                                    </span>{' '}
                                                                    · Butik {line.store.code}
                                                                    {line.sku ? ` · SKU: ${line.sku}` : ''}
                                                                </p>
                                                            </div>
                                                            <Metric
                                                                label="Diminta"
                                                                value={`${line.requested_quantity} ${line.unit}`}
                                                            />
                                                            <Metric
                                                                label="Disetujui"
                                                                value={`${line.approved_quantity} ${line.unit}`}
                                                            />
                                                            <Metric
                                                                label="Teralokasi"
                                                                value={`${line.allocated_quantity} ${line.unit}`}
                                                            />
                                                            <div>
                                                                <Label
                                                                    htmlFor={`quantity-${line.id}`}
                                                                    className="text-[11px] font-semibold text-muted-foreground"
                                                                >
                                                                    Alokasi ({line.unit})
                                                                </Label>
                                                                <Input
                                                                    id={`quantity-${line.id}`}
                                                                    type="number"
                                                                    min="0.001"
                                                                    max={line.available_quantity}
                                                                    step="0.001"
                                                                    value={
                                                                        quantities[line.id] ??
                                                                        line.available_quantity
                                                                    }
                                                                    disabled={!checked}
                                                                    onChange={(event) =>
                                                                        setQuantities((values) => ({
                                                                            ...values,
                                                                            [line.id]: event.target.value,
                                                                        }))
                                                                    }
                                                                    className="h-8 font-mono text-xs font-semibold"
                                                                />
                                                                {checked && (
                                                                    <>
                                                                        <input
                                                                            type="hidden"
                                                                            name={`allocations[${line.id}][purchase_request_item_id]`}
                                                                            value={line.id}
                                                                        />
                                                                        <input
                                                                            type="hidden"
                                                                            name={`allocations[${line.id}][allocated_quantity]`}
                                                                            value={
                                                                                quantities[line.id] ??
                                                                                line.available_quantity
                                                                            }
                                                                        />
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </CardContent>
                                        </Card>
                                    ))}
                                    <PaginationLinks links={plan.links} />
                                </>
                            )}

                            {/* Sticky PO Creation Drawer */}
                            {selectedLines.length > 0 && (
                                <Card className="sticky bottom-4 z-20 border-2 border-amber-500/40 bg-card/95 shadow-xl backdrop-blur-md">
                                    <CardHeader className="border-b border-border/60 p-4 pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2 font-serif text-base font-bold text-foreground">
                                                <ShoppingCart className="size-4 text-amber-600 dark:text-amber-400" />
                                                Terbitkan Draft Purchase Order (PO)
                                            </CardTitle>
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {selectedLines.length} item alokasi terpilih
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
                                        <div>
                                            <Label htmlFor="supplier_id" className="text-xs font-semibold">
                                                Supplier Rekanan
                                            </Label>
                                            <select
                                                id="supplier_id"
                                                name="supplier_id"
                                                className={selectClass}
                                            >
                                                <option value="">Pilih Supplier...</option>
                                                {suppliers.map((supplier) => (
                                                    <option
                                                        key={supplier.id}
                                                        value={supplier.id}
                                                    >
                                                        {supplier.code} — {supplier.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="order_date" className="text-xs font-semibold">
                                                Tanggal Terbit PO
                                            </Label>
                                            <Input
                                                id="order_date"
                                                name="order_date"
                                                type="date"
                                                defaultValue={new Date()
                                                    .toISOString()
                                                    .slice(0, 10)}
                                                required
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="expected_date" className="text-xs font-semibold">
                                                Estimasi Tiba di Gudang
                                            </Label>
                                            <Input
                                                id="expected_date"
                                                name="expected_date"
                                                type="date"
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="payment_term" className="text-xs font-semibold">
                                                Termin Pembayaran (TOP)
                                            </Label>
                                            <Input
                                                id="payment_term"
                                                name="payment_term"
                                                placeholder="Contoh: NET 30 Hari"
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor="notes" className="text-xs font-semibold">
                                                Catatan untuk Supplier
                                            </Label>
                                            <Input
                                                id="notes"
                                                name="notes"
                                                placeholder="Instruksi packing, nomor kontak ekspedisi..."
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="payment_method" className="text-xs font-semibold">
                                                Metode Bayar
                                            </Label>
                                            <Input
                                                id="payment_method"
                                                name="payment_method"
                                                placeholder="Transfer BCA / BNI"
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="flex items-end justify-end">
                                            <Button disabled={processing} className="h-9 w-full font-medium shadow-xs">
                                                <ShoppingCart className="mr-2 size-4" />
                                                Buat Purchase Order
                                            </Button>
                                        </div>
                                        <InputError
                                            message={errors.allocations}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </Form>
            </main>
        </>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="font-mono text-xs font-semibold tabular-nums text-foreground">{value}</p>
        </div>
    );
}

PlanningIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Purchase Planning', href: '/central/purchase-planning' },
    ],
};
