import { Vehicle, MaintenanceLog, KmLog, FuelLog, AIRecommendation } from '@/types';

// Default maintenance intervals
const MAINTENANCE_INTERVALS = {
    'Yağ Değişimi': { km: 10000, months: 12 },
    'Lastik Değişimi': { km: 50000, months: 36 },
    'Antifriz': { km: 40000, months: 24 },
    'Balata Değişimi': { km: 30000, months: 24 },
    'Fren Diski': { km: 60000, months: 36 },
    'Filtre Değişimi': { km: 15000, months: 12 },
    'Akü Değişimi': { km: 60000, months: 48 },
    'Triger Seti': { km: 90000, months: 60 },
    'Bujiler': { km: 30000, months: 24 },
    'V-Kayışı': { km: 60000, months: 48 },
    'Amortisör': { km: 80000, months: 48 },
    'Rot Balans': { km: 20000, months: 12 },
    'Klima Bakımı': { km: 30000, months: 12 },
    'Genel Bakım': { km: 20000, months: 12 },
};

function calculateMonthlyKm(kmLogs: KmLog[]): number {
    if (kmLogs.length < 2) return 1500; // default

    const sorted = [...kmLogs].sort((a, b) =>
        new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    const firstDate = new Date(sorted[0].entryDate);
    const lastDate = new Date(sorted[sorted.length - 1].entryDate);
    const months = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const kmDiff = sorted[sorted.length - 1].kmValue - sorted[0].kmValue;

    return Math.round(kmDiff / months);
}

function getUsageIntensity(monthlyKm: number): 'low' | 'normal' | 'high' | 'very_high' {
    if (monthlyKm < 500) return 'low';
    if (monthlyKm < 1500) return 'normal';
    if (monthlyKm < 3000) return 'high';
    return 'very_high';
}

function getIntensityMultiplier(intensity: string): number {
    switch (intensity) {
        case 'low': return 1.2;
        case 'normal': return 1.0;
        case 'high': return 0.85;
        case 'very_high': return 0.7;
        default: return 1.0;
    }
}

function getPriorityFromDays(daysUntilDue: number): 'low' | 'medium' | 'high' | 'critical' {
    if (daysUntilDue <= 0) return 'critical';
    if (daysUntilDue <= 7) return 'high';
    if (daysUntilDue <= 30) return 'medium';
    return 'low';
}

function getPriorityFromKm(kmRemaining: number): 'low' | 'medium' | 'high' | 'critical' {
    if (kmRemaining <= 0) return 'critical';
    if (kmRemaining <= 500) return 'high';
    if (kmRemaining <= 2000) return 'medium';
    return 'low';
}

export function generateAIRecommendations(
    vehicle: Vehicle,
    maintenanceLogs: MaintenanceLog[],
    kmLogs: KmLog[],
    fuelLogs: FuelLog[]
): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const currentKm = vehicle.currentKm;
    const monthlyKm = calculateMonthlyKm(kmLogs);
    const intensity = getUsageIntensity(monthlyKm);
    const multiplier = getIntensityMultiplier(intensity);

    // Check each maintenance type
    Object.entries(MAINTENANCE_INTERVALS).forEach(([type, interval]) => {
        const lastMaint = maintenanceLogs
            .filter(m => m.type === type)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const adjustedKmInterval = Math.round(interval.km * multiplier);
        const adjustedMonthInterval = Math.round(interval.months * multiplier);

        if (lastMaint) {
            // Calculate km-based prediction
            const kmSinceLastMaint = currentKm - lastMaint.kmAtMaintenance;
            const kmRemaining = adjustedKmInterval - kmSinceLastMaint;

            // Calculate date-based prediction
            const lastDate = new Date(lastMaint.date);
            const nextDate = new Date(lastDate);
            nextDate.setMonth(nextDate.getMonth() + adjustedMonthInterval);
            const daysUntilDue = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            // Estimate when km will be reached
            const daysUntilKmReached = monthlyKm > 0 ? Math.round((kmRemaining / monthlyKm) * 30) : 999;
            const effectiveDays = Math.min(daysUntilDue, daysUntilKmReached);

            if (effectiveDays <= 60 || kmRemaining <= 3000) {
                const priority = kmRemaining <= 0 || daysUntilDue <= 0 ? 'critical' :
                    Math.min(kmRemaining, 3000) <= 500 || effectiveDays <= 7 ? 'high' :
                        effectiveDays <= 30 ? 'medium' : 'low';

                const estimatedNextDate = new Date();
                estimatedNextDate.setDate(estimatedNextDate.getDate() + Math.max(0, effectiveDays));

                recommendations.push({
                    type: type,
                    title: `${type} Zamanı ${kmRemaining <= 0 ? 'Geçti!' : 'Yaklaşıyor'}`,
                    message: kmRemaining <= 0
                        ? `${type} ${Math.abs(kmRemaining)} km geçmiştir. Acil bakım yapılmalıdır.`
                        : `${type} için ${kmRemaining.toLocaleString('tr-TR')} km kaldı. Tahmini tarih: ${estimatedNextDate.toLocaleDateString('tr-TR')}`,
                    priority,
                    dueKm: lastMaint.kmAtMaintenance + adjustedKmInterval,
                    dueDate: estimatedNextDate.toISOString().split('T')[0],
                    confidence: kmLogs.length >= 5 ? 0.9 : kmLogs.length >= 3 ? 0.75 : 0.6,
                });
            }
        } else {
            // No maintenance record - suggest based on vehicle age and km
            const vehicleAge = new Date().getFullYear() - vehicle.year;
            if (currentKm > interval.km * 0.8 || vehicleAge > interval.months / 12) {
                recommendations.push({
                    type: type,
                    title: `${type} Kontrolü Önerilir`,
                    message: `Bu araç için ${type} kaydı bulunmuyor. Aracınızın ${currentKm.toLocaleString('tr-TR')} km'de olduğu göz önünde bulundurularak kontrol önerilir.`,
                    priority: 'medium',
                    dueKm: currentKm + 1000,
                    confidence: 0.5,
                });
            }
        }
    });

    // Fuel efficiency analysis
    if (fuelLogs.length >= 3) {
        const recentLogs = [...fuelLogs]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        const avgConsumption = recentLogs
            .filter(l => l.calculatedConsumption && l.calculatedConsumption > 0)
            .reduce((acc, l) => acc + (l.calculatedConsumption || 0), 0) / recentLogs.length;

        if (avgConsumption > 12 && vehicle.fuelType !== 'Elektrik') {
            recommendations.push({
                type: 'Yakıt Uyarısı',
                title: 'Yüksek Yakıt Tüketimi Tespit Edildi',
                message: `Son ${recentLogs.length} yakıt girişine göre ortalama tüketim ${avgConsumption.toFixed(1)} L/100km. Bu değer normalin üzerinde olabilir. Motor bakımı veya hava filtresi kontrolü önerilir.`,
                priority: avgConsumption > 15 ? 'high' : 'medium',
                confidence: 0.7,
            });
        }
    }

    // Usage intensity warning
    if (intensity === 'very_high') {
        recommendations.push({
            type: 'Kullanım Uyarısı',
            title: 'Yoğun Kullanım Tespit Edildi',
            message: `Aylık ortalama ${monthlyKm.toLocaleString('tr-TR')} km kullanım tespit edildi. Yoğun kullanım nedeniyle bakım aralıklarınız %30 kısaltılmıştır.`,
            priority: 'medium',
            confidence: 0.85,
        });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
}

export function getMaintenanceScore(recommendations: AIRecommendation[]): number {
    if (recommendations.length === 0) return 100;

    const criticalCount = recommendations.filter(r => r.priority === 'critical').length;
    const highCount = recommendations.filter(r => r.priority === 'high').length;
    const mediumCount = recommendations.filter(r => r.priority === 'medium').length;

    let score = 100;
    score -= criticalCount * 25;
    score -= highCount * 15;
    score -= mediumCount * 5;

    return Math.max(0, Math.min(100, score));
}
