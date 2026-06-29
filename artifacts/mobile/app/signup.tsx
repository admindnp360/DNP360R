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

export default function SignUpScreen() {
  const { register, loginWithGoogle, loginWithGoogleCredential } = useAuth();
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdName, setCreatedName] = useState('');

  useEffect(() => { WebBrowser.maybeCompleteAuthSession(); }, []);

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

  async function handleGoogleSignIn() {
    if (IS_WEB) {
      setGoogleLoading(true);
      try {
        const ok = await loginWithGoogle();
        if (ok) router.replace('/(tabs)');
        else showAlert('Sign-In Failed', 'Google Sign-In failed. Ensure your domain is authorised in Firebase Console.', undefined, 'warning');
      } catch {
        showAlert('Error', 'Google Sign-In unavailable.', undefined, 'error');
      } finally { setGoogleLoading(false); }
    } else {
      if (!googleRequest) {
        showAlert('Not Configured', 'Google Sign-In requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to be set.', undefined, 'warning');
        return;
      }
      await googlePromptAsync();
    }
  }

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
        setTimeout(() => router.replace('/(tabs)'), 3000);
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={['#060C1D', '#0B1429', '#111B3E']} style={StyleSheet.absoluteFill} />
        <View style={s.successWrap}>
          <View style={s.successRing}>
            <LinearGradient colors={['#10B981', '#059669']} style={s.successIcon}>
              <Feather name="check" size={38} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={s.successTitle}>Account Created!</Text>
          <Text style={s.successName}>{createdName}</Text>
          <Text style={s.successMsg}>Your citizen account is ready.{'\n'}Redirecting to dashboard…</Text>
          <View style={{ marginTop: 16, backgroundColor: 'rgba(99,102,241,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', padding: 14, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(99,102,241,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#818CF8', fontSize: 12, fontFamily: 'Inter_700Bold' }}>!</Text>
              </View>
              <Text style={{ color: '#A5B4FC', fontSize: 12, fontFamily: 'Inter_700Bold' }}>Also sign in with User ID</Text>
            </View>
            <Text style={{ color: 'rgba(165,180,252,0.75)', fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 }}>
              You can sign in using your assigned User ID — find it in your Profile after logging in. Use the "User ID" tab on the login page.
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} activeOpacity={0.85} style={s.successBtnWrap}>
            <LinearGradient colors={['#10B981', '#059669']} style={s.successBtn}>
              <Feather name="arrow-right" size={16} color="#fff" />
              <Text style={s.successBtnTxt}>Go to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <LinearGradient colors={['#060C1D', '#0B1429', '#111B3E']} style={StyleSheet.absoluteFill} />
      <View style={[s.blob, s.blob1]} />
      <View style={[s.blob, s.blob2]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Pressable style={s.backRow} onPress={() => router.back()}>
            <View style={s.backIconWrap}>
              <Feather name="arrow-left" size={16} color="#60A5FA" />
            </View>
            <Text style={s.backTxt}>Back to Sign In</Text>
          </Pressable>

          <View style={s.header}>
            <LinearGradient colors={['#10B981','#059669','#0284C7']} style={s.headerIcon}>
              <Feather name="user-plus" size={24} color="#fff" />
            </LinearGradient>
            <Text style={s.headerTitle}>Create Citizen Account</Text>
            <Text style={s.headerSub}>Register to access DNP360 municipal services</Text>
          </View>

          <View style={s.card}>
            <View style={s.sectionRow}>
              <View style={s.sectionDot} />
              <Text style={s.sectionTxt}>PERSONAL INFORMATION</Text>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Full Name <Text style={s.req}>*</Text></Text>
              <View style={s.inputBox}>
                <Feather name="user" size={15} color="#10B981" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Your full name"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Email Address <Text style={s.req}>*</Text></Text>
              <View style={s.inputBox}>
                <Feather name="mail" size={15} color="#10B981" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Mobile Number <Text style={s.req}>*</Text></Text>
              <View style={s.inputBox}>
                <Feather name="smartphone" size={15} color="#10B981" style={s.inputIcon} />
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
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Address <Text style={s.opt}>(optional)</Text></Text>
              <View style={s.inputBox}>
                <Feather name="map-pin" size={15} color="#10B981" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Ward / Area, Daudnagar"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="sentences"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.sectionRow}>
              <View style={[s.sectionDot, { backgroundColor: '#7C3AED' }]} />
              <Text style={s.sectionTxt}>SECURITY</Text>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Password <Text style={s.req}>*</Text></Text>
              <View style={s.inputBox}>
                <Feather name="lock" size={15} color="#7C3AED" style={s.inputIcon} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPw(p => !p)} style={s.eyeBtn}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={15} color="#7C3AED" />
                </Pressable>
              </View>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Confirm Password <Text style={s.req}>*</Text></Text>
              <View style={[s.inputBox, confirmPassword && confirmPassword !== password && { borderColor: '#EF4444' }]}>
                <Feather name="lock" size={15} color={confirmPassword && confirmPassword !== password ? '#EF4444' : '#7C3AED'} style={s.inputIcon} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Re-enter password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showCPw}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable onPress={() => setShowCPw(p => !p)} style={s.eyeBtn}>
                  <Feather name={showCPw ? 'eye-off' : 'eye'} size={15} color="#7C3AED" />
                </Pressable>
              </View>
              {confirmPassword && confirmPassword !== password && (
                <Text style={s.errorTxt}>Passwords do not match</Text>
              )}
            </View>

            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orTxt}>OR</Text>
              <View style={s.orLine} />
            </View>

            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
              activeOpacity={0.87}
              style={[s.btnWrap, googleLoading && { opacity: 0.65 }]}
            >
              <LinearGradient colors={['#DB4437','#EA4335']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                {googleLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.googleG}>G</Text>}
                <Text style={s.btnTxt}>{googleLoading ? 'Opening…' : 'Continue with Google'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading || googleLoading}
              activeOpacity={0.87}
              style={[s.btnWrap, loading && { opacity: 0.65 }]}
            >
              <LinearGradient colors={['#10B981','#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="user-check" size={17} color="#fff" />}
                <Text style={s.btnTxt}>{loading ? 'Creating Account…' : 'Create Citizen Account'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.noteBox}>
              <Feather name="info" size={12} color="#6366F1" />
              <Text style={s.noteTxt}>Only citizens can self-register. Staff authenticate via secret code issued by Admin.</Text>
            </View>
          </View>

          <Text style={s.version}>DNP360 · Bihar, India · Govt. Trusted</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 999 },
  blob1: { width: 240, height: 240, backgroundColor: '#10B9810D', top: -60, right: -60 },
  blob2: { width: 180, height: 180, backgroundColor: '#7C3AED0A', bottom: 80, left: -50 },

  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },

  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18, padding: 32 },
  successRing: { padding: 7, borderRadius: 64, borderWidth: 2, borderColor: 'rgba(16,185,129,0.3)' },
  successIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  successTitle: { color: '#F1F5F9', fontSize: 28, fontFamily: 'Inter_700Bold' },
  successName: { color: '#34D399', fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  successMsg: { color: '#475569', fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  successBtnWrap: { borderRadius: 14, overflow: 'hidden' },
  successBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  successBtnTxt: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  backIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(37,99,235,0.12)', borderWidth: 1, borderColor: 'rgba(37,99,235,0.2)' },
  backTxt: { color: '#60A5FA', fontSize: 13, fontFamily: 'Inter_500Medium' },

  header: { alignItems: 'center', gap: 10, marginBottom: 22 },
  headerIcon: { width: 68, height: 68, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#F1F5F9', fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSub: { color: '#475569', fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  card: { backgroundColor: 'rgba(255,255,255,0.035)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 18, gap: 13, marginBottom: 20 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 14, height: 14, borderRadius: 4, backgroundColor: '#10B981' },
  sectionTxt: { color: '#64748B', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  fieldGroup: { gap: 6 },
  label: { color: '#64748B', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  req: { color: '#F87171' },
  opt: { color: '#374151', fontFamily: 'Inter_400Regular' },

  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 13, paddingVertical: 1 },
  inputIcon: { marginRight: 4 },
  input: { flex: 1, color: '#E2E8F0', fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 13 },
  eyeBtn: { padding: 6 },
  errorTxt: { color: '#F87171', fontSize: 10, fontFamily: 'Inter_400Regular' },

  btnWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 16 },
  btnTxt: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_700Bold' },

  noteBox: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)', alignItems: 'flex-start' },
  noteTxt: { flex: 1, color: '#818CF8', fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  orTxt: { color: '#475569', fontSize: 11, fontFamily: 'Inter_500Medium' },
  googleG: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },

  version: { textAlign: 'center', color: '#1E2A40', fontSize: 9, fontFamily: 'Inter_400Regular' },
});
