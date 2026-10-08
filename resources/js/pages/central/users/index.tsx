import { Form, Head } from '@inertiajs/react';
import {
    ShieldCheck,
    Store as StoreIcon,
    UserCheck,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';
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
    users: { data: User[]; links: PaginationLink[] };
    stores: Store[];
    roles: { value: string; label: string }[];
};

export default function UserIndex({ users, stores, roles }: Props) {
    const roleLabels: Record<string, string> = {
        CENTRAL_ADMIN: 'Admin Purchasing Pusat',
        STORE_PIC: 'PIC Operasional Toko',
    };

    return (
        <>
            <Head title="Manajemen Pengguna & Otoritas PIC" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Manajemen Akses & Otorisasi"
                    title="Pengguna & PIC Toko"
                    description="Kelola akun staf purchasing kantor pusat dan PIC butik cabang, serta atur penugasan multi-toko."
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                    {/* Left: Users List */}
                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Users className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">
                                        Daftar Pengguna Sistem
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        {users.data.length} staf aktif dan PIC terdaftar
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            {users.data.length === 0 ? (
                                <EmptyState
                                    icon={Users}
                                    title="Belum ada pengguna terdaftar"
                                    description="Buat akun pengguna pertama menggunakan formulir pendaftaran di sebelah kanan."
                                />
                            ) : (
                                <div className="space-y-4">
                                    {users.data.map((user) => (
                                        <article
                                            key={user.id}
                                            className="rounded-xl border border-border/70 bg-card p-4.5 transition-colors hover:border-border"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/40 pb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-foreground">
                                                            {user.name}
                                                        </p>
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
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>

                                                <Badge
                                                    variant="outline"
                                                    className="border-primary/20 bg-primary/5 text-xs font-medium text-primary"
                                                >
                                                    {roleLabels[user.role] ?? user.role}
                                                </Badge>
                                            </div>

                                            {/* Store Assignments for Store PICs */}
                                            <div className="mt-3.5 space-y-2">
                                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Penugasan Gerai Butik:
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {user.stores.length === 0 ? (
                                                        <span className="text-xs italic text-muted-foreground">
                                                            {user.role === 'CENTRAL_ADMIN'
                                                                ? 'Akses global semua toko (Kantor Pusat)'
                                                                : 'Belum ditugaskan ke toko manapun'}
                                                        </span>
                                                    ) : (
                                                        user.stores.map((store) => (
                                                            <Form
                                                                key={store.id}
                                                                action={`/central/stores/${store.id}/users/${user.id}`}
                                                                method="delete"
                                                            >
                                                                {({ processing }) => (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="gap-1 border border-border/70 bg-muted/40 py-1 text-xs"
                                                                    >
                                                                        <StoreIcon className="size-3 text-muted-foreground" />
                                                                        {store.code} · {store.name}
                                                                        <button
                                                                            type="submit"
                                                                            disabled={processing}
                                                                            className="ml-1 rounded-full px-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                                            aria-label={`Hapus ${user.name} dari ${store.name}`}
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </Badge>
                                                                )}
                                                            </Form>
                                                        ))
                                                    )}
                                                </div>

                                                {user.role === 'STORE_PIC' && (
                                                    <AssignmentForm
                                                        userId={user.id}
                                                        stores={stores}
                                                    />
                                                )}
                                            </div>

                                            <div className="mt-4 flex justify-end border-t border-border/40 pt-2.5">
                                                <EditDetails label="Edit data akun pengguna">
                                                    <Form
                                                        action={`/central/users/${user.id}`}
                                                        method="put"
                                                        className="grid gap-2.5 p-1 sm:grid-cols-2"
                                                    >
                                                        {({
                                                            errors,
                                                            processing,
                                                        }) => (
                                                            <>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Nama Lengkap *</Label>
                                                                    <Input
                                                                        name="name"
                                                                        defaultValue={user.name}
                                                                        required
                                                                        className="h-8 text-xs"
                                                                        aria-label="Nama pengguna"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Email *</Label>
                                                                    <Input
                                                                        name="email"
                                                                        type="email"
                                                                        defaultValue={user.email}
                                                                        required
                                                                        className="h-8 text-xs"
                                                                        aria-label="Email pengguna"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1 sm:col-span-2">
                                                                    <Label className="text-xs">Peran / Otoritas *</Label>
                                                                    <select
                                                                        name="role"
                                                                        defaultValue={user.role}
                                                                        className="form-select-custom h-8 w-full text-xs"
                                                                    >
                                                                        {roles.map((role) => (
                                                                            <option
                                                                                key={role.value}
                                                                                value={role.value}
                                                                            >
                                                                                {role.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Kata Sandi Baru (Opsional)</Label>
                                                                    <Input
                                                                        name="password"
                                                                        type="password"
                                                                        placeholder="Kosongkan jika tetap"
                                                                        className="h-8 text-xs"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Konfirmasi Sandi Baru</Label>
                                                                    <Input
                                                                        name="password_confirmation"
                                                                        type="password"
                                                                        placeholder="Ulangi sandi baru"
                                                                        className="h-8 text-xs"
                                                                    />
                                                                </div>

                                                                <input
                                                                    type="hidden"
                                                                    name="is_active"
                                                                    value="0"
                                                                />
                                                                <label className="flex items-center gap-2 pt-1 text-xs font-medium sm:col-span-2">
                                                                    <Checkbox
                                                                        name="is_active"
                                                                        value="1"
                                                                        defaultChecked={user.is_active}
                                                                    />{' '}
                                                                    Akun Aktif Bisa Login
                                                                </label>

                                                                <div className="pt-2 sm:col-span-2">
                                                                    <Button
                                                                        type="submit"
                                                                        size="sm"
                                                                        disabled={processing}
                                                                        className="w-full h-8 font-medium"
                                                                    >
                                                                        Simpan Perubahan
                                                                    </Button>
                                                                </div>

                                                                <div className="sm:col-span-2">
                                                                    <InputError
                                                                        message={
                                                                            errors.name ||
                                                                            errors.email ||
                                                                            errors.role ||
                                                                            errors.password ||
                                                                            errors.is_active
                                                                        }
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </Form>
                                                </EditDetails>
                                            </div>
                                        </article>
                                    ))}
                                    <div className="pt-2">
                                        <PaginationLinks links={users.links} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: New User Form */}
                    <Card className="h-fit border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 pb-3.5">
                            <div className="flex items-center gap-2">
                                <UserPlus className="size-4 text-primary" />
                                <CardTitle className="text-sm font-semibold">
                                    Tambah Pengguna Baru
                                </CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            <Form
                                action="/central/users"
                                method="post"
                                className="space-y-3.5"
                                resetOnSuccess
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="space-y-1">
                                            <Label htmlFor="user-name" className="text-xs font-semibold">
                                                Nama Lengkap Staf *
                                            </Label>
                                            <Input
                                                id="user-name"
                                                name="name"
                                                className="h-9"
                                                placeholder="Contoh: Ni Putu Ayu"
                                                required
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="user-email" className="text-xs font-semibold">
                                                Alamat Email Login *
                                            </Label>
                                            <Input
                                                id="user-email"
                                                name="email"
                                                type="email"
                                                className="h-9"
                                                placeholder="nama@tulolajewelry.com"
                                                required
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="role" className="text-xs font-semibold">
                                                Peran & Tanggung Jawab *
                                            </Label>
                                            <select
                                                id="role"
                                                name="role"
                                                className="form-select-custom h-9 w-full"
                                                required
                                            >
                                                {roles.map((role) => (
                                                    <option
                                                        key={role.value}
                                                        value={role.value}
                                                    >
                                                        {role.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.role} />
                                        </div>

                                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2">
                                            <div className="font-semibold text-primary flex items-center gap-1.5">
                                                <ShieldCheck className="size-3.5" />
                                                Metode Undangan Akun
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed">
                                                Secara default, staf akan dikirimkan email undangan berisi tautan khusus untuk membuat kata sandi mereka sendiri.
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="password" className="text-xs font-semibold">
                                                Kata Sandi Manual (Opsional)
                                            </Label>
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                className="h-9"
                                                placeholder="Kosongkan untuk kirim link email"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="password_confirmation" className="text-xs font-semibold">
                                                Konfirmasi Sandi Manual
                                            </Label>
                                            <Input
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                type="password"
                                                className="h-9"
                                                placeholder="Ulangi jika mengisi sandi"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 pt-1 text-xs font-medium">
                                            <input
                                                type="hidden"
                                                name="is_active"
                                                value="0"
                                            />
                                            <Checkbox
                                                name="is_active"
                                                value="1"
                                                defaultChecked
                                            />{' '}
                                            Akun Langsung Aktif
                                        </label>

                                        <Button
                                            className="w-full font-medium"
                                            disabled={processing}
                                        >
                                            Simpan & Kirim Undangan Email
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}

function AssignmentForm({
    userId,
    stores,
}: {
    userId: number;
    stores: Store[];
}) {
    const [storeId, setStoreId] = useState('');

    return (
        <Form
            action={storeId ? `/central/stores/${storeId}/users` : '#'}
            method="post"
            className="mt-2.5 flex flex-col gap-2 sm:flex-row"
        >
            {({ processing }) => (
                <>
                    <select
                        className="form-select-custom h-8 flex-1 text-xs"
                        value={storeId}
                        onChange={(event) => setStoreId(event.target.value)}
                        required
                    >
                        <option value="" disabled>
                            -- Pilih Toko untuk Ditugaskan --
                        </option>
                        {stores.map((store) => (
                            <option key={store.id} value={store.id}>
                                {store.code} — {store.name}
                            </option>
                        ))}
                    </select>
                    <input type="hidden" name="user_id" value={userId} />
                    <input type="hidden" name="is_pic" value="1" />
                    <Button
                        disabled={processing || !storeId}
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium"
                    >
                        Tugaskan Toko
                    </Button>
                </>
            )}
        </Form>
    );
}

UserIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Pengguna', href: '/central/users' },
    ],
};
