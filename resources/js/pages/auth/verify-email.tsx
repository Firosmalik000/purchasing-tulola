import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, LogOut, Mail, Send } from 'lucide-react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    const isSent = status === 'verification-link-sent';

    return (
        <AuthLayout
            title="Verifikasi Alamat Email"
            description="Tautan verifikasi telah dikirimkan ke alamat email terdaftar Anda"
            badge="Verifikasi Akun"
            icon={Mail}
        >
            <Head title="Verifikasi Email — Portal Purchasing Tulola" />

            {isSent && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span className="leading-snug text-[11px]">
                        Tautan verifikasi baru berhasil dikirimkan ke email Anda. Silakan periksa kotak masuk atau spam.
                    </span>
                </div>
            )}

            <div className="space-y-3 text-center">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Sebelum melanjutkan, mohon konfirmasi akun melalui tautan yang dikirimkan ke email Anda.
                </p>

                <Form {...send.form()} className="space-y-2.5">
                    {({ processing }) => (
                        <>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full h-9 font-medium text-xs shadow-xs gap-1.5"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-3.5" />
                                        <span>Mengirim Email...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="size-3.5" />
                                        <span>Kirim Ulang Email Verifikasi</span>
                                    </>
                                )}
                            </Button>

                            <div className="pt-1">
                                <TextLink
                                    href={logout()}
                                    className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <LogOut className="size-3" />
                                    <span>Keluar dari Akun Ini</span>
                                </TextLink>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
