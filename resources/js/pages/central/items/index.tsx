import { Form, Head } from '@inertiajs/react';
import {
    Boxes,
    Layers,
    MoreHorizontal,
    Pencil,
    Plus,
    Ruler,
    Search,
} from 'lucide-react';
import { useState } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    items: { data: Item[]; links: PaginationLink[]; current_page?: number; per_page?: number };
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

    const [createItemOpen, setCreateItemOpen] = useState(false);
    const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
    const [createUnitOpen, setCreateUnitOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    const currentPage = items.current_page || 1;
    const perPage = items.per_page || 15;

    return (
        <>
            <Head title="Master Katalog Item & Material — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Data Master"
                    title="Katalog Master Item"
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => setCreateUnitOpen(true)}
                            >
                                <Ruler className="mr-1.5 size-3.5 text-muted-foreground" />
                                Satuan Ukur
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => setCreateCategoryOpen(true)}
                            >
                                <Layers className="mr-1.5 size-3.5 text-muted-foreground" />
                                Kategori
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 text-xs shadow-xs"
                                onClick={() => setCreateItemOpen(true)}
                            >
                                <Plus className="mr-1.5 size-3.5" />
                                Tambah Item
                            </Button>
                        </div>
                    }
                />

                {/* Main Full-Width Data Table Card */}
                <Card className="border-border/70 shadow-2xs">
                    <CardHeader className="border-b border-border/40 py-3 px-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <Boxes className="size-4 text-primary" />
                                <CardTitle className="text-sm font-semibold">
                                    Daftar Item ({items.data.length})
                                </CardTitle>
                            </div>

                            <Form action="/central/items" method="get">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        name="search"
                                        defaultValue={filters.search}
                                        placeholder="Cari SKU atau nama item..."
                                        aria-label="Cari item"
                                        className="h-8 w-full pl-8 sm:w-64 text-xs"
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
                                    description="Gunakan tombol Tambah Item untuk mendaftarkan perhiasan atau material baru."
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-border/60 bg-muted/30 font-medium text-muted-foreground">
                                            <th className="py-2.5 px-3 w-12 text-center">#</th>
                                            <th className="py-2.5 px-3">Kode SKU</th>
                                            <th className="py-2.5 px-3">Nama Item / Perhiasan</th>
                                            <th className="py-2.5 px-3">Kategori</th>
                                            <th className="py-2.5 px-3">Satuan</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                            <th className="py-2.5 px-3 w-16 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {items.data.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-3 text-center font-mono text-[11px] text-muted-foreground">
                                                    {(currentPage - 1) * perPage + idx + 1}
                                                </td>
                                                <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-primary">
                                                    {item.sku}
                                                </td>
                                                <td className="py-2.5 px-3 font-semibold text-foreground">
                                                    {item.name}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                        {item.category.name}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                                    {item.unit.symbol ?? item.unit.name}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <Badge
                                                        variant={item.is_active ? 'default' : 'secondary'}
                                                        className="text-[10px]"
                                                    >
                                                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </Badge>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7 text-muted-foreground hover:text-foreground"
                                                            >
                                                                <MoreHorizontal className="size-4" />
                                                                <span className="sr-only">Aksi</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-36 text-xs">
                                                            <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                                                                Pilihan
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                onClick={() => setEditingItem(item)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Pencil className="mr-2 size-3.5" />
                                                                Edit Item
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="border-t border-border/40 p-3">
                            <PaginationLinks links={items.links} />
                        </div>
                    </CardContent>
                </Card>

                {/* Dialog: Create Item */}
                <Dialog open={createItemOpen} onOpenChange={setCreateItemOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                Tambah Item Katalog Baru
                            </DialogTitle>
                        </DialogHeader>
                        <Form
                            action="/central/items"
                            method="post"
                            className="space-y-3 pt-2"
                            onSuccess={() => setCreateItemOpen(false)}
                            resetOnSuccess
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Kode SKU *</Label>
                                        <Input
                                            name="sku"
                                            className="h-8.5 font-mono text-xs"
                                            placeholder="JW-RNG-001"
                                            required
                                        />
                                        <InputError message={errors.sku} />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Nama Item / Material *</Label>
                                        <Input
                                            name="name"
                                            className="h-8.5 text-xs"
                                            placeholder="Cincin Subeng Perak"
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Kategori *</Label>
                                            <select
                                                name="item_category_id"
                                                className="form-select-custom h-8.5 w-full text-xs"
                                                required
                                            >
                                                <option value="">Pilih Kategori</option>
                                                {activeCategories.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.item_category_id} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Satuan Standar *</Label>
                                            <select
                                                name="unit_id"
                                                className="form-select-custom h-8.5 w-full text-xs"
                                                required
                                            >
                                                <option value="">Pilih Satuan</option>
                                                {activeUnits.map((u) => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.name} ({u.symbol})
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.unit_id} />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 pt-1 text-xs">
                                        <input type="hidden" name="is_active" value="0" />
                                        <Checkbox name="is_active" value="1" defaultChecked />
                                        <span>Item Langsung Aktif</span>
                                    </label>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => setCreateItemOpen(false)}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className="h-8 text-xs font-medium"
                                            disabled={processing}
                                        >
                                            Simpan Item
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Edit Item */}
                {editingItem && (
                    <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-base font-semibold">
                                    Edit Item: {editingItem.sku}
                                </DialogTitle>
                            </DialogHeader>
                            <Form
                                action={`/central/items/${editingItem.id}`}
                                method="put"
                                className="space-y-3 pt-2"
                                onSuccess={() => setEditingItem(null)}
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Kode SKU *</Label>
                                            <Input
                                                name="sku"
                                                defaultValue={editingItem.sku}
                                                className="h-8.5 font-mono text-xs"
                                                required
                                            />
                                            <InputError message={errors.sku} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Nama Item *</Label>
                                            <Input
                                                name="name"
                                                defaultValue={editingItem.name}
                                                className="h-8.5 text-xs"
                                                required
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Kategori *</Label>
                                                <select
                                                    name="item_category_id"
                                                    defaultValue={editingItem.category.id}
                                                    className="form-select-custom h-8.5 w-full text-xs"
                                                >
                                                    {categories.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.item_category_id} />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Satuan *</Label>
                                                <select
                                                    name="unit_id"
                                                    defaultValue={editingItem.unit.id}
                                                    className="form-select-custom h-8.5 w-full text-xs"
                                                >
                                                    {units.map((u) => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.name} ({u.symbol})
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.unit_id} />
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 pt-1 text-xs">
                                            <input type="hidden" name="is_active" value="0" />
                                            <Checkbox
                                                name="is_active"
                                                value="1"
                                                defaultChecked={editingItem.is_active}
                                            />
                                            <span>Item Aktif Digunakan</span>
                                        </label>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => setEditingItem(null)}
                                            >
                                                Batal
                                            </Button>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                className="h-8 text-xs font-medium"
                                                disabled={processing}
                                            >
                                                Simpan Perubahan
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Dialog: Category Manager */}
                <Dialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                Kelola Kategori Item
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                            <Form
                                action="/central/item-categories"
                                method="post"
                                className="space-y-2.5 rounded-lg border border-border/50 bg-muted/20 p-3"
                                resetOnSuccess
                            >
                                {({ processing }) => (
                                    <>
                                        <p className="text-xs font-semibold">Tambah Kategori Baru</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                name="name"
                                                placeholder="Nama Kategori *"
                                                required
                                                className="h-8 text-xs"
                                            />
                                            <Input
                                                name="code"
                                                placeholder="Kode (opsional)"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <Button size="sm" className="h-7.5 w-full text-xs" disabled={processing}>
                                            Simpan Kategori
                                        </Button>
                                    </>
                                )}
                            </Form>

                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                    Daftar Kategori Saat Ini:
                                </Label>
                                {categories.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between rounded-md border border-border/40 p-2 text-xs">
                                        <span className="font-medium text-foreground">{c.name} {c.code && `(${c.code})`}</span>
                                        <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                            {c.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Unit Manager */}
                <Dialog open={createUnitOpen} onOpenChange={setCreateUnitOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                Kelola Satuan Ukur
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                            <Form
                                action="/central/units"
                                method="post"
                                className="space-y-2.5 rounded-lg border border-border/50 bg-muted/20 p-3"
                                resetOnSuccess
                            >
                                {({ processing }) => (
                                    <>
                                        <p className="text-xs font-semibold">Tambah Satuan Baru</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                name="name"
                                                placeholder="Nama Satuan *"
                                                required
                                                className="h-8 text-xs"
                                            />
                                            <Input
                                                name="symbol"
                                                placeholder="Simbol (pcs/gr/kt) *"
                                                required
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <Button size="sm" className="h-7.5 w-full text-xs" disabled={processing}>
                                            Simpan Satuan
                                        </Button>
                                    </>
                                )}
                            </Form>

                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                    Daftar Satuan Saat Ini:
                                </Label>
                                {units.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between rounded-md border border-border/40 p-2 text-xs">
                                        <span className="font-medium text-foreground">{u.name} ({u.symbol})</span>
                                        <Badge variant={u.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </main>
        </>
    );
}
