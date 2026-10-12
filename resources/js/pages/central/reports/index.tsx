import { Head } from '@inertiajs/react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ReportCatalogNav } from '@/components/reports/report-catalog-nav';
import { ReportDataTable } from '@/components/reports/report-data-table';
import { ReportDocumentInfo } from '@/components/reports/report-document-info';
import { ReportFilterPanel } from '@/components/reports/report-filter-panel';
import { ReportSummarySignatures } from '@/components/reports/report-summary-signatures';
import { Button } from '@/components/ui/button';
import type { ReportPageProps } from '@/types/report';

export default function ReportIndex({
    report,
    reportTypes,
    stores,
    categories,
    orders,
    filters,
}: ReportPageProps) {
    const exportQuery = new URLSearchParams(
        Object.entries(filters).filter(
            ([, value]) => value !== null && value !== '',
        ) as [string, string][],
    ).toString();

    return (
        <>
            <Head title={`Laporan: ${report.title} - Purchasing Tulola`} />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    badge="Pusat Laporan"
                    title="Rekap & Analisis Purchasing"
                    description="Pantau performa pengadaan, pesanan internal, serta posisi stok cabang Tulola secara terpusat."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <a
                                    href={`/central/reports/print?${exportQuery}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Printer className="size-4" /> Cetak Lembar
                                </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <a href={`/central/reports/pdf?${exportQuery}`}>
                                    <Download className="size-4" /> Unduh PDF
                                </a>
                            </Button>
                            <Button size="sm" asChild className="gap-2">
                                <a
                                    href={`/central/reports/excel?${exportQuery}`}
                                >
                                    <FileSpreadsheet className="size-4" />{' '}
                                    Ekspor Excel
                                </a>
                            </Button>
                        </div>
                    }
                />

                {/* Master-Detail Layout */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    {/* Catalog Navigation (Sidebar Desktop / Dropdown Mobile) */}
                    <ReportCatalogNav
                        currentReportType={report.type}
                        reportTypes={reportTypes}
                        filters={filters}
                    />

                    {/* Active Report Workspace */}
                    <div className="space-y-6 lg:col-span-8 xl:col-span-9">
                        {/* 1. Header Banner & Filter Form */}
                        <ReportFilterPanel
                            report={report}
                            filters={filters}
                            stores={stores}
                            categories={categories}
                            orders={orders}
                        />

                        {/* 2. Procurement Document Metadata (if applicable) */}
                        <ReportDocumentInfo context={report.context} />

                        {/* 3. Main Data Table */}
                        <ReportDataTable
                            columns={report.columns}
                            rows={report.rows}
                        />

                        {/* 4. Summary Totals & Signatures */}
                        <ReportSummarySignatures
                            summary={report.summary}
                            signatures={report.signatures}
                        />

                        <p className="text-center text-xs text-muted-foreground">
                            Dokumen dibuat otomatis pada {report.generated_at} ·
                            Seluruh data bersumber dari catatan transaksi asli
                            Purchasing Tulola.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}

ReportIndex.layout = {
    breadcrumbs: [
        { title: 'Portal Pusat', href: '/central/dashboard' },
        { title: 'Laporan', href: '/central/reports' },
    ],
};
