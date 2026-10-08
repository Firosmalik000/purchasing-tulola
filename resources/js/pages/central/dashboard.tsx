import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Boxes,
    Building2,
    Calendar,
    ChartNoAxesCombined,
    CheckCircle2,
    ClipboardList,
    Clock,
    FileText,
    ListChecks,
    PackageCheck,
    Plus,
    ShoppingCart,
    Store,
    Truck,
    Warehouse,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import {
    PurchasingBarChart,
    StatusProgressChart,
} from '@/components/dashboard/purchasing-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    metrics: {
        pendingRequests: number;
        processedRequests: number;
        activeOrders: number;
        completedOrders: number;
        stockAlerts: number;
    };
    monthlyTrend: {
        month: string;
        requests: number;
        orders: number;
    }[];
    requestStatusDist: {
        name: string;
        count: number;
        color: string;
    }[];
    recentRequests: {
        id: number;
        number: string;
        status: string;
        store?: { id: number; name: string; code: string };
        requester?: { id: number; name: string };
        created_at: string;
    }[];
    recentOrders: {
        id: number;
        number: string;
        status: string;
        supplier?: { id: number; name: string };
        order_date: string;
        expected_date?: string;
    }[];
};

export default function CentralDashboard({
    metrics,
    monthlyTrend,
    requestStatusDist,
    recentRequests,
    recentOrders,
}: Props) {
    return (
        <>
            <Head title="Dashboard Pusat — Tulola Purchasing" />
            <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    badge="Portal Kantor Pusat"
                    title="Dashboard Operasional Purchasing"
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" asChild className="h-8 shadow-xs">
                                <Link href="/central/requests">
                                    <ClipboardList className="mr-1.5 size-3.5" />
                                    Tinjau Permintaan
                                </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild className="h-8">
                                <Link href="/central/purchase-planning">
                                    <ListChecks className="mr-1.5 size-3.5" />
                                    Planning PO
                                </Link>
                            </Button>
                        </div>
                    }
                />

                {/* KPI Metrics */}
                <section aria-label="KPI Ringkasan" className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Antrean Menunggu Review"
                        value={metrics.pendingRequests}
                        helper="Permintaan butik aktif"
                        icon={ClipboardList}
                        tone="warning"
                    />
                    <StatCard
                        label="Permintaan Siap Dipesan"
                        value={metrics.processedRequests}
                        helper="Telah disetujui untuk PO"
                        icon={ListChecks}
                        tone="info"
                    />
                    <StatCard
                        label="Pesanan Berjalan (PO)"
                        value={metrics.activeOrders}
                        helper="Dalam pengiriman vendor"
                        icon={ShoppingCart}
                        tone="neutral"
                    />
                    <StatCard
                        label="Stok di Bawah Standar"
                        value={metrics.stockAlerts}
                        helper="Perlu restock cabang"
                        icon={AlertTriangle}
                        tone={metrics.stockAlerts > 0 ? 'warning' : 'success'}
                    />
                </section>

                {/* Analytics Charts Section */}
                <section className="grid gap-5 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border-border/70 shadow-2xs">
                        <CardHeader className="border-b border-border/40 pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <ChartNoAxesCombined className="size-4" />
                                    </div>
                                    <CardTitle className="text-sm font-semibold">
                                        Tren Pengadaan & Pesanan
                                    </CardTitle>
                                </div>
                                <span className="text-xs text-muted-foreground">Volume Bulanan</span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <PurchasingBarChart data={monthlyTrend} height={190} />
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="border-b border-border/40 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    <Boxes className="size-4" />
                                </div>
                                <CardTitle className="text-sm font-semibold">
                                    Distribusi Status Pengadaan
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <StatusProgressChart items={requestStatusDist} />
                            
                            <div className="mt-5 rounded-lg border border-border/60 bg-muted/20 p-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Total Selesai Diterima:</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {metrics.completedOrders} PO Sukses
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Recent Activities Section */}
                <section className="grid gap-5 lg:grid-cols-2">
                    {/* Recent Requests Table */}
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="size-4 text-amber-600 dark:text-amber-400" />
                                <CardTitle className="text-sm font-semibold">
                                    Permintaan Butik Terbaru
                                </CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                                <Link href="/central/requests">
                                    Lihat Semua <ArrowRight className="ml-1 size-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentRequests.length === 0 ? (
                                <div className="p-6 text-center text-xs text-muted-foreground">
                                    Belum ada permintaan pembelian diajukan.
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {recentRequests.map((req, idx) => (
                                        <div key={req.id} className="flex items-center justify-between p-3.5 text-xs hover:bg-muted/30">
                                            <div className="flex items-center gap-2.5">
                                                <span className="font-mono text-[11px] text-muted-foreground/60 w-4">
                                                    #{idx + 1}
                                                </span>
                                                <div>
                                                    <Link href={`/central/requests/${req.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                                                        {req.number}
                                                    </Link>
                                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                                        <span>{req.store?.name}</span>
                                                        <span>•</span>
                                                        <span>{req.requester?.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] font-semibold">
                                                {req.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent POs Table */}
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="size-4 text-indigo-600 dark:text-indigo-400" />
                                <CardTitle className="text-sm font-semibold">
                                    Pesanan Pembelian (PO) Terbaru
                                </CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                                <Link href="/central/orders">
                                    Lihat Semua <ArrowRight className="ml-1 size-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentOrders.length === 0 ? (
                                <div className="p-6 text-center text-xs text-muted-foreground">
                                    Belum ada pesanan pembelian dibuat.
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {recentOrders.map((order, idx) => (
                                        <div key={order.id} className="flex items-center justify-between p-3.5 text-xs hover:bg-muted/30">
                                            <div className="flex items-center gap-2.5">
                                                <span className="font-mono text-[11px] text-muted-foreground/60 w-4">
                                                    #{idx + 1}
                                                </span>
                                                <div>
                                                    <Link href={`/central/orders/${order.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                                                        {order.number}
                                                    </Link>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                                        Supplier: {order.supplier?.name ?? '-'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] font-semibold">
                                                {order.status}
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

CentralDashboard.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Dashboard', href: '/central/dashboard' },
    ],
};
