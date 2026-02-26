'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification as deleteNotifDB } from '@/lib/firestore';
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Wrench, Shield, Receipt, ClipboardCheck, Fuel, Brain } from 'lucide-react';
import { formatDate, daysUntil } from '@/lib/utils';

export default function Notifications() {
    const { user, notifications, setNotifications, unreadCount } = useStore();
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (user) loadNotifications();
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;
        setLoading(true);
        const data = await getNotifications(user.uid);
        setNotifications(data);
        setLoading(false);
    };

    const handleMarkRead = async (id: string) => {
        await markNotificationRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, readStatus: true } : n));
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        await markAllNotificationsRead(user.uid);
        setNotifications(notifications.map(n => ({ ...n, readStatus: true })));
    };

    const handleDelete = async (id: string) => {
        await deleteNotifDB(id);
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.readStatus)
        : notifications;

    const typeIcons: Record<string, typeof Bell> = {
        maintenance: Wrench,
        insurance: Shield,
        tax: Receipt,
        inspection: ClipboardCheck,
        fuel: Fuel,
        ai_suggestion: Brain,
    };

    const typeColors: Record<string, string> = {
        maintenance: 'bg-orange-500/10 text-orange-500',
        insurance: 'bg-blue-500/10 text-blue-500',
        tax: 'bg-green-500/10 text-green-500',
        inspection: 'bg-purple-500/10 text-purple-500',
        fuel: 'bg-cyan-500/10 text-cyan-500',
        ai_suggestion: 'bg-pink-500/10 text-pink-500',
    };

    const priorityColors: Record<string, string> = {
        critical: 'border-l-red-500',
        high: 'border-l-orange-500',
        medium: 'border-l-yellow-500',
        low: 'border-l-green-500',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Bildirimler</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Tümünü Okundu İşaretle
                    </button>
                )}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'}`}
                >
                    Tümü ({notifications.length})
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'unread' ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'}`}
                >
                    Okunmamış ({unreadCount})
                </button>
            </div>

            {/* Notifications List */}
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-card" />)}
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        {filter === 'unread' ? 'Okunmamış bildirim yok' : 'Bildirim bulunmuyor'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Bakım, sigorta ve muayene uyarıları burada görünecektir
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredNotifications.map(notif => {
                        const Icon = typeIcons[notif.type] || Bell;
                        const colorClass = typeColors[notif.type] || 'bg-gray-500/10 text-gray-500';
                        const borderClass = priorityColors[notif.priority] || 'border-l-gray-500';
                        return (
                            <div
                                key={notif.id}
                                className={`bg-card rounded-xl border border-border border-l-4 ${borderClass} p-4 transition-all ${!notif.readStatus ? 'bg-primary/5' : 'opacity-75'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold">{notif.title}</p>
                                            {!notif.readStatus && (
                                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{notif.message}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatDate(notif.dueDate)}
                                            </span>
                                            {notif.dueDate && daysUntil(notif.dueDate) > 0 && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {daysUntil(notif.dueDate)} gün kaldı
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {!notif.readStatus && (
                                            <button onClick={() => handleMarkRead(notif.id)} className="p-1.5 rounded-lg hover:bg-accent" title="Okundu">
                                                <Check className="w-3.5 h-3.5 text-primary" />
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(notif.id)} className="p-1.5 rounded-lg hover:bg-destructive/10" title="Sil">
                                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
