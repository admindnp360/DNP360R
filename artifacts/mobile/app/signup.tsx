import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DNP360Logo } from '@/components/DNP360Logo';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !mobile.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in Name, Email, Mobile, and Password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please re-enter.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const result = await register(name.trim(), email.trim(), mobile.trim(), password, address.trim() || undefined);
      if (!result.success) {
        Alert.alert('Registration Failed', result.error ?? 'Unable to create account.');
      } else {
        router.replace('/(tabs)');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#031331', '#0D2350', '#031331']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Feather name="arrow-left" size={20} color="#8AB0D8" />
              <Text style={styles.backText}>Sign In</Text>
            </Pressable>
          </View>

          <View style={styles.header}>
            <View style={styles.logoShield}>
              <View style={styles.shieldInner}><DNP360Logo size="md" /></View>
            </View>
            <Text style={styles.tagline}>Create Citizen Account</Text>
            <Text style={styles.subtitle}>Register to access DNP360 services</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Citizen Registration</Text>
            <Text style={styles.cardSub}>Fill in your details to create your account</Text>

            <View style={styles.labeledInput}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <View style={styles.inputWrap}>
                <Feather name="user" size={16} color="#8A9BB0" />
                <TextInput style={styles.input} placeholder="Your full name" placeholderTextColor="#8A9BB0" value={name} onChangeText={setName} autoCapitalize="words" />
              </View>
            </View>

            <View style={styles.labeledInput}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <View style={styles.inputWrap}>
                <Feather name="mail" size={16} color="#8A9BB0" />
                <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#8A9BB0" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              </View>
            </View>

            <View style={styles.labeledInput}>
              <Text style={styles.inputLabel}>Mobile Number *</Text>
              <View style={styles.inputWrap}>
                <Feather name="smartphone" size={16} color="#8A9BB0" />
                <TextInput style={styles.input} placeholder="10-digit mobile number" placeholderTextColor="#8A9BB0" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} maxLength={10} />
              </View>
            </View>

            <View style={styles.labeledInput}>
              <Text style={styles.inputLabel}>Address (optional)</Text>
              <View style={styles.inputWrap}>
                <Feather name="map-pin" size={16} color="#8A9BB0" />
                <TextInput style={styles.input} placeholder="Ward / Area, Daudnagar" placeholderTextColor="#8A9BB0" value={address} onChangeText={setAddress} />
              </View>
            </View>

            <View style={styles.labeledInput}>
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.inputWrap}>
                <Feather name="lock" size={16} color="#8A9BB0" />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min. 6 characters" placeholderTextColor="#8A9BB0" secureTextEntry={!showPw} value={password} onChangeText={setPassword} />
                <Pressable onPress={() => setShowPw(!showPw)} style={{ padding: 6 }}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={16} color="#8A9BB0" />
                </Pressable>
              </View>
            </View>

            <View style={styles.labeledInput}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <View style={[styles.inputWrap, confirmPassword && confirmPassword !== password && { borderColor: '#FF6B6B' }]}>
                <Feather name="lock" size={16} color={confirmPassword && confirmPassword !== password ? '#FF6B6B' : '#8A9BB0'} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Re-enter password" placeholderTextColor="#8A9BB0" secureTextEntry={!showCPw} value={confirmPassword} onChangeText={setConfirmPassword} />
                <Pressable onPress={() => setShowCPw(!showCPw)} style={{ padding: 6 }}>
                  <Feather name={showCPw ? 'eye-off' : 'eye'} size={16} color="#8A9BB0" />
                </Pressable>
              </View>
              {confirmPassword && confirmPassword !== password && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>

            <TouchableOpacity style={[styles.registerBtn, loading && { opacity: 0.6 }]} onPress={handleSignUp} disabled={loading} activeOpacity={0.85}>
              <Feather name="user-check" size={16} color="#fff" />
              <Text style={styles.registerBtnText}>{loading ? 'Creating Account…' : 'Create Account'}</Text>
            </TouchableOpacity>

            <View style={styles.noteBox}>
              <Feather name="info" size={13} color="#5F8BC0" />
              <Text style={styles.noteText}>
                Only Citizens can self-register. Safai Karmis and Officials receive secret codes from the Admin.
              </Text>
            </View>
          </View>

          <Text style={styles.version}>DNP360 v1.0 · Bihar, India</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 52 },
  topBar: { marginBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: '#8AB0D8', fontSize: 14, fontFamily: 'Inter_500Medium' },
  header: { alignItems: 'center', marginBottom: 24 },
  logoShield: { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(0,90,182,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,90,182,0.4)' },
  shieldInner: { width: 58, height: 58, borderRadius: 14, backgroundColor: 'rgba(0,90,182,0.4)', justifyContent: 'center', alignItems: 'center' },
  tagline: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Inter_700Bold' },
  subtitle: { color: '#8AB0D8', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 24, marginBottom: 24 },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  cardSub: { color: '#8AB0D8', fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 20 },
  labeledInput: { marginBottom: 14 },
  inputLabel: { color: '#8AB0D8', fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 13 },
  errorText: { color: '#FF6B6B', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  registerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#005AB6', borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  registerBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  noteBox: { flexDirection: 'row', gap: 8, marginTop: 16, backgroundColor: 'rgba(0,90,182,0.12)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(0,90,182,0.25)' },
  noteText: { flex: 1, color: '#8AB0D8', fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  version: { textAlign: 'center', color: '#3D5E82', fontSize: 10, fontFamily: 'Inter_400Regular' },
});
