import { Form, Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    FileText,
    Package,
    Plus,
    Search,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Store = { id: number; code: string; name: string };
type Unit = { id: number; name: string; symbol: string };
type Item = {
    id: number;
    sku: string;
    name: string;
    unit: Unit;
    stocks: { quantity: string }[];
    stock_standards: { standard_quantity: string }[];
};
type RequestItem = {
    id: number;
    type: 'STOCK' | 'SPECIAL';
    item_id: number | null;
    name: string | null;
    description: string | null;
    unit_id: number;
    requested_quantity: string;
    required_date: string | null;
    reason: string | null;
};
type PurchaseRequest = {
    id: number;
    number: string;
    store_id: number;
    required_date: string | null;
    notes: string | null;
    items: RequestItem[];
};
type StockLine = { key: number; item_id: string; requested_quantity: string };
type SpecialLine = {
    key: number;
    name: string;
    description: string;
    unit_id: string;
    requested_quantity: string;
    required_date: string;
    reason: string;
};
type Props = {
    stores: Store[];
    selectedStoreId: number;
    items: Item[];
    units: Unit[];
    purchaseRequest: PurchaseRequest | null;
};

let nextKey = 1000;

export default function RequestForm({
    stores,
    selectedStoreId,
    items,
    units,
    purchaseRequest,
}: Props) {
    const [itemSearch, setItemSearch] = useState('');
    const [stockLines, setStockLines] = useState<StockLine[]>(
        () =>
            purchaseRequest?.items
                .filter((line) => line.type === 'STOCK')
                .map((line) => ({
                    key: line.id,
                    item_id: String(line.item_id),
                    requested_quantity: line.requested_quantity,
                })) ?? [],
    );
    const [specialLines, setSpecialLines] = useState<SpecialLine[]>(
        () =>
            purchaseRequest?.items
                .filter((line) => line.type === 'SPECIAL')
                .map((line) => ({
                    key: line.id,
                    name: line.name ?? '',
                    description: line.description ?? '',
                    unit_id: String(line.unit_id),
                    requested_quantity: line.requested_quantity,
                    required_date: line.required_date?.slice(0, 10) ?? '',
                    reason: line.reason ?? '',
                })) ?? [],
    );

    const action = purchaseRequest
        ? `/store/requests/${purchaseRequest.id}`
        : '/store/requests';
    const method = purchaseRequest ? 'put' : 'post';

    const updateStock = (
        key: number,
        field: keyof Omit<StockLine, 'key'>,
        value: string,
    ) =>
        setStockLines((lines) =>
            lines.map((line) =>
                line.key === key ? { ...line, [field]: value } : line,
            ),
        );

    const updateSpecial = (
        key: number,
        field: keyof Omit<SpecialLine, 'key'>,
        value: string,
    ) =>
        setSpecialLines((lines) =>
            lines.map((line) =>
                line.key === key ? { ...line, [field]: value } : line,
            ),
        );

    return (
        <>
            <Head
                title={
                    purchaseRequest
                        ? `Edit ${purchaseRequest.number}`
                        : 'Buat Permintaan Barang'
                }
            />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Form PR"
                    title={
                        purchaseRequest
                            ? `Edit ${purchaseRequest.number}`
                            : 'Permintaan Baru'
                    }
                    actions={
                        <Button variant="outline" asChild>
                            <Link href="/store/requests">
                                <ArrowLeft className="mr-1.5 size-4" /> Kembali
                            </Link>
                        </Button>
                    }
                />

                <Form action={action} method={method} className="space-y-5">
                    {({ processing, errors }) => (
                        <>
                            {/* General Information Card */}
                            <Card className="border-border/70 shadow-2xs">
                                <CardHeader className="border-b border-border/40 px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <FileText className="size-4 text-primary" />
                                        <CardTitle className="text-sm font-semibold">
                                            Informasi Dokumen Pengajuan
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-foreground">
                                            Toko Cabang Pemohon
                                        </Label>
                                        <select
                                            name="store_id"
                                            value={selectedStoreId}
                                            disabled={Boolean(purchaseRequest)}
                                            onChange={(event) =>
                                                router.get(
                                                    '/store/requests/create',
                                                    {
                                                        store_id:
                                                            event.target.value,
                                                    },
                                                )
                                            }
                                            className="form-select-custom h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                        >
                                            {stores.map((store) => (
                                                <option
                                                    key={store.id}
                                                    value={store.id}
                                                >
                                                    {store.code} — {store.name}
                                                </option>
                                            ))}
                                        </select>
                                        {purchaseRequest && (
                                            <input
                                                type="hidden"
                                                name="store_id"
                                                value={selectedStoreId}
                                            />
                                        )}
                                        <InputError message={errors.store_id} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="required_date"
                                            className="flex items-center gap-1.5 text-xs font-medium text-foreground"
                                        >
                                            <Calendar className="size-3.5 text-muted-foreground" />
                                            Target Tanggal Dibutuhkan
                                        </Label>
                                        <Input
                                            id="required_date"
                                            name="required_date"
                                            type="date"
                                            className="h-9 text-xs"
                                            defaultValue={
                                                purchaseRequest?.required_date?.slice(
                                                    0,
                                                    10,
                                                ) ?? ''
                                            }
                                        />
                                        <InputError
                                            message={errors.required_date}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="notes"
                                            className="text-xs font-medium text-foreground"
                                        >
                                            Catatan Permintaan (Opsional)
                                        </Label>
                                        <Input
                                            id="notes"
                                            name="notes"
                                            className="h-9 text-xs"
                                            defaultValue={
                                                purchaseRequest?.notes ?? ''
                                            }
                                            placeholder="Contoh: Kebutuhan persiapan pameran"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Regular Stock Items Card */}
                            <Card className="border-border/70 shadow-2xs">
                                <CardHeader className="border-b border-border/40 px-5 py-3.5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package className="size-4 text-amber-600 dark:text-amber-400" />
                                            <CardTitle className="text-sm font-semibold">
                                                Item Stok Reguler
                                            </CardTitle>
                                            {stockLines.length > 0 && (
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                    {stockLines.length} item
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="relative">
                                                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={itemSearch}
                                                    onChange={(event) =>
                                                        setItemSearch(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Cari SKU / nama..."
                                                    aria-label="Cari item stok"
                                                    className="h-8 pl-8 text-xs sm:w-52"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setStockLines((lines) => [
                                                        ...lines,
                                                        {
                                                            key: nextKey++,
                                                            item_id: '',
                                                            requested_quantity:
                                                                '',
                                                        },
                                                    ])
                                                }
                                                className="h-8 gap-1 text-xs font-medium"
                                            >
                                                <Plus className="size-3.5" />
                                                Tambah Item
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3 p-5">
                                    {stockLines.length === 0 ? (
                                        <div className="flex items-center justify-center rounded-lg border border-dashed border-border/70 py-7 text-center text-xs text-muted-foreground">
                                            Belum ada item reguler ditambahkan. Klik tombol &quot;Tambah Item&quot; untuk memilih barang.
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {stockLines.map((line, index) => {
                                                const item = items.find(
                                                    (value) =>
                                                        String(value.id) ===
                                                        line.item_id,
                                                );
                                                const query = itemSearch
                                                    .trim()
                                                    .toLowerCase();
                                                const options = items.filter(
                                                    (option) =>
                                                        String(option.id) ===
                                                            line.item_id ||
                                                        query === '' ||
                                                        option.sku
                                                            .toLowerCase()
                                                            .includes(query) ||
                                                        option.name
                                                            .toLowerCase()
                                                            .includes(query),
                                                );

                                                return (
                                                    <div
                                                        key={line.key}
                                                        className="group flex flex-col gap-2.5 rounded-lg border border-border/70 bg-muted/20 p-2.5 transition-colors hover:border-border sm:flex-row sm:items-center sm:gap-3"
                                                    >
                                                        <span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-semibold text-muted-foreground">
                                                            {index + 1}
                                                        </span>

                                                        <div className="flex-1 min-w-0">
                                                            <select
                                                                name={`stock_items[${index}][item_id]`}
                                                                value={line.item_id}
                                                                onChange={(e) =>
                                                                    updateStock(
                                                                        line.key,
                                                                        'item_id',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="form-select-custom h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                                                required
                                                            >
                                                                <option value="">
                                                                    -- Pilih Item dari Katalog --
                                                                </option>
                                                                {options.map(
                                                                    (option) => (
                                                                        <option
                                                                            key={
                                                                                option.id
                                                                            }
                                                                            value={
                                                                                option.id
                                                                            }
                                                                        >
                                                                            [
                                                                            {
                                                                                option.sku
                                                                            }
                                                                            ]{' '}
                                                                            {
                                                                                option.name
                                                                            }{' '}
                                                                            (
                                                                            {
                                                                                option
                                                                                    .unit
                                                                                    .symbol
                                                                            }
                                                                            )
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        </div>

                                                        <div className="relative w-full sm:w-48 shrink-0">
                                                            <Input
                                                                name={`stock_items[${index}][requested_quantity]`}
                                                                type="number"
                                                                min="0.001"
                                                                step="0.001"
                                                                className="h-9 pr-14 text-right text-xs font-medium tabular-nums"
                                                                value={
                                                                    line.requested_quantity
                                                                }
                                                                onChange={(e) =>
                                                                    updateStock(
                                                                        line.key,
                                                                        'requested_quantity',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="0.000"
                                                                required
                                                            />
                                                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                                                                {item?.unit
                                                                    .symbol ??
                                                                    'Unit'}
                                                            </span>
                                                        </div>

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 shrink-0 self-end text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 sm:self-center dark:hover:text-rose-400"
                                                            onClick={() =>
                                                                setStockLines(
                                                                    (lines) =>
                                                                        lines.filter(
                                                                            (
                                                                                value,
                                                                            ) =>
                                                                                value.key !==
                                                                                line.key,
                                                                        ),
                                                                )
                                                            }
                                                            aria-label="Hapus item"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <InputError
                                        message={
                                            errors.stock_items || errors.items
                                        }
                                    />
                                </CardContent>
                            </Card>

                            {/* Special Request Items Card */}
                            <Card className="border-border/70 shadow-2xs">
                                <CardHeader className="border-b border-border/40 px-5 py-3.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="size-4 text-sky-600 dark:text-sky-400" />
                                            <CardTitle className="text-sm font-semibold">
                                                Permintaan Khusus (Non-Katalog / Custom)
                                            </CardTitle>
                                            {specialLines.length > 0 && (
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                    {specialLines.length} item
                                                </span>
                                            )}
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setSpecialLines((lines) => [
                                                    ...lines,
                                                    {
                                                        key: nextKey++,
                                                        name: '',
                                                        description: '',
                                                        unit_id: '',
                                                        requested_quantity: '',
                                                        required_date: '',
                                                        reason: '',
                                                    },
                                                ])
                                            }
                                            className="h-8 gap-1 text-xs font-medium"
                                        >
                                            <Plus className="size-3.5" />
                                            Tambah Khusus
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3 p-5">
                                    {specialLines.length === 0 ? (
                                        <div className="flex items-center justify-center rounded-lg border border-dashed border-border/70 py-7 text-center text-xs text-muted-foreground">
                                            Tidak ada permintaan barang khusus. Klik &quot;Tambah Kebutuhan Khusus&quot; jika diperlukan.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {specialLines.map((line, index) => (
                                                <div
                                                    key={line.key}
                                                    className="rounded-lg border border-border/70 bg-muted/20 p-3.5 transition-colors hover:border-border"
                                                >
                                                    <div className="mb-2.5 flex items-center justify-between border-b border-border/40 pb-2">
                                                        <span className="text-xs font-semibold text-foreground">
                                                            Item Khusus #{index + 1}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                                                            onClick={() =>
                                                                setSpecialLines(
                                                                    (lines) =>
                                                                        lines.filter(
                                                                            (
                                                                                value,
                                                                            ) =>
                                                                                value.key !==
                                                                                line.key,
                                                                        ),
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="mr-1 size-3.5" /> Hapus
                                                        </Button>
                                                    </div>

                                                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs font-medium text-foreground">
                                                                Nama Barang *
                                                            </Label>
                                                            <Input
                                                                name={`special_items[${index}][name]`}
                                                                value={line.name}
                                                                onChange={(e) =>
                                                                    updateSpecial(
                                                                        line.key,
                                                                        'name',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Nama spesifik barang"
                                                                className="h-9 text-xs"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-xs font-medium text-foreground">
                                                                Deskripsi / Spesifikasi
                                                            </Label>
                                                            <Input
                                                                name={`special_items[${index}][description]`}
                                                                value={
                                                                    line.description
                                                                }
                                                                onChange={(e) =>
                                                                    updateSpecial(
                                                                        line.key,
                                                                        'description',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Ukuran, tipe, merek"
                                                                className="h-9 text-xs"
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-xs font-medium text-foreground">
                                                                Satuan Ukur *
                                                            </Label>
                                                            <select
                                                                name={`special_items[${index}][unit_id]`}
                                                                value={
                                                                    line.unit_id
                                                                }
                                                                onChange={(e) =>
                                                                    updateSpecial(
                                                                        line.key,
                                                                        'unit_id',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="form-select-custom h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                                                required
                                                            >
                                                                <option value="">
                                                                    Pilih Satuan
                                                                </option>
                                                                {units.map(
                                                                    (unit) => (
                                                                        <option
                                                                            key={
                                                                                unit.id
                                                                            }
                                                                            value={
                                                                                unit.id
                                                                            }
                                                                        >
                                                                            {
                                                                                unit.name
                                                                            }{' '}
                                                                            (
                                                                            {
                                                                                unit.symbol
                                                                            }
                                                                            )
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-xs font-medium text-foreground">
                                                                Jumlah Diminta *
                                                            </Label>
                                                            <Input
                                                                name={`special_items[${index}][requested_quantity]`}
                                                                type="number"
                                                                min="0.001"
                                                                step="0.001"
                                                                value={
                                                                    line.requested_quantity
                                                                }
                                                                onChange={(e) =>
                                                                    updateSpecial(
                                                                        line.key,
                                                                        'requested_quantity',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="0.000"
                                                                className="h-9 text-xs font-medium tabular-nums"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-xs font-medium text-foreground">
                                                                Tanggal Dibutuhkan
                                                            </Label>
                                                            <Input
                                                                name={`special_items[${index}][required_date]`}
                                                                type="date"
                                                                value={
                                                                    line.required_date
                                                                }
                                                                onChange={(e) =>
                                                                    updateSpecial(
                                                                        line.key,
                                                                        'required_date',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-9 text-xs"
                                                            />
                                                        </div>

                                                        <div className="space-y-1 lg:col-span-3">
                                                            <Label className="text-xs font-medium text-foreground">
                                                                Alasan Kebutuhan *
                                                            </Label>
                                                            <Input
                                                                name={`special_items[${index}][reason]`}
                                                                value={
                                                                    line.reason
                                                                }
                                                                onChange={(e) =>
                                                                    updateSpecial(
                                                                        line.key,
                                                                        'reason',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Alasan pengajuan (misal: display rusak, perlengkapan event)"
                                                                className="h-9 text-xs"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <InputError
                                        message={
                                            errors.special_items || errors.items
                                        }
                                    />
                                </CardContent>
                            </Card>

                            {/* Action Bar */}
                            <div className="flex items-center justify-end gap-3 pt-1">
                                <Button variant="outline" asChild>
                                    <Link href="/store/requests">Batal</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="font-medium"
                                >
                                    {processing
                                        ? 'Menyimpan...'
                                        : purchaseRequest
                                          ? 'Simpan Perubahan'
                                          : 'Simpan Draft'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </main>
        </>
    );
}

RequestForm.layout = {
    breadcrumbs: [
        { title: 'Portal Toko', href: '/store/dashboard' },
        { title: 'Permintaan', href: '/store/requests' },
        { title: 'Form', href: '#' },
    ],
};
