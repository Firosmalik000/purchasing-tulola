import { Form, Head } from '@inertiajs/react';
import {
    Building,
    CreditCard,
    Mail,
    Phone,
    Plus,
    Search,
    Truck,
    User,
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

type Supplier = {
    id: number;
    code: string;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    payment_term: string | null;
    address: string | null;
    is_active: boolean;
};
type Props = {
    suppliers: { data: Supplier[]; links: PaginationLink[] };
    filters: { search: string };
};

export default function SupplierIndex({ suppliers, filters }: Props) {
    return (
        <>
            <Head title="Master Supplier & Mitra Pengrajin" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Data Master Rekanan"
                    title="Master Supplier & Pengrajin"
                    description="Kelola direktori mitra pemasok bahan mentah (perak/emas), pengrajin perhiasan Bali/Jawa, dan vendor packaging Tulola."
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                    {/* Left: Suppliers List */}
                    <Card className="border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Truck className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">
                                            Daftar Mitra Rekanan
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            {suppliers.data.length} rekanan terdaftar di sistem
                                        </p>
                                    </div>
                                </div>

                                <Form action="/central/suppliers" method="get">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            name="search"
                                            defaultValue={filters.search}
                                            placeholder="Cari kode atau nama rekanan..."
                                            className="h-9 w-full pl-9 sm:w-64"
                                        />
                                    </div>
                                </Form>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            {suppliers.data.length === 0 ? (
                                <EmptyState
                                    icon={Truck}
                                    title="Belum ada mitra rekanan terdaftar"
                                    description="Tambahkan profil supplier baru melalui formulir di samping untuk mulai menerbitkan Purchase Order."
                                />
                            ) : (
                                <div className="space-y-3.5">
                                    {suppliers.data.map((supplier) => (
                                        <article
                                            key={supplier.id}
                                            className="rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/40 pb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-foreground">
                                                            {supplier.name}
                                                        </p>
                                                        <span className="font-mono text-xs font-semibold text-primary">
                                                            [{supplier.code}]
                                                        </span>
                                                    </div>
                                                    {supplier.address && (
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {supplier.address}
                                                        </p>
                                                    )}
                                                </div>

                                                <Badge
                                                    variant={
                                                        supplier.is_active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="text-[10px]"
                                                >
                                                    {supplier.is_active
                                                        ? 'Aktif Bekerjasama'
                                                        : 'Nonaktif'}
                                                </Badge>
                                            </div>

                                            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="size-3.5 text-muted-foreground" />
                                                    <span className="truncate">
                                                        {supplier.contact_person || 'Tanpa PIC kontak'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="size-3.5 text-muted-foreground" />
                                                    <span className="truncate">
                                                        {supplier.phone || supplier.email || 'Tanpa telepon/email'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <CreditCard className="size-3.5 text-muted-foreground" />
                                                    <span className="truncate font-medium text-foreground">
                                                        TOP: {supplier.payment_term || 'Net 30'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex justify-end border-t border-border/40 pt-2">
                                                <EditDetails label="Edit data supplier">
                                                    <Form
                                                        action={`/central/suppliers/${supplier.id}`}
                                                        method="put"
                                                        className="grid gap-2.5 p-1 sm:grid-cols-2"
                                                    >
                                                        {({
                                                            processing,
                                                            errors,
                                                        }) => (
                                                            <>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Kode Rekanan *</Label>
                                                                    <Input
                                                                        name="code"
                                                                        defaultValue={supplier.code}
                                                                        required
                                                                        className="h-8 text-xs font-mono"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Nama Perusahaan / Pengrajin *</Label>
                                                                    <Input
                                                                        name="name"
                                                                        defaultValue={supplier.name}
                                                                        required
                                                                        className="h-8 text-xs"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Contact Person</Label>
                                                                    <Input
                                                                        name="contact_person"
                                                                        defaultValue={supplier.contact_person ?? ''}
                                                                        placeholder="Nama PIC"
                                                                        className="h-8 text-xs"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Telepon / WhatsApp</Label>
                                                                    <Input
                                                                        name="phone"
                                                                        defaultValue={supplier.phone ?? ''}
                                                                        placeholder="0812..."
                                                                        className="h-8 text-xs"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Email</Label>
                                                                    <Input
                                                                        name="email"
                                                                        type="email"
                                                                        defaultValue={supplier.email ?? ''}
                                                                        placeholder="email@vendor.com"
                                                                        className="h-8 text-xs"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Termin Pembayaran (TOP)</Label>
                                                                    <Input
                                                                        name="payment_term"
                                                                        defaultValue={supplier.payment_term ?? ''}
                                                                        placeholder="Contoh: Net 30 hari"
                                                                        className="h-8 text-xs"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1 sm:col-span-2">
                                                                    <Label className="text-xs">Alamat Kantor / Workshop</Label>
                                                                    <Input
                                                                        name="address"
                                                                        defaultValue={supplier.address ?? ''}
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
                                                                        defaultChecked={supplier.is_active}
                                                                    />{' '}
                                                                    Mitra Aktif Bekerjasama
                                                                </label>
                                                                <div className="pt-2 sm:col-span-2">
                                                                    <Button
                                                                        size="sm"
                                                                        className="w-full h-8 font-medium"
                                                                        disabled={processing}
                                                                    >
                                                                        Simpan Perubahan
                                                                    </Button>
                                                                </div>
                                                                <InputError
                                                                    message={
                                                                        errors.code ||
                                                                        errors.name ||
                                                                        errors.email
                                                                    }
                                                                />
                                                            </>
                                                        )}
                                                    </Form>
                                                </EditDetails>
                                            </div>
                                        </article>
                                    ))}
                                    <div className="pt-2">
                                        <PaginationLinks links={suppliers.links} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: New Supplier Form */}
                    <Card className="h-fit border-border/70 shadow-xs">
                        <CardHeader className="border-b border-border/50 pb-3.5">
                            <div className="flex items-center gap-2">
                                <Plus className="size-4 text-primary" />
                                <CardTitle className="text-sm font-semibold">
                                    Tambah Mitra Rekanan Baru
                                </CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            <Form
                                action="/central/suppliers"
                                method="post"
                                className="space-y-3.5"
                                resetOnSuccess
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <SupplierField
                                            name="code"
                                            label="Kode Rekanan *"
                                            placeholder="Contoh: SUP-BALI-01"
                                            error={errors.code}
                                            required
                                        />
                                        <SupplierField
                                            name="name"
                                            label="Nama Perusahaan / Pengrajin *"
                                            placeholder="Contoh: CV Perak Celuk Mandiri"
                                            error={errors.name}
                                            required
                                        />
                                        <SupplierField
                                            name="contact_person"
                                            label="Nama PIC / Kontak Person"
                                            placeholder="Nama penanggung jawab"
                                            error={errors.contact_person}
                                        />
                                        <SupplierField
                                            name="phone"
                                            label="Nomor Telepon / WA"
                                            placeholder="081..."
                                            error={errors.phone}
                                        />
                                        <SupplierField
                                            name="email"
                                            label="Alamat Email Resmi"
                                            placeholder="kontak@mitra.com"
                                            error={errors.email}
                                            type="email"
                                        />
                                        <SupplierField
                                            name="payment_term"
                                            label="Termin Pembayaran (TOP)"
                                            placeholder="Contoh: Net 14 hari"
                                            error={errors.payment_term}
                                        />

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
                                            Langsung Aktif Digunakan
                                        </label>

                                        <Button
                                            className="w-full font-medium"
                                            disabled={processing}
                                        >
                                            Simpan Rekanan Baru
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

function SupplierField({
    name,
    label,
    placeholder = '',
    error,
    required = false,
    type = 'text',
}: {
    name: string;
    label: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
    type?: string;
}) {
    return (
        <div className="space-y-1">
            <Label htmlFor={name} className="text-xs font-semibold">
                {label}
            </Label>
            <Input
                id={name}
                name={name}
                placeholder={placeholder}
                required={required}
                type={type}
                className="h-9"
            />
            <InputError message={error} />
        </div>
    );
}

SupplierIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Supplier', href: '/central/suppliers' },
    ],
};
