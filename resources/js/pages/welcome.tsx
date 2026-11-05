import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Selamat datang — Tulola" />

            <div className="welcome-screen grid h-dvh grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-background text-foreground">
                <div className="welcome-ambient" aria-hidden="true" />
                <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5 sm:px-10 sm:py-6">
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/logo/nts-logo-gold.svg"
                            alt="PT. Napak Tilas Seni"
                            width={56}
                            height={39}
                            className="h-auto w-14"
                        />
                        <div className="border-l border-border pl-3">
                            <p className="text-sm font-semibold tracking-widest">TULOLA</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">Purchasing</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
                        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                        Portal internal
                    </span>
                </header>

                <main className="flex min-h-0 items-center justify-center px-6 py-4">
                    <div className="welcome-content w-full max-w-2xl text-center">
                        <p className="welcome-eyebrow text-xs font-medium tracking-widest text-primary uppercase">
                            Untuk tim Tulola
                        </p>
                        <h1 className="welcome-title mt-5 font-medium tracking-tight">
                            Selamat datang.
                            <br />
                            <span className="welcome-title-accent">Mari mulai hari ini.</span>
                        </h1>
                        <p className="welcome-description mx-auto mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
                            Kelola kebutuhan toko dan kantor pusat
                            dalam satu ruang kerja.
                        </p>

                        <Button asChild size="lg" className="welcome-action group mt-8 h-12 gap-5 rounded-full px-7">
                            <Link href={auth.user ? dashboard() : login()}>
                                {auth.user ? 'Buka dashboard' : 'Masuk ke portal'}
                                <ArrowRight className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                        </Button>
                    </div>
                </main>

                <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-6 py-5 text-center text-xs text-muted-foreground sm:justify-between sm:px-10 sm:py-6">
                    <p>&copy; {new Date().getFullYear()} PT. Napak Tilas Seni</p>
                    <p>Toko &amp; kantor pusat Tulola</p>
                </footer>
            </div>
        </>
    );
}
