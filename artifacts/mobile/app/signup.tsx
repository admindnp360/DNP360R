import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';

const FIELDS = [
  { key: 'name',    label: 'Full Name',      icon: 'user',        ph: 'Your full name',            kbType: 'default',       caps: 'words',  required: true },
  { key: 'email',   label: 'Email Address',  icon: 'mail',        ph: 'your@email.com',            kbType: 'email-address', caps: 'none',   required: true },
  { key: 'mobile',  label: 'Mobile Number',  icon: 'smartphone',  ph: '10-digit mobile number',    kbType: 'phone-pad',     caps: 'none',   required: true, max: 10 },
  { key: 'address', label: 'Address',        icon: 'map-pin',     ph: 'Ward / Area, Daudnagar',    kbType: 'default',       caps: 'sentences', required: false },
] as const;

export default function SignUpScreen() {
  const { register } = useAuth();
  const { showAlert } = useAlert();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdName, setCreatedName] = useState('');

  const values: Record<string, string> = { name, email, mobile, address };
  const setters: Record<string, (v: string) => void> = { name: setName, email: setEmail, mobile: setMobile, address: setAddress };

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !mobile.trim() || !password) {
      showAlert('Missing Fields', 'Please fill in Name, Email, Mobile, and Password.', undefined, 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match.', undefined, 'error');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters.', undefined, 'warning');
      return;
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      showAlert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.', undefined, 'warning');
      return;
    }
    setLoading(true);
    try {
      const result = await register(name.trim(), email.trim(), mobile.trim(), password, address.trim() || undefined);
      if (!result.success) {
        showAlert('Registration Failed', result.error ?? 'Unable to create account. Please try again.', undefined, 'error');
      } else {
        setCreatedName(name.trim());
        setSuccess(true);
        setTimeout(() => router.replace('/(tabs)'), 3500);
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={['#07002E', '#052A1A', '#07002E']} style={StyleSheet.absoluteFill} />
        <View style={styles.successScreen}>
          <View style={styles.successRing}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.successIconWrap}>
              <Feather name="check" size={42} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.successTitle}>Account Created!</Text>
          <Text style={styles.successName}>{createdName}</Text>
          <Text style={styles.successMsg}>
            Your citizen account is ready.{'\n'}Redirecting to dashboard…
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.successBtn}>
              <Feather name="arrow-right" size={16} color="#fff" />
              <Text style={styles.successBtnTxt}>Go to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <LinearGradient colors={['#07002E', '#100840', '#0A1550']} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Top bar ── */}
          <Pressable style={styles.backRow} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(37,99,235,0.3)', 'rgba(79,70,229,0.1)']} style={styles.backIconWrap}>
              <Feather name="arrow-left" size={16} color="#60A5FA" />
            </LinearGradient>
            <Text style={styles.backTxt}>Back to Sign In</Text>
          </Pressable>

          {/* ── Header ── */}
          <View style={styles.header}>
            <LinearGradient colors={['#10B981', '#059669', '#0284C7']} style={styles.headerIconWrap}>
              <Feather name="user-plus" size={26} color="#fff" />
            </LinearGradient>
            <Text style={styles.headerTitle}>Create Citizen Account</Text>
            <Text style={styles.headerSub}>Register to access DNP360 municipal services</Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(16,185,129,0.2)', 'rgba(5,150,105,0.06)', 'transparent']}
              style={styles.cardGlow}
            />

            <View style={styles.sectionLabel}>
              <LinearGradient colors={['#2563EB', '#6366F1']} style={styles.sectionDot} />
              <Text style={styles.sectionLabelText}>Personal Information</Text>
            </View>

            {FIELDS.map(f => (
              <View key={f.key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {f.label}{f.required ? <Text style={{ color: '#F87171' }}> *</Text> : <Text style={{ color: '#4B5563' }}> (optional)</Text>}
                </Text>
                <View style={styles.inputWrap}>
                  <LinearGradient colors={['#10B981', '#059669']} style={styles.inputIcon}>
                    <Feather name={f.icon as any} size={12} color="#fff" />
                  </LinearGradient>
                  <TextInput
                    style={styles.input}
                    placeholder={f.ph}
                    placeholderTextColor="#374151"
                    value={values[f.key]}
                    onChangeText={setters[f.key]}
                    keyboardType={f.kbType as any}
                    autoCapitalize={f.caps as any}
                    maxLength={'max' in f ? f.max : undefined}
                  />
                </View>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.sectionLabel}>
              <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.sectionDot} />
              <Text style={styles.sectionLabelText}>Security</Text>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password <Text style={{ color: '#F87171' }}>*</Text></Text>
              <View style={styles.inputWrap}>
                <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.inputIcon}>
                  <Feather name="lock" size={12} color="#fff" />
                </LinearGradient>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#374151"
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPw(p => !p)} hitSlop={8} style={{ padding: 4 }}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={14} color="#4B5563" />
                </Pressable>
              </View>
            </View>

            {/* Confirm password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirm Password <Text style={{ color: '#F87171' }}>*</Text></Text>
              <View style={[styles.inputWrap, confirmPassword && confirmPassword !== password && { borderColor: '#F87171' }]}>
                <LinearGradient
                  colors={confirmPassword && confirmPassword !== password ? ['#EF4444', '#B91C1C'] : ['#7C3AED', '#6366F1']}
                  style={styles.inputIcon}
                >
                  <Feather name="lock" size={12} color="#fff" />
                </LinearGradient>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Re-enter password"
                  placeholderTextColor="#374151"
                  secureTextEntry={!showCPw}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable onPress={() => setShowCPw(p => !p)} hitSlop={8} style={{ padding: 4 }}>
                  <Feather name={showCPw ? 'eye-off' : 'eye'} size={14} color="#4B5563" />
                </Pressable>
              </View>
              {confirmPassword && confirmPassword !== password && (
                <Text style={styles.errorTxt}>⚠ Passwords do not match</Text>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.87}
              style={[styles.btnWrap, loading && { opacity: 0.65 }]}
            >
              <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="user-check" size={15} color="#fff" />}
                <Text style={styles.btnTxt}>{loading ? 'Creating Account…' : 'Create Citizen Account'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Note */}
            <View style={styles.noteBox}>
              <Feather name="shield" size={13} color="#6366F1" />
              <Text style={styles.noteTxt}>
                Only Citizens can self-register. Safai Karmis, Officials & Admins authenticate via secret code issued by the Admin.
              </Text>
            </View>
          </View>

          <Text style={styles.version}>DNP360 v1.0 · Bihar, India · Govt. Trusted</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 240, height: 240, backgroundColor: '#10B98115', top: -60, right: -60 },
  orb2: { width: 180, height: 180, backgroundColor: '#6366F110', bottom: 80, left: -50 },

  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  successScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18, padding: 32 },
  successRing: { padding: 6, borderRadius: 60, borderWidth: 2, borderColor: 'rgba(16,185,129,0.4)' },
  successIconWrap: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  successTitle: { color: '#fff', fontSize: 28, fontFamily: 'Inter_700Bold' },
  successName: { color: '#34D399', fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  successMsg: { color: '#6B7280', fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  successBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  successBtnTxt: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  backIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(37,99,235,0.3)' },
  backTxt: { color: '#60A5FA', fontSize: 13, fontFamily: 'Inter_500Medium' },

  header: { alignItems: 'center', gap: 10, marginBottom: 20 },
  headerIconWrap: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSub: { color: '#4B5563', fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, borderRadius: 24 },

  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 16, height: 16, borderRadius: 5 },
  sectionLabelText: { color: '#9CA3AF', fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },

  fieldGroup: { gap: 6 },
  fieldLabel: { color: '#6B7280', fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  inputIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 12 },
  errorTxt: { color: '#F87171', fontSize: 10, fontFamily: 'Inter_400Regular' },

  btnWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  btnTxt: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_700Bold' },

  noteBox: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', alignItems: 'flex-start' },
  noteTxt: { flex: 1, color: '#A5B4FC', fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  version: { textAlign: 'center', color: '#374151', fontSize: 9, fontFamily: 'Inter_400Regular' },
});
