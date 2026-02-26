'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getKmLogs, addKmLog as addKmLogDB, updateKmLog as updateKmLogDB, deleteKmLog as deleteKmLogDB } from '@/lib/firestore';
import { KmLog } from '@/types';
import { Gauge, Plus, TrendingUp, Calendar, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { formatNumber, formatShortDate } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function KmTracking() {
    const { selectedVehicle, kmLogs, setKmLogs, vehicles, setSelectedVehicle } = useStore();
    const [loading, setLoading] = useState(false);
    const [quickKm, setQuickKm] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingLog, setEditingLog] = useState<KmLog | null>(null);

    useEffect(() => {
        if (selectedVehicle) loadKmLogs();
    }, [selectedVehicle]);

    const loadKmLogs = async () => {
        if (!selectedVehicle) return;
        setLoading(true);
        try {
            const logs = await getKmLogs(selectedVehicle.id);
            setKmLogs(logs);
        } catch (error) {
            console.error('Error loading KM logs:', error);
        }
        setLoading(false);
    };

    const handleQuickKm = async () => {
        if (!selectedVehicle || !quickKm) return;
        const kmValue = parseInt(quickKm);
        if (isNaN(kmValue) || kmValue <= 0) return;

        // If not editing, check if it's greater than current
        if (!editingLog && kmValue <= selectedVehicle.currentKm) {
            alert('Yeni KM değeri mevcut KM\'den büyük olmalıdır');
            return;
        }

        setSaving(true);
        try {
            if (editingLog) {
                await updateKmLogDB(editingLog.id, {
                    kmValue,
                    vehicleId: selectedVehicle.id
                });
                await loadKmLogs();
                setEditingLog(null);
            } else {
                const log: Omit<KmLog, 'id'> = {
                    vehicleId: selectedVehicle.id,
                    kmValue,
                    entryDate: new Date().toISOString().split('T')[0],
                    createdAt: new Date(),
                };
                const id = await addKmLogDB(log);
                useStore.getState().addKmLog({ ...log, id });
                useStore.getState().updateVehicle(selectedVehicle.id, { currentKm: kmValue });
            }
            setQuickKm('');
        } catch (error) {
            console.error('Error saving KM:', error);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteKmLogDB(id);
            setKmLogs(kmLogs.filter(l => l.id !== id));
        } catch (error) {
            console.error('Error deleting KM:', error);
        }
    };

    const handleEdit = (log: KmLog) => {
        setEditingLog(log);
        setQuickKm(log.kmValue.toString());
    };

    // Chart data
    const chartData = [...kmLogs]
        .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())
        .map(log => ({
            date: new Date(log.entryDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
            km: log.kmValue,
        }));

    // Calculate daily avg
    const dailyAvg = kmLogs.length >= 2 ? (() => {
        const sorted = [...kmLogs].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
        const firstDate = new Date(sorted[0].entryDate);
        const lastDate = new Date(sorted[sorted.length - 1].entryDate);
        const days = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
        const kmDiff = sorted[sorted.length - 1].kmValue - sorted[0].kmValue;
        return Math.round(kmDiff / days);
    })() : 0;

    // Vehicle selector
    if (!selectedVehicle) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">KM Takibi</h2>
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                    <Gauge className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Araç Seçin</h3>
                    <p className="text-sm text-muted-foreground mb-6">KM takibi için bir araç seçmeniz gerekiyor</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-lg mx-auto">
                        {vehicles.map(v => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVehicle(v)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
                            >
                                <Gauge className="w-4 h-4 text-primary" />
                                <div className="text-left">
                                    <p className="text-xs font-semibold">{v.plateNumber}</p>
                                    <p className="text-[10px] text-muted-foreground">{formatNumber(v.currentKm)} km</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">KM Takibi</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedVehicle.plateNumber} · {selectedVehicle.brand} {selectedVehicle.model}</p>
                </div>
                <select
                    value={selectedVehicle.id}
                    onChange={e => {
                        const v = vehicles.find(v => v.id === e.target.value);
                        if (v) setSelectedVehicle(v);
                    }}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-sm"
                >
                    {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plateNumber}</option>
                    ))}
                </select>
            </div>

            {/* Quick KM Entry */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-5 h-5" />
                    <h3 className="font-semibold">Hızlı KM Girişi</h3>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="number"
                            value={quickKm}
                            onChange={e => setQuickKm(e.target.value)}
                            placeholder={editingLog ? "Duzenle" : `Mevcut: ${formatNumber(selectedVehicle.currentKm)} km`}
                            className="w-full bg-white/20 backdrop-blur text-white placeholder-white/60 border border-white/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/30 outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/60">km</span>
                    </div>
                    {editingLog && (
                        <button onClick={() => { setEditingLog(null); setQuickKm(''); }}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all">
                            İptal
                        </button>
                    )}
                    <button
                        onClick={handleQuickKm}
                        disabled={saving || !quickKm}
                        className="bg-white text-blue-600 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {editingLog ? 'Guncelle' : 'Kaydet'}
                    </button>
                </div>
                <p className="text-xs text-white/60 mt-2">
                    Güncel KM: {formatNumber(selectedVehicle.currentKm)} km
                    {dailyAvg > 0 && ` · Günlük Ort: ${dailyAvg} km`}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-2xl border border-border p-4">
                    <Gauge className="w-4 h-4 text-primary mb-2" />
                    <p className="text-lg font-bold">{formatNumber(selectedVehicle.currentKm)}</p>
                    <p className="text-xs text-muted-foreground">Güncel KM</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                    <TrendingUp className="w-4 h-4 text-green-500 mb-2" />
                    <p className="text-lg font-bold">{dailyAvg > 0 ? formatNumber(dailyAvg * 30) : '-'}</p>
                    <p className="text-xs text-muted-foreground">Aylık Ort KM</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                    <Calendar className="w-4 h-4 text-orange-500 mb-2" />
                    <p className="text-lg font-bold">{kmLogs.length}</p>
                    <p className="text-xs text-muted-foreground">Toplam Giriş</p>
                </div>
            </div>

            {/* Chart */}
            {chartData.length > 1 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-semibold text-sm mb-4">KM Trend Grafiği</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="kmGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="km" stroke="hsl(221, 83%, 53%)" fill="url(#kmGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* KM Log History */}
            <div className="bg-card rounded-2xl border border-border">
                <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-sm">KM Geçmişi</h3>
                </div>
                <div className="divide-y divide-border">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">Yükleniyor...</div>
                    ) : kmLogs.length === 0 ? (
                        <div className="p-8 text-center">
                            <AlertCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Henüz KM kaydı bulunmuyor</p>
                        </div>
                    ) : (
                        kmLogs.map((log, i) => (
                            <div key={log.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                        {kmLogs.length - i}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{formatNumber(log.kmValue)} km</p>
                                        <p className="text-xs text-muted-foreground">{formatShortDate(log.entryDate)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {i < kmLogs.length - 1 && (
                                        <span className="text-xs text-green-500 font-medium mr-2">
                                            +{formatNumber(log.kmValue - kmLogs[i + 1].kmValue)} km
                                        </span>
                                    )}
                                    <button onClick={() => handleEdit(log)} className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
                                        <Pencil className="w-3.5 h-3.5 text-primary" />
                                    </button>
                                    <button onClick={() => handleDelete(log.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
