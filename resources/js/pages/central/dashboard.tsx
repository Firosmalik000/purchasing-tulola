import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Boxes,
    Building2,
    ChartNoAxesCombined,
    CheckCircle2,
    ClipboardList,
    ListChecks,
    PackageCheck,
    Plus,
    ShoppingCart,
    Warehouse,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CentralDashboard() {
    const pipelineCards = [
        {
            title: '1. Antrean Permintaan',
            desc: 'Review kuantitas yang diajukan oleh butik & periksa snapshot stok.',
            href: '/central/requests',
            icon: ClipboardList,
            badge: 'Langkah Pertama',
            actionText: 'Tinjau Permintaan',
            color: 'from-amber-500/10 to-transparent border-amber-500/30 text-amber-700 dark:text-amber-400',
        },
        {
            title: '2. Purchase Planning',
            desc: 'Agregasi approved request lintas toko menjadi pesanan grosir.',
            href: '/central/purchase-planning',
            icon: ListChecks,
            badge: 'Konsolidasi',
            actionText: 'Buka Planning',
            color: 'from-indigo-500/10 to-transparent border-indigo-500/30 text-indigo-700 dark:text-indigo-400',
        },
        {
            title: '3. Pesanan ke Vendor (PO)',
            desc: 'Terbitkan Purchase Order, tetapkan termin pembayaran & tanggal tiba.',
            href: '/central/orders',
            icon: ShoppingCart,
            badge: 'Pengadaan',
            actionText: 'Kelola Pesanan',
            color: 'from-purple-500/10 to-transparent border-purple-500/30 text-purple-700 dark:text-purple-400',
        },
        {
            title: '4. Penerimaan & Stok',
            desc: 'Pantau konfirmasi penerimaan fisik dan pemutakhiran stok otomatis.',
            href: '/central/inventory',
            icon: Warehouse,
            badge: 'Logistik',
            actionText: 'Lihat Stok Cabang',
            color: 'from-emerald-500/10 to-transparent border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
        },
    ];

    return (
        <>
            <Head title="Dashboard Pusat — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    badge="Portal Kantor Pusat"
                    title="Dashboard Operasional Purchasing"
                    description="Pusat kendali pengadaan Tulola: tinjau permintaan butik, rencanakan pesanan grosir, dan pantau pemenuhan stok."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button asChild className="shadow-xs">
                                <Link href="/central/requests">
                                    <ClipboardList className="mr-2 size-4" />
                                    Tinjau Permintaan
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/central/purchase-planning">
                                    <ListChecks className="mr-2 size-4" />
                                    Planning PO
                                </Link>
                            </Button>
                        </div>
                    }
                />

                {/* KPI Stat Cards */}
                <section
                    aria-label="Ringkasan operasional"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <StatCard
                        label="Antrean Permintaan"
                        value="Review"
                        helper="Kebutuhan butik menunggu verifikasi"
                        icon={ClipboardList}
                        tone="warning"
                    />
                    <StatCard
                        label="Perencanaan PO"
                        value="Konsolidasi"
                        helper="Item disetujui siap diterbitkan PO"
                        icon={ListChecks}
                        tone="info"
                    />
                    <StatCard
                        label="Pesanan Berjalan"
                        value="Monitoring"
                        helper="PO aktif dalam pengiriman vendor"
                        icon={ShoppingCart}
                        tone="neutral"
                    />
                    <StatCard
                        label="Inventaris & Audit"
                        value="Terkendali"
                        helper="Stok & snapshot seluruh cabang"
                        icon={Warehouse}
                        tone="success"
                    />
                </section>

                {/* Workflow Navigator Section */}
                <section aria-labelledby="alur-pengadaan">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h2
                                id="alur-pengadaan"
                                className="font-serif text-lg font-bold tracking-tight text-foreground"
                            >
                                Siklus Alur Pengadaan Barang
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Ikuti 4 tahap terstandar untuk memproses kebutuhan persediaan dari butik ke supplier
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {pipelineCards.map((card) => (
                            <Card
                                key={card.title}
                                className="group relative flex flex-col justify-between overflow-hidden border border-border/70 bg-gradient-to-b from-card to-card/70 transition-all hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-sm"
                            >
                                <CardHeader className="p-5 pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className={`flex size-10 items-center justify-center rounded-xl border bg-gradient-to-br p-2 shadow-2xs ${card.color}`}>
                                            <card.icon className="size-5" />
                                        </div>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            {card.badge}
                                        </span>
                                    </div>
                                    <CardTitle className="mt-4 font-serif text-base font-bold text-foreground">
                                        {card.title}
                                    </CardTitle>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                        {card.desc}
                                    </p>
                                </CardHeader>
                                <CardContent className="p-5 pt-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-between font-medium group-hover:border-amber-500/40 group-hover:text-amber-900 dark:group-hover:text-amber-300"
                                        asChild
                                    >
                                        <Link href={card.href}>
                                            <span>{card.actionText}</span>
                                            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Quick Shortcuts & Best Practices */}
                <section className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-serif text-base font-bold">
                                <Boxes className="size-4 text-amber-600 dark:text-amber-400" />
                                Panduan Alur Kerja Tim Purchasing Pusat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3.5">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                    <p className="font-semibold text-foreground text-xs">Persetujuan Kuantitas Fleksibel</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Anda dapat menyetujui sebagian, menyesuaikan kuantitas sesuai minimum order supplier, atau menolak permintaan dengan catatan resmi.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3.5">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <div>
                                    <p className="font-semibold text-foreground text-xs">Konsolidasi Purchase Planning</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Gunakan menu Perencanaan PO untuk menggabungkan item dari beberapa cabang ke supplier yang sama demi efisiensi biaya kirim dan volume diskon.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3.5">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div>
                                    <p className="font-semibold text-foreground text-xs">Audit Trail & Keamanan Stok</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Setiap perubahan stok tercatat snapshot dan PIC yang bertransaksi, menjamin kepatuhan audit internal Tulola.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif text-base font-bold">
                                Akses Cepat Master Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start text-xs font-medium" asChild>
                                <Link href="/central/items">
                                    <Boxes className="mr-2 size-4 text-muted-foreground" />
                                    Katalog Item & SKU
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-xs font-medium" asChild>
                                <Link href="/central/suppliers">
                                    <ShoppingCart className="mr-2 size-4 text-muted-foreground" />
                                    Daftar Rekanan Supplier
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-xs font-medium" asChild>
                                <Link href="/central/stores">
                                    <Building2 className="mr-2 size-4 text-muted-foreground" />
                                    Daftar Toko & Butik
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-xs font-medium" asChild>
                                <Link href="/central/reports">
                                    <ChartNoAxesCombined className="mr-2 size-4 text-muted-foreground" />
                                    Laporan & Audit Ekspor
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </section>
            </main>
        </>
    );
}

CentralDashboard.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Dashboard', href: '/central/dashboard' },
    ],
};

