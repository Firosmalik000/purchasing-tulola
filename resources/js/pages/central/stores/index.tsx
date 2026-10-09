import { Form, Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    ClipboardList,
    Eye,
    Mail,
    MapPin,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Store,
    UserMinus,
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
import { RequestStatusBadge } from '@/components/common/request-status-badge';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { formatQuantity } from '@/lib/utils';
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

type StoreUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    invitation_token?: string | null;
    pivot?: {
        is_pic: boolean;
        is_active: boolean;
    };
};

type StoreRequestItem = {
    id: number;
    name: string;
    requested_quantity: string | number;
};

type StorePurchaseRequest = {
    id: number;
    number: string;
    status: string;
    required_date?: string | null;
    created_at: string;
    requester?: {
        id: number;
        name: string;
        email: string;
    } | null;
    items_count?: number;
    items?: StoreRequestItem[];
};

type StoreItem = {
    id: number;
    code: string;
    name: string;
    address?: string | null;
    is_active: boolean;
    users_count: number;
    users?: StoreUser[];
    purchase_requests_count?: number;
    purchase_requests?: StorePurchaseRequest[];
};

type Props = {
    stores: {
        data: StoreItem[];
        links: PaginationLink[];
        current_page?: number;
        per_page?: number;
    };
    filters: { search: string };
    availableUsers?: {
        id: number;
        name: string;
        email: string;
        role: string;
        is_active: boolean;
    }[];
};

