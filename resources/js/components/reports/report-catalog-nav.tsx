import { Link, router } from '@inertiajs/react';
import {
    Boxes,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileSpreadsheet,
    FileText,
    History,
    Package,
    Scale,
    Sparkles,
    Store,
    type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { ReportFilters, ReportTypeOption } from '@/types/report';

type GroupItem = {
    value: string;
    icon: LucideIcon;
    shortDesc: string;
};

type ReportNavGroup = {
    title: string;
    items: GroupItem[];
};

const REPORT_GROUPS: ReportNavGroup[] = [
    {
        title: 'Permintaan & Pengadaan',
        items: [
            {
                value: 'purchasing-request',
                icon: FileText,
                shortDesc: 'Distribusi stok toko per periode',
            },
            {
                value: 'request-by-store',
                icon: Store,
                shortDesc: 'Rekapitulasi permintaan cabang',
            },
            {
                value: 'special-request',
                icon: Sparkles,
                shortDesc: 'Item di luar katalog standar',
            },
        ],
    },
    {
        title: 'Pesanan Pembelian (PO)',
        items: [
            {
                value: 'order',
                icon: Package,
                shortDesc: 'Daftar PO & status pemenuhan',
            },
            {
                value: 'outstanding-order',
                icon: Clock,
                shortDesc: 'Sisa kuantitas belum tiba',
            },
            {
                value: 'received-order',
                icon: CheckCircle2,
                shortDesc: 'Rincian fisik yang sudah diterima',
            },
        ],
    },
    {
        title: 'Stok & Inventaris Toko',
        items: [
            {
                value: 'stock-by-store',
                icon: Boxes,
                shortDesc: 'Posisi kuantitas saat ini',
            },
            {
                value: 'stock-vs-standard',
                icon: Scale,
                shortDesc: 'Analisis stok vs standar minimum',
            },
            {
                value: 'stock-update-history',
                icon: History,
                shortDesc: 'Audit log pergerakan stok',
            },
        ],
    },
];

type Props = {
    currentReportType: string;
    reportTypes: ReportTypeOption[];
    filters: ReportFilters;
};

export function ReportCatalogNav({
    currentReportType,
    reportTypes,
    filters,
}: Props) {
    const buildReportUrl = (targetType: string) => {
        const params = new URLSearchParams();
        params.set('report', targetType);
        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);
        if (filters.store_id) params.set('store_id', String(filters.store_id));
        if (filters.category_id)
            params.set('category_id', String(filters.category_id));
        return `/central/reports?${params.toString()}`;
    };

    return (
        <>
            {/* Mobile Quick Dropdown */}
            <div className="lg:hidden">
                <Card className="border-border/70 p-3 shadow-2xs">
                    <Label className="text-xs font-semibold text-muted-foreground">
                        Pilih Jenis Laporan:
                    </Label>
                    <select
                        value={currentReportType}
                        onChange={(e) =>
                            router.visit(buildReportUrl(e.target.value))
                        }
                        className="form-select-custom mt-1.5 h-10 text-sm font-medium"
                    >
                        {reportTypes.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label} {t.is_snapshot ? '(Snapshot)' : ''}
                            </option>
                        ))}
                    </select>
                </Card>
            </div>

            {/* Desktop Sidebar Navigation */}
            <aside className="hidden space-y-4 lg:col-span-4 lg:block xl:col-span-3">
                <Card className="border-border/70 shadow-2xs">
                    <CardHeader className="border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="size-4 text-primary" />
                            <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                Katalog Laporan
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-3">
                        {REPORT_GROUPS.map((group) => (
                            <div key={group.title} className="space-y-1">
                                <p className="px-2.5 py-1 text-[11px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                                    {group.title}
                                </p>
                                <div className="space-y-0.5">
                                    {group.items.map((item) => {
                                        const typeData = reportTypes.find(
                                            (t) => t.value === item.value,
                                        );
                                        if (!typeData) return null;
                                        const isSelected =
                                            item.value === currentReportType;
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.value}
                                                href={buildReportUrl(
                                                    item.value,
                                                )}
                                                className={`group flex items-start gap-3 rounded-lg px-2.5 py-2 text-xs transition-all ${
                                                    isSelected
                                                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                                        : 'text-foreground hover:bg-muted/60'
                                                }`}
                                            >
                                                <div
                                                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md transition-colors ${
                                                    isSelected
                                                        ? 'bg-primary-foreground/20 text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                                }`}
                                                >
                                                    <Icon className="size-3.5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="truncate">
                                                            {typeData.label}
                                                        </span>
                                                        {typeData.is_snapshot && (
                                                            <span
                                                                className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                                                    isSelected
                                                                        ? 'bg-primary-foreground/25 text-primary-foreground'
                                                                        : 'bg-muted text-muted-foreground'
                                                                }`}
                                                            >
                                                                Snapshot
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p
                                                        className={`mt-0.5 line-clamp-1 text-[11px] ${
                                                            isSelected
                                                                ? 'text-primary-foreground/80 font-normal'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {item.shortDesc}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <ChevronRight className="mt-1 size-3.5 shrink-0 opacity-80" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </aside>
        </>
    );
}
