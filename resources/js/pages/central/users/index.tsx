import { Form, Head, router } from '@inertiajs/react';
import {
    Building2,
    Mail,
    MoreHorizontal,
    Pencil,
    Send,
    Trash2,
    UserPlus,
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
    has_pending_invitation?: boolean;
    invitation_token?: string | null;
    stores: Store[];
};
type Props = {
    auth: { user: { id: number } };
    users: {
        data: User[];
        links: PaginationLink[];
        current_page?: number;
        per_page?: number;
    };
    stores: Store[];
    roles: { value: string; label: string }[];
};

export default function UserIndex({ auth, users, stores, roles }: Props) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [assigningUser, setAssigningUser] = useState<User | null>(null);
    const [isInviteMode, setIsInviteMode] = useState(true);
    const [selectedRole, setSelectedRole] = useState(
        roles[0]?.value || 'STORE_PIC',
    );

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
                        <Dialog
                            open={createDialogOpen}
                            onOpenChange={setCreateDialogOpen}
                        >
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
                                        Undang staf atau buat akun baru untuk
                                        sistem purchasing.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Mode Switch: Invite Email vs Manual Credentials */}
                                <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/80 bg-muted/40 p-1 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setIsInviteMode(true)}
                                        className={`rounded-md py-1.5 text-center font-medium transition-colors ${
                                            isInviteMode
                                                ? 'bg-card text-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Undang via Email
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsInviteMode(false)}
                                        className={`rounded-md py-1.5 text-center font-medium transition-colors ${
                                            !isInviteMode
                                                ? 'bg-card text-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Input Password Manual
                                    </button>
                                </div>

                                <Form
                                    action="/central/users"
                                    method="post"
                                    className="space-y-3 pt-1"
                                    onSuccess={() => setCreateDialogOpen(false)}
                                    resetOnSuccess
                                >
                                    {({ errors, processing }) => (
                                        <>
                                            <input
                                                type="hidden"
                                                name="send_invitation"
                                                value={isInviteMode ? '1' : '0'}
                                            />

                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="create-name"
                                                    className="text-xs font-medium"
                                                >
                                                    Nama Lengkap *
                                                </Label>
                                                <Input
                                                    id="create-name"
                                                    name="name"
                                                    className="h-8.5 text-xs"
                                                    placeholder="Nama staf"
                                                    required
                                                />
                                                <InputError
                                                    message={errors.name}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="create-email"
                                                    className="text-xs font-medium"
                                                >
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
                                                <InputError
                                                    message={errors.email}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="create-role"
                                                    className="text-xs font-medium"
                                                >
                                                    Peran / Role *
                                                </Label>
                                                <select
                                                    id="create-role"
                                                    name="role"
                                                    value={selectedRole}
                                                    onChange={(e) =>
                                                        setSelectedRole(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="form-select-custom h-8.5 w-full text-xs"
                                                    required
                                                >
                                                    {roles.map((r) => (
                                                        <option
                                                            key={r.value}
                                                            value={r.value}
                                                        >
                                                            {r.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError
                                                    message={errors.role}
                                                />
                                            </div>

                                            {/* Optional Store Assignment when role is STORE_PIC */}
                                            {selectedRole === 'STORE_PIC' && (
                                                <div className="space-y-1.5 rounded-lg border border-border/70 bg-muted/20 p-2.5">
                                                    <Label
                                                        htmlFor="create-store"
                                                        className="text-xs font-medium"
                                                    >
                                                        Tugaskan ke Toko Cabang
                                                        (Opsional)
                                                    </Label>
                                                    <select
                                                        id="create-store"
                                                        name="store_id"
                                                        className="form-select-custom h-8.5 w-full text-xs"
                                                        defaultValue=""
                                                    >
                                                        <option value="">
                                                            -- Pilih Toko Cabang
                                                            Penugasan --
                                                        </option>
                                                        {stores.map((s) => (
                                                            <option
                                                                key={s.id}
                                                                value={s.id}
                                                            >
                                                                [{s.code}]{' '}
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <label className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                                                        <input
                                                            type="hidden"
                                                            name="is_pic"
                                                            value="0"
                                                        />
                                                        <Checkbox
                                                            name="is_pic"
                                                            value="1"
                                                            defaultChecked
                                                        />
                                                        <span>
                                                            Tetapkan sebagai PIC
                                                            Utama toko cabang
                                                            ini
                                                        </span>
                                                    </label>
                                                </div>
                                            )}

                                            {isInviteMode ? (
                                                <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-muted-foreground">
                                                    <Mail className="mt-0.5 size-4 shrink-0 text-blue-600" />
                                                    <span>
                                                        Tautan email akan
                                                        dikirim ke staf. Staf
                                                        akan membuat kata sandi
                                                        sendiri saat mengklik
                                                        link undangan. Status
                                                        akun otomatis{' '}
                                                        <strong>
                                                            Menunggu Aktivasi
                                                        </strong>
                                                        .
                                                    </span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-1">
                                                        <Label
                                                            htmlFor="create-password"
                                                            className="text-xs font-medium"
                                                        >
                                                            Kata Sandi *
                                                        </Label>
                                                        <Input
                                                            id="create-password"
                                                            name="password"
                                                            type="password"
                                                            className="h-8.5 text-xs"
                                                            placeholder="Minimal 8 karakter"
                                                            required
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.password
                                                            }
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label
                                                            htmlFor="create-pass-confirm"
                                                            className="text-xs font-medium"
                                                        >
                                                            Konfirmasi Sandi *
                                                        </Label>
                                                        <Input
                                                            id="create-pass-confirm"
                                                            name="password_confirmation"
                                                            type="password"
                                                            className="h-8.5 text-xs"
                                                            placeholder="Ulangi kata sandi"
                                                            required
                                                        />
                                                    </div>

                                                    <label className="flex items-center gap-2 pt-1 text-xs">
                                                        <input
                                                            type="hidden"
                                                            name="is_active"
                                                            value="0"
                                                        />
                                                        <Checkbox
                                                            name="is_active"
                                                            value="1"
                                                            defaultChecked
                                                        />
                                                        <span>
                                                            Akun Langsung Aktif
                                                        </span>
                                                    </label>
                                                </>
                                            )}

                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={() =>
                                                        setCreateDialogOpen(
                                                            false,
                                                        )
                                                    }
                                                >
                                                    Batal
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    className="h-8 text-xs font-medium"
                                                    disabled={processing}
                                                >
                                                    {isInviteMode
                                                        ? 'Kirim Undangan'
                                                        : 'Simpan Pengguna'}
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
                    <CardHeader className="border-b border-border/40 px-4 py-3">
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
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-border/60 bg-muted/30 font-medium text-muted-foreground">
                                            <th className="w-12 px-3 py-2.5 text-center">
                                                #
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Nama Pengguna
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Email
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Peran / Otoritas
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Penugasan Toko Cabang
                                            </th>
                                            <th className="px-3 py-2.5 text-center">
                                                Status
                                            </th>
                                            <th className="w-16 px-3 py-2.5 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {users.data.map((user, idx) => (
                                            <tr
                                                key={user.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-3 py-2.5 text-center font-mono text-[11px] text-muted-foreground">
                                                    {(currentPage - 1) *
                                                        perPage +
                                                        idx +
                                                        1}
                                                </td>
                                                <td className="px-3 py-2.5 font-semibold text-foreground">
                                                    {user.name}
                                                </td>
                                                <td className="px-3 py-2.5 text-muted-foreground">
                                                    {user.email}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] font-semibold"
                                                    >
                                                        {roleLabels[
                                                            user.role
                                                        ] ?? user.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {user.stores.length ===
                                                    0 ? (
                                                        <span className="text-[11px] text-muted-foreground italic">
                                                            {user.role ===
                                                            'STORE_PIC'
                                                                ? 'Belum ada toko'
                                                                : 'Akses Global'}
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.stores.map(
                                                                (s) => (
                                                                    <Badge
                                                                        key={
                                                                            s.id
                                                                        }
                                                                        variant="secondary"
                                                                        className="px-1.5 py-0 text-[10px]"
                                                                    >
                                                                        {s.name}
                                                                    </Badge>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {user.has_pending_invitation ||
                                                    (user.invitation_token !==
                                                        null &&
                                                        user.invitation_token !==
                                                            undefined) ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="inline-flex items-center gap-1 border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-700 dark:text-blue-300"
                                                        >
                                                            <Mail className="size-3 text-blue-600" />
                                                            Menunggu Aktivasi
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant={
                                                                user.is_active
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className="text-[10px]"
                                                        >
                                                            {user.is_active
                                                                ? 'Aktif'
                                                                : 'Nonaktif'}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7 text-muted-foreground hover:text-foreground"
                                                            >
                                                                <MoreHorizontal className="size-4" />
                                                                <span className="sr-only">
                                                                    Aksi
                                                                </span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-44 text-xs"
                                                        >
                                                            <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                                                                Tindakan
                                                            </DropdownMenuLabel>
                                                            {(user.has_pending_invitation ||
                                                                user.invitation_token) && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        router.post(
                                                                            `/central/users/${user.id}/resend-invitation`,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer font-medium text-blue-600 dark:text-blue-400"
                                                                >
                                                                    <Send className="mr-2 size-3.5" />
                                                                    Kirim Ulang
                                                                    Undangan
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setEditingUser(
                                                                        user,
                                                                    )
                                                                }
                                                                className="cursor-pointer"
                                                            >
                                                                <Pencil className="mr-2 size-3.5" />
                                                                Edit Data
                                                            </DropdownMenuItem>
                                                            {user.role ===
                                                                'STORE_PIC' && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setAssigningUser(
                                                                            user,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Building2 className="mr-2 size-3.5" />
                                                                    Atur Toko
                                                                    Cabang
                                                                </DropdownMenuItem>
                                                            )}
                                                            {user.id !==
                                                                auth.user
                                                                    .id && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            if (
                                                                                confirm(
                                                                                    `Hapus pengguna ${user.name}? Tindakan ini tidak dapat dibatalkan.`,
                                                                                )
                                                                            ) {
                                                                                router.delete(
                                                                                    `/central/users/${user.id}`,
                                                                                    {
                                                                                        preserveScroll: true,
                                                                                    },
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="cursor-pointer text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 size-3.5" />
                                                                        Hapus
                                                                        Pengguna
                                                                    </DropdownMenuItem>
                                                                </>
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
                            <PaginationLinks pagination={users} />
                        </div>
                    </CardContent>
                </Card>

                {/* Edit User Dialog */}
                {editingUser && (
                    <Dialog
                        open={!!editingUser}
                        onOpenChange={(open) => !open && setEditingUser(null)}
                    >
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
                                            <Label className="text-xs font-medium">
                                                Nama Lengkap *
                                            </Label>
                                            <Input
                                                name="name"
                                                defaultValue={editingUser.name}
                                                required
                                                className="h-8.5 text-xs"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">
                                                Email *
                                            </Label>
                                            <Input
                                                name="email"
                                                type="email"
                                                defaultValue={editingUser.email}
                                                required
                                                className="h-8.5 text-xs"
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">
                                                Peran / Otoritas *
                                            </Label>
                                            <select
                                                name="role"
                                                defaultValue={editingUser.role}
                                                className="form-select-custom h-8.5 w-full text-xs"
                                            >
                                                {roles.map((r) => (
                                                    <option
                                                        key={r.value}
                                                        value={r.value}
                                                    >
                                                        {r.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.role} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">
                                                Kata Sandi Baru (Opsional)
                                            </Label>
                                            <Input
                                                name="password"
                                                type="password"
                                                placeholder="Kosongkan jika tetap"
                                                className="h-8.5 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">
                                                Konfirmasi Sandi Baru
                                            </Label>
                                            <Input
                                                name="password_confirmation"
                                                type="password"
                                                placeholder="Ulangi sandi baru"
                                                className="h-8.5 text-xs"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 pt-1 text-xs">
                                            <input
                                                type="hidden"
                                                name="is_active"
                                                value="0"
                                            />
                                            <Checkbox
                                                name="is_active"
                                                value="1"
                                                defaultChecked={
                                                    editingUser.is_active
                                                }
                                            />
                                            <span>Akun Aktif Bisa Login</span>
                                        </label>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() =>
                                                    setEditingUser(null)
                                                }
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
                    <Dialog
                        open={!!assigningUser}
                        onOpenChange={(open) => !open && setAssigningUser(null)}
                    >
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-base font-semibold">
                                    Penugasan Toko Cabang: {assigningUser.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Atur toko cabang yang dapat diakses oleh PIC
                                    ini.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                        Toko yang Sedang Ditugaskan:
                                    </Label>
                                    {assigningUser.stores.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic">
                                            Belum ada penugasan.
                                        </p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {assigningUser.stores.map((st) => (
                                                <div
                                                    key={st.id}
                                                    className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 p-2 text-xs"
                                                >
                                                    <span className="font-medium text-foreground">
                                                        {st.name} ({st.code})
                                                    </span>
                                                    <Form
                                                        action={`/central/stores/${st.id}/users/${assigningUser.id}`}
                                                        method="delete"
                                                        onSuccess={() => {
                                                            setAssigningUser(
                                                                (prev) =>
                                                                    prev
                                                                        ? {
                                                                              ...prev,
                                                                              stores: prev.stores.filter(
                                                                                  (
                                                                                      s,
                                                                                  ) =>
                                                                                      s.id !==
                                                                                      st.id,
                                                                              ),
                                                                          }
                                                                        : null,
                                                            );
                                                        }}
                                                    >
                                                        {({ processing }) => (
                                                            <Button
                                                                type="submit"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-6 text-red-500 hover:text-red-700"
                                                                disabled={
                                                                    processing
                                                                }
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
                                        Tambah Penugasan Toko Cabang:
                                    </Label>
                                    <AssignmentForm
                                        userId={assigningUser.id}
                                        stores={stores.filter(
                                            (s) =>
                                                !assigningUser.stores.some(
                                                    (as) => as.id === s.id,
                                                ),
                                        )}
                                        onAssigned={() =>
                                            setAssigningUser(null)
                                        }
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
        return (
            <p className="mt-1 text-xs text-muted-foreground">
                Semua toko cabang sudah ditugaskan.
            </p>
        );
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
                        <option value="">Pilih toko cabang...</option>
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
                        className="h-8.5 shrink-0 text-xs"
                    >
                        Tugaskan
                    </Button>
                </>
            )}
        </Form>
    );
}
