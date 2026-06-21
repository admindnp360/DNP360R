import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string, method?: 'email' | 'mobile') => Promise<boolean>;
  loginWithCode: (secretCode: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const DEMO_USERS: (User & { password: string })[] = [
  {
    id: 'citizen-001',
    name: 'Rahul Kumar',
    email: 'citizen.dnp360@gmail.com',
    mobile: '9876543210',
    role: 'citizen',
    address: 'Ward 5, Daudnagar, Bihar',
    isActive: true,
    createdAt: '2024-01-15',
    password: '12345678',
  },
  {
    id: 'sk-001',
    name: 'Amit Kumar',
    email: 'safaikarmi.dnp360@gmail.com',
    mobile: '9876543211',
    role: 'safaikarmi',
    wardId: 'ward-42',
    employeeId: 'SK-2291',
    isActive: true,
    createdAt: '2023-06-01',
    password: '12345678',
  },
  {
    id: 'off-001',
    name: 'Rajesh Gupta',
    email: 'official.dnp360@gmail.com',
    mobile: '9876543212',
    role: 'official',
    wardId: 'ward-12',
    employeeId: 'OFF-4412',
    isActive: true,
    createdAt: '2022-03-10',
    password: '12345678',
  },
  {
    id: 'admin-001',
    name: 'Sandeep Kumar',
    email: 'admin.dnp360@gmail.com',
    mobile: '9876543213',
    role: 'admin',
    employeeId: 'AD-9921',
    isActive: true,
    createdAt: '2021-01-01',
    password: '12345678',
  },
];

const SECRET_CODES: Record<string, { role: UserRole; userId: string }> = {
  'SK2566F': { role: 'safaikarmi', userId: 'sk-001' },
  'OFF4416A': { role: 'official', userId: 'off-001' },
  'ADMIN5790X': { role: 'admin', userId: 'admin-001' },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const stored = await AsyncStorage.getItem('dnp360_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  async function login(identifier: string, password: string, method: 'email' | 'mobile' = 'email'): Promise<boolean> {
    const found = DEMO_USERS.find(u =>
      (method === 'email'
        ? u.email.toLowerCase() === identifier.toLowerCase()
        : u.mobile === identifier) && u.password === password
    );
    if (!found) return false;
    const { password: _, ...userData } = found;
    setUser(userData);
    await AsyncStorage.setItem('dnp360_user', JSON.stringify(userData));
    return true;
  }

  async function loginWithCode(secretCode: string): Promise<boolean> {
    const entry = SECRET_CODES[secretCode.toUpperCase()];
    if (!entry) return false;
    const found = DEMO_USERS.find(u => u.id === entry.userId);
    if (!found) return false;
    const { password: _, ...userData } = found;
    setUser(userData);
    await AsyncStorage.setItem('dnp360_user', JSON.stringify(userData));
    return true;
  }

  async function logout() {
    setUser(null);
    await AsyncStorage.removeItem('dnp360_user');
  }

  async function updateProfile(updates: Partial<User>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem('dnp360_user', JSON.stringify(updated));
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithCode, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
