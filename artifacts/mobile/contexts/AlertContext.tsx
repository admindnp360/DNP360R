import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

type AlertType = 'info' | 'success' | 'error' | 'warning';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  type: AlertType;
}

interface AlertContextType {
  showAlert: (title: string, message: string, buttons?: AlertButton[], type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

const TYPE_CFG = {
  info:    { grad: ['#1264E8', '#0EA5E9'] as const, icon: 'info'           as const, glow: '#1264E8' },
  success: { grad: ['#10B981', '#059669'] as const, icon: 'check-circle'   as const, glow: '#10B981' },
  error:   { grad: ['#EF4444', '#DC2626'] as const, icon: 'x-circle'       as const, glow: '#EF4444' },
  warning: { grad: ['#F59E0B', '#D97706'] as const, icon: 'alert-triangle' as const, glow: '#F59E0B' },
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AlertState>({
    visible: false, title: '', message: '', buttons: [], type: 'info',
  });

  const showAlert = useCallback((
    title: string,
    message: string,
    buttons: AlertButton[] = [{ text: 'OK' }],
    type: AlertType = 'info',
  ) => {
    const isConfirmation = buttons.length > 1 ||
      buttons.some(b => b.style === 'destructive' || b.style === 'cancel');

    if (isConfirmation && Platform.OS !== 'web') {
      Alert.alert(
        title,
        message,
        buttons.map(b => ({
          text: b.text,
          style: b.style,
          onPress: b.onPress,
        })),
        { cancelable: true },
      );
    } else {
      setState({ visible: true, title, message, buttons, type });
    }
  }, []);

  function dismiss(btn?: AlertButton) {
    setState(s => ({ ...s, visible: false }));
    setTimeout(() => btn?.onPress?.(), 50);
  }

  const cfg = TYPE_CFG[state.type];

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      <Modal
        visible={state.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => dismiss()}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => dismiss()} />
          <View style={styles.container}>
            <LinearGradient colors={['#0D1B3E', '#060D1F']} style={styles.box}>
              <View style={[styles.glowRing, { shadowColor: cfg.glow }]}>
                <LinearGradient colors={cfg.grad} style={styles.iconCircle}>
                  <Feather name={cfg.icon} size={26} color="#fff" />
                </LinearGradient>
              </View>

              <Text style={styles.title}>{state.title}</Text>
              {!!state.message && (
                <Text style={styles.message}>{state.message}</Text>
              )}

              <LinearGradient
                colors={cfg.grad}
                style={styles.divider}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />

              <View style={[styles.btnRow, { justifyContent: 'center' }]}>
                {state.buttons.map((btn, i) => (
                  <Pressable
                    key={i}
                    onPress={() => dismiss(btn)}
                    style={({ pressed }) => [
                      styles.btn,
                      { flex: 0, minWidth: 140 },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <LinearGradient colors={cfg.grad} style={styles.gradBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={styles.gradTxt}>{btn.text}</Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used inside AlertProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  container: { width: '100%', maxWidth: 340 },
  box: {
    borderRadius: 28, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  glowRing: {
    alignSelf: 'center', marginTop: 28, marginBottom: 18,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 16,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    color: '#fff', fontSize: 19, fontFamily: 'Inter_700Bold',
    textAlign: 'center', paddingHorizontal: 24, marginBottom: 6,
  },
  message: {
    color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'Inter_400Regular',
    textAlign: 'center', paddingHorizontal: 24, lineHeight: 20, marginBottom: 4,
  },
  divider: { height: 1, marginTop: 18, marginHorizontal: 20 },
  btnRow: { flexDirection: 'row', padding: 16, gap: 10 },
  btn: { flex: 1, borderRadius: 14 },
  gradBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 14, overflow: 'hidden' },
  gradTxt: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
