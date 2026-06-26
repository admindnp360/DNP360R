import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { get, ref, set } from 'firebase/database';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { firebaseAuth, rtdb } from '@/lib/firebase';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string, method?: 'email' | 'mobile') => Promise<boolean>;
  loginWithCode: (secretCode: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (name: string, email: string, mobile: string, password: string, address?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetUserPassword: (email: string, newPassword: string) => Promise<boolean>;
  updateSecretKey: (userId: string, newCode: string) => Promise<boolean>;
}

const SUPER_ADMIN: User & { password: string; secretCode: string; mobile: string } = {
  id: 'SUPERADMIN',
  name: 'Chief Administrator',
  email: 'admin.dnp360@gmail.com',
  mobile: '9470464532',
  role: 'admin',
  employeeId: 'ADMIN9999A',
  isActive: true,
  createdAt: '2020-01-01',
  isSuperAdmin: true,
  cannotBeDeleted: true,
  password: 'ADMIN9999A',
  secretCode: 'ADMIN9999A',
};

const DEMO_USERS: (User & { password: string })[] = [
  { id: 'CT4821M', name: 'Rahul Kumar',   email: 'citizen.dnp360@gmail.com',    mobile: '9876543210', role: 'citizen',     address: 'Ward 5, Daudnagar, Bihar', isActive: true, createdAt: '2024-01-15', password: '12345678' },
  { id: 'SK1538Q', name: 'Amit Kumar',    email: 'sk1538q.dnp360@gmail.com',    mobile: '9876543211', role: 'safaikarmi', wardId: 'W42', employeeId: 'SK2291', isActive: true, createdAt: '2023-06-01', password: '12345678' },
  { id: 'OF7642B', name: 'Rajesh Gupta', email: 'of7642b.dnp360@gmail.com',    mobile: '9876543212', role: 'official',   wardId: 'W12', employeeId: 'OF4412', isActive: true, createdAt: '2022-03-10', password: '12345678' },
  { id: 'AD9305X', name: 'Sandeep Kumar',email: 'ad9305x.dnp360@gmail.com',    mobile: '9876543213', role: 'admin',      employeeId: 'AD9305X', isActive: true, createdAt: '2021-01-01', password: '12345678' },
];

const SECRET_CODES: Record<string, { role: UserRole; userId: string }> = {
  'SK-2566-F000': { role: 'safaikarmi', userId: 'SK1538Q' },
  'OF-4416-A000': { role: 'official',   userId: 'OF7642B' },
};

function genUserId(role: string): string {
  const prefix = role === 'citizen' ? 'CT' : role === 'safaikarmi' ? 'SK' : role === 'official' ? 'OF' : 'AD';
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${prefix}${digits}${letter}`;
}

const ROLE_NAMES: Record<string, string> = {
  safaikarmi: 'Safai Karmi',
  official: 'Official',
  admin: 'Administrator',
};

const RTDB_BASE = 'dnp360';

function today() {
  return new Date().toISOString().split('T')[0];
}

async function getUserProfileFromRTDB(uid: string): Promise<User | null> {
  try {
    const snap = await get(ref(rtdb, `${RTDB_BASE}/users/${uid}`));
    return snap.exists() ? (snap.val() as User) : null;
  } catch { return null; }
}

async function saveUserProfileToRTDB(uid: string, data: User): Promise<void> {
  try {
    const clean = JSON.parse(JSON.stringify(data));
    await set(ref(rtdb, `${RTDB_BASE}/users/${uid}`), clean);
  } catch (e) { console.warn('RTDB write failed:', e); }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    AsyncStorage.getItem('dnp360_user').then(stored => {
      if (stored && !settled) {
        try { setUser(JSON.parse(stored)); } catch {}
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));

    const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      settled = true;
      if (firebaseUser) {
        let profile = await getUserProfileFromRTDB(firebaseUser.uid);
        if (!profile) {
          const stored = await AsyncStorage.getItem('dnp360_user').catch(() => null);
          if (stored) { try { profile = JSON.parse(stored); } catch {} }
        }
        if (profile) {
          setUser(profile);
          await AsyncStorage.setItem('dnp360_user', JSON.stringify(profile));
        } else {
          const stored = await AsyncStorage.getItem('dnp360_user').catch(() => null);
          if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
        }
      }
      setIsLoading(false);
    });

    return unsub;
  }, []);

  async function login(identifier: string, password: string, method: 'email' | 'mobile' = 'email'): Promise<boolean> {
    const trimmed = identifier.trim();

    if (method === 'email' && trimmed.toLowerCase() === SUPER_ADMIN.email.toLowerCase() && password === SUPER_ADMIN.password) {
      const { password: _, secretCode: __, ...userData } = SUPER_ADMIN;
      setUser(userData);
      await AsyncStorage.setItem('dnp360_user', JSON.stringify(userData));
      return true;
    }
    if (method === 'mobile' && trimmed === SUPER_ADMIN.mobile && password === SUPER_ADMIN.password) {
      const { password: _, secretCode: __, ...userData } = SUPER_ADMIN;
      setUser(userData);
      await AsyncStorage.setItem('dnp360_user', JSON.stringify(userData));
      return true;
    }

    const demoResult = loginWithDemoUser(trimmed, password, method);
    if (demoResult) return demoResult;

    const emailToUse = method === 'mobile'
      ? await resolveEmailByMobile(trimmed)
      : trimmed.toLowerCase();
    if (!emailToUse) return false;

    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, emailToUse, password);
      let profile: User | null = null;
      try { profile = await getUserProfileFromRTDB(cred.user.uid); } catch {}
      if (!profile) {
        const stored = await AsyncStorage.getItem('dnp360_user').catch(() => null);
        if (stored) { try { profile = JSON.parse(stored); } catch {} }
      }
      if (!profile) {
        profile = {
          id: cred.user.uid,
          name: cred.user.displayName ?? emailToUse.split('@')[0],
          email: emailToUse,
          role: 'citizen',
          isActive: true,
          createdAt: today(),
        };
        saveUserProfileToRTDB(cred.user.uid, profile);
      }
      setUser(profile);
      await AsyncStorage.setItem('dnp360_user', JSON.stringify(profile));
      return true;
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-email') return false;
      return false;
    }
  }

  async function resolveEmailByMobile(mobile: string): Promise<string | null> {
    if (mobile === SUPER_ADMIN.mobile) return SUPER_ADMIN.email;
    const demo = DEMO_USERS.find(u => u.mobile === mobile);
    if (demo) return demo.email;
    try {
      const snap = await get(ref(rtdb, `${RTDB_BASE}/usersByMobile/${mobile}`));
      if (snap.exists()) return snap.val() as string;
    } catch {}
    return null;
  }

  function loginWithDemoUser(identifier: string, password: string, method: 'email' | 'mobile'): boolean {
    const found = DEMO_USERS.find(u =>
      method === 'email'
        ? u.email.toLowerCase() === identifier.toLowerCase()
        : u.mobile === identifier
    );
    if (!found || found.password !== password) return false;
    const { password: _, ...userData } = found;
    setUser(userData);
    AsyncStorage.setItem('dnp360_user', JSON.stringify(userData));
    return true;
  }

  async function loginWithCode(secretCode: string): Promise<boolean> {
    const code = secretCode.toUpperCase().trim();

    if (code === SUPER_ADMIN.secretCode) {
      const { password: _, secretCode: __, ...userData } = SUPER_ADMIN;
      setUser(userData);
      await AsyncStorage.setItem('dnp360_user', JSON.stringify(userData));
      return true;
    }

    const hardcoded = SECRET_CODES[code];
    if (hardcoded) {
      const found = DEMO_USERS.find(u => u.id === hardcoded.userId);
      if (found) {
        const { password: _, ...userData } = found;
        setUser(userData);
        await AsyncStorage.setItem('dnp360_user', JSON.stringify(userData));
        return true;
      }
    }

    try {
      const snap = await get(ref(rtdb, `${RTDB_BASE}/secretKeys`));
      if (snap.exists()) {
        const keys = Object.values(snap.val()) as Array<{ id: string; code: string; role: string; isActive: boolean; usedBy?: string }>;
        const matched = keys.find(k => k.code.toUpperCase() === code && k.isActive);

        if (matched) {
          if (matched.usedBy) {
            let profile = await getUserProfileFromRTDB(matched.usedBy);
            if (profile) {
              const profileEmail = profile.email ?? `${matched.usedBy.toLowerCase()}.dnp360@gmail.com`;
              try { await signInWithEmailAndPassword(firebaseAuth, profileEmail, code); } catch {}
              setUser(profile);
              await AsyncStorage.setItem('dnp360_user', JSON.stringify(profile));
              return true;
            }
          } else {
            const newUserId = genUserId(matched.role);
            const userEmail = `${newUserId.toLowerCase()}.dnp360@gmail.com`;
            let newUid: string;
            try {
              const cred = await createUserWithEmailAndPassword(firebaseAuth, userEmail, code);
              newUid = cred.user.uid;
            } catch (e: any) {
              if (e?.code === 'auth/email-already-in-use') {
                try {
                  const cred = await signInWithEmailAndPassword(firebaseAuth, userEmail, code);
                  newUid = cred.user.uid;
                } catch { return false; }
              } else { return false; }
            }

            const newUser: User = {
              id: newUserId,
              name: ROLE_NAMES[matched.role] ?? matched.role,
              email: userEmail,
              role: matched.role as UserRole,
              isActive: true,
              createdAt: today(),
            };

            await saveUserProfileToRTDB(newUid, newUser);
            try { await set(ref(rtdb, `${RTDB_BASE}/secretKeys/${matched.id}/usedBy`), newUid); } catch {}

            setUser(newUser);
            await AsyncStorage.setItem('dnp360_user', JSON.stringify(newUser));
            return true;
          }
        }
      }
    } catch (e) {
      console.warn('loginWithCode error:', e);
    }

    return false;
  }

  async function loginWithGoogle(): Promise<boolean> {
    if (Platform.OS !== 'web') return false;
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const fu = result.user;

      let profile = await getUserProfileFromRTDB(fu.uid);
      if (!profile) {
        profile = {
          id: fu.uid,
          name: fu.displayName ?? 'User',
          email: fu.email ?? '',
          mobile: fu.phoneNumber ?? '',
          role: 'citizen',
          isActive: true,
          createdAt: today(),
        };
        await saveUserProfileToRTDB(fu.uid, profile);
        if (profile.mobile) {
          await set(ref(rtdb, `${RTDB_BASE}/usersByMobile/${profile.mobile}`), profile.email);
        }
      }

      setUser(profile);
      await AsyncStorage.setItem('dnp360_user', JSON.stringify(profile));
      return true;
    } catch (e) {
      console.error('Google sign-in error:', e);
      return false;
    }
  }

  async function register(name: string, email: string, mobile: string, password: string, address?: string): Promise<{ success: boolean; error?: string }> {
    const normalEmail = email.trim().toLowerCase();
    if (normalEmail === SUPER_ADMIN.email.toLowerCase() || mobile.trim() === SUPER_ADMIN.mobile) {
      return { success: false, error: 'This email or mobile is already registered.' };
    }
    const demoConflict = DEMO_USERS.find(u => u.email.toLowerCase() === normalEmail || u.mobile === mobile.trim());
    if (demoConflict) return { success: false, error: 'This email or mobile is already registered.' };

    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, normalEmail, password);
      const newUser: User = {
        id: cred.user.uid,
        name: name.trim(),
        email: normalEmail,
        mobile: mobile.trim(),
        role: 'citizen',
        address: address?.trim(),
        isActive: true,
        createdAt: today(),
      };
      await saveUserProfileToRTDB(cred.user.uid, newUser);
      await set(ref(rtdb, `${RTDB_BASE}/usersByMobile/${mobile.trim()}`), normalEmail);
      setUser(newUser);
      await AsyncStorage.setItem('dnp360_user', JSON.stringify(newUser));
      return { success: true };
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/email-already-in-use') return { success: false, error: 'This email is already registered.' };
      if (code === 'auth/weak-password') return { success: false, error: 'Password must be at least 6 characters.' };
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  async function logout() {
    setUser(null);
    await AsyncStorage.removeItem('dnp360_user');
    try { await signOut(firebaseAuth); } catch {}
  }

  async function updateProfile(updates: Partial<User>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem('dnp360_user', JSON.stringify(updated));
    await saveUserProfileToRTDB(user.id, updated);
  }

  async function resetUserPassword(_email: string, _newPassword: string): Promise<boolean> {
    return true;
  }

  async function updateSecretKey(userId: string, newCode: string): Promise<boolean> {
    if (!user?.isSuperAdmin) return false;
    try {
      const snap = await get(ref(rtdb, `${RTDB_BASE}/secretKeys`));
      if (snap.exists()) {
        const keys = snap.val() as Record<string, { id: string; code: string; role: string; isActive: boolean; usedBy?: string }>;
        for (const [keyId, keyData] of Object.entries(keys)) {
          if (keyData.usedBy === userId) {
            await set(ref(rtdb, `${RTDB_BASE}/secretKeys/${keyId}/code`), newCode.toUpperCase());
            return true;
          }
        }
      }
      return false;
    } catch { return false; }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithCode, loginWithGoogle, register, logout, updateProfile, resetUserPassword, updateSecretKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
