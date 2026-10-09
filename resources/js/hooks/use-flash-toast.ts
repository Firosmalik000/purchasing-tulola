import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    useEffect(() => {
        // Listen to Inertia navigate events — shared props (including flash) are
        // carried in the page object after every server-driven navigation.
        return router.on('navigate', (event) => {
            const page = (event as CustomEvent).detail?.page;
            const flash = page?.props?.flash as
                | { toast?: FlashToast; success?: string | null; error?: string | null }
                | undefined;

            if (!flash) return;

            if (flash.toast) {
                toast[flash.toast.type](flash.toast.message);
            } else if (flash.success) {
                toast.success(flash.success);
            } else if (flash.error) {
                toast.error(flash.error);
            }
        });
    }, []);
}
