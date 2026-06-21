import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DNP360Logo } from '@/components/DNP360Logo';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { login, loginWithCode } = useAuth();
  const [mainTab, setMainTab] = useState<'signin' | 'secret'>('signin');
  const [subTab, setSubTab] = useState<'mobile' | 'email'>('email');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    const id = subTab === 'mobile' ? mobile.trim() : email.trim();
    if (!id || !password) { Alert.alert('Missing fields', 'Please fill in all required fields.'); return; }
    setLoading(true);
    try {
      const success = await login(id, password, subTab);
      if (!success) Alert.alert('Login Failed', 'Invalid credentials.\n\nDemo: citizen.dnp360@gmail.com / 12345678');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  async function handleSecretCode() {
    if (!secretCode.trim()) { Alert.alert('Missing code', 'Please enter your secret code.'); return; }
    setLoading(true);
    try {
      const success = await loginWithCode(secretCode.trim());
      if (!success) Alert.alert('Invalid Code', 'Secret code not recognised.\n\nDemo codes:\nSK2566F · OFF4416A · ADMIN5790X');
      else router.replace('/(tabs)');
    } finally { setLoading(false); }
  }

  function handleGoogleSignIn() {
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In will be available once Firebase is integrated.\n\nFirebase integration coming soon.',
      [{ text: 'OK', style: 'default' }]
    );
  }

  return (
    <LinearGradient colors={['#031331', '#0D2350', '#031331']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoShield}>
              <View style={styles.shieldInner}><DNP360Logo size="md" /></View>
            </View>
            <Text style={styles.tagline}>Nagar Parishad Daudnagar</Text>
            <Text style={styles.subtitle}>Smart Governance · Digital India</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.welcome}>Welcome Back</Text>
            <Text style={styles.welcomeSub}>Sign in to access your DNP360 account</Text>

            <View style={styles.mainTabs}>
              <Pressable style={[styles.mainTab, mainTab === 'signin' && styles.mainTabActive]} onPress={() => setMainTab('signin')}>
                <Text style={[styles.mainTabText, mainTab === 'signin' && styles.mainTabTextActive]}>Sign In</Text>
              </Pressable>
              <Pressable style={[styles.mainTab, mainTab === 'secret' && styles.mainTabActive]} onPress={() => setMainTab('secret')}>
                <Text style={[styles.mainTabText, mainTab === 'secret' && styles.mainTabTextActive]}>Secret Code</Text>
              </Pressable>
            </View>

            {mainTab === 'signin' ? (
              <>
                <View style={styles.subTabs}>
                  {(['mobile', 'email'] as const).map((t) => (
                    <Pressable key={t} style={[styles.subTab, subTab === t && styles.subTabActive]} onPress={() => setSubTab(t)}>
                      <Feather name={t === 'mobile' ? 'smartphone' : 'mail'} size={13} color={subTab === t ? '#60A0F0' : '#8A9BB0'} />
                      <Text style={[styles.subTabText, subTab === t && styles.subTabTextActive]}>{t === 'mobile' ? 'Mobile' : 'Email'}</Text>
                    </Pressable>
                  ))}
                </View>

                {subTab === 'mobile' ? (
                  <View style={styles.inputWrap}>
                    <Feather name="smartphone" size={16} color="#8A9BB0" />
                    <TextInput style={styles.input} placeholder="Mobile Number" placeholderTextColor="#8A9BB0" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} />
                  </View>
                ) : (
                  <View style={styles.inputWrap}>
                    <Feather name="mail" size={16} color="#8A9BB0" />
                    <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#8A9BB0" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                  </View>
                )}

                <View style={styles.inputWrap}>
                  <Feather name="lock" size={16} color="#8A9BB0" />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Password" placeholderTextColor="#8A9BB0" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 6 }}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#8A9BB0" />
                  </Pressable>
                </View>

                <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotRow}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>

                <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.6 }]} onPress={handleSignIn} disabled={loading} activeOpacity={0.85}>
                  <Feather name="log-in" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
                </TouchableOpacity>

                {/* OR Divider */}
                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Google Sign-In Button */}
                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} activeOpacity={0.85}>
                  <View style={styles.googleIconWrap}>
                    <Text style={styles.googleIconG}>G</Text>
                  </View>
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                  <View style={styles.googleComingSoon}>
                    <Text style={styles.googleComingSoonText}>Soon</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>New to DNP360?</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.signUpBtn} onPress={() => router.push('/signup')} activeOpacity={0.85}>
                  <Feather name="user-plus" size={16} color="#60A0F0" />
                  <Text style={styles.signUpBtnText}>Create Citizen Account</Text>
                </TouchableOpacity>

                <View style={styles.demoBox}>
                  <Text style={styles.demoTitle}>Demo Credentials</Text>
                  <Text style={styles.demoItem}>citizen.dnp360@gmail.com / 12345678</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.secretDesc}>Officials and Safai Karmis use their assigned secret code to sign in securely.</Text>
                <View style={styles.inputWrap}>
                  <Feather name="key" size={16} color="#8A9BB0" />
                  <TextInput style={styles.input} placeholder="Secret Code (e.g. SK2566F)" placeholderTextColor="#8A9BB0" autoCapitalize="characters" value={secretCode} onChangeText={setSecretCode} />
                </View>
                <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.6 }]} onPress={handleSecretCode} disabled={loading} activeOpacity={0.85}>
                  <Feather name="shield" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>{loading ? 'Verifying…' : 'Authenticate'}</Text>
                </TouchableOpacity>
                <View style={styles.demoBox}>
                  <Text style={styles.demoTitle}>Demo Secret Codes</Text>
                  <Text style={styles.demoItem}>Safai Karmi: SK2566F</Text>
                  <Text style={styles.demoItem}>Official: OFF4416A</Text>
                  <Text style={styles.demoItem}>Admin: ADMIN5790X</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.footer}>
            {[{ icon: 'shield', label: 'Secure' }, { icon: 'zap', label: 'Fast' }, { icon: 'check-circle', label: 'Reliable' }, { icon: 'award', label: 'Trusted' }].map((f) => (
              <View key={f.label} style={styles.footerItem}>
                <Feather name={f.icon as any} size={14} color="#5F8BC0" />
                <Text style={styles.footerText}>{f.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.version}>DNP360 v1.0 · Bihar, India</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 28 },
  logoShield: { width: 88, height: 88, borderRadius: 24, backgroundColor: 'rgba(0,90,182,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(0,90,182,0.4)' },
  shieldInner: { width: 72, height: 72, borderRadius: 18, backgroundColor: 'rgba(0,90,182,0.4)', justifyContent: 'center', alignItems: 'center' },
  tagline: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Inter_700Bold' },
  subtitle: { color: '#8AB0D8', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 24, marginBottom: 24 },
  welcome: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 4 },
  welcomeSub: { color: '#8AB0D8', fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 20 },
  mainTabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 4, marginBottom: 16 },
  mainTab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  mainTabActive: { backgroundColor: '#1264E8' },
  mainTabText: { color: '#8AB0D8', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  mainTabTextActive: { color: '#FFFFFF' },
  subTabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  subTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  subTabActive: { borderColor: '#60A0F0', backgroundColor: 'rgba(18,100,232,0.2)' },
  subTabText: { color: '#8A9BB0', fontSize: 12, fontFamily: 'Inter_500Medium' },
  subTabTextActive: { color: '#60A0F0' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12, paddingHorizontal: 14 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 14 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 16 },
  forgotText: { color: '#5F8BC0', fontSize: 13, fontFamily: 'Inter_500Medium' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1264E8', borderRadius: 14, paddingVertical: 15, marginBottom: 16 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  // OR divider
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  orText: { color: '#6A7D96', fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  // Google button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
    marginBottom: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8EAED',
  },
  googleIconG: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#4285F4',
    lineHeight: 20,
  },
  googleBtnText: { flex: 1, color: '#1F2937', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  googleComingSoon: {
    backgroundColor: '#FEF3C7',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  googleComingSoonText: { color: '#92400E', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#8A9BB0', fontSize: 12, fontFamily: 'Inter_500Medium' },
  signUpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(96,160,240,0.1)', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(96,160,240,0.3)', marginBottom: 12 },
  signUpBtnText: { color: '#60A0F0', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  secretDesc: { color: '#8AB0D8', fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 18, lineHeight: 20 },
  demoBox: { marginTop: 10, backgroundColor: 'rgba(18,100,232,0.15)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(18,100,232,0.3)' },
  demoTitle: { color: '#ABC7FF', fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  demoItem: { color: '#8AB0D8', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginBottom: 12 },
  footerItem: { alignItems: 'center', gap: 4 },
  footerText: { color: '#5F8BC0', fontSize: 10, fontFamily: 'Inter_400Regular' },
  version: { textAlign: 'center', color: '#3D5E82', fontSize: 10, fontFamily: 'Inter_400Regular' },
});
