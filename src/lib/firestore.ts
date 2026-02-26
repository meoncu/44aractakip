import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
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
    User,
} from '@/types';

// =================== Users ===================
export async function createOrUpdateUser(user: User): Promise<void> {
    await setDoc(doc(db, 'users', user.uid), {
        ...user,
        createdAt: user.createdAt || Timestamp.now(),
    }, { merge: true });
}

export async function getUser(uid: string): Promise<User | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { ...snap.data(), uid: snap.id } as User;
}

// =================== Vehicles ===================
export async function getVehicles(userId: string): Promise<Vehicle[]> {
    const q = query(
        collection(db, 'vehicles'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Vehicle));
}

export async function addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'vehicles'), {
        ...vehicle,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<void> {
    await updateDoc(doc(db, 'vehicles', id), data as Record<string, unknown>);
}

export async function deleteVehicle(id: string): Promise<void> {
    await deleteDoc(doc(db, 'vehicles', id));
}

// =================== KM Logs ===================
export async function getKmLogs(vehicleId: string): Promise<KmLog[]> {
    const q = query(
        collection(db, 'kmLogs'),
        where('vehicleId', '==', vehicleId),
        orderBy('entryDate', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as KmLog));
}

export async function addKmLog(log: Omit<KmLog, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'kmLogs'), {
        ...log,
        createdAt: Timestamp.now(),
    });
    // Update vehicle current km
    const vehicleRef = doc(db, 'vehicles', log.vehicleId);
    await updateDoc(vehicleRef, { currentKm: log.kmValue });
    return docRef.id;
}

export async function updateKmLog(id: string, data: Partial<KmLog>): Promise<void> {
    await updateDoc(doc(db, 'kmLogs', id), data as Record<string, unknown>);
    if (data.kmValue && data.vehicleId) {
        const vehicleRef = doc(db, 'vehicles', data.vehicleId);
        await updateDoc(vehicleRef, { currentKm: data.kmValue });
    }
}

export async function deleteKmLog(id: string): Promise<void> {
    await deleteDoc(doc(db, 'kmLogs', id));
}

// =================== Fuel Logs ===================
export async function getFuelLogs(vehicleId: string): Promise<FuelLog[]> {
    const q = query(
        collection(db, 'fuelLogs'),
        where('vehicleId', '==', vehicleId),
        orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as FuelLog));
}

export async function addFuelLog(log: Omit<FuelLog, 'id'>): Promise<string> {
    // Calculate consumption if previous log exists
    const prevLogs = await getFuelLogs(log.vehicleId);
    let calculatedConsumption: number | undefined;
    let costPerKm: number | undefined;

    if (prevLogs.length > 0) {
        const prevLog = prevLogs[0]; // Most recent
        const kmDiff = log.kmAtFuel - prevLog.kmAtFuel;
        if (kmDiff > 0) {
            calculatedConsumption = (log.fuelAmountLiter / kmDiff) * 100;
            costPerKm = log.fuelCost / kmDiff;
        }
    }

    const dataToSave = {
        ...log,
        createdAt: Timestamp.now(),
        ...(calculatedConsumption !== undefined && { calculatedConsumption }),
        ...(costPerKm !== undefined && { costPerKm }),
    };

    const docRef = await addDoc(collection(db, 'fuelLogs'), dataToSave);

    // Update vehicle current km
    await updateDoc(doc(db, 'vehicles', log.vehicleId), { currentKm: log.kmAtFuel });

    return docRef.id;
}

export async function updateFuelLog(id: string, data: Partial<FuelLog>): Promise<void> {
    // If km or fuel amount changed, we might want to recalculate, 
    // but for simplicity we'll just update the provided fields.
    await updateDoc(doc(db, 'fuelLogs', id), data as Record<string, unknown>);

    if (data.kmAtFuel && data.vehicleId) {
        await updateDoc(doc(db, 'vehicles', data.vehicleId), { currentKm: data.kmAtFuel });
    }
}

export async function deleteFuelLog(id: string): Promise<void> {
    await deleteDoc(doc(db, 'fuelLogs', id));
}

