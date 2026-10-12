import { Card, CardContent } from '@/components/ui/card';
import type { ReportSummaryItem } from '@/types/report';
import { formatReportCell } from './report-utils';

type Props = {
    summary: ReportSummaryItem[];
    signatures: Record<string, string>;
};

export function ReportSummarySignatures({ summary, signatures }: Props) {
    const hasSummary = summary.length > 0;
    const hasSignatures = Object.keys(signatures).length > 0;

    if (!hasSummary && !hasSignatures) return null;

    return (
        <Card className="border-border/70 shadow-2xs">
            <CardContent className="grid gap-6 p-5 md:grid-cols-2">
                {hasSummary && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Ringkasan Total Akumulasi
                        </p>
                        <div className="space-y-2">
                            {summary.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex max-w-md items-center justify-between gap-4 rounded-lg border border-border/70 bg-card px-4 py-2.5 shadow-2xs"
                                >
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {item.label}
                                    </span>
                                    <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                                        {formatReportCell(
                                            item.value,
                                            item.format,
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {hasSignatures && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Otorisasi & Pengesahan
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {Object.entries(signatures).map(([label, name]) => (
                                <div
                                    key={label}
                                    className="flex flex-col justify-between rounded-lg border border-border/70 bg-card p-3 text-center"
                                >
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                                        {label}
                                    </p>
                                    <div className="h-9" />
                                    <p className="truncate border-t border-border/50 pt-1.5 text-xs font-semibold text-foreground">
                                        {name}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
