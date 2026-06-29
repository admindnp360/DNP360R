import { Feather } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
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

const IS_WEB = Platform.OS === 'web';

/* ── Reusable 3D input (same as login) ── */
function GlowInput({ icon, color, placeholder, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry, rightEl, maxLength, error }: {
  icon: any; color: string; placeholder: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; autoCapitalize?: any; secureTextEntry?: boolean; rightEl?: React.ReactNode;
  maxLength?: number; error?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[
      inp.wrap,
      error && { borderColor: '#EF444480', shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 10 },
      !error && focused && { borderColor: color + '70', shadowColor: color, shadowOpacity: 0.4, shadowRadius: 12 },
    ]}>
      <LinearGradient colors={error ? ['#EF444428','#EF44440A'] : [color + '28', color + '0A']} style={inp.iconBox}>
        <Feather name={icon} size={15} color={error ? '#F87171' : color} />
      </LinearGradient>
      <TextInput
        style={inp.text}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightEl}
    </View>
  );
}

/* ── Reusable 3D button ── */
function Btn3D({ colors, icon, label, onPress, loading, disabled }: {
  colors: readonly string[]; icon: any; label: string; onPress: () => void; loading?: boolean; disabled?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.82}
      style={[(disabled || loading) && { opacity: 0.5 }]}>
      <LinearGradient colors={[...colors] as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={b.grad}>
        <View style={b.bevelTop} />
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Feather name={icon} size={15} color="#fff" />}
        <Text style={b.txt}>{label}</Text>
        <View style={b.bevelBot} />
      </LinearGradient>
      <View style={[b.shadow, { shadowColor: colors[0] }]} />
    </TouchableOpacity>
  );
}

