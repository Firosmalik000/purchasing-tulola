import { Form, Head } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { KeyRound, ShieldCheck, Smartphone } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <AuthLayout
            title={
                showRecoveryInput
                    ? 'Kode Pemulihan Darurat'
                    : 'Verifikasi Dua Faktor (2FA)'
            }
            description={
                showRecoveryInput
                    ? 'Masukkan salah satu kode pemulihan darurat akun Anda'
                    : 'Buka aplikasi authenticator dan masukkan 6-digit kode verifikasi'
            }
            badge="Keamanan Dua Langkah"
            icon={showRecoveryInput ? KeyRound : Smartphone}
            backLink={{ href: login(), label: 'Kembali ke Masuk' }}
        >
            <Head title="Verifikasi Dua Faktor — Portal Purchasing Tulola" />

            <div className="space-y-3">
                <Form
                    {...store.form()}
                    className="space-y-3"
                    resetOnError
                    resetOnSuccess={!showRecoveryInput}
                >
                    {({ errors, processing, clearErrors }) => (
                        <>
                            {showRecoveryInput ? (
                                <div className="space-y-1">
                                    <Input
                                        name="recovery_code"
                                        type="text"
                                        placeholder="Contoh: abcd-efgh-ijkl"
                                        autoFocus={showRecoveryInput}
                                        required
                                        className="h-9 text-center font-mono text-xs tracking-wider"
                                    />
                                    <InputError
                                        message={errors.recovery_code}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <div className="flex w-full items-center justify-center py-1">
                                        <InputOTP
                                            name="code"
                                            maxLength={OTP_MAX_LENGTH}
                                            value={code}
                                            onChange={(val) => setCode(val)}
                                            disabled={processing}
                                            pattern={REGEXP_ONLY_DIGITS}
                                            autoFocus
                                        >
                                            <InputOTPGroup className="gap-1.5">
                                                {Array.from(
                                                    { length: OTP_MAX_LENGTH },
                                                    (_, index) => (
                                                        <InputOTPSlot
                                                            key={index}
                                                            index={index}
                                                            className="size-9 rounded-md border border-border text-sm font-bold shadow-2xs sm:size-9.5"
                                                        />
                                                    ),
                                                )}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    <InputError message={errors.code} />
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="mt-1 h-9 w-full gap-1.5 text-xs font-medium shadow-xs"
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-3.5" />
                                        <span>Memverifikasi...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="size-3.5" />
                                        <span>Verifikasi & Masuk</span>
                                    </>
                                )}
                            </Button>

                            <div className="pt-1 text-center">
                                <button
                                    type="button"
                                    className="cursor-pointer text-[11px] font-medium text-primary transition-colors hover:underline"
                                    onClick={() =>
                                        toggleRecoveryMode(clearErrors)
                                    }
                                >
                                    {showRecoveryInput
                                        ? 'Gunakan kode dari aplikasi authenticator'
                                        : 'Gunakan kode pemulihan darurat'}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
