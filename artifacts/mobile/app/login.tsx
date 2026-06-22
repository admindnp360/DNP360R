import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DNP360Logo } from '@/components/DNP360Logo';
import { useAuth } from '@/contexts/AuthContext';

const IS_WEB = Platform.OS === 'web';

export default function LoginScreen() {
  const { login, loginWithCode, loginWithGoogle } = useAuth();
  const insets = useSafeAreaInsets();
  const [mainTab, setMainTab] = useState<'signin' | 'secret'>('signin');
  const [subTab, setSubTab] = useState<'mobile' | 'email'>('email');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSignIn() {
    const id = subTab === 'mobile' ? mobile.trim() : email.trim();
    if (!id || !password) { Alert.alert('Missing Fields', 'Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const ok = await login(id, password, subTab);
      if (!ok) Alert.alert('Login Failed', 'Invalid credentials.\n\nDemo: citizen.dnp360@gmail.com / 12345678');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  async function handleSecretCode() {
    if (!secretCode.trim()) { Alert.alert('Missing Code', 'Please enter your secret code.'); return; }
    setLoading(true);
    try {
      const ok = await loginWithCode(secretCode.trim());
      if (!ok) Alert.alert('Invalid Code', 'Code not recognised.\n\nDemo: SK2566F · OFF4416A · ADMIN5790X');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const ok = await loginWithGoogle();
      if (ok) router.replace('/(tabs)');
      else Alert.alert('Sign-In Failed', 'Google Sign-In failed. Check Firebase authorised domains.');
    } catch { Alert.alert('Error', 'Google Sign-In error. Try again.'); }
    finally { setGoogleLoading(false); }
  }

  return (
    <LinearGradient colors={['#010D1F', '#06193A', '#010D1F']} locations={[0, 0.5, 1]} style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <View style={[styles.screen, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 10 }]}>

          {/* ─── Compact header ─── */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <View style={styles.logoGlow} />
              <View style={styles.logoShield}>
                <DNP360Logo size="sm" />
              </View>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.orgName}>Nagar Parishad Daudnagar</Text>
              <View style={styles.badgeRow}>
                <View style={styles.badge}><Text style={styles.badgeTxt}>Bihar</Text></View>
                <View style={[styles.badge, { borderColor: 'rgba(99,102,241,0.4)', backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                  <Text style={[styles.badgeTxt, { color: '#A5B4FC' }]}>Est. 1956</Text>
                </View>
                <View style={[styles.badge, { borderColor: 'rgba(16,185,129,0.4)', backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                  <Text style={[styles.badgeTxt, { color: '#6EE7B7' }]}>Certified</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ─── Card ─── */}
          <View style={styles.cardOuter}>
            <LinearGradient
              colors={['rgba(30,123,240,0.3)', 'rgba(30,123,240,0.04)', 'transparent']}
              locations={[0, 0.25, 1]}
              style={styles.cardGlow}
            >
              <View style={styles.card}>

                <Text style={styles.welcome}>Welcome Back</Text>
                <Text style={styles.welcomeSub}>Sign in to DNP360</Text>

                {/* Main tabs */}
                <View style={styles.mainTabs}>
                  {(['signin', 'secret'] as const).map((t) => (
                    <Pressable key={t} onPress={() => setMainTab(t)} style={[styles.mainTab, mainTab === t && styles.mainTabActive]}>
                      {mainTab === t && (
                        <LinearGradient colors={t === 'signin' ? ['#1E7BF0','#1050C0'] : ['#6366F1','#4F46E5']}
                          style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                      )}
                      <Feather name={t === 'signin' ? 'log-in' : 'shield'} size={12}
                        color={mainTab === t ? '#fff' : '#4A6A8A'} />
                      <Text style={[styles.mainTabTxt, mainTab === t && { color: '#fff' }]}>
                        {t === 'signin' ? 'Sign In' : 'Secret Code'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {mainTab === 'signin' ? (
                  <>
                    {/* Sub tabs */}
                    <View style={styles.subTabs}>
                      {(['mobile', 'email'] as const).map((t) => (
                        <Pressable key={t} onPress={() => setSubTab(t)}
                          style={[styles.subTab, subTab === t && styles.subTabActive]}>
                          <Feather name={t === 'mobile' ? 'smartphone' : 'mail'} size={12}
                            color={subTab === t ? '#60A5FA' : '#3D5A7A'} />
                          <Text style={[styles.subTabTxt, subTab === t && { color: '#60A5FA' }]}>
                            {t === 'mobile' ? 'Mobile' : 'Email'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Identifier input */}
                    <View style={styles.inputRow}>
                      <Feather name={subTab === 'mobile' ? 'smartphone' : 'mail'} size={15} color="#3A6090" />
                      <TextInput
                        style={styles.input}
                        placeholder={subTab === 'mobile' ? 'Mobile Number' : 'Email Address'}
                        placeholderTextColor="#243C58"
                        keyboardType={subTab === 'mobile' ? 'phone-pad' : 'email-address'}
                        autoCapitalize="none"
                        value={subTab === 'mobile' ? mobile : email}
                        onChangeText={subTab === 'mobile' ? setMobile : setEmail}
                      />
                    </View>

                    {/* Password */}
                    <View style={styles.inputRow}>
                      <Feather name="lock" size={15} color="#3A6090" />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Password"
                        placeholderTextColor="#243C58"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        onSubmitEditing={handleSignIn}
                        returnKeyType="done"
                      />
                      <Pressable onPress={() => setShowPassword(p => !p)} hitSlop={8}>
                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={15} color="#3A6090" />
                      </Pressable>
                    </View>

                    {/* Forgot */}
                    <Pressable onPress={() => router.push('/forgot-password')} style={{ alignSelf: 'flex-end' }}>
                      <Text style={styles.forgotTxt}>Forgot Password?</Text>
                    </Pressable>

                    {/* Sign In */}
                    <TouchableOpacity onPress={handleSignIn} disabled={loading || googleLoading}
                      activeOpacity={0.87} style={styles.primaryWrap}>
                      <LinearGradient
                        colors={loading ? ['#0A2D6A','#0A2D6A'] : ['#1E7BF0','#0F4FBF']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.primaryBtn}>
                        {loading ? <ActivityIndicator color="#fff" size="small" />
                          : <Feather name="log-in" size={15} color="#fff" />}
                        <Text style={styles.primaryTxt}>{loading ? 'Signing in…' : 'Sign In'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Google — web only */}
                    {IS_WEB && (
                      <TouchableOpacity style={[styles.googleBtn, googleLoading && { opacity: 0.7 }]}
                        onPress={handleGoogle} disabled={loading || googleLoading} activeOpacity={0.87}>
                        {googleLoading
                          ? <ActivityIndicator color="#4285F4" size="small" />
                          : <View style={styles.googleIconWrap}><Text style={styles.googleG}>G</Text></View>}
                        <Text style={styles.googleTxt}>{googleLoading ? 'Signing in…' : 'Continue with Google'}</Text>
                      </TouchableOpacity>
                    )}

                    {/* Create account */}
                    <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/signup')} activeOpacity={0.85}>
                      <Feather name="user-plus" size={14} color="#60A5FA" />
                      <Text style={styles.createTxt}>Create Citizen Account</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Secret code tab */}
                    <LinearGradient colors={['rgba(99,102,241,0.18)','rgba(139,92,246,0.06)']}
                      style={styles.secretInfo}>
                      <LinearGradient colors={['#6366F1','#8B5CF6']} style={styles.secretIcon}>
                        <Feather name="shield" size={15} color="#fff" />
                      </LinearGradient>
                      <Text style={styles.secretTxt}>
                        Issued by Nagar Parishad Admin. Each code is unique and tied to your role.
                      </Text>
                    </LinearGradient>

                    <View style={styles.inputRow}>
                      <Feather name="key" size={15} color="#3A6090" />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. SK2566F"
                        placeholderTextColor="#243C58"
                        autoCapitalize="characters"
                        value={secretCode}
                        onChangeText={setSecretCode}
                        onSubmitEditing={handleSecretCode}
                        returnKeyType="done"
                      />
                    </View>

                    <TouchableOpacity onPress={handleSecretCode} disabled={loading}
                      activeOpacity={0.87} style={styles.primaryWrap}>
                      <LinearGradient
                        colors={loading ? ['#2D1F6E','#2D1F6E'] : ['#6366F1','#4F46E5']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.primaryBtn}>
                        {loading ? <ActivityIndicator color="#fff" size="small" />
                          : <Feather name="shield" size={15} color="#fff" />}
                        <Text style={styles.primaryTxt}>{loading ? 'Verifying…' : 'Authenticate'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.chips}>
                      {[
                        { label: 'Safai Karmi', prefix: 'SK…', color: '#10B981' },
                        { label: 'Official', prefix: 'OFF…', color: '#F59E0B' },
                        { label: 'Admin', prefix: 'ADMIN…', color: '#818CF8' },
                      ].map(c => (
                        <View key={c.label} style={[styles.chip, { borderColor: c.color + '40' }]}>
                          <View style={[styles.chipDot, { backgroundColor: c.color }]} />
                          <Text style={[styles.chipPrefix, { color: c.color }]}>{c.prefix}</Text>
                          <Text style={styles.chipLabel}>{c.label}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* ─── Minimal footer ─── */}
          <Text style={styles.version}>DNP360 v1.0 · Nagar Parishad Daudnagar · Bihar</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav:  { flex: 1 },
  screen: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoWrap: { position: 'relative', width: 58, height: 58, justifyContent: 'center', alignItems: 'center' },
  logoGlow: {
    position: 'absolute', width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(30,123,240,0.18)',
    borderWidth: 1, borderColor: 'rgba(30,123,240,0.35)',
  },
  logoShield: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: 'rgba(10,30,80,0.9)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(30,123,240,0.25)',
    shadowColor: '#1E7BF0', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 6,
  },
  headerText: { flex: 1, gap: 6 },
  orgName: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_700Bold' },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
    backgroundColor: 'rgba(30,123,240,0.1)',
    borderWidth: 1, borderColor: 'rgba(30,123,240,0.35)',
  },
  badgeTxt: { color: '#6AA0D8', fontSize: 9, fontFamily: 'Inter_600SemiBold' },

  /* Card */
  cardOuter: {
    borderRadius: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 20,
  },
  cardGlow: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(30,123,240,0.28)', padding: 1.5 },
  card: { backgroundColor: 'rgba(4,16,42,0.96)', borderRadius: 21, padding: 18, gap: 11 },
  welcome: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  welcomeSub: { color: '#3A5E82', fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: -4 },

  /* Main tabs */
  mainTabs: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, padding: 3, gap: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  mainTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: 10, overflow: 'hidden',
  },
  mainTabActive: {},
  mainTabTxt: { color: '#4A6A8A', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  /* Sub tabs */
  subTabs: { flexDirection: 'row', gap: 7 },
  subTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  subTabActive: { backgroundColor: 'rgba(30,123,240,0.12)', borderColor: 'rgba(96,165,250,0.35)' },
  subTabTxt: { color: '#3D5A7A', fontSize: 11, fontFamily: 'Inter_500Medium' },

  /* Inputs */
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 13, paddingVertical: 12,
  },
  input: { flex: 1, color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_400Regular' },
  forgotTxt: { color: '#3A6090', fontSize: 11, fontFamily: 'Inter_500Medium' },

  /* Buttons */
  primaryWrap: {
    borderRadius: 13,
    shadowColor: '#1264E8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 7,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7,
    borderRadius: 13, paddingVertical: 14,
  },
  primaryTxt: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_700Bold' },

  /* Google (web only) */
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 18, justifyContent: 'center',
  },
  googleIconWrap: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(66,133,244,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  googleG: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#4285F4' },
  googleTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1F2937', flex: 1, textAlign: 'center' },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 12, paddingVertical: 11,
    backgroundColor: 'rgba(30,123,240,0.07)',
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)',
  },
  createTxt: { color: '#60A5FA', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  /* Secret tab */
  secretInfo: {
    flexDirection: 'row', gap: 11, borderRadius: 13,
    padding: 12, alignItems: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.28)',
  },
  secretIcon: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  secretTxt: { flex: 1, color: '#A5B4FC', fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  chips: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 99, borderWidth: 1,
    paddingHorizontal: 9, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipDot: { width: 5, height: 5, borderRadius: 3 },
  chipPrefix: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  chipLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'Inter_400Regular' },

  version: {
    textAlign: 'center', color: '#1C3050',
    fontSize: 9, fontFamily: 'Inter_400Regular',
  },
});
