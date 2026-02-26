'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getTireInfos, addTireInfo as addTireDB, updateTireInfo as updateTireDB, deleteTireInfo as deleteTireDB } from '@/lib/firestore';
import { TireInfo } from '@/types';
import { CircleDot, Plus, Calendar, AlertTriangle, Trash2, X, Pencil } from 'lucide-react';
import { formatShortDate, daysUntil, addYears, formatNumber } from '@/lib/utils';

export default function TireTracking() {
    const { selectedVehicle, tireInfos, setTireInfos, vehicles, setSelectedVehicle } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingTire, setEditingTire] = useState<TireInfo | null>(null);

    const [brand, setBrand] = useState('');
    const [size, setSize] = useState('');
    const [installDate, setInstallDate] = useState(new Date().toISOString().split('T')[0]);
    const [kmAtInstall, setKmAtInstall] = useState('');
    const [warningYears, setWarningYears] = useState(3);
    const [tireType, setTireType] = useState<TireInfo['type']>('4 Mevsim');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (selectedVehicle) loadData();
    }, [selectedVehicle]);

    const loadData = async () => {
        if (!selectedVehicle) return;
        setLoading(true);
        const data = await getTireInfos(selectedVehicle.id);
        setTireInfos(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle || saving) return;
        setSaving(true);
        try {
            const expiryDate = addYears(new Date(installDate), warningYears);
            if (editingTire) {
                await updateTireDB(editingTire.id, {
                    brand, size, installDate,
                    expiryDate: expiryDate.toISOString().split('T')[0],
                    kmAtInstall: Number(kmAtInstall),
                    warningMonths: warningYears * 12,
                    type: tireType,
                    notes,
                });
            } else {
                await addTireDB({
                    vehicleId: selectedVehicle.id,
                    brand, size, installDate,
                    expiryDate: expiryDate.toISOString().split('T')[0],
                    kmAtInstall: Number(kmAtInstall),
                    warningMonths: warningYears * 12,
                    type: tireType,
                    notes,
                    createdAt: new Date(),
                });
            }
            await loadData();
            resetForm();
        } catch (error) { console.error(error); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        await deleteTireDB(id);
        setTireInfos(tireInfos.filter(t => t.id !== id));
    };

    const resetForm = () => {
        setBrand(''); setSize(''); setInstallDate(new Date().toISOString().split('T')[0]);
        setKmAtInstall(''); setWarningYears(3); setTireType('4 Mevsim'); setNotes('');
        setEditingTire(null);
        setShowForm(false);
    };

    const handleEdit = (tire: TireInfo) => {
        setEditingTire(tire);
        setBrand(tire.brand);
        setSize(tire.size);
        setInstallDate(tire.installDate);
        setKmAtInstall(tire.kmAtInstall.toString());
        setWarningYears(tire.warningMonths / 12);
        setTireType(tire.type);
        setNotes(tire.notes || '');
        setShowForm(true);
    };

    const expiring = tireInfos.filter(t => {
        const d = daysUntil(t.expiryDate);
        return d >= 0 && d <= 90;
    });

    if (!selectedVehicle) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Lastik Takibi</h2>
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                    <CircleDot className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Araç Seçin</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-lg mx-auto mt-4">
                        {vehicles.map(v => (
                            <button key={v.id} onClick={() => setSelectedVehicle(v)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all">
                                <CircleDot className="w-4 h-4 text-primary" />
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
                    <h2 className="text-2xl font-bold">Lastik Takibi</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedVehicle.plateNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={selectedVehicle.id} onChange={e => { const v = vehicles.find(v => v.id === e.target.value); if (v) setSelectedVehicle(v); }}
                        className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
                    </select>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" /><span className="hidden sm:inline">Lastik Ekle</span>
                    </button>
                </div>
            </div>

            {/* Expiring alert */}
            {expiring.length > 0 && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4">
                    <h3 className="font-semibold text-sm text-orange-500 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" /> Lastik Ömrü Yaklaşıyor
                    </h3>
                    {expiring.map(t => (
                        <p key={t.id} className="text-xs text-muted-foreground">
                            {t.brand} {t.size} ({t.type}) - {daysUntil(t.expiryDate)} gün kaldı
                        </p>
                    ))}
                </div>
            )}

            {/* Tire Cards */}
            {tireInfos.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
                    Henüz lastik kaydı bulunmuyor
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tireInfos.map(tire => {
                        const days = daysUntil(tire.expiryDate);
                        const isExpired = days < 0;
                        const isExpiring = days >= 0 && days <= 90;
                        const kmUsed = selectedVehicle.currentKm - tire.kmAtInstall;
                        return (
                            <div key={tire.id} className={`bg-card rounded-2xl border p-5 ${isExpired ? 'border-red-500/30' : isExpiring ? 'border-orange-500/30' : 'border-border'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <CircleDot className="w-5 h-5 text-primary" />
                                        <span className="font-semibold text-sm">{tire.brand}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-medium px-2 py-1 rounded-lg ${tire.type === 'Yaz' ? 'bg-yellow-500/10 text-yellow-500' :
                                            tire.type === 'Kış' ? 'bg-cyan-500/10 text-cyan-500' :
                                                'bg-green-500/10 text-green-500'
                                            }`}>{tire.type}</span>
                                        <button onClick={() => handleEdit(tire)} className="p-1 rounded-lg hover:bg-primary/10 transition-colors">
                                            <Pencil className="w-3 h-3 text-primary" />
                                        </button>
                                        <button onClick={() => handleDelete(tire.id)} className="p-1 rounded-lg hover:bg-destructive/10 transition-colors">
                                            <Trash2 className="w-3 h-3 text-destructive" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground text-xs">Ebat</span><span className="text-xs font-medium">{tire.size}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground text-xs">Takılma Tarihi</span><span className="text-xs font-medium">{formatShortDate(tire.installDate)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground text-xs">Bitiş Tarihi</span><span className="text-xs font-medium">{formatShortDate(tire.expiryDate)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground text-xs">Kullanılan KM</span><span className="text-xs font-medium">{formatNumber(Math.max(0, kmUsed))} km</span></div>
                                </div>
                                <div className={`mt-3 pt-3 border-t border-border text-xs font-medium ${isExpired ? 'text-red-500' : isExpiring ? 'text-orange-500' : 'text-green-500'
                                    }`}>
                                    {isExpired ? 'Ömrü dolmuş' : `${days} gün kaldı`}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl border border-border max-w-md w-full animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h3 className="text-lg font-semibold">{editingTire ? 'Lastiği Düzenle' : 'Lastik Ekle'}</h3>
                            <button onClick={resetForm} className="p-2 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Marka *</label>
                                    <input type="text" required value={brand} onChange={e => setBrand(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Michelin" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ebat *</label>
                                    <input type="text" required value={size} onChange={e => setSize(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="205/55R16" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Takılma Tarihi *</label>
                                    <input type="date" required value={installDate} onChange={e => setInstallDate(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">KM *</label>
                                    <input type="number" required value={kmAtInstall} onChange={e => setKmAtInstall(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tip *</label>
                                    <select required value={tireType} onChange={e => setTireType(e.target.value as TireInfo['type'])}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                                        <option value="Yaz">Yaz</option>
                                        <option value="Kış">Kış</option>
                                        <option value="4 Mevsim">4 Mevsim</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Uyarı (Yıl)</label>
                                    <input type="number" value={warningYears} onChange={e => setWarningYears(Number(e.target.value))}
                                        min={1} max={10}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notlar</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent">İptal</button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all">
                                    {saving ? 'Kaydediliyor...' : editingTire ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