// =================== Maintenance Logs ===================
export async function getMaintenanceLogs(vehicleId: string): Promise<MaintenanceLog[]> {
    const q = query(
        collection(db, 'maintenanceLogs'),
        where('vehicleId', '==', vehicleId),
        orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as MaintenanceLog));
}

export async function addMaintenanceLog(log: Omit<MaintenanceLog, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'maintenanceLogs'), {
        ...log,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateMaintenanceLog(id: string, data: Partial<MaintenanceLog>): Promise<void> {
    await updateDoc(doc(db, 'maintenanceLogs', id), data as Record<string, unknown>);
}

export async function deleteMaintenanceLog(id: string): Promise<void> {
    await deleteDoc(doc(db, 'maintenanceLogs', id));
}

// =================== Insurance ===================
export async function getInsurances(vehicleId: string): Promise<Insurance[]> {
    const q = query(
        collection(db, 'insurances'),
        where('vehicleId', '==', vehicleId),
        orderBy('endDate', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Insurance));
}

export async function addInsurance(ins: Omit<Insurance, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'insurances'), {
        ...ins,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateInsurance(id: string, data: Partial<Insurance>): Promise<void> {
    await updateDoc(doc(db, 'insurances', id), data as Record<string, unknown>);
}

export async function deleteInsurance(id: string): Promise<void> {
    await deleteDoc(doc(db, 'insurances', id));
}

// =================== Tax Payments ===================
export async function getTaxPayments(vehicleId: string): Promise<TaxPayment[]> {
    const q = query(
        collection(db, 'taxPayments'),
        where('vehicleId', '==', vehicleId),
        orderBy('year', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as TaxPayment));
}

export async function addTaxPayment(tp: Omit<TaxPayment, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'taxPayments'), {
        ...tp,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateTaxPayment(id: string, data: Partial<TaxPayment>): Promise<void> {
    await updateDoc(doc(db, 'taxPayments', id), data as Record<string, unknown>);
}

export async function deleteTaxPayment(id: string): Promise<void> {
    await deleteDoc(doc(db, 'taxPayments', id));
}

// =================== Inspections ===================
export async function getInspections(vehicleId: string): Promise<Inspection[]> {
    const q = query(
        collection(db, 'inspections'),
        where('vehicleId', '==', vehicleId),
        orderBy('lastInspectionDate', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Inspection));
}

export async function addInspection(insp: Omit<Inspection, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'inspections'), {
        ...insp,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateInspection(id: string, data: Partial<Inspection>): Promise<void> {
    await updateDoc(doc(db, 'inspections', id), data as Record<string, unknown>);
}

export async function deleteInspection(id: string): Promise<void> {
    await deleteDoc(doc(db, 'inspections', id));
}

// =================== Tire Info ===================
export async function getTireInfos(vehicleId: string): Promise<TireInfo[]> {
    const q = query(
        collection(db, 'tireInfos'),
        where('vehicleId', '==', vehicleId),
        orderBy('installDate', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as TireInfo));
}

export async function addTireInfo(tire: Omit<TireInfo, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'tireInfos'), {
        ...tire,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateTireInfo(id: string, data: Partial<TireInfo>): Promise<void> {
    await updateDoc(doc(db, 'tireInfos', id), data as Record<string, unknown>);
}

export async function deleteTireInfo(id: string): Promise<void> {
    await deleteDoc(doc(db, 'tireInfos', id));
}

// =================== Notifications ===================
export async function getNotifications(userId: string): Promise<Notification[]> {
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Notification));
}

export async function addNotification(notif: Omit<Notification, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'notifications'), {
        ...notif,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function markNotificationRead(id: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', id), { readStatus: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    const notifs = await getNotifications(userId);
    const unread = notifs.filter(n => !n.readStatus);
    await Promise.all(unread.map(n => markNotificationRead(n.id)));
}

export async function deleteNotification(id: string): Promise<void> {
    await deleteDoc(doc(db, 'notifications', id));
}
