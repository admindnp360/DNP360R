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
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';
import { useAppData } from '@/contexts/AppContext';

type Tab = 'request' | 'check' | 'reopen';

const TABS = [
  { key: 'request' as Tab, icon: 'unlock',     label: 'Reset',  fullLabel: 'Reset Password', colors: ['#F97316','#EF4444','#DC2626'] as const, glow: '#F9731640' },
  { key: 'check'   as Tab, icon: 'search',     label: 'Status', fullLabel: 'Check Status',   colors: ['#3B82F6','#6366F1','#4F46E5'] as const, glow: '#3B82F640' },
  { key: 'reopen'  as Tab, icon: 'refresh-cw', label: 'Reopen', fullLabel: 'Reopen Account', colors: ['#10B981','#06B6D4','#0891B2'] as const, glow: '#10B98140' },
] as const;

const STATUS_CFG = {
  pending:  { icon: 'clock'       as const, colors: ['#F59E0B','#D97706'] as const, label: 'Pending Review',    desc: 'Your request is under review. Please allow 1–2 working days.', glow: '#F59E0B' },
  approved: { icon: 'check-circle'as const, colors: ['#10B981','#059669'] as const, label: 'Approved ✓',        desc: 'Password has been reset. Admin will contact you via registered mobile.', glow: '#10B981' },
  rejected: { icon: 'x-circle'   as const, colors: ['#EF4444','#DC2626'] as const, label: 'Request Rejected',  desc: 'Not approved. Please visit the Nagar Parishad office directly.', glow: '#EF4444' },
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
  const [reopenEmail, setReopenEmail] = useState('');
  const [reopenMobile, setReopenMobile] = useState('');
  const [reopenName, setReopenName] = useState('');
  const [reopenLoading, setReopenLoading] = useState(false);
  const [reopenDone, setReopenDone] = useState(false);

  const activeTab = TABS.find(t => t.key === tab)!;

  async function handleRequest() {
    if (!email.trim() || !name.trim()) {
      showAlert('Missing Fields', 'Please enter your registered email and full name.', undefined, 'warning');
      return;
    }
    setLoading(true);
    try { await addPasswordResetRequest(email.trim().toLowerCase(), name.trim()); setSubmitted(true); }
    finally { setLoading(false); }
  }

  function handleCheckStatus() {
    if (!checkEmail.trim()) { showAlert('Missing Email', 'Please enter your registered email.', undefined, 'warning'); return; }
    const found = passwordResetRequests.find(r => r.email.toLowerCase() === checkEmail.trim().toLowerCase());
    setCheckedRequest(found ?? 'not_found');
  }

  async function handleReopenRequest() {
    if (!reopenEmail.trim() || !reopenName.trim()) {
      showAlert('Missing Fields', 'Please enter your name and registered email.', undefined, 'warning');
      return;
    }
    setReopenLoading(true);
    try {
      await addDoc(collection(db, 'reopenRequests'), {
        name: reopenName.trim(), email: reopenEmail.trim().toLowerCase(),
        mobile: reopenMobile.trim() || null, requestedAt: new Date().toISOString(), status: 'pending',
      });
      setReopenDone(true);
    } catch { showAlert('Error', 'Unable to submit. Please try again.', undefined, 'error'); }
    finally { setReopenLoading(false); }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <LinearGradient colors={['#04081A', '#080F28', '#0C1538']} style={StyleSheet.absoluteFill} />

      {/* Ambient glow orbs */}
      <View style={[s.orb, { backgroundColor: activeTab.glow, top: -60, right: -40, width: 260, height: 260 }]} />
      <View style={[s.orb, { backgroundColor: '#1E1B4B30', bottom: 60, left: -60, width: 200, height: 200 }]} />
      <View style={[s.orb, { backgroundColor: '#0C4A6E20', top: '45%', right: -80, width: 180, height: 180 }]} />

      {/* Top bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.backPressable}>
          <LinearGradient colors={['rgba(255,255,255,0.10)','rgba(255,255,255,0.04)']} style={s.backBtn}>
            <View style={s.backBevel} />
            <Feather name="arrow-left" size={18} color="#E2E8F0" />
          </LinearGradient>
        </Pressable>
        <Image source={require('../assets/images/dnp360-logo.png')} style={{ width: 100, height: 40, resizeMode: 'contain' }} />
        <View style={{ width: 44 }} />
      </View>

      {/* 3D Tab Bar */}
      <View style={s.tabContainer}>
        <LinearGradient colors={['rgba(255,255,255,0.06)','rgba(255,255,255,0.02)']} style={s.tabTrack}>
          <View style={s.tabTrackInner} />
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <Pressable key={t.key} style={s.tabItem} onPress={() => setTab(t.key)}>
                {active ? (
                  <View style={s.tabActiveWrap}>
                    <LinearGradient colors={t.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.tabActiveGrad}>
                      <View style={s.tabActiveBevelTop} />
                      <Feather name={t.icon as any} size={14} color="#fff" />
                      <Text style={s.tabActiveTxt}>{t.label}</Text>
                      <View style={s.tabActiveBevelBot} />
                    </LinearGradient>
                    <View style={[s.tabGlow, { shadowColor: t.colors[0] }]} />
                  </View>
                ) : (
                  <View style={s.tabInactiveWrap}>
                    <Feather name={t.icon as any} size={13} color="#374151" />
                    <Text style={s.tabInactiveTxt}>{t.label}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </LinearGradient>
      </View>

      {/* Content */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero icon with 3D effect */}
          <View style={s.heroSection}>
            <View style={[s.heroRingOuter, { borderColor: activeTab.glow }]}>
              <View style={s.heroRingInner}>
                <LinearGradient colors={activeTab.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroGrad}>
                  <View style={s.heroBevelTop} />
                  <Feather name={activeTab.icon as any} size={30} color="#fff" />
                  <View style={s.heroBevelBot} />
                </LinearGradient>
              </View>
            </View>
            <Text style={s.heroTitle}>{activeTab.fullLabel}</Text>
            <View style={[s.heroBadge, { borderColor: activeTab.glow, backgroundColor: activeTab.glow + '30' }]}>
              <View style={[s.heroBadgeDot, { backgroundColor: activeTab.colors[0] }]} />
              <Text style={[s.heroBadgeTxt, { color: activeTab.colors[0] }]}>
                {tab === 'request' ? 'Submit a reset request to Admin' : tab === 'check' ? 'Track your request status' : 'Restore a deleted account'}
              </Text>
            </View>
          </View>

          {/* ─── TAB: RESET PASSWORD ─── */}
          {tab === 'request' && !submitted && (
            <View style={s.glassCard}>
              <View style={s.cardBevelTop} />
              <Text style={s.cardHeading}>Enter Your Details</Text>

              <GlowInput icon="user" color="#F97316" placeholder="Your registered full name" value={name} onChangeText={setName} autoCapitalize="words" />
              <GlowInput icon="mail" color="#EF4444" placeholder="Registered email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

              <View style={[s.infoChip, { borderColor: '#F9731640', backgroundColor: '#F9731610' }]}>
                <Feather name="info" size={12} color="#FB923C" />
                <Text style={[s.infoChipTxt, { color: '#FB923C' }]}>Admin will contact you within 1–2 working days.</Text>
              </View>

              <Action3DButton colors={activeTab.colors} icon="send" label={loading ? 'Submitting…' : 'Request Password Reset'} onPress={handleRequest} loading={loading} />
              <View style={s.cardBevelBot} />
            </View>
          )}

          {tab === 'request' && submitted && (
            <SuccessPanel
              title="Request Sent!"
              sub={`Your request for ${email} has been submitted. The admin will contact you shortly.`}
              colors={['#10B981','#059669','#047857']}
              icon="check-circle"
              actions={[
                { label: 'Track My Request', icon: 'search', colors: ['#3B82F6','#6366F1','#4F46E5'], onPress: () => { setCheckEmail(email); setTab('check'); } },
                { label: 'Back to Login',    icon: 'arrow-left', colors: ['#374151','#1F2937','#111827'], onPress: () => router.replace('/login') },
              ]}
            />
          )}

          {/* ─── TAB: CHECK STATUS ─── */}
          {tab === 'check' && (
            <>
              <View style={s.glassCard}>
                <View style={s.cardBevelTop} />
                <Text style={s.cardHeading}>Look Up Your Request</Text>
                <GlowInput icon="mail" color="#3B82F6" placeholder="your@email.com" value={checkEmail} onChangeText={v => { setCheckEmail(v); setCheckedRequest(null); }} keyboardType="email-address" autoCapitalize="none" />
                <Action3DButton colors={activeTab.colors} icon="search" label="Check Status" onPress={handleCheckStatus} loading={false} />
                <View style={s.cardBevelBot} />
              </View>

              {checkedRequest === 'not_found' && (
                <StatusResultCard
                  icon="alert-circle"
                  colors={['#EF4444','#DC2626','#B91C1C']}
                  glow="#EF4444"
                  label="No Request Found"
                  desc="No password reset request found for this email. Please submit a new request."
                />
              )}

              {checkedRequest && checkedRequest !== 'not_found' && (() => {
                const cfg = STATUS_CFG[checkedRequest.status];
                return (
                  <StatusResultCard
                    icon={cfg.icon}
                    colors={[...cfg.colors, cfg.colors[1]] as any}
                    glow={cfg.glow}
                    label={cfg.label}
                    desc={cfg.desc}
                    meta={{ name: checkedRequest.name, date: checkedRequest.requestedAt }}
                    adminNote={checkedRequest.adminNote}
                  />
                );
              })()}
            </>
          )}

          {/* ─── TAB: REOPEN ACCOUNT ─── */}
          {tab === 'reopen' && !reopenDone && (
            <View style={s.glassCard}>
              <View style={s.cardBevelTop} />
              <Text style={s.cardHeading}>Restore Your Account</Text>

              <View style={[s.infoChip, { borderColor: '#10B98140', backgroundColor: '#10B98110' }]}>
                <Feather name="clock" size={12} color="#34D399" />
                <Text style={[s.infoChipTxt, { color: '#34D399' }]}>Account restoration is only possible within 48 hours of deletion.</Text>
              </View>

              <GlowInput icon="user"       color="#10B981" placeholder="Your registered full name"  value={reopenName}   onChangeText={setReopenName}   autoCapitalize="words" />
              <GlowInput icon="mail"       color="#06B6D4" placeholder="Registered email address"   value={reopenEmail}  onChangeText={setReopenEmail}  keyboardType="email-address" autoCapitalize="none" />
              <GlowInput icon="smartphone" color="#0891B2" placeholder="Mobile number (optional)"   value={reopenMobile} onChangeText={setReopenMobile} keyboardType="phone-pad" maxLength={10} />

              <Action3DButton colors={activeTab.colors} icon="refresh-cw" label={reopenLoading ? 'Submitting…' : 'Submit Reopen Request'} onPress={handleReopenRequest} loading={reopenLoading} />
              <View style={s.cardBevelBot} />
            </View>
          )}

          {tab === 'reopen' && reopenDone && (
            <SuccessPanel
              title="Request Submitted!"
              sub="Your account reopen request has been sent to the Super Admin. You will be contacted within 48 hours."
              colors={['#10B981','#06B6D4','#0891B2']}
              icon="user-check"
              actions={[
                { label: 'Back to Login', icon: 'arrow-left', colors: ['#374151','#1F2937','#111827'], onPress: () => router.replace('/login') },
              ]}
            />
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Sub-components ── */

function GlowInput({ icon, color, placeholder, value, onChangeText, keyboardType, autoCapitalize, maxLength }: {
  icon: any; color: string; placeholder: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; autoCapitalize?: any; maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.inputWrap, focused && { borderColor: color + '80', shadowColor: color, shadowOpacity: 0.35, shadowRadius: 10 }]}>
      <LinearGradient colors={[color + '22', color + '08']} style={s.inputIconBox}>
        <Feather name={icon} size={15} color={color} />
      </LinearGradient>
      <TextInput
        style={s.inputText}
        placeholder={placeholder}
        placeholderTextColor="#334155"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function Action3DButton({ colors, icon, label, onPress, loading }: {
  colors: readonly string[]; icon: any; label: string; onPress: () => void; loading: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.82} style={[s.actionBtnWrap, loading && { opacity: 0.6 }]}>
      <LinearGradient colors={[...colors] as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.actionBtn}>
        <View style={s.actionBtnBevel} />
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Feather name={icon} size={16} color="#fff" />}
        <Text style={s.actionBtnTxt}>{label}</Text>
        <View style={s.actionBtnBevelBot} />
      </LinearGradient>
      <View style={[s.actionBtnShadow, { shadowColor: colors[0] }]} />
    </TouchableOpacity>
  );
}

function SuccessPanel({ title, sub, colors, icon, actions }: {
  title: string; sub: string; colors: string[]; icon: any;
  actions: { label: string; icon: any; colors: string[]; onPress: () => void }[];
}) {
  return (
    <View style={s.successPanel}>
      <LinearGradient colors={colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.successIconWrap}>
        <View style={s.heroBevelTop} />
        <Feather name={icon} size={32} color="#fff" />
        <View style={s.heroBevelBot} />
      </LinearGradient>
      <Text style={s.successTitle}>{title}</Text>
      <Text style={s.successSub}>{sub}</Text>
      <View style={{ gap: 10, alignSelf: 'stretch' }}>
        {actions.map((a, i) => (
          <Action3DButton key={i} colors={a.colors as any} icon={a.icon} label={a.label} onPress={a.onPress} loading={false} />
        ))}
      </View>
    </View>
  );
}

function StatusResultCard({ icon, colors, glow, label, desc, meta, adminNote }: {
  icon: any; colors: string[]; glow: string; label: string; desc: string;
  meta?: { name: string; date: string }; adminNote?: string;
}) {
  return (
    <View style={[s.resultCard, { borderColor: glow + '50' }]}>
      <LinearGradient colors={[glow + '18', glow + '06']} style={StyleSheet.absoluteFill} />
      <View style={[s.resultGlow, { shadowColor: glow }]} />
      <LinearGradient colors={colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.resultIconWrap}>
        <View style={s.heroBevelTop} />
        <Feather name={icon} size={24} color="#fff" />
        <View style={s.heroBevelBot} />
      </LinearGradient>
      <Text style={s.resultLabel}>{label}</Text>
      <Text style={s.resultDesc}>{desc}</Text>
      {meta && (
        <View style={s.resultMeta}>
          <View style={s.metaRow}><Feather name="user" size={11} color="#64748B" /><Text style={s.metaTxt}>{meta.name}</Text></View>
          <View style={s.metaRow}><Feather name="calendar" size={11} color="#64748B" /><Text style={s.metaTxt}>{meta.date}</Text></View>
        </View>
      )}
      {adminNote && (
        <View style={s.adminNote}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="message-square" size={11} color="#A5B4FC" />
            <Text style={{ color: '#A5B4FC', fontSize: 11, fontFamily: 'Inter_700Bold' }}>Admin Note</Text>
          </View>
          <Text style={{ color: '#C7D2FE', fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 }}>{adminNote}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.6 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 },
  backPressable: {},
  backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  backBevel: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 14 },

  tabContainer: { marginHorizontal: 16, marginBottom: 6 },
  tabTrack: {
    flexDirection: 'row', borderRadius: 18, padding: 5, gap: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderTopColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  tabTrackInner: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 18 },
  tabItem: { flex: 1 },
  tabActiveWrap: { position: 'relative' },
  tabActiveGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 6,
  },
  tabActiveBevelTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 14 },
  tabActiveBevelBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14 },
  tabGlow: { position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, borderRadius: 14, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 0 },
  tabActiveTxt: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  tabInactiveWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12, borderRadius: 14 },
  tabInactiveTxt: { color: '#374151', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  scroll: { paddingHorizontal: 18, paddingBottom: 60, gap: 18 },

  heroSection: { alignItems: 'center', gap: 10, paddingTop: 8 },
  heroRingOuter: { width: 112, height: 112, borderRadius: 32, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  heroRingInner: { width: 90, height: 90, borderRadius: 26, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 12 },
  heroGrad: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  heroBevelTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 26 },
  heroBevelBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 26 },
  heroTitle: { color: '#F1F5F9', fontSize: 22, fontFamily: 'Inter_700Bold' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeTxt: { fontSize: 11, fontFamily: 'Inter_500Medium' },

  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderTopColor: 'rgba(255,255,255,0.20)',
    padding: 18, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
  },
  cardBevelTop: { position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 24 },
  cardBevelBot: { position: 'absolute', bottom: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 24 },
  cardHeading: { color: '#CBD5E1', fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 15, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderTopColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  inputIconBox: { width: 46, height: 50, justifyContent: 'center', alignItems: 'center' },
  inputText: { flex: 1, color: '#E2E8F0', fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 14, paddingRight: 14 },

  infoChip: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 13, borderWidth: 1 },
  infoChipTxt: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  actionBtnWrap: { borderRadius: 16, overflow: 'visible' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    paddingVertical: 16, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderTopColor: 'rgba(255,255,255,0.35)',
  },
  actionBtnBevel: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16 },
  actionBtnBevelBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 16 },
  actionBtnShadow: { position: 'absolute', top: 4, left: 4, right: 4, bottom: -4, borderRadius: 16, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 0, zIndex: -1 },
  actionBtnTxt: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

  successPanel: {
    alignItems: 'center', gap: 14, padding: 24,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderTopColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  successIconWrap: { width: 96, height: 96, borderRadius: 28, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  successTitle: { color: '#F1F5F9', fontSize: 22, fontFamily: 'Inter_700Bold' },
  successSub: { color: '#475569', fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },

  resultCard: {
    borderRadius: 22, borderWidth: 1, padding: 20, alignItems: 'center', gap: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  resultGlow: { position: 'absolute', top: -10, left: -10, right: -10, bottom: -10, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 0 },
  resultIconWrap: { width: 70, height: 70, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  resultLabel: { color: '#F1F5F9', fontSize: 18, fontFamily: 'Inter_700Bold' },
  resultDesc: { color: '#94A3B8', fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },
  resultMeta: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 13, padding: 12, alignSelf: 'stretch', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaTxt: { color: '#64748B', fontSize: 12, fontFamily: 'Inter_400Regular' },
  adminNote: { backgroundColor: 'rgba(165,180,252,0.08)', borderRadius: 13, borderWidth: 1, borderColor: 'rgba(165,180,252,0.2)', padding: 13, alignSelf: 'stretch', gap: 8 },
});
