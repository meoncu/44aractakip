'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getInspections, addInspection as addInspDB, updateInspection as updateInspDB, deleteInspection as deleteInspDB } from '@/lib/firestore';
import { Inspection } from '@/types';
import { ClipboardCheck, Plus, Calendar, AlertTriangle, Trash2, X, ExternalLink, CheckCircle2, Pencil } from 'lucide-react';
import { formatShortDate, formatCurrency, daysUntil, addYears } from '@/lib/utils';

const CHECKLIST = [
    'Farlar ve sinyaller çalışıyor mu?',
    'Fren sistemi kontrol edildi mi?',
    'Egzoz emisyon testi uygun mu?',
    'Lastik diş derinlikleri yeterli mi?',
    'Cam çatlakları var mı?',
    'Korna çalışıyor mu?',
    'Silecekler düzgün çalışıyor mu?',
    'Emniyet kemerleri sağlam mı?',
    'Ayna ve camlar temiz mi?',
    'Plaka okunaklı mı?',
];

export default function InspectionTracking() {
    const { selectedVehicle, inspections, setInspections, vehicles, setSelectedVehicle } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [checklist, setChecklist] = useState<boolean[]>(new Array(CHECKLIST.length).fill(false));
    const [showChecklist, setShowChecklist] = useState(false);
    const [editingInsp, setEditingInsp] = useState<Inspection | null>(null);

    const [lastDate, setLastDate] = useState(new Date().toISOString().split('T')[0]);
    const [cost, setCost] = useState('');
    const [result, setResult] = useState<Inspection['result']>('Geçti');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (selectedVehicle) loadData();
    }, [selectedVehicle]);

    const loadData = async () => {
        if (!selectedVehicle) return;
        setLoading(true);
        const data = await getInspections(selectedVehicle.id);
        setInspections(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle || saving) return;
        setSaving(true);
        try {
            const nextDate = addYears(new Date(lastDate), selectedVehicle.year <= new Date().getFullYear() - 3 ? 1 : 2);
            if (editingInsp) {
                await updateInspDB(editingInsp.id, {
                    lastInspectionDate: lastDate,
                    nextInspectionDate: nextDate.toISOString().split('T')[0],
                    inspectionCost: Number(cost),
                    result,
                    notes,
                });
            } else {
                await addInspDB({
                    vehicleId: selectedVehicle.id,
                    lastInspectionDate: lastDate,
                    nextInspectionDate: nextDate.toISOString().split('T')[0],
                    inspectionCost: Number(cost),
                    result,
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
        await deleteInspDB(id);
        setInspections(inspections.filter(i => i.id !== id));
    };

    const resetForm = () => {
        setLastDate(new Date().toISOString().split('T')[0]);
        setCost(''); setResult('Geçti'); setNotes('');
        setEditingInsp(null);
        setShowForm(false);
    };

    const handleEdit = (insp: Inspection) => {
        setEditingInsp(insp);
        setLastDate(insp.lastInspectionDate);
        setCost(insp.inspectionCost.toString());
        setResult(insp.result);
        setNotes(insp.notes || '');
        setShowForm(true);
    };

    const toggleChecklistItem = (index: number) => {
        const newChecklist = [...checklist];
        newChecklist[index] = !newChecklist[index];
        setChecklist(newChecklist);
    };

    const latestInsp = inspections[0];
    const nextInspDays = latestInsp ? daysUntil(latestInsp.nextInspectionDate) : null;

    if (!selectedVehicle) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">TÜVTÜRK Muayene</h2>
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                    <ClipboardCheck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Araç Seçin</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-lg mx-auto mt-4">
                        {vehicles.map(v => (
                            <button key={v.id} onClick={() => setSelectedVehicle(v)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all">
                                <ClipboardCheck className="w-4 h-4 text-primary" />
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
                    <h2 className="text-2xl font-bold">TÜVTÜRK Muayene</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedVehicle.plateNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={selectedVehicle.id} onChange={e => { const v = vehicles.find(v => v.id === e.target.value); if (v) setSelectedVehicle(v); }}
                        className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
                    </select>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" /><span className="hidden sm:inline">Muayene Ekle</span>
                    </button>
                </div>
            </div>

            {/* Next inspection alert */}
            {latestInsp && nextInspDays !== null && nextInspDays <= 30 && (
                <div className={`rounded-2xl p-4 border ${nextInspDays <= 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
                    <p className={`text-sm font-medium flex items-center gap-2 ${nextInspDays <= 0 ? 'text-red-500' : 'text-orange-500'}`}>
                        <AlertTriangle className="w-4 h-4" />
                        {nextInspDays <= 0 ? 'Muayene süresi geçmiştir!' : `Muayene süresine ${nextInspDays} gün kaldı!`}
                    </p>
                </div>
            )}

            {/* Status Card */}
            {latestInsp && (
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Muayene Durumu</h3>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${latestInsp.result === 'Geçti' ? 'bg-green-500/10 text-green-500' :
                            latestInsp.result === 'Kaldı' ? 'bg-red-500/10 text-red-500' :
                                'bg-yellow-500/10 text-yellow-500'
                            }`}>{latestInsp.result}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Son Muayene</p>
                            <p className="text-sm font-semibold">{formatShortDate(latestInsp.lastInspectionDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Sonraki Muayene</p>
                            <p className="text-sm font-semibold">{formatShortDate(latestInsp.nextInspectionDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Maliyet</p>
                            <p className="text-sm font-semibold">{formatCurrency(latestInsp.inspectionCost)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Kalan Gün</p>
                            <p className={`text-sm font-semibold ${nextInspDays && nextInspDays <= 30 ? 'text-orange-500' : ''}`}>
                                {nextInspDays} gün
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => setShowChecklist(!showChecklist)}
                    className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-all text-left"
                >
                    <CheckCircle2 className="w-5 h-5 text-primary mb-2" />
                    <h3 className="font-semibold text-sm">Muayene Öncesi Checklist</h3>
                    <p className="text-xs text-muted-foreground mt-1">Muayene öncesi kontrol listesi</p>
                </button>
                <a
                    href="https://www.tuvturk.com.tr/randevu-al"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-all block"
                >
                    <ExternalLink className="w-5 h-5 text-primary mb-2" />
                    <h3 className="font-semibold text-sm">Randevu Al</h3>
                    <p className="text-xs text-muted-foreground mt-1">TÜVTÜRK randevu sistemi</p>
                </a>
            </div>

            {/* Checklist */}
            {showChecklist && (
                <div className="bg-card rounded-2xl border border-border p-6 animate-slide-up">
                    <h3 className="font-semibold text-sm mb-4">Muayene Öncesi Kontrol Listesi</h3>
                    <div className="space-y-2">
                        {CHECKLIST.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => toggleChecklistItem(i)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${checklist[i] ? 'bg-green-500/5 border border-green-500/20' : 'border border-border hover:bg-accent'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${checklist[i] ? 'bg-green-500 text-white' : 'border-2 border-border'
                                    }`}>
                                    {checklist[i] && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                                <span className={`text-sm ${checklist[i] ? 'line-through text-muted-foreground' : ''}`}>{item}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                        {checklist.filter(Boolean).length}/{CHECKLIST.length} tamamlandı
                    </p>
                </div>
            )}

            {/* History */}
            <div className="bg-card rounded-2xl border border-border">
                <div className="p-4 border-b border-border"><h3 className="font-semibold text-sm">Muayene Geçmişi</h3></div>
                <div className="divide-y divide-border">
                    {inspections.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">Henüz muayene kaydı bulunmuyor</div>
                    ) : inspections.map(insp => (
                        <div key={insp.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${insp.result === 'Geçti' ? 'bg-green-500/10 text-green-500' :
                                    insp.result === 'Kaldı' ? 'bg-red-500/10 text-red-500' :
                                        'bg-yellow-500/10 text-yellow-500'
                                    }`}>{insp.result}</span>
                                <div>
                                    <p className="text-sm font-semibold">{formatShortDate(insp.lastInspectionDate)}</p>
                                    <p className="text-xs text-muted-foreground">Sonraki: {formatShortDate(insp.nextInspectionDate)} · {formatCurrency(insp.inspectionCost)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleEdit(insp)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                                    <Pencil className="w-3.5 h-3.5 text-primary" />
                                </button>
                                <button onClick={() => handleDelete(insp.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl border border-border max-w-md w-full animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h3 className="text-lg font-semibold">{editingInsp ? 'Muayeneyi Düzenle' : 'Muayene Ekle'}</h3>
                            <button onClick={resetForm} className="p-2 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Muayene Tarihi *</label>
                                <input type="date" required value={lastDate} onChange={e => setLastDate(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sonuç *</label>
                                    <select required value={result} onChange={e => setResult(e.target.value as Inspection['result'])}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                                        <option value="Geçti">Geçti</option>
                                        <option value="Kaldı">Kaldı</option>
                                        <option value="Bekliyor">Bekliyor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Maliyet (₺) *</label>
                                    <input type="number" required step="0.01" value={cost} onChange={e => setCost(e.target.value)}
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
                                    {saving ? 'Kaydediliyor...' : editingInsp ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
