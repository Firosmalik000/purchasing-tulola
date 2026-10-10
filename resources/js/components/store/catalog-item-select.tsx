import { Check, ChevronDown, Search, X } from 'lucide-react';
import {
    type KeyboardEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type CatalogCategory = {
    id: number;
    name: string;
    code?: string | null;
};

export type CatalogUnit = {
    id?: number;
    name?: string;
    symbol: string;
};

export type CatalogItem = {
    id: number;
    sku: string;
    name: string;
    item_category_id?: number | null;
    category?: CatalogCategory | null;
    unit?: CatalogUnit;
};

interface CatalogItemSelectProps {
    name: string;
    value: string;
    onChange: (itemId: string, item?: CatalogItem) => void;
    items: CatalogItem[];
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    className?: string;
    error?: string;
}

export function CatalogItemSelect({
    name,
    value,
    onChange,
    items,
    disabled = false,
    required = false,
    placeholder = 'Pilih barang dari katalog...',
    className,
    error,
}: CatalogItemSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('ALL');
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const optionsListRef = useRef<HTMLDivElement>(null);

    // Selected item
    const selectedItem = useMemo(
        () => items.find((item) => String(item.id) === String(value)),
        [items, value],
    );

    // Extract categories maintaining catalog order
    const categories = useMemo(() => {
        const catMap = new Map<
            string,
            { id: string; name: string; count: number }
        >();
        items.forEach((item) => {
            const key = item.category?.name
                ? String(item.category.id)
                : 'uncategorized';
            const name = item.category?.name ?? 'Lainnya';
            const current = catMap.get(key);
            if (current) {
                current.count += 1;
            } else {
                catMap.set(key, { id: key, name, count: 1 });
            }
        });
        return Array.from(catMap.values());
    }, [items]);

    // Filter items based on search and active category tab
    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        return items.filter((item) => {
            const matchesCategory =
                activeCategory === 'ALL' ||
                (activeCategory === 'uncategorized' && !item.category) ||
                String(item.category?.id) === activeCategory;

            if (!matchesCategory) {
                return false;
            }

            if (!query) {
                return true;
            }

            const sku = item.sku.toLowerCase();
            const name = item.name.toLowerCase();
            const catName = (item.category?.name ?? '').toLowerCase();

            return (
                sku.includes(query) ||
                name.includes(query) ||
                catName.includes(query)
            );
        });
    }, [items, search, activeCategory]);

    // Group items by category
    const groupedItems = useMemo(() => {
        const groups: {
            categoryId: string;
            categoryName: string;
            items: CatalogItem[];
        }[] = [];

        const groupMap = new Map<
            string,
            { categoryId: string; categoryName: string; items: CatalogItem[] }
        >();

        filteredItems.forEach((item) => {
            const key = item.category?.name
                ? String(item.category.id)
                : 'uncategorized';
            const name = item.category?.name ?? 'Lainnya';
            let group = groupMap.get(key);
            if (!group) {
                group = {
                    categoryId: key,
                    categoryName: name,
                    items: [],
                };
                groupMap.set(key, group);
                groups.push(group);
            }
            group.items.push(item);
        });

        return groups;
    }, [filteredItems]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setSearch('');
            setActiveCategory('ALL');
            setHighlightedIndex(-1);
        }
    };

    const handleSelect = (item: CatalogItem) => {
        onChange(String(item.id), item);
        handleOpenChange(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange('', undefined);
    };

    // Keyboard navigation inside search input
    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (filteredItems.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev < filteredItems.length - 1 ? prev + 1 : 0,
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredItems.length - 1,
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (
                highlightedIndex >= 0 &&
                highlightedIndex < filteredItems.length
            ) {
                handleSelect(filteredItems[highlightedIndex]);
            } else if (filteredItems.length > 0) {
                handleSelect(filteredItems[0]);
            }
        }
    };

    // Scroll highlighted option into view
    useEffect(() => {
        if (highlightedIndex >= 0 && optionsListRef.current) {
            const el = optionsListRef.current.querySelector(
                `[data-option-index="${highlightedIndex}"]`,
            );
            if (el) {
                el.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    return (
        <div className={cn('relative w-full', className)}>
            {/* Hidden input for form submission */}
            <input
                type="hidden"
                name={name}
                value={value}
                required={required}
            />

            <Popover open={isOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        disabled={disabled}
                        className={cn(
                            'group flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-left text-xs shadow-2xs transition-colors outline-none',
                            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
                            isOpen && 'border-primary ring-2 ring-primary/20',
                            error
                                ? 'border-destructive'
                                : 'border-input hover:border-muted-foreground/40 hover:bg-muted/10',
                            disabled &&
                                'cursor-not-allowed bg-muted/40 opacity-50',
                        )}
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                    >
                        {selectedItem ? (
                            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                                <span className="truncate font-medium text-foreground">
                                    {selectedItem.name}
                                </span>
                                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                                    {selectedItem.sku}
                                </span>
                            </div>
                        ) : (
                            <span className="truncate text-muted-foreground">
                                {placeholder}
                            </span>
                        )}

                        <div className="flex shrink-0 items-center gap-1">
                            {selectedItem && !disabled && (
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={handleClear}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                        ) {
                                            e.preventDefault();
                                            handleClear(
                                                e as unknown as React.MouseEvent,
                                            );
                                        }
                                    }}
                                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    title="Reset"
                                >
                                    <X className="size-3.5" />
                                </span>
                            )}
                            <ChevronDown
                                className={cn(
                                    'size-3.5 text-muted-foreground transition-transform duration-150',
                                    isOpen && 'rotate-180 text-foreground',
                                )}
                            />
                        </div>
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    sideOffset={4}
                    className="z-[70] flex w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 shadow-xl sm:min-w-[360px] sm:max-w-[480px]"
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        searchInputRef.current?.focus();
                    }}
                >
                    {/* Filter Input */}
                    <div className="border-b border-border/50 bg-muted/20 p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleInputKeyDown}
                                placeholder="Cari nama barang atau SKU..."
                                className="h-8 w-full rounded border border-input bg-background pr-7 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/40 focus:outline-none"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-3" />
                                </button>
                            )}
                        </div>

                        {/* Category Tabs */}
                        {categories.length > 1 && (
                            <div className="mt-1.5 flex scrollbar-none items-center gap-1 overflow-x-auto pb-0.5 text-[11px]">
                                <button
                                    type="button"
                                    onClick={() => setActiveCategory('ALL')}
                                    className={cn(
                                        'shrink-0 rounded px-2 py-0.5 font-medium transition-colors',
                                        activeCategory === 'ALL'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    Semua ({items.length})
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() =>
                                            setActiveCategory(
                                                activeCategory === cat.id
                                                    ? 'ALL'
                                                    : cat.id,
                                            )
                                        }
                                        className={cn(
                                            'shrink-0 rounded px-2 py-0.5 font-medium transition-colors',
                                            activeCategory === cat.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                                        )}
                                    >
                                        {cat.name} ({cat.count})
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Options List */}
                    <div
                        ref={optionsListRef}
                        className="max-h-60 overflow-y-auto p-1 text-xs"
                    >
                        {filteredItems.length === 0 ? (
                            <div className="py-6 text-center text-xs text-muted-foreground">
                                Tidak ada item yang sesuai.
                            </div>
                        ) : (
                            groupedItems.map((group) => (
                                <div key={group.categoryId} className="py-0.5">
                                    {/* Category Header */}
                                    <div className="sticky top-0 z-10 bg-popover/95 px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase backdrop-blur-xs">
                                        {group.categoryName}
                                    </div>

                                    {/* Items */}
                                    <div className="space-y-0.5">
                                        {group.items.map((item) => {
                                            const flatIndex =
                                                filteredItems.findIndex(
                                                    (fi) => fi.id === item.id,
                                                );
                                            const isSelected =
                                                String(item.id) ===
                                                String(value);
                                            const isHighlighted =
                                                flatIndex === highlightedIndex;

                                            return (
                                                <div
                                                    key={item.id}
                                                    data-option-index={
                                                        flatIndex
                                                    }
                                                    onClick={() =>
                                                        handleSelect(item)
                                                    }
                                                    onMouseEnter={() =>
                                                        setHighlightedIndex(
                                                            flatIndex,
                                                        )
                                                    }
                                                    className={cn(
                                                        'flex cursor-pointer items-center justify-between gap-2 rounded px-2.5 py-1.5 transition-colors',
                                                        isSelected
                                                            ? 'bg-primary/10 font-medium text-primary'
                                                            : isHighlighted
                                                              ? 'bg-muted text-foreground'
                                                              : 'text-foreground hover:bg-muted/60',
                                                    )}
                                                >
                                                    <span className="truncate">
                                                        {item.name}
                                                    </span>

                                                    <div className="flex shrink-0 items-center gap-1.5">
                                                        <span className="font-mono text-[10px] text-muted-foreground">
                                                            {item.sku}
                                                        </span>
                                                        {isSelected && (
                                                            <Check className="size-3.5 text-primary" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
