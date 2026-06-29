import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type ActivityEntry = {
  id?: string;
  icon: string;
  color: string;
  title: string;
  desc: string;
  createdAt: any;
};

const COL = 'activityLogs';

export async function logActivity(entry: Omit<ActivityEntry, 'id' | 'createdAt'>) {
  try {
    await addDoc(collection(db, COL), { ...entry, createdAt: serverTimestamp() });
  } catch (e) {
    console.warn('logActivity failed', e);
  }
}

export function subscribeActivityLog(cb: (logs: ActivityEntry[]) => void) {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(10));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityEntry)));
  }, () => cb([]));
}
