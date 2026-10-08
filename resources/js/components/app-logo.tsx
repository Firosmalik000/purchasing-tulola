import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 via-amber-700 to-stone-900 text-amber-100 shadow-sm ring-1 ring-amber-500/20">
                <AppLogoIcon className="size-5 fill-current text-amber-200" />
            </div>
            <div className="grid flex-1 text-left leading-none">
                <span className="font-serif text-base font-bold tracking-wider text-foreground">
                    TULOLA
                </span>
                <span className="mt-0.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Purchasing System
                </span>
            </div>
        </div>
    );
}
