'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getTaxPayments, addTaxPayment as addTaxDB, updateTaxPayment as updateTaxDB, deleteTaxPayment as deleteTaxDB } from '@/lib/firestore';
import { TaxPayment } from '@/types';
import { Receipt, Plus, Check, Clock, AlertTriangle, Trash2, X, Pencil } from 'lucide-react';
import { formatCurrency, formatShortDate } from '@/lib/utils';

export default function TaxTracking() {
    const { selectedVehicle, taxPayments, setTaxPayments, vehicles, setSelectedVehicle } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingTax, setEditingTax] = useState<TaxPayment | null>(null);

    const [year, setYear] = useState(new Date().getFullYear());
    const [januaryAmount, setJanuaryAmount] = useState('');
    const [julyAmount, setJulyAmount] = useState('');

    useEffect(() => {
        if (selectedVehicle) loadData();
    }, [selectedVehicle]);

    const loadData = async () => {
        if (!selectedVehicle) return;
        setLoading(true);
        const data = await getTaxPayments(selectedVehicle.id);
        setTaxPayments(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle || saving) return;
        setSaving(true);
        try {
            const janAmt = Number(januaryAmount) || 0;
            const julAmt = Number(julyAmount) || 0;
            if (editingTax) {
                await updateTaxDB(editingTax.id, {
                    year,
                    januaryAmount: janAmt,
                    julyAmount: julAmt,
                    totalAmount: janAmt + julAmt,
                });
            } else {
                await addTaxDB({
                    vehicleId: selectedVehicle.id,
                    year,
                    januaryPaid: false,
                    julyPaid: false,
                    januaryAmount: janAmt,
                    julyAmount: julAmt,
                    totalAmount: janAmt + julAmt,
                    createdAt: new Date(),
                });
            }
            await loadData();
            resetForm();
        } catch (error) { console.error(error); }
        setSaving(false);
    };

    const togglePayment = async (id: string, field: 'januaryPaid' | 'julyPaid', currentValue: boolean) => {
        const paymentDate = !currentValue ? new Date().toISOString().split('T')[0] : undefined;
        const updateData: Record<string, unknown> = { [field]: !currentValue };
        if (field === 'januaryPaid') updateData.januaryPaymentDate = paymentDate;
        if (field === 'julyPaid') updateData.julyPaymentDate = paymentDate;
        await updateTaxDB(id, updateData);
        await loadData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        await deleteTaxDB(id);
        setTaxPayments(taxPayments.filter(t => t.id !== id));
    };

    const resetForm = () => {
        setYear(new Date().getFullYear());
        setJanuaryAmount(''); setJulyAmount('');
        setEditingTax(null);
        setShowForm(false);
    };

    const handleEdit = (tp: TaxPayment) => {
        setEditingTax(tp);
        setYear(tp.year);
        setJanuaryAmount(tp.januaryAmount?.toString() || '');
        setJulyAmount(tp.julyAmount?.toString() || '');
        setShowForm(true);
    };

    // Check deadlines
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentYearTax = taxPayments.find(t => t.year === currentYear);
    const janDeadlineClose = currentMonth === 1 && (!currentYearTax || !currentYearTax.januaryPaid);
    const julDeadlineClose = currentMonth === 7 && (!currentYearTax || !currentYearTax.julyPaid);

    if (!selectedVehicle) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Vergi Takibi</h2>
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                    <Receipt className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Araç Seçin</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-lg mx-auto mt-4">
                        {vehicles.map(v => (
                            <button key={v.id} onClick={() => setSelectedVehicle(v)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all">
                                <Receipt className="w-4 h-4 text-primary" />
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
                    <h2 className="text-2xl font-bold">Vergi Takibi</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedVehicle.plateNumber} · MTV</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={selectedVehicle.id} onChange={e => { const v = vehicles.find(v => v.id === e.target.value); if (v) setSelectedVehicle(v); }}
                        className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
                    </select>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" /><span className="hidden sm:inline">Yıl Ekle</span>
                    </button>
                </div>
            </div>

            {/* Deadline alert */}
            {(janDeadlineClose || julDeadlineClose) && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                    <p className="text-sm text-red-500 font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {janDeadlineClose ? 'Ocak MTV ödeme son günü yaklaşıyor!' : 'Temmuz MTV ödeme son günü yaklaşıyor!'}
                    </p>
                </div>
            )}

            {/* Info Card */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                <p className="text-xs text-blue-400">
                    ℹ️ Motorlu Taşıtlar Vergisi (MTV) her yıl Ocak ve Temmuz ayları sonuna kadar iki eşit taksit halinde ödenir.
                </p>
            </div>

            {/* Tax Years */}
            {taxPayments.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
                    Henüz vergi kaydı bulunmuyor
                </div>
            ) : (
                <div className="space-y-4">
                    {taxPayments.map(tp => (
                        <div key={tp.id} className="bg-card rounded-2xl border border-border p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg">{tp.year}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">{formatCurrency(tp.totalAmount)}</span>
                                    <button onClick={() => handleEdit(tp)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                                        <Pencil className="w-3.5 h-3.5 text-primary" />
                                    </button>
                                    <button onClick={() => handleDelete(tp.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* January */}
                                <div className={`p-4 rounded-xl border ${tp.januaryPaid ? 'border-green-500/20 bg-green-500/5' : 'border-border'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Ocak Taksiti</span>
                                        <button
                                            onClick={() => togglePayment(tp.id, 'januaryPaid', tp.januaryPaid)}
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${tp.januaryPaid ? 'bg-green-500 text-white' : 'bg-accent hover:bg-accent/80'
                                                }`}
                                        >
                                            {tp.januaryPaid ? <Check className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                                        </button>
                                    </div>
                                    <p className="text-sm font-semibold">{tp.januaryAmount ? formatCurrency(tp.januaryAmount) : '-'}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {tp.januaryPaid && tp.januaryPaymentDate ? `Ödendi: ${formatShortDate(tp.januaryPaymentDate)}` : 'Son: 31 Ocak'}
                                    </p>
                                </div>
                                {/* July */}
                                <div className={`p-4 rounded-xl border ${tp.julyPaid ? 'border-green-500/20 bg-green-500/5' : 'border-border'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Temmuz Taksiti</span>
                                        <button
                                            onClick={() => togglePayment(tp.id, 'julyPaid', tp.julyPaid)}
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${tp.julyPaid ? 'bg-green-500 text-white' : 'bg-accent hover:bg-accent/80'
                                                }`}
                                        >
                                            {tp.julyPaid ? <Check className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                                        </button>
                                    </div>
                                    <p className="text-sm font-semibold">{tp.julyAmount ? formatCurrency(tp.julyAmount) : '-'}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {tp.julyPaid && tp.julyPaymentDate ? `Ödendi: ${formatShortDate(tp.julyPaymentDate)}` : 'Son: 31 Temmuz'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl border border-border max-w-md w-full animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h3 className="text-lg font-semibold">{editingTax ? 'Vergi Yılını Düzenle' : 'Vergi Yılı Ekle'}</h3>
                            <button onClick={resetForm} className="p-2 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Yıl *</label>
                                <input type="number" required value={year} onChange={e => setYear(Number(e.target.value))}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ocak Taksiti (₺)</label>
                                    <input type="number" step="0.01" value={januaryAmount} onChange={e => setJanuaryAmount(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Temmuz Taksiti (₺)</label>
                                    <input type="number" step="0.01" value={julyAmount} onChange={e => setJulyAmount(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent">İptal</button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all">
                                    {saving ? 'Kaydediliyor...' : editingTax ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
