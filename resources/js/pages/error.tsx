import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Clock,
    Home,
    LifeBuoy,
    LogIn,
    RefreshCw,
    Search,
    ServerCrash,
    ShieldAlert,
    Wrench,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, home, login } from '@/routes';

type ErrorPageProps = {
    status: number;
    message?: string;
};

interface ErrorConfig {
    badge: string;
    title: string;
    description: string;
    hint: string;
    icon: typeof AlertTriangle;
    iconColor: string;
    iconBg: string;
    gradientFrom: string;
    gradientTo: string;
    primaryAction: {
        label: string;
        href?: string;
        action?: 'reload' | 'back' | 'link';
        icon: typeof RefreshCw;
    };
    showSecondaryAction?: boolean;
}

export default function ErrorPage({ status, message }: ErrorPageProps) {
    const page = usePage();
    const auth = (page.props as { auth?: { user?: unknown } }).auth;
    const isAuthenticated = Boolean(auth?.user);

    const errorConfigs: Record<number, ErrorConfig> = {
        401: {
            badge: 'Error 401 • Autentikasi Diperlukan',
            title: 'Sesi Belum Terautentikasi',
            description:
                message ||
                'Anda harus masuk ke akun portal purchasing untuk dapat mengakses halaman atau data ini.',
            hint: 'Silakan gunakan email dan kata sandi yang telah terdaftar di sistem pengadaan Tulola.',
            icon: LogIn,
            iconColor: 'text-amber-600 dark:text-amber-400',
            iconBg: 'bg-amber-500/10 ring-amber-500/20',
            gradientFrom: 'from-amber-500/15',
            gradientTo: 'to-transparent',
            primaryAction: {
                label: 'Masuk ke Portal',
                href: login().url,
                action: 'link',
                icon: LogIn,
            },
        },
        403: {
            badge: 'Error 403 • Hak Akses Ditolak',
            title: 'Wewenang Akses Dibatasi',
            description:
                message ||
                'Akun Anda tidak memiliki wewenang untuk membuka halaman atau melakukan tindakan ini.',
            hint: 'Akses portal disesuaikan berdasarkan peran kerja Anda (Kantor Pusat atau PIC Toko Cabang). Jika ini adalah kesalahan, hubungi Administrator Pusat.',
            icon: ShieldAlert,
            iconColor: 'text-rose-600 dark:text-rose-400',
            iconBg: 'bg-rose-500/10 ring-rose-500/20',
            gradientFrom: 'from-rose-500/15',
            gradientTo: 'to-transparent',
            primaryAction: {
                label: isAuthenticated
                    ? 'Kembali ke Dashboard'
                    : 'Masuk Akun Lain',
                href: isAuthenticated ? dashboard().url : login().url,
                action: 'link',
                icon: isAuthenticated ? Home : LogIn,
            },
        },
        404: {
            badge: 'Error 404 • Halaman Tidak Ditemukan',
            title: 'Halaman Tidak Tersedia',
            description:
                message ||
                'Tautan yang Anda tuju mungkin sudah dipindahkan, dihapus, atau alamat URL yang dimasukkan salah.',
            hint: 'Periksa kembali URL yang Anda tuju atau gunakan navigasi menu untuk menemukan data yang diinginkan.',
            icon: Search,
            iconColor: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-500/10 ring-blue-500/20',
            gradientFrom: 'from-blue-500/15',
            gradientTo: 'to-transparent',
            primaryAction: {
                label: isAuthenticated
                    ? 'Ke Dashboard Saya'
                    : 'Kembali ke Beranda',
                href: isAuthenticated ? dashboard().url : home().url,
                action: 'link',
                icon: Home,
            },
        },
        419: {
            badge: 'Error 419 • Sesi Kedaluwarsa',
            title: 'Sesi Keamanan Berakhir',
            description:
                message ||
                'Halaman telah tidak aktif beberapa saat demi melindungi data pengadaan. Token sesi Anda perlu diperbarui.',
            hint: 'Muat ulang halaman untuk memperbarui token keamanan atau masuk kembali jika sesi telah berakhir.',
            icon: Clock,
            iconColor: 'text-orange-600 dark:text-orange-400',
            iconBg: 'bg-orange-500/10 ring-orange-500/20',
            gradientFrom: 'from-orange-500/15',
            gradientTo: 'to-transparent',
            primaryAction: {
                label: 'Muat Ulang Halaman',
                action: 'reload',
                icon: RefreshCw,
            },
        },
        500: {
            badge: 'Error 500 • Kendala Server',
            title: 'Terjadi Kesalahan Sistem',
            description:
                message ||
                'Sistem mengalami kendala tak terduga saat memproses permintaan Anda. Riwayat log telah dicatat untuk pemeriksaan tim teknis.',
            hint: 'Cobalah beberapa saat lagi. Jika kendala terus berlanjut, hubungi tim dukungan IT Tulola.',
            icon: ServerCrash,
            iconColor: 'text-red-600 dark:text-red-400',
            iconBg: 'bg-red-500/10 ring-red-500/20',
            gradientFrom: 'from-red-500/15',
            gradientTo: 'to-transparent',
            primaryAction: {
                label: 'Coba Muat Ulang',
                action: 'reload',
                icon: RefreshCw,
            },
        },
        503: {
            badge: 'Status 503 • Pemeliharaan Sistem',
            title: 'Sistem Sedang Ditingkatkan',
            description:
                message ||
                'Portal Purchasing Tulola sedang dalam proses pemeliharaan berkala untuk meningkatkan performa dan keandalan data.',
            hint: 'Layanan akan segera normal kembali dalam beberapa menit. Terima kasih atas kesabaran Anda.',
            icon: Wrench,
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            iconBg: 'bg-cyan-500/10 ring-cyan-500/20',
            gradientFrom: 'from-cyan-500/15',
            gradientTo: 'to-transparent',
            primaryAction: {
                label: 'Periksa Status (Refresh)',
                action: 'reload',
                icon: RefreshCw,
            },
        },
    };

    const config = errorConfigs[status] || {
        badge: `Error ${status || 500}`,
        title: 'Terjadi Kendala',
        description:
            message || 'Terjadi kesalahan saat memproses permintaan Anda.',
        hint: 'Silakan kembali ke dashboard atau muat ulang halaman.',
        icon: AlertTriangle,
        iconColor: 'text-muted-foreground',
        iconBg: 'bg-muted ring-border',
        gradientFrom: 'from-muted/20',
        gradientTo: 'to-transparent',
        primaryAction: {
            label: isAuthenticated ? 'Ke Dashboard' : 'Ke Beranda',
            href: isAuthenticated ? dashboard() : home(),
            action: 'link',
            icon: Home,
        },
    };

    const Icon = config.icon;
    const PrimaryIcon = config.primaryAction.icon;

    const handlePrimaryClick = () => {
        if (config.primaryAction.action === 'reload') {
            window.location.reload();
        } else if (config.primaryAction.action === 'back') {
            window.history.back();
        }
    };

    return (
        <div className="relative flex h-dvh h-screen max-h-screen w-full flex-col justify-between overflow-hidden bg-background text-foreground">
            <Head title={`${status} - ${config.title} — Tulola Purchasing`} />

            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-24 right-0 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-600/15" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-600/10" />

            {/* Top Brand Header */}
            <header className="shrink-0 border-b border-border/50 bg-card/50 backdrop-blur-md">
                <div className="mx-auto flex h-13 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
                    <Link
                        href={home()}
                        className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
                    >
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-blue-100 shadow-2xs ring-1 ring-blue-500/30 transition-transform group-hover:scale-105">
                            <AppLogoIcon className="size-4.5 fill-current text-white" />
                        </div>
                        <div className="grid leading-tight">
                            <span className="font-sans text-xs font-bold tracking-widest text-foreground">
                                TULOLA
                            </span>
                            <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                                Purchasing Portal
                            </span>
                        </div>
                    </Link>

                    <div>
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                            <Link href={isAuthenticated ? dashboard() : home()}>
                                <Home className="mr-1.5 size-3" />
                                <span>
                                    {isAuthenticated ? 'Dashboard' : 'Beranda'}
                                </span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Center Error Card */}
            <main className="flex flex-1 items-center justify-center overflow-y-auto p-3 sm:overflow-hidden sm:p-5">
                <div className="my-auto w-full max-w-[460px]">
                    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-lg shadow-black/5 backdrop-blur-md dark:border-border/60 dark:shadow-black/25">
                        {/* Top Gradient Banner Strip */}
                        <div
                            className={`h-1 w-full bg-gradient-to-r ${config.gradientFrom} via-primary to-transparent`}
                        />

                        <div className="p-5 text-center sm:p-6">
                            {/* Watermark Status Number */}
                            <div className="pointer-events-none absolute top-4 right-4 font-mono text-6xl font-extrabold text-muted-foreground/10 select-none sm:text-7xl">
                                {status}
                            </div>

                            {/* Icon Badge */}
                            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl shadow-2xs ring-1 backdrop-blur-xs">
                                <div
                                    className={`flex size-12 items-center justify-center rounded-xl ring-1 ${config.iconBg}`}
                                >
                                    <Icon
                                        className={`size-6 ${config.iconColor}`}
                                    />
                                </div>
                            </div>

                            {/* Badge Label */}
                            <div className="mb-1.5 inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                                <span>{config.badge}</span>
                            </div>

                            {/* Title & Description */}
                            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                {config.title}
                            </h1>

                            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                                {config.description}
                            </p>

                            {/* Helpful Tips Box */}
                            <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-2.5 text-left">
                                <div className="flex items-start gap-2">
                                    <LifeBuoy className="mt-0.5 size-3.5 shrink-0 text-primary" />
                                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                                        {config.hint}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4.5 flex flex-col items-center justify-center gap-2 sm:flex-row">
                                {config.primaryAction.action === 'link' &&
                                config.primaryAction.href ? (
                                    <Button
                                        asChild
                                        className="h-8.5 w-full gap-1.5 px-4 text-xs font-medium shadow-xs sm:w-auto"
                                    >
                                        <Link href={config.primaryAction.href}>
                                            <PrimaryIcon className="size-3" />
                                            <span>
                                                {config.primaryAction.label}
                                            </span>
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handlePrimaryClick}
                                        className="h-8.5 w-full gap-1.5 px-4 text-xs font-medium shadow-xs sm:w-auto"
                                    >
                                        <PrimaryIcon className="size-3" />
                                        <span>
                                            {config.primaryAction.label}
                                        </span>
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    className="h-8.5 w-full gap-1 px-3.5 text-xs font-medium sm:w-auto"
                                >
                                    <ArrowLeft className="size-3" />
                                    <span>Halaman Sebelumnya</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="shrink-0 border-t border-border/40 bg-card/30 px-4 py-2 text-center text-[10px] text-muted-foreground backdrop-blur-xs">
                &copy; {new Date().getFullYear()} PT Tulola Desain Perhiasan
                &bull; Sistem Pengadaan Resmi
            </footer>
        </div>
    );
}
