'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getInsurances, addInsurance as addInsDB, updateInsurance as updateInsDB, deleteInsurance as deleteInsDB } from '@/lib/firestore';
import { Insurance as InsuranceType } from '@/types';
import { Shield, Plus, Calendar, DollarSign, AlertTriangle, Trash2, X, Phone, Building, Pencil, FileText, Upload, Loader2, ExternalLink } from 'lucide-react';
import { formatCurrency, formatShortDate, daysUntil } from '@/lib/utils';
import { R2_PUBLIC_URL } from '@/lib/r2';

export default function InsuranceTracking() {
    const { selectedVehicle, insurances, setInsurances, vehicles, setSelectedVehicle } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingIns, setEditingIns] = useState<InsuranceType | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [type, setType] = useState<InsuranceType['type']>('Kasko');
    const [companyName, setCompanyName] = useState('');
    const [agentName, setAgentName] = useState('');
    const [agentPhone, setAgentPhone] = useState('');
    const [policyFileUrl, setPolicyFileUrl] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [coverageDetails, setCoverageDetails] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (selectedVehicle) loadData();
    }, [selectedVehicle]);

    const loadData = async () => {
        if (!selectedVehicle) return;
        setLoading(true);
        const data = await getInsurances(selectedVehicle.id);
        setInsurances(data);
        setLoading(false);
    };

    const handleFileUpload = async (file: File): Promise<string> => {
        setUploading(true);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: file.name, fileType: file.type }),
            });
            const { url, key } = await res.json();

            await fetch(url, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });

            return `${R2_PUBLIC_URL}/${key}`;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle || saving || uploading) return;
        setSaving(true);
        try {
            let currentFileUrl = policyFileUrl;
            if (selectedFile) {
                currentFileUrl = await handleFileUpload(selectedFile);
            }

            if (editingIns) {
                await updateInsDB(editingIns.id, {
                    type,
                    companyName,
                    agentName,
                    agentPhone,
                    policyNumber,
                    amount: Number(amount),
                    coverageDetails,
                    startDate,
                    endDate,
                    policyFileUrl: currentFileUrl,
                });
            } else {
                await addInsDB({
                    vehicleId: selectedVehicle.id,
                    type,
                    companyName,
                    agentName,
                    agentPhone,
                    policyNumber,
                    amount: Number(amount),
                    coverageDetails,
                    startDate,
                    endDate,
                    policyFileUrl: currentFileUrl,
                    createdAt: new Date(),
                });
            }
            await loadData();
            resetForm();
        } catch (error) {
            console.error(error);
            alert('Kaydedilirken bir hata oluştu.');
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        await deleteInsDB(id);
        setInsurances(insurances.filter(i => i.id !== id));
    };

    const resetForm = () => {
        setType('Kasko');
        setCompanyName('');
        setAgentName('');
        setAgentPhone('');
        setPolicyNumber('');
        setAmount('');
        setCoverageDetails('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setPolicyFileUrl('');
        setSelectedFile(null);
        setEditingIns(null);
        setShowForm(false);
    };

    const handleEdit = (ins: InsuranceType) => {
        setEditingIns(ins);
        setType(ins.type);
        setCompanyName(ins.companyName);
        setAgentName(ins.agentName || '');
        setAgentPhone(ins.agentPhone || '');
        setPolicyNumber(ins.policyNumber || '');
        setAmount(ins.amount.toString());
        setCoverageDetails(ins.coverageDetails || '');
        setStartDate(ins.startDate);
        setEndDate(ins.endDate);
        setPolicyFileUrl(ins.policyFileUrl || '');
        setShowForm(true);
    };

    const expiringSoon = insurances.filter(i => {
        const d = daysUntil(i.endDate);
        return d >= 0 && d <= 30;
    });

    if (!selectedVehicle) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Sigorta Takibi</h2>
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                    <Shield className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Araç Seçin</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-lg mx-auto mt-4">
                        {vehicles.map(v => (
                            <button key={v.id} onClick={() => setSelectedVehicle(v)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all">
                                <Shield className="w-4 h-4 text-primary" />
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
                    <h2 className="text-2xl font-bold">Sigorta Takibi</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedVehicle.plateNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={selectedVehicle.id} onChange={e => { const v = vehicles.find(v => v.id === e.target.value); if (v) setSelectedVehicle(v); }}
                        className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
                    </select>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" /><span className="hidden sm:inline">Sigorta Ekle</span>
                    </button>
                </div>
            </div>

            {/* Expiring soon alert */}
            {expiringSoon.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                    <h3 className="font-semibold text-sm text-red-500 flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4" /> Süresi Dolan Sigortalar
                    </h3>
                    {expiringSoon.map(i => (
                        <div key={i.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border mb-2 last:mb-0">
                            <div>
                                <p className="text-sm font-medium">{i.type} - {i.companyName}</p>
                                <p className="text-xs text-muted-foreground">Bitiş: {formatShortDate(i.endDate)}</p>
                            </div>
                            <span className="text-xs font-semibold text-red-500">{daysUntil(i.endDate)} gün</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Insurance Cards */}
            {insurances.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
                    Henüz sigorta kaydı bulunmuyor
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insurances.map(ins => {
                        const days = daysUntil(ins.endDate);
                        const isExpired = days < 0;
                        const isExpiring = days >= 0 && days <= 30;
                        return (
                            <div key={ins.id} className={`bg-card rounded-2xl border p-5 ${isExpired ? 'border-red-500/30' : isExpiring ? 'border-orange-500/30' : 'border-border'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${ins.type === 'Kasko' ? 'bg-blue-500/10 text-blue-500' :
                                        ins.type === 'Trafik' ? 'bg-green-500/10 text-green-500' :
                                            'bg-purple-500/10 text-purple-500'
                                        }`}>{ins.type}</span>
                                    <div className="flex items-center gap-2">
                                        {ins.policyFileUrl && (
                                            <a href={ins.policyFileUrl} target="_blank" rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors group" title="Poliçeyi Görüntüle">
                                                <FileText className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                                            </a>
                                        )}
                                        <button onClick={() => handleEdit(ins)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                                            <Pencil className="w-3.5 h-3.5 text-primary" />
                                        </button>
                                        <button onClick={() => handleDelete(ins.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Building className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-sm font-medium">{ins.companyName}</span>
                                    </div>
                                    {ins.agentName && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Yetkili</span>
                                            <span className="text-xs font-medium">{ins.agentName}</span>
                                        </div>
                                    )}
                                    {ins.agentPhone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                            <a href={`tel:${ins.agentPhone}`} className="text-xs text-primary hover:underline">{ins.agentPhone}</a>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-sm font-semibold">{formatCurrency(ins.amount)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                            {formatShortDate(ins.startDate)} - {formatShortDate(ins.endDate)}
                                        </span>
                                    </div>
                                </div>
                                <div className={`mt-3 pt-3 border-t border-border text-xs font-medium ${isExpired ? 'text-red-500' : isExpiring ? 'text-orange-500' : 'text-green-500'
                                    }`}>
                                    {isExpired ? 'Süresi dolmuş' : `${days} gün kaldı`}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h3 className="text-lg font-semibold">{editingIns ? 'Sigortayı Düzenle' : 'Sigorta Ekle'}</h3>
                            <button onClick={resetForm} className="p-2 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sigorta Türü *</label>
                                    <select required value={type} onChange={e => setType(e.target.value as InsuranceType['type'])}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                                        <option value="Kasko">Kasko</option>
                                        <option value="Trafik">Trafik</option>
                                        <option value="İMM">İMM</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Firma *</label>
                                    <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sigorta Yetkilisi</label>
                                    <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Yetkili Telefon</label>
                                    <input type="text" value={agentPhone} onChange={e => setAgentPhone(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Poliçe No</label>
                                    <input type="text" value={policyNumber} onChange={e => setPolicyNumber(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tutar (₺) *</label>
                                    <input type="number" required step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Başlangıç Tarihi *</label>
                                    <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bitiş Tarihi *</label>
                                    <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Poliçe Dosyası (PDF)</label>
                                    <div className="flex items-center gap-2">
                                        <label className="flex-1 cursor-pointer">
                                            <div className="w-full bg-background border border-dashed border-border rounded-xl px-3 py-3 text-center hover:border-primary/50 transition-colors">
                                                <div className="flex items-center justify-center gap-2">
                                                    {selectedFile ? (
                                                        <>
                                                            <FileText className="w-4 h-4 text-primary" />
                                                            <span className="text-xs font-medium truncate max-w-[150px]">{selectedFile.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-xs text-muted-foreground">{policyFileUrl ? 'Poliçeyi Değiştir' : 'Dosya Seç (PDF)'}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <input type="file" className="hidden" accept=".pdf" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                                            </div>
                                        </label>
                                        {policyFileUrl && (
                                            <a href={policyFileUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-accent hover:bg-accent/80 text-primary">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Kapsam</label>
                                <textarea value={coverageDetails} onChange={e => setCoverageDetails(e.target.value)} rows={2}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent">İptal</button>
                                <button type="submit" disabled={saving || uploading} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                                    {(saving || uploading) ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {uploading ? 'Yükleniyor...' : 'Kaydediliyor...'}
                                        </>
                                    ) : editingIns ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
