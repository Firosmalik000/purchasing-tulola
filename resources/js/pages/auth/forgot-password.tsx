import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, KeyRound, Mail, Send } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Lupa Kata Sandi?"
            description="Masukkan email terdaftar untuk menerima tautan atur ulang kata sandi"
            badge="Pemulihan Akses"
            icon={KeyRound}
            backLink={{ href: login(), label: 'Kembali ke Masuk' }}
        >
            <Head title="Lupa Kata Sandi — Portal Purchasing Tulola" />

            {status && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] leading-snug">{status}</span>
                </div>
            )}

            <div className="space-y-3">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label
                                    htmlFor="email"
                                    className="text-[11px] font-medium"
                                >
                                    Alamat Email Terdaftar
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        autoFocus
                                        required
                                        placeholder="nama@shoptulola.com"
                                        className="h-9 pr-9 text-xs"
                                    />
                                    <Mail className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-9 w-full gap-1.5 text-xs font-medium shadow-xs"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-3.5" />
                                        <span>Mengirim Tautan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="size-3.5" />
                                        <span>Kirim Tautan Atur Ulang</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </Form>

                <p className="pt-1 text-center text-[10px] text-muted-foreground">
                    Tautan berlaku sementara. Periksa folder <em>Spam</em> jika
                    email tidak segera muncul.
                </p>
            </div>
        </AuthLayout>
    );
}
