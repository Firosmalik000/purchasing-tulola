import { Form, Head } from '@inertiajs/react';
import { Check, KeyRound, ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <AuthLayout
            title="Atur Ulang Kata Sandi"
            description="Buat kata sandi baru untuk akun portal pengadaan Anda"
            badge="Pembaruan Kata Sandi"
            icon={KeyRound}
            backLink={{ href: login(), label: 'Kembali ke Masuk' }}
        >
            <Head title="Atur Ulang Kata Sandi — Portal Purchasing Tulola" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="space-y-3"
            >
                {({ processing, errors }) => (
                    <div className="space-y-2.5">
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-[11px] font-medium">
                                Alamat Email Terdaftar
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                readOnly
                                className="h-8.5 text-xs bg-muted/50 text-muted-foreground cursor-not-allowed"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="password" className="text-[11px] font-medium">
                                Kata Sandi Baru *
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                autoFocus
                                required
                                placeholder="Minimal 8 karakter"
                                passwordrules={passwordRules}
                                className="h-8.5 text-xs"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="password_confirmation" className="text-[11px] font-medium">
                                Konfirmasi Kata Sandi Baru *
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                required
                                placeholder="Ulangi kata sandi baru"
                                passwordrules={passwordRules}
                                className="h-8.5 text-xs"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-muted-foreground">
                            <ShieldCheck className="size-3 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>Minimal 8 karakter kombinasi huruf & angka.</span>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-9 font-medium text-xs shadow-xs gap-1.5 mt-1"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing ? (
                                <>
                                    <Spinner className="size-3.5" />
                                    <span>Menyimpan Sandi...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="size-3.5" />
                                    <span>Perbarui Kata Sandi & Masuk</span>
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