export default function StoreIndex({
    stores,
    filters,
    availableUsers = [],
}: Props) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<StoreItem | null>(null);
    const [detailStore, setDetailStore] = useState<StoreItem | null>(null);
    const [assignTab, setAssignTab] = useState<'existing' | 'invite'>(
        'existing',
    );
    const [detailTab, setDetailTab] = useState<'pic' | 'requests'>('pic');
    const [requestStatusFilter, setRequestStatusFilter] =
        useState<string>('ALL');

    const currentPage = stores.current_page || 1;
    const perPage = stores.per_page || 15;

    return (
        <>
            <Head title="Manajemen Toko Cabang — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Master"
                    title="Toko Cabang"
                    actions={
                        <Dialog
                            open={createDialogOpen}
                            onOpenChange={setCreateDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    className="h-8 text-xs shadow-xs"
                                >
                                    <Plus className="mr-1.5 size-3.5" />
                                    Tambah Toko Cabang
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-base font-semibold">
                                        Tambah Toko Cabang Baru
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
                                                <Label className="text-xs font-medium">
                                                    Kode Toko Cabang *
                                                </Label>
                                                <Input
                                                    name="code"
                                                    placeholder="TLL-JAX"
                                                    required
                                                    className="h-8.5 font-mono text-xs uppercase"
                                                />
                                                <InputError
                                                    message={errors.code}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">
                                                    Nama Toko Cabang *
                                                </Label>
                                                <Input
                                                    name="name"
                                                    placeholder="Tulola Pacific Place"
                                                    required
                                                    className="h-8.5 text-xs"
                                                />
                                                <InputError
                                                    message={errors.name}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">
                                                    Alamat Fisik
                                                </Label>
                                                <textarea
                                                    name="address"
                                                    rows={2}
                                                    placeholder="Alamat lengkap toko cabang..."
                                                    className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-2xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                                />
                                                <InputError
                                                    message={errors.address}
                                                />
                                            </div>

                                            <div className="space-y-1.5 rounded-lg border border-border/80 bg-muted/20 p-2.5">
                                                <Label
                                                    htmlFor="create-store-pic"
                                                    className="flex items-center gap-1.5 text-xs font-medium text-foreground"
                                                >
                                                    <UserPlus className="size-3.5 text-primary" />
                                                    Penugasan PIC Utama
                                                    (Opsional)
                                                </Label>
                                                <select
                                                    id="create-store-pic"
                                                    name="pic_user_id"
                                                    className="form-select-custom h-8.5 w-full text-xs"
                                                    defaultValue=""
                                                >
                                                    <option value="">
                                                        -- Pilih PIC atau Staf
                                                        --
                                                    </option>
                                                    {availableUsers.map((u) => (
                                                        <option
                                                            key={u.id}
                                                            value={u.id}
                                                        >
                                                            {u.name} ({u.email})
                                                            — [{u.role}]
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="hidden"
                                                    name="is_pic"
                                                    value="1"
                                                />
                                                <p className="text-[10px] text-muted-foreground">
                                                    Pengguna terpilih akan
                                                    langsung ditugaskan sebagai
                                                    PIC utama toko cabang ini.
                                                </p>
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
                                                    Toko Langsung Beroperasi
                                                </span>
                                            </label>

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
                                                    Simpan Toko Cabang
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <Store className="size-4 text-primary" />
                                <CardTitle className="text-sm font-semibold">
                                    Daftar Toko Cabang ({stores.data.length})
                                </CardTitle>
                            </div>

                            <Form action="/central/stores" method="get">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        name="search"
                                        defaultValue={filters.search}
                                        placeholder="Cari kode atau nama toko cabang..."
                                        aria-label="Cari toko"
                                        className="h-8 w-full pl-8 text-xs sm:w-64"
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
                                    title="Belum ada toko cabang terdaftar"
                                    description="Gunakan tombol Tambah Toko Cabang untuk mendaftarkan toko baru."
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-border/60 bg-muted/30 font-medium text-muted-foreground">
                                            <th className="w-12 px-3 py-2.5 text-center">
                                                #
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Kode Toko Cabang
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Nama & Alamat Toko Cabang
                                            </th>
                                            <th className="px-3 py-2.5 text-center">
                                                PIC Terdaftar
                                            </th>
                                            <th className="px-3 py-2.5 text-center">
                                                Status
                                            </th>
                                            <th className="w-32 px-3 py-2.5 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {stores.data.map((store, idx) => (
                                            <tr
                                                key={store.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-3 py-2.5 text-center font-mono text-[11px] text-muted-foreground">
                                                    {(currentPage - 1) *
                                                        perPage +
                                                        idx +
                                                        1}
                                                </td>
                                                <td className="px-3 py-2.5 font-mono text-[11px] font-semibold text-primary">
                                                    {store.code}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="font-semibold text-foreground">
                                                        {store.name}
                                                    </span>
                                                    {store.address && (
                                                        <p className="mt-0.5 max-w-md truncate text-[11px] text-muted-foreground">
                                                            {store.address}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDetailStore(
                                                                store,
                                                            )
                                                        }
                                                        className="group inline-flex cursor-pointer items-center gap-1 font-semibold text-foreground transition-colors hover:text-primary"
                                                        title="Klik untuk melihat & atur PIC toko cabang"
                                                    >
                                                        <Users className="size-3 text-muted-foreground group-hover:text-primary" />
                                                        <span className="underline decoration-dotted underline-offset-2">
                                                            {store.users_count}{' '}
                                                            PIC
                                                        </span>
                                                    </button>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <Badge
                                                        variant={
                                                            store.is_active
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                        className="text-[10px]"
                                                    >
                                                        {store.is_active
                                                            ? 'Aktif'
                                                            : 'Nonaktif'}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setDetailStore(
                                                                    store,
                                                                );
                                                                setDetailTab(
                                                                    'pic',
                                                                );
                                                                setAssignTab(
                                                                    'existing',
                                                                );
                                                            }}
                                                            className="h-7 border-primary/30 px-2 text-[11px] font-medium text-primary hover:bg-primary/10 hover:text-primary"
                                                            title="Tugaskan PIC untuk toko cabang ini"
                                                        >
                                                            <UserPlus className="mr-1 size-3" />
                                                            <span>
                                                                Tugaskan PIC
                                                            </span>
                                                        </Button>

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
                                                                        Lainnya
                                                                    </span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-44 text-xs"
                                                            >
                                                                <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                                                                    Pilihan
                                                                </DropdownMenuLabel>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setDetailStore(
                                                                            store,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer font-medium text-primary"
                                                                >
                                                                    <Eye className="mr-2 size-3.5" />
                                                                    Detail Toko
                                                                    Cabang & PIC
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setDetailStore(
                                                                            store,
                                                                        );
                                                                        setAssignTab(
                                                                            'existing',
                                                                        );
                                                                    }}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <UserPlus className="mr-2 size-3.5" />
                                                                    Tugaskan PIC
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setEditingStore(
                                                                            store,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Pencil className="mr-2 size-3.5" />
                                                                    Edit Toko
                                                                    Cabang
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="border-t border-border/40 p-3">
                            <PaginationLinks pagination={stores} />
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Store Dialog */}
                {editingStore && (
                    <Dialog
                        open={!!editingStore}
                        onOpenChange={(open) => !open && setEditingStore(null)}
                    >
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-base font-semibold">
                                    Edit Toko Cabang: {editingStore.name}
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
                                            <Label className="text-xs font-medium">
                                                Kode Toko Cabang *
                                            </Label>
                                            <Input
                                                name="code"
                                                defaultValue={editingStore.code}
                                                required
                                                className="h-8.5 font-mono text-xs uppercase"
                                            />
                                            <InputError message={errors.code} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">
                                                Nama Toko Cabang *
                                            </Label>
                                            <Input
                                                name="name"
                                                defaultValue={editingStore.name}
                                                required
                                                className="h-8.5 text-xs"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">
                                                Alamat Fisik
                                            </Label>
                                            <textarea
                                                name="address"
                                                rows={2}
                                                defaultValue={
                                                    editingStore.address ?? ''
                                                }
                                                className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-2xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                            />
                                            <InputError
                                                message={errors.address}
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
                                                    editingStore.is_active
                                                }
                                            />
                                            <span>
                                                Toko Cabang Aktif Beroperasi
                                            </span>
                                        </label>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() =>
                                                    setEditingStore(null)
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
                                                Simpan Perubahan
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Store Detail & PIC Management Dialog */}
                {detailStore &&
                    (() => {
                        const activeDetailStore =
                            stores.data.find((s) => s.id === detailStore.id) ||
                            detailStore;
                        const assignedUserIds = new Set(
                            (activeDetailStore.users || []).map((u) => u.id),
                        );
                        const unassignedUsers = (availableUsers || []).filter(
                            (u) => !assignedUserIds.has(u.id),
                        );

                        return (
                            <Dialog
                                open={!!detailStore}
                                onOpenChange={(open) =>
                                    !open && setDetailStore(null)
                                }
                            >
                                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                                    <DialogHeader>
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                    <Store className="size-4.5" />
                                                </div>
                                                <div>
                                                    <DialogTitle className="text-base font-semibold">
                                                        {activeDetailStore.name}
                                                    </DialogTitle>
                                                    <DialogDescription className="text-xs">
                                                        Kode:{' '}
                                                        <span className="font-mono font-semibold text-primary">
                                                            [
                                                            {
                                                                activeDetailStore.code
                                                            }
                                                            ]
                                                        </span>
                                                    </DialogDescription>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={
                                                    activeDetailStore.is_active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className="w-fit text-[10px]"
                                            >
                                                {activeDetailStore.is_active
                                                    ? 'Toko Cabang Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </div>
                                    </DialogHeader>

                                    {activeDetailStore.address && (
                                        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs text-muted-foreground">
                                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                                            <span>
                                                {activeDetailStore.address}
                                            </span>
                                        </div>
                                    )}

                                    {/* Tab Navigation: PIC & Staf vs Riwayat Permintaan (PR) */}
                                    <div className="flex overflow-x-auto whitespace-nowrap border-b border-border/80 text-xs scrollbar-none">
                                        <button
                                            type="button"
                                            onClick={() => setDetailTab('pic')}
                                            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition-all ${
                                                detailTab === 'pic'
                                                    ? 'border-primary font-semibold text-primary'
                                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <Users className="size-4" />
                                            <span>PIC & Staf Toko Cabang</span>
                                            <Badge
                                                variant="secondary"
                                                className="ml-1 h-4 px-1.5 py-0 text-[10px]"
                                            >
                                                {activeDetailStore.users
                                                    ?.length || 0}
                                            </Badge>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDetailTab('requests')
                                            }
                                            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition-all ${
                                                detailTab === 'requests'
                                                    ? 'border-primary font-semibold text-primary'
                                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <ClipboardList className="size-4" />
                                            <span>Riwayat Permintaan (PR)</span>
                                            <Badge
                                                variant="secondary"
                                                className="ml-1 h-4 bg-primary/10 px-1.5 py-0 text-[10px] font-semibold text-primary"
                                            >
                                                {activeDetailStore
                                                    .purchase_requests
                                                    ?.length ??
                                                    (activeDetailStore as any)
                                                        .purchaseRequests
                                                        ?.length ??
                                                    activeDetailStore.purchase_requests_count ??
                                                    0}
                                            </Badge>
                                        </button>
                                    </div>

                                    {detailTab === 'pic' ? (
                                        /* PIC Section */
                                        <div className="space-y-4 pt-1">
                                            <div className="flex items-center justify-between pb-1">
                                                <div className="flex items-center gap-2">
                                                    <Users className="size-4 text-primary" />
                                                    <h4 className="text-xs font-semibold tracking-wider text-foreground uppercase">
                                                        Daftar PIC & Staf
                                                        Bertugas (
                                                        {activeDetailStore.users
                                                            ?.length || 0}
                                                        )
                                                    </h4>
                                                </div>
                                            </div>

                                            {/* List of Assigned PICs */}
                                            {!activeDetailStore.users ||
                                            activeDetailStore.users.length ===
                                                0 ? (
                                                <div className="rounded-lg border border-dashed border-border/80 p-5 text-center text-xs text-muted-foreground">
                                                    Belum ada staf atau PIC yang
                                                    ditugaskan di toko cabang
                                                    ini. Gunakan formulir di
                                                    bawah untuk menugaskan.
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-border/40 overflow-hidden rounded-lg border border-border/70 bg-card">
                                                    {activeDetailStore.users.map(
                                                        (user) => (
                                                            <div
                                                                key={user.id}
                                                                className="flex items-center justify-between p-2.5 transition-colors hover:bg-muted/20"
                                                            >
                                                                <div className="flex min-w-0 items-center gap-2.5">
                                                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                                        {user.name
                                                                            .charAt(
                                                                                0,
                                                                            )
                                                                            .toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="truncate text-xs font-semibold text-foreground">
                                                                                {
                                                                                    user.name
                                                                                }
                                                                            </span>
                                                                            {user
                                                                                .pivot
                                                                                ?.is_pic ? (
                                                                                <Badge
                                                                                    variant="default"
                                                                                    className="h-4 px-1.5 py-0 text-[9px]"
                                                                                >
                                                                                    PIC
                                                                                    Utama
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="h-4 px-1.5 py-0 text-[9px]"
                                                                                >
                                                                                    Staf
                                                                                    Toko
                                                                                    Cabang
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <p className="truncate text-[11px] text-muted-foreground">
                                                                            {
                                                                                user.email
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex shrink-0 items-center gap-2">
                                                                    {user.invitation_token ? (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="h-4 border-blue-500/30 bg-blue-500/10 px-1.5 py-0 text-[9px] font-normal text-blue-700 dark:text-blue-300"
                                                                        >
                                                                            Menunggu
                                                                            Aktivasi
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="h-4 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[9px] font-normal text-emerald-700 dark:text-emerald-300"
                                                                        >
                                                                            Aktif
                                                                        </Badge>
                                                                    )}

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                                        title="Lepas Penugasan PIC dari Toko Cabang"
                                                                        onClick={() => {
                                                                            if (
                                                                                confirm(
                                                                                    `Lepas penugasan ${user.name} dari ${activeDetailStore.name}?`,
                                                                                )
                                                                            ) {
                                                                                router.delete(
                                                                                    `/central/stores/${activeDetailStore.id}/users/${user.id}`,
                                                                                    {
                                                                                        preserveScroll: true,
                                                                                    },
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <UserMinus className="size-3.5" />
                                                                        <span className="sr-only">
                                                                            Lepas
                                                                            Penugasan
                                                                        </span>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}

                                            {/* Assignment Form Section */}
                                            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-3.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        Tambah Penugasan PIC
                                                    </span>
                                                    <div className="flex rounded-md border border-border bg-card p-0.5 text-[11px]">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setAssignTab(
                                                                    'existing',
                                                                )
                                                            }
                                                            className={`rounded px-2.5 py-0.5 font-medium transition-colors ${
                                                                assignTab ===
                                                                'existing'
                                                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                                                    : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        >
                                                            Staf Terdaftar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setAssignTab(
                                                                    'invite',
                                                                )
                                                            }
                                                            className={`rounded px-2.5 py-0.5 font-medium transition-colors ${
                                                                assignTab ===
                                                                'invite'
                                                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                                                    : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        >
                                                            Undang PIC Baru
                                                        </button>
                                                    </div>
                                                </div>

                                                {assignTab === 'existing' ? (
                                                    <Form
                                                        action={`/central/stores/${activeDetailStore.id}/users`}
                                                        method="post"
                                                        className="space-y-3"
                                                    >
                                                        {({ processing }) => (
                                                            <>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-medium">
                                                                        Pilih
                                                                        Pengguna
                                                                        *
                                                                    </Label>
                                                                    <select
                                                                        name="user_id"
                                                                        required
                                                                        className="form-select-custom h-8.5 w-full text-xs"
                                                                        defaultValue=""
                                                                    >
                                                                        <option value="">
                                                                            --
                                                                            Pilih
                                                                            staf
                                                                            atau
                                                                            PIC
                                                                            --
                                                                        </option>
                                                                        {unassignedUsers.map(
                                                                            (
                                                                                u,
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        u.id
                                                                                    }
                                                                                    value={
                                                                                        u.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        u.name
                                                                                    }{' '}
                                                                                    (
                                                                                    {
                                                                                        u.email
                                                                                    }
                                                                                    )
                                                                                    —
                                                                                    [
                                                                                    {
                                                                                        u.role
                                                                                    }
                                                                                    ]
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                    </select>
                                                                    {unassignedUsers.length ===
                                                                        0 && (
                                                                        <p className="text-[11px] text-muted-foreground italic">
                                                                            Semua
                                                                            staf
                                                                            yang
                                                                            ada
                                                                            sudah
                                                                            ditugaskan
                                                                            ke
                                                                            toko
                                                                            cabang
                                                                            ini.
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center justify-between pt-1">
                                                                    <label className="flex items-center gap-2 text-xs">
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
                                                                            Tetapkan
                                                                            sebagai
                                                                            PIC
                                                                            Utama
                                                                        </span>
                                                                    </label>

                                                                    <Button
                                                                        type="submit"
                                                                        size="sm"
                                                                        disabled={
                                                                            processing ||
                                                                            unassignedUsers.length ===
                                                                                0
                                                                        }
                                                                        className="h-8 text-xs font-medium"
                                                                    >
                                                                        <UserPlus className="mr-1.5 size-3.5" />
                                                                        Tugaskan
                                                                        Staf
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </Form>
                                                ) : (
                                                    <Form
                                                        action="/central/users"
                                                        method="post"
                                                        className="space-y-3"
                                                        resetOnSuccess
                                                    >
                                                        {({
                                                            errors,
                                                            processing,
                                                        }) => (
                                                            <>
                                                                <input
                                                                    type="hidden"
                                                                    name="send_invitation"
                                                                    value="1"
                                                                />
                                                                <input
                                                                    type="hidden"
                                                                    name="role"
                                                                    value="STORE_PIC"
                                                                />
                                                                <input
                                                                    type="hidden"
                                                                    name="store_id"
                                                                    value={
                                                                        activeDetailStore.id
                                                                    }
                                                                />
                                                                <input
                                                                    type="hidden"
                                                                    name="is_pic"
                                                                    value="1"
                                                                />

                                                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs font-medium">
                                                                            Nama
                                                                            Lengkap
                                                                            PIC
                                                                            *
                                                                        </Label>
                                                                        <Input
                                                                            name="name"
                                                                            required
                                                                            className="h-8.5 text-xs"
                                                                            placeholder="Nama PIC baru"
                                                                        />
                                                                        <InputError
                                                                            message={
                                                                                errors.name
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs font-medium">
                                                                            Alamat
                                                                            Email
                                                                            *
                                                                        </Label>
                                                                        <Input
                                                                            name="email"
                                                                            type="email"
                                                                            required
                                                                            className="h-8.5 text-xs"
                                                                            placeholder="pic@tulolajewelry.com"
                                                                        />
                                                                        <InputError
                                                                            message={
                                                                                errors.email
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5 text-xs text-muted-foreground">
                                                                    <Mail className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
                                                                    <span>
                                                                        Email
                                                                        undangan
                                                                        akan
                                                                        dikirim
                                                                        ke PIC
                                                                        untuk
                                                                        membuat
                                                                        password
                                                                        sendiri.
                                                                        PIC akan
                                                                        langsung
                                                                        bertugas
                                                                        di toko
                                                                        cabang{' '}
                                                                        <strong>
                                                                            {
                                                                                activeDetailStore.name
                                                                            }
                                                                        </strong>
                                                                        .
                                                                    </span>
                                                                </div>

                                                                <div className="flex justify-end pt-1">
                                                                    <Button
                                                                        type="submit"
                                                                        size="sm"
                                                                        disabled={
                                                                            processing
                                                                        }
                                                                        className="h-8 text-xs font-medium"
                                                                    >
                                                                        <Mail className="mr-1.5 size-3.5" />
                                                                        Undang &
                                                                        Jadikan
                                                                        PIC
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </Form>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Purchase Requests History Section */
                                        <div className="space-y-3.5 pt-1">
                                            {(() => {
                                                const allPRs: StorePurchaseRequest[] =
                                                    activeDetailStore.purchase_requests ||
                                                    (activeDetailStore as any)
                                                        .purchaseRequests ||
                                                    [];

                                                const statusCounts = {
                                                    ALL: allPRs.length,
                                                    SUBMITTED: allPRs.filter(
                                                        (r) =>
                                                            r.status ===
                                                            'SUBMITTED',
                                                    ).length,
                                                    PROCESSED: allPRs.filter(
                                                        (r) =>
                                                            r.status ===
                                                            'PROCESSED',
                                                    ).length,
                                                    REJECTED: allPRs.filter(
                                                        (r) =>
                                                            r.status ===
                                                            'REJECTED',
                                                    ).length,
                                                };

                                                const filteredPRs =
                                                    allPRs.filter((r) => {
                                                        if (
                                                            requestStatusFilter ===
                                                            'ALL'
                                                        )
                                                            return true;
                                                        return (
                                                            r.status ===
                                                            requestStatusFilter
                                                        );
                                                    });

                                                return (
                                                    <>
                                                        {/* Status Filter Chips */}
                                                        <div className="flex flex-wrap items-center gap-1.5 pb-1">
                                                            {[
                                                                {
                                                                    key: 'ALL',
                                                                    label: 'Semua Status',
                                                                    count: statusCounts.ALL,
                                                                },
                                                                {
                                                                    key: 'SUBMITTED',
                                                                    label: 'Menunggu Review',
                                                                    count: statusCounts.SUBMITTED,
                                                                },
                                                                {
                                                                    key: 'PROCESSED',
                                                                    label: 'Disetujui',
                                                                    count: statusCounts.PROCESSED,
                                                                },
                                                                {
                                                                    key: 'REJECTED',
                                                                    label: 'Ditolak',
                                                                    count: statusCounts.REJECTED,
                                                                },
                                                            ].map(
                                                                (filterTab) => (
                                                                    <button
                                                                        key={
                                                                            filterTab.key
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setRequestStatusFilter(
                                                                                filterTab.key,
                                                                            )
                                                                        }
                                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                                                            requestStatusFilter ===
                                                                            filterTab.key
                                                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                                                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                                                        }`}
                                                                    >
                                                                        <span>
                                                                            {
                                                                                filterTab.label
                                                                            }
                                                                        </span>
                                                                        <span
                                                                            className={`py-0.2 rounded-full px-1.5 text-[10px] ${
                                                                                requestStatusFilter ===
                                                                                filterTab.key
                                                                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                                                                    : 'bg-background text-muted-foreground'
                                                                            }`}
                                                                        >
                                                                            {
                                                                                filterTab.count
                                                                            }
                                                                        </span>
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>

                                                        {/* Requests List */}
                                                        {filteredPRs.length ===
                                                        0 ? (
                                                            <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
                                                                <ClipboardList className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                                                                <p className="font-medium text-foreground">
                                                                    {allPRs.length ===
                                                                    0
                                                                        ? 'Belum ada riwayat permintaan (PR) dari toko cabang ini.'
                                                                        : 'Tidak ada permintaan dengan status yang dipilih.'}
                                                                </p>
                                                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                                    Permintaan
                                                                    barang yang
                                                                    diajukan
                                                                    oleh PIC
                                                                    cabang ini
                                                                    akan
                                                                    tercatat di
                                                                    sini.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xs">
                                                                {filteredPRs.map(
                                                                    (req) => (
                                                                        <div
                                                                            key={
                                                                                req.id
                                                                            }
                                                                            className="flex flex-col gap-2 p-3 transition-colors hover:bg-muted/15 sm:flex-row sm:items-center sm:justify-between"
                                                                        >
                                                                            <div className="min-w-0 space-y-1">
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                    <Link
                                                                                        href={`/central/requests/${req.id}`}
                                                                                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-primary hover:underline"
                                                                                    >
                                                                                        {
                                                                                            req.number
                                                                                        }
                                                                                        <ArrowUpRight className="size-3" />
                                                                                    </Link>
                                                                                    <RequestStatusBadge
                                                                                        status={
                                                                                            req.status
                                                                                        }
                                                                                    />
                                                                                </div>

                                                                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                                                                    <span>
                                                                                        Oleh:{' '}
                                                                                        <strong className="text-foreground">
                                                                                            {req
                                                                                                .requester
                                                                                                ?.name ||
                                                                                                'PIC'}
                                                                                        </strong>
                                                                                    </span>
                                                                                    <span>
                                                                                        •
                                                                                    </span>
                                                                                    <span>
                                                                                        Diajukan:{' '}
                                                                                        {new Date(
                                                                                            req.created_at,
                                                                                        ).toLocaleDateString(
                                                                                            'id-ID',
                                                                                            {
                                                                                                day: '2-digit',
                                                                                                month: 'short',
                                                                                                year: 'numeric',
                                                                                            },
                                                                                        )}
                                                                                    </span>
                                                                                    {req.items_count !==
                                                                                        undefined && (
                                                                                        <>
                                                                                            <span>
                                                                                                •
                                                                                            </span>
                                                                                            <span>
                                                                                                {
                                                                                                    req.items_count
                                                                                                }{' '}
                                                                                                item
                                                                                                barang
                                                                                            </span>
                                                                                        </>
                                                                                    )}
                                                                                </div>

                                                                                {req.items &&
                                                                                    req
                                                                                        .items
                                                                                        .length >
                                                                                        0 && (
                                                                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                                                            {req.items
                                                                                                .slice(
                                                                                                    0,
                                                                                                    3,
                                                                                                )
                                                                                                .map(
                                                                                                    (
                                                                                                        item,
                                                                                                    ) => (
                                                                                                        <span
                                                                                                            key={
                                                                                                                item.id
                                                                                                            }
                                                                                                            className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                                                                                        >
                                                                                                            {
                                                                                                                item.name
                                                                                                            }{' '}
                                                                                                            (
                                                                                                            {
                                                                                                                formatQuantity(
                                                                                                                    item.requested_quantity,
                                                                                                                )
                                                                                                            }
                                                                                                            )
                                                                                                        </span>
                                                                                                    ),
                                                                                                )}
                                                                                            {req
                                                                                                .items
                                                                                                .length >
                                                                                                3 && (
                                                                                                <span className="text-[10px] text-muted-foreground italic">
                                                                                                    +
                                                                                                    {req
                                                                                                        .items
                                                                                                        .length -
                                                                                                        3}{' '}
                                                                                                    lainnya
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                            </div>

                                                                            <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                                                                                <Button
                                                                                    asChild
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="h-7 border-primary/20 text-xs text-primary hover:bg-primary/5 hover:text-primary"
                                                                                >
                                                                                    <Link
                                                                                        href={`/central/requests/${req.id}`}
                                                                                    >
                                                                                        Lihat
                                                                                        Detail
                                                                                        <ArrowRight className="ml-1 size-3" />
                                                                                    </Link>
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        );
                    })()}
            </main>
        </>
    );
}
