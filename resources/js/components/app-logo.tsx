import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <AppLogoIcon className="size-4.5 fill-current" />
            </div>
            <div className="grid flex-1 text-left leading-none">
                <span className="text-sm font-bold tracking-tight text-foreground">
                    TULOLA
                </span>
                <span className="mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Purchasing
                </span>
            </div>
        </div>
    );
}
