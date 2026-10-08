import { Form, Head } from '@inertiajs/react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    token: string;
    email: string;
    name: string;
    roleLabel: string;
};

export default function SetPassword({ token, email, name, roleLabel }: Props) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
            <Head title="Aktivasi Akun & Buat Kata Sandi" />

            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <h1 className="font-serif text-2xl font-bold tracking-widest uppercase text-foreground">
                        T U L O L A
                    </h1>
                    <p className="mt-1 text-xs tracking-widest uppercase text-primary font-medium">
                        Purchasing & Supply Chain Portal
                    </p>
                </div>

                <Card className="border-border/70 shadow-sm">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <KeyRound className="size-5" />
                        </div>
                        <CardTitle className="text-xl font-semibold">
                            Aktivasi Akun Baru
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            Halo <span className="font-semibold text-foreground">{name}</span> ({roleLabel}), silakan buat kata sandi untuk mengamankan akun portal Anda.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-2">
                        <Form
                            action={`/invitation/${token}`}
                            method="post"
                            className="space-y-4"
                            resetOnSuccess={['password', 'password_confirmation']}
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-medium">
                                            Alamat Email Terdaftar
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            readOnly
                                            className="bg-muted text-muted-foreground cursor-not-allowed text-xs h-9"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-xs font-semibold">
                                            Kata Sandi Baru *
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            autoComplete="new-password"
                                            autoFocus
                                            placeholder="Minimal 8 karakter"
                                            required
                                            className="h-9 text-xs"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="password_confirmation" className="text-xs font-semibold">
                                            Konfirmasi Kata Sandi *
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            autoComplete="new-password"
                                            placeholder="Ulangi kata sandi baru"
                                            required
                                            className="h-9 text-xs"
                                        />
                                        <InputError message={errors.password_confirmation} />
                                    </div>

                                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground flex gap-2.5 items-start">
                                        <ShieldCheck className="size-4 text-amber-600 shrink-0 mt-0.5" />
                                        <span>
                                            Gunakan kombinasi minimal 8 karakter dengan huruf dan angka untuk keamanan data purchasing.
                                        </span>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full font-medium h-9 mt-2"
                                        disabled={processing}
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Sandi & Masuk ke Portal'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
