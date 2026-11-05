import { DateInput } from '@/components/ui/date-input';
import { Input } from '@/components/ui/input';

type Props = {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    className?: string;
};

export function DateTimeInput({ id, value, onChange, required, className }: Props) {
    const [date = '', time = ''] = value.split('T');

    return (
        <div className="grid grid-cols-2 gap-2">
            <DateInput
                id={id}
                value={date}
                onChange={(next) => onChange(next ? `${next}T${time || '00:00'}` : '')}
                required={required}
                className={className}
                title="Tanggal diterima (DD/MM/YYYY)"
            />
            <Input
                type="time"
                value={time}
                onChange={(event) => onChange(`${date}T${event.target.value}`)}
                required={required}
                className={className}
                aria-label="Jam diterima"
            />
        </div>
    );
}
