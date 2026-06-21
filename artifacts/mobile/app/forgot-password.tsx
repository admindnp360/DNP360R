import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const { addPasswordResetRequest } = useAppData();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRequest() {
    if (!email.trim() || !name.trim()) {
      Alert.alert('Missing fields', 'Please enter your registered email and full name.');
      return;
    }
    setLoading(true);
    try {
      await addPasswordResetRequest(email.trim().toLowerCase(), name.trim());
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Reset Password</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.inner}>
          <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
            <Feather name="lock" size={32} color={colors.primary} />
          </View>

          {!submitted ? (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                Citizens cannot reset passwords via email. Submit a request and the Admin will contact you to reset your password securely.
              </Text>

              <View style={[styles.infoBox, { backgroundColor: colors.citizenBg, borderColor: '#005AB630' }]}>
                <Feather name="info" size={15} color={colors.citizen} />
                <Text style={[styles.infoText, { color: colors.citizen }]}>
                  Your request will be reviewed by the Nagar Parishad Admin. You will be contacted via registered mobile number.
                </Text>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Your registered name"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Registered Email *</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="mail" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity
                style={[styles.requestBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
                onPress={handleRequest}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.requestBtnText}>{loading ? 'Submitting…' : 'Request Admin to Reset Password'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.backToLogin, { borderColor: colors.border }]} onPress={() => router.back()} activeOpacity={0.8}>
                <Text style={[styles.backToLoginText, { color: colors.mutedForeground }]}>Back to Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.successCard, { backgroundColor: colors.resolvedBg, borderColor: colors.resolved + '60' }]}>
              <View style={styles.successIcon}>
                <Feather name="check-circle" size={44} color={colors.resolved} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Request Submitted!</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                Your password reset request has been sent to the Nagar Parishad Admin.{'\n\n'}
                The Admin will contact you on your registered mobile number within 1-2 working days.
              </Text>
              <View style={[styles.refBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="mail" size={13} color={colors.mutedForeground} />
                <Text style={[styles.refText, { color: colors.mutedForeground }]}>{email}</Text>
              </View>
              <TouchableOpacity style={[styles.requestBtn, { backgroundColor: colors.primary, marginTop: 8 }]} onPress={() => router.replace('/login')} activeOpacity={0.85}>
                <Text style={styles.requestBtnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  topBarTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  inner: { flex: 1, padding: 24, gap: 14 },
  iconWrap: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  sub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  infoBox: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: -6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 14 },
  requestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15 },
  requestBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  backToLogin: { borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1 },
  backToLoginText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  successCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', gap: 12 },
  successIcon: { marginBottom: 4 },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  successSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  refBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'stretch', justifyContent: 'center' },
  refText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
