'use client';

import { useStore } from '@/lib/store';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from 'next-themes';
import {
    LayoutDashboard,
    Car,
    Gauge,
    Fuel,
    Wrench,
    Shield,
    Receipt,
    ClipboardCheck,
    CircleDot,
    Bell,
    Brain,
    LogOut,
    Moon,
    Sun,
    Menu,
    X,
    ChevronLeft,
} from 'lucide-react';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Araçlarım', icon: Car },
    { id: 'km', label: 'KM Takibi', icon: Gauge },
    { id: 'fuel', label: 'Yakıt', icon: Fuel },
    { id: 'maintenance', label: 'Bakım', icon: Wrench },
    { id: 'insurance', label: 'Sigorta', icon: Shield },
    { id: 'tax', label: 'Vergi', icon: Receipt },
    { id: 'inspection', label: 'Muayene', icon: ClipboardCheck },
    { id: 'tires', label: 'Lastik', icon: CircleDot },
    { id: 'ai', label: 'AI Öneriler', icon: Brain },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
];

export default function Sidebar() {
    const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen, user, unreadCount } = useStore();
    const { logout } = useAuth();
    const { theme, setTheme } = useTheme();

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                            <Car className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm text-foreground">44AracTakip</h1>
                            <p className="text-[10px] text-muted-foreground">Araç Yönetim Sistemi</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg hover:bg-accent transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* User info */}
                {user && (
                    <div className="p-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || ''}
                                    className="w-8 h-8 rounded-full ring-2 ring-primary/20"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-xs font-semibold text-primary">
                                        {user.displayName?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                    {user.displayName}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                id={`nav-${item.id}`}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                            >
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.id === 'notifications' && unreadCount > 0 && (
                                    <span className={`min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center ${isActive ? 'bg-white/20 text-white' : 'bg-destructive text-white'
                                        }`}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-border space-y-1">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        <span>{theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}</span>
                    </button>
                    <button
                        onClick={logout}
                        id="logout-btn"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export function MobileHeader() {
    const { setSidebarOpen, activeTab, unreadCount } = useStore();

    const currentNav = navItems.find((n) => n.id === activeTab);

    return (
        <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-xl hover:bg-accent transition-colors"
                    id="mobile-menu-btn"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                    {currentNav && <currentNav.icon className="w-4 h-4 text-primary" />}
                    <span className="text-sm font-semibold">{currentNav?.label || 'Dashboard'}</span>
                </div>

                <div className="relative">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[9px] flex items-center justify-center font-bold">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}
