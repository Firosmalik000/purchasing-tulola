import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ClipboardList,
    PackageCheck,
    PackageOpen,
    Plus,
    Send,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { PurchasingBarChart } from '@/components/dashboard/purchasing-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    metrics: {
        myDrafts: number;
        submittedRequests: number;
        processedRequests: number;
        incomingOrders: number;
        confirmedReceipts: number;
        lowStockCount: number;
    };
    monthlyTrend: {
        month: string;
        requests: number;
        receipts: number;
    }[];
    recentRequests: {
        id: number;
        number: string;
        status: string;
        store?: { id: number; name: string };
        required_date?: string;
        created_at: string;
    }[];
    recentReceipts: {
        id: number;
        number: string;
        status: string;
        purchaseOrder?: { id: number; number: string };
        received_at: string;
    }[];
};

export default function StoreDashboard({
    metrics,
    monthlyTrend,
    recentRequests,
    recentReceipts,
}: Props) {
    // Transform trend data for BarChart
    const chartData = monthlyTrend.map((m) => ({
        month: m.month,
        requests: m.requests,
        orders: m.receipts,
    }));

    return (
        <>
            <Head title="Dashboard Toko Cabang — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Toko Cabang"
                    title="Dashboard Toko Cabang"
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" asChild className="h-8 shadow-xs">
                                <Link href="/store/requests/create">
                                    <Plus className="mr-1.5 size-3.5" />
                                    Permintaan Baru
                                </Link>
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                asChild
                                className="h-8"
                            >
                                <Link href="/store/incoming">
                                    <PackageCheck className="mr-1.5 size-3.5" />
                                    Barang Masuk
                                </Link>
                            </Button>
                        </div>
                    }
                />

                {/* KPI Metrics */}
                <section
                    aria-label="KPI Toko"
                    className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <StatCard
                        label="Draft Permintaan"
                        value={metrics.myDrafts}
                        helper="Belum diajukan ke pusat"
                        icon={ClipboardList}
                        tone="neutral"
                    />
                    <StatCard
                        label="Diajukan ke Pusat"
                        value={metrics.submittedRequests}
                        helper="Menunggu review purchasing"
                        icon={Send}
                        tone="warning"
                    />
                    <StatCard
                        label="Barang Menuju Toko Cabang"
                        value={metrics.incomingOrders}
                        helper="PO siap diterima fisik"
                        icon={PackageOpen}
                        tone="info"
                    />
                    <StatCard
                        label="Penerimaan Selesai"
                        value={metrics.confirmedReceipts}
                        helper="Histori barang masuk"
                        icon={PackageCheck}
                        tone="success"
                    />
                </section>

                {/* Chart & Quick Action */}
                <section className="grid gap-5 lg:grid-cols-3">
                    <Card className="border-border/70 shadow-2xs lg:col-span-2">
                        <CardHeader className="border-b border-border/40 pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold">
                                    Tren Pengajuan & Penerimaan Barang
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">
                                    Volume Toko Cabang
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <PurchasingBarChart data={chartData} height={180} />
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col justify-between border-border/70 shadow-2xs">
                        <CardHeader className="border-b border-border/40 pb-3">
                            <CardTitle className="text-sm font-semibold">
                                Aksi Cepat Operasional
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5 p-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-full justify-between text-xs"
                                asChild
                            >
                                <Link href="/store/requests/create">
                                    <span className="flex items-center gap-2">
                                        <Plus className="size-3.5 text-primary" />
                                        Buat Permintaan
                                    </span>
                                    <ArrowRight className="size-3 text-muted-foreground" />
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-full justify-between text-xs"
                                asChild
                            >
                                <Link href="/store/incoming">
                                    <span className="flex items-center gap-2">
                                        <PackageCheck className="size-3.5 text-emerald-600" />
                                        Konfirmasi Terima
                                    </span>
                                    <ArrowRight className="size-3 text-muted-foreground" />
                                </Link>
                            </Button>

                            <div className="pt-2 text-center text-[11px] text-muted-foreground">
                                Total {metrics.confirmedReceipts} penerimaan
                                fisik telah terkonfirmasi.
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Recent Activities Section */}
                <section className="grid gap-5 lg:grid-cols-2">
                    {/* Recent Requests Table */}
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
                            <CardTitle className="text-sm font-semibold">
                                Pengajuan Terakhir Toko Cabang
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-7 text-xs"
                            >
                                <Link href="/store/requests">
                                    Lihat Semua{' '}
                                    <ArrowRight className="ml-1 size-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentRequests.length === 0 ? (
                                <div className="p-6 text-center text-xs text-muted-foreground">
                                    Belum ada permintaan pembelian.
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {recentRequests.map((req, idx) => (
                                        <div
                                            key={req.id}
                                            className="flex items-center justify-between p-3.5 text-xs hover:bg-muted/30"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-4 font-mono text-[11px] text-muted-foreground/60">
                                                    #{idx + 1}
                                                </span>
                                                <div>
                                                    <Link
                                                        href={`/store/requests/${req.id}`}
                                                        className="font-medium text-foreground hover:text-primary hover:underline"
                                                    >
                                                        {req.number}
                                                    </Link>
                                                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                        Kebutuhan:{' '}
                                                        {req.required_date ??
                                                            'Segera'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] font-semibold"
                                            >
                                                {req.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Receipts Table */}
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
                            <CardTitle className="text-sm font-semibold">
                                Riwayat Penerimaan Paket
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-7 text-xs"
                            >
                                <Link href="/store/incoming">
                                    Lihat Semua{' '}
                                    <ArrowRight className="ml-1 size-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentReceipts.length === 0 ? (
                                <div className="p-6 text-center text-xs text-muted-foreground">
                                    Belum ada catatan penerimaan barang.
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {recentReceipts.map((rec, idx) => (
                                        <div
                                            key={rec.id}
                                            className="flex items-center justify-between p-3.5 text-xs hover:bg-muted/30"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-4 font-mono text-[11px] text-muted-foreground/60">
                                                    #{idx + 1}
                                                </span>
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        {rec.number}
                                                    </span>
                                                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                        PO:{' '}
                                                        {rec.purchaseOrder
                                                            ?.number ?? '-'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] font-semibold text-emerald-600"
                                            >
                                                {rec.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </main>
        </>
    );
}

StoreDashboard.layout = {
    breadcrumbs: [
        { title: 'Portal Toko Cabang', href: '/store/dashboard' },
        { title: 'Dashboard', href: '/store/dashboard' },
    ],
};
