import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Boxes,
    Building2,
    CheckCircle2,
    Coffee,
    PackageCheck,
    Receipt,
    ShoppingBag,
    Sparkles,
    Store,
    Truck,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    const steps = [
        {
            num: '01',
            icon: ShoppingBag,
            title: 'Ajukan Kebutuhan',
            desc: 'PIC Toko Cabang pilih item operasional yang menipis dan ajukan jumlahnya.',
            badge: 'Toko Cabang',
        },
        {
            num: '02',
            icon: CheckCircle2,
            title: 'Review oleh Pusat',
            desc: 'Tim purchasing kantor pusat cek kuantitas dan setujui permintaan.',
            badge: 'Kantor Pusat',
        },
        {
            num: '03',
            icon: Truck,
            title: 'Kirim Barang',
            desc: 'Pesanan internal diproses, barang disiapkan lalu dikirim ke cabang.',
            badge: 'Distribusi',
        },
        {
            num: '04',
            icon: PackageCheck,
            title: 'Terima & Stok Update',
            desc: 'Toko cabang verifikasi fisik barang datang, stok otomatis sinkron.',
            badge: 'Toko Cabang',
        },
    ];

    const categories = [
        {
            icon: ShoppingBag,
            title: 'Kemasan & Kantong Belanja',
            examples: 'Box signature, pouch kain, kantong paperbag belanja',
        },
        {
            icon: Coffee,
            title: 'Konsumsi & Tamu Toko',
            examples: 'Air mineral kemasan, biskuit / suguhan customer',
        },
        {
            icon: Receipt,
            title: 'Kasir & Perlengkapan',
            examples: 'Thermal roll kertas kasir POS, lakban, bolpoin, ATK',
        },
        {
            icon: Sparkles,
            title: 'Kebersihan & P3K',
            examples: 'Tissue, cairan pembersih, kotak obat toko',
        },
    ];

    return (
        <>
            <Head title="Shop Tulola — Pengadaan Toko Pusat & Cabang" />
            <div className="relative min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-teal-100 selection:text-teal-900 dark:bg-slate-950 dark:text-slate-100">
                {/* Soft, friendly ambient background accents */}
                <div className="pointer-events-none absolute -top-24 right-10 -z-10 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-500/5" />
                <div className="pointer-events-none absolute top-1/3 -left-20 -z-10 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/5" />

                {/* Navbar Header */}
                <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs dark:bg-teal-500">
                                <AppLogoIcon className="size-5 fill-current" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold tracking-wider text-slate-900 dark:text-white">
                                        SHOP TULOLA
                                    </span>
                                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 ring-1 ring-teal-600/15 dark:bg-teal-950/60 dark:text-teal-300">
                                        Pusat & Cabang
                                    </span>
                                </div>
                                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    Sistem Pengadaan & Stok Barang Toko
                                </span>
                            </div>
                        </div>

                        <div>
                            <Button
                                asChild
                                className="bg-teal-600 text-sm font-semibold text-white shadow-xs hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
                            >
                                <Link href={auth.user ? dashboard() : login()}>
                                    {auth.user
                                        ? 'Buka Dashboard'
                                        : 'Masuk Portal'}
                                    <ArrowRight className="ml-1.5 size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 md:py-14">
                    {/* Hero Section */}
                    <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
                        {/* Text Content */}
                        <div className="space-y-5 lg:col-span-7">
                            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3.5 py-1 text-xs font-semibold text-teal-800 shadow-2xs dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-300">
                                <ShoppingBag className="size-3.5 text-teal-600 dark:text-teal-400" />
                                Pengadaan Barang Shop Tulola
                            </div>

                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl lg:leading-tight dark:text-white">
                                Kebutuhan toko cabang dan pusat, tertata rapi
                                tanpa ribet.
                            </h1>

                            <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                                Aplikasi internal Shop Tulola untuk mengajukan
                                perlengkapan toko cabang, persetujuan kantor
                                pusat, hingga barang datang dan stok terdata
                                otomatis.
                            </p>

                            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-11 bg-teal-600 px-6 text-sm font-semibold text-white shadow-xs hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
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
                                <span className="text-xs text-slate-500 sm:pl-2 dark:text-slate-400">
                                    Khusus staf toko cabang & tim kantor pusat
                                </span>
                            </div>

                            {/* 3 Quick Highlight Cards */}
                            <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
                                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                                        <Store className="size-4" />
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            Toko Cabang
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                        Ajukan barang operasional langsung saat
                                        stok menipis.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                        <Building2 className="size-4" />
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            Kantor Pusat
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                        Review permintaan toko dan jadwalkan
                                        pengiriman.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <Boxes className="size-4" />
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            Stok Real-Time
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                        Stok terupdate otomatis begitu barang
                                        diterima toko.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Cheerful & Modern Visual Hero Image */}
                        <div className="lg:col-span-5">
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                                <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                                    <img
                                        src="/images/store-supply-hero.jpg"
                                        alt="Aktivitas Penyiapan Perlengkapan Shop Tulola"
                                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-102"
                                        loading="eager"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

                                    <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between text-white">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag className="size-4 text-teal-300" />
                                            <span className="text-xs font-medium">
                                                Perlengkapan & Stok Shop Tulola
                                            </span>
                                        </div>
                                        <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-xs">
                                            Shop Tulola
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-2.5 flex items-center justify-between px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="size-3.5 text-teal-600 dark:text-teal-400" />
                                        <span>
                                            Terhubung Toko Pusat & Semua Cabang
                                        </span>
                                    </div>
                                    <span className="font-mono text-[11px] text-slate-400">
                                        Internal App
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alur Sederhana (4 Langkah) */}
                    <section className="mt-16 sm:mt-20">
                        <div className="mx-auto mb-8 max-w-lg text-center">
                            <span className="text-xs font-bold tracking-wider text-teal-700 uppercase dark:text-teal-400">
                                Alur Mudah
                            </span>
                            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                                Cara kerja pengadaan barang
                            </h2>
                            <p className="mt-1.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                Dari toko cabang butuh barang sampai barang
                                sampai dan masuk catatan stok.
                            </p>
                        </div>

                        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                            {steps.map((st) => (
                                <div
                                    key={st.num}
                                    className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs transition-all hover:border-teal-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-teal-700"
                                >
                                    <div className="flex items-center justify-between pb-3">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300">
                                            <st.icon className="size-4" />
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                            {st.badge}
                                        </span>
                                    </div>
                                    <div className="mb-1 flex items-baseline gap-1.5">
                                        <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                                            {st.num}.
                                        </span>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {st.title}
                                        </h3>
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                        {st.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Kategori Barang Toko */}
                    <section className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <span className="text-xs font-bold tracking-wider text-teal-700 uppercase dark:text-teal-400">
                                    Katalog Barang
                                </span>
                                <h3 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                                    Barang yang rutin dikelola
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500 sm:max-w-xs dark:text-slate-400">
                                Perlengkapan standar operasional toko cabang
                                agar aktivitas jualan tetap lancar setiap hari.
                            </p>
                        </div>

                        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                            {categories.map((cat) => (
                                <div
                                    key={cat.title}
                                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-colors hover:bg-slate-100/80 dark:border-slate-800/60 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                                >
                                    <div className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300">
                                        <cat.icon className="size-4.5" />
                                    </div>
                                    <h4 className="mt-3 text-xs font-bold text-slate-900 dark:text-white">
                                        {cat.title}
                                    </h4>
                                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                        {cat.examples}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Call to action santai */}
                    <section className="mt-14 text-center">
                        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                Mau cek stok atau ajukan kebutuhan toko?
                            </h3>
                            <p className="mt-1.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                Silakan login dengan akun toko cabang atau
                                kantor pusat Shop Tulola Anda.
                            </p>
                            <div className="mt-4.5">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-10 bg-teal-600 px-6 font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
                                >
                                    <Link
                                        href={auth.user ? dashboard() : login()}
                                    >
                                        {auth.user
                                            ? 'Buka Dashboard'
                                            : 'Masuk ke Portal'}
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer Santai */}
                <footer className="mt-14 border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <p>
                        &copy; {new Date().getFullYear()} Shop Tulola. Pengadaan
                        Toko Pusat & Cabang.
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                        Aplikasi internal operasional tim toko cabang & kantor
                        pusat.
                    </p>
                </footer>
            </div>
        </>
    );
}
