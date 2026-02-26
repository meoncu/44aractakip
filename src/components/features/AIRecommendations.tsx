'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getVehicles, getMaintenanceLogs, getKmLogs, getFuelLogs } from '@/lib/firestore';
import { generateAIRecommendations, getMaintenanceScore } from '@/lib/ai-predictions';
import { AIRecommendation } from '@/types';
import { Brain, AlertTriangle, Sparkles, TrendingUp, Activity, Car, RefreshCw } from 'lucide-react';

export default function AIRecommendations() {
    const { user, vehicles, recommendations, setRecommendations } = useStore();
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState(100);
    const [vehicleRecs, setVehicleRecs] = useState<Record<string, AIRecommendation[]>>({});

    useEffect(() => {
        if (user) loadRecommendations();
    }, [user]);

    const loadRecommendations = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const vehicleList = await getVehicles(user.uid);
            const allRecs: AIRecommendation[] = [];
            const perVehicle: Record<string, AIRecommendation[]> = {};

            for (const vehicle of vehicleList) {
                const [maintenanceLogs, kmLogs, fuelLogs] = await Promise.all([
                    getMaintenanceLogs(vehicle.id),
                    getKmLogs(vehicle.id),
                    getFuelLogs(vehicle.id),
                ]);
                const recs = generateAIRecommendations(vehicle, maintenanceLogs, kmLogs, fuelLogs);
                allRecs.push(...recs);
                perVehicle[vehicle.plateNumber] = recs;
            }

            setRecommendations(allRecs);
            setVehicleRecs(perVehicle);
            setScore(getMaintenanceScore(allRecs));
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const priorityConfig = {
        critical: { label: 'Kritik', color: 'bg-red-500', textColor: 'text-red-500', borderColor: 'border-red-500/20', bgColor: 'bg-red-500/5' },
        high: { label: 'Yüksek', color: 'bg-orange-500', textColor: 'text-orange-500', borderColor: 'border-orange-500/20', bgColor: 'bg-orange-500/5' },
        medium: { label: 'Orta', color: 'bg-yellow-500', textColor: 'text-yellow-500', borderColor: 'border-yellow-500/20', bgColor: 'bg-yellow-500/5' },
        low: { label: 'Düşük', color: 'bg-green-500', textColor: 'text-green-500', borderColor: 'border-green-500/20', bgColor: 'bg-green-500/5' },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-400" />
                        AI Bakım Önerileri
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Yapay zeka destekli bakım ve kullanım önerileri</p>
                </div>
                <button
                    onClick={loadRecommendations}
                    disabled={loading}
                    className="flex items-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-500/20 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Yenile
                </button>
            </div>

            {/* Overall Score */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-purple-400" />
                            Genel Bakım Skoru
                        </h3>
                        <p className="text-4xl font-bold">
                            <span className={score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                                {score}
                            </span>
                            <span className="text-muted-foreground text-lg">/100</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {score >= 80 ? '✅ Araçlarınız iyi bakılmış durumda' :
                                score >= 50 ? '⚠️ Bazı bakımlar gerekiyor' :
                                    '🚨 Acil bakım gerekiyor!'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Toplam Öneri</p>
                        <p className="text-3xl font-bold text-purple-400">{recommendations.length}</p>
                    </div>
                </div>

                {/* Priority breakdown */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                    {(['critical', 'high', 'medium', 'low'] as const).map(priority => {
                        const count = recommendations.filter(r => r.priority === priority).length;
                        const config = priorityConfig[priority];
                        return (
                            <div key={priority} className="text-center p-2 rounded-xl bg-background/50">
                                <div className={`w-2 h-2 rounded-full ${config.color} mx-auto mb-1`} />
                                <p className="text-lg font-bold">{count}</p>
                                <p className="text-[10px] text-muted-foreground">{config.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* How AI works */}
            <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    AI Nasıl Çalışır?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { title: 'KM Analizi', desc: 'Güncel ve geçmiş KM verilerini analiz eder' },
                        { title: 'Tarih Bazlı', desc: 'Son bakım tarihlerini ve periyotları kontrol eder' },
                        { title: 'Kullanım Yoğunluğu', desc: 'Aylık ortalama KM\'ye göre aralıkları ayarlar' },
                        { title: 'Yakıt Analizi', desc: 'Yakıt tüketim değişikliklerini izler' },
                    ].map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-accent/50 border border-border/50">
                            <p className="text-xs font-semibold mb-1">{item.title}</p>
                            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Per Vehicle Recommendations */}
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-card" />)}
                </div>
            ) : Object.keys(vehicleRecs).length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                    <Brain className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Veri Bekleniyor</h3>
                    <p className="text-sm text-muted-foreground">
                        Araç, KM ve bakım verisi girdikçe AI öneriler otomatik oluşacaktır
                    </p>
                </div>
            ) : (
                Object.entries(vehicleRecs).map(([plate, recs]) => (
                    <div key={plate} className="bg-card rounded-2xl border border-border">
                        <div className="p-4 border-b border-border flex items-center gap-2">
                            <Car className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm">{plate}</h3>
                            <span className="text-xs text-muted-foreground">({recs.length} öneri)</span>
                        </div>
                        <div className="divide-y divide-border">
                            {recs.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    Bu araç için öneri bulunmuyor ✅
                                </div>
                            ) : (
                                recs.map((rec, i) => {
                                    const config = priorityConfig[rec.priority];
                                    return (
                                        <div key={i} className={`px-4 py-3 ${config.bgColor}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full ${config.color} mt-1.5 flex-shrink-0 ${rec.priority === 'critical' ? 'animate-pulse-soft' : ''
                                                    }`} />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-semibold">{rec.title}</p>
                                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bgColor} ${config.textColor}`}>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{rec.message}</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        {rec.dueKm && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                📍 Hedef KM: {rec.dueKm.toLocaleString('tr-TR')}
                                                            </span>
                                                        )}
                                                        {rec.dueDate && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                📅 {new Date(rec.dueDate).toLocaleDateString('tr-TR')}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-muted-foreground">
                                                            🎯 Güven: %{Math.round(rec.confidence * 100)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