export default function SignUpScreen() {
  const { register, loginWithGoogle, loginWithGoogleCredential } = useAuth();
  const { showAlert } = useAlert();

  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [mobile, setMobile]               = useState('');
  const [address, setAddress]             = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [showCPw, setShowCPw]             = useState(false);
  const [loading, setLoading]             = useState(false);
  const [gLoading, setGLoading]           = useState(false);
  const [success, setSuccess]             = useState(false);
  const [createdName, setCreatedName]     = useState('');

  useEffect(() => { WebBrowser.maybeCompleteAuthSession(); }, []);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: IS_WEB ? 'web-uses-popup' : process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        setGLoading(true);
        loginWithGoogleCredential(idToken)
          .then(ok => { if (ok) router.replace('/(tabs)'); else showAlert('Sign-In Failed', 'Google Sign-In failed. Please try again.', undefined, 'error'); })
          .finally(() => setGLoading(false));
      }
    } else if (googleResponse?.type === 'error') {
      showAlert('Sign-In Error', googleResponse.error?.message ?? 'Google Sign-In failed.', undefined, 'error');
    }
  }, [googleResponse]);

  async function handleGoogle() {
    if (IS_WEB) {
      setGLoading(true);
      try {
        const ok = await loginWithGoogle();
        if (ok) router.replace('/(tabs)');
        else showAlert('Sign-In Failed', 'Google Sign-In failed. Ensure domain is authorised in Firebase Console.', undefined, 'warning');
      } catch { showAlert('Error', 'Google Sign-In unavailable.', undefined, 'error'); }
      finally { setGLoading(false); }
    } else {
      if (!googleRequest) { showAlert('Not Configured', 'Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to enable Google Sign-In.', undefined, 'warning'); return; }
      await googlePromptAsync();
    }
  }

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !mobile.trim() || !password) {
      showAlert('Missing Fields', 'Please fill in Name, Email, Mobile, and Password.', undefined, 'warning'); return;
    }
    if (password !== confirmPw) { showAlert('Password Mismatch', 'Passwords do not match.', undefined, 'error'); return; }
    if (password.length < 6) { showAlert('Weak Password', 'Password must be at least 6 characters.', undefined, 'warning'); return; }
    if (!/^\d{10}$/.test(mobile.trim())) { showAlert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.', undefined, 'warning'); return; }
    setLoading(true);
    try {
      const result = await register(name.trim(), email.trim(), mobile.trim(), password, address.trim() || undefined);
      if (!result.success) showAlert('Registration Failed', result.error ?? 'Unable to create account. Please try again.', undefined, 'error');
      else { setCreatedName(name.trim()); setSuccess(true); setTimeout(() => router.replace('/(tabs)'), 3200); }
    } finally { setLoading(false); }
  }

  const pwMismatch = !!(confirmPw && confirmPw !== password);

  /* ── Success screen ── */
  if (success) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={['#04081A','#080F28','#0C1538']} style={StyleSheet.absoluteFill} />
        <View style={[s.orb, { backgroundColor: '#10B98125', top: -80, right: -60, width: 280, height: 280 }]} />
        <View style={[s.orb, { backgroundColor: '#6366F120', bottom: 40, left: -60, width: 220, height: 220 }]} />
        <View style={s.successWrap}>
          {/* 3D icon */}
          <View style={s.successRingOuter}>
            <View style={s.successRingInner}>
              <LinearGradient colors={['#10B981','#059669','#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.successIconGrad}>
                <View style={s.bevelTop} />
                <Feather name="check" size={38} color="#fff" />
                <View style={s.bevelBot} />
              </LinearGradient>
            </View>
          </View>
          <Text style={s.successTitle}>Account Created!</Text>
          <Text style={s.successName}>{createdName}</Text>
          <Text style={s.successMsg}>Your citizen account is ready.{'\n'}Redirecting to dashboard…</Text>
          {/* User ID tip */}
          <View style={s.tipCard}>
            <View style={s.tipCardBevel} />
            <View style={s.tipRow}>
              <LinearGradient colors={['#6366F1','#4F46E5']} style={s.tipBadge}>
                <Text style={s.tipBadgeTxt}>!</Text>
              </LinearGradient>
              <Text style={s.tipTitle}>Also sign in with User ID</Text>
            </View>
            <Text style={s.tipDesc}>Your User ID is visible in your Profile. Use the "User ID" tab on the login page to sign in without a password.</Text>
          </View>
          <Btn3D colors={['#10B981','#059669','#047857']} icon="arrow-right" label="Go to Dashboard" onPress={() => router.replace('/(tabs)')} />
        </View>
      </View>
    );
  }

  /* ── Main form ── */
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <LinearGradient colors={['#04081A','#080F28','#0C1538']} style={StyleSheet.absoluteFill} />
      <View style={[s.orb, { backgroundColor: '#10B98120', top: -60, right: -50, width: 240, height: 240 }]} />
      <View style={[s.orb, { backgroundColor: '#6366F118', bottom: 60, left: -60, width: 200, height: 200 }]} />
      <View style={[s.orb, { backgroundColor: '#06B6D412', top: '45%', right: -50, width: 160, height: 160 }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>

          {/* Back row */}
          <Pressable style={s.backRow} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(255,255,255,0.10)','rgba(255,255,255,0.04)']} style={s.backBtn}>
              <View style={s.bevelTop} />
              <Feather name="arrow-left" size={16} color="#E2E8F0" />
            </LinearGradient>
            <Text style={s.backTxt}>Back to Sign In</Text>
          </Pressable>

          {/* Hero header */}
          <View style={s.header}>
            <View style={s.heroRingOuter}>
              <View style={s.heroRingInner}>
                <LinearGradient colors={['#10B981','#059669','#0891B2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroGrad}>
                  <View style={s.bevelTop} />
                  <Feather name="user-plus" size={26} color="#fff" />
                  <View style={s.bevelBot} />
                </LinearGradient>
              </View>
            </View>
            <Text style={s.heroTitle}>Create Citizen Account</Text>
            <View style={s.heroBadge}>
              <View style={s.heroBadgeDot} />
              <Text style={s.heroBadgeTxt}>Register for DNP360 municipal services</Text>
            </View>
          </View>

          {/* Google button */}
          <Btn3D
            colors={['#DC2626','#EF4444','#F97316']}
            icon="user"
            label={gLoading ? 'Opening Google…' : 'Continue with Google'}
            onPress={handleGoogle}
            loading={gLoading}
            disabled={loading}
          />

          {/* OR divider */}
          <View style={s.orRow}>
            <View style={s.orLine} /><Text style={s.orTxt}>OR REGISTER WITH EMAIL</Text><View style={s.orLine} />
          </View>

          {/* Personal info card */}
          <View style={s.card}>
            <View style={s.cardBevelTop} />
            <View style={s.sectionHeader}>
              <LinearGradient colors={['#10B981','#059669']} style={s.sectionIconBox}>
                <Feather name="user" size={12} color="#fff" />
              </LinearGradient>
              <Text style={s.sectionLabel}>PERSONAL INFORMATION</Text>
            </View>

            <GlowInput icon="user"       color="#10B981" placeholder="Full name"                    value={name}    onChangeText={setName}    autoCapitalize="words" />
            <GlowInput icon="mail"       color="#059669" placeholder="Email address"                value={email}   onChangeText={setEmail}   keyboardType="email-address" autoCapitalize="none" />
            <GlowInput icon="smartphone" color="#0891B2" placeholder="10-digit mobile number"       value={mobile}  onChangeText={setMobile}  keyboardType="phone-pad" maxLength={10} />
            <GlowInput icon="map-pin"    color="#06B6D4" placeholder="Ward / Area, Daudnagar (opt)" value={address} onChangeText={setAddress} autoCapitalize="sentences" />

            <View style={s.cardBevelBot} />
          </View>

          {/* Security card */}
          <View style={s.card}>
            <View style={s.cardBevelTop} />
            <View style={s.sectionHeader}>
              <LinearGradient colors={['#7C3AED','#6366F1']} style={s.sectionIconBox}>
                <Feather name="lock" size={12} color="#fff" />
              </LinearGradient>
              <Text style={s.sectionLabel}>SECURITY</Text>
            </View>

            <GlowInput
              icon="lock" color="#7C3AED" placeholder="Password (min. 6 characters)"
              value={password} onChangeText={setPassword} secureTextEntry={!showPw}
              rightEl={
                <Pressable onPress={() => setShowPw(p => !p)} style={{ paddingHorizontal: 14 }}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={15} color="#7C3AED" />
                </Pressable>
              }
            />

            <View style={{ gap: 4 }}>
              <GlowInput
                icon="lock" color={pwMismatch ? '#EF4444' : '#6366F1'}
                placeholder="Confirm password" value={confirmPw} onChangeText={setConfirmPw}
                secureTextEntry={!showCPw} error={pwMismatch}
                rightEl={
                  <Pressable onPress={() => setShowCPw(p => !p)} style={{ paddingHorizontal: 14 }}>
                    <Feather name={showCPw ? 'eye-off' : 'eye'} size={15} color={pwMismatch ? '#EF4444' : '#6366F1'} />
                  </Pressable>
                }
              />
              {pwMismatch && (
                <View style={s.errorRow}>
                  <Feather name="alert-circle" size={10} color="#F87171" />
                  <Text style={s.errorTxt}>Passwords do not match</Text>
                </View>
              )}
            </View>

            <View style={s.cardBevelBot} />
          </View>

          {/* Create button */}
          <Btn3D
            colors={['#10B981','#059669','#047857']}
            icon="user-check"
            label={loading ? 'Creating Account…' : 'Create Citizen Account'}
            onPress={handleSignUp}
            loading={loading}
            disabled={gLoading}
          />

          {/* Info note */}
          <View style={s.noteBox}>
            <LinearGradient colors={['#6366F1','#4F46E5']} style={s.noteIconBox}>
              <Feather name="info" size={11} color="#fff" />
            </LinearGradient>
            <Text style={s.noteTxt}>Only citizens can self-register. Staff authenticate via secret code issued by the Super Admin.</Text>
          </View>

          <Text style={s.version}>DNP360 · Nagar Parishad Daudnagar · Bihar · Govt. Trusted</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inp = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 15, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderTopColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  iconBox: { width: 46, height: 50, justifyContent: 'center', alignItems: 'center' },
  text: { flex: 1, color: '#E2E8F0', fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 14, paddingRight: 4 },
});

const b = StyleSheet.create({
  grad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 15, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderTopColor: 'rgba(255,255,255,0.35)',
  },
  bevelTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 15 },
  bevelBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 15 },
  shadow: { position: 'absolute', top: 4, left: 4, right: 4, bottom: -4, borderRadius: 15, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 0, zIndex: -1 },
  txt: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});

