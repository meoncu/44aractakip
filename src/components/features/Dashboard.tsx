'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { getVehicles, getFuelLogs, getMaintenanceLogs, getKmLogs, getInsurances, getInspections, getNotifications } from '@/lib/firestore';
import { generateAIRecommendations, getMaintenanceScore } from '@/lib/ai-predictions';
import { formatCurrency, formatNumber, daysUntil } from '@/lib/utils';
import {
    Car, Fuel, Wrench, AlertTriangle, TrendingUp, Gauge, Shield, Activity, Brain,
    ChevronRight, Calendar
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

export default function Dashboard() {
    const { user, vehicles, setVehicles, selectedVehicle, setSelectedVehicle, setRecommendations, setActiveTab } = useStore();
    const [stats, setStats] = useState({
        totalVehicles: 0,
        upcomingMaintenance: 0,
        monthlyFuelCost: 0,
        criticalAlerts: 0,
        totalKm: 0,
        avgConsumption: 0,
        maintenanceScore: 100,
    });
    const [fuelChartData, setFuelChartData] = useState<Array<{ month: string; cost: number; consumption: number }>>([]);
    const [loading, setLoading] = useState(true);
    const [upcomingItems, setUpcomingItems] = useState<Array<{ type: string; title: string; date: string; priority: string }>>([]);

    useEffect(() => {
        if (!user) return;
        loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const vehicleList = await getVehicles(user.uid);
            setVehicles(vehicleList);

            let totalFuelCost = 0;
            let totalConsumption = 0;
            let consumptionCount = 0;
            let upcomingMaintenanceCount = 0;
            let criticalCount = 0;
            let totalKm = 0;
            const upcoming: Array<{ type: string; title: string; date: string; priority: string }> = [];
            const monthlyFuelData: Record<string, { cost: number; consumption: number }> = {};
            let allRecommendations: ReturnType<typeof generateAIRecommendations> = [];

            for (const vehicle of vehicleList) {
                totalKm += vehicle.currentKm || 0;

                const [fuelLogs, maintenanceLogs, kmLogs, insurances, inspections] = await Promise.all([
                    getFuelLogs(vehicle.id),
                    getMaintenanceLogs(vehicle.id),
                    getKmLogs(vehicle.id),
                    getInsurances(vehicle.id),
                    getInspections(vehicle.id),
                ]);

                // Fuel stats
                const now = new Date();
                const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                fuelLogs.forEach(log => {
                    const logMonth = log.date.substring(0, 7);
                    if (!monthlyFuelData[logMonth]) {
                        monthlyFuelData[logMonth] = { cost: 0, consumption: 0 };
                    }
                    monthlyFuelData[logMonth].cost += log.fuelCost;
                    if (log.calculatedConsumption) {
                        monthlyFuelData[logMonth].consumption += log.calculatedConsumption;
                    }
                    if (logMonth === thisMonth) {
                        totalFuelCost += log.fuelCost;
                    }
                    if (log.calculatedConsumption && log.calculatedConsumption > 0) {
                        totalConsumption += log.calculatedConsumption;
                        consumptionCount++;
                    }
                });

                // AI recommendations
                const recs = generateAIRecommendations(vehicle, maintenanceLogs, kmLogs, fuelLogs);
                allRecommendations = [...allRecommendations, ...recs];
                criticalCount += recs.filter(r => r.priority === 'critical').length;
                upcomingMaintenanceCount += recs.filter(r => r.priority !== 'low').length;

                // Maintenance upcoming
                maintenanceLogs.forEach(ml => {
                    if (ml.nextDueDate) {
                        const days = daysUntil(ml.nextDueDate);
                        if (days <= 30 && days > 0) {
                            upcoming.push({
                                type: 'maintenance',
                                title: `${vehicle.plateNumber} - ${ml.type}`,
                                date: ml.nextDueDate,
                                priority: days <= 7 ? 'high' : 'medium',
                            });
                        }
                    }
                });

                // Insurance upcoming
                insurances.forEach(ins => {
                    const days = daysUntil(ins.endDate);
                    if (days <= 30 && days > 0) {
                        upcoming.push({
                            type: 'insurance',
                            title: `${vehicle.plateNumber} - ${ins.type} Bitiyor`,
                            date: ins.endDate,
                            priority: days <= 7 ? 'high' : 'medium',
                        });
                    }
                });

                // Inspection upcoming
                inspections.forEach(insp => {
                    const days = daysUntil(insp.nextInspectionDate);
                    if (days <= 30 && days > 0) {
                        upcoming.push({
                            type: 'inspection',
                            title: `${vehicle.plateNumber} - TÜVTÜRK Muayene`,
                            date: insp.nextInspectionDate,
                            priority: days <= 7 ? 'high' : 'medium',
                        });
                    }
                });
            }

            setRecommendations(allRecommendations);
            const maintenanceScore = getMaintenanceScore(allRecommendations);

            // Build chart data
            const sortedMonths = Object.keys(monthlyFuelData).sort();
            const chartData = sortedMonths.slice(-6).map(month => ({
                month: new Date(month + '-01').toLocaleDateString('tr-TR', { month: 'short' }),
                cost: Math.round(monthlyFuelData[month].cost),
                consumption: Math.round(monthlyFuelData[month].consumption * 10) / 10,
            }));

            setFuelChartData(chartData);
            setUpcomingItems(upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            setStats({
                totalVehicles: vehicleList.length,
                upcomingMaintenance: upcomingMaintenanceCount,
                monthlyFuelCost: totalFuelCost,
                criticalAlerts: criticalCount,
                totalKm,
                avgConsumption: consumptionCount > 0 ? totalConsumption / consumptionCount : 0,
                maintenanceScore,
            });
        } catch (error) {
            console.error('Dashboard data error:', error);
        }
        setLoading(false);
    };

    const statCards = [
        {
            label: 'Toplam Araç',
            value: stats.totalVehicles.toString(),
            icon: Car,
            color: 'from-blue-500 to-blue-600',
            shadowColor: 'shadow-blue-500/20',
        },
        {
            label: 'Yaklaşan Bakım',
            value: stats.upcomingMaintenance.toString(),
            icon: Wrench,
            color: 'from-orange-500 to-orange-600',
            shadowColor: 'shadow-orange-500/20',
        },
        {
            label: 'Aylık Yakıt',
            value: formatCurrency(stats.monthlyFuelCost),
            icon: Fuel,
            color: 'from-green-500 to-green-600',
            shadowColor: 'shadow-green-500/20',
        },
        {
            label: 'Kritik Uyarılar',
            value: stats.criticalAlerts.toString(),
            icon: AlertTriangle,
            color: stats.criticalAlerts > 0 ? 'from-red-500 to-red-600' : 'from-emerald-500 to-emerald-600',
            shadowColor: stats.criticalAlerts > 0 ? 'shadow-red-500/20' : 'shadow-emerald-500/20',
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 rounded-2xl bg-card" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 rounded-2xl bg-card" />
                    <div className="h-80 rounded-2xl bg-card" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h2 className="text-2xl font-bold text-foreground">
                    Merhaba{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''} 👋
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Araçlarınızın durumu aşağıda özetlenmiştir
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} p-4 text-white shadow-lg ${card.shadowColor} hover:scale-[1.02] transition-transform`}
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-4 translate-x-4" />
                        <card.icon className="w-5 h-5 mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{card.value}</p>
                        <p className="text-xs opacity-80 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Health Score & Quick KM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Health Score */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-sm">Bakım Skoru</h3>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-border" strokeWidth="8" />
                                <circle
                                    cx="60" cy="60" r="50" fill="none"
                                    stroke={stats.maintenanceScore >= 80 ? '#22c55e' : stats.maintenanceScore >= 50 ? '#f59e0b' : '#ef4444'}
                                    strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray={`${stats.maintenanceScore * 3.14} 314`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold">{stats.maintenanceScore}</span>
                                <span className="text-[10px] text-muted-foreground">/ 100</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        {stats.maintenanceScore >= 80 ? 'Araçlarınız iyi durumda ✅' :
                            stats.maintenanceScore >= 50 ? 'Bazı bakımlar yaklaşıyor ⚠️' :
                                'Acil bakımlar var! 🚨'}
                    </p>
                </div>

                {/* General Stats */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                    <div className="flex items-center gap-2 mb-4">
                        <Gauge className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-sm">Genel İstatistikler</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Toplam KM</span>
                            <span className="text-sm font-semibold">{formatNumber(stats.totalKm)} km</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Ort. Tüketim</span>
                            <span className="text-sm font-semibold">
                                {stats.avgConsumption > 0 ? `${stats.avgConsumption.toFixed(1)} L/100km` : '-'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Araç Sayısı</span>
                            <span className="text-sm font-semibold">{stats.totalVehicles}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">AI Önerisi</span>
                            <span className="text-sm font-semibold">{stats.upcomingMaintenance}</span>
                        </div>
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-sm">Yaklaşan İşlemler</h3>
                        </div>
                    </div>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto">
                        {upcomingItems.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">
                                Yaklaşan işlem bulunmuyor 🎉
                            </p>
                        ) : (
                            upcomingItems.slice(0, 5).map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{item.title}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(item.date).toLocaleDateString('tr-TR')} ({daysUntil(item.date)} gün)
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fuel Cost Chart */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-sm">Aylık Yakıt Maliyeti</h3>
                    </div>
                    {fuelChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={fuelChartData}>
                                <defs>
                                    <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(221.2, 83.2%, 53.3%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(221.2, 83.2%, 53.3%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'hsl(222.2 84% 8%)',
                                        border: '1px solid hsl(217.2 32.6% 17.5%)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: any) => [formatCurrency(Number(value)), 'Maliyet']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="cost"
                                    stroke="hsl(221.2, 83.2%, 53.3%)"
                                    fill="url(#fuelGradient)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                            Henüz yakıt verisi bulunmuyor
                        </div>
                    )}
                </div>

                {/* AI Suggestions Card */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <h3 className="font-semibold text-sm">AI Bakım Önerileri</h3>
                        </div>
                        <button
                            onClick={() => setActiveTab('ai')}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            Tümü <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {useStore.getState().recommendations.length === 0 ? (
                            <div className="text-center py-8">
                                <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Araç verisi girdikçe AI öneriler oluşacaktır
                                </p>
                            </div>
                        ) : (
                            useStore.getState().recommendations.slice(0, 4).map((rec, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-accent/50 border border-border/50">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${rec.priority === 'critical' ? 'bg-red-500 animate-pulse-soft' :
                                        rec.priority === 'high' ? 'bg-orange-500' :
                                            rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`} />
                                    <div>
                                        <p className="text-xs font-medium">{rec.title}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                                            {rec.message}
                                        </p>
                                        {rec.confidence > 0 && (
                                            <p className="text-[9px] text-muted-foreground mt-1">
                                                Güven: %{Math.round(rec.confidence * 100)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
