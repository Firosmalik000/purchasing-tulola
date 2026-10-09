import { Form, Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    FileText,
    Image as ImageIcon,
    Package,
    Plus,
    Send,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import InputError from '@/components/input-error';
import {
    CatalogItemSelect,
    type CatalogItem,
} from '@/components/store/catalog-item-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Store = { id: number; code: string; name: string };
type Unit = { id: number; name: string; symbol: string };
type Category = { id: number; name: string; code?: string | null };
type Item = CatalogItem;
type RequestItem = {
    id: number;
    type: 'STOCK' | 'SPECIAL';
    item_id: number | null;
    name: string | null;
    description: string | null;
    sample_image_url: string | null;
    unit_id: number;
    requested_quantity: number;
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
    existing_item_id: number | null;
    name: string;
    description: string;
    sample_image_url: string | null;
    unit_id: string;
    requested_quantity: string;
    required_date: string;
    reason: string;
};
type SpecialTextField =
    | 'name'
    | 'description'
    | 'unit_id'
    | 'requested_quantity'
    | 'required_date'
    | 'reason';
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
    const [stockLines, setStockLines] = useState<StockLine[]>(
        () =>
            purchaseRequest?.items
                .filter((line) => line.type === 'STOCK')
                .map((line) => ({
                    key: line.id,
                    item_id: String(line.item_id),
                    requested_quantity: String(Number(line.requested_quantity)),
                })) ?? [],
    );
    const [specialLines, setSpecialLines] = useState<SpecialLine[]>(
        () =>
            purchaseRequest?.items
                .filter((line) => line.type === 'SPECIAL')
                .map((line) => ({
                    key: line.id,
                    existing_item_id: line.id,
                    name: line.name ?? '',
                    description: line.description ?? '',
                    sample_image_url: line.sample_image_url,
                    unit_id: String(line.unit_id),
                    requested_quantity: String(Number(line.requested_quantity)),
                    required_date: line.required_date?.slice(0, 10) ?? '',
                    reason: line.reason ?? '',
                })) ?? [],
    );

    const [submitAction, setSubmitAction] = useState<'draft' | 'submit'>('draft');

    const action = purchaseRequest
        ? `/store/requests/${purchaseRequest.id}`
        : '/store/requests';

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
        field: SpecialTextField,
        value: string,
    ) =>
        setSpecialLines((lines) =>
            lines.map((line) =>
                line.key === key ? { ...line, [field]: value } : line,
            ),
        );

    const previewSampleImage = (key: number, file?: File) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () =>
            setSpecialLines((lines) =>
                lines.map((line) =>
                    line.key === key
                        ? {
                              ...line,
                              sample_image_url:
                                  typeof reader.result === 'string'
                                      ? reader.result
                                      : line.sample_image_url,
                          }
                        : line,
                ),
            );
        reader.readAsDataURL(file);
    };

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

                <Form
                    action={action}
                    method="post"
                    encType="multipart/form-data"
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="action"
                                value={submitAction}
                            />
                            {purchaseRequest && (
                                <input
                                    type="hidden"
                                    name="_method"
                                    value="put"
                                />
                            )}
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
                                                        requested_quantity: '',
                                                    },
                                                ])
                                            }
                                            className="h-8 gap-1 text-xs font-medium"
                                        >
                                            <Plus className="size-3.5" />
                                            Tambah Item
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3 p-5">
                                    {stockLines.length === 0 ? (
                                        <div className="flex items-center justify-center rounded-lg border border-dashed border-border/70 py-7 text-center text-xs text-muted-foreground">
                                            Belum ada item reguler ditambahkan.
                                            Klik tombol &quot;Tambah Item&quot;
                                            untuk memilih barang.
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {stockLines.map((line, index) => (
                                                <div
                                                    key={line.key}
                                                    className="group flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/20 p-2.5 transition-colors hover:border-border sm:flex-row sm:items-center sm:gap-3"
                                                >
                                                    <span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-semibold text-muted-foreground">
                                                        {index + 1}
                                                    </span>

                                                    <div className="min-w-0 flex-1">
                                                        <CatalogItemSelect
                                                            name={`stock_items[${index}][item_id]`}
                                                            value={line.item_id}
                                                            onChange={(
                                                                itemId,
                                                            ) =>
                                                                updateStock(
                                                                    line.key,
                                                                    'item_id',
                                                                    itemId,
                                                                )
                                                            }
                                                            items={items}
                                                            required
                                                            placeholder="Pilih barang dari katalog..."
                                                        />
                                                    </div>

                                                    <div className="w-full shrink-0 sm:w-36">
                                                        <Input
                                                            name={`stock_items[${index}][requested_quantity]`}
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            className="h-9 text-right text-xs font-medium tabular-nums"
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
                                                            placeholder="Jumlah"
                                                            required
                                                        />
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
                                            ))}
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
                                                Permintaan Khusus (Non-Katalog /
                                                Custom)
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
                                                        existing_item_id: null,
                                                        name: '',
                                                        description: '',
                                                        sample_image_url: null,
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
                                            Tidak ada permintaan barang khusus.
                                            Klik &quot;Tambah Kebutuhan
                                            Khusus&quot; jika diperlukan.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {specialLines.map((line, index) => (
                                                <div
                                                    key={line.key}
                                                    className="rounded-lg border border-border/70 bg-muted/20 p-3.5 transition-colors hover:border-border"
                                                >
                                                    {line.existing_item_id !==
                                                        null && (
                                                        <input
                                                            type="hidden"
                                                            name={`special_items[${index}][existing_item_id]`}
                                                            value={
                                                                line.existing_item_id
                                                            }
                                                        />
                                                    )}
                                                    <div className="mb-2.5 flex items-center justify-between border-b border-border/40 pb-2">
                                                        <span className="text-xs font-semibold text-foreground">
                                                            Item Khusus #
                                                            {index + 1}
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
                                                            <Trash2 className="mr-1 size-3.5" />{' '}
                                                            Hapus
                                                        </Button>
                                                    </div>

                                                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs font-medium text-foreground">
                                                                Nama Barang *
                                                            </Label>
                                                            <Input
                                                                name={`special_items[${index}][name]`}
                                                                value={
                                                                    line.name
                                                                }
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
                                                                Deskripsi /
                                                                Spesifikasi
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
                                                                min="1"
                                                                step="1"
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
                                                                placeholder="0"
                                                                className="h-9 text-xs font-medium tabular-nums"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-xs font-medium text-foreground">
                                                                Tanggal
                                                                Dibutuhkan
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
                                                                Alasan Kebutuhan
                                                                *
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

                                                    <div className="mt-3 grid gap-3 rounded-lg border border-dashed border-border/70 bg-background/60 p-3 sm:grid-cols-[7rem_1fr] sm:items-center">
                                                        <div className="flex aspect-square w-28 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-muted/40">
                                                            {line.sample_image_url ? (
                                                                <img
                                                                    src={
                                                                        line.sample_image_url
                                                                    }
                                                                    alt={`Foto sampel ${line.name || `item khusus ${index + 1}`}`}
                                                                    className="size-full object-cover"
                                                                />
                                                            ) : (
                                                                <ImageIcon className="size-7 text-muted-foreground/60" />
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div>
                                                                <Label
                                                                    htmlFor={`sample-image-${line.key}`}
                                                                    className="text-xs font-medium text-foreground"
                                                                >
                                                                    Foto Sampel
                                                                    (Opsional)
                                                                </Label>
                                                                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                                                                    Tambahkan
                                                                    satu foto
                                                                    referensi
                                                                    agar
                                                                    purchasing
                                                                    memahami
                                                                    bentuk,
                                                                    warna, atau
                                                                    spesifikasi
                                                                    yang
                                                                    dimaksud.
                                                                    JPG, PNG,
                                                                    atau WebP
                                                                    maksimal 5
                                                                    MB.
                                                                </p>
                                                            </div>
                                                            <Input
                                                                id={`sample-image-${line.key}`}
                                                                name={`special_items[${index}][sample_image]`}
                                                                type="file"
                                                                accept="image/jpeg,image/png,image/webp"
                                                                className="h-9 cursor-pointer text-xs file:mr-3 file:font-medium"
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    previewSampleImage(
                                                                        line.key,
                                                                        event
                                                                            .target
                                                                            .files?.[0],
                                                                    )
                                                                }
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors[
                                                                        `special_items.${index}.sample_image`
                                                                    ]
                                                                }
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
                                    variant="secondary"
                                    disabled={processing}
                                    onClick={() => setSubmitAction('draft')}
                                >
                                    {processing && submitAction === 'draft'
                                        ? 'Menyimpan...'
                                        : purchaseRequest
                                          ? 'Simpan Perubahan'
                                          : 'Simpan Draft'}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="font-medium"
                                    onClick={() => setSubmitAction('submit')}
                                >
                                    <Send className="mr-1.5 size-4" />
                                    {processing && submitAction === 'submit'
                                        ? 'Mengajukan...'
                                        : 'Simpan & Ajukan ke Pusat'}
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
