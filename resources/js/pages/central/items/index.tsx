import { Form, Head } from '@inertiajs/react';
import {
    Boxes,
    Layers,
    Plus,
    Ruler,
    Search,
    Sparkles,
    Tag,
} from 'lucide-react';
import { EditDetails } from '@/components/common/edit-details';
import { EmptyState } from '@/components/common/empty-state';
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

type Option = {
    id: number;
    name: string;
    code?: string | null;
    symbol?: string;
    is_active: boolean;
};
type Item = {
    id: number;
    sku: string;
    name: string;
    is_active: boolean;
    category: Option;
    unit: Option;
};
type Props = {
    items: { data: Item[]; links: PaginationLink[] };
    categories: Option[];
    units: Option[];
    filters: { search: string };
};

export default function ItemIndex({
    items,
    categories,
    units,
    filters,
}: Props) {
    const activeCategories = categories.filter((item) => item.is_active);
    const activeUnits = units.filter((item) => item.is_active);

    return (
        <>
            <Head title="Master Katalog Item & Material" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Data Master Perhiasan & Bahan"
                    title="Master Item & Material"
                    description="Kelola katalog produk jadi, bahan baku emas/perak, batu permata, dan kemasan butik beserta standar satuan dan kategorisasinya."
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
                    {/* Left: Items List */}
                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Boxes className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">
                                            Daftar Katalog Item
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            {items.data.length} item ditampilkan pada halaman ini
                                        </p>
                                    </div>
                                </div>

                                <Form action="/central/items" method="get">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            name="search"
                                            defaultValue={filters.search}
                                            placeholder="Cari SKU atau nama item..."
                                            aria-label="Cari item"
                                            className="h-9 w-full pl-9 sm:w-64"
                                        />
                                    </div>
                                </Form>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {items.data.length === 0 ? (
                                <div className="p-8">
                                    <EmptyState
                                        icon={Boxes}
                                        title="Belum ada item dalam katalog"
                                        description="Gunakan panel formulir di sisi kanan untuk mendaftarkan item atau material baru."
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-5 py-3.5">Kode SKU</th>
                                                    <th className="px-5 py-3.5">Nama Item / Perhiasan</th>
                                                    <th className="px-4 py-3.5">Kategori</th>
                                                    <th className="px-4 py-3.5">Satuan</th>
                                                    <th className="px-5 py-3.5 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {items.data.map((item) => (
                                                    <tr
                                                        key={item.id}
                                                        className="transition-colors hover:bg-muted/20"
                                                    >
                                                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-primary">
                                                            {item.sku}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                                <span className="font-semibold text-foreground">
                                                                    {item.name}
                                                                </span>
                                                                <EditDetails label="Edit data item">
                                                                    <Form
                                                                        action={`/central/items/${item.id}`}
                                                                        method="put"
                                                                        className="grid min-w-72 gap-2.5 p-1"
                                                                    >
                                                                        {({
                                                                            processing,
                                                                            errors,
                                                                        }) => (
                                                                            <>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">SKU</Label>
                                                                                    <Input
                                                                                        name="sku"
                                                                                        defaultValue={item.sku}
                                                                                        required
                                                                                        className="h-8 text-xs font-mono"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">Nama Item</Label>
                                                                                    <Input
                                                                                        name="name"
                                                                                        defaultValue={item.name}
                                                                                        required
                                                                                        className="h-8 text-xs"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">Kategori</Label>
                                                                                    <select
                                                                                        name="item_category_id"
                                                                                        defaultValue={item.category.id}
                                                                                        className="form-select-custom h-8 w-full text-xs"
                                                                                    >
                                                                                        {activeCategories.map((option) => (
                                                                                            <option
                                                                                                key={option.id}
                                                                                                value={option.id}
                                                                                            >
                                                                                                {option.name}
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">Satuan</Label>
                                                                                    <select
                                                                                        name="unit_id"
                                                                                        defaultValue={item.unit.id}
                                                                                        className="form-select-custom h-8 w-full text-xs"
                                                                                    >
                                                                                        {activeUnits.map((option) => (
                                                                                            <option
                                                                                                key={option.id}
                                                                                                value={option.id}
                                                                                            >
                                                                                                {option.name} ({option.symbol})
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                </div>
                                                                                <input
                                                                                    type="hidden"
                                                                                    name="is_active"
                                                                                    value="0"
                                                                                />
                                                                                <label className="flex items-center gap-2 pt-1 text-xs font-medium">
                                                                                    <Checkbox
                                                                                        name="is_active"
                                                                                        value="1"
                                                                                        defaultChecked={item.is_active}
                                                                                    />{' '}
                                                                                    Item Aktif Digunakan
                                                                                </label>
                                                                                <InputError
                                                                                    message={
                                                                                        errors.sku ||
                                                                                        errors.name ||
                                                                                        errors.item_category_id ||
                                                                                        errors.unit_id
                                                                                    }
                                                                                />
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="mt-2 h-8 font-medium"
                                                                                    disabled={processing}
                                                                                >
                                                                                    Simpan Perubahan
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                    </Form>
                                                                </EditDetails>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                                                            <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                                                                {item.category.name}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                                                            {item.unit.symbol}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-center">
                                                            <Badge
                                                                variant={item.is_active ? 'default' : 'secondary'}
                                                                className="text-[10px]"
                                                            >
                                                                {item.is_active ? 'Aktif' : 'Nonaktif'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 border-t border-border/50">
                                        <PaginationLinks links={items.links} />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: Management & Creation Panels */}
                    <div className="space-y-6">
                        {/* New Item Form */}
                        <Card className="border-border/70 shadow-xs">
                            <CardHeader className="border-b border-border/50 pb-3.5">
                                <div className="flex items-center gap-2">
                                    <Plus className="size-4 text-primary" />
                                    <CardTitle className="text-sm font-semibold">
                                        Tambah Item Katalog Baru
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5">
                                <Form
                                    action="/central/items"
                                    method="post"
                                    className="space-y-3.5"
                                    resetOnSuccess
                                >
                                    {({ errors, processing }) => (
                                        <>
                                            <div className="space-y-1">
                                                <Label htmlFor="sku" className="text-xs font-semibold">
                                                    Kode SKU *
                                                </Label>
                                                <Input
                                                    id="sku"
                                                    name="sku"
                                                    className="h-9 font-mono"
                                                    placeholder="Contoh: JW-RNG-001"
                                                    required
                                                />
                                                <InputError message={errors.sku} />
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="name" className="text-xs font-semibold">
                                                    Nama Item Perhiasan *
                                                </Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    className="h-9"
                                                    placeholder="Contoh: Cincin Subeng Perak"
                                                    required
                                                />
                                                <InputError message={errors.name} />
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="item_category_id" className="text-xs font-semibold">
                                                    Kategori *
                                                </Label>
                                                <select
                                                    id="item_category_id"
                                                    name="item_category_id"
                                                    className="form-select-custom h-9 w-full"
                                                    required
                                                >
                                                    <option value="">Pilih Kategori</option>
                                                    {activeCategories.map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.item_category_id} />
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="unit_id" className="text-xs font-semibold">
                                                    Satuan Standar *
                                                </Label>
                                                <select
                                                    id="unit_id"
                                                    name="unit_id"
                                                    className="form-select-custom h-9 w-full"
                                                    required
                                                >
                                                    <option value="">Pilih Satuan</option>
                                                    {activeUnits.map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.name} ({item.symbol})
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.unit_id} />
                                            </div>

                                            <label className="flex items-center gap-2 pt-1 text-xs font-medium">
                                                <input type="hidden" name="is_active" value="0" />
                                                <Checkbox name="is_active" value="1" defaultChecked />{' '}
                                                Item Langsung Aktif
                                            </label>

                                            <Button
                                                className="w-full font-medium"
                                                disabled={processing}
                                            >
                                                Simpan Item ke Katalog
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>

                        {/* Category & Unit Mini Editors */}
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                            <QuickForm
                                icon={Layers}
                                title="Tambah Kategori Baru"
                                action="/central/item-categories"
                                fields={[
                                    ['name', 'Nama Kategori *'],
                                    ['code', 'Kode Singkatan (Opsional)'],
                                ]}
                            />
                            <MasterOptionEditor
                                icon={Layers}
                                title="Daftar Kategori"
                                path="item-categories"
                                options={categories}
                                secondaryKey="code"
                                secondaryLabel="Kode"
                            />
                            <QuickForm
                                icon={Ruler}
                                title="Tambah Satuan Baru"
                                action="/central/units"
                                fields={[
                                    ['name', 'Nama Satuan *'],
                                    ['symbol', 'Simbol Satuan (pcs/gr/kt) *'],
                                ]}
                            />
                            <MasterOptionEditor
                                icon={Ruler}
                                title="Daftar Satuan Ukur"
                                path="units"
                                options={units}
                                secondaryKey="symbol"
                                secondaryLabel="Simbol"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

function QuickForm({
    icon: Icon,
    title,
    action,
    fields,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    action: string;
    fields: [string, string][];
}) {
    return (
        <Card className="border-border/70 shadow-xs">
            <CardHeader className="border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider">
                        {title}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <Form
                    action={action}
                    method="post"
                    className="space-y-2.5"
                    resetOnSuccess
                >
                    {({ processing }) => (
                        <>
                            {fields.map(([name, label]) => (
                                <div key={name} className="space-y-1">
                                    <Label htmlFor={`${title}-${name}`} className="text-xs">
                                        {label}
                                    </Label>
                                    <Input
                                        id={`${title}-${name}`}
                                        name={name}
                                        className="h-8 text-xs"
                                        required={name !== 'code'}
                                    />
                                </div>
                            ))}
                            <input type="hidden" name="is_active" value="1" />
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-8 text-xs font-medium"
                                disabled={processing}
                            >
                                Simpan Data
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function MasterOptionEditor({
    icon: Icon,
    title,
    path,
    options,
    secondaryKey,
    secondaryLabel,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    path: string;
    options: Option[];
    secondaryKey: 'code' | 'symbol';
    secondaryLabel: string;
}) {
    return (
        <Card className="border-border/70 shadow-xs">
            <CardHeader className="border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider">
                        {title} ({options.length})
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
                {options.map((option) => (
                    <EditDetails
                        key={option.id}
                        label={`${option.name} (${option[secondaryKey] ?? '-'})`}
                    >
                        <Form
                            action={`/central/${path}/${option.id}`}
                            method="put"
                            className="space-y-2 p-1"
                        >
                            {({ processing }) => (
                                <>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Nama</Label>
                                        <Input
                                            name="name"
                                            defaultValue={option.name}
                                            required
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">{secondaryLabel}</Label>
                                        <Input
                                            name={secondaryKey}
                                            defaultValue={option[secondaryKey] ?? ''}
                                            placeholder={secondaryLabel}
                                            required={secondaryKey === 'symbol'}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                    <input
                                        type="hidden"
                                        name="is_active"
                                        value="0"
                                    />
                                    <label className="flex items-center gap-2 text-xs font-medium">
                                        <Checkbox
                                            name="is_active"
                                            value="1"
                                            defaultChecked={option.is_active}
                                        />{' '}
                                        Aktif
                                    </label>
                                    <Button size="sm" className="h-8 w-full text-xs" disabled={processing}>
                                        Simpan
                                    </Button>
                                </>
                            )}
                        </Form>
                    </EditDetails>
                ))}
            </CardContent>
        </Card>
    );
}

ItemIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Master Item', href: '/central/items' },
    ],
};
