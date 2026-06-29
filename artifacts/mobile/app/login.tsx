import { Feather } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { useAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';

const IS_WEB = Platform.OS === 'web';

/* ── Reusable 3D input ── */
function GlowInput({ icon, color, placeholder, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry, rightEl, maxLength, onSubmitEditing, returnKeyType, autoCorrect, letterSpacing }: {
  icon: any; color: string; placeholder: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; autoCapitalize?: any; secureTextEntry?: boolean; rightEl?: React.ReactNode;
  maxLength?: number; onSubmitEditing?: () => void; returnKeyType?: any; autoCorrect?: boolean; letterSpacing?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[inp.wrap, focused && { borderColor: color + '70', shadowColor: color, shadowOpacity: 0.4, shadowRadius: 12 }]}>
      <LinearGradient colors={[color + '28', color + '0A']} style={inp.iconBox}>
        <Feather name={icon} size={15} color={color} />
      </LinearGradient>
      <TextInput
        style={[inp.text, letterSpacing ? { letterSpacing } : {}]}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        autoCorrect={autoCorrect}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightEl}
    </View>
  );
}

/* ── Reusable 3D button ── */
function Btn3D({ colors, icon, label, onPress, loading, disabled, flex }: {
  colors: readonly string[]; icon: any; label: string; onPress: () => void;
  loading?: boolean; disabled?: boolean; flex?: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress} disabled={disabled || loading} activeOpacity={0.82}
      style={[b.wrap, flex !== undefined && { flex }, (disabled || loading) && { opacity: 0.45 }]}
    >
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

export default function LoginScreen() {
  const { login, loginWithUserId, loginWithGoogle, loginWithGoogleCredential } = useAuth();
  const { showAlert } = useAlert();

  const [tab, setTab]               = useState<'citizen' | 'staff'>('citizen');
  const [subTab, setSubTab]         = useState<'email' | 'mobile' | 'userid'>('email');
  const [email, setEmail]           = useState('');
  const [mobile, setMobile]         = useState('');
  const [citizenId, setCitizenId]   = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [staffId, setStaffId]       = useState('');
  const [staffMode, setStaffMode]   = useState<'userid' | 'secretkey'>('userid');
  const [loading, setLoading]       = useState(false);
  const [gLoading, setGLoading]     = useState(false);
  const codeRef = useRef<TextInput>(null);

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

  async function handleSignIn() {
    const id = subTab === 'mobile' ? mobile.trim() : email.trim();
    if (!id || !password) { showAlert('Missing Fields', 'Please fill in all required fields.', undefined, 'warning'); return; }
    setLoading(true);
    try {
      const ok = await login(id, password, subTab as 'email' | 'mobile');
      if (!ok) showAlert('Login Failed', 'Invalid credentials. Please check your details.', undefined, 'error');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  async function handleCitizenIdSignIn() {
    const uid = citizenId.trim().toUpperCase();
    if (!uid) { showAlert('Missing ID', 'Please enter your User ID.', undefined, 'warning'); return; }
    setLoading(true);
    try {
      const ok = await loginWithUserId(uid);
      if (!ok) showAlert('Not Found', 'User ID not recognised. Please check and try again.', undefined, 'error');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  async function handleStaffLogin() {
    const uid = staffId.trim().toUpperCase();
    if (!uid) { showAlert('Missing ID', 'Please enter your User ID.', undefined, 'warning'); return; }
    setLoading(true);
    try {
      const ok = await loginWithUserId(uid);
      if (!ok) showAlert('Not Found', 'User ID not recognised. Check with your administrator.', undefined, 'error');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    if (IS_WEB) {
      setGLoading(true);
      try {
        const ok = await loginWithGoogle();
        if (ok) router.replace('/(tabs)');
        else showAlert('Sign-In Failed', 'Google Sign-In failed. Ensure your domain is authorised in Firebase Console.', undefined, 'warning');
      } catch { showAlert('Error', 'Google Sign-In is unavailable. Please use Email login.', undefined, 'error'); }
      finally { setGLoading(false); }
    } else {
      if (!googleRequest) { showAlert('Not Configured', 'Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to enable Google Sign-In.', undefined, 'warning'); return; }
      await googlePromptAsync();
    }
  }

  const isCitizen = tab === 'citizen';
  const tabColors = isCitizen
    ? { active: ['#2563EB','#4F46E5','#4338CA'] as const, glow: '#2563EB' }
    : { active: ['#7C3AED','#6366F1','#4F46E5'] as const, glow: '#7C3AED' };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#04081A','#080F28','#0C1538']} style={StyleSheet.absoluteFill} />

      {/* Ambient orbs */}
      <View style={[s.orb, { backgroundColor: tabColors.glow + '25', top: -80, right: -60, width: 300, height: 300 }]} />
      <View style={[s.orb, { backgroundColor: '#4F46E520', bottom: 40, left: -80, width: 240, height: 240 }]} />
      <View style={[s.orb, { backgroundColor: '#06B6D415', top: '38%', right: -60, width: 180, height: 180 }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>

          {/* Header */}
          <View style={s.header}>
            <Image source={require('../assets/images/dnp360-logo.png')} style={{ width: 200, height: 90, resizeMode: 'contain' }} />
            <Text style={s.orgName}>Nagar Parishad Daudnagar</Text>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>Smart Governance · Digital India</Text>
            </View>
          </View>

          {/* 3D Tab switcher */}
          <View style={s.tabTrackWrap}>
            <LinearGradient colors={['rgba(255,255,255,0.07)','rgba(255,255,255,0.02)']} style={s.tabTrack}>
              <View style={s.tabTrackBevel} />
              {([
                { key: 'citizen' as const, icon: 'user',   label: 'Citizen',     colors: ['#2563EB','#4F46E5','#4338CA'] as const },
                { key: 'staff'   as const, icon: 'shield', label: 'Staff Login',  colors: ['#7C3AED','#6366F1','#4F46E5'] as const },
              ]).map(t => {
                const active = tab === t.key;
                return (
                  <Pressable key={t.key} style={s.tabItem} onPress={() => setTab(t.key)}>
                    {active ? (
                      <LinearGradient colors={t.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.tabActiveGrad}>
                        <View style={s.tabBevelTop} />
                        <Feather name={t.icon as any} size={14} color="#fff" />
                        <Text style={s.tabActiveTxt}>{t.label}</Text>
                        <View style={s.tabBevelBot} />
                      </LinearGradient>
                    ) : (
                      <View style={s.tabInactive}>
                        <Feather name={t.icon as any} size={14} color="#374151" />
                        <Text style={s.tabInactiveTxt}>{t.label}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </LinearGradient>
          </View>

          {/* Main glass card */}
          <View style={s.card}>
            <View style={s.cardBevelTop} />

            {isCitizen ? (
              <>
                <Text style={s.cardTitle}>Welcome Back</Text>
                <Text style={s.cardSub}>
                  {subTab === 'userid' ? 'Sign in with your assigned User ID' : 'Sign in with your email or mobile'}
                </Text>

                {/* Sub-tab pills */}
                <View style={s.pillRow}>
                  {([
                    { key: 'email'  as const, icon: 'mail',       label: 'Email'   },
                    { key: 'mobile' as const, icon: 'smartphone',  label: 'Mobile'  },
                    { key: 'userid' as const, icon: 'hash',        label: 'User ID' },
                  ]).map(p => {
                    const active = subTab === p.key;
                    return (
                      <Pressable key={p.key} onPress={() => setSubTab(p.key)} style={[s.pill, active && s.pillActive]}>
                        <Feather name={p.icon as any} size={11} color={active ? '#93C5FD' : '#374151'} />
                        <Text style={[s.pillTxt, active && s.pillTxtActive]}>{p.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Inputs */}
                {subTab === 'email' && (
                  <GlowInput icon="mail" color="#3B82F6" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                )}
                {subTab === 'mobile' && (
                  <GlowInput icon="smartphone" color="#3B82F6" placeholder="10-digit mobile number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10} />
                )}
                {subTab === 'userid' && (
                  <GlowInput icon="hash" color="#6366F1" placeholder="e.g. CT1001A" value={citizenId}
                    onChangeText={v => setCitizenId(v.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                    autoCapitalize="characters" autoCorrect={false} onSubmitEditing={handleCitizenIdSignIn} returnKeyType="done" letterSpacing={2} />
                )}

                {subTab !== 'userid' && (
                  <>
                    <GlowInput icon="lock" color="#4F46E5" placeholder="Password" value={password} onChangeText={setPassword}
                      secureTextEntry={!showPw} onSubmitEditing={handleSignIn} returnKeyType="done"
                      rightEl={
                        <Pressable onPress={() => setShowPw(p => !p)} style={{ paddingHorizontal: 14 }}>
                          <Feather name={showPw ? 'eye-off' : 'eye'} size={15} color="#4F46E5" />
                        </Pressable>
                      }
                    />
                    <Pressable onPress={() => router.push('/forgot-password')} style={s.forgotRow}>
                      <Feather name="unlock" size={11} color="#6366F1" />
                      <Text style={s.forgotTxt}>Forgot Password?</Text>
                    </Pressable>
                  </>
                )}

                {subTab === 'userid' && (
                  <View style={s.hintBox}>
                    <Feather name="info" size={10} color="#6366F1" />
                    <Text style={s.hintTxt}>User ID is found on your registration slip or in your Profile.</Text>
                  </View>
                )}

                {/* Buttons */}
                {subTab === 'userid' ? (
                  <Btn3D colors={['#6366F1','#4F46E5','#4338CA']} icon="log-in" label={loading ? 'Signing in…' : 'Sign In with User ID'}
                    onPress={handleCitizenIdSignIn} loading={loading} disabled={!citizenId.trim()} />
                ) : (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Btn3D colors={['#2563EB','#4F46E5','#4338CA']} icon="log-in" label={loading ? 'Signing in…' : 'Sign In'}
                      onPress={handleSignIn} loading={loading} disabled={gLoading} flex={1} />
                    <Btn3D colors={['#DC2626','#EF4444','#F97316']} icon="user" label={gLoading ? 'Opening…' : 'Google'}
                      onPress={handleGoogle} loading={gLoading} disabled={loading} flex={1} />
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={s.cardTitle}>Staff Login</Text>
                <Text style={s.cardSub}>{staffMode === 'userid' ? 'Enter your assigned User ID' : 'Enter your Secret Key'}</Text>

                {/* Staff mode toggle */}
                <View style={s.pillRow}>
                  {([
                    { key: 'userid'    as const, icon: 'hash', label: 'User ID'    },
                    { key: 'secretkey' as const, icon: 'key',  label: 'Secret Key' },
                  ]).map(p => {
                    const active = staffMode === p.key;
                    return (
                      <Pressable key={p.key} onPress={() => { setStaffMode(p.key); setStaffId(''); }} style={[s.pill, s.pillWide, active && s.pillActiveViolet]}>
                        <Feather name={p.icon as any} size={11} color={active ? '#C4B5FD' : '#374151'} />
                        <Text style={[s.pillTxt, active && s.pillTxtActiveViolet]}>{p.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <GlowInput
                  icon={staffMode === 'secretkey' ? 'key' : 'hash'}
                  color="#8B5CF6"
                  placeholder={staffMode === 'secretkey' ? 'e.g. SK-AB12-XY34' : 'e.g. OF1234A or SK1234A'}
                  value={staffId}
                  onChangeText={v => setStaffId(staffMode === 'secretkey'
                    ? v.replace(/[^A-Za-z0-9\-]/g, '').toUpperCase()
                    : v.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                  autoCapitalize="characters" autoCorrect={false}
                  onSubmitEditing={handleStaffLogin} returnKeyType="done"
                  letterSpacing={staffMode === 'secretkey' ? 1.5 : 2}
                />

                <View style={s.hintBox}>
                  <Feather name="info" size={10} color="#7C3AED" />
                  <Text style={[s.hintTxt, { color: '#A78BFA' }]}>
                    {staffMode === 'secretkey'
                      ? 'Format: SK-XXXX-XXXX · OF-XXXX-XXXX'
                      : 'Format: OF1234A (Official) · SK1234A (Safai Karmi)'}
                  </Text>
                </View>

                <Btn3D
                  colors={staffMode === 'secretkey' ? ['#C084FC','#7C3AED','#6D28D9'] : ['#7C3AED','#6366F1','#4F46E5']}
                  icon={staffMode === 'secretkey' ? 'key' : 'log-in'}
                  label={loading ? 'Signing in…' : 'Sign In'}
                  onPress={handleStaffLogin} loading={loading} disabled={staffId.trim().length < 4}
                />

                <View style={s.staffNote}>
                  <Feather name="shield" size={11} color="#6D28D9" />
                  <Text style={s.staffNoteTxt}>
                    {staffMode === 'secretkey' ? 'Secret Key is provided by the Super Admin.' : 'Your User ID is assigned by the Super Admin.'}
                  </Text>
                </View>
              </>
            )}

            <View style={s.cardBevelBot} />
          </View>

          {/* Quick links */}
          <View style={s.quickLinks}>
            <TouchableOpacity onPress={() => router.push('/signup')} activeOpacity={0.85} style={s.qlBtn}>
              <LinearGradient colors={['rgba(255,255,255,0.06)','rgba(255,255,255,0.02)']} style={s.qlGrad}>
                <View style={[s.qlIcon, { backgroundColor: '#10B98120', borderColor: '#10B98130' }]}>
                  <Feather name="user-plus" size={14} color="#10B981" />
                </View>
                <Text style={[s.qlTxt, { color: '#34D399' }]}>Create Citizen Account</Text>
                <Feather name="chevron-right" size={13} color="#10B98180" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/forgot-password')} activeOpacity={0.85} style={s.qlBtn}>
              <LinearGradient colors={['rgba(255,255,255,0.06)','rgba(255,255,255,0.02)']} style={s.qlGrad}>
                <View style={[s.qlIcon, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B30' }]}>
                  <Feather name="unlock" size={14} color="#F59E0B" />
                </View>
                <Text style={[s.qlTxt, { color: '#FCD34D' }]}>Reset Password</Text>
                <Feather name="chevron-right" size={13} color="#F59E0B80" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={s.version}>DNP360 · Nagar Parishad Daudnagar · Bihar</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ── Input styles ── */
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

/* ── Button styles ── */
const b = StyleSheet.create({
  wrap: { borderRadius: 15, overflow: 'visible' },
  grad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 15, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderTopColor: 'rgba(255,255,255,0.35)',
  },
  bevelTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 15 },
  bevelBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 15 },
  shadow: { position: 'absolute', top: 4, left: 4, right: 4, bottom: -4, borderRadius: 15, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 0, zIndex: -1 },
  txt: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});

/* ── Screen styles ── */
const s = StyleSheet.create({
  root: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.7 },

  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 30, gap: 16 },

  header: { alignItems: 'center', gap: 4 },
  orgName: { color: '#475569', fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: 0.3 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveTxt: { color: '#1E3A5F', fontSize: 11, fontFamily: 'Inter_400Regular' },

  tabTrackWrap: {},
  tabTrack: {
    flexDirection: 'row', borderRadius: 18, padding: 5, gap: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  tabTrackBevel: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18 },
  tabItem: { flex: 1 },
  tabActiveGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 13, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 6,
  },
  tabBevelTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 14 },
  tabBevelBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14 },
  tabActiveTxt: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  tabInactive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 14 },
  tabInactiveTxt: { color: '#374151', fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.038)',
    borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderTopColor: 'rgba(255,255,255,0.22)',
    padding: 18, gap: 13,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 22, elevation: 12,
  },
  cardBevelTop: { position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 24 },
  cardBevelBot: { position: 'absolute', bottom: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 24 },
  cardTitle: { color: '#F1F5F9', fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  cardSub: { color: '#334155', fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: -5 },

  pillRow: { flexDirection: 'row', gap: 7 },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  pillWide: { flex: 1 },
  pillActive: { borderColor: '#3B82F680', backgroundColor: 'rgba(59,130,246,0.12)', borderTopColor: '#3B82F640' },
  pillActiveViolet: { borderColor: '#7C3AED80', backgroundColor: 'rgba(124,58,237,0.14)', borderTopColor: '#7C3AED50' },
  pillTxt: { color: '#374151', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  pillTxtActive: { color: '#93C5FD' },
  pillTxtActiveViolet: { color: '#C4B5FD' },

  forgotRow: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end' },
  forgotTxt: { color: '#6366F1', fontSize: 12, fontFamily: 'Inter_500Medium' },

  hintBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: 11, padding: 11, borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)' },
  hintTxt: { flex: 1, color: '#4B5563', fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  staffNote: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(109,40,217,0.07)', borderRadius: 11, padding: 11, borderWidth: 1, borderColor: 'rgba(109,40,217,0.15)' },
  staffNoteTxt: { flex: 1, color: '#7C3AED', fontSize: 11, fontFamily: 'Inter_400Regular' },

  quickLinks: { gap: 10 },
  qlBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  qlGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderTopColor: 'rgba(255,255,255,0.14)',
  },
  qlIcon: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  qlTxt: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  version: { textAlign: 'center', color: '#0F172A', fontSize: 9, fontFamily: 'Inter_400Regular' },
});
