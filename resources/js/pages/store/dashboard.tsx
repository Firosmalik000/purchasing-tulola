import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Boxes,
    CheckCircle2,
    ClipboardList,
    PackageCheck,
    PackageOpen,
    Plus,
    Send,
    Warehouse,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StoreDashboard() {
    return (
        <>
            <Head title="Dashboard Butik — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    badge="Portal Butik Cabang"
                    title="Dashboard Operasional Butik"
                    description="Kelola pengajuan pengadaan stok rutin, kebutuhan khusus butik, dan konfirmasi barang masuk dari pusat."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button asChild className="shadow-xs">
                                <Link href="/store/requests/create">
                                    <Plus className="mr-2 size-4" />
                                    Permintaan Baru
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/store/incoming">
                                    <PackageCheck className="mr-2 size-4" />
                                    Barang Masuk
                                </Link>
                            </Button>
                        </div>
                    }
                />

                {/* KPI Stat Cards */}
                <section
                    aria-label="Ringkasan toko"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <StatCard
                        label="Permintaan Saya"
                        value="Daftar"
                        helper="Draft & permintaan yang diajukan"
                        icon={ClipboardList}
                        tone="warning"
                    />
                    <StatCard
                        label="Persetujuan Pusat"
                        value="Tracking"
                        helper="Item yang telah diproses kantor pusat"
                        icon={Send}
                        tone="info"
                    />
                    <StatCard
                        label="Barang Masuk"
                        value="Penerimaan"
                        helper="Pesanan dalam proses kirim ke butik"
                        icon={PackageOpen}
                        tone="success"
                    />
                    <StatCard
                        label="Monitoring Stok"
                        value="Standar"
                        helper="Cek posisi stok di bawah standar"
                        icon={Warehouse}
                        tone="neutral"
                    />
                </section>

                {/* Store Action Center */}
                <section className="grid gap-6 md:grid-cols-3">
                    <Card className="group border border-border/80 bg-gradient-to-b from-card to-card/70 transition-all hover:border-amber-500/40 hover:shadow-sm">
                        <CardHeader className="p-5 pb-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                <ClipboardList className="size-5" />
                            </div>
                            <CardTitle className="mt-3 font-serif text-base font-bold">
                                1. Ajukan Kebutuhan Butik
                            </CardTitle>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Butuh restock perhiasan atau perlengkapan display? Buat draft permintaan stok atau pesanan khusus.
                            </p>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <Button asChild size="sm" className="w-full justify-between">
                                <Link href="/store/requests/create">
                                    <span>Buat Permintaan</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="group border border-border/80 bg-gradient-to-b from-card to-card/70 transition-all hover:border-emerald-500/40 hover:shadow-sm">
                        <CardHeader className="p-5 pb-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                <PackageCheck className="size-5" />
                            </div>
                            <CardTitle className="mt-3 font-serif text-base font-bold">
                                2. Konfirmasi Barang Masuk
                            </CardTitle>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Paket barang tiba di butik? Verifikasi kesesuaian fisik dan input kuantitas barang yang diterima secara akurat.
                            </p>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <Button asChild variant="outline" size="sm" className="w-full justify-between">
                                <Link href="/store/incoming">
                                    <span>Cek Penerimaan</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="group border border-border/80 bg-gradient-to-b from-card to-card/70 transition-all hover:border-indigo-500/40 hover:shadow-sm">
                        <CardHeader className="p-5 pb-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                                <Warehouse className="size-5" />
                            </div>
                            <CardTitle className="mt-3 font-serif text-base font-bold">
                                3. Pantau Posisi Stok
                            </CardTitle>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Periksa item yang berada di bawah kuantitas standar minimum agar butik tidak mengalami kekosongan item penting.
                            </p>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <Button asChild variant="outline" size="sm" className="w-full justify-between">
                                <Link href="/store/inventory">
                                    <span>Lihat Stok Butik</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                {/* Workflow Guidance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-serif text-base font-bold">
                            <Boxes className="size-4 text-amber-600 dark:text-amber-400" />
                            Prosedur Standar Operasional (SOP) Pengadaan Butik
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-3 text-xs text-muted-foreground">
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400" />
                                <span>Pemeriksaan Rutin</span>
                            </div>
                            <p className="mt-1 leading-relaxed">
                                Cek stok fisik berkala dan bandingkan dengan standar minimum butik sebelum membuat pengajuan.
                            </p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400" />
                                <span>Pengajuan Terperinci</span>
                            </div>
                            <p className="mt-1 leading-relaxed">
                                Cantumkan tanggal kebutuhan dan alasan untuk item khusus guna mempercepat persetujuan kantor pusat.
                            </p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Verifikasi Surat Jalan</span>
                            </div>
                            <p className="mt-1 leading-relaxed">
                                Cocokkan nomor surat jalan & kondisi fisik barang sebelum mengonfirmasi penerimaan di sistem.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

StoreDashboard.layout = {
    breadcrumbs: [
        { title: 'Portal Butik', href: '/store/dashboard' },
        { title: 'Dashboard', href: '/store/dashboard' },
    ],
};

