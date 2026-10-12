export type ReportColumn = {
    key: string;
    label: string;
    format: 'text' | 'currency' | 'quantity' | 'integer';
    align: 'left' | 'right' | 'center';
};

export type ReportSummaryItem = {
    label: string;
    value: string;
    format: string;
};

export type ReportData = {
    type: string;
    title: string;
    description: string;
    period: string;
    generated_at: string;
    is_snapshot: boolean;
    columns: ReportColumn[];
    rows: Record<string, string | number | null>[];
    context: Record<string, string>;
    summary: ReportSummaryItem[];
    signatures: Record<string, string>;
};

export type ReportFilters = {
    report: string;
    date_from: string;
    date_to: string;
    store_id: number | null;
    category_id: number | null;
    order_id: number | null;
};

export type ReportTypeOption = {
    value: string;
    label: string;
    description: string;
    is_snapshot: boolean;
};

export type StoreOption = {
    id: number;
    code: string;
    name: string;
};

export type CategoryOption = {
    id: number;
    code: string;
    name: string;
};

export type OrderOption = {
    id: number;
    number: string;
    order_date: string;
};

export type ReportPageProps = {
    report: ReportData;
    reportTypes: ReportTypeOption[];
    stores: StoreOption[];
    categories: CategoryOption[];
    orders: OrderOption[];
    filters: ReportFilters;
};
