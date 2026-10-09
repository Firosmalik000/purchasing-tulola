import { Form, Head, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    LogIn,
    Mail,
    ShieldAlert,
} from 'lucide-react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const page = usePage();
    const flashSuccess = (page.props as { flash?: { success?: string } }).flash
        ?.success;
    const flashError = (page.props as { flash?: { error?: string } }).flash
        ?.error;
    const alertMessage = status || flashSuccess;

    return (
        <AuthLayout
            title="Masuk ke Akun Portal"
            description="Akses terpadu pengadaan, persediaan toko cabang, dan approval pusat"
            badge="Portal Otentikasi"
            icon={LogIn}
        >
            <Head title="Masuk — Portal Purchasing Tulola" />

            {alertMessage && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] leading-snug">
                        {alertMessage}
                    </span>
                </div>
            )}

            {flashError && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
                    <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                    <span className="text-[11px] leading-snug">
                        {flashError}
                    </span>
                </div>
            )}

            <PasskeyVerify />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="space-y-3"
            >
                {({ processing, errors }) => (
                    <>
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
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="nama@tulolajewelry.com"
                                        className="h-9 pr-9 text-xs"
                                    />
                                    <Mail className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className="text-[11px] font-medium"
                                    >
                                        Kata Sandi
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-[11px] font-medium text-primary hover:underline"
                                            tabIndex={5}
                                        >
                                            Lupa kata sandi?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Masukkan kata sandi"
                                    className="h-9 text-xs"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center justify-between pt-0.5">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="cursor-pointer text-[11px] font-normal text-muted-foreground select-none"
                                    >
                                        Ingat saya di perangkat ini
                                    </Label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-9 w-full gap-1.5 text-xs font-medium shadow-xs"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-3.5" />
                                        <span>Memverifikasi...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Masuk ke Portal</span>
                                        <ArrowRight className="size-3.5" />
                                    </>
                                )}
                            </Button>
                        </div>

                        <p className="pt-1.5 text-center text-[10px] text-muted-foreground">
                            Akun staf & PIC toko cabang dikelola oleh
                            Administrator Pusat Tulola
                        </p>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
