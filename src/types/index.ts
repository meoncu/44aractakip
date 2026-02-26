import { Timestamp } from 'firebase/firestore';

export interface User {
    uid: string;
    name: string;
    email: string;
    photoURL?: string;
    createdAt: Timestamp | Date;
}

export interface Vehicle {
    id: string;
    userId: string;
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
    licenseOwner: string;
    licenseDetails: string;
    fuelType: 'Benzin' | 'Dizel' | 'LPG' | 'Elektrik' | 'Hibrit';
    currentKm: number;
    imageUrl?: string;
    createdAt: Timestamp | Date;
}

export interface KmLog {
    id: string;
    vehicleId: string;
    kmValue: number;
    entryDate: string;
    notes?: string;
    createdAt: Timestamp | Date;
}

export interface FuelLog {
    id: string;
    vehicleId: string;
    kmAtFuel: number;
    fuelAmountLiter: number;
    fuelCost: number;
    fuelType: string;
    date: string;
    calculatedConsumption?: number;
    costPerKm?: number;
    station?: string;
    createdAt: Timestamp | Date;
}

export interface MaintenanceLog {
    id: string;
    vehicleId: string;
    type: MaintenanceType;
    customType?: string;
    kmAtMaintenance: number;
    date: string;
    nextDueKm?: number;
    nextDueDate?: string;
    cost: number;
    notes?: string;
    createdAt: Timestamp | Date;
}

export type MaintenanceType =
    | 'Yağ Değişimi'
    | 'Lastik Değişimi'
    | 'Antifriz'
    | 'Balata Değişimi'
    | 'Fren Diski'
    | 'Filtre Değişimi'
    | 'Akü Değişimi'
    | 'Triger Seti'
    | 'Bujiler'
    | 'V-Kayışı'
    | 'Amortisör'
    | 'Rot Balans'
    | 'Klima Bakımı'
    | 'Genel Bakım'
    | 'Diğer';

export interface Insurance {
    id: string;
    vehicleId: string;
    type: 'Kasko' | 'Trafik' | 'İMM';
    companyName: string;
    policyNumber: string;
    amount: number;
    coverageDetails: string;
    startDate: string;
    endDate: string;
    agentName?: string;
    agentPhone?: string;
    policyFileUrl?: string;
    createdAt: Timestamp | Date;
}

export interface TaxPayment {
    id: string;
    vehicleId: string;
    year: number;
    januaryPaid: boolean;
    julyPaid: boolean;
    januaryAmount?: number;
    julyAmount?: number;
    totalAmount: number;
    januaryPaymentDate?: string;
    julyPaymentDate?: string;
    createdAt: Timestamp | Date;
}

export interface Inspection {
    id: string;
    vehicleId: string;
    lastInspectionDate: string;
    nextInspectionDate: string;
    inspectionCost: number;
    result: 'Geçti' | 'Kaldı' | 'Bekliyor';
    notes?: string;
    createdAt: Timestamp | Date;
}

export interface TireInfo {
    id: string;
    vehicleId: string;
    brand: string;
    size: string;
    installDate: string;
    expiryDate: string;
    kmAtInstall: number;
    warningMonths: number;
    type: 'Yaz' | 'Kış' | '4 Mevsim';
    notes?: string;
    createdAt: Timestamp | Date;
}

export interface Notification {
    id: string;
    userId: string;
    vehicleId: string;
    type: NotificationType;
    title: string;
    message: string;
    dueDate: string;
    readStatus: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: Timestamp | Date;
}

export type NotificationType =
    | 'maintenance'
    | 'insurance'
    | 'tax'
    | 'inspection'
    | 'tire'
    | 'fuel'
    | 'km'
    | 'ai_suggestion';

export interface AIRecommendation {
    type: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueKm?: number;
    dueDate?: string;
    estimatedCost?: string;
    confidence: number;
}

export interface DashboardStats {
    totalVehicles: number;
    upcomingMaintenance: number;
    monthlyFuelCost: number;
    criticalAlerts: number;
    totalKm: number;
    avgConsumption: number;
}
