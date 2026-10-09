import { Link } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';

export interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
    badge?: string;
    icon?: ComponentType<{ className?: string }>;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
    backLink?: { href: string; label: string };
    footerNotice?: string;
}

export default function AuthLayout({
    children,
    title,
    description,
    badge = 'Portal Pengadaan & Logistik',
    icon: IconComponent,
    maxWidth = 'md',
    backLink,
    footerNotice = 'Sistem Pengadaan Resmi Tulola • Akses Terbatas & Terenkripsi',
}: AuthLayoutProps) {
    const maxWidthClass = {
        sm: 'max-w-sm',
        md: 'max-w-[420px]',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    }[maxWidth];

    return (
        <div className="relative flex h-screen h-dvh max-h-screen w-full flex-col justify-between overflow-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-24 right-0 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-600/15" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-600/10" />

            {/* Sleek Compact Top Bar */}
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
                        {backLink ? (
                            <Link
                                href={backLink.href}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ArrowLeft className="size-3" />
                                <span>{backLink.label}</span>
                            </Link>
                        ) : (
                            <Link
                                href={home()}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ArrowLeft className="size-3" />
                                <span className="hidden sm:inline">Kembali ke Beranda</span>
                                <span className="sm:hidden">Beranda</span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Center Content Area - Absolutely no vertical scrollbar */}
            <main className="flex flex-1 items-center justify-center p-3 sm:p-5 overflow-y-auto sm:overflow-hidden">
                <div className={`w-full ${maxWidthClass} my-auto transition-all`}>
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-lg shadow-black/5 backdrop-blur-md dark:border-border/60 dark:shadow-black/25">
                        {/* Top Gradient Accent Strip */}
                        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

                        <div className="p-5 sm:p-6">
                            {/* Compact Header Section */}
                            {(title || badge) && (
                                <div className="mb-4 flex flex-col items-center text-center">
                                    {badge && (
                                        <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-700 dark:text-blue-300">
                                            {IconComponent ? (
                                                <IconComponent className="size-2.5 text-blue-600 dark:text-blue-400" />
                                            ) : (
                                                <Sparkles className="size-2.5 text-blue-600 dark:text-blue-400" />
                                            )}
                                            <span>{badge}</span>
                                        </div>
                                    )}

                                    {title && (
                                        <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                                            {title}
                                        </h1>
                                    )}

                                    {description && (
                                        <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs max-w-xs leading-relaxed">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Form & Child Content */}
                            <div>{children}</div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Compact Bottom Footer */}
            <footer className="shrink-0 border-t border-border/40 bg-card/30 backdrop-blur-xs py-2 px-4 text-center">
                <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-[10px] text-muted-foreground">
                    <ShieldCheck className="size-3 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">{footerNotice}</span>
                    <span className="hidden sm:inline text-muted-foreground/50">&bull;</span>
                    <span className="hidden sm:inline">&copy; {new Date().getFullYear()} PT Tulola Desain Perhiasan</span>
                </div>
            </footer>
        </div>
    );
}
