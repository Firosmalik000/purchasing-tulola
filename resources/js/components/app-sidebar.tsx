import { Link, usePage } from '@inertiajs/react';
import {
    Boxes,
    Building2,
    ChartNoAxesCombined,
    ChevronDown,
    ClipboardList,
    LayoutDashboard,
    ShoppingCart,
    Store,
    Truck,
    Users,
    Warehouse,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

type CollapsibleNavGroupProps = {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    items: NavItem[];
    defaultOpen?: boolean;
};

function CollapsibleNavGroup({
    label,
    icon: Icon,
    items,
    defaultOpen = false,
}: CollapsibleNavGroupProps) {
    const { isCurrentUrl } = useCurrentUrl();
    const hasActiveChild = items.some((item) => isCurrentUrl(item.href));
    // Default collapsed (closed) unless user is currently on one of the child pages!
    const [isOpen, setIsOpen] = useState(hasActiveChild || defaultOpen);

    if (items.length === 0) return null;

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="group/collapsible px-2 py-0.5"
        >
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors group-data-[state=open]/collapsible:text-foreground hover:bg-muted/60 hover:text-foreground"
                >
                    <div className="flex items-center gap-2">
                        <Icon className="size-3.5 text-muted-foreground" />
                        <span className="text-[11px] font-semibold tracking-wider uppercase">
                            {label}
                        </span>
                    </div>
                    <ChevronDown className="size-3 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-0.5">
                <SidebarMenu className="gap-0.5 pl-1.5">
                    {items.map((item) => {
                        const active = isCurrentUrl(item.href);
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={active}
                                    size="sm"
                                    tooltip={{ children: item.title }}
                                    className="h-7.5 rounded-md text-xs transition-colors hover:bg-muted data-[active=true]:bg-primary data-[active=true]:font-medium data-[active=true]:text-primary-foreground"
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && (
                                            <item.icon className="size-3.5 shrink-0" />
                                        )}
                                        <span className="truncate">
                                            {item.title}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </CollapsibleContent>
        </Collapsible>
    );
}

export function AppSidebar() {
    const { auth } = usePage().props;
    const isStore = auth.user.role === 'STORE_PIC';
    const homeUrl = isStore ? '/store/dashboard' : '/central/dashboard';
    const { isCurrentUrl } = useCurrentUrl();

    // Central Groups with compact concise labels
    const centralOperasional: NavItem[] = [
        {
            title: 'Permintaan (PR)',
            href: '/central/requests',
            icon: ClipboardList,
        },
    ];
    centralOperasional.push({
        title: 'Order Internal',
        href: '/central/orders',
        icon: ShoppingCart,
    });

    const centralInventory: NavItem[] = [];
    if (auth.permissions.manageInventory) {
        centralInventory.push({
            title: 'Stok & Mutasi',
            href: '/central/inventory',
            icon: Warehouse,
        });
    }

    const centralMaster: NavItem[] = [];
    if (auth.permissions.manageMasterData) {
        centralMaster.push({
            title: 'Katalog Barang',
            href: '/central/items',
            icon: Boxes,
        });
        centralMaster.push({
            title: 'Supplier',
            href: '/central/suppliers',
            icon: Truck,
        });
    }
    if (auth.permissions.manageStores) {
        centralMaster.push({
            title: 'Toko & Cabang',
            href: '/central/stores',
            icon: Store,
        });
        centralMaster.push({
            title: 'Pengguna',
            href: '/central/users',
            icon: Users,
        });
    }

    const centralReports: NavItem[] = [];
    if (auth.permissions.viewManagementReports) {
        centralReports.push({
            title: 'Rekap & Analisis',
            href: '/central/reports',
            icon: ChartNoAxesCombined,
        });
    }

    // Store Groups
    const storeOperasional: NavItem[] = [
        {
            title: 'Permintaan (PR)',
            href: '/store/requests',
            icon: ClipboardList,
        },
        { title: 'Order Toko', href: '/store/incoming', icon: Truck },
    ];

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-sidebar-border"
        >
            <SidebarHeader className="border-b border-sidebar-border/60 px-3 py-2.5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="hover:bg-transparent"
                        >
                            <Link href={homeUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="space-y-1 py-2">
                {/* Dashboard Single Button */}
                <div className="px-2">
                    <SidebarMenuButton
                        asChild
                        isActive={isCurrentUrl(homeUrl)}
                        className="h-8 text-xs font-medium transition-colors hover:bg-muted data-[active=true]:bg-primary data-[active=true]:font-semibold data-[active=true]:text-primary-foreground"
                    >
                        <Link href={homeUrl} prefetch>
                            <LayoutDashboard className="size-3.5 shrink-0" />
                            <span className="truncate">Dashboard</span>
                        </Link>
                    </SidebarMenuButton>
                </div>

                {isStore ? (
                    <CollapsibleNavGroup
                        label="Operasional"
                        icon={Store}
                        items={storeOperasional}
                        defaultOpen={true}
                    />
                ) : (
                    <>
                        <CollapsibleNavGroup
                            label="Pengadaan"
                            icon={ShoppingCart}
                            items={centralOperasional}
                            defaultOpen={false}
                        />
                        {centralInventory.length > 0 && (
                            <CollapsibleNavGroup
                                label="Inventaris"
                                icon={Warehouse}
                                items={centralInventory}
                                defaultOpen={false}
                            />
                        )}
                        {centralMaster.length > 0 && (
                            <CollapsibleNavGroup
                                label="Master Data"
                                icon={Boxes}
                                items={centralMaster}
                                defaultOpen={false}
                            />
                        )}
                        {centralReports.length > 0 && (
                            <CollapsibleNavGroup
                                label="Laporan"
                                icon={ChartNoAxesCombined}
                                items={centralReports}
                                defaultOpen={false}
                            />
                        )}
                    </>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/60 p-2">
                <div className="mb-1.5 flex items-center gap-2 rounded-md border border-border/80 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                    {isStore ? (
                        <Store className="size-3 shrink-0" />
                    ) : (
                        <Building2 className="size-3 shrink-0" />
                    )}
                    <span className="truncate text-[11px] font-medium">
                        {isStore ? 'Portal Toko Cabang' : 'Pusat Operasional'}
                    </span>
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