const s = StyleSheet.create({
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.7 },
  bevelTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 28 },
  bevelBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 28 },

  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36, gap: 14 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  backTxt: { color: '#60A5FA', fontSize: 13, fontFamily: 'Inter_500Medium' },

  header: { alignItems: 'center', gap: 10 },
  heroRingOuter: { width: 100, height: 100, borderRadius: 28, borderWidth: 1.5, borderColor: '#10B98140', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.04)' },
  heroRingInner: { width: 80, height: 80, borderRadius: 22, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10 },
  heroGrad: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  heroTitle: { color: '#F1F5F9', fontSize: 22, fontFamily: 'Inter_700Bold' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#10B98140', backgroundColor: '#10B98110' },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  heroBadgeTxt: { color: '#34D399', fontSize: 11, fontFamily: 'Inter_500Medium' },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  orTxt: { color: '#1E3A5F', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.038)',
    borderRadius: 22, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderTopColor: 'rgba(255,255,255,0.22)',
    padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10,
  },
  cardBevelTop: { position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 22 },
  cardBevelBot: { position: 'absolute', bottom: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 22 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIconBox: { width: 20, height: 20, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { color: '#1E3A5F', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  errorTxt: { color: '#F87171', fontSize: 10, fontFamily: 'Inter_400Regular' },

  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)', borderTopColor: 'rgba(99,102,241,0.25)', padding: 13 },
  noteIconBox: { width: 22, height: 22, borderRadius: 7, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  noteTxt: { flex: 1, color: '#4B5563', fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  version: { textAlign: 'center', color: '#0F172A', fontSize: 9, fontFamily: 'Inter_400Regular' },

  /* Success */
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 28 },
  successRingOuter: { width: 118, height: 118, borderRadius: 34, borderWidth: 1.5, borderColor: '#10B98140', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.05)' },
  successRingInner: { width: 96, height: 96, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 12 },
  successIconGrad: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  successTitle: { color: '#F1F5F9', fontSize: 28, fontFamily: 'Inter_700Bold' },
  successName: { color: '#34D399', fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  successMsg: { color: '#334155', fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  tipCard: {
    backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.18)', borderTopColor: 'rgba(99,102,241,0.35)',
    padding: 14, gap: 8, alignSelf: 'stretch',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  tipCardBevel: { position: 'absolute', top: 0, left: 14, right: 14, height: 1, backgroundColor: 'rgba(99,102,241,0.3)', borderRadius: 16 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipBadge: { width: 22, height: 22, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  tipBadgeTxt: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  tipTitle: { color: '#A5B4FC', fontSize: 13, fontFamily: 'Inter_700Bold' },
  tipDesc: { color: '#4B5563', fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 },
});
