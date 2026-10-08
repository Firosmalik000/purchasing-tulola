import { Form, Head } from '@inertiajs/react';
import { Building2, MapPin, Plus, Search, Users } from 'lucide-react';
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

type Store = {
    id: number;
    code: string;
    name: string;
    address: string | null;
    is_active: boolean;
    users_count: number;
};

type Props = {
    stores: { data: Store[]; links: PaginationLink[] };
    filters: { search: string };
};

export default function StoreIndex({ stores, filters }: Props) {
    return (
        <>
            <Head title="Master Butik & Toko Cabang" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Data Master Lokasi"
                    title="Master Butik & Toko Cabang"
                    description="Kelola jaringan gerai butik Tulola Jewelry (kantor pusat, flagship store, butik mall, dan pop-up boutique)."
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    {/* Left: Stores Table */}
                    <Card className="min-w-0 border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Building2 className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">
                                            Daftar Butik Tulola
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            {stores.data.length} cabang lokasi terdaftar
                                        </p>
                                    </div>
                                </div>

                                <Form action="/central/stores" method="get">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            name="search"
                                            defaultValue={filters.search}
                                            placeholder="Cari kode atau nama butik..."
                                            aria-label="Cari toko"
                                            className="h-9 w-full pl-9 sm:w-64"
                                        />
                                    </div>
                                </Form>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {stores.data.length === 0 ? (
                                <div className="p-8">
                                    <EmptyState
                                        icon={Building2}
                                        title="Belum ada butik terdaftar"
                                        description="Buat profil butik pertama menggunakan formulir pendaftaran di sisi kanan."
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-5 py-3.5">Kode Butik</th>
                                                    <th className="px-5 py-3.5">Nama & Alamat Butik</th>
                                                    <th className="px-4 py-3.5 text-center">PIC Terdaftar</th>
                                                    <th className="px-5 py-3.5 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {stores.data.map((store) => (
                                                    <tr
                                                        key={store.id}
                                                        className="transition-colors hover:bg-muted/20"
                                                    >
                                                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-primary">
                                                            {store.code}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                                <div>
                                                                    <p className="font-semibold text-foreground">
                                                                        {store.name}
                                                                    </p>
                                                                    <p className="max-w-md truncate text-xs text-muted-foreground">
                                                                        {store.address || 'Alamat fisik belum diatur'}
                                                                    </p>
                                                                </div>

                                                                <EditDetails label="Edit data butik">
                                                                    <Form
                                                                        action={`/central/stores/${store.id}`}
                                                                        method="put"
                                                                        className="grid gap-2.5 p-1 sm:grid-cols-2"
                                                                    >
                                                                        {({
                                                                            errors,
                                                                            processing,
                                                                        }) => (
                                                                            <>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">Kode Butik *</Label>
                                                                                    <Input
                                                                                        name="code"
                                                                                        defaultValue={store.code}
                                                                                        required
                                                                                        className="h-8 font-mono text-xs"
                                                                                        aria-label="Kode toko"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">Nama Butik *</Label>
                                                                                    <Input
                                                                                        name="name"
                                                                                        defaultValue={store.name}
                                                                                        required
                                                                                        className="h-8 text-xs"
                                                                                        aria-label="Nama toko"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1 sm:col-span-2">
                                                                                    <Label className="text-xs">Alamat Lokasi</Label>
                                                                                    <Input
                                                                                        name="address"
                                                                                        defaultValue={store.address ?? ''}
                                                                                        placeholder="Alamat lengkap"
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
                                                                                        defaultChecked={store.is_active}
                                                                                    />{' '}
                                                                                    Butik Aktif Beroperasi
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
                                                                                            errors.code ||
                                                                                            errors.name ||
                                                                                            errors.address ||
                                                                                            errors.is_active
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </Form>
                                                                </EditDetails>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center font-mono text-xs font-medium text-foreground tabular-nums">
                                                            {store.users_count} PIC
                                                        </td>
                                                        <td className="px-5 py-3.5 text-center">
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
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 border-t border-border/50">
                                        <PaginationLinks links={stores.links} />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: New Store Form */}
                    <Card className="h-fit border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 pb-3.5">
                            <div className="flex items-center gap-2">
                                <Plus className="size-4 text-primary" />
                                <CardTitle className="text-sm font-semibold">
                                    Tambah Lokasi Butik Baru
                                </CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            <Form
                                action="/central/stores"
                                method="post"
                                className="space-y-3.5"
                                resetOnSuccess
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="space-y-1">
                                            <Label htmlFor="code" className="text-xs font-semibold">
                                                Kode Butik *
                                            </Label>
                                            <Input
                                                id="code"
                                                name="code"
                                                required
                                                maxLength={24}
                                                className="h-9 font-mono"
                                                placeholder="Contoh: PP, PLAZA-ID, UBUD"
                                            />
                                            <InputError message={errors.code} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="name" className="text-xs font-semibold">
                                                Nama Lengkap Butik *
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                required
                                                className="h-9"
                                                placeholder="Contoh: Pacific Place Boutique"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="address" className="text-xs font-semibold">
                                                Alamat / Lokasi Mall
                                            </Label>
                                            <Input
                                                id="address"
                                                name="address"
                                                className="h-9"
                                                placeholder="Lantai 1, Unit 12..."
                                            />
                                            <InputError
                                                message={errors.address}
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
                                            Langsung Aktif Beroperasi
                                        </label>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full font-medium"
                                        >
                                            Simpan Butik Baru
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

StoreIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Toko', href: '/central/stores' },
    ],
};
