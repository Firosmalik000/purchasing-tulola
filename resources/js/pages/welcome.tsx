import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Boxes,
    Building2,
    CheckCircle2,
    ClipboardList,
    PackageCheck,
    ShieldCheck,
    ShoppingCart,
    Warehouse,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    const flowSteps = [
        {
            icon: ClipboardList,
            step: '01',
            title: 'Permintaan Toko',
            desc: 'PIC Toko mengajukan kebutuhan stok rutin & item khusus',
        },
        {
            icon: CheckCircle2,
            step: '02',
            title: 'Verifikasi Pusat',
            desc: 'Tim purchasing pusat meninjau kuantitas & stok snapshot',
        },
        {
            icon: ShoppingCart,
            step: '03',
            title: 'Order Internal',
            desc: 'Order Proses dibuat otomatis dari request yang disetujui',
        },
        {
            icon: PackageCheck,
            step: '04',
            title: 'Penerimaan Fisik',
            desc: 'Verifikasi surat jalan & penerimaan barang di toko',
        },
    ];

    return (
        <>
            <Head title="Purchasing Tulola — Sistem Pengadaan & Stok" />
            <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
                {/* Subtle Modern High-Tech Ambient Gradients */}
                <div className="pointer-events-none absolute -top-40 right-0 -z-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="pointer-events-none absolute top-1/2 -left-40 -z-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

                {/* Top Brand Bar */}
                <header className="border-b border-border/60 bg-card/60 backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-blue-100 shadow-sm ring-1 ring-blue-500/30">
                                <AppLogoIcon className="size-6 fill-current text-white" />
                            </div>
                            <div>
                                <span className="font-sans text-lg font-bold tracking-widest text-foreground">
                                    TULOLA
                                </span>
                                <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    Purchasing & Inventory System
                                </span>
                            </div>
                        </div>

                        <div>
                            <Button
                                asChild
                                className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            >
                                <Link href={auth.user ? dashboard() : login()}>
                                    {auth.user
                                        ? 'Buka Dashboard'
                                        : 'Masuk ke Portal'}
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="mx-auto max-w-7xl px-6 py-12 md:py-20">
                    <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-blue-700 dark:text-blue-300">
                                <Boxes className="size-3.5 text-blue-600 dark:text-blue-400" />
                                Standar Pengadaan Terintegrasi
                            </div>

                            <h1 className="font-sans text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                                Kebutuhan setiap toko cabang, terkelola dari
                                satu pusat.
                            </h1>

                            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                                Sistem Purchasing Tulola menyatukan pengajuan
                                kebutuhan toko cabang, persetujuan pusat, order
                                internal, hingga penerimaan barang dan pembaruan
                                stok secara transparan.
                            </p>

                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-11 px-6 font-medium shadow-sm"
                                >
                                    <Link
                                        href={auth.user ? dashboard() : login()}
                                    >
                                        {auth.user
                                            ? 'Lanjut ke Dashboard'
                                            : 'Masuk ke Akun Anda'}
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    Akses terisolasi untuk Kantor Pusat & PIC
                                    Toko Cabang
                                </span>
                            </div>
                        </div>

                        {/* Feature Pillar Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                            <div className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-xs backdrop-blur-xs transition-all hover:border-blue-500/40">
                                <div className="flex items-start gap-4">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
                                        <Building2 className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">
                                            Konsolidasi Terpusat
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Tim purchasing pusat memproses
                                            setiap request menjadi order
                                            internal untuk toko terkait.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-xs backdrop-blur-xs transition-all hover:border-blue-500/40">
                                <div className="flex items-start gap-4">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                        <ShieldCheck className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">
                                            Akses Toko Terisolasi
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            PIC toko cabang hanya dapat
                                            mengelola data toko penugasannya,
                                            menjaga kerahasiaan dan akurasi.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-xs backdrop-blur-xs transition-all hover:border-blue-500/40">
                                <div className="flex items-start gap-4">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                                        <Warehouse className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">
                                            Audit Trail & Snapshot Stok
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Riwayat stok tercatat otomatis
                                            dengan snapshot sebelum dan sesudah
                                            setiap mutasi barang.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Flow Banner */}
                    <section className="mt-16 rounded-3xl border border-border/80 bg-gradient-to-b from-card to-card/60 p-6 shadow-sm md:p-8">
                        <div className="mb-6 text-center">
                            <span className="text-xs font-semibold tracking-widest text-blue-600 uppercase dark:text-blue-400">
                                Alur Siklus Purchasing
                            </span>
                            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                Dari Kebutuhan Toko Cabang Hingga Barang
                                Diterima
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {flowSteps.map((step) => (
                                <div
                                    key={step.step}
                                    className="relative flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-2xs transition-colors hover:border-blue-500/30"
                                >
                                    <div className="flex items-center justify-between pb-3">
                                        <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                            <step.icon className="size-5" />
                                        </div>
                                        <span className="font-mono text-xs font-bold text-muted-foreground">
                                            {step.step}
                                        </span>
                                    </div>
                                    <h4 className="text-base font-semibold text-foreground">
                                        {step.title}
                                    </h4>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                        {step.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>

                <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} Tulola Jewelry. Sistem
                    Pengadaan & Persediaan Terpadu.
                </footer>
            </div>
        </>
    );
}
