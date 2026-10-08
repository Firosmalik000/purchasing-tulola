import { Form, Head } from '@inertiajs/react';
import {
    Building2,
    Check,
    KeyRound,
    MoreHorizontal,
    Pencil,
    Plus,
    Shield,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
    X,
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Store = { id: number; code: string; name: string };
type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    stores: Store[];
};
type Props = {
    users: { data: User[]; links: PaginationLink[]; current_page?: number; per_page?: number };
    stores: Store[];
    roles: { value: string; label: string }[];
};

export default function UserIndex({ users, stores, roles }: Props) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [assigningUser, setAssigningUser] = useState<User | null>(null);

    const roleLabels: Record<string, string> = {
        CENTRAL_ADMIN: 'Admin Purchasing Pusat',
        STORE_PIC: 'PIC Operasional Toko',
        SUPER_ADMIN: 'Super Administrator',
    };

    const currentPage = users.current_page || 1;
    const perPage = users.per_page || 15;

    return (
        <>
            <Head title="Manajemen Pengguna & PIC — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Akses"
                    title="Pengguna"
                    actions={
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="h-8 shadow-xs">
                                    <UserPlus className="mr-1.5 size-3.5" />
                                    Tambah Pengguna
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-base font-semibold">
                                        Tambah Pengguna Baru
                                    </DialogTitle>
                                    <DialogDescription className="text-xs">
                                        Undang staf atau buat kredensial akun baru untuk sistem purchasing.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form
                                    action="/central/users"
                                    method="post"
                                    className="space-y-3.5 pt-2"
                                    onSuccess={() => setCreateDialogOpen(false)}
                                    resetOnSuccess
                                >
                                    {({ errors, processing }) => (
                                        <>
                                            <div className="space-y-1">
                                                <Label htmlFor="create-name" className="text-xs font-medium">
                                                    Nama Lengkap *
                                                </Label>
                                                <Input
                                                    id="create-name"
                                                    name="name"
                                                    className="h-8.5 text-xs"
                                                    placeholder="Nama staf"
                                                    required
                                                />
                                                <InputError message={errors.name} />
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="create-email" className="text-xs font-medium">
                                                    Alamat Email *
                                                </Label>
                                                <Input
                                                    id="create-email"
                                                    name="email"
                                                    type="email"
                                                    className="h-8.5 text-xs"
                                                    placeholder="email@tulolajewelry.com"
                                                    required
                                                />
                                                <InputError message={errors.email} />
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="create-role" className="text-xs font-medium">
                                                    Peran / Role *
                                                </Label>
                                                <select
                                                    id="create-role"
                                                    name="role"
                                                    className="form-select-custom h-8.5 w-full text-xs"
                                                    required
                                                >
                                                    {roles.map((r) => (
                                                        <option key={r.value} value={r.value}>
                                                            {r.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.role} />
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="create-password" className="text-xs font-medium">
                                                    Kata Sandi (Opsional)
                                                </Label>
                                                <Input
                                                    id="create-password"
                                                    name="password"
                                                    type="password"
                                                    className="h-8.5 text-xs"
                                                    placeholder="Kosongkan untuk kirim link email"
                                                />
                                                <InputError message={errors.password} />
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="create-pass-confirm" className="text-xs font-medium">
                                                    Konfirmasi Sandi
                                                </Label>
                                                <Input
                                                    id="create-pass-confirm"
                                                    name="password_confirmation"
                                                    type="password"
                                                    className="h-8.5 text-xs"
                                                    placeholder="Ulangi jika mengisi sandi"
                                                />
                                            </div>

                                            <label className="flex items-center gap-2 pt-1 text-xs">
                                                <input type="hidden" name="is_active" value="0" />
                                                <Checkbox name="is_active" value="1" defaultChecked />
                                                <span>Akun Langsung Aktif</span>
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
                                                    Simpan Pengguna
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="size-4 text-primary" />
                                <CardTitle className="text-sm font-semibold">
                                    Daftar Pengguna ({users.data.length})
                                </CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {users.data.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                title="Belum ada pengguna terdaftar"
                                description="Gunakan tombol Tambah Pengguna untuk membuat akun staf baru."
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-border/60 bg-muted/30 font-medium text-muted-foreground">
                                            <th className="py-2.5 px-3 w-12 text-center">#</th>
                                            <th className="py-2.5 px-3">Nama Pengguna</th>
                                            <th className="py-2.5 px-3">Email</th>
                                            <th className="py-2.5 px-3">Peran / Otoritas</th>
                                            <th className="py-2.5 px-3">Penugasan Butik</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                            <th className="py-2.5 px-3 w-16 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {users.data.map((user, idx) => (
                                            <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-3 text-center font-mono text-[11px] text-muted-foreground">
                                                    {(currentPage - 1) * perPage + idx + 1}
                                                </td>
                                                <td className="py-2.5 px-3 font-semibold text-foreground">
                                                    {user.name}
                                                </td>
                                                <td className="py-2.5 px-3 text-muted-foreground">
                                                    {user.email}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <Badge variant="outline" className="text-[10px] font-semibold">
                                                        {roleLabels[user.role] ?? user.role}
                                                    </Badge>
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    {user.stores.length === 0 ? (
                                                        <span className="text-[11px] italic text-muted-foreground">
                                                            {user.role === 'STORE_PIC' ? 'Belum ada toko' : 'Akses Global'}
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.stores.map((s) => (
                                                                <Badge key={s.id} variant="secondary" className="text-[10px] py-0 px-1.5">
                                                                    {s.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <Badge
                                                        variant={user.is_active ? 'default' : 'secondary'}
                                                        className="text-[10px]"
                                                    >
                                                        {user.is_active ? 'Aktif' : 'Nonaktif'}
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
                                                        <DropdownMenuContent align="end" className="w-40 text-xs">
                                                            <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                                                                Tindakan
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                onClick={() => setEditingUser(user)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Pencil className="mr-2 size-3.5" />
                                                                Edit Data
                                                            </DropdownMenuItem>
                                                            {user.role === 'STORE_PIC' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => setAssigningUser(user)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Building2 className="mr-2 size-3.5" />
                                                                    Atur Butik
                                                                </DropdownMenuItem>
                                                            )}
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
                            <PaginationLinks links={users.links} />
                        </div>
                    </CardContent>
                </Card>

                {/* Edit User Dialog */}
                {editingUser && (
                    <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-base font-semibold">
                                    Edit Pengguna: {editingUser.name}
                                </DialogTitle>
                            </DialogHeader>
                            <Form
                                action={`/central/users/${editingUser.id}`}
                                method="put"
                                className="space-y-3.5 pt-2"
                                onSuccess={() => setEditingUser(null)}
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Nama Lengkap *</Label>
                                            <Input
                                                name="name"
                                                defaultValue={editingUser.name}
                                                required
                                                className="h-8.5 text-xs"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Email *</Label>
                                            <Input
                                                name="email"
                                                type="email"
                                                defaultValue={editingUser.email}
                                                required
                                                className="h-8.5 text-xs"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Peran / Otoritas *</Label>
                                            <select
                                                name="role"
                                                defaultValue={editingUser.role}
                                                className="form-select-custom h-8.5 w-full text-xs"
                                            >
                                                {roles.map((r) => (
                                                    <option key={r.value} value={r.value}>
                                                        {r.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.role} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Kata Sandi Baru (Opsional)</Label>
                                            <Input
                                                name="password"
                                                type="password"
                                                placeholder="Kosongkan jika tetap"
                                                className="h-8.5 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Konfirmasi Sandi Baru</Label>
                                            <Input
                                                name="password_confirmation"
                                                type="password"
                                                placeholder="Ulangi sandi baru"
                                                className="h-8.5 text-xs"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 pt-1 text-xs">
                                            <input type="hidden" name="is_active" value="0" />
                                            <Checkbox
                                                name="is_active"
                                                value="1"
                                                defaultChecked={editingUser.is_active}
                                            />
                                            <span>Akun Aktif Bisa Login</span>
                                        </label>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => setEditingUser(null)}
                                            >
                                                Batal
                                            </Button>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                className="h-8 text-xs font-medium"
                                                disabled={processing}
                                            >
                                                Perbarui Akun
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Manage Store Assignments Dialog */}
                {assigningUser && (
                    <Dialog open={!!assigningUser} onOpenChange={(open) => !open && setAssigningUser(null)}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-base font-semibold">
                                    Penugasan Toko Butik: {assigningUser.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Atur cabang butik yang dapat diakses oleh PIC ini.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                        Toko yang Sedang Ditugaskan:
                                    </Label>
                                    {assigningUser.stores.length === 0 ? (
                                        <p className="text-xs italic text-muted-foreground">Belum ada penugasan.</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {assigningUser.stores.map((st) => (
                                                <div
                                                    key={st.id}
                                                    className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 p-2 text-xs"
                                                >
                                                    <span className="font-medium text-foreground">{st.name} ({st.code})</span>
                                                    <Form
                                                        action={`/central/stores/${st.id}/users/${assigningUser.id}`}
                                                        method="delete"
                                                        onSuccess={() => {
                                                            setAssigningUser((prev) =>
                                                                prev ? { ...prev, stores: prev.stores.filter((s) => s.id !== st.id) } : null
                                                            );
                                                        }}
                                                    >
                                                        {({ processing }) => (
                                                            <Button
                                                                type="submit"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-6 text-red-500 hover:text-red-700"
                                                                disabled={processing}
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        )}
                                                    </Form>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-border/50 pt-3">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                        Tambah Penugasan Butik:
                                    </Label>
                                    <AssignmentForm
                                        userId={assigningUser.id}
                                        stores={stores.filter((s) => !assigningUser.stores.some((as) => as.id === s.id))}
                                        onAssigned={() => setAssigningUser(null)}
                                    />
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </main>
        </>
    );
}

function AssignmentForm({
    userId,
    stores,
    onAssigned,
}: {
    userId: number;
    stores: Store[];
    onAssigned: () => void;
}) {
    const [storeId, setStoreId] = useState('');

    if (stores.length === 0) {
        return <p className="mt-1 text-xs text-muted-foreground">Semua toko butik sudah ditugaskan.</p>;
    }

    return (
        <Form
            action={`/central/stores/${storeId}/users`}
            method="post"
            className="flex gap-2 pt-2"
            onSuccess={onAssigned}
        >
            {({ processing }) => (
                <>
                    <input type="hidden" name="user_id" value={userId} />
                    <input type="hidden" name="is_pic" value="1" />
                    <select
                        value={storeId}
                        onChange={(e) => setStoreId(e.target.value)}
                        className="form-select-custom h-8.5 flex-1 text-xs"
                        required
                    >
                        <option value="">Pilih butik toko...</option>
                        {stores.map((st) => (
                            <option key={st.id} value={st.id}>
                                {st.name} ({st.code})
                            </option>
                        ))}
                    </select>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!storeId || processing}
                        className="h-8.5 text-xs shrink-0"
                    >
                        Tugaskan
                    </Button>
                </>
            )}
        </Form>
    );
}
