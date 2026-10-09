import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    CheckCircle2,
    FileText,
    Save,
    Store,
} from 'lucide-react';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { PageHeader } from '@/components/common/page-header';
import {
    WorkflowStepper,
    getPurchaseOrderSteps,
} from '@/components/common/workflow-stepper';
import InputError from '@/components/input-error';
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
    allocations: Allocation[];
};
type Order = {
    id: number;
    number: string;
    status: string;
    order_date: string;
    expected_date: string | null;
    notes: string | null;
    creator: { name: string };
    purchase_request?: {
        number: string;
        store: { code: string; name: string };
    } | null;
    items: OrderItem[];
};
type Props = {
    purchaseOrder: Order;
    canUpdate: boolean;
    canPlace: boolean;
    canCancel: boolean;
};
export default function OrderShow({
    purchaseOrder,
    canUpdate,
    canPlace,
    canCancel,
}: Props) {
    return (
        <>
            <Head title={`Order ${purchaseOrder.number} — Tulola Purchasing`} />
            <main className="flex flex-1 flex-col gap-6 p-4 pb-20 md:p-6">
                <PageHeader
                    badge="Detail Order Internal"
                    title={purchaseOrder.number}
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/central/orders">
                                    <ArrowLeft className="mr-1.5 size-4" />
                                    Daftar Order
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
                            {/* Internal order information */}
                            <Card className="border border-border/70 shadow-xs">
                                <CardHeader className="border-b border-border/60 pb-3">
                                    <CardTitle className="flex items-center gap-2 font-serif text-base font-bold">
                                        <FileText className="size-4 text-primary" />
                                        Informasi Order Internal
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
                                    <Metric
                                        label="Request"
                                        value={
                                            purchaseOrder.purchase_request
                                                ?.number ?? 'Data lama'
                                        }
                                    />
                                    <Metric
                                        label="Toko Tujuan"
                                        value={
                                            purchaseOrder.purchase_request
                                                ? `${purchaseOrder.purchase_request.store.code} — ${purchaseOrder.purchase_request.store.name}`
                                                : '—'
                                        }
                                    />
                                    <Metric
                                        label="Tanggal Dibuat"
                                        value={new Date(
                                            purchaseOrder.order_date,
                                        ).toLocaleDateString('id-ID')}
                                    />
                                    <Field
                                        label="Target Diterima Toko"
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
                                    <div className="sm:col-span-2 xl:col-span-4">
                                        <Field
                                            label="Catatan Internal"
                                            name="notes"
                                            value={purchaseOrder.notes ?? ''}
                                            disabled={!canUpdate}
                                        />
                                    </div>
                                    <InputError message={errors.notes} />
                                </CardContent>
                            </Card>

                            {/* Line Items Card */}
                            <Card className="border border-border/70 shadow-xs">
                                <CardHeader className="border-b border-border/60 pb-3">
                                    <CardTitle className="font-serif text-base font-bold">
                                        Rincian Item & Alokasi Toko (
                                        {purchaseOrder.items.length} Item)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-4">
                                    {purchaseOrder.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="grid gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-border lg:grid-cols-[2fr_1fr] lg:items-center"
                                        >
                                            <div className="space-y-1.5">
                                                <p className="font-serif text-sm font-bold text-foreground">
                                                    {item.item_type === 'STOCK'
                                                        ? item.item?.name
                                                        : item.name}
                                                </p>
                                                <p className="font-mono text-xs text-muted-foreground">
                                                    {item.item?.sku ??
                                                        'Permintaan Khusus Toko Cabang'}{' '}
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
                                                                    {
                                                                        allocation
                                                                            .purchase_request_item
                                                                            .purchase_request
                                                                            .store
                                                                            .code
                                                                    }
                                                                </strong>
                                                                :{' '}
                                                                {
                                                                    allocation.allocated_quantity
                                                                }
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                            <Metric
                                                label="Quantity Order"
                                                value={`${item.quantity} ${item.unit.symbol}`}
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {canUpdate && (
                                <div className="flex justify-end">
                                    <Button
                                        disabled={processing}
                                        className="h-10 px-5 font-medium shadow-xs"
                                    >
                                        <Save className="mr-2 size-4" />
                                        Simpan Informasi Order
                                    </Button>
                                </div>
                            )}
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
                                    <Ban className="mr-1.5 size-4" /> Batalkan
                                    Order
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
                                <Button
                                    disabled={processing}
                                    size="sm"
                                    className="h-9 font-medium shadow-xs"
                                >
                                    <CheckCircle2 className="mr-1.5 size-4" />{' '}
                                    Kirim Order ke Toko
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
            <Label htmlFor={name} className="text-xs font-semibold">
                {label}
            </Label>
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
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </p>
            <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
                {value}
            </p>
        </div>
    );
}

OrderShow.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Order Internal', href: '/central/orders' },
        { title: 'Detail Order', href: '#' },
    ],
};
