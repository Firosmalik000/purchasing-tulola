import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function ThemeToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const isDark = resolvedAppearance === 'dark';

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="size-8.5 rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label={
                            isDark
                                ? 'Beralih ke mode terang'
                                : 'Beralih ke mode gelap'
                        }
                    >
                        {isDark ? (
                            <Sun className="size-4 text-amber-400 transition-transform hover:rotate-45" />
                        ) : (
                            <Moon className="size-4 text-slate-700 transition-transform hover:-rotate-12" />
                        )}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                    {isDark ? 'Mode Terang' : 'Mode Gelap'}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
