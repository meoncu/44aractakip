'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getMaintenanceLogs, addMaintenanceLog as addMaintDB, updateMaintenanceLog as updateMaintDB, deleteMaintenanceLog as deleteMaintDB } from '@/lib/firestore';
import { MaintenanceLog, MaintenanceType } from '@/types';
import { Wrench, Plus, Calendar, DollarSign, AlertTriangle, Trash2, X, Pencil } from 'lucide-react';
import { formatNumber, formatCurrency, formatShortDate, daysUntil } from '@/lib/utils';

const MAINTENANCE_TYPES: MaintenanceType[] = [
    'Yağ Değişimi', 'Lastik Değişimi', 'Antifriz', 'Balata Değişimi', 'Fren Diski',
    'Filtre Değişimi', 'Akü Değişimi', 'Triger Seti', 'Bujiler', 'V-Kayışı',
    'Amortisör', 'Rot Balans', 'Klima Bakımı', 'Genel Bakım', 'Diğer',
];

export default function Maintenance() {
    const { selectedVehicle, maintenanceLogs, setMaintenanceLogs, vehicles, setSelectedVehicle } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);

    const [type, setType] = useState<MaintenanceType>('Yağ Değişimi');
    const [kmAtMaintenance, setKmAtMaintenance] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [nextDueKm, setNextDueKm] = useState('');
    const [nextDueDate, setNextDueDate] = useState('');
    const [cost, setCost] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (selectedVehicle) loadLogs();
    }, [selectedVehicle]);

    const loadLogs = async () => {
        if (!selectedVehicle) return;
        setLoading(true);
        const logs = await getMaintenanceLogs(selectedVehicle.id);
        setMaintenanceLogs(logs);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle || saving) return;
        setSaving(true);
        try {
            if (editingLog) {
                await updateMaintDB(editingLog.id, {
                    type,
                    kmAtMaintenance: Number(kmAtMaintenance),
                    date,
                    nextDueKm: nextDueKm ? Number(nextDueKm) : undefined,
                    nextDueDate: nextDueDate || undefined,
                    cost: Number(cost),
                    notes,
                });
            } else {
                const log: Omit<MaintenanceLog, 'id'> = {
                    vehicleId: selectedVehicle.id,
                    type,
                    kmAtMaintenance: Number(kmAtMaintenance),
                    date,
                    nextDueKm: nextDueKm ? Number(nextDueKm) : undefined,
                    nextDueDate: nextDueDate || undefined,
                    cost: Number(cost),
                    notes,
                    createdAt: new Date(),
                };
                await addMaintDB(log);
            }
            await loadLogs();
            resetForm();
        } catch (error) {
            console.error('Error:', error);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
        await deleteMaintDB(id);
        setMaintenanceLogs(maintenanceLogs.filter(m => m.id !== id));
    };

    const resetForm = () => {
        setType('Yağ Değişimi');
        setKmAtMaintenance('');
        setDate(new Date().toISOString().split('T')[0]);
        setNextDueKm('');
        setNextDueDate('');
        setCost('');
        setNotes('');
        setEditingLog(null);
        setShowForm(false);
    };

    const handleEdit = (log: MaintenanceLog) => {
        setEditingLog(log);
        setType(log.type);
        setKmAtMaintenance(log.kmAtMaintenance.toString());
        setDate(log.date);
        setNextDueKm(log.nextDueKm?.toString() || '');
        setNextDueDate(log.nextDueDate || '');
        setCost(log.cost.toString());
        setNotes(log.notes || '');
        setShowForm(true);
    };

    const totalCost = maintenanceLogs.reduce((a, l) => a + l.cost, 0);
    const upcoming = maintenanceLogs.filter(l => l.nextDueDate && daysUntil(l.nextDueDate) <= 30 && daysUntil(l.nextDueDate) > 0);

    const typeColors: Record<string, string> = {
        'Yağ Değişimi': 'bg-yellow-500/10 text-yellow-600',
        'Lastik Değişimi': 'bg-gray-500/10 text-gray-600',
        'Antifriz': 'bg-cyan-500/10 text-cyan-600',
        'Balata Değişimi': 'bg-red-500/10 text-red-600',
        'Fren Diski': 'bg-red-500/10 text-red-600',
        'Filtre Değişimi': 'bg-blue-500/10 text-blue-600',
        'Genel Bakım': 'bg-green-500/10 text-green-600',
    };

    if (!selectedVehicle) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Bakım Takibi</h2>
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                    <Wrench className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Araç Seçin</h3>
                    <p className="text-sm text-muted-foreground mb-6">Bakım takibi için bir araç seçin</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-lg mx-auto">
                        {vehicles.map(v => (
                            <button key={v.id} onClick={() => setSelectedVehicle(v)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all">
                                <Wrench className="w-4 h-4 text-primary" />
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Bakım Takibi</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedVehicle.plateNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={selectedVehicle.id} onChange={e => { const v = vehicles.find(v => v.id === e.target.value); if (v) setSelectedVehicle(v); }}
                        className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
                    </select>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" /><span className="hidden sm:inline">Bakım Ekle</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-2xl border border-border p-4">
                    <Wrench className="w-4 h-4 text-primary mb-2" />
                    <p className="text-lg font-bold">{maintenanceLogs.length}</p>
                    <p className="text-xs text-muted-foreground">Toplam Bakım</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                    <DollarSign className="w-4 h-4 text-green-500 mb-2" />
                    <p className="text-lg font-bold">{formatCurrency(totalCost)}</p>
                    <p className="text-xs text-muted-foreground">Toplam Harcama</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mb-2" />
                    <p className="text-lg font-bold">{upcoming.length}</p>
                    <p className="text-xs text-muted-foreground">Yaklaşan</p>
                </div>
            </div>

            {/* Upcoming Alerts */}
            {upcoming.length > 0 && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4">
                    <h3 className="font-semibold text-sm text-orange-500 flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4" /> Yaklaşan Bakımlar
                    </h3>
                    <div className="space-y-2">
                        {upcoming.map(l => (
                            <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                                <div>
                                    <p className="text-sm font-medium">{l.type}</p>
                                    <p className="text-xs text-muted-foreground">Son: {formatShortDate(l.nextDueDate!)}</p>
                                </div>
                                <span className="text-xs font-semibold text-orange-500">
                                    {daysUntil(l.nextDueDate!)} gün
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h3 className="text-lg font-semibold">{editingLog ? 'Bakımı Düzenle' : 'Bakım Kaydı Ekle'}</h3>
                            <button onClick={resetForm} className="p-2 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bakım Türü *</label>
                                <select required value={type} onChange={e => setType(e.target.value as MaintenanceType)}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                                    {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">KM *</label>
                                    <input type="number" required value={kmAtMaintenance} onChange={e => setKmAtMaintenance(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tarih *</label>
                                    <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sonraki KM</label>
                                    <input type="number" value={nextDueKm} onChange={e => setNextDueKm(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Opsiyonel" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sonraki Tarih</label>
                                    <input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tutar (₺) *</label>
                                <input type="number" required step="0.01" value={cost} onChange={e => setCost(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notlar</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent">İptal</button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all">
                                    {saving ? 'Kaydediliyor...' : editingLog ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Log List */}
            <div className="bg-card rounded-2xl border border-border">
                <div className="p-4 border-b border-border"><h3 className="font-semibold text-sm">Bakım Geçmişi</h3></div>
                <div className="divide-y divide-border">
                    {maintenanceLogs.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">Henüz bakım kaydı bulunmuyor</div>
                    ) : maintenanceLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-medium px-2 py-1 rounded-lg ${typeColors[log.type] || 'bg-primary/10 text-primary'}`}>{log.type}</span>
                                <div>
                                    <p className="text-sm font-semibold">{formatNumber(log.kmAtMaintenance)} km · {formatCurrency(log.cost)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatShortDate(log.date)}
                                        {log.nextDueDate && ` · Sonraki: ${formatShortDate(log.nextDueDate)}`}
                                        {log.nextDueKm && ` · ${formatNumber(log.nextDueKm)} km`}
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
                    ))}
                </div>
            </div>
        </div>
    );
}
