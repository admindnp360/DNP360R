import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Attendance, Complaint, ComplaintCategory, ComplaintStatus, House, HouseVisit, Notice, SecretKey, User, Ward } from '@/types';

interface AppContextType {
  complaints: Complaint[];
  houses: House[];
  wards: Ward[];
  notices: Notice[];
  attendance: Attendance[];
  houseVisits: HouseVisit[];
  users: User[];
  secretKeys: SecretKey[];
  addComplaint: (c: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateComplaint: (id: string, updates: Partial<Complaint>) => Promise<void>;
  addHouseVisit: (visit: Omit<HouseVisit, 'id'>) => Promise<void>;
  markAttendance: (workerId: string, method?: 'qr' | 'manual') => Promise<boolean>;
  addHouse: (h: Omit<House, 'id'>) => Promise<void>;
  updateHouse: (id: string, updates: Partial<House>) => Promise<void>;
  deleteHouse: (id: string) => Promise<void>;
  addWard: (w: Omit<Ward, 'id'>) => Promise<void>;
  updateWard: (id: string, updates: Partial<Ward>) => Promise<void>;
  addNotice: (n: Omit<Notice, 'id' | 'createdAt'>) => Promise<void>;
  updateNotice: (id: string, updates: Partial<Notice>) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;
  addUser: (u: User) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addSecretKey: (role: SecretKey['role']) => Promise<SecretKey>;
  toggleSecretKey: (id: string) => Promise<void>;
  deleteSecretKey: (id: string) => Promise<void>;
  getHouseByRegistration: (regNum: string) => House | undefined;
  getComplaintsByUser: (userId: string) => Complaint[];
  getAttendanceByWorker: (workerId: string) => Attendance[];
  getVisitsByWorker: (workerId: string) => HouseVisit[];
  isTodayAttendanceMarked: (workerId: string) => boolean;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function genSecretKey(role: SecretKey['role']): string {
  const prefix = role === 'safaikarmi' ? 'SK' : role === 'official' ? 'OFF' : 'ADMIN';
  const digits = Math.floor(1000 + Math.random() * 9000);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${prefix}${digits}${letter}`;
}

const SEED_WARDS: Ward[] = [
  { id: 'ward-1', wardNumber: '1', name: 'Daudnagar Ward 1', area: 'Station Road Area', assignedWorkers: ['sk-001'], totalHouses: 120, officialId: 'off-001' },
  { id: 'ward-2', wardNumber: '2', name: 'Daudnagar Ward 2', area: 'Market Area', assignedWorkers: [], totalHouses: 98, officialId: 'off-001' },
  { id: 'ward-3', wardNumber: '3', name: 'Daudnagar Ward 3', area: 'Old Town', assignedWorkers: [], totalHouses: 145 },
  { id: 'ward-4', wardNumber: '4', name: 'Daudnagar Ward 4', area: 'Civil Line', assignedWorkers: [], totalHouses: 87 },
  { id: 'ward-42', wardNumber: '42', name: 'Daudnagar Ward 42', area: 'Sector 7 High Street', assignedWorkers: ['sk-001'], totalHouses: 65, officialId: 'off-001' },
  { id: 'ward-12', wardNumber: '12', name: 'Daudnagar Ward 12', area: 'Zone 4', assignedWorkers: [], totalHouses: 110, officialId: 'off-001' },
];

const SEED_HOUSES: House[] = [
  { id: 'h-001', registrationNumber: 'DNP-H-001', ownerName: 'Ramesh Prasad', mobile: '9934512300', address: 'Ward 42, Near Temple, Daudnagar', wardId: 'ward-42', wardNumber: '42', isActive: true },
  { id: 'h-002', registrationNumber: 'DNP-H-002', ownerName: 'Sunita Devi', mobile: '9934512301', address: 'Ward 42, Main Road, Daudnagar', wardId: 'ward-42', wardNumber: '42', isActive: true },
  { id: 'h-003', registrationNumber: 'DNP-H-003', ownerName: 'Manoj Kumar Singh', mobile: '9934512302', address: 'Ward 42, Shiv Nagar, Daudnagar', wardId: 'ward-42', wardNumber: '42', isActive: true },
  { id: 'h-004', registrationNumber: 'DNP-H-004', ownerName: 'Geeta Kumari', mobile: '9934512303', address: 'Ward 1, Station Road, Daudnagar', wardId: 'ward-1', wardNumber: '1', isActive: true },
  { id: 'h-005', registrationNumber: 'DNP-H-005', ownerName: 'Vijay Kumar', mobile: '9934512304', address: 'Ward 1, Near School, Daudnagar', wardId: 'ward-1', wardNumber: '1', isActive: true },
  { id: 'h-006', registrationNumber: 'DNP-H-006', ownerName: 'Anjali Singh', mobile: '9934512305', address: 'Ward 12, Civil Area, Daudnagar', wardId: 'ward-12', wardNumber: '12', isActive: true },
  { id: 'h-007', registrationNumber: 'DNP-H-007', ownerName: 'Pradeep Yadav', mobile: '9934512306', address: 'Ward 12, Green Park, Daudnagar', wardId: 'ward-12', wardNumber: '12', isActive: true },
  { id: 'h-008', registrationNumber: 'DNP-H-008', ownerName: 'Kavita Devi', mobile: '9934512307', address: 'Ward 2, Market Road, Daudnagar', wardId: 'ward-2', wardNumber: '2', isActive: true },
];

const SEED_NOTICES: Notice[] = [
  { id: 'n-001', title: 'Property Tax Due', content: 'All property holders are requested to pay their annual property tax before 31st March 2025 to avoid penalty. Payment can be made at Nagar Parishad office or online portal.', type: 'notice', priority: 'high', createdAt: '2025-01-10', isActive: true },
  { id: 'n-002', title: 'Water Supply Interruption', content: 'Due to maintenance work, water supply will be interrupted in Ward 3, 4, and 5 on 25th January from 9 AM to 5 PM. Please store water accordingly.', type: 'alert', priority: 'high', createdAt: '2025-01-20', isActive: true },
  { id: 'n-003', title: 'Cleanliness Drive - Swachh Bharat', content: 'Nagar Parishad Daudnagar is organizing a Swachh Bharat cleanliness drive on 26th January. All citizens are invited to participate.', type: 'announcement', priority: 'medium', createdAt: '2025-01-18', isActive: true },
  { id: 'n-004', title: 'Ward Committee Meeting', content: 'Monthly ward committee meeting will be held on 28th January at 11 AM in the Municipal Hall. All ward members are requested to attend.', type: 'notice', priority: 'low', createdAt: '2025-01-15', isActive: true },
  { id: 'n-005', title: 'New Birth Certificate Service', content: 'Now apply for birth and death certificates online through the DNP360 citizen portal. Visit services section for more information.', type: 'announcement', priority: 'medium', createdAt: '2025-01-12', isActive: true },
];

const d = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const SEED_COMPLAINTS: Complaint[] = [
  { id: 'c-001', citizenId: 'citizen-001', citizenName: 'Rahul Kumar', category: 'garbage_collection', description: 'Garbage has not been collected from our street for 3 days. The area is smelling bad and causing health hazard.', location: 'Ward 5, Near Post Office, Daudnagar', status: 'submitted', createdAt: d(2), updatedAt: d(2), wardId: 'ward-1', wardNumber: '1' },
  { id: 'c-002', citizenId: 'citizen-001', citizenName: 'Rahul Kumar', category: 'drainage', description: 'Open drain near our house is blocked and overflowing during rain. Causing mosquito breeding.', location: 'Ward 5, Ram Nagar, Daudnagar', status: 'assigned', createdAt: d(5), updatedAt: d(3), assignedTo: 'sk-001', assignedToName: 'Amit Kumar', wardId: 'ward-1', wardNumber: '1' },
  { id: 'c-003', citizenId: 'citizen-001', citizenName: 'Rahul Kumar', category: 'street_light', description: 'Street light near our house is not working for a week. The area becomes very dark at night.', location: 'Ward 5, Main Road, Daudnagar', status: 'resolved', createdAt: d(15), updatedAt: d(8), wardId: 'ward-1', wardNumber: '1' },
  { id: 'c-004', citizenId: 'citizen-002', citizenName: 'Priya Singh', category: 'water_supply', description: 'No water supply for 2 days in our area. We are facing severe water crisis.', location: 'Ward 12, Civil Line, Daudnagar', status: 'in_progress', createdAt: d(1), updatedAt: d(0), assignedTo: 'sk-001', assignedToName: 'Amit Kumar', wardId: 'ward-12', wardNumber: '12' },
  { id: 'c-005', citizenId: 'citizen-003', citizenName: 'Suresh Yadav', category: 'road_damage', description: 'Large pothole on main road causing accidents. Two-wheelers have already fallen.', location: 'Ward 3, Station Road, Daudnagar', status: 'submitted', createdAt: d(0), updatedAt: d(0), wardId: 'ward-3', wardNumber: '3' },
  { id: 'c-006', citizenId: 'citizen-004', citizenName: 'Meena Devi', category: 'cleanliness', description: 'Public park is very dirty. Garbage piled up near the gate. Children cannot play.', location: 'Ward 2, Central Park, Daudnagar', status: 'assigned', createdAt: d(3), updatedAt: d(2), wardId: 'ward-2', wardNumber: '2' },
];

const SEED_USERS: User[] = [
  { id: 'citizen-001', name: 'Rahul Kumar', email: 'citizen.dnp360@gmail.com', mobile: '9876543210', role: 'citizen', address: 'Ward 5, Daudnagar', isActive: true, createdAt: '2024-01-15' },
  { id: 'citizen-002', name: 'Priya Singh', email: 'priya.singh@gmail.com', mobile: '9876543220', role: 'citizen', isActive: true, createdAt: '2024-02-20' },
  { id: 'citizen-003', name: 'Suresh Yadav', email: 'suresh.yadav@gmail.com', mobile: '9876543221', role: 'citizen', isActive: true, createdAt: '2024-03-10' },
  { id: 'citizen-004', name: 'Meena Devi', email: 'meena.devi@gmail.com', mobile: '9876543222', role: 'citizen', isActive: true, createdAt: '2024-04-05' },
  { id: 'sk-001', name: 'Amit Kumar', email: 'safaikarmi.dnp360@gmail.com', mobile: '9876543211', role: 'safaikarmi', wardId: 'ward-42', employeeId: 'SK-2291', isActive: true, createdAt: '2023-06-01' },
  { id: 'sk-002', name: 'Raju Prasad', email: 'raju.prasad@dnp360.in', mobile: '9876543215', role: 'safaikarmi', wardId: 'ward-1', employeeId: 'SK-2292', isActive: true, createdAt: '2023-07-01' },
  { id: 'sk-003', name: 'Bholu Kumar', email: 'bholu.kumar@dnp360.in', mobile: '9876543216', role: 'safaikarmi', wardId: 'ward-3', employeeId: 'SK-2293', isActive: false, createdAt: '2023-08-01' },
  { id: 'off-001', name: 'Rajesh Gupta', email: 'official.dnp360@gmail.com', mobile: '9876543212', role: 'official', wardId: 'ward-12', employeeId: 'OFF-4412', isActive: true, createdAt: '2022-03-10' },
  { id: 'off-002', name: 'Deepak Sinha', email: 'deepak.sinha@dnp360.in', mobile: '9876543217', role: 'official', wardId: 'ward-2', employeeId: 'OFF-4413', isActive: true, createdAt: '2022-05-15' },
  { id: 'admin-001', name: 'Sandeep Kumar', email: 'admin.dnp360@gmail.com', mobile: '9876543213', role: 'admin', employeeId: 'AD-9921', isActive: true, createdAt: '2021-01-01' },
];

const SEED_KEYS: SecretKey[] = [
  { id: 'sk-k1', key: 'SK2566F', role: 'safaikarmi', isActive: true, usedBy: 'sk-001', usedByName: 'Amit Kumar', createdAt: d(30) },
  { id: 'sk-k2', key: 'OFF4416A', role: 'official', isActive: true, usedBy: 'off-001', usedByName: 'Rajesh Gupta', createdAt: d(30) },
  { id: 'sk-k3', key: 'ADMIN5790X', role: 'admin', isActive: true, usedBy: 'admin-001', usedByName: 'Sandeep Kumar', createdAt: d(30) },
  { id: 'sk-k4', key: 'SK3891B', role: 'safaikarmi', isActive: false, createdAt: d(10) },
];

function seedAttendance(): Attendance[] {
  const records: Attendance[] = [];
  for (let i = 30; i >= 0; i--) {
    const date = d(i);
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0) continue; // skip Sundays
    records.push({
      id: `att-${i}`,
      workerId: 'sk-001',
      date,
      status: i === 0 ? 'present' : Math.random() > 0.15 ? 'present' : 'absent',
      checkInTime: '08:00',
      checkOutTime: '17:00',
      method: i % 3 === 0 ? 'manual' : 'qr',
    });
  }
  return records;
}

function seedHouseVisits(): HouseVisit[] {
  const visits: HouseVisit[] = [];
  const houses = SEED_HOUSES.filter(h => h.wardId === 'ward-42');
  for (let i = 5; i >= 0; i--) {
    const date = d(i);
    for (const house of houses) {
      if (Math.random() > 0.3) {
        visits.push({
          id: `visit-${i}-${house.id}`,
          houseId: house.id,
          houseRegistrationNumber: house.registrationNumber,
          ownerName: house.ownerName,
          address: house.address,
          workerId: 'sk-001',
          workerName: 'Amit Kumar',
          visitDate: date,
          visitTime: `0${7 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          status: 'visited',
        });
      }
    }
  }
  return visits;
}

