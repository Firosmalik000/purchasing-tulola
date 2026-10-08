import { Link, usePage } from '@inertiajs/react';
import {
    Boxes,
    Building2,
    ChartNoAxesCombined,
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
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
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
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    if (items.length === 0) return null;

    return (
        <SidebarGroup className="px-2 py-1.5">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                {label}
            </SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="transition-colors hover:bg-amber-500/10 data-[active=true]:bg-amber-500/15 data-[active=true]:font-semibold data-[active=true]:text-amber-950 dark:data-[active=true]:text-amber-300"
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && (
                                    <item.icon className="size-4 shrink-0" />
                                )}
                                <span className="truncate">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

export function AppSidebar() {
    const { auth } = usePage().props;
    const isStore = auth.user.role === 'STORE_PIC';
    const homeUrl = isStore ? '/store/dashboard' : '/central/dashboard';

    // Central Groups
    const centralOperasional: NavItem[] = [
        { title: 'Dashboard', href: '/central/dashboard', icon: LayoutDashboard },
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
        title: 'Pesanan (PO)',
        href: '/central/orders',
        icon: ShoppingCart,
    });

    const centralInventory: NavItem[] = [];
    if (auth.permissions.manageInventory) {
        centralInventory.push({
            title: 'Manajemen Stok',
            href: '/central/inventory',
            icon: Warehouse,
        });
    }

    const centralMaster: NavItem[] = [];
    if (auth.permissions.manageMasterData) {
        centralMaster.push({
            title: 'Master Item',
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
            title: 'Toko Cabang',
            href: '/central/stores',
            icon: Store,
        });
        centralMaster.push({
            title: 'Pengguna & PIC',
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
        { title: 'Dashboard', href: '/store/dashboard', icon: LayoutDashboard },
        { title: 'Permintaan Toko', href: '/store/requests', icon: ClipboardList },
        { title: 'Barang Masuk', href: '/store/incoming', icon: PackageCheck },
    ];
    const storeInventory: NavItem[] = [
        { title: 'Posisi Stok Toko', href: '/store/inventory', icon: Warehouse },
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

            <SidebarContent className="space-y-1 py-2">
                {isStore ? (
                    <>
                        <NavSection label="Operasional Toko" items={storeOperasional} />
                        <NavSection label="Inventaris" items={storeInventory} />
                    </>
                ) : (
                    <>
                        <NavSection label="Pengadaan & Operasional" items={centralOperasional} />
                        {centralInventory.length > 0 && (
                            <NavSection label="Inventaris & Logistik" items={centralInventory} />
                        )}
                        {centralMaster.length > 0 && (
                            <NavSection label="Data Master" items={centralMaster} />
                        )}
                        {centralReports.length > 0 && (
                            <NavSection label="Analisis" items={centralReports} />
                        )}
                    </>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/60 pt-3">
                <div className="mx-2 mb-2 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                    {isStore ? (
                        <Store className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    ) : (
                        <Building2 className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    )}
                    <span className="truncate">
                        {isStore ? 'Portal Butik / Toko' : 'Portal Kantor Pusat'}
                    </span>
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
