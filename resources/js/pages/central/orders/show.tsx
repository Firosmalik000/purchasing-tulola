import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    CheckCircle2,
    Clock,
    FileText,
    Save,
    ShoppingCart,
    Store,
    Truck,
} from 'lucide-react';
import { MoneyDisplay } from '@/components/common/money-display';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { PageHeader } from '@/components/common/page-header';
import {
    WorkflowStepper,
    getPurchaseOrderSteps,
} from '@/components/common/workflow-stepper';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Allocation = {
    id: number;
    allocated_quantity: string;
    purchase_request_item: {
        purchase_request: {
            number: string;
            store: { code: string; name: string };
        };
    };
};
type OrderItem = {
    id: number;
    item_type: 'STOCK' | 'SPECIAL';
    item: { sku: string; name: string } | null;
    name: string | null;
    unit: { symbol: string };
    quantity: string;
    unit_price: string;
    total: string;
    allocations: Allocation[];
};
type Order = {
    id: number;
    number: string;
    status: string;
    supplier_id: number | null;
    order_date: string;
    expected_date: string | null;
    payment_method: string | null;
    payment_term: string | null;
    notes: string | null;
    creator: { name: string };
    supplier: { code: string; name: string } | null;
    items: OrderItem[];
};
type Props = {
    purchaseOrder: Order;
    suppliers: {
        id: number;
        code: string;
        name: string;
        payment_term: string | null;
    }[];
    grandTotal: string;
    canUpdate: boolean;
    canPlace: boolean;
    canAdvance: boolean;
    canCancel: boolean;
};
const selectClass =
    'h-9 w-full rounded-md border border-input bg-card px-3 text-xs text-foreground shadow-xs transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60';

