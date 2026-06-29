import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser as firebaseDeleteUser,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { db, firebaseAuth } from '@/lib/firebase';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string, method?: 'email' | 'mobile') => Promise<boolean>;
  loginWithUserId: (userId: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGoogleCredential: (idToken: string) => Promise<boolean>;
  register: (name: string, email: string, mobile: string, password: string, address?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetUserPassword: (email: string, newPassword: string) => Promise<boolean>;
  updateSecretKey?: (userId: string, newCode: string) => Promise<boolean>;
  changePassword: (currentPwd: string, newPwd: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const SUPER_ADMIN: User & { password: string; secretCode: string; mobile: string } = {
  id: 'SUPERADMIN',
  name: 'Chief Administrator',
  email: 'admin.dnp360@gmail.com',
  mobile: '9470464532',
  role: 'admin',
  isActive: true,
  createdAt: '2020-01-01',
  isSuperAdmin: true,
  cannotBeDeleted: true,
  password: 'ADMIN9999A',
  secretCode: 'ADMIN9999A',
};

const DEMO_USERS: (User & { password: string })[] = [
  { id: 'CT4821M', name: 'Rahul Kumar',   email: 'citizen.dnp360@gmail.com',  mobile: '9876543210', role: 'citizen',    address: 'Ward 5, Daudnagar, Bihar', isActive: true, createdAt: '2024-01-15', password: '12345678' },
  { id: 'SK1538Q', name: 'Amit Kumar',    email: 'sk1538q.dnp360@gmail.com',  mobile: '9876543211', role: 'safaikarmi', wardId: 'W42', isActive: true, createdAt: '2023-06-01', password: '12345678' },
  { id: 'OF7642B', name: 'Rajesh Gupta',  email: 'of7642b.dnp360@gmail.com',  mobile: '9876543212', role: 'official',   wardId: 'W12', isActive: true, createdAt: '2022-03-10', password: '12345678' },
  { id: 'AD9305X', name: 'Sandeep Kumar', email: 'ad9305x.dnp360@gmail.com',  mobile: '9876543213', role: 'admin',      isActive: true, createdAt: '2021-01-01', password: '12345678' },
];

const SECRET_CODES: Record<string, { role: UserRole; userId: string }> = {
  'SK-2566-F000': { role: 'safaikarmi', userId: 'SK1538Q' },
  'OF-4416-A000': { role: 'official',   userId: 'OF7642B' },
};

function genUserId(role: string): string {
  const prefix = role === 'citizen' ? 'CITI' : role === 'safaikarmi' ? 'SK' : role === 'official' ? 'OF' : 'AD';
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${prefix}${digits}${letter}`;
}

function isValidUserId(id: string, role: string): boolean {
  if (role === 'admin' && id === 'SUPERADMIN') return true;
  const patterns: Record<string, RegExp> = {
    official:   /^OF\d{4}[A-Z]$/,
    safaikarmi: /^SK\d{4}[A-Z]$/,
    citizen:    /^CITI\d{4}[A-Z]$/,
    admin:      /^(AD\d{4}[A-Z]|SUPERADMIN)$/,
  };
  return (patterns[role] ?? /^.+$/).test(id.toUpperCase());
}

const ROLE_NAMES: Record<string, string> = {
  safaikarmi: 'Safai Karmi',
  official: 'Official',
  admin: 'Administrator',
};

function today() {
  return new Date().toISOString().split('T')[0];
}

async function getUserFromFirestore(uid: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return { id: snap.id, ...snap.data() } as User;
    return null;
  } catch { return null; }
}

async function deleteDuplicateSuperAdmins(): Promise<void> {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
    await Promise.all(
      snap.docs
        .filter(d => d.id !== 'SUPERADMIN')
        .map(d => deleteDoc(d.ref))
    );
  } catch (e) { console.warn('Cleanup duplicate admins failed:', e); }
}

async function saveUserToFirestore(uid: string, data: User): Promise<void> {
  try {
    const { id: _id, ...rest } = data as any;
    await setDoc(doc(db, 'users', uid), {
      ...JSON.parse(JSON.stringify(rest)),
      _updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) { console.warn('Firestore user write failed:', e); }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    AsyncStorage.getItem('dnp360_user').then(stored => {
      if (stored && !settled) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          // If already logged in as super admin, clean up duplicate docs immediately
          if (parsed?.isSuperAdmin) deleteDuplicateSuperAdmins();
        } catch {}
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));

    const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      settled = true;
      if (firebaseUser) {
        let profile = await getUserFromFirestore(firebaseUser.uid);
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

    const storedPwd = await AsyncStorage.getItem('dnp360_superadmin_pwd').catch(() => null);
    const activePwd = storedPwd ?? SUPER_ADMIN.password;

    const isSuperAdminLogin =
      (method === 'email'  && trimmed.toLowerCase() === SUPER_ADMIN.email.toLowerCase() && password === activePwd) ||
      (method === 'mobile' && trimmed === SUPER_ADMIN.mobile && password === activePwd);

    if (isSuperAdminLogin) {
      const { password: _, secretCode: __, ...userData } = SUPER_ADMIN;
      // Try real Firebase Auth sign-in so the Firestore SDK has a valid token.
      // This succeeds once the user updates the Firebase password to ADMIN9999A
      // in the Firebase Console → Authentication → admin.dnp360@gmail.com.
      try {
        await signInWithEmailAndPassword(firebaseAuth, SUPER_ADMIN.email, SUPER_ADMIN.password);
      } catch {
        // Only create a new anonymous session if there is no existing auth session.
        // Calling signInAnonymously when already signed in reuses the same UID;
        // calling it on a fresh session would create a new UID → duplicate user doc.
        if (!firebaseAuth.currentUser) {
          try { await signInAnonymously(firebaseAuth); } catch { /* offline */ }
        }
      }
      // Save user doc under the fixed 'SUPERADMIN' doc ID — never under an
      // anonymous UID, which changes each session and creates duplicate rows.
      try { await saveUserToFirestore('SUPERADMIN', { ...userData as User, role: 'admin' }); } catch {}
      // Remove any duplicate admin docs created by old anonymous-auth logins.
      deleteDuplicateSuperAdmins();
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
      // Check UID→CITI mapping first (for citizens who registered via app)
      let profile: User | null = null;
      try {
        const mappingSnap = await getDoc(doc(db, 'uidMapping', cred.user.uid));
        if (mappingSnap.exists()) {
          const appId = mappingSnap.data().appId as string;
          profile = await getUserFromFirestore(appId);
        }
      } catch {}
      if (!profile) profile = await getUserFromFirestore(cred.user.uid);
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
        await saveUserToFirestore(cred.user.uid, profile);
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
      const snap = await getDoc(doc(db, 'usersByMobile', mobile));
      if (snap.exists()) return snap.data().email as string;
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

  async function loginWithUserId(userId: string): Promise<boolean> {
    const uid = userId.toUpperCase().trim();

    // Super admin by userId
    if (uid === 'SUPERADMIN') {
      const { password: _, secretCode: __, ...userData } = SUPER_ADMIN;
      try { await signInWithEmailAndPassword(firebaseAuth, SUPER_ADMIN.email, SUPER_ADMIN.password); }
      catch { try { await signInAnonymously(firebaseAuth); } catch {} }
      const onlineData = { ...(userData as User), isOnline: true };
      try { await updateDoc(doc(db, 'users', 'SUPERADMIN'), { isOnline: true, _updatedAt: serverTimestamp() }); } catch {}
      setUser(onlineData);
      await AsyncStorage.setItem('dnp360_user', JSON.stringify(onlineData));
      return true;
    }

    // Secret key login: SK-XXXX-XXXX or OF-XXXX-XXXX pattern
    const SECRET_KEY_RE = /^(SK|OF)-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (SECRET_KEY_RE.test(uid)) {
      try {
        const keySnap = await getDocs(query(collection(db, 'secretKeys'), where('code', '==', uid)));
        if (!keySnap.empty) {
          const keyData = keySnap.docs[0].data();
          if (keyData.isActive && keyData.usedBy) {
            const userId = keyData.usedBy as string;
            const profile = await getUserFromFirestore(userId);
            if (profile) {
              try { await signInAnonymously(firebaseAuth); } catch {}
              const onlineData = { ...profile, isOnline: true };
              try { await updateDoc(doc(db, 'users', userId), { isOnline: true, _updatedAt: serverTimestamp() }); } catch {}
              setUser(onlineData);
              await AsyncStorage.setItem('dnp360_user', JSON.stringify(onlineData));
              return true;
            }
          }
        }
      } catch (e) {
        console.warn('Secret key login error:', e);
      }
      return false;
    }

    // Demo users
    const demo = DEMO_USERS.find(u => u.id.toUpperCase() === uid);
    if (demo) {
      const { password: _, ...userData } = demo;
      try { await signInAnonymously(firebaseAuth); } catch {}
      const onlineData = { ...userData, isOnline: true };
      try { await updateDoc(doc(db, 'users', demo.id), { isOnline: true, _updatedAt: serverTimestamp() }); } catch {}
      setUser(onlineData);
      await AsyncStorage.setItem('dnp360_user', JSON.stringify(onlineData));
      return true;
    }

    // Firestore lookup by 'id' field
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('id', '==', uid)));
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const profile = { id: uid, ...docSnap.data(), isOnline: true } as User;
        try { await signInAnonymously(firebaseAuth); } catch {}
        try { await updateDoc(doc(db, 'users', docSnap.id), { isOnline: true, _updatedAt: serverTimestamp() }); } catch {}
        setUser(profile);
        await AsyncStorage.setItem('dnp360_user', JSON.stringify(profile));
        return true;
      }
      // Also try doc keyed by userId itself (legacy SUPERADMIN doc)
      const direct = await getUserFromFirestore(uid);
      if (direct) {
        const onlineDirect = { ...direct, isOnline: true };
        try { await signInAnonymously(firebaseAuth); } catch {}
        try { await updateDoc(doc(db, 'users', uid), { isOnline: true, _updatedAt: serverTimestamp() }); } catch {}
        setUser(onlineDirect);
        await AsyncStorage.setItem('dnp360_user', JSON.stringify(onlineDirect));
        return true;
      }
    } catch (e) {
      console.warn('loginWithUserId error:', e);
    }

    return false;
  }

  async function _saveGoogleUser(fu: { uid: string; displayName: string | null; email: string | null; phoneNumber: string | null }): Promise<boolean> {
    try {
      let profile = await getUserFromFirestore(fu.uid);
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
        await saveUserToFirestore(fu.uid, profile);
        if (profile.mobile) {
          await setDoc(doc(db, 'usersByMobile', profile.mobile), {
            email: profile.email,
            _updatedAt: serverTimestamp(),
          });
        }
      }
      setUser(profile);
      await AsyncStorage.setItem('dnp360_user', JSON.stringify(profile));
      return true;
    } catch (e) {
      console.error('Google sign-in save error:', e);
      return false;
    }
  }

  async function loginWithGoogle(): Promise<boolean> {
    if (Platform.OS !== 'web') return false;
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      return _saveGoogleUser(result.user);
    } catch (e) {
      console.error('Google sign-in error:', e);
      return false;
    }
  }

  async function loginWithGoogleCredential(idToken: string): Promise<boolean> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(firebaseAuth, credential);
      return _saveGoogleUser(result.user);
    } catch (e) {
      console.error('Google credential sign-in error:', e);
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
      // Generate a human-readable CITI-style ID (e.g. CITI4821A)
      const citiId = genUserId('citizen');
      const newUser: User = {
        id: citiId,
        name: name.trim(),
        email: normalEmail,
        mobile: mobile.trim(),
        role: 'citizen',
        address: address?.trim(),
        isActive: true,
        createdAt: today(),
      };
      // Save user doc under the CITI ID so AppContext picks it up via onSnapshot
      await setDoc(doc(db, 'users', citiId), {
        name: newUser.name, email: newUser.email, mobile: newUser.mobile,
        role: 'citizen', address: newUser.address ?? null, isActive: true,
        createdAt: newUser.createdAt, _updatedAt: serverTimestamp(),
      });
      // Save mapping firebase UID → CITI ID for subsequent logins
      await setDoc(doc(db, 'uidMapping', cred.user.uid), {
        appId: citiId, _updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'usersByMobile', mobile.trim()), {
        email: normalEmail, appId: citiId, _updatedAt: serverTimestamp(),
      });
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

  async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
    if (!user || user.role !== 'citizen') return { success: false, error: 'Only citizen accounts can be self-deleted.' };
    try {
      // Remove Firestore user document
      await deleteDoc(doc(db, 'users', user.id)).catch(() => {});
      // Remove mobile mapping
      if (user.mobile) await deleteDoc(doc(db, 'usersByMobile', user.mobile)).catch(() => {});
      // Delete Firebase Auth account
      const fbUser = firebaseAuth.currentUser;
      if (fbUser) await firebaseDeleteUser(fbUser).catch(() => {});
      // Clear local session
      setUser(null);
      await AsyncStorage.removeItem('dnp360_user');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Failed to delete account.' };
    }
  }

  async function logout() {
    if (user) {
      try { await updateDoc(doc(db, 'users', user.id), { isOnline: false, _updatedAt: serverTimestamp() }); } catch {}
    }
    setUser(null);
    await AsyncStorage.removeItem('dnp360_user');
    try { await signOut(firebaseAuth); } catch {}
  }

  async function updateProfile(updates: Partial<User>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem('dnp360_user', JSON.stringify(updated));
    await saveUserToFirestore(user.id, updated);
  }

  async function resetUserPassword(_email: string, _newPassword: string): Promise<boolean> {
    return true;
  }

  async function changePassword(currentPwd: string, newPwd: string): Promise<{ success: boolean; error?: string }> {
    if (!user?.isSuperAdmin) return { success: false, error: 'Not authorized.' };
    if (!currentPwd || !newPwd) return { success: false, error: 'All fields are required.' };
    if (newPwd.length < 6) return { success: false, error: 'New password must be at least 6 characters.' };

    // Verify current password against stored override or default
    const storedPwd = await AsyncStorage.getItem('dnp360_superadmin_pwd').catch(() => null);
    const activePwd = storedPwd ?? SUPER_ADMIN.password;
    if (currentPwd !== activePwd) return { success: false, error: 'Current password is incorrect.' };
    if (newPwd === currentPwd) return { success: false, error: 'New password must be different.' };

    // Persist new password locally so login uses it from now on
    await AsyncStorage.setItem('dnp360_superadmin_pwd', newPwd).catch(() => {});

    // Also update Firebase Auth password if user has a live Firebase session
    try {
      const fbUser = firebaseAuth.currentUser;
      if (fbUser) await firebaseUpdatePassword(fbUser, newPwd);
    } catch { /* Firebase Auth update is best-effort */ }

    return { success: true };
  }

  async function updateSecretKey(userId: string, newCode: string): Promise<boolean> {
    if (!user?.isSuperAdmin) return false;
    try {
      const keysSnap = await getDocs(collection(db, 'secretKeys'));
      if (!keysSnap.empty) {
        const matched = keysSnap.docs.find(d => d.data().usedBy === userId);
        if (matched) {
          await updateDoc(doc(db, 'secretKeys', matched.id), {
            code: newCode.toUpperCase(),
            _updatedAt: serverTimestamp(),
          });
          return true;
        }
      }
      return false;
    } catch { return false; }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithUserId, loginWithGoogle, loginWithGoogleCredential, register, logout, updateProfile, resetUserPassword, updateSecretKey, changePassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
