import { Form, Head } from '@inertiajs/react';
import {
    Building2,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Store,
    Users,
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

type StoreItem = {
    id: number;
    code: string;
    name: string;
    address?: string | null;
    is_active: boolean;
    users_count: number;
};
type Props = {
    stores: { data: StoreItem[]; links: PaginationLink[]; current_page?: number; per_page?: number };
    filters: { search: string };
};

export default function StoreIndex({ stores, filters }: Props) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<StoreItem | null>(null);

    const currentPage = stores.current_page || 1;
    const perPage = stores.per_page || 15;

    return (
        <>
            <Head title="Manajemen Toko & Butik — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Manajemen Cabang"
                    title="Toko & Butik Cabang"
                    actions={
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="h-8 text-xs shadow-xs">
                                    <Plus className="mr-1.5 size-3.5" />
                                    Tambah Butik
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-base font-semibold">
                                        Tambah Toko / Butik Baru
                                    </DialogTitle>
                                </DialogHeader>
                                <Form
                                    action="/central/stores"
                                    method="post"
                                    className="space-y-3 pt-2"
                                    onSuccess={() => setCreateDialogOpen(false)}
                                    resetOnSuccess
                                >
                                    {({ errors, processing }) => (
                                        <>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Kode Butik *</Label>
                                                <Input
                                                    name="code"
                                                    placeholder="TLL-JAX"
                                                    required
                                                    className="h-8.5 font-mono text-xs uppercase"
                                                />
                                                <InputError message={errors.code} />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Nama Butik *</Label>
                                                <Input
                                                    name="name"
                                                    placeholder="Tulola Pacific Place"
                                                    required
                                                    className="h-8.5 text-xs"
                                                />
                                                <InputError message={errors.name} />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Alamat Fisik</Label>
                                                <textarea
                                                    name="address"
                                                    rows={2}
                                                    placeholder="Alamat lengkap gerai butik..."
                                                    className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                />
                                                <InputError message={errors.address} />
                                            </div>

                                            <label className="flex items-center gap-2 pt-1 text-xs">
                                                <input type="hidden" name="is_active" value="0" />
                                                <Checkbox name="is_active" value="1" defaultChecked />
                                                <span>Toko Langsung Beroperasi</span>
                                            </label>

                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={() => setCreateDialogOpen(false)}
                                                >
                                                    Batal
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    className="h-8 text-xs font-medium"
                                                    disabled={processing}
                                                >
                                                    Simpan Butik
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    }
                />

                {/* Main Full-Width Data Table Card */}
                <Card className="border-border/70 shadow-2xs">
                    <CardHeader className="border-b border-border/40 py-3 px-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <Store className="size-4 text-primary" />
                                <CardTitle className="text-sm font-semibold">
                                    Daftar Butik ({stores.data.length})
                                </CardTitle>
                            </div>

                            <Form action="/central/stores" method="get">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        name="search"
                                        defaultValue={filters.search}
                                        placeholder="Cari kode atau nama butik..."
                                        aria-label="Cari toko"
                                        className="h-8 w-full pl-8 sm:w-64 text-xs"
                                    />
                                </div>
                            </Form>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {stores.data.length === 0 ? (
                            <div className="p-8">
                                <EmptyState
                                    icon={Store}
                                    title="Belum ada butik terdaftar"
                                    description="Gunakan tombol Tambah Butik untuk mendaftarkan gerai baru."
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-border/60 bg-muted/30 font-medium text-muted-foreground">
                                            <th className="py-2.5 px-3 w-12 text-center">#</th>
                                            <th className="py-2.5 px-3">Kode Butik</th>
                                            <th className="py-2.5 px-3">Nama & Alamat Butik</th>
                                            <th className="py-2.5 px-3 text-center">PIC Terdaftar</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                            <th className="py-2.5 px-3 w-16 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {stores.data.map((store, idx) => (
                                            <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-3 text-center font-mono text-[11px] text-muted-foreground">
                                                    {(currentPage - 1) * perPage + idx + 1}
                                                </td>
                                                <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-primary">
                                                    {store.code}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className="font-semibold text-foreground">
                                                        {store.name}
                                                    </span>
                                                    {store.address && (
                                                        <p className="max-w-md truncate text-[11px] text-muted-foreground mt-0.5">
                                                            {store.address}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                                                        <Users className="size-3 text-muted-foreground" />
                                                        {store.users_count} PIC
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <Badge
                                                        variant={store.is_active ? 'default' : 'secondary'}
                                                        className="text-[10px]"
                                                    >
                                                        {store.is_active ? 'Aktif' : 'Nonaktif'}
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
                                                                onClick={() => setEditingStore(store)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Pencil className="mr-2 size-3.5" />
                                                                Edit Butik
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
                            <PaginationLinks links={stores.links} />
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Store Dialog */}
                {editingStore && (
                    <Dialog open={!!editingStore} onOpenChange={(open) => !open && setEditingStore(null)}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-base font-semibold">
                                    Edit Butik: {editingStore.name}
                                </DialogTitle>
                            </DialogHeader>
                            <Form
                                action={`/central/stores/${editingStore.id}`}
                                method="put"
                                className="space-y-3 pt-2"
                                onSuccess={() => setEditingStore(null)}
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Kode Butik *</Label>
                                            <Input
                                                name="code"
                                                defaultValue={editingStore.code}
                                                required
                                                className="h-8.5 font-mono text-xs uppercase"
                                            />
                                            <InputError message={errors.code} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Nama Butik *</Label>
                                            <Input
                                                name="name"
                                                defaultValue={editingStore.name}
                                                required
                                                className="h-8.5 text-xs"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Alamat Fisik</Label>
                                            <textarea
                                                name="address"
                                                rows={2}
                                                defaultValue={editingStore.address ?? ''}
                                                className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            />
                                            <InputError message={errors.address} />
                                        </div>

                                        <label className="flex items-center gap-2 pt-1 text-xs">
                                            <input type="hidden" name="is_active" value="0" />
                                            <Checkbox
                                                name="is_active"
                                                value="1"
                                                defaultChecked={editingStore.is_active}
                                            />
                                            <span>Butik Aktif Beroperasi</span>
                                        </label>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => setEditingStore(null)}
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
            </main>
        </>
    );
}
