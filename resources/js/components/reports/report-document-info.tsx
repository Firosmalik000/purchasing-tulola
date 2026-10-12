import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Props = {
    context: Record<string, string>;
};

export function ReportDocumentInfo({ context }: Props) {
    if (Object.keys(context).length === 0) return null;

    const isConsolidated = context['Order No']?.includes('Konsolidasi');

    return (
        <Card className="border-border/70 shadow-2xs">
            <CardHeader className="border-b border-border/60 bg-muted/20 py-2.5 px-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {isConsolidated
                            ? 'Informasi Distribusi Stok Purchasing'
                            : 'Informasi Dokumen Purchasing'}
                    </span>
                    {context['Order No'] && (
                        <Badge variant="outline">{context['Order No']}</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <dl
                    className={`grid grid-cols-2 divide-x divide-y divide-border/60 sm:grid-cols-3 ${
                        Object.keys(context).length <= 5
                            ? 'lg:grid-cols-5'
                            : 'lg:grid-cols-6'
                    }`}
                >
                    {Object.entries(context).map(([label, value]) => (
                        <div key={label} className="p-3">
                            <dt className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                {label}
                            </dt>
                            <dd className="mt-1 truncate text-xs font-semibold text-foreground">
                                {value || '—'}
                            </dd>
                        </div>
                    ))}
                </dl>
            </CardContent>
        </Card>
    );
}
