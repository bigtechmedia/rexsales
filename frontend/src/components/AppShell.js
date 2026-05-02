import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { ROLE_LABELS, initials, relativeTime } from '@/lib/utils-crm';
import { Logo } from '@/components/Logo';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    LayoutDashboard, Users, Store, PackageSearch, ShieldCheck, ClipboardList, FileText,
    MessageSquare, LogOut, Bell, Settings as SettingsIcon, Menu, Plane, Receipt, BadgeCheck,
} from 'lucide-react';

function navForRole(role) {
    const common = [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    if (role === 'owner' || role === 'admin') {
        return [
            ...common,
            { to: '/dealers', label: 'Dealers', icon: Store },
            { to: '/reports', label: 'Reports', icon: FileText },
            { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
            { to: '/requests', label: 'My Requests', icon: Receipt },
            { to: '/messages', label: 'Messages', icon: MessageSquare },
            { to: '/teams', label: 'Teams', icon: BadgeCheck },
            { to: '/products', label: 'Products', icon: PackageSearch },
            { to: '/users', label: 'Users', icon: Users },
        ];
    }
    if (role === 'manager') {
        return [
            ...common,
            { to: '/dealers', label: 'Dealers', icon: Store },
            { to: '/reports', label: 'Reports', icon: FileText },
            { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
            { to: '/requests', label: 'My Requests', icon: Receipt },
            { to: '/messages', label: 'Messages', icon: MessageSquare },
            { to: '/teams', label: 'Teams', icon: BadgeCheck },
            { to: '/products', label: 'Products', icon: PackageSearch },
        ];
    }
    if (role === 'sales_rep') {
        return [
            ...common,
            { to: '/dealers', label: 'My Dealers', icon: Store },
            { to: '/reports', label: 'My Reports', icon: FileText },
            { to: '/reports/new', label: 'New Report', icon: ClipboardList },
            { to: '/requests', label: 'Expense / Leave / Travel', icon: Plane },
            { to: '/messages', label: 'Messages', icon: MessageSquare },
            { to: '/products', label: 'Products', icon: PackageSearch },
        ];
    }
    // dealer
    return [
        ...common,
        { to: '/reports/new', label: 'New Enquiry', icon: ClipboardList },
        { to: '/reports', label: 'My Enquiries', icon: FileText },
        { to: '/messages', label: 'Messages', icon: MessageSquare },
        { to: '/products', label: 'Products', icon: PackageSearch },
    ];
}

function NavItems({ items, onNav }) {
    return (
        <nav className="flex flex-col gap-1" aria-label="Primary">
            {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === '/dashboard'}
                    onClick={() => onNav && onNav()}
                    className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                            isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground hover:bg-muted/70'
                        }`
                    }
                    data-testid={`nav-${to.replace(/\//g, '-').replace(/^-/, '')}`}
                >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

function NotificationBell() {
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const unread = items.filter((n) => !n.read).length;

    const load = async () => {
        try {
            const { data } = await api.get('/notifications');
            setItems(data);
        } catch { /* noop */ }
    };
    useEffect(() => {
        load();
        const id = setInterval(load, 10000);
        return () => clearInterval(id);
    }, []);

    const onClick = async (n) => {
        try { await api.post(`/notifications/${n.notification_id}/read`); } catch {}
        setOpen(false);
        if (n.link) navigate(n.link);
        load();
    };

    const markAll = async () => {
        try { await api.post('/notifications/read-all'); } catch {}
        load();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="notifications-bell" aria-label="Notifications">
                    <Bell className="h-5 w-5" />
                    {unread > 0 && (
                        <span className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unread > 0 && <button className="text-xs text-primary hover:underline" onClick={markAll} data-testid="notifications-mark-all-read">Mark all read</button>}
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-96">
                    {items.length === 0 && <div className="p-4 text-xs text-muted-foreground text-center" data-testid="notifications-empty">No notifications yet</div>}
                    {items.map((n) => (
                        <button
                            key={n.notification_id}
                            onClick={() => onClick(n)}
                            className={`w-full text-left px-3 py-2 hover:bg-muted/50 ${!n.read ? 'bg-secondary/40' : ''}`}
                            data-testid={`notification-item-${n.notification_id}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{n.title}</div>
                                    {n.body && <div className="text-xs text-muted-foreground truncate">{n.body}</div>}
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0">{relativeTime(n.created_at)}</span>
                            </div>
                        </button>
                    ))}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function AppShell() {
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const items = useMemo(() => navForRole(user?.role), [user?.role]);

    const onLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex bg-background relative app-noise">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex w-[272px] shrink-0 flex-col border-r bg-secondary/40 backdrop-blur-sm">
                <div className="h-14 flex items-center px-5 border-b"><Logo /></div>
                <ScrollArea className="flex-1">
                    <div className="p-3">
                        <NavItems items={items} />
                    </div>
                </ScrollArea>
                <div className="p-3 border-t">
                    <UserCard user={user} onLogout={onLogout} />
                </div>
            </aside>

            {/* Mobile sidebar */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="p-0 w-[270px]">
                    <div className="h-14 flex items-center px-5 border-b"><Logo /></div>
                    <div className="p-3"><NavItems items={items} onNav={() => setMobileOpen(false)} /></div>
                    <Separator />
                    <div className="p-3"><UserCard user={user} onLogout={onLogout} /></div>
                </SheetContent>
            </Sheet>

            {/* Main area */}
            <div className="flex-1 min-w-0 flex flex-col relative z-[1]">
                <header className="h-14 border-b bg-card/70 backdrop-blur-sm flex items-center gap-2 px-4 lg:px-6 sticky top-0 z-20">
                    <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" data-testid="mobile-menu-button" onClick={() => setMobileOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Signed in as</span>
                        <Badge variant="outline" className="font-normal" data-testid="header-role-badge">{ROLE_LABELS[user?.role] || user?.role}</Badge>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                        <NotificationBell />
                        <UserMenu user={user} onLogout={onLogout} />
                    </div>
                </header>
                <main key={location.pathname} className="flex-1 min-w-0 page-fade">
                    <div className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8 py-6 md:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

function UserCard({ user, onLogout }) {
    if (!user) return null;
    return (
        <div className="rounded-xl bg-card border p-3">
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
                <NavLink to="/settings" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="nav-settings-link">
                    <SettingsIcon className="h-3.5 w-3.5" /> Settings
                </NavLink>
                <button onClick={onLogout} className="ml-auto text-xs text-muted-foreground hover:text-destructive flex items-center gap-1" data-testid="logout-button">
                    <LogOut className="h-3.5 w-3.5" /> Logout
                </button>
            </div>
        </div>
    );
}

function UserMenu({ user, onLogout }) {
    const navigate = useNavigate();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full hover:bg-muted px-1.5 py-1" data-testid="user-menu-trigger">
                    <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-semibold">{initials(user?.name)}</AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="truncate">{user?.name}</span>
                    <span className="text-xs font-normal text-muted-foreground truncate">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')} data-testid="user-menu-settings"><SettingsIcon className="h-4 w-4 mr-2" /> Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} data-testid="user-menu-logout"><LogOut className="h-4 w-4 mr-2" /> Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
