import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import {
    Vehicle,
    KmLog,
    FuelLog,
    MaintenanceLog,
    Insurance,
    TaxPayment,
    Inspection,
    TireInfo,
    Notification,
    AIRecommendation,
} from '@/types';

interface AppState {
    // Auth
    user: FirebaseUser | null;
    loading: boolean;
    setUser: (user: FirebaseUser | null) => void;
    setLoading: (loading: boolean) => void;

    // Vehicles
    vehicles: Vehicle[];
    selectedVehicle: Vehicle | null;
    setVehicles: (vehicles: Vehicle[]) => void;
    setSelectedVehicle: (vehicle: Vehicle | null) => void;
    addVehicle: (vehicle: Vehicle) => void;
    updateVehicle: (id: string, data: Partial<Vehicle>) => void;
    removeVehicle: (id: string) => void;

    // KM Logs
    kmLogs: KmLog[];
    setKmLogs: (logs: KmLog[]) => void;
    addKmLog: (log: KmLog) => void;

    // Fuel Logs
    fuelLogs: FuelLog[];
    setFuelLogs: (logs: FuelLog[]) => void;
    addFuelLog: (log: FuelLog) => void;

    // Maintenance Logs
    maintenanceLogs: MaintenanceLog[];
    setMaintenanceLogs: (logs: MaintenanceLog[]) => void;
    addMaintenanceLog: (log: MaintenanceLog) => void;

    // Insurance
    insurances: Insurance[];
    setInsurances: (insurances: Insurance[]) => void;

    // Tax Payments
    taxPayments: TaxPayment[];
    setTaxPayments: (payments: TaxPayment[]) => void;

    // Inspections
    inspections: Inspection[];
    setInspections: (inspections: Inspection[]) => void;

    // Tires
    tireInfos: TireInfo[];
    setTireInfos: (tires: TireInfo[]) => void;

    // Notifications
    notifications: Notification[];
    setNotifications: (notifications: Notification[]) => void;
    unreadCount: number;

    // AI
    recommendations: AIRecommendation[];
    setRecommendations: (recommendations: AIRecommendation[]) => void;

    // UI
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
    // Auth
    user: null,
    loading: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),

    // Vehicles
    vehicles: [],
    selectedVehicle: null,
    setVehicles: (vehicles) => set({ vehicles }),
    setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
    addVehicle: (vehicle) => set((s) => ({ vehicles: [vehicle, ...s.vehicles] })),
    updateVehicle: (id, data) =>
        set((s) => ({
            vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...data } : v)),
            selectedVehicle:
                s.selectedVehicle?.id === id
                    ? { ...s.selectedVehicle, ...data }
                    : s.selectedVehicle,
        })),
    removeVehicle: (id) =>
        set((s) => ({
            vehicles: s.vehicles.filter((v) => v.id !== id),
            selectedVehicle: s.selectedVehicle?.id === id ? null : s.selectedVehicle,
        })),

    // KM Logs
    kmLogs: [],
    setKmLogs: (kmLogs) => set({ kmLogs }),
    addKmLog: (log) => set((s) => ({ kmLogs: [log, ...s.kmLogs] })),

    // Fuel Logs
    fuelLogs: [],
    setFuelLogs: (fuelLogs) => set({ fuelLogs }),
    addFuelLog: (log) => set((s) => ({ fuelLogs: [log, ...s.fuelLogs] })),

    // Maintenance
    maintenanceLogs: [],
    setMaintenanceLogs: (maintenanceLogs) => set({ maintenanceLogs }),
    addMaintenanceLog: (log) =>
        set((s) => ({ maintenanceLogs: [log, ...s.maintenanceLogs] })),

    // Insurance
    insurances: [],
    setInsurances: (insurances) => set({ insurances }),

    // Tax
    taxPayments: [],
    setTaxPayments: (taxPayments) => set({ taxPayments }),

    // Inspections
    inspections: [],
    setInspections: (inspections) => set({ inspections }),

    // Tires
    tireInfos: [],
    setTireInfos: (tireInfos) => set({ tireInfos }),

    // Notifications
    notifications: [],
    setNotifications: (notifications) =>
        set({
            notifications,
            unreadCount: notifications.filter((n) => !n.readStatus).length,
        }),
    unreadCount: 0,

    // AI
    recommendations: [],
    setRecommendations: (recommendations) => set({ recommendations }),

    // UI
    sidebarOpen: false,
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    activeTab: 'dashboard',
    setActiveTab: (activeTab) => set({ activeTab }),
}));
