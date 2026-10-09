import { Form, Head } from '@inertiajs/react';
import { ArrowRight, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

type Props = {
    token: string;
    email: string;
    name: string;
    roleLabel: string;
};

export default function SetPassword({ token, email, name, roleLabel }: Props) {
    return (
        <AuthLayout
            title="Aktivasi Akun Baru"
            description="Buat kata sandi untuk mengaktifkan akun portal Anda"
            badge="Undangan Bergabung"
            icon={KeyRound}
            maxWidth="md"
        >
            <Head title="Aktivasi Akun — Portal Purchasing Tulola" />

            <div className="space-y-3">
                {/* User Info Highlight Card - Compact */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <UserCheck className="size-3.5" />
                        </div>
                        <div className="min-w-0 leading-tight">
                            <p className="text-xs font-semibold text-foreground truncate">
                                {name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                                {email}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] px-2 py-0 border-primary/30 text-primary bg-background">
                        {roleLabel}
                    </Badge>
                </div>

                <Form
                    action={`/invitation/${token}`}
                    method="post"
                    className="space-y-2.5"
                    resetOnSuccess={['password', 'password_confirmation']}
                >
                    {({ errors, processing }) => (
                        <div className="space-y-2.5">
                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-[11px] font-medium">
                                    Kata Sandi Baru *
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="Minimal 8 karakter"
                                    required
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
                                    placeholder="Ulangi kata sandi baru"
                                    required
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
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-3.5" />
                                        <span>Menyimpan & Mengaktifkan...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Aktifkan Akun & Masuk</span>
                                        <ArrowRight className="size-3.5" />
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
