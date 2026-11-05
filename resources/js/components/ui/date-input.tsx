import { DatePicker } from '@/components/ui/date-picker';
import type { ComponentProps } from 'react';

export function DateInput(props: Omit<ComponentProps<typeof DatePicker>, 'valueFormat'>) {
    return <DatePicker {...props} valueFormat="iso" />;
}
