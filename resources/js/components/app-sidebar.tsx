import { Link, usePage } from '@inertiajs/react';
import {
    Boxes,
    Building2,
    ChartNoAxesCombined,
    ChevronDown,
    ClipboardList,
    LayoutDashboard,
    ListChecks,
    PackageCheck,
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
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
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
    defaultOpen = true,
}: CollapsibleNavGroupProps) {
    const { isCurrentUrl } = useCurrentUrl();
    const hasActiveChild = items.some((item) => isCurrentUrl(item.href));
    const [isOpen, setIsOpen] = useState(defaultOpen || hasActiveChild);

    if (items.length === 0) return null;

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="group/collapsible px-2 py-1"
        >
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground group-data-[state=open]/collapsible:text-foreground"
                >
                    <div className="flex items-center gap-2">
                        <Icon className="size-3.5 text-primary/80" />
                        <span className="uppercase text-[11px] font-bold tracking-wider">{label}</span>
                    </div>
                    <ChevronDown className="size-3.5 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-1">
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
                                    className="h-8 rounded-md transition-colors hover:bg-amber-500/10 data-[active=true]:bg-amber-500/15 data-[active=true]:font-semibold data-[active=true]:text-amber-950 dark:data-[active=true]:text-amber-300"
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && (
                                            <item.icon className="size-3.5 shrink-0" />
                                        )}
                                        <span className="truncate text-xs">{item.title}</span>
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

    // Central Groups
    const centralOperasional: NavItem[] = [
        { title: 'Antrean Permintaan', href: '/central/requests', icon: ClipboardList },
    ];
    if (auth.permissions.manageOrders) {
        centralOperasional.push({
            title: 'Purchase Planning',
            href: '/central/purchase-planning',
            icon: ListChecks,
        });
    }
    centralOperasional.push({
        title: 'Pesanan Pembelian (PO)',
        href: '/central/orders',
        icon: ShoppingCart,
    });

    const centralInventory: NavItem[] = [];
    if (auth.permissions.manageInventory) {
        centralInventory.push({
            title: 'Manajemen Stok & Audit',
            href: '/central/inventory',
            icon: Warehouse,
        });
    }

    const centralMaster: NavItem[] = [];
    if (auth.permissions.manageMasterData) {
        centralMaster.push({
            title: 'Katalog Master Item',
            href: '/central/items',
            icon: Boxes,
        });
        centralMaster.push({
            title: 'Daftar Supplier',
            href: '/central/suppliers',
            icon: Truck,
        });
    }
    if (auth.permissions.manageStores) {
        centralMaster.push({
            title: 'Toko & Butik Cabang',
            href: '/central/stores',
            icon: Store,
        });
        centralMaster.push({
            title: 'Pengguna & PIC Toko',
            href: '/central/users',
            icon: Users,
        });
    }

    const centralReports: NavItem[] = [];
    if (auth.permissions.viewManagementReports) {
        centralReports.push({
            title: 'Laporan Manajemen',
            href: '/central/reports',
            icon: ChartNoAxesCombined,
        });
    }

    // Store Groups
    const storeOperasional: NavItem[] = [
        { title: 'Permintaan Toko (PR)', href: '/store/requests', icon: ClipboardList },
        { title: 'Penerimaan Barang', href: '/store/incoming', icon: PackageCheck },
    ];
    const storeInventory: NavItem[] = [
        { title: 'Posisi Stok Butik', href: '/store/inventory', icon: Warehouse },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border">
            <SidebarHeader className="border-b border-sidebar-border/60 pb-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
                            <Link href={homeUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="space-y-1.5 py-2">
                {/* Dashboard Single Button */}
                <div className="px-2">
                    <SidebarMenuButton
                        asChild
                        isActive={isCurrentUrl(homeUrl)}
                        className="h-9 font-medium transition-colors hover:bg-amber-500/10 data-[active=true]:bg-amber-500/15 data-[active=true]:font-bold data-[active=true]:text-amber-950 dark:data-[active=true]:text-amber-300"
                    >
                        <Link href={homeUrl} prefetch>
                            <LayoutDashboard className="size-4 shrink-0 text-primary" />
                            <span className="truncate">Dashboard Utama</span>
                        </Link>
                    </SidebarMenuButton>
                </div>

                {isStore ? (
                    <>
                        <CollapsibleNavGroup
                            label="Operasional Toko"
                            icon={Store}
                            items={storeOperasional}
                            defaultOpen={true}
                        />
                        <CollapsibleNavGroup
                            label="Inventaris Butik"
                            icon={Warehouse}
                            items={storeInventory}
                            defaultOpen={true}
                        />
                    </>
                ) : (
                    <>
                        <CollapsibleNavGroup
                            label="Pengadaan & PO"
                            icon={ShoppingCart}
                            items={centralOperasional}
                            defaultOpen={true}
                        />
                        {centralInventory.length > 0 && (
                            <CollapsibleNavGroup
                                label="Inventaris"
                                icon={Warehouse}
                                items={centralInventory}
                                defaultOpen={true}
                            />
                        )}
                        {centralMaster.length > 0 && (
                            <CollapsibleNavGroup
                                label="Data Master"
                                icon={Boxes}
                                items={centralMaster}
                                defaultOpen={true}
                            />
                        )}
                        {centralReports.length > 0 && (
                            <CollapsibleNavGroup
                                label="Laporan & Audit"
                                icon={ChartNoAxesCombined}
                                items={centralReports}
                                defaultOpen={false}
                            />
                        )}
                    </>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/60 pt-3">
                <div className="mx-2 mb-2 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-200">
                    {isStore ? (
                        <Store className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    ) : (
                        <Building2 className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    )}
                    <span className="truncate text-[11px]">
                        {isStore ? 'Portal Butik / Toko' : 'Portal Kantor Pusat'}
                    </span>
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
