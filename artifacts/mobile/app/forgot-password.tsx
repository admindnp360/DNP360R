import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { useAppData } from '@/contexts/AppContext';

type Tab = 'request' | 'check';

const STATUS_CONFIG = {
  pending: {
    icon: 'clock' as const,
    grad: ['#F59E0B', '#D97706'] as const,
    label: 'Pending Review',
    desc: 'Your request is being reviewed by the Nagar Parishad Admin. Please wait 1–2 working days.',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
  },
  approved: {
    icon: 'check-circle' as const,
    grad: ['#10B981', '#059669'] as const,
    label: 'Approved!',
    desc: 'Your password has been reset. The Admin will contact you with your temporary password via your registered mobile.',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
  },
  rejected: {
    icon: 'x-circle' as const,
    grad: ['#EF4444', '#DC2626'] as const,
    label: 'Request Rejected',
    desc: 'Your request was not approved. Please contact the Nagar Parishad office directly.',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
  },
};

export default function ForgotPasswordScreen() {
  const { addPasswordResetRequest, passwordResetRequests } = useAppData();
  const { showAlert } = useAlert();
  const [tab, setTab] = useState<Tab>('request');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [checkEmail, setCheckEmail] = useState('');
  const [checkedRequest, setCheckedRequest] = useState<typeof passwordResetRequests[0] | null | 'not_found'>(null);

  async function handleRequest() {
    if (!email.trim() || !name.trim()) {
      showAlert('Missing Fields', 'Please enter your registered email and full name.', undefined, 'warning');
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
      showAlert('Missing Email', 'Please enter your registered email.', undefined, 'warning');
      return;
    }
    const found = passwordResetRequests.find(r => r.email.toLowerCase() === checkEmail.trim().toLowerCase());
    setCheckedRequest(found ?? 'not_found');
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <LinearGradient colors={['#07002E', '#100840', '#0A1550']} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <LinearGradient colors={['rgba(245,158,11,0.3)', 'rgba(239,68,68,0.1)']} style={styles.backIconWrap}>
            <Feather name="arrow-left" size={16} color="#FBBF24" />
          </LinearGradient>
        </Pressable>
        <Text style={styles.topBarTitle}>Reset Password</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabRow}>
        {(['request', 'check'] as Tab[]).map(t => (
          <Pressable key={t} style={styles.tabBtnWrap} onPress={() => setTab(t)}>
            {tab === t
              ? <LinearGradient colors={t === 'request' ? ['#F59E0B', '#EF4444'] : ['#2563EB', '#6366F1']} style={styles.tabBtnActive}>
                  <Feather name={t === 'request' ? 'send' : 'search'} size={13} color="#fff" />
                  <Text style={styles.tabBtnTextActive}>{t === 'request' ? 'Submit Request' : 'Check Status'}</Text>
                </LinearGradient>
              : <View style={styles.tabBtnInactive}>
                  <Feather name={t === 'request' ? 'send' : 'search'} size={13} color="#4B5563" />
                  <Text style={styles.tabBtnText}>{t === 'request' ? 'Submit Request' : 'Check Status'}</Text>
                </View>
            }
          </Pressable>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {tab === 'request' ? (
            !submitted ? (
              <>
                {/* Hero icon */}
                <View style={styles.heroIconWrap}>
                  <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.heroIcon}>
                    <Feather name="unlock" size={30} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.sectionTitle}>Forgot your password?</Text>
                <Text style={styles.sectionSub}>
                  Submit a request and the Admin will contact you via your registered mobile number to reset your password.
                </Text>

                <View style={styles.card}>
                  <LinearGradient colors={['rgba(245,158,11,0.18)', 'transparent']} style={styles.cardGlow} />

                  <View style={styles.infoRow}>
                    <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.infoIcon}>
                      <Feather name="info" size={13} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.infoText}>
                      Your request will be reviewed by the Admin. You will be contacted via registered mobile within 1–2 working days.
                    </Text>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Full Name *</Text>
                    <View style={styles.inputWrap}>
                      <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.inputIcon}>
                        <Feather name="user" size={12} color="#fff" />
                      </LinearGradient>
                      <TextInput
                        style={styles.input}
                        placeholder="Your registered full name"
                        placeholderTextColor="#374151"
                        autoCapitalize="words"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Registered Email *</Text>
                    <View style={styles.inputWrap}>
                      <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.inputIcon}>
                        <Feather name="mail" size={12} color="#fff" />
                      </LinearGradient>
                      <TextInput
                        style={styles.input}
                        placeholder="your@email.com"
                        placeholderTextColor="#374151"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.btnWrap, loading && { opacity: 0.65 }]}
                    onPress={handleRequest}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['#F59E0B', '#EF4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                      <Feather name="send" size={15} color="#fff" />
                      <Text style={styles.btnTxt}>{loading ? 'Submitting…' : 'Request Password Reset'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.heroIconWrap}>
                  <LinearGradient colors={['#10B981', '#059669']} style={styles.heroIcon}>
                    <Feather name="check-circle" size={30} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.sectionTitle}>Request Submitted!</Text>
                <Text style={styles.sectionSub}>
                  The Admin has been notified and will contact you via your registered mobile number.
                </Text>

                <View style={styles.card}>
                  <LinearGradient colors={['rgba(16,185,129,0.18)', 'transparent']} style={styles.cardGlow} />
                  <View style={styles.successDetail}>
                    <Feather name="mail" size={14} color="#34D399" />
                    <Text style={styles.successDetailText}>{email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.btnWrap}
                    onPress={() => { setCheckEmail(email); setTab('check'); }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['#2563EB', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                      <Feather name="search" size={15} color="#fff" />
                      <Text style={styles.btnTxt}>Check Request Status</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnWrap}
                    onPress={() => router.replace('/login')}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']} style={[styles.btn, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }]}>
                      <Feather name="arrow-left" size={15} color="#9CA3AF" />
                      <Text style={[styles.btnTxt, { color: '#9CA3AF' }]}>Back to Login</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )
          ) : (
            <>
              <View style={styles.heroIconWrap}>
                <LinearGradient colors={['#2563EB', '#6366F1']} style={styles.heroIcon}>
                  <Feather name="search" size={30} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.sectionTitle}>Check Request Status</Text>
              <Text style={styles.sectionSub}>
                Enter your registered email to see the status of your password reset request.
              </Text>

              <View style={styles.card}>
                <LinearGradient colors={['rgba(37,99,235,0.18)', 'transparent']} style={styles.cardGlow} />

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Registered Email</Text>
                  <View style={styles.inputWrap}>
                    <LinearGradient colors={['#2563EB', '#6366F1']} style={styles.inputIcon}>
                      <Feather name="mail" size={12} color="#fff" />
                    </LinearGradient>
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor="#374151"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={checkEmail}
                      onChangeText={v => { setCheckEmail(v); setCheckedRequest(null); }}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.btnWrap} onPress={handleCheckStatus} activeOpacity={0.85}>
                  <LinearGradient colors={['#2563EB', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                    <Feather name="search" size={15} color="#fff" />
                    <Text style={styles.btnTxt}>Check Status</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {checkedRequest === 'not_found' && (
                <View style={styles.statusCard}>
                  <LinearGradient colors={['rgba(239,68,68,0.15)', 'transparent']} style={styles.cardGlow} />
                  <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.statusIconWrap}>
                    <Feather name="alert-circle" size={24} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.statusLabel}>No Request Found</Text>
                  <Text style={styles.statusDesc}>
                    No password reset request was found for this email. Please submit a new request.
                  </Text>
                </View>
              )}

              {checkedRequest && checkedRequest !== 'not_found' && (() => {
                const cfg = STATUS_CONFIG[checkedRequest.status];
                return (
                  <View style={[styles.statusCard, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
                    <LinearGradient colors={cfg.grad} style={styles.statusIconWrap}>
                      <Feather name={cfg.icon} size={24} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.statusLabel}>{cfg.label}</Text>
                    <Text style={styles.statusDesc}>{cfg.desc}</Text>
                    <View style={styles.statusMeta}>
                      <View style={styles.statusMetaRow}>
                        <Feather name="user" size={12} color="#6B7280" />
                        <Text style={styles.statusMetaText}>{checkedRequest.name}</Text>
                      </View>
                      <View style={styles.statusMetaRow}>
                        <Feather name="calendar" size={12} color="#6B7280" />
                        <Text style={styles.statusMetaText}>Submitted: {checkedRequest.requestedAt}</Text>
                      </View>
                    </View>
                    {checkedRequest.adminNote && (
                      <View style={styles.adminNote}>
                        <View style={styles.adminNoteHeader}>
                          <Feather name="message-square" size={12} color="#A5B4FC" />
                          <Text style={styles.adminNoteTitle}>Note from Admin</Text>
                        </View>
                        <Text style={styles.adminNoteText}>{checkedRequest.adminNote}</Text>
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
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 220, height: 220, backgroundColor: '#F59E0B0D', top: -40, right: -50 },
  orb2: { width: 160, height: 160, backgroundColor: '#6366F10D', bottom: 100, left: -40 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: {},
  backIconWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  topBarTitle: { color: '#FFFFFF', fontSize: 17, fontFamily: 'Inter_700Bold' },

  tabRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 4 },
  tabBtnWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  tabBtnActive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12 },
  tabBtnInactive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  tabBtnTextActive: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  tabBtnText: { color: '#4B5563', fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  inner: { padding: 20, gap: 14, paddingBottom: 60 },

  heroIconWrap: { alignSelf: 'center' },
  heroIcon: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  sectionTitle: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  sectionSub: { color: '#6B7280', fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },

  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18, gap: 14, overflow: 'hidden' },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 80, borderRadius: 22 },

  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  infoIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoText: { flex: 1, color: '#9CA3AF', fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },

  fieldGroup: { gap: 7 },
  fieldLabel: { color: '#6B7280', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 2 },
  inputIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 13 },

  btnWrap: { borderRadius: 14, overflow: 'hidden' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  btnTxt: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_700Bold' },

  successDetail: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' },
  successDetailText: { color: '#34D399', fontSize: 14, fontFamily: 'Inter_500Medium' },

  statusCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20, alignItems: 'center', gap: 12, overflow: 'hidden' },
  statusIconWrap: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statusLabel: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Inter_700Bold' },
  statusDesc: { color: '#9CA3AF', fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  statusMeta: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, alignSelf: 'stretch', gap: 8 },
  statusMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusMetaText: { color: '#6B7280', fontSize: 12, fontFamily: 'Inter_400Regular' },
  adminNote: { backgroundColor: 'rgba(165,180,252,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(165,180,252,0.2)', padding: 14, alignSelf: 'stretch', gap: 8 },
  adminNoteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminNoteTitle: { color: '#A5B4FC', fontSize: 12, fontFamily: 'Inter_700Bold' },
  adminNoteText: { color: '#C7D2FE', fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});
