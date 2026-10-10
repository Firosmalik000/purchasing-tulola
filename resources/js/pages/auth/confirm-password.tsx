import { Form, Head } from '@inertiajs/react';
import { Lock, ShieldCheck } from 'lucide-react';
import {
    index as confirmOptions,
    store as confirmStore,
} from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <AuthLayout
            title="Konfirmasi Kata Sandi"
            description="Konfirmasikan kata sandi atau gunakan passkey untuk melanjutkan"
            badge="Verifikasi Keamanan"
            icon={Lock}
        >
            <Head title="Konfirmasi Keamanan — Portal Purchasing Tulola" />

            <div className="space-y-3">
                <PasskeyVerify
                    routes={{
                        options: confirmOptions(),
                        submit: confirmStore(),
                    }}
                    label="Konfirmasi dengan Passkey"
                    loadingLabel="Mengonfirmasi..."
                    separator="Atau konfirmasi dengan kata sandi"
                />

                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="space-y-3"
                >
                    {({ processing, errors }) => (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label
                                    htmlFor="password"
                                    className="text-[11px] font-medium"
                                >
                                    Kata Sandi Anda
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    placeholder="Masukkan kata sandi akun"
                                    autoComplete="current-password"
                                    autoFocus
                                    required
                                    className="h-9 text-xs"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-9 w-full gap-1.5 text-xs font-medium shadow-xs"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-3.5" />
                                        <span>Memverifikasi...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="size-3.5" />
                                        <span>Konfirmasi & Lanjutkan</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