const AppContext = createContext<AppContextType | null>(null);

async function load<T>(key: string, seed: T[]): Promise<T[]> {
  try {
    const stored = await AsyncStorage.getItem(`dnp360_${key}`);
    if (stored) return JSON.parse(stored);
    await AsyncStorage.setItem(`dnp360_${key}`, JSON.stringify(seed));
    return seed;
  } catch {
    return seed;
  }
}

async function save<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(`dnp360_${key}`, JSON.stringify(data));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [houseVisits, setHouseVisits] = useState<HouseVisit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [secretKeys, setSecretKeys] = useState<SecretKey[]>([]);

  useEffect(() => {
    (async () => {
      const [c, h, w, n, a, v, u, k] = await Promise.all([
        load<Complaint>('complaints', SEED_COMPLAINTS),
        load<House>('houses', SEED_HOUSES),
        load<Ward>('wards', SEED_WARDS),
        load<Notice>('notices', SEED_NOTICES),
        load<Attendance>('attendance', seedAttendance()),
        load<HouseVisit>('houseVisits', seedHouseVisits()),
        load<User>('users', SEED_USERS),
        load<SecretKey>('secretKeys', SEED_KEYS),
      ]);
      setComplaints(c);
      setHouses(h);
      setWards(w);
      setNotices(n);
      setAttendance(a);
      setHouseVisits(v);
      setUsers(u);
      setSecretKeys(k);
    })();
  }, []);

  async function addComplaint(c: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString().split('T')[0];
    const item: Complaint = { ...c, id: uid(), createdAt: now, updatedAt: now };
    const updated = [item, ...complaints];
    setComplaints(updated);
    await save('complaints', updated);
  }

  async function updateComplaint(id: string, updates: Partial<Complaint>) {
    const updated = complaints.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : c);
    setComplaints(updated);
    await save('complaints', updated);
  }

  async function addHouseVisit(visit: Omit<HouseVisit, 'id'>) {
    const item: HouseVisit = { ...visit, id: uid() };
    const updated = [item, ...houseVisits];
    setHouseVisits(updated);
    await save('houseVisits', updated);
  }

  async function markAttendance(workerId: string, method: 'qr' | 'manual' = 'qr'): Promise<boolean> {
    const todayStr = today();
    const alreadyMarked = attendance.some(a => a.workerId === workerId && a.date === todayStr);
    if (alreadyMarked) return false;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const item: Attendance = { id: uid(), workerId, date: todayStr, status: 'present', checkInTime: timeStr, method };
    const updated = [item, ...attendance];
    setAttendance(updated);
    await save('attendance', updated);
    return true;
  }

  async function addHouse(h: Omit<House, 'id'>) {
    const item: House = { ...h, id: uid() };
    const updated = [...houses, item];
    setHouses(updated);
    await save('houses', updated);
  }

  async function updateHouse(id: string, updates: Partial<House>) {
    const updated = houses.map(h => h.id === id ? { ...h, ...updates } : h);
    setHouses(updated);
    await save('houses', updated);
  }

  async function deleteHouse(id: string) {
    const updated = houses.filter(h => h.id !== id);
    setHouses(updated);
    await save('houses', updated);
  }

  async function addWard(w: Omit<Ward, 'id'>) {
    const item: Ward = { ...w, id: uid() };
    const updated = [...wards, item];
    setWards(updated);
    await save('wards', updated);
  }

  async function updateWard(id: string, updates: Partial<Ward>) {
    const updated = wards.map(w => w.id === id ? { ...w, ...updates } : w);
    setWards(updated);
    await save('wards', updated);
  }

  async function addNotice(n: Omit<Notice, 'id' | 'createdAt'>) {
    const item: Notice = { ...n, id: uid(), createdAt: today() };
    const updated = [item, ...notices];
    setNotices(updated);
    await save('notices', updated);
  }

  async function updateNotice(id: string, updates: Partial<Notice>) {
    const updated = notices.map(n => n.id === id ? { ...n, ...updates } : n);
    setNotices(updated);
    await save('notices', updated);
  }

  async function deleteNotice(id: string) {
    const updated = notices.filter(n => n.id !== id);
    setNotices(updated);
    await save('notices', updated);
  }

  async function addUser(u: User) {
    const updated = [...users, u];
    setUsers(updated);
    await save('users', updated);
  }

  async function updateUser(id: string, updates: Partial<User>) {
    const updated = users.map(u => u.id === id ? { ...u, ...updates } : u);
    setUsers(updated);
    await save('users', updated);
  }

  async function deleteUser(id: string) {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    await save('users', updated);
  }

  async function addSecretKey(role: SecretKey['role']): Promise<SecretKey> {
    const key = genSecretKey(role);
    const item: SecretKey = { id: uid(), key, role, isActive: true, createdAt: today() };
    const updated = [...secretKeys, item];
    setSecretKeys(updated);
    await save('secretKeys', updated);
    return item;
  }

  async function toggleSecretKey(id: string) {
    const updated = secretKeys.map(k => k.id === id ? { ...k, isActive: !k.isActive } : k);
    setSecretKeys(updated);
    await save('secretKeys', updated);
  }

  async function deleteSecretKey(id: string) {
    const updated = secretKeys.filter(k => k.id !== id);
    setSecretKeys(updated);
    await save('secretKeys', updated);
  }

  const getHouseByRegistration = (regNum: string) =>
    houses.find(h => h.registrationNumber.toLowerCase() === regNum.toLowerCase());

  const getComplaintsByUser = (userId: string) =>
    complaints.filter(c => c.citizenId === userId);

  const getAttendanceByWorker = (workerId: string) =>
    attendance.filter(a => a.workerId === workerId).sort((a, b) => b.date.localeCompare(a.date));

  const getVisitsByWorker = (workerId: string) =>
    houseVisits.filter(v => v.workerId === workerId).sort((a, b) => b.visitDate.localeCompare(a.visitDate));

  const isTodayAttendanceMarked = (workerId: string) =>
    attendance.some(a => a.workerId === workerId && a.date === today());

  return (
    <AppContext.Provider value={{
      complaints, houses, wards, notices, attendance, houseVisits, users, secretKeys,
      addComplaint, updateComplaint, addHouseVisit, markAttendance,
      addHouse, updateHouse, deleteHouse,
      addWard, updateWard,
      addNotice, updateNotice, deleteNotice,
      addUser, updateUser, deleteUser,
      addSecretKey, toggleSecretKey, deleteSecretKey,
      getHouseByRegistration, getComplaintsByUser,
      getAttendanceByWorker, getVisitsByWorker, isTodayAttendanceMarked,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used within AppProvider');
  return ctx;
}
