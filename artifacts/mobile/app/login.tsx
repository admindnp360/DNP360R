import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

export default function LoginScreen() {
  const { login, loginWithCode, loginWithGoogle } = useAuth();
  const { showAlert } = useAlert();
  const [mainTab, setMainTab] = useState<'signin' | 'secret'>('signin');
  const [subTab, setSubTab] = useState<'email' | 'mobile'>('email');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSignIn() {
    const id = subTab === 'mobile' ? mobile.trim() : email.trim();
    if (!id || !password) { showAlert('Missing Fields', 'Please fill in all required fields.', undefined, 'warning'); return; }
    setLoading(true);
    try {
      const ok = await login(id, password, subTab);
      if (!ok) showAlert('Login Failed', 'Invalid credentials. Check your email/mobile and password.', undefined, 'error');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  async function handleSecretCode() {
    if (!secretCode.trim()) { showAlert('Missing Code', 'Please enter your secret code.', undefined, 'warning'); return; }
    setLoading(true);
    try {
      const ok = await loginWithCode(secretCode.trim());
      if (!ok) showAlert('Invalid Code', 'Secret code not recognised or already inactive.', undefined, 'error');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const ok = await loginWithGoogle();
      if (ok) router.replace('/(tabs)');
      else showAlert(
        'Setup Required',
        'Google Sign-In needs your Firebase project domain to be authorised.\n\nGo to: Firebase Console → Authentication → Settings → Authorised Domains → Add your domain.',
        [{ text: 'Understood', style: 'default' }],
        'warning'
      );
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/unauthorized-domain' || code === 'auth/operation-not-allowed') {
        showAlert(
          'Domain Not Authorised',
          'Your app domain is not added to Firebase authorised domains.\n\nFix: Firebase Console → Authentication → Settings → Authorised Domains → Add your domain.',
          [{ text: 'Got it', style: 'default' }],
          'warning'
        );
      } else {
        showAlert('Error', 'Google Sign-In is unavailable. Please use Email login.', undefined, 'error');
      }
    }
    finally { setGoogleLoading(false); }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#07002E', '#100840', '#0A1550']} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Logo ── */}
          <View style={styles.header}>
            {/* Multi-ring vibrant logo */}
            <View style={styles.logoContainer}>
              {/* Outer glow blobs */}
              <View style={styles.logoBlob1} />
              <View style={styles.logoBlob2} />

              {/* Outermost ring — 4-color border */}
              <View style={styles.logoRingOuter} />

              {/* Middle ring — gradient overlay simulation */}
              <View style={styles.logoRingMid} />

              {/* 8 colored spark dots around the ring */}
              {[
                { color: '#6366F1', top: 0,   left: 55 },
                { color: '#06B6D4', top: 10,  left: 100 },
                { color: '#10B981', top: 55,  left: 122 },
                { color: '#F59E0B', top: 100, left: 108 },
                { color: '#EF4444', top: 122, left: 55 },
                { color: '#EC4899', top: 108, left: 8 },
                { color: '#2563EB', top: 55,  left: -4 },
                { color: '#8B5CF6', top: 8,   left: 12 },
              ].map((dot, i) => (
                <View key={i} style={[styles.sparkDot, { backgroundColor: dot.color, top: dot.top, left: dot.left }]} />
              ))}

              {/* Inner white ring */}
              <View style={styles.logoRingInner}>
                {/* Logo image — DNP360 text kept as-is */}
                <View style={styles.logoImageWrap}>
                  <LinearGradient colors={['rgba(99,102,241,0.2)', 'rgba(6,182,212,0.1)']} style={StyleSheet.absoluteFill} borderRadius={48} />
                  <Image
                    source={require('@/assets/images/dnp360-logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>

            <Text style={styles.orgName}>Nagar Parishad Daudnagar</Text>
            <View style={styles.orgBadge}>
              <View style={styles.badgeDot} />
              <Text style={styles.orgSub}>Smart Governance · Digital India</Text>
            </View>
          </View>

          {/* ── Main Tab Pills ── */}
          <View style={styles.mainTabRow}>
            <Pressable
              style={[styles.mainTabBtn, mainTab === 'signin' && styles.mainTabBtnActive]}
              onPress={() => setMainTab('signin')}
            >
              {mainTab === 'signin'
                ? <LinearGradient colors={['#2563EB', '#4F46E5']} style={styles.mainTabGrad}>
                    <Feather name="log-in" size={14} color="#fff" />
                    <Text style={styles.mainTabTextActive}>Sign In</Text>
                  </LinearGradient>
                : <View style={styles.mainTabPlain}>
                    <Feather name="log-in" size={14} color="#6B7280" />
                    <Text style={styles.mainTabText}>Sign In</Text>
                  </View>
              }
            </Pressable>
            <Pressable
              style={[styles.mainTabBtn, mainTab === 'secret' && styles.mainTabBtnActive]}
              onPress={() => setMainTab('secret')}
            >
              {mainTab === 'secret'
                ? <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.mainTabGrad}>
                    <Feather name="shield" size={14} color="#fff" />
                    <Text style={styles.mainTabTextActive}>Secret Code</Text>
                  </LinearGradient>
                : <View style={styles.mainTabPlain}>
                    <Feather name="shield" size={14} color="#6B7280" />
                    <Text style={styles.mainTabText}>Secret Code</Text>
                  </View>
              }
            </Pressable>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            <LinearGradient
              colors={mainTab === 'signin' ? ['rgba(37,99,235,0.25)', 'rgba(79,70,229,0.08)', 'transparent'] : ['rgba(124,58,237,0.25)', 'rgba(99,102,241,0.08)', 'transparent']}
              style={styles.cardGlow}
            />

            {mainTab === 'signin' ? (
              <>
                <Text style={styles.cardTitle}>Welcome Back</Text>
                <Text style={styles.cardSub}>Sign in to access your DNP360 account</Text>

                {/* Sub tabs */}
                <View style={styles.subTabRow}>
                  {(['email', 'mobile'] as const).map(t => (
                    <Pressable
                      key={t}
                      onPress={() => setSubTab(t)}
                      style={[styles.subTabBtn, subTab === t && styles.subTabBtnActive]}
                    >
                      <Feather name={t === 'email' ? 'mail' : 'smartphone'} size={13} color={subTab === t ? '#60A5FA' : '#4B5563'} />
                      <Text style={[styles.subTabText, subTab === t && styles.subTabTextActive]}>
                        {t === 'email' ? 'Email' : 'Mobile No.'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {subTab === 'email' ? (
                  <View style={styles.inputWrap}>
                    <LinearGradient colors={['#2563EB', '#6366F1']} style={styles.inputIcon}>
                      <Feather name="mail" size={13} color="#fff" />
                    </LinearGradient>
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor="#4B5563"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                ) : (
                  <View style={styles.inputWrap}>
                    <LinearGradient colors={['#2563EB', '#6366F1']} style={styles.inputIcon}>
                      <Feather name="smartphone" size={13} color="#fff" />
                    </LinearGradient>
                    <TextInput
                      style={styles.input}
                      placeholder="10-digit mobile number"
                      placeholderTextColor="#4B5563"
                      keyboardType="phone-pad"
                      value={mobile}
                      onChangeText={setMobile}
                      maxLength={10}
                    />
                  </View>
                )}

                <View style={styles.inputWrap}>
                  <LinearGradient colors={['#2563EB', '#6366F1']} style={styles.inputIcon}>
                    <Feather name="lock" size={13} color="#fff" />
                  </LinearGradient>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor="#4B5563"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={handleSignIn}
                    returnKeyType="done"
                  />
                  <Pressable onPress={() => setShowPassword(p => !p)} style={{ padding: 6 }}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={15} color="#4B5563" />
                  </Pressable>
                </View>

                <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotRow}>
                  <Feather name="help-circle" size={12} color="#60A5FA" />
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>

                <View style={styles.signInRow}>
                  <TouchableOpacity
                    style={[styles.primaryBtnWrap, { flex: 1 }, loading && { opacity: 0.65 }]}
                    onPress={handleSignIn}
                    disabled={loading || googleLoading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['#2563EB', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                      {loading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="log-in" size={16} color="#fff" />}
                      <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {IS_WEB && (
                    <TouchableOpacity
                      style={[styles.googleBtnSquare, googleLoading && { opacity: 0.7 }]}
                      onPress={handleGoogleSignIn}
                      disabled={loading || googleLoading}
                      activeOpacity={0.85}
                    >
                      {googleLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <View style={styles.googleIconCircle}>
                          <Text style={styles.googleGText}>G</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Staff Authentication</Text>
                <Text style={styles.cardSub}>Enter your secret code issued by the Admin</Text>

                <View style={styles.codeRoleRow}>
                  {[
                    { role: 'Safai Karmi', prefix: 'SK…', colors: ['#10B981', '#059669'] as const, icon: 'trash-2' },
                    { role: 'Official', prefix: 'OFF…', colors: ['#F59E0B', '#EF4444'] as const, icon: 'briefcase' },
                    { role: 'Admin', prefix: 'ADMIN…', colors: ['#6366F1', '#8B5CF6'] as const, icon: 'shield' },
                  ].map(r => (
                    <View key={r.role} style={styles.codeRoleChip}>
                      <LinearGradient colors={r.colors} style={styles.codeRoleIcon}>
                        <Feather name={r.icon as any} size={10} color="#fff" />
                      </LinearGradient>
                      <View>
                        <Text style={styles.codeRolePrefix}>{r.prefix}</Text>
                        <Text style={styles.codeRoleName}>{r.role}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.inputWrap}>
                  <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.inputIcon}>
                    <Feather name="key" size={13} color="#fff" />
                  </LinearGradient>
                  <TextInput
                    style={styles.input}
                    placeholder="Secret Code  (e.g. SK2566F)"
                    placeholderTextColor="#4B5563"
                    autoCapitalize="characters"
                    value={secretCode}
                    onChangeText={setSecretCode}
                    onSubmitEditing={handleSecretCode}
                    returnKeyType="done"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtnWrap, loading && { opacity: 0.65 }]}
                  onPress={handleSecretCode}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#7C3AED', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                    {loading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="shield" size={16} color="#fff" />}
                    <Text style={styles.primaryBtnText}>{loading ? 'Verifying…' : 'Authenticate'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.secretNote}>
                  <Feather name="info" size={13} color="#6366F1" />
                  <Text style={styles.secretNoteText}>
                    First-time use creates your account automatically. Subsequent logins use the same code.
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* ── Quick Links — always visible ── */}
          <View style={styles.quickLinks}>
            <TouchableOpacity style={styles.quickLinkBtn} onPress={() => router.push('/signup')} activeOpacity={0.85}>
              <LinearGradient colors={['rgba(16,185,129,0.15)', 'rgba(5,150,105,0.05)']} style={styles.quickLinkGrad}>
                <Feather name="user-plus" size={16} color="#10B981" />
                <Text style={styles.quickLinkText}>Create Citizen Account</Text>
                <Feather name="arrow-right" size={14} color="#10B981" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLinkBtn} onPress={() => router.push('/forgot-password')} activeOpacity={0.85}>
              <LinearGradient colors={['rgba(245,158,11,0.12)', 'rgba(239,68,68,0.04)']} style={styles.quickLinkGrad}>
                <Feather name="unlock" size={16} color="#F59E0B" />
                <Text style={[styles.quickLinkText, { color: '#F59E0B' }]}>Reset Password</Text>
                <Feather name="arrow-right" size={14} color="#F59E0B" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Footer trust badges ── */}
          <View style={styles.footer}>
            {[
              { icon: 'shield', label: 'Firebase Auth', color: '#60A5FA' },
              { icon: 'database', label: 'Real-time DB', color: '#34D399' },
              { icon: 'zap', label: 'Instant Sync', color: '#FBBF24' },
              { icon: 'award', label: 'Govt. Trusted', color: '#A78BFA' },
            ].map(f => (
              <View key={f.label} style={styles.footerItem}>
                <Feather name={f.icon as any} size={13} color={f.color} />
                <Text style={[styles.footerText, { color: f.color + 'AA' }]}>{f.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.version}>DNP360 v1.0 · Nagar Parishad Daudnagar · Bihar</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 280, height: 280, backgroundColor: '#3B0FAA18', top: -80, right: -80 },
  orb2: { width: 200, height: 200, backgroundColor: '#06B6D410', bottom: 100, left: -60 },
  orb3: { width: 140, height: 140, backgroundColor: '#7C3AED15', top: '45%', right: 20 },

  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 24 },

  header: { alignItems: 'center', marginBottom: 22 },

  logoContainer: { width: 130, height: 130, justifyContent: 'center', alignItems: 'center', marginBottom: 14, position: 'relative' },

  logoBlob1: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: '#6366F122' },
  logoBlob2: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: '#06B6D415' },

  logoRingOuter: {
    position: 'absolute', width: 126, height: 126, borderRadius: 63,
    borderWidth: 3,
    borderTopColor: '#6366F1',
    borderRightColor: '#06B6D4',
    borderBottomColor: '#10B981',
    borderLeftColor: '#F59E0B',
  },
  logoRingMid: {
    position: 'absolute', width: 112, height: 112, borderRadius: 56,
    borderWidth: 1.5,
    borderTopColor: '#8B5CF6AA',
    borderRightColor: '#34D399AA',
    borderBottomColor: '#FBBF24AA',
    borderLeftColor: '#EC4899AA',
  },

  sparkDot: { position: 'absolute', width: 7, height: 7, borderRadius: 3.5 },

  logoRingInner: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(7,0,46,0.85)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  logoImageWrap: {
    width: 92, height: 92, borderRadius: 46,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: 82, height: 82 },

  orgName: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Inter_700Bold' },
  orgBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  orgSub: { color: '#6B7280', fontSize: 12, fontFamily: 'Inter_400Regular' },

  mainTabRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  mainTabBtn: { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  mainTabBtnActive: { borderColor: 'transparent' },
  mainTabGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12 },
  mainTabPlain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.04)' },
  mainTabText: { color: '#6B7280', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  mainTabTextActive: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: 22,
    gap: 14,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, borderRadius: 24 },
  cardTitle: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  cardSub: { color: '#6B7280', fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: -6 },

  subTabRow: { flexDirection: 'row', gap: 8 },
  subTabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  subTabBtnActive: { borderColor: '#60A5FA', backgroundColor: 'rgba(37,99,235,0.18)' },
  subTabText: { color: '#4B5563', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  subTabTextActive: { color: '#60A5FA' },

  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 2 },
  inputIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 13 },

  forgotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  forgotText: { color: '#60A5FA', fontSize: 13, fontFamily: 'Inter_500Medium' },

  signInRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },

  primaryBtnWrap: { borderRadius: 14, overflow: 'hidden' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_700Bold' },

  googleBtnSquare: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  googleIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  googleGText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#4285F4' },
  googleBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#E5E7EB', flex: 1, textAlign: 'center' },

  codeRoleRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  codeRoleChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 10 },
  codeRoleIcon: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  codeRolePrefix: { color: '#E9F1FF', fontSize: 10, fontFamily: 'Inter_700Bold' },
  codeRoleName: { color: '#4B5563', fontSize: 9, fontFamily: 'Inter_400Regular' },

  secretNote: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', alignItems: 'flex-start' },
  secretNoteText: { flex: 1, color: '#A5B4FC', fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  quickLinks: { gap: 10, marginBottom: 20 },
  quickLinkBtn: { borderRadius: 16, overflow: 'hidden' },
  quickLinkGrad: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16 },
  quickLinkText: { flex: 1, color: '#10B981', fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  footer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 10, flexWrap: 'wrap' },
  footerItem: { alignItems: 'center', gap: 4 },
  footerText: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  version: { textAlign: 'center', color: '#374151', fontSize: 9, fontFamily: 'Inter_400Regular' },
});
