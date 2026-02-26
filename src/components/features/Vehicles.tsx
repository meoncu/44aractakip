'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getVehicles, addVehicle as addVehicleDB, updateVehicle as updateVehicleDB, deleteVehicle as deleteVehicleDB } from '@/lib/firestore';
import { Vehicle } from '@/types';
import { Car, Plus, Edit2, Trash2, Fuel, Gauge, Calendar, X, ChevronRight } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';

const FUEL_TYPES = ['Benzin', 'Dizel', 'LPG', 'Elektrik', 'Hibrit'] as const;

export default function Vehicles() {
    const { user, vehicles, setVehicles, selectedVehicle, setSelectedVehicle, setActiveTab } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [plateNumber, setPlateNumber] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [licenseOwner, setLicenseOwner] = useState('');
    const [licenseDetails, setLicenseDetails] = useState('');
    const [fuelType, setFuelType] = useState<Vehicle['fuelType']>('Benzin');
    const [currentKm, setCurrentKm] = useState(0);

    useEffect(() => {
        if (!user) return;
        loadVehicles();
    }, [user]);

    const loadVehicles = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const list = await getVehicles(user.uid);
            setVehicles(list);
        } catch (error) {
            console.error('Error loading vehicles:', error);
        }
        setLoading(false);
    };

    const resetForm = () => {
        setPlateNumber('');
        setBrand('');
        setModel('');
        setYear(new Date().getFullYear());
        setLicenseOwner('');
        setLicenseDetails('');
        setFuelType('Benzin');
        setCurrentKm(0);
        setEditVehicle(null);
        setShowForm(false);
    };

    const openEdit = (v: Vehicle) => {
        setEditVehicle(v);
        setPlateNumber(v.plateNumber);
        setBrand(v.brand);
        setModel(v.model);
        setYear(v.year);
        setLicenseOwner(v.licenseOwner);
        setLicenseDetails(v.licenseDetails);
        setFuelType(v.fuelType);
        setCurrentKm(v.currentKm);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            if (editVehicle) {
                await updateVehicleDB(editVehicle.id, {
                    plateNumber, brand, model, year, licenseOwner, licenseDetails, fuelType, currentKm,
                });
                useStore.getState().updateVehicle(editVehicle.id, {
                    plateNumber, brand, model, year, licenseOwner, licenseDetails, fuelType, currentKm,
                });
            } else {
                const id = await addVehicleDB({
                    userId: user.uid,
                    plateNumber, brand, model, year, licenseOwner, licenseDetails, fuelType, currentKm,
                    createdAt: new Date(),
                });
                useStore.getState().addVehicle({
                    id, userId: user.uid,
                    plateNumber, brand, model, year, licenseOwner, licenseDetails, fuelType, currentKm,
                    createdAt: new Date(),
                });
            }
            resetForm();
        } catch (error) {
            console.error('Error saving vehicle:', error);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu aracı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteVehicleDB(id);
            useStore.getState().removeVehicle(id);
        } catch (error) {
            console.error('Error deleting vehicle:', error);
        }
    };

    const selectAndNavigate = (v: Vehicle, tab: string) => {
        setSelectedVehicle(v);
        setActiveTab(tab);
    };

    const fuelTypeColors: Record<string, string> = {
        Benzin: 'bg-yellow-500/10 text-yellow-500',
        Dizel: 'bg-blue-500/10 text-blue-500',
        LPG: 'bg-green-500/10 text-green-500',
        Elektrik: 'bg-cyan-500/10 text-cyan-500',
        Hibrit: 'bg-purple-500/10 text-purple-500',
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 rounded-2xl bg-card" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Araçlarım</h2>
                    <p className="text-sm text-muted-foreground mt-1">{vehicles.length} araç kayıtlı</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    id="add-vehicle-btn"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Araç Ekle</span>
                </button>
            </div>

            {/* Vehicle Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h3 className="text-lg font-semibold">
                                {editVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
                            </h3>
                            <button onClick={resetForm} className="p-2 rounded-lg hover:bg-accent transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Plaka *</label>
                                    <input
                                        type="text"
                                        required
                                        value={plateNumber}
                                        onChange={e => setPlateNumber(e.target.value.toUpperCase())}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="44 ABC 123"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Yakıt Tipi *</label>
                                    <select
                                        required
                                        value={fuelType}
                                        onChange={e => setFuelType(e.target.value as Vehicle['fuelType'])}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    >
                                        {FUEL_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Marka *</label>
                                    <input
                                        type="text"
                                        required
                                        value={brand}
                                        onChange={e => setBrand(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="Toyota"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Model *</label>
                                    <input
                                        type="text"
                                        required
                                        value={model}
                                        onChange={e => setModel(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="Corolla"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Yıl *</label>
                                    <input
                                        type="number"
                                        required
                                        value={year}
                                        onChange={e => setYear(Number(e.target.value))}
                                        min={1990}
                                        max={new Date().getFullYear() + 1}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Güncel KM *</label>
                                    <input
                                        type="number"
                                        required
                                        value={currentKm}
                                        onChange={e => setCurrentKm(Number(e.target.value))}
                                        min={0}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ruhsat Sahibi</label>
                                <input
                                    type="text"
                                    value={licenseOwner}
                                    onChange={e => setLicenseOwner(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ruhsat Detayları</label>
                                <textarea
                                    value={licenseDetails}
                                    onChange={e => setLicenseDetails(e.target.value)}
                                    rows={2}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Kaydediliyor...' : editVehicle ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Vehicle Cards */}
            {vehicles.length === 0 ? (
                <div className="text-center py-20">
                    <Car className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Henüz araç eklenmemiş</h3>
                    <p className="text-sm text-muted-foreground mb-6">İlk aracınızı ekleyerek başlayın</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Araç Ekle
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map((v) => (
                        <div
                            key={v.id}
                            className={`bg-card rounded-2xl border transition-all duration-300 hover:shadow-lg group ${selectedVehicle?.id === v.id
                                    ? 'border-primary shadow-lg shadow-primary/10'
                                    : 'border-border hover:border-primary/30'
                                }`}
                        >
                            <div className="p-5">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Car className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm">{v.plateNumber}</h3>
                                            <p className="text-xs text-muted-foreground">{v.brand} {v.model} · {v.year}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-medium px-2 py-1 rounded-lg ${fuelTypeColors[v.fuelType] || 'bg-gray-500/10 text-gray-500'}`}>
                                        {v.fuelType}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/50">
                                        <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-xs">{formatNumber(v.currentKm)} km</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/50">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-xs">{v.year}</span>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <button
                                        onClick={() => selectAndNavigate(v, 'km')}
                                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <Gauge className="w-3.5 h-3.5 text-blue-400" />
                                        <span className="text-[10px] text-muted-foreground">KM</span>
                                    </button>
                                    <button
                                        onClick={() => selectAndNavigate(v, 'fuel')}
                                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <Fuel className="w-3.5 h-3.5 text-green-400" />
                                        <span className="text-[10px] text-muted-foreground">Yakıt</span>
                                    </button>
                                    <button
                                        onClick={() => selectAndNavigate(v, 'maintenance')}
                                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <Car className="w-3.5 h-3.5 text-orange-400" />
                                        <span className="text-[10px] text-muted-foreground">Bakım</span>
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-3 border-t border-border">
                                    <button
                                        onClick={() => { setSelectedVehicle(v); setActiveTab('km'); }}
                                        className="flex-1 flex items-center justify-center gap-1 text-xs text-primary font-medium py-2 rounded-lg hover:bg-primary/10 transition-colors"
                                    >
                                        Seç <ChevronRight className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => openEdit(v)}
                                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(v.id)}
                                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
