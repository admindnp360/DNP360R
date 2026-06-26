import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export type FirebaseStatus = 'connected' | 'offline';

export function useFirebaseStatus(): FirebaseStatus {
  const [status, setStatus] = useState<FirebaseStatus>('connected');
  const offlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didConnect = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setStatus('connected');
      didConnect.current = true;
      return;
    }

    const handleOnline = () => {
      if (offlineTimer.current) {
        clearTimeout(offlineTimer.current);
        offlineTimer.current = null;
      }
      didConnect.current = true;
      setStatus('connected');
    };

    const handleOffline = () => {
      offlineTimer.current = setTimeout(() => {
        setStatus('offline');
      }, didConnect.current ? 1500 : 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined') {
      if (navigator.onLine) {
        didConnect.current = true;
        setStatus('connected');
      } else {
        setStatus('offline');
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (offlineTimer.current) clearTimeout(offlineTimer.current);
    };
  }, []);

  return status;
}
