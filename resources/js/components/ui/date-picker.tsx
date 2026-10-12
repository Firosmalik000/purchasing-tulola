import * as React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    name?: string;
    defaultValue?: string;
    value?: string;
    onChange?: (val: string) => void;
    placeholder?: string;
    title?: string;
    className?: string;
    disabled?: boolean;
}

const MONTH_NAMES = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function parseDateValue(val?: string | null): Date | null {
    if (!val) return null;
    const trimmed = val.trim();
    if (!trimmed) return null;

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1;
        const year = parseInt(dmyMatch[3], 10);
        const date = new Date(year, month, day);
        if (
            date.getFullYear() === year &&
            date.getMonth() === month &&
            date.getDate() === day
        ) {
            return date;
        }
    }

    // YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1;
        const day = parseInt(ymdMatch[3], 10);
        const date = new Date(year, month, day);
        if (
            date.getFullYear() === year &&
            date.getMonth() === month &&
            date.getDate() === day
        ) {
            return date;
        }
    }

    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateToDmy(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

export function DatePicker({
    name,
    defaultValue,
    value: controlledValue,
    onChange,
    placeholder = 'DD/MM/YYYY',
    title,
    className,
    disabled = false,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    // Initial value normalized to DD/MM/YYYY
    const initialText = React.useMemo(() => {
        const raw = controlledValue ?? defaultValue ?? '';
        const parsed = parseDateValue(raw);
        return parsed ? formatDateToDmy(parsed) : raw;
    }, [controlledValue, defaultValue]);

    const [inputValue, setInputValue] = React.useState(initialText);

    // Synchronize if controlled value changes
    React.useEffect(() => {
        if (controlledValue !== undefined) {
            const parsed = parseDateValue(controlledValue);
            setInputValue(parsed ? formatDateToDmy(parsed) : controlledValue);
        }
    }, [controlledValue]);

    const selectedDate = React.useMemo(() => parseDateValue(inputValue), [inputValue]);

    // Calendar navigation state
    const [viewDate, setViewDate] = React.useState(() => selectedDate || new Date());

    React.useEffect(() => {
        if (selectedDate) {
            setViewDate(selectedDate);
        }
    }, [selectedDate]);

    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setViewDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setViewDate(new Date(viewYear, viewMonth + 1, 1));
    };

    const handleSelectDay = (day: number) => {
        const newDate = new Date(viewYear, viewMonth, day);
        const formatted = formatDateToDmy(newDate);
        setInputValue(formatted);
        onChange?.(formatted);
        setOpen(false);
    };

    const handleToday = (e: React.MouseEvent) => {
        e.preventDefault();
        const today = new Date();
        const formatted = formatDateToDmy(today);
        setInputValue(formatted);
        setViewDate(today);
        onChange?.(formatted);
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault();
        setInputValue('');
        onChange?.('');
        setOpen(false);
    };

    // Auto-masking text typing for DD/MM/YYYY
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^\d\/]/g, '');

        // Auto insert slashes if user types digits sequentially
        const digits = val.replace(/\D/g, '');
        if (digits.length > 2 && digits.length <= 4) {
            val = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        } else if (digits.length > 4) {
            val = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
        }

        setInputValue(val);
        onChange?.(val);
    };

    const today = new Date();
    const isToday = (day: number) =>
        today.getDate() === day &&
        today.getMonth() === viewMonth &&
        today.getFullYear() === viewYear;

    const isSelected = (day: number) =>
        selectedDate !== null &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getFullYear() === viewYear;

    return (
        <div className="relative inline-block w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <div className="relative flex items-center">
                    <input
                        type="text"
                        name={name}
                        value={inputValue}
                        onChange={handleTextChange}
                        placeholder={placeholder}
                        title={title}
                        disabled={disabled}
                        maxLength={10}
                        autoComplete="off"
                        className={cn(
                            'h-8.5 w-full rounded-md border border-input bg-background pl-2.5 pr-8 py-1 font-mono text-xs shadow-2xs transition-colors',
                            'placeholder:text-muted-foreground/60 placeholder:font-sans focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                            disabled && 'cursor-not-allowed opacity-50',
                            className,
                        )}
                    />
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            aria-label="Pilih tanggal"
                            className="absolute right-1.5 flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <CalendarIcon className="size-3.5" />
                        </button>
                    </PopoverTrigger>
                </div>

                <PopoverContent
                    align="start"
                    sideOffset={4}
                    className="w-64 p-3 z-50 bg-popover shadow-lg border border-border"
                >
                    {/* Month & Year Navigation Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                        <span className="text-xs font-semibold text-foreground">
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6 text-muted-foreground hover:text-foreground"
                                onClick={handlePrevMonth}
                                aria-label="Bulan sebelumnya"
                            >
                                <ChevronLeft className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6 text-muted-foreground hover:text-foreground"
                                onClick={handleNextMonth}
                                aria-label="Bulan berikutnya"
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>

                    {/* Day Names Header */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {DAY_NAMES.map((d) => (
                            <div
                                key={d}
                                className="text-[10px] font-semibold text-muted-foreground py-0.5"
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="size-7" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const sel = isSelected(day);
                            const tod = isToday(day);

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleSelectDay(day)}
                                    className={cn(
                                        'size-7 rounded text-xs font-mono transition-colors flex items-center justify-center',
                                        sel
                                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                            : tod
                                              ? 'border border-primary/50 text-primary font-bold hover:bg-primary/10'
                                              : 'text-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3 pt-2 flex items-center justify-between border-t border-border/60 text-xs">
                        <button
                            type="button"
                            onClick={handleToday}
                            className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                        >
                            Hari Ini
                        </button>
                        {inputValue && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                            >
                                <X className="size-3" /> Hapus
                            </button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
