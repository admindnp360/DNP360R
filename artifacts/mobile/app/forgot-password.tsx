import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!email.trim()) { Alert.alert('Enter email', 'Please enter your registered email.'); return; }
    setSent(true);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.wrap, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
          <Feather name="lock" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Enter your registered email address and we'll send you a reset link.
        </Text>

        {!sent ? (
          <>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="mail" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email Address"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleSend} activeOpacity={0.85}>
              <Text style={styles.btnText}>Send Reset Link</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={[styles.successBox, { backgroundColor: colors.resolvedBg ?? colors.surface, borderColor: colors.resolved ?? colors.primary }]}>
            <Feather name="check-circle" size={24} color={colors.resolved ?? colors.primary} />
            <Text style={[styles.successTitle, { color: colors.text }]}>Email Sent!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>Check your inbox for the password reset link.</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={() => router.back()} activeOpacity={0.85}>
              <Text style={styles.btnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  inner: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  iconWrap: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  sub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 14 },
  btn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  successBox: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8 },
  successTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  successSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },
});
