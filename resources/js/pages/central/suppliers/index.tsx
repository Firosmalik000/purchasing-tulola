import { Form, Head } from '@inertiajs/react';
import {
    Clock,
    Mail,
    MoreHorizontal,
    Pencil,
    Phone,
    Plus,
    Search,
    Truck,
    User,
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

type Supplier = {
    id: number;
    code: string;
    name: string;
    contact_person?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    payment_term?: string | null;
    is_active: boolean;
};
type Props = {
    suppliers: { data: Supplier[]; links: PaginationLink[]; current_page?: number; per_page?: number };
    filters: { search: string };
};

export default function SupplierIndex({ suppliers, filters }: Props) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const currentPage = suppliers.current_page || 1;
    const perPage = suppliers.per_page || 15;

    return (
        <>
            <Head title="Manajemen Rekanan Supplier — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Master"
                    title="Supplier"
                    actions={
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="h-8 text-xs shadow-xs">
                                    <Plus className="mr-1.5 size-3.5" />
                                    Tambah Supplier
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-base font-semibold">
                                        Tambah Mitra Supplier Baru
                                    </DialogTitle>
                                </DialogHeader>
                                <Form
                                    action="/central/suppliers"
                                    method="post"
                                    className="space-y-3 pt-2"
                                    onSuccess={() => setCreateDialogOpen(false)}
                                    resetOnSuccess
                                >
                                    {({ errors, processing }) => (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium">Kode Rekanan *</Label>
                                                    <Input
                                                        name="code"
                                                        placeholder="SPL-001"
                                                        required
                                                        className="h-8.5 font-mono text-xs uppercase"
                                                    />
                                                    <InputError message={errors.code} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium">Termin Pembayaran</Label>
                                                    <Input
                                                        name="payment_term"
                                                        placeholder="Net 30 / COD"
                                                        className="h-8.5 text-xs"
                                                    />
                                                    <InputError message={errors.payment_term} />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Nama Perusahaan / Supplier *</Label>
                                                <Input
                                                    name="name"
                                                    placeholder="CV Logam Mulia Sejahtera"
                                                    required
                                                    className="h-8.5 text-xs"
                                                />
                                                <InputError message={errors.name} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium">Kontak PIC</Label>
                                                    <Input
                                                        name="contact_person"
                                                        placeholder="Nama narahubung"
                                                        className="h-8.5 text-xs"
                                                    />
                                                    <InputError message={errors.contact_person} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium">Nomor Telepon</Label>
                                                    <Input
                                                        name="phone"
                                                        placeholder="08123456789"
                                                        className="h-8.5 text-xs"
                                                    />
                                                    <InputError message={errors.phone} />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Email Korespondensi</Label>
                                                <Input
                                                    name="email"
                                                    type="email"
                                                    placeholder="supplier@domain.com"
                                                    className="h-8.5 text-xs"
                                                />
                                                <InputError message={errors.email} />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Alamat Lengkap</Label>
                                                <textarea
                                                    name="address"
                                                    rows={2}
                                                    placeholder="Alamat kantor atau pabrik..."
                                                    className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                />
                                                <InputError message={errors.address} />
                                            </div>

                                            <label className="flex items-center gap-2 pt-1 text-xs">
                                                <input type="hidden" name="is_active" value="0" />
                                                <Checkbox name="is_active" value="1" defaultChecked />
                                                <span>Supplier Langsung Aktif</span>
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
                                                    Simpan Supplier
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
                                <Truck className="size-4 text-primary" />
                                <CardTitle className="text-sm font-semibold">
                                    Daftar Supplier ({suppliers.data.length})
                                </CardTitle>
                            </div>

                            <Form action="/central/suppliers" method="get">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        name="search"
                                        defaultValue={filters.search}
                                        placeholder="Cari kode atau nama rekanan..."
                                        aria-label="Cari supplier"
                                        className="h-8 w-full pl-8 sm:w-64 text-xs"
                                    />
                                </div>
                            </Form>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {suppliers.data.length === 0 ? (
                            <div className="p-8">
                                <EmptyState
                                    icon={Truck}
                                    title="Belum ada supplier terdaftar"
                                    description="Gunakan tombol Tambah Supplier untuk mendaftarkan mitra vendor baru."
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-border/60 bg-muted/30 font-medium text-muted-foreground">
                                            <th className="py-2.5 px-3 w-12 text-center">#</th>
                                            <th className="py-2.5 px-3">Kode</th>
                                            <th className="py-2.5 px-3">Nama Perusahaan / Supplier</th>
                                            <th className="py-2.5 px-3">Kontak & Telp</th>
                                            <th className="py-2.5 px-3">Email</th>
                                            <th className="py-2.5 px-3">Termin Bayar</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                            <th className="py-2.5 px-3 w-16 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {suppliers.data.map((supplier, idx) => (
                                            <tr key={supplier.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-3 text-center font-mono text-[11px] text-muted-foreground">
                                                    {(currentPage - 1) * perPage + idx + 1}
                                                </td>
                                                <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-primary">
                                                    {supplier.code}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className="font-semibold text-foreground">
                                                        {supplier.name}
                                                    </span>
                                                    {supplier.address && (
                                                        <p className="max-w-xs truncate text-[11px] text-muted-foreground mt-0.5">
                                                            {supplier.address}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-muted-foreground">
                                                    <div>{supplier.contact_person ?? '-'}</div>
                                                    {supplier.phone && (
                                                        <div className="text-[11px] text-muted-foreground/80 font-mono mt-0.5">
                                                            {supplier.phone}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-muted-foreground">
                                                    {supplier.email ?? '-'}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                        {supplier.payment_term || 'COD'}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <Badge
                                                        variant={supplier.is_active ? 'default' : 'secondary'}
                                                        className="text-[10px]"
                                                    >
                                                        {supplier.is_active ? 'Aktif' : 'Nonaktif'}
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
                                                                onClick={() => setEditingSupplier(supplier)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Pencil className="mr-2 size-3.5" />
                                                                Edit Supplier
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
                            <PaginationLinks links={suppliers.links} />
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Supplier Dialog */}
                {editingSupplier && (
                    <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-base font-semibold">
                                    Edit Supplier: {editingSupplier.name}
                                </DialogTitle>
                            </DialogHeader>
                            <Form
                                action={`/central/suppliers/${editingSupplier.id}`}
                                method="put"
                                className="space-y-3 pt-2"
                                onSuccess={() => setEditingSupplier(null)}
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Kode Rekanan *</Label>
                                                <Input
                                                    name="code"
                                                    defaultValue={editingSupplier.code}
                                                    required
                                                    className="h-8.5 font-mono text-xs uppercase"
                                                />
                                                <InputError message={errors.code} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Termin Pembayaran</Label>
                                                <Input
                                                    name="payment_term"
                                                    defaultValue={editingSupplier.payment_term ?? ''}
                                                    className="h-8.5 text-xs"
                                                />
                                                <InputError message={errors.payment_term} />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Nama Supplier *</Label>
                                            <Input
                                                name="name"
                                                defaultValue={editingSupplier.name}
                                                required
                                                className="h-8.5 text-xs"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Kontak PIC</Label>
                                                <Input
                                                    name="contact_person"
                                                    defaultValue={editingSupplier.contact_person ?? ''}
                                                    className="h-8.5 text-xs"
                                                />
                                                <InputError message={errors.contact_person} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">Nomor Telepon</Label>
                                                <Input
                                                    name="phone"
                                                    defaultValue={editingSupplier.phone ?? ''}
                                                    className="h-8.5 text-xs"
                                                />
                                                <InputError message={errors.phone} />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Email</Label>
                                            <Input
                                                name="email"
                                                type="email"
                                                defaultValue={editingSupplier.email ?? ''}
                                                className="h-8.5 text-xs"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Alamat</Label>
                                            <textarea
                                                name="address"
                                                rows={2}
                                                defaultValue={editingSupplier.address ?? ''}
                                                className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            />
                                            <InputError message={errors.address} />
                                        </div>

                                        <label className="flex items-center gap-2 pt-1 text-xs">
                                            <input type="hidden" name="is_active" value="0" />
                                            <Checkbox
                                                name="is_active"
                                                value="1"
                                                defaultChecked={editingSupplier.is_active}
                                            />
                                            <span>Supplier Aktif Bekerjasama</span>
                                        </label>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => setEditingSupplier(null)}
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
