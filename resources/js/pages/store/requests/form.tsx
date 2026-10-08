import { Form, Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    FileText,
    Package,
    Plus,
    Search,
    Send,
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
    estimated_price: string | null;
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
    estimated_price: string;
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
                    estimated_price: line.estimated_price ?? '',
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
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
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
                                <ArrowLeft className="size-4" /> Kembali ke Daftar
                            </Link>
                        </Button>
                    }
                />

                <Form action={action} method={method} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            {/* General Information Card */}
                            <Card className="border-border/70 shadow-xs">
                                <CardHeader className="border-b border-border/50 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <FileText className="size-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold">
                                                Informasi Dokumen Pengajuan
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground">
                                                Identitas butik dan target waktu pemenuhan barang
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-5 p-5 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-foreground">
                                            Toko / Butik Pemohon
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
                                            className="form-select-custom h-10 w-full"
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

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="required_date"
                                            className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                                        >
                                            <Calendar className="size-3.5 text-muted-foreground" />
                                            Target Tanggal Dibutuhkan
                                        </Label>
                                        <Input
                                            id="required_date"
                                            name="required_date"
                                            type="date"
                                            className="h-10"
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

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="notes"
                                            className="text-xs font-semibold text-foreground"
                                        >
                                            Catatan Permintaan (Opsional)
                                        </Label>
                                        <Input
                                            id="notes"
                                            name="notes"
                                            className="h-10"
                                            defaultValue={
                                                purchaseRequest?.notes ?? ''
                                            }
                                            placeholder="Contoh: Kebutuhan persiapan pameran akhir bulan"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Regular Stock Items Card */}
                            <Card className="border-border/70 shadow-xs">
                                <CardHeader className="border-b border-border/50 pb-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                <Package className="size-4" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold">
                                                    Item Stok Reguler
                                                </CardTitle>
                                                <p className="text-xs text-muted-foreground">
                                                    Barang katalog butik dengan pemantauan stok minimum
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                                            <div className="relative">
                                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={itemSearch}
                                                    onChange={(event) =>
                                                        setItemSearch(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Filter pilihan SKU/nama..."
                                                    aria-label="Cari item stok"
                                                    className="h-9 pl-9 sm:w-60"
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
                                                className="border-dashed font-medium hover:border-primary hover:text-primary"
                                            >
                                                <Plus className="size-4" />
                                                Tambah Baris Stok
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3.5 p-5">
                                    {stockLines.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                <Package className="size-5" />
                                            </div>
                                            <p className="mt-3 text-sm font-medium text-foreground">
                                                Belum ada item stok reguler ditambahkan
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Klik tombol Tambah Baris Stok di atas untuk memasukkan barang stok.
                                            </p>
                                        </div>
                                    ) : (
                                        stockLines.map((line, index) => {
                                            const item = items.find(
                                                (value) =>
                                                    String(value.id) ===
                                                    line.item_id,
                                            );
                                            const stock =
                                                item?.stocks[0]?.quantity ??
                                                '0.000';
                                            const standard =
                                                item?.stock_standards[0]
                                                    ?.standard_quantity ??
                                                    '0.000';
                                            const suggested = Math.max(
                                                Number(standard) -
                                                    Number(stock),
                                                0,
                                            ).toFixed(3);
                                            const isUnderStandard =
                                                item &&
                                                Number(stock) < Number(standard);
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
                                                    className="group relative grid gap-3.5 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border lg:grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,0.8fr))_minmax(0,1.2fr)_auto] lg:items-end"
                                                >
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-semibold text-foreground">
                                                                Pilih Item Katalog #{index + 1}
                                                            </Label>
                                                            {isUnderStandard && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                                                    <AlertCircle className="size-3" />
                                                                    Stok Kritis
                                                                </span>
                                                            )}
                                                        </div>
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
                                                            className="form-select-custom h-10 w-full"
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
                                                                        [{option.sku}] {option.name} ({option.unit.symbol})
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </div>

                                                    <Metric
                                                        label="Stok Saat Ini"
                                                        value={stock}
                                                        unit={item?.unit.symbol}
                                                        highlight={isUnderStandard ? 'danger' : 'neutral'}
                                                    />

                                                    <Metric
                                                        label="Standar Toko"
                                                        value={standard}
                                                        unit={item?.unit.symbol}
                                                    />

                                                    <Metric
                                                        label="Saran Kebutuhan"
                                                        value={suggested}
                                                        unit={item?.unit.symbol}
                                                        highlight={Number(suggested) > 0 ? 'accent' : 'neutral'}
                                                    />

                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-foreground">
                                                            Jumlah Diminta
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                name={`stock_items[${index}][requested_quantity]`}
                                                                type="number"
                                                                min="0.001"
                                                                step="0.001"
                                                                className="h-10 pr-12 text-right font-medium tabular-nums"
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
                                                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                                                                {item?.unit.symbol ?? 'Unit'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
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
                                                </div>
                                            );
                                        })
                                    )}

                                    <InputError
                                        message={
                                            errors.stock_items || errors.items
                                        }
                                    />
                                </CardContent>
                            </Card>

                            {/* Special Request Items Card */}
                            <Card className="border-border/70 shadow-xs">
                                <CardHeader className="border-b border-border/50 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                                <Sparkles className="size-4" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold">
                                                    Permintaan Khusus (Non-Stok / Custom)
                                                </CardTitle>
                                                <p className="text-xs text-muted-foreground">
                                                    Pengadaan kebutuhan operasional khusus, perlengkapan butik, atau pesanan spesifik
                                                </p>
                                            </div>
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
                                                        estimated_price: '',
                                                        required_date: '',
                                                        reason: '',
                                                    },
                                                ])
                                            }
                                            className="border-dashed font-medium hover:border-primary hover:text-primary"
                                        >
                                            <Plus className="size-4" /> Tambah Kebutuhan Khusus
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4 p-5">
                                    {specialLines.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                <Sparkles className="size-5" />
                                            </div>
                                            <p className="mt-3 text-sm font-medium text-foreground">
                                                Tidak ada permintaan barang khusus
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Gunakan tombol di atas jika butik membutuhkan barang non-katalog atau perlengkapan khusus.
                                            </p>
                                        </div>
                                    ) : (
                                        specialLines.map((line, index) => (
                                            <div
                                                key={line.key}
                                                className="group relative space-y-3 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border"
                                            >
                                                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        Kebutuhan Khusus #{index + 1}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                                                        onClick={() =>
                                                            setSpecialLines(
                                                                (lines) =>
                                                                    lines.filter(
                                                                        (value) =>
                                                                            value.key !==
                                                                            line.key,
                                                                    ),
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" /> Hapus Baris
                                                    </Button>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Nama Barang / Kebutuhan *
                                                        </Label>
                                                        <Input
                                                            name={`special_items[${index}][name]`}
                                                            value={line.name}
                                                            onChange={(e) =>
                                                                updateSpecial(
                                                                    line.key,
                                                                    'name',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Nama spesifik barang"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Deskripsi / Spesifikasi
                                                        </Label>
                                                        <Input
                                                            name={`special_items[${index}][description]`}
                                                            value={line.description}
                                                            onChange={(e) =>
                                                                updateSpecial(
                                                                    line.key,
                                                                    'description',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Ukuran, warna, merek"
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Satuan Ukur *
                                                        </Label>
                                                        <select
                                                            name={`special_items[${index}][unit_id]`}
                                                            value={line.unit_id}
                                                            onChange={(e) =>
                                                                updateSpecial(
                                                                    line.key,
                                                                    'unit_id',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="form-select-custom h-9 w-full"
                                                            required
                                                        >
                                                            <option value="">
                                                                Pilih Satuan
                                                            </option>
                                                            {units.map((unit) => (
                                                                <option
                                                                    key={unit.id}
                                                                    value={unit.id}
                                                                >
                                                                    {unit.name} ({unit.symbol})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">
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
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Jumlah"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Tanggal Dibutuhkan
                                                        </Label>
                                                        <Input
                                                            name={`special_items[${index}][required_date]`}
                                                            type="date"
                                                            value={line.required_date}
                                                            onChange={(e) =>
                                                                updateSpecial(
                                                                    line.key,
                                                                    'required_date',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Estimasi Harga Satuan (Rp)
                                                        </Label>
                                                        <Input
                                                            name={`special_items[${index}][estimated_price]`}
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={line.estimated_price}
                                                            onChange={(e) =>
                                                                updateSpecial(
                                                                    line.key,
                                                                    'estimated_price',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Opsional"
                                                        />
                                                    </div>

                                                    <div className="space-y-1 lg:col-span-2">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Alasan Kebutuhan *
                                                        </Label>
                                                        <Input
                                                            name={`special_items[${index}][reason]`}
                                                            value={line.reason}
                                                            onChange={(e) =>
                                                                updateSpecial(
                                                                    line.key,
                                                                    'reason',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Alasan pengajuan (misal: display rusak, display baru)"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    <InputError
                                        message={
                                            errors.special_items || errors.items
                                        }
                                    />
                                </CardContent>
                            </Card>

                            {/* Action Bar */}
                            <div className="flex flex-col-reverse items-center justify-between gap-4 rounded-xl border border-border/70 bg-card p-4 sm:flex-row">
                                <p className="text-xs text-muted-foreground">
                                    Simpan draft terlebih dahulu untuk memverifikasi data sebelum diajukan ke kantor pusat.
                                </p>
                                <div className="flex items-center gap-3">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="gap-2 font-medium"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Draft Permintaan'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Form>

                {purchaseRequest && (
                    <Card className="border-amber-500/20 bg-amber-500/5 shadow-xs">
                        <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">
                                    Sudah selesai melengkapi draft?
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Mengajukan dokumen ini akan mengubah status menjadi SUBMITTED dan mengirimkan notifikasi ke Purchasing Pusat.
                                </p>
                            </div>
                            <Form
                                action={`/store/requests/${purchaseRequest.id}/submit`}
                                method="post"
                            >
                                {({ processing }) => (
                                    <Button
                                        disabled={
                                            processing ||
                                            (stockLines.length === 0 &&
                                                specialLines.length === 0)
                                        }
                                        className="gap-2 bg-amber-600 font-medium text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                                    >
                                        <Send className="size-4" /> Ajukan ke Kantor Pusat
                                    </Button>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
}

function Metric({
    label,
    value,
    unit,
    highlight = 'neutral',
}: {
    label: string;
    value: string;
    unit?: string;
    highlight?: 'neutral' | 'danger' | 'accent';
}) {
    const colorClasses = {
        neutral: 'bg-muted/40 text-foreground',
        danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        accent: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
    }[highlight];

    return (
        <div className={`flex flex-col justify-center rounded-lg p-2.5 text-center ${colorClasses}`}>
            <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                {value} {unit ? <span className="text-xs font-normal text-muted-foreground">{unit}</span> : null}
            </p>
        </div>
    );
}

RequestForm.layout = {
    breadcrumbs: [
        { title: 'Portal Toko', href: '/store/dashboard' },
        { title: 'Permintaan', href: '/store/requests' },
        { title: 'Form', href: '#' },
    ],
};
