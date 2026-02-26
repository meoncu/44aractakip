'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getFuelLogs, addFuelLog as addFuelLogDB, updateFuelLog as updateFuelLogDB, deleteFuelLog as deleteFuelLogDB } from '@/lib/firestore';
import { FuelLog } from '@/types';
import { Fuel, Plus, TrendingUp, DollarSign, Droplets, Trash2, X, Pencil } from 'lucide-react';
import { formatNumber, formatCurrency, formatShortDate } from '@/lib/utils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';

export default function FuelTracking() {
    const { selectedVehicle, fuelLogs, setFuelLogs, vehicles, setSelectedVehicle } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingLog, setEditingLog] = useState<FuelLog | null>(null);

    const [kmAtFuel, setKmAtFuel] = useState('');
    const [fuelAmountLiter, setFuelAmountLiter] = useState('');
    const [fuelCost, setFuelCost] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [station, setStation] = useState('');

    useEffect(() => {
        if (selectedVehicle) loadFuelLogs();
    }, [selectedVehicle]);

    const loadFuelLogs = async () => {
        if (!selectedVehicle) return;
        setLoading(true);
        try {
            const logs = await getFuelLogs(selectedVehicle.id);
            setFuelLogs(logs);
        } catch (error) {
            console.error('Error loading fuel logs:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle || saving) return;
        setSaving(true);

        try {
            const currentKmValue = Number(kmAtFuel);

            if (editingLog) {
                await updateFuelLogDB(editingLog.id, {
                    kmAtFuel: currentKmValue,
                    fuelAmountLiter: Number(fuelAmountLiter),
                    fuelCost: Number(fuelCost),
                    date,
                    station,
                });
            } else {
                const log: Omit<FuelLog, 'id'> = {
                    vehicleId: selectedVehicle.id,
                    kmAtFuel: currentKmValue,
                    fuelAmountLiter: Number(fuelAmountLiter),
                    fuelCost: Number(fuelCost),
                    fuelType: selectedVehicle.fuelType,
                    date,
                    station,
                    createdAt: new Date(),
                };
                await addFuelLogDB(log);
            }

            // Update local state and global vehicle state
            await loadFuelLogs();
            useStore.getState().updateVehicle(selectedVehicle.id, { currentKm: currentKmValue });

            // Success: Close form and reset
            resetForm();
        } catch (error: any) {
            console.error('Error adding fuel log:', error);
            alert('Kayit sirasinda bir hata olustu: ' + (error.message || 'Bilinmeyen hata'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu yakıt kaydını silmek istediğinize emin misiniz?')) return;
        try {
            await deleteFuelLogDB(id);
            setFuelLogs(fuelLogs.filter(f => f.id !== id));
        } catch (error) {
            console.error('Error deleting fuel log:', error);
        }
    };

    const resetForm = () => {
        setKmAtFuel('');
        setFuelAmountLiter('');
        setFuelCost('');
        setDate(new Date().toISOString().split('T')[0]);
        setStation('');
        setEditingLog(null);
        setShowForm(false);
    };

    const handleEdit = (log: FuelLog) => {
        setEditingLog(log);
        setKmAtFuel(log.kmAtFuel.toString());
        setFuelAmountLiter(log.fuelAmountLiter.toString());
        setFuelCost(log.fuelCost.toString());
        setDate(log.date);
        setStation(log.station || '');
        setShowForm(true);
    };

    // Stats
    const totalCost = fuelLogs.reduce((acc, l) => acc + l.fuelCost, 0);
    const totalLiters = fuelLogs.reduce((acc, l) => acc + l.fuelAmountLiter, 0);
    const avgConsumption = fuelLogs.filter(l => l.calculatedConsumption && l.calculatedConsumption > 0).length > 0
        ? fuelLogs.filter(l => l.calculatedConsumption).reduce((acc, l) => acc + (l.calculatedConsumption || 0), 0) / fuelLogs.filter(l => l.calculatedConsumption).length
        : 0;

    // Monthly chart data
    const monthlyData: Record<string, { cost: number; liters: number }> = {};
    fuelLogs.forEach(l => {
        const m = l.date.substring(0, 7);
        if (!monthlyData[m]) monthlyData[m] = { cost: 0, liters: 0 };
        monthlyData[m].cost += l.fuelCost;
        monthlyData[m].liters += l.fuelAmountLiter;
    });
    const chartData = Object.keys(monthlyData).sort().slice(-8).map(m => ({
        month: new Date(m + '-01').toLocaleDateString('tr-TR', { month: 'short' }),
        cost: Math.round(monthlyData[m].cost),
        liters: Math.round(monthlyData[m].liters * 10) / 10,
    }));

    // Consumption trend
    const consumptionData = [...fuelLogs]
        .filter(l => l.calculatedConsumption && l.calculatedConsumption > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-10)
        .map(l => ({
            date: new Date(l.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
            consumption: Math.round((l.calculatedConsumption || 0) * 10) / 10,
        }));

    if (!selectedVehicle) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Yakıt Takibi</h2>
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                    <Fuel className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Araç Seçin</h3>
                    <p className="text-sm text-muted-foreground mb-6">Yakıt takibi için bir araç seçmeniz gerekiyor</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-lg mx-auto">
                        {vehicles.map(v => (
                            <button key={v.id} onClick={() => setSelectedVehicle(v)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
                            >
                                <Fuel className="w-4 h-4 text-primary" />
                                <div className="text-left">
                                    <p className="text-xs font-semibold">{v.plateNumber}</p>
                                    <p className="text-[10px] text-muted-foreground">{v.brand} {v.model}</p>
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
                    <h2 className="text-2xl font-bold">Yakıt Takibi</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedVehicle.plateNumber} · {selectedVehicle.brand} {selectedVehicle.model}</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={selectedVehicle.id} onChange={e => {
                        const v = vehicles.find(v => v.id === e.target.value);
                        if (v) setSelectedVehicle(v);
                    }} className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
                    </select>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Yakıt Ekle</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-border p-4">
                    <DollarSign className="w-4 h-4 text-green-500 mb-2" />
                    <p className="text-lg font-bold">{formatCurrency(totalCost)}</p>
                    <p className="text-xs text-muted-foreground">Toplam Harcama</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                    <Droplets className="w-4 h-4 text-blue-500 mb-2" />
                    <p className="text-lg font-bold">{totalLiters.toFixed(1)} L</p>
                    <p className="text-xs text-muted-foreground">Toplam Yakıt</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                    <TrendingUp className="w-4 h-4 text-orange-500 mb-2" />
                    <p className="text-lg font-bold">{avgConsumption > 0 ? `${avgConsumption.toFixed(1)}` : '-'}</p>
                    <p className="text-xs text-muted-foreground">L/100km Ort.</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                    <Fuel className="w-4 h-4 text-purple-500 mb-2" />
                    <p className="text-lg font-bold">{fuelLogs.length}</p>
                    <p className="text-xs text-muted-foreground">Toplam Kayıt</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chartData.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border p-6">
                        <h3 className="font-semibold text-sm mb-4">Aylık Yakıt Maliyeti</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} formatter={(v: any) => [formatCurrency(Number(v)), 'Maliyet']} />
                                <Bar dataKey="cost" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {consumptionData.length > 1 && (
                    <div className="bg-card rounded-2xl border border-border p-6">
                        <h3 className="font-semibold text-sm mb-4">Tüketim Trendi (L/100km)</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={consumptionData}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                                <Line type="monotone" dataKey="consumption" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl border border-border max-w-lg w-full animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h3 className="text-lg font-semibold">{editingLog ? 'Kaydı Düzenle' : 'Yakıt Girişi'}</h3>
                            <button onClick={resetForm} className="p-2 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">KM Değeri *</label>
                                    <input type="number" required value={kmAtFuel} onChange={e => setKmAtFuel(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        min={selectedVehicle.currentKm} placeholder={`Min: ${formatNumber(selectedVehicle.currentKm)}`}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tarih *</label>
                                    <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Litre *</label>
                                    <input type="number" required step="0.01" value={fuelAmountLiter} onChange={e => setFuelAmountLiter(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        placeholder="45.5"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tutar (₺) *</label>
                                    <input type="number" required step="0.01" value={fuelCost} onChange={e => setFuelCost(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        placeholder="1500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">İstasyon</label>
                                <input type="text" value={station} onChange={e => setStation(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="Opet, Shell..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent">İptal</button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Log History */}
            <div className="bg-card rounded-2xl border border-border">
                <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-sm">Yakıt Geçmişi</h3>
                </div>
                <div className="divide-y divide-border">
                    {fuelLogs.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">Henüz yakıt kaydı bulunmuyor</div>
                    ) : (
                        fuelLogs.map(log => (
                            <div key={log.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <Fuel className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{log.fuelAmountLiter} L · {formatCurrency(log.fuelCost)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatShortDate(log.date)} · {formatNumber(log.kmAtFuel)} km
                                            {log.calculatedConsumption ? ` · ${log.calculatedConsumption.toFixed(1)} L/100km` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
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
