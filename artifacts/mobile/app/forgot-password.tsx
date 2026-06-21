import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

type Tab = 'request' | 'check';

const STATUS_CONFIG = {
  pending: {
    icon: 'clock' as const,
    color: '#D97706',
    bg: '#FEF3C7',
    label: 'Pending Review',
    desc: 'Your request is being reviewed by the Nagar Parishad Admin. Please wait 1-2 working days.',
  },
  approved: {
    icon: 'check-circle' as const,
    color: '#059669',
    bg: '#D1FAE5',
    label: 'Approved',
    desc: 'Your password reset has been approved! The Admin will contact you on your registered mobile number.',
  },
  rejected: {
    icon: 'x-circle' as const,
    color: '#DC2626',
    bg: '#FEE2E2',
    label: 'Rejected',
    desc: 'Your request was not approved. Please contact the Nagar Parishad office directly.',
  },
};

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const { addPasswordResetRequest, passwordResetRequests } = useAppData();
  const [tab, setTab] = useState<Tab>('request');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [checkEmail, setCheckEmail] = useState('');
  const [checkedRequest, setCheckedRequest] = useState<typeof passwordResetRequests[0] | null | 'not_found'>(null);

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

  function handleCheckStatus() {
    if (!checkEmail.trim()) {
      Alert.alert('Missing email', 'Please enter your registered email.');
      return;
    }
    const found = passwordResetRequests.find(r => r.email.toLowerCase() === checkEmail.trim().toLowerCase());
    setCheckedRequest(found ?? 'not_found');
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

        <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(['request', 'check'] as Tab[]).map(t => (
            <Pressable
              key={t}
              style={[styles.tabItem, tab === t && { backgroundColor: colors.primary }]}
              onPress={() => setTab(t)}
            >
              <Feather
                name={t === 'request' ? 'send' : 'search'}
                size={13}
                color={tab === t ? '#fff' : colors.mutedForeground}
              />
              <Text style={[styles.tabText, { color: tab === t ? '#fff' : colors.mutedForeground }]}>
                {t === 'request' ? 'Submit Request' : 'Check Status'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
            <Feather name={tab === 'request' ? 'lock' : 'search'} size={32} color={colors.primary} />
          </View>

          {tab === 'request' ? (
            !submitted ? (
              <>
                <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                  Submit a request and the Admin will contact you on your registered mobile to reset your password.
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
              </>
            ) : (
              <View style={[styles.successCard, { backgroundColor: '#D1FAE5', borderColor: '#05966960' }]}>
                <View style={styles.successIcon}>
                  <Feather name="check-circle" size={44} color="#059669" />
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
                <TouchableOpacity
                  style={styles.checkStatusLink}
                  onPress={() => { setCheckEmail(email); setTab('check'); }}
                  activeOpacity={0.8}
                >
                  <Feather name="search" size={13} color={colors.primary} />
                  <Text style={[styles.checkStatusLinkText, { color: colors.primary }]}>Check Request Status</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.requestBtn, { backgroundColor: colors.primary, marginTop: 4 }]}
                  onPress={() => router.replace('/login')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.requestBtnText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Check Request Status</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                Enter your registered email to check the status of your password reset request.
              </Text>

              <Text style={[styles.label, { color: colors.text }]}>Registered Email</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="mail" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={checkEmail}
                  onChangeText={v => { setCheckEmail(v); setCheckedRequest(null); }}
                />
              </View>

              <TouchableOpacity
                style={[styles.requestBtn, { backgroundColor: colors.primary }]}
                onPress={handleCheckStatus}
                activeOpacity={0.85}
              >
                <Feather name="search" size={16} color="#fff" />
                <Text style={styles.requestBtnText}>Check Status</Text>
              </TouchableOpacity>

              {checkedRequest === 'not_found' && (
                <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="alert-circle" size={28} color={colors.mutedForeground} />
                  <Text style={[styles.statusLabel, { color: colors.text }]}>No Request Found</Text>
                  <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>
                    No password reset request was found for this email. Please submit a new request.
                  </Text>
                </View>
              )}

              {checkedRequest && checkedRequest !== 'not_found' && (() => {
                const cfg = STATUS_CONFIG[checkedRequest.status];
                return (
                  <View style={[styles.statusCard, { backgroundColor: cfg.bg, borderColor: cfg.color + '50' }]}>
                    <Feather name={cfg.icon} size={36} color={cfg.color} />
                    <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    <Text style={[styles.statusDesc, { color: colors.text }]}>{cfg.desc}</Text>

                    <View style={[styles.statusMeta, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.statusMetaRow}>
                        <Feather name="user" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.statusMetaText, { color: colors.mutedForeground }]}>{checkedRequest.name}</Text>
                      </View>
                      <View style={styles.statusMetaRow}>
                        <Feather name="calendar" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.statusMetaText, { color: colors.mutedForeground }]}>Submitted: {checkedRequest.requestedAt}</Text>
                      </View>
                    </View>

                    {checkedRequest.adminNote && (
                      <View style={[styles.adminNoteBox, { backgroundColor: '#fff', borderColor: cfg.color + '40' }]}>
                        <View style={styles.adminNoteHeader}>
                          <Feather name="message-square" size={13} color={cfg.color} />
                          <Text style={[styles.adminNoteTitle, { color: cfg.color }]}>Note from Admin</Text>
                        </View>
                        <Text style={[styles.adminNoteText, { color: colors.text }]}>{checkedRequest.adminNote}</Text>
                      </View>
                    )}
                  </View>
                );
              })()}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  topBarTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9 },
  tabText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  inner: { padding: 24, gap: 14, paddingBottom: 60 },
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
  successCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', gap: 12 },
  successIcon: { marginBottom: 4 },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  successSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  refBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'stretch', justifyContent: 'center' },
  refText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  checkStatusLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkStatusLinkText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  statusCard: { borderRadius: 18, borderWidth: 1, padding: 20, alignItems: 'center', gap: 10 },
  statusLabel: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statusDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  statusMeta: { borderRadius: 12, borderWidth: 1, padding: 12, alignSelf: 'stretch', gap: 6 },
  statusMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusMetaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  adminNoteBox: { borderRadius: 12, borderWidth: 1, padding: 14, alignSelf: 'stretch', gap: 8 },
  adminNoteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminNoteTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  adminNoteText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});