export default function OrderShow({
    purchaseOrder,
    suppliers,
    grandTotal,
    canUpdate,
    canPlace,
    canAdvance,
    canCancel,
}: Props) {
    return (
        <>
            <Head title={`PO ${purchaseOrder.number} — Tulola Purchasing`} />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 pb-20">
                <PageHeader
                    badge="Detail PO"
                    title={purchaseOrder.number}
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/central/orders">
                                    <ArrowLeft className="mr-1.5 size-4" />
                                    Daftar PO
                                </Link>
                            </Button>
                            <OrderStatusBadge status={purchaseOrder.status} />
                        </div>
                    }
                />

                {/* Workflow Stepper */}
                <WorkflowStepper
                    steps={getPurchaseOrderSteps(purchaseOrder.status)}
                />

                <Form
                    action={`/central/orders/${purchaseOrder.id}`}
                    method="put"
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Supplier & Order Info Card */}
                            <Card className="border border-border/70 shadow-xs">
                                <CardHeader className="border-b border-border/60 pb-3">
                                    <CardTitle className="flex items-center gap-2 font-serif text-base font-bold">
                                        <FileText className="size-4 text-amber-600 dark:text-amber-400" />
                                        Informasi Rekanan & Dokumen PO
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
                                    <div>
                                        <Label htmlFor="supplier_id" className="text-xs font-semibold">
                                            Supplier Rekanan
                                        </Label>
                                        <select
                                            id="supplier_id"
                                            name="supplier_id"
                                            defaultValue={
                                                purchaseOrder.supplier_id ?? ''
                                            }
                                            disabled={!canUpdate}
                                            className={selectClass}
                                        >
                                            <option value="">
                                                Belum ditentukan
                                            </option>
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
                                    <Field
                                        label="Tanggal Pesanan"
                                        name="order_date"
                                        type="date"
                                        value={purchaseOrder.order_date.slice(
                                            0,
                                            10,
                                        )}
                                        disabled={!canUpdate}
                                    />
                                    <Field
                                        label="Estimasi Tiba di Gudang"
                                        name="expected_date"
                                        type="date"
                                        value={
                                            purchaseOrder.expected_date?.slice(
                                                0,
                                                10,
                                            ) ?? ''
                                        }
                                        disabled={!canUpdate}
                                    />
                                    <Field
                                        label="Metode Pembayaran"
                                        name="payment_method"
                                        value={
                                            purchaseOrder.payment_method ?? ''
                                        }
                                        disabled={!canUpdate}
                                    />
                                    <Field
                                        label="Termin Pembayaran (TOP)"
                                        name="payment_term"
                                        value={purchaseOrder.payment_term ?? ''}
                                        disabled={!canUpdate}
                                    />
                                    <div className="sm:col-span-2 xl:col-span-3">
                                        <Field
                                            label="Catatan Khusus untuk Supplier"
                                            name="notes"
                                            value={purchaseOrder.notes ?? ''}
                                            disabled={!canUpdate}
                                        />
                                    </div>
                                    <InputError message={errors.items} />
                                </CardContent>
                            </Card>

                            {/* Line Items Card */}
                            <Card className="border border-border/70 shadow-xs">
                                <CardHeader className="border-b border-border/60 pb-3">
                                    <CardTitle className="font-serif text-base font-bold">
                                        Rincian Item & Alokasi Toko ({purchaseOrder.items.length} Item)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-4">
                                    {purchaseOrder.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="grid gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-border lg:grid-cols-[2fr_1fr_1fr_1fr] lg:items-center"
                                        >
                                            <input
                                                type="hidden"
                                                name={`items[${item.id}][id]`}
                                                value={item.id}
                                            />
                                            <div className="space-y-1.5">
                                                <p className="font-serif text-sm font-bold text-foreground">
                                                    {item.item_type === 'STOCK'
                                                        ? item.item?.name
                                                        : item.name}
                                                </p>
                                                <p className="font-mono text-xs text-muted-foreground">
                                                    {item.item?.sku ??
                                                        'Permintaan Khusus Butik'}{' '}
                                                    · Satuan: {item.unit.symbol}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {item.allocations.map(
                                                        (allocation) => (
                                                            <span
                                                                key={
                                                                    allocation.id
                                                                }
                                                                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                                                            >
                                                                <Store className="size-3 text-muted-foreground" />
                                                                <strong className="text-foreground">
                                                                    {allocation.purchase_request_item.purchase_request.store.code}
                                                                </strong>
                                                                : {allocation.allocated_quantity}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                            <Metric
                                                label="Kuantitas PO"
                                                value={`${item.quantity} ${item.unit.symbol}`}
                                            />
                                            <div>
                                                <Label
                                                    htmlFor={`price-${item.id}`}
                                                    className="text-[11px] font-semibold text-muted-foreground uppercase"
                                                >
                                                    Harga Satuan (Rp)
                                                </Label>
                                                <Input
                                                    id={`price-${item.id}`}
                                                    name={`items[${item.id}][unit_price]`}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    defaultValue={
                                                        item.unit_price
                                                    }
                                                    disabled={!canUpdate}
                                                    required
                                                    className="h-8 font-mono text-xs font-semibold"
                                                />
                                            </div>
                                            <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-right">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Subtotal
                                                </p>
                                                <MoneyDisplay
                                                    value={item.total}
                                                    className="mt-0.5 block font-mono text-sm font-bold text-foreground"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Grand Total Summary Card */}
                            <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-card to-amber-500/5 shadow-xs">
                                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Grand Total Pembelian
                                        </p>
                                        <MoneyDisplay
                                            value={grandTotal}
                                            className="font-serif text-2xl font-bold text-foreground md:text-3xl"
                                        />
                                    </div>
                                    {canUpdate && (
                                        <Button disabled={processing} className="h-10 px-5 font-medium shadow-xs">
                                            <Save className="mr-2 size-4" />
                                            Simpan Perubahan Harga & Supplier
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </Form>

                {/* Status Advancement Action Bar */}
                <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
                    {canCancel && (
                        <Form
                            action={`/central/orders/${purchaseOrder.id}/cancel`}
                            method="post"
                        >
                            {({ processing }) => (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={processing}
                                    className="h-9 shadow-xs"
                                >
                                    <Ban className="mr-1.5 size-4" /> Batalkan Draft PO
                                </Button>
                            )}
                        </Form>
                    )}
                    {canPlace && (
                        <Form
                            action={`/central/orders/${purchaseOrder.id}/place`}
                            method="post"
                        >
                            {({ processing }) => (
                                <Button disabled={processing} size="sm" className="h-9 font-medium shadow-xs">
                                    <CheckCircle2 className="mr-1.5 size-4" /> Tandai Dipesan ke Vendor
                                </Button>
                            )}
                        </Form>
                    )}
                    {canAdvance && (
                        <Form
                            action={`/central/orders/${purchaseOrder.id}/wait-for-receipt`}
                            method="post"
                        >
                            {({ processing }) => (
                                <Button disabled={processing} size="sm" className="h-9 font-medium shadow-xs">
                                    <Truck className="mr-1.5 size-4" /> Kirim & Menunggu Diterima
                                </Button>
                            )}
                        </Form>
                    )}
                </div>
            </main>
        </>
    );
}

function Field({
    label,
    name,
    value,
    type = 'text',
    disabled,
}: {
    label: string;
    name: string;
    value: string;
    type?: string;
    disabled: boolean;
}) {
    return (
        <div className="space-y-1">
            <Label htmlFor={name} className="text-xs font-semibold">{label}</Label>
            <Input
                id={name}
                name={name}
                type={type}
                defaultValue={value}
                disabled={disabled}
                className="h-9 text-xs"
            />
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="font-mono text-sm font-semibold tabular-nums text-foreground">{value}</p>
        </div>
    );
}

OrderShow.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Pesanan (PO)', href: '/central/orders' },
        { title: 'Detail PO', href: '#' },
    ],
};
