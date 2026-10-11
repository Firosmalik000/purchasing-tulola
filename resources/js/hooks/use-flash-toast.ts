import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

type FlashProps = {
    toast?: FlashToast;
    success?: string | null;
    error?: string | null;
    warning?: string | null;
    info?: string | null;
    status?: string | null;
};

function showValidationErrorToast(rawErrors: unknown): void {
    if (!rawErrors || typeof rawErrors !== 'object') return;

    const messages: string[] = [];
    for (const val of Object.values(rawErrors as Record<string, unknown>)) {
        if (Array.isArray(val)) {
            for (const item of val) {
                if (typeof item === 'string' && item.trim()) {
                    messages.push(item.trim());
                }
            }
        } else if (typeof val === 'string' && val.trim()) {
            messages.push(val.trim());
        }
    }

    if (messages.length === 0) return;

    if (messages.length === 1) {
        toast.error('Validasi Gagal', {
            id: 'validation-error-toast',
            description: messages[0],
            duration: 5000,
        });
    } else {
        const description =
            messages.slice(0, 4).map((msg) => `• ${msg}`).join('\n') +
            (messages.length > 4
                ? `\n• ...dan ${messages.length - 4} kesalahan lainnya`
                : '');

        toast.error(`Validasi Gagal (${messages.length} kesalahan)`, {
            id: 'validation-error-toast',
            description,
            style: { whiteSpace: 'pre-line' },
            duration: 6000,
        });
    }
}

export function useFlashToast(): void {
    useEffect(() => {
        let lastMutationMethod: string | null = null;
        let validationErrorShown = false;

        const unlisteners = [
            // 1. Capture mutation HTTP method before visit begins
            router.on('before', (event) => {
                const method = (
                    event as CustomEvent
                ).detail?.visit?.method?.toLowerCase?.();
                if (
                    method &&
                    ['post', 'put', 'patch', 'delete'].includes(method)
                ) {
                    lastMutationMethod = method;
                } else {
                    lastMutationMethod = null;
                }
                validationErrorShown = false;
            }),

            // 2. Intercept validation errors from Inertia 'error' event
            router.on('error', (event) => {
                const rawErrors = (event as CustomEvent).detail?.errors;
                if (rawErrors && typeof rawErrors === 'object') {
                    showValidationErrorToast(rawErrors);
                    validationErrorShown = true;
                }
            }),

            // 3. Handle successful visits and flash messages
            router.on('navigate', (event) => {
                const detail = (event as CustomEvent).detail;
                if (detail?.cached) return;

                const page = detail?.page;
                const flash = page?.props?.flash as FlashProps | undefined;
                const pageErrors = page?.props?.errors as
                    | Record<string, unknown>
                    | undefined;

                // Priority 1: Custom flash toast object
                if (flash?.toast) {
                    toast[flash.toast.type](flash.toast.message);
                    return;
                }

                // Priority 2: Explicit flash success / error / warning / info / status
                if (flash?.success) {
                    toast.success(flash.success);
                    return;
                }

                if (flash?.error) {
                    toast.error(flash.error);
                    return;
                }

                if (flash?.warning) {
                    toast.warning(flash.warning);
                    return;
                }

                if (flash?.info) {
                    toast.info(flash.info);
                    return;
                }

                if (flash?.status) {
                    toast.success(flash.status);
                    return;
                }

                // Priority 3: Fallback validation error check from page props if not toasted yet
                if (
                    !validationErrorShown &&
                    pageErrors &&
                    Object.keys(pageErrors).length > 0 &&
                    lastMutationMethod
                ) {
                    showValidationErrorToast(pageErrors);
                    validationErrorShown = true;
                    return;
                }

                // Priority 4: Default success toast for mutation requests without custom flash message
                if (
                    lastMutationMethod &&
                    !validationErrorShown &&
                    (!pageErrors || Object.keys(pageErrors).length === 0)
                ) {
                    switch (lastMutationMethod) {
                        case 'post':
                            toast.success('Data berhasil disimpan.');
                            break;
                        case 'put':
                        case 'patch':
                            toast.success('Perubahan berhasil disimpan.');
                            break;
                        case 'delete':
                            toast.success('Data berhasil dihapus.');
                            break;
                    }
                }
            }),

            // 4. Handle HTTP exceptions (403, 404, 419, 500, etc.)
            router.on('httpException', (event) => {
                const response = (event as CustomEvent).detail?.response;
                const status = response?.status;
                const data = response?.data;

                let message =
                    'Terjadi kesalahan pada server. Silakan coba lagi.';
                if (typeof data?.message === 'string' && data.message.trim()) {
                    message = data.message.trim();
                } else if (status === 403) {
                    message =
                        'Akses ditolak (403): Anda tidak memiliki izin untuk melakukan tindakan ini.';
                } else if (status === 419) {
                    message =
                        'Sesi Anda telah kedaluwarsa (419). Silakan muat ulang halaman.';
                } else if (status === 404) {
                    message = 'Data atau rute tidak ditemukan (404).';
                } else if (status === 429) {
                    message =
                        'Terlalu banyak permintaan (429). Mohon tunggu sejenak.';
                } else if (status && status >= 500) {
                    message = `Kesalahan sistem server (${status}). Hubungi administrator jika masalah berlanjut.`;
                }

                toast.error(message, { duration: 5000 });
            }),

            // 5. Handle network disconnects
            router.on('networkError', () => {
                toast.error(
                    'Koneksi terputus: Tidak dapat terhubung ke server. Periksa jaringan Anda.',
                    { duration: 5000 },
                );
            }),

            // 6. Reset mutation state on visit finish
            router.on('finish', () => {
                lastMutationMethod = null;
            }),
        ];

        return () => {
            unlisteners.forEach((unlisten) => unlisten());
        };
    }, []);
}
