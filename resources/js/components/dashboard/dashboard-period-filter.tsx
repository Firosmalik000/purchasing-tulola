import { router } from '@inertiajs/react';
import { Calendar } from 'lucide-react';

type Props = {
    selectedMonth: number;
    selectedYear: number;
    className?: string;
};

const MONTH_NAMES = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

export function DashboardPeriodFilter({
    selectedMonth,
    selectedYear,
    className = '',
}: Props) {
    const currentYear = new Date().getFullYear();
    const availableYears = [
        currentYear - 2,
        currentYear - 1,
        currentYear,
        currentYear + 1,
    ];

    const handleChange = (month: number, year: number) => {
        router.get(
            window.location.pathname,
            { month, year },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <div
            className={`flex items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 py-1 shadow-2xs ${className}`}
        >
            <Calendar className="size-3.5 text-muted-foreground" />
            <select
                aria-label="Filter Bulan"
                value={selectedMonth}
                onChange={(e) =>
                    handleChange(Number(e.target.value), selectedYear)
                }
                className="h-6 cursor-pointer rounded border-0 bg-transparent px-1 text-xs font-semibold text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
            >
                {MONTH_NAMES.map((m) => (
                    <option
                        key={m.value}
                        value={m.value}
                        className="bg-popover text-popover-foreground"
                    >
                        {m.label}
                    </option>
                ))}
            </select>
            <span className="text-xs font-light text-muted-foreground/40">
                /
            </span>
            <select
                aria-label="Filter Tahun"
                value={selectedYear}
                onChange={(e) =>
                    handleChange(selectedMonth, Number(e.target.value))
                }
                className="h-6 cursor-pointer rounded border-0 bg-transparent px-1 text-xs font-semibold text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
            >
                {availableYears.map((y) => (
                    <option
                        key={y}
                        value={y}
                        className="bg-popover text-popover-foreground"
                    >
                        {y}
                    </option>
                ))}
            </select>
        </div>
    );
}
