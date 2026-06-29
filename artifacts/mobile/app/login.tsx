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

WebBrowser.maybeCompleteAuthSession();

const IS_WEB = Platform.OS === 'web';

function DNPLogo() {
  return (
    <Image
      source={require('../assets/images/dnp360-logo.png')}
      style={{ width: 220, height: 110, resizeMode: 'contain' }}
    />
  );
}

export default function LoginScreen() {
  const { login, loginWithUserId, loginWithGoogle, loginWithGoogleCredential } = useAuth();
  const { showAlert } = useAlert();
  const [tab, setTab] = useState<'citizen' | 'staff'>('citizen');
  const [subTab, setSubTab] = useState<'email' | 'mobile' | 'userid'>('email');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [citizenUserId, setCitizenUserId] = useState('');
  const [password, setPassword] = useState('');
  const [staffUserId, setStaffUserId] = useState('');
  const [staffMode, setStaffMode] = useState<'userid' | 'secretkey'>('userid');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const codeRef = useRef<TextInput>(null);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        setGoogleLoading(true);
        loginWithGoogleCredential(idToken)
          .then(ok => {
            if (ok) router.replace('/(tabs)');
            else showAlert('Sign-In Failed', 'Google Sign-In failed. Please try again.', undefined, 'error');
          })
          .finally(() => setGoogleLoading(false));
      }
    } else if (googleResponse?.type === 'error') {
      showAlert('Sign-In Error', googleResponse.error?.message ?? 'Google Sign-In failed.', undefined, 'error');
    }
  }, [googleResponse]);

  async function handleStaffLogin() {
    const uid = staffUserId.trim().toUpperCase();
    if (!uid) { showAlert('Missing ID', 'Please enter your User ID.', undefined, 'warning'); return; }
    setLoading(true);
    try {
      const ok = await loginWithUserId(uid);
      if (!ok) showAlert('Not Found', 'User ID not recognised. Check with your administrator.', undefined, 'error');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  async function handleSignIn() {
    const id = subTab === 'mobile' ? mobile.trim() : email.trim();
    if (!id || !password) {
      showAlert('Missing Fields', 'Please fill in all required fields.', undefined, 'warning');
      return;
    }
    setLoading(true);
    try {
      const ok = await login(id, password, subTab as 'email' | 'mobile');
      if (!ok) showAlert('Login Failed', 'Invalid credentials. Please check your details.', undefined, 'error');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  async function handleCitizenUserIdSignIn() {
    const uid = citizenUserId.trim().toUpperCase();
    if (!uid) { showAlert('Missing ID', 'Please enter your User ID.', undefined, 'warning'); return; }
    setLoading(true);
    try {
      const ok = await loginWithUserId(uid);
      if (!ok) showAlert('Not Found', 'User ID not recognised. Please check and try again.', undefined, 'error');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  async function handleGoogleSignIn() {
    if (IS_WEB) {
      setGoogleLoading(true);
      try {
        const ok = await loginWithGoogle();
        if (ok) router.replace('/(tabs)');
        else showAlert('Sign-In Failed', 'Google Sign-In failed. Ensure your domain is authorised in Firebase Console.', undefined, 'warning');
      } catch {
        showAlert('Error', 'Google Sign-In is unavailable. Please use Email login.', undefined, 'error');
      } finally { setGoogleLoading(false); }
    } else {
      if (!googleRequest) {
        showAlert('Not Configured', 'Google Sign-In is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.', undefined, 'warning');
        return;
      }
      await googlePromptAsync();
    }
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#060C1D', '#0B1429', '#0F1C3F']} style={StyleSheet.absoluteFill} />
      <View style={[s.blob, s.blob1]} />
      <View style={[s.blob, s.blob2]} />
      <View style={[s.blob, s.blob3]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={s.header}>
            <DNPLogo />
            <Text style={s.orgName}>Nagar Parishad Daudnagar</Text>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>Smart Governance · Digital India</Text>
            </View>
          </View>

          <View style={s.tabRow}>
            <Pressable style={s.tabWrap} onPress={() => setTab('citizen')}>
              {tab === 'citizen'
                ? <LinearGradient colors={['#2563EB','#4F46E5']} style={s.tabActive}>
                    <Feather name="user" size={14} color="#fff" />
                    <Text style={s.tabActiveTxt}>Citizen</Text>
                  </LinearGradient>
                : <View style={s.tabInactive}>
                    <Feather name="user" size={14} color="#4B5563" />
                    <Text style={s.tabInactiveTxt}>Citizen</Text>
                  </View>}
            </Pressable>
            <Pressable style={s.tabWrap} onPress={() => setTab('staff')}>
              {tab === 'staff'
                ? <LinearGradient colors={['#7C3AED','#6366F1']} style={s.tabActive}>
                    <Feather name="shield" size={14} color="#fff" />
                    <Text style={s.tabActiveTxt}>Staff Login</Text>
                  </LinearGradient>
                : <View style={s.tabInactive}>
                    <Feather name="shield" size={14} color="#4B5563" />
                    <Text style={s.tabInactiveTxt}>Staff Login</Text>
                  </View>}
            </Pressable>
          </View>

          <View style={s.card}>
            {tab === 'citizen' ? (
              <>
                <Text style={s.cardTitle}>Welcome Back</Text>
                <Text style={s.cardSub}>
                  {subTab === 'userid' ? 'Sign in with your assigned User ID' : 'Sign in with your email or mobile number'}
                </Text>

                <View style={s.subRow}>
                  {(['email', 'mobile', 'userid'] as const).map(t => (
                    <Pressable key={t} onPress={() => setSubTab(t)} style={[s.subBtn, subTab === t && s.subBtnActive]}>
                      <Feather name={t === 'email' ? 'mail' : t === 'mobile' ? 'smartphone' : 'hash'} size={12} color={subTab === t ? '#60A5FA' : '#4B5563'} />
                      <Text style={[s.subBtnTxt, subTab === t && s.subBtnTxtActive]}>
                        {t === 'email' ? 'Email' : t === 'mobile' ? 'Mobile' : 'User ID'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {subTab === 'email' ? (
                  <View style={s.inputBox}>
                    <Feather name="mail" size={16} color="#4B6EAF" style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="Email address"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                ) : subTab === 'mobile' ? (
                  <View style={s.inputBox}>
                    <Feather name="smartphone" size={16} color="#4B6EAF" style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="10-digit mobile number"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={mobile}
                      onChangeText={setMobile}
                      maxLength={10}
                    />
                  </View>
                ) : (
                  <View style={s.inputBox}>
                    <Feather name="hash" size={16} color="#6366F1" style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="Your User ID (e.g. CT1001A)"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      value={citizenUserId}
                      onChangeText={v => setCitizenUserId(v.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                      onSubmitEditing={handleCitizenUserIdSignIn}
                      returnKeyType="done"
                    />
                  </View>
                )}

                {subTab !== 'userid' && (
                  <>
                    <View style={s.inputBox}>
                      <Feather name="lock" size={16} color="#4B6EAF" style={s.inputIcon} />
                      <TextInput
                        style={[s.input, { flex: 1 }]}
                        placeholder="Password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        onSubmitEditing={handleSignIn}
                        returnKeyType="done"
                      />
                      <Pressable onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#4B6EAF" />
                      </Pressable>
                    </View>
                    <Pressable onPress={() => router.push('/forgot-password')} style={s.forgotRow}>
                      <Text style={s.forgotTxt}>Forgot Password?</Text>
                    </Pressable>
                  </>
                )}

                {subTab === 'userid' && (
                  <View style={s.prefixHint}>
                    <Feather name="info" size={10} color="#6366F1" />
                    <Text style={s.prefixHintLabel}>User ID is printed on your registration slip or found in your Profile.</Text>
                  </View>
                )}

                {subTab === 'userid' ? (
                  <TouchableOpacity
                    onPress={handleCitizenUserIdSignIn}
                    disabled={loading || !citizenUserId.trim()}
                    activeOpacity={0.88}
                    style={[s.btnWrap, (loading || !citizenUserId.trim()) && { opacity: 0.4 }]}
                  >
                    <LinearGradient colors={['#6366F1','#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                      {loading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="log-in" size={16} color="#fff" />}
                      <Text style={s.btnTxt}>{loading ? 'Signing in…' : 'Sign In with User ID'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={s.signInRow}>
                    <TouchableOpacity
                      onPress={handleSignIn}
                      disabled={loading || googleLoading}
                      activeOpacity={0.88}
                      style={[s.btnWrap, { flex: 1 }, loading && { opacity: 0.65 }]}
                    >
                      <LinearGradient colors={['#2563EB','#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="log-in" size={16} color="#fff" />}
                        <Text style={s.btnTxt}>{loading ? 'Signing in…' : 'Sign In'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleGoogleSignIn}
                      disabled={loading || googleLoading}
                      activeOpacity={0.88}
                      style={[s.btnWrap, { flex: 1 }, googleLoading && { opacity: 0.65 }]}
                    >
                      <LinearGradient colors={['#DB4437','#EA4335']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                        {googleLoading
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={s.googleG}>G</Text>}
                        <Text style={s.btnTxt}>{googleLoading ? 'Opening…' : 'Google'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={s.cardTitle}>Staff Login</Text>
                <Text style={s.cardSub}>{staffMode === 'userid' ? 'Enter your User ID to sign in' : 'Enter your Secret Key to sign in'}</Text>

                {/* Mode toggle */}
                <View style={s.staffModeRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setStaffMode('userid'); setStaffUserId(''); }}
                    style={[s.staffModeBtn, staffMode === 'userid' && s.staffModeBtnActive]}
                  >
                    <Feather name="hash" size={13} color={staffMode === 'userid' ? '#fff' : '#6366F1'} />
                    <Text style={[s.staffModeTxt, staffMode === 'userid' && s.staffModeTxtActive]}>User ID</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setStaffMode('secretkey'); setStaffUserId(''); }}
                    style={[s.staffModeBtn, staffMode === 'secretkey' && s.staffModeBtnActive]}
                  >
                    <Feather name="key" size={13} color={staffMode === 'secretkey' ? '#fff' : '#6366F1'} />
                    <Text style={[s.staffModeTxt, staffMode === 'secretkey' && s.staffModeTxtActive]}>Secret Key</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.inputBox}>
                  <Feather name={staffMode === 'secretkey' ? 'key' : 'hash'} size={16} color="#8B5CF6" style={s.inputIcon} />
                  <TextInput
                    ref={codeRef}
                    style={[s.input, { flex: 1, fontFamily: 'Inter_700Bold', letterSpacing: staffMode === 'secretkey' ? 1.5 : 2 }]}
                    placeholder={staffMode === 'secretkey' ? 'e.g. SK-AB12-XY34 or OF-AB12-XY34' : 'e.g. OF1234A or SK1234A'}
                    placeholderTextColor="#475569"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    value={staffUserId}
                    onChangeText={v => {
                      if (staffMode === 'secretkey') {
                        setStaffUserId(v.replace(/[^A-Za-z0-9\-]/g, '').toUpperCase());
                      } else {
                        setStaffUserId(v.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
                      }
                    }}
                    onSubmitEditing={handleStaffLogin}
                    returnKeyType="done"
                  />
                </View>

                <View style={s.prefixHint}>
                  <Feather name="info" size={10} color="#6366F1" />
                  {staffMode === 'secretkey' ? (
                    <>
                      <Text style={s.prefixHintLabel}>Format: </Text>
                      <Text style={s.prefixHintCode}>SK-XXXX-XXXX</Text>
                      <Text style={s.prefixHintLabel}> · </Text>
                      <Text style={s.prefixHintCode}>OF-XXXX-XXXX</Text>
                    </>
                  ) : (
                    <>
                      <Text style={s.prefixHintLabel}>Format: </Text>
                      <Text style={s.prefixHintCode}>OF1234A</Text>
                      <Text style={s.prefixHintLabel}> (Official) · </Text>
                      <Text style={s.prefixHintCode}>SK1234A</Text>
                      <Text style={s.prefixHintLabel}> (Safai Karmi)</Text>
                    </>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleStaffLogin}
                  disabled={loading || staffUserId.trim().length < 4}
                  activeOpacity={0.88}
                  style={[s.btnWrap, (loading || staffUserId.trim().length < 4) && { opacity: 0.4 }]}
                >
                  <LinearGradient
                    colors={staffMode === 'secretkey' ? ['#C084FC', '#7C3AED'] : ['#7C3AED', '#6366F1']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.btn}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Feather name={staffMode === 'secretkey' ? 'key' : 'log-in'} size={16} color="#fff" />}
                    <Text style={s.btnTxt}>{loading ? 'Signing in…' : 'Sign In'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={s.staffNote}>
                  <Feather name="shield" size={12} color="#6366F1" />
                  <Text style={s.staffNoteTxt}>
                    {staffMode === 'secretkey' ? 'Secret Key is provided by the Super Admin.' : 'Your User ID is assigned by the Super Admin.'}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={s.quickLinks}>
            <TouchableOpacity onPress={() => router.push('/signup')} activeOpacity={0.85} style={s.qlBtn}>
              <LinearGradient colors={['rgba(16,185,129,0.13)','rgba(5,150,105,0.04)']} style={s.qlGrad}>
                <Feather name="user-plus" size={15} color="#10B981" />
                <Text style={[s.qlTxt, { color: '#10B981' }]}>Create Citizen Account</Text>
                <Feather name="chevron-right" size={14} color="#10B981" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/forgot-password')} activeOpacity={0.85} style={s.qlBtn}>
              <LinearGradient colors={['rgba(245,158,11,0.12)','rgba(239,68,68,0.04)']} style={s.qlGrad}>
                <Feather name="unlock" size={15} color="#F59E0B" />
                <Text style={[s.qlTxt, { color: '#F59E0B' }]}>Reset Password</Text>
                <Feather name="chevron-right" size={14} color="#F59E0B" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={s.version}>DNP360 · Nagar Parishad Daudnagar · Bihar</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const lg = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 16, position: 'relative' },
  badge: {
    width: 120, height: 120,
    borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    gap: 2,
    overflow: 'hidden',
    shadowColor: '#1B3FA8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 16,
  },
  topAccentRow: { flexDirection: 'row', gap: 5, marginBottom: 4 },
  accentDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#06B6D4' },
  letterRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  dLetter: {
    color: '#FFFFFF',
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    lineHeight: 44,
    letterSpacing: -1,
  },
  npStack: { justifyContent: 'center', gap: -4, marginLeft: 2 },
  npTop: { color: '#60A5FA', fontSize: 19, fontFamily: 'Inter_700Bold', lineHeight: 21 },
  npBot: { color: '#06B6D4', fontSize: 19, fontFamily: 'Inter_700Bold', lineHeight: 21 },
  rulerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 3 },
  rulerLine: { flex: 1, height: 1.5, backgroundColor: 'rgba(255,255,255,0.25)', maxWidth: 16 },
  rulerTick: { width: 1.5, height: 6, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  rulerCenter: { width: 8, height: 8, justifyContent: 'center', alignItems: 'center' },
  rulerDiamond: { width: 6, height: 6, borderRadius: 1, backgroundColor: '#F59E0B', transform: [{ rotate: '45deg' }] },
  threeSixty: { color: '#06B6D4', fontSize: 15, fontFamily: 'Inter_700Bold', letterSpacing: 3 },
  bottomDots: { flexDirection: 'row', gap: 4, marginTop: 4 },
  bottomDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  cornerDecor: { position: 'absolute', width: 10, height: 10, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderRadius: 2 },
  glowBelow: {
    position: 'absolute',
    bottom: -10,
    width: 80, height: 20,
    backgroundColor: '#1B3FA8',
    opacity: 0.25,
    borderRadius: 40,
    alignSelf: 'center',
  },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  blob: { position: 'absolute', borderRadius: 999 },
  blob1: { width: 320, height: 320, backgroundColor: '#2563EB0D', top: -100, right: -100 },
  blob2: { width: 220, height: 220, backgroundColor: '#7C3AED0A', bottom: 80, left: -80 },
  blob3: { width: 160, height: 160, backgroundColor: '#06B6D408', top: '42%', right: -40 },

  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 50, paddingBottom: 28 },

  header: { alignItems: 'center', marginBottom: 24 },
  orgName: { color: '#94A3B8', fontSize: 13, fontFamily: 'Inter_400Regular' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveTxt: { color: '#475569', fontSize: 11, fontFamily: 'Inter_400Regular' },

  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tabWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  tabActive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13 },
  tabInactive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  tabActiveTxt: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tabInactiveTxt: { color: '#4B5563', fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 18,
    gap: 13,
    marginBottom: 14,
  },
  cardTitle: { color: '#F1F5F9', fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  cardSub: { color: '#475569', fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: -5 },

  subRow: { flexDirection: 'row', gap: 8 },
  subBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  subBtnActive: { borderColor: '#3B82F6', backgroundColor: 'rgba(37,99,235,0.15)' },
  subBtnTxt: { color: '#4B5563', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  subBtnTxtActive: { color: '#60A5FA' },

  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 1 },
  inputIcon: { marginRight: 4 },
  input: { flex: 1, color: '#E2E8F0', fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 14 },
  eyeBtn: { padding: 6 },
  copyBtn: { padding: 7, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', marginLeft: 4 },
  copyBtnActive: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' },

  copiedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(16,185,129,0.18)' },
  copiedTxt: { color: '#34D399', fontSize: 12, fontFamily: 'Inter_500Medium' },

  forgotRow: { alignSelf: 'flex-end' },
  forgotTxt: { color: '#60A5FA', fontSize: 13, fontFamily: 'Inter_500Medium' },

  signInRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  btnWrap: { borderRadius: 14, overflow: 'hidden' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  btnTxt: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_700Bold' },
  googleG: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

  roleRow: { flexDirection: 'row', gap: 12 },
  roleCardWrap: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  roleCardActive: { paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center', gap: 8, justifyContent: 'center' },
  roleCardInactive: { paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center', gap: 8, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  roleCardTxt: { color: '#475569', fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.3, textAlign: 'center' },
  roleCardTxtActive: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.3, textAlign: 'center' },
  prefixBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6 },
  prefixBadgeTxt: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },

  prefixHint: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(99,102,241,0.14)' },
  prefixHintLabel: { color: '#64748B', fontSize: 11, fontFamily: 'Inter_400Regular' },
  prefixHintCode: { color: '#818CF8', fontSize: 11, fontFamily: 'Inter_700Bold' },

  staffNote: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(99,102,241,0.13)' },
  staffNoteTxt: { color: '#818CF8', fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1 },
  staffModeRow: { flexDirection: 'row', gap: 8 },
  staffModeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.35)', backgroundColor: 'rgba(99,102,241,0.07)' },
  staffModeBtnActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  staffModeTxt: { color: '#6366F1', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  staffModeTxtActive: { color: '#fff' },

  quickLinks: { gap: 10, marginBottom: 14 },
  qlBtn: { borderRadius: 14, overflow: 'hidden' },
  qlGrad: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  qlTxt: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  version: { textAlign: 'center', color: '#1E2A40', fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 4 },
});
