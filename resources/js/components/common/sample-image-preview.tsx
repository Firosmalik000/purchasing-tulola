import { Expand } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type SampleImagePreviewProps = {
    src: string;
    itemName: string;
    className?: string;
};

export function SampleImagePreview({
    src,
    itemName,
    className = '',
}: SampleImagePreviewProps) {
    const alt = `Foto sampel ${itemName}`;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className={`group relative block size-28 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted/30 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${className}`}
                    aria-label={`Lihat preview foto sampel ${itemName}`}
                >
                    <img
                        src={src}
                        alt={alt}
                        className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/65 px-2 py-1 text-[10px] font-medium text-white">
                        <Expand className="size-3" />
                        Lihat foto
                    </span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-hidden p-4 sm:max-w-4xl">
                <DialogHeader className="pr-8">
                    <DialogTitle className="text-base">
                        Foto Sampel — {itemName}
                    </DialogTitle>
                    <DialogDescription>
                        Referensi visual untuk permintaan khusus/non-katalog.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-lg bg-muted/30 p-2">
                    <img
                        src={src}
                        alt={alt}
                        className="max-h-[72vh] max-w-full object-contain"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
