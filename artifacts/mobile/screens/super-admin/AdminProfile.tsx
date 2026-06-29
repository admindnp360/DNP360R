import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated, Image, Modal, Pressable, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/contexts/AlertContext';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

// ── Design tokens ──────────────────────────────────────────────────────
const BG       = '#04071A';
const SURFACE  = 'rgba(255,255,255,0.042)';
const SURFACE2 = 'rgba(255,255,255,0.075)';
const BORDER   = 'rgba(255,255,255,0.09)';
const BORDER2  = 'rgba(255,255,255,0.15)';
const SHINE    = 'rgba(255,255,255,0.06)';
const TEXT     = '#EEF2FF';
const MUTED    = 'rgba(238,242,255,0.45)';
const MUTED2   = 'rgba(238,242,255,0.22)';

const VIOLET   = '#7C3AED';
const INDIGO   = '#6366F1';
const INDIGO_L = '#818CF8';
const CYAN     = '#22D3EE';
const GREEN    = '#10B981';
const GREEN_L  = '#34D399';
const AMBER    = '#F59E0B';
const AMBER_L  = '#FCD34D';
const PINK     = '#EC4899';
const RED      = '#EF4444';
const RED_L    = '#FB7185';

// ── 3-D card helper ────────────────────────────────────────────────────
function GlassCard({ children, style, accent }: { children: React.ReactNode; style?: any; accent?: string }) {
  return (
    <View style={[gc.wrap, style]}>
      {/* depth shadow tint */}
      <LinearGradient
        colors={accent
          ? [accent + '18', accent + '06', 'transparent']
          : ['rgba(99,102,241,0.10)', 'rgba(6,182,212,0.04)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      {/* top shine highlight — 3-D bevel */}
      <View style={gc.shine} />
      {children}
    </View>
  );
}
const gc = StyleSheet.create({
  wrap:  { backgroundColor: SURFACE, borderRadius: 22, borderWidth: 1, borderColor: BORDER2, overflow: 'hidden' },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: SHINE },
});

// ── Stat tile ──────────────────────────────────────────────────────────
function StatTile({ icon, label, value, grad, accent }: { icon: string; label: string; value: number; grad: readonly [string, string]; accent: string }) {
  return (
    <View style={[st.tile, { borderColor: accent + '30' }]}>
      <LinearGradient colors={[accent + '22', accent + '07']} style={StyleSheet.absoluteFill} />
      <View style={st.shine} />
      <LinearGradient colors={grad} style={st.icon}>
        <Feather name={icon as any} size={14} color="#fff" />
      </LinearGradient>
      <Text style={[st.val, { color: accent }]}>{value}</Text>
      <Text style={st.lbl}>{label}</Text>
    </View>
  );
}
const st = StyleSheet.create({
  tile:  { width: '30%', flexGrow: 1, borderRadius: 18, borderWidth: 1, padding: 12, alignItems: 'center', gap: 6, overflow: 'hidden' },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.09)' },
  icon:  { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  val:   { fontSize: 22, fontFamily: 'Inter_700Bold' },
  lbl:   { color: MUTED, fontSize: 9, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
});

// ── Row item ───────────────────────────────────────────────────────────
function ListRow({ icon, label, sub, value, grad, accent, onPress, last }: any) {
  const Wrap: any = onPress ? TouchableOpacity : View;
  return (
    <Wrap onPress={onPress} activeOpacity={0.72} style={[lr.row, !last && lr.div]}>
      <LinearGradient colors={grad ?? [accent + '33', accent + '11']} style={lr.icon}>
        <Feather name={icon as any} size={14} color={grad ? '#fff' : accent} />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        {sub ? <Text style={lr.sub}>{sub}</Text> : null}
        <Text style={lr.label} numberOfLines={1}>{label}</Text>
      </View>
      {value !== undefined && <Text style={[lr.val, { color: accent }]}>{value}</Text>}
      {onPress && <Feather name="chevron-right" size={14} color={MUTED2} />}
    </Wrap>
  );
}
const lr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 14 },
  div:   { borderBottomWidth: 1, borderBottomColor: BORDER },
  icon:  { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  label: { color: TEXT, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sub:   { color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 1 },
  val:   { fontSize: 16, fontFamily: 'Inter_700Bold', marginRight: 4 },
});

// ── Section header ─────────────────────────────────────────────────────
function SectionHead({ label, icon, grad }: { label: string; icon: string; grad: readonly [string, string] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <LinearGradient colors={grad} style={sh.icon}>
        <Feather name={icon as any} size={13} color="#fff" />
      </LinearGradient>
      <Text style={sh.label}>{label}</Text>
      <View style={sh.line} />
    </View>
  );
}
const sh = StyleSheet.create({
  icon:  { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  label: { color: TEXT, fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  line:  { flex: 1, height: 1, backgroundColor: BORDER },
});

// ── Modal field ────────────────────────────────────────────────────────
function MField({ label, icon, value, set, secure, show, setShow, ph, num, cap, accent }: any) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={mf.lbl}>{label}</Text>
      <View style={[mf.wrap, { borderColor: accent ? accent + '50' : BORDER2 }]}>
        <Feather name={icon} size={16} color={accent ?? INDIGO_L} />
        <TextInput
          style={mf.input}
          value={value}
          onChangeText={set}
          secureTextEntry={secure && !show}
          placeholder={ph}
          placeholderTextColor={MUTED2}
          autoCapitalize={cap ?? 'none'}
          keyboardType={num ? 'phone-pad' : 'default'}
        />
        {setShow && (
          <Pressable onPress={() => setShow((v: boolean) => !v)} hitSlop={8}>
            <Feather name={show ? 'eye-off' : 'eye'} size={14} color={MUTED} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
const mf = StyleSheet.create({
  lbl:   { color: TEXT, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, backgroundColor: SURFACE2, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 13, color: TEXT },
});

// ══════════════════════════════════════════════════════════════════════
export default function AdminProfile() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { showAlert } = useAlert();
  const {
    users, complaints, notices, wards, houses, secretKeys,
    supportDetails, updateSupportDetails, passwordResetRequests,
  } = useAppData();

  const [showEdit,    setShowEdit]    = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showPw,      setShowPw]      = useState(false);
  const [notif,       setNotif]       = useState(true);

  const [editName,   setEditName]   = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAddr,   setEditAddr]   = useState('');
  const [editPhoto,  setEditPhoto]  = useState<string | undefined>();
  const [savingP,    setSavingP]    = useState(false);

  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddr,  setSupAddr]  = useState('');
  const [supHours, setSupHours] = useState('');
  const [savingSup, setSavingSup] = useState(false);

  const [curPw,     setCurPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [conPw,     setConPw]     = useState('');
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showCon,   setShowCon]   = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  if (!user) return null;

  const totalUsers    = users.length;
  const citizens      = users.filter(u => u.role === 'citizen').length;
  const workers       = users.filter(u => u.role === 'safaikarmi').length;
  const officials     = users.filter(u => u.role === 'official').length;
  const resolved      = complaints.filter(c => c.status === 'resolved').length;
  const pending       = complaints.filter(c => c.status === 'submitted' || c.status === 'assigned').length;
  const rate          = complaints.length > 0 ? Math.round((resolved / complaints.length) * 100) : 0;
  const activeHouses  = houses.filter(h => h.isActive).length;
  const activeNotices = notices.filter(n => n.isActive).length;
  const pendingResets = passwordResetRequests.filter(r => r.status === 'pending').length;
  const activeKeys    = secretKeys.filter(k => k.isActive).length;
  const photoUri      = editPhoto ?? user.avatar ?? (user as any).photo;

  function openEdit() {
    setEditName(user!.name);
    setEditMobile(user!.mobile ?? '');
    setEditAddr((user as any).address ?? '');
    setEditPhoto(undefined);
    setShowEdit(true);
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showAlert('Permission', 'Gallery access needed.', undefined, 'warning'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.75 });
    if (!r.canceled && r.assets[0]) setEditPhoto(r.assets[0].uri);
  }

  async function saveProfile() {
    if (!editName.trim()) { showAlert('Missing', 'Name cannot be empty.', undefined, 'warning'); return; }
    setSavingP(true);
    try {
      await updateProfile({ name: editName.trim(), mobile: editMobile.trim() || undefined, ...(editAddr ? { address: editAddr.trim() } : {}), ...(editPhoto ? { avatar: editPhoto } : {}) });
      setShowEdit(false);
      showAlert('Saved', 'Profile updated successfully.', undefined, 'success');
    } finally { setSavingP(false); }
  }

  function openSupport() {
    setSupPhone(supportDetails.phone); setSupEmail(supportDetails.email);
    setSupAddr(supportDetails.address); setSupHours(supportDetails.hours);
    setShowSupport(true);
  }

  async function saveSupport() {
    setSavingSup(true);
    try {
      await updateSupportDetails({ phone: supPhone.trim(), email: supEmail.trim(), address: supAddr.trim(), hours: supHours.trim() });
      setShowSupport(false);
      showAlert('Saved', 'Support details updated.', undefined, 'success');
    } finally { setSavingSup(false); }
  }

  function openPw() {
    setCurPw(''); setNewPw(''); setConPw('');
    setShowCur(false); setShowNew(false); setShowCon(false);
    setShowPw(true);
  }

  async function savePw() {
    if (!curPw || !newPw || !conPw) { showAlert('Missing', 'Fill all fields.', undefined, 'warning'); return; }
    if (newPw !== conPw) { showAlert('Mismatch', 'Passwords do not match.', undefined, 'warning'); return; }
    setChangingPw(true);
    try {
      const res = await changePassword(curPw, newPw);
      if (res.success) { setShowPw(false); showAlert('Done', 'Password updated.', undefined, 'success'); }
      else showAlert('Error', res.error ?? 'Failed.', undefined, 'error');
    } finally { setChangingPw(false); }
  }

  async function handleLogout() {
    showAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ], 'warning');
  }

  const pwStrength = newPw.length === 0 ? null
    : newPw.length < 4 ? { label: 'Weak',   color: RED_L,   bars: 1 }
    : newPw.length < 6 ? { label: 'Fair',   color: AMBER_L, bars: 2 }
    : newPw.length < 8 ? { label: 'Good',   color: CYAN,    bars: 3 }
    :                    { label: 'Strong',  color: GREEN_L, bars: 4 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ══ HERO PROFILE HEADER ══ */}
        <View style={hero.wrap}>
          {/* Multi-layer background */}
          <LinearGradient
            colors={['#0D0A2E', '#130D3A', '#04071A']}
            style={StyleSheet.absoluteFill}
          />
          {/* Grid texture overlay */}
          <View style={hero.grid} />
          {/* Glow orbs */}
          <View style={[hero.orb, { backgroundColor: VIOLET + '30', top: -40, right: -40, width: 200, height: 200 }]} />
          <View style={[hero.orb, { backgroundColor: CYAN + '18',   bottom: 0,  left: -60, width: 180, height: 180 }]} />

          {/* Avatar */}
          <View style={{ alignItems: 'center', paddingTop: 28 }}>
            <TouchableOpacity onPress={openEdit} activeOpacity={0.85} style={hero.avatarWrap}>
              {/* Triple ring */}
              <LinearGradient colors={[VIOLET, INDIGO, CYAN]} style={hero.ring3} />
              <LinearGradient colors={[INDIGO, CYAN, GREEN_L]} style={hero.ring2} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} />
              <View style={hero.ringGap} />
              <View style={hero.avatarInner}>
                {photoUri
                  ? <Image source={{ uri: photoUri }} style={hero.avatarImg} />
                  : (
                    <LinearGradient colors={[VIOLET, INDIGO, PINK]} style={hero.avatarImg}>
                      <Text style={hero.avatarLetter}>{user.name[0].toUpperCase()}</Text>
                    </LinearGradient>
                  )
                }
              </View>
              {/* Online pip */}
              <View style={hero.onlinePip} />
              {/* Edit badge */}
              <View style={hero.editBadge}>
                <Feather name="edit-2" size={10} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Name */}
            <View style={{ alignItems: 'center', marginTop: 14, gap: 5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={hero.name}>{user.name}</Text>
                <LinearGradient colors={[VIOLET, INDIGO]} style={hero.saBadge}>
                  <Feather name="shield" size={9} color="#fff" />
                  <Text style={hero.saTxt}>SUPER ADMIN</Text>
                </LinearGradient>
              </View>
              <Text style={hero.email}>{user.email}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={hero.pip} />
                <Text style={hero.status}>Online · Full System Access</Text>
                {pendingResets > 0 && (
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/tertiary?tab=resets' as any)}
                    style={hero.resetPill}
                    activeOpacity={0.8}
                  >
                    <Text style={hero.resetTxt}>⚠ {pendingResets} reset{pendingResets > 1 ? 's' : ''}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Resolution bar */}
            <View style={hero.rateWrap}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: MUTED, fontSize: 11, fontFamily: 'Inter_500Medium' }}>Complaint Resolution Rate</Text>
                <Text style={{ color: rate >= 60 ? GREEN_L : AMBER_L, fontSize: 12, fontFamily: 'Inter_700Bold' }}>{rate}%</Text>
              </View>
              <View style={hero.rateTrack}>
                <LinearGradient
                  colors={rate >= 60 ? [GREEN, CYAN] : [AMBER, '#F97316']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[hero.rateFill, { width: `${Math.max(rate, 2)}%` as any }]}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={{ padding: 16, gap: 18 }}>

          {/* ══ LIVE STATS ══ */}
          <View>
            <SectionHead label="Live Statistics" icon="bar-chart-2" grad={[VIOLET, INDIGO]} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              <StatTile icon="users"        label="Total Users"  value={totalUsers}    grad={[VIOLET,  INDIGO]}   accent={INDIGO_L} />
              <StatTile icon="user"         label="Citizens"     value={citizens}      grad={['#0EA5E9','#2563EB']} accent={CYAN}    />
              <StatTile icon="trash-2"      label="Workers"      value={workers}       grad={[GREEN,   '#059669']} accent={GREEN_L} />
              <StatTile icon="briefcase"    label="Officials"    value={officials}     grad={[AMBER,   '#D97706']} accent={AMBER_L} />
              <StatTile icon="check-circle" label="Resolved"     value={resolved}      grad={[GREEN,   CYAN]}     accent={GREEN_L} />
              <StatTile icon="alert-circle" label="Pending"      value={pending}       grad={['#F97316',RED]}     accent={RED_L}   />
              <StatTile icon="home"         label="Houses"       value={activeHouses}  grad={[CYAN,    '#0EA5E9']} accent={CYAN}   />
              <StatTile icon="volume-2"     label="Notices"      value={activeNotices} grad={[PINK,    '#DB2777']} accent={PINK}   />
            </View>
          </View>

          {/* ══ PLATFORM SNAPSHOT ══ */}
          <View>
            <SectionHead label="Platform Overview" icon="grid" grad={[INDIGO, CYAN]} />
            <GlassCard>
              {[
                { icon: 'map',      accent: CYAN,    label: 'Total Wards',   value: wards.length,  tab: '/(tabs)/secondary?view=wards' },
                { icon: 'key',      accent: INDIGO_L, label: 'Active Keys',   value: activeKeys,    tab: '/(tabs)/tertiary?tab=genkey' },
                { icon: 'volume-2', accent: PINK,    label: 'Active Notices',value: activeNotices, tab: '/(tabs)/tertiary?tab=notices' },
                { icon: 'home',     accent: GREEN_L,  label: 'Active Houses', value: activeHouses,  tab: '/(tabs)/secondary?view=houses' },
                { icon: 'unlock',   accent: AMBER_L,  label: 'Pending Resets',value: pendingResets, tab: '/(tabs)/tertiary?tab=resets' },
              ].map((item, i, arr) => (
                <ListRow
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  accent={item.accent}
                  grad={null}
                  onPress={() => router.push(item.tab as any)}
                  last={i === arr.length - 1}
                />
              ))}
            </GlassCard>
          </View>

          {/* ══ ACCOUNT INFO ══ */}
          <View>
            <SectionHead label="Account Info" icon="user" grad={['#0EA5E9', '#2563EB']} />
            <GlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 14, paddingTop: 6 }}>
                <TouchableOpacity onPress={openEdit} style={p.editChip} activeOpacity={0.8}>
                  <Feather name="edit-2" size={10} color={INDIGO_L} />
                  <Text style={p.editChipTxt}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
              {[
                { icon: 'mail',     grad: [VIOLET,  INDIGO]    as const, label: 'Email',        sub: user.email },
                { icon: 'phone',    grad: [GREEN,   '#059669'] as const, label: 'Mobile',       sub: user.mobile ?? 'Not set' },
                { icon: 'hash',     grad: ['#0EA5E9','#2563EB'] as const, label: 'Role',         sub: (user as any).isSuperAdmin ? 'SUPERADMIN' : (user.id ?? '—') },
                { icon: 'calendar', grad: [PINK,    '#DB2777'] as const, label: 'Member Since', sub: (user as any).createdAt ?? '—' },
              ].map((row, i, arr) => (
                <View key={row.label} style={[lr.row, i < arr.length - 1 && lr.div]}>
                  <LinearGradient colors={row.grad} style={lr.icon}>
                    <Feather name={row.icon as any} size={14} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={lr.sub}>{row.label}</Text>
                    <Text style={lr.label} numberOfLines={1}>{row.sub}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </View>

          {/* ══ SETTINGS ══ */}
          <View>
            <SectionHead label="Settings" icon="settings" grad={['#64748B', '#334155']} />
            <GlassCard>
              {/* Notifications */}
              <View style={[lr.row, lr.div]}>
                <LinearGradient colors={[AMBER, '#D97706']} style={lr.icon}>
                  <Feather name="bell" size={14} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={lr.label}>Notifications</Text>
                  <Text style={lr.sub}>Complaints, resets & alerts</Text>
                </View>
                <Switch
                  value={notif}
                  onValueChange={setNotif}
                  trackColor={{ false: BORDER, true: INDIGO + 'AA' }}
                  thumbColor={notif ? INDIGO_L : MUTED}
                />
              </View>
              {/* Support */}
              <TouchableOpacity style={[lr.row, lr.div]} onPress={openSupport} activeOpacity={0.72}>
                <LinearGradient colors={[GREEN, '#059669']} style={lr.icon}>
                  <Feather name="phone-call" size={14} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={lr.label}>Support Details</Text>
                  <Text style={lr.sub}>{supportDetails.phone || 'Not configured'}</Text>
                </View>
                <Feather name="chevron-right" size={14} color={MUTED2} />
              </TouchableOpacity>
              {/* Change password */}
              {!!(user as any)?.isSuperAdmin && (
                <TouchableOpacity style={lr.row} onPress={openPw} activeOpacity={0.72}>
                  <LinearGradient colors={[RED, '#DC2626']} style={lr.icon}>
                    <Feather name="lock" size={14} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={lr.label}>Change Password</Text>
                    <Text style={lr.sub}>Update admin credentials</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={MUTED2} />
                </TouchableOpacity>
              )}
            </GlassCard>
          </View>

          {/* ══ ABOUT DNP360 ══ */}
          <View>
            <SectionHead label="About DNP360" icon="info" grad={[VIOLET, PINK]} />
            <GlassCard accent={VIOLET}>
              {/* Header row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, paddingBottom: 14 }}>
                <View style={p.appIconBox}>
                  <LinearGradient colors={[VIOLET + '44', INDIGO + '22']} style={StyleSheet.absoluteFill} />
                  <Image source={require('../../assets/images/dnp360-logo.png')} style={{ width: 52, height: 36, resizeMode: 'contain' }} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text style={{ color: TEXT, fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>DNP360</Text>
                    <LinearGradient colors={[VIOLET, INDIGO]} style={p.verBadge}>
                      <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' }}>v2.1.0</Text>
                    </LinearGradient>
                  </View>
                  <Text style={{ color: INDIGO_L, fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 2 }}>Nagar Parishad Daudnagar</Text>
                  <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 1 }}>Bihar, India · Est. 2026</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16 }} />

              {/* Info grid */}
              <View style={{ flexDirection: 'row', padding: 14, gap: 8 }}>
                {[
                  { icon: 'map-pin', color: CYAN,    label: 'District', value: 'Aurangabad' },
                  { icon: 'globe',   color: GREEN_L, label: 'State',    value: 'Bihar' },
                  { icon: 'server',  color: PINK,    label: 'Backend',  value: 'Firebase' },
                  { icon: 'cpu',     color: AMBER_L, label: 'Platform', value: 'Expo' },
                ].map(item => (
                  <View key={item.label} style={p.aboutCell}>
                    <View style={[p.aboutCellIcon, { backgroundColor: item.color + '1A' }]}>
                      <Feather name={item.icon as any} size={12} color={item.color} />
                    </View>
                    <Text style={[p.aboutCellVal, { color: item.color }]}>{item.value}</Text>
                    <Text style={p.aboutCellLbl}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16 }} />

              {/* Description & tags */}
              <View style={{ padding: 14, gap: 10 }}>
                <Text style={{ color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 19 }}>
                  A digital governance platform bridging{' '}
                  <Text style={{ color: TEXT, fontFamily: 'Inter_600SemiBold' }}>citizens</Text>,{' '}
                  <Text style={{ color: GREEN_L, fontFamily: 'Inter_600SemiBold' }}>Safai Karmis</Text>, and{' '}
                  <Text style={{ color: AMBER_L, fontFamily: 'Inter_600SemiBold' }}>officials</Text>{' '}
                  for efficient municipal service delivery.
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { label: '🇮🇳 Digital India', c: INDIGO_L },
                    { label: '🏛 Smart Gov',      c: CYAN     },
                    { label: '♻ Swachh Bharat',  c: GREEN_L  },
                    { label: '📊 Open Data',      c: AMBER_L  },
                    { label: '🔐 Secure',         c: PINK     },
                  ].map(t => (
                    <View key={t.label} style={{ backgroundColor: t.c + '14', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: t.c + '35' }}>
                      <Text style={{ color: t.c, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>{t.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Footer */}
              <LinearGradient colors={[VIOLET + '18', INDIGO + '08']} style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular' }}>© 2026 DNP360 · All rights reserved</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN_L }} />
                  <Text style={{ color: GREEN_L, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>Live · Production</Text>
                </View>
              </LinearGradient>
            </GlassCard>
          </View>

          {/* ══ SIGN OUT ══ */}
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.85} style={p.logoutWrap}>
            <LinearGradient colors={['rgba(239,68,68,0.20)', 'rgba(239,68,68,0.08)']} style={p.logoutBtn}>
              <View style={p.logoutBar} />
              <LinearGradient colors={['#F97316', RED]} style={p.logoutIcon}>
                <Feather name="log-out" size={18} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={p.logoutTxt}>Sign Out</Text>
                <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular' }}>You will be redirected to login</Text>
              </View>
              <View style={p.logoutChev}>
                <Feather name="chevron-right" size={16} color={RED_L} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={{ color: MUTED2, textAlign: 'center', fontSize: 10, fontFamily: 'Inter_400Regular' }}>
            DNP360 · Nagar Parishad Daudnagar · Bihar, India
          </Text>

        </View>
      </ScrollView>

      {/* ══ EDIT PROFILE MODAL ══ */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#060A1E' }}>
          <LinearGradient colors={['#1E1B4B', '#312E81', '#060A1E']} style={mo.hdr}>
            <LinearGradient colors={[VIOLET, INDIGO]} style={mo.hdrIcon}>
              <Feather name="user" size={16} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={mo.hdrTitle}>Edit Profile</Text>
              <Text style={mo.hdrSub}>Update your info & photo</Text>
            </View>
            <Pressable style={mo.closeBtn} onPress={() => setShowEdit(false)}>
              <Feather name="x" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} style={mo.avatarWrap}>
                <LinearGradient colors={[VIOLET, INDIGO, CYAN]} style={mo.avatarRing} />
                <View style={mo.avatarGap} />
                <View style={mo.avatarInner}>
                  {editPhoto
                    ? <Image source={{ uri: editPhoto }} style={mo.avatarImg} />
                    : user.avatar || (user as any).photo
                      ? <Image source={{ uri: user.avatar ?? (user as any).photo }} style={mo.avatarImg} />
                      : (
                        <LinearGradient colors={[VIOLET, INDIGO, PINK]} style={mo.avatarImg}>
                          <Text style={{ color: '#fff', fontSize: 32, fontFamily: 'Inter_700Bold' }}>{user.name[0].toUpperCase()}</Text>
                        </LinearGradient>
                      )
                  }
                </View>
                <View style={mo.cameraOverlay}>
                  <Feather name="camera" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter_600SemiBold', marginTop: 3 }}>Change</Text>
                </View>
              </TouchableOpacity>
              <Text style={{ color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' }}>Tap to change photo</Text>
            </View>

            <MField label="Full Name *" icon="user"    value={editName}   set={setEditName}   ph="Your full name"   cap="words" accent={INDIGO_L} />
            <MField label="Mobile"      icon="phone"   value={editMobile} set={setEditMobile} ph="10-digit number"  num={true}  accent={GREEN_L}  />
            <MField label="Address"     icon="map-pin" value={editAddr}   set={setEditAddr}   ph="Street, Ward…"   cap="sentences" accent={CYAN} />

            <TouchableOpacity onPress={saveProfile} disabled={savingP} activeOpacity={0.85} style={savingP ? { opacity: 0.6 } : {}}>
              <LinearGradient colors={[VIOLET, INDIGO]} style={mo.submitBtn}>
                <Feather name="check" size={16} color="#fff" />
                <Text style={mo.submitTxt}>{savingP ? 'Saving…' : 'Save Changes'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══ SUPPORT DETAILS MODAL ══ */}
      <Modal visible={showSupport} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#060A1E' }}>
          <LinearGradient colors={['#064E3B', '#065F46', '#060A1E']} style={mo.hdr}>
            <LinearGradient colors={[GREEN, '#059669']} style={mo.hdrIcon}>
              <Feather name="phone-call" size={16} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={mo.hdrTitle}>Support Details</Text>
              <Text style={mo.hdrSub}>Citizen-facing contact info</Text>
            </View>
            <Pressable style={mo.closeBtn} onPress={() => setShowSupport(false)}>
              <Feather name="x" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <MField label="Phone"   icon="phone"   value={supPhone} set={setSupPhone} ph="06184-XXXXXX"          num={true}  accent={GREEN_L} />
            <MField label="Email"   icon="mail"    value={supEmail} set={setSupEmail} ph="support@dnp360.in"     accent={CYAN}    />
            <MField label="Address" icon="map-pin" value={supAddr}  set={setSupAddr}  ph="Municipal Office…"    cap="sentences" accent={AMBER_L} />
            <MField label="Hours"   icon="clock"   value={supHours} set={setSupHours} ph="Mon–Sat, 10 AM – 5 PM" cap="sentences" accent={PINK}    />

            <TouchableOpacity onPress={saveSupport} disabled={savingSup} activeOpacity={0.85} style={savingSup ? { opacity: 0.6 } : {}}>
              <LinearGradient colors={[GREEN, '#059669']} style={mo.submitBtn}>
                <Feather name="save" size={16} color="#fff" />
                <Text style={mo.submitTxt}>{savingSup ? 'Saving…' : 'Save Details'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══ CHANGE PASSWORD MODAL ══ */}
      <Modal visible={showPw} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#060A1E' }}>
          <LinearGradient colors={['#450A0A', '#7F1D1D', '#060A1E']} style={mo.hdr}>
            <LinearGradient colors={[RED, '#DC2626']} style={mo.hdrIcon}>
              <Feather name="lock" size={16} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={mo.hdrTitle}>Change Password</Text>
              <Text style={mo.hdrSub}>Minimum 6 characters recommended</Text>
            </View>
            <Pressable style={mo.closeBtn} onPress={() => setShowPw(false)}>
              <Feather name="x" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', paddingVertical: 6 }}>
              <LinearGradient colors={[RED, '#DC2626']} style={{ width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }}>
                <Feather name="shield" size={26} color="#fff" />
              </LinearGradient>
              <Text style={{ color: TEXT, fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 12 }}>Update Admin Password</Text>
            </View>

            <MField label="Current Password" icon="lock" value={curPw} set={setCurPw} secure={true} show={showCur} setShow={setShowCur} ph="Current password" accent={RED_L} />
            <MField label="New Password"     icon="lock" value={newPw} set={setNewPw} secure={true} show={showNew} setShow={setShowNew} ph="New password"     accent={RED_L} />

            {pwStrength && (
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  {[1, 2, 3, 4].map(i => (
                    <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= pwStrength.bars ? pwStrength.color : BORDER }} />
                  ))}
                </View>
                <Text style={{ color: pwStrength.color, fontSize: 11, fontFamily: 'Inter_700Bold' }}>{pwStrength.label}</Text>
              </View>
            )}

            <View style={{ gap: 6 }}>
              <Text style={mf.lbl}>Confirm New Password</Text>
              <View style={[mf.wrap, { borderColor: conPw && conPw !== newPw ? RED + '80' : BORDER2 }]}>
                <Feather name="check-circle" size={16} color={conPw && conPw === newPw ? GREEN_L : RED_L} />
                <TextInput
                  style={mf.input}
                  value={conPw}
                  onChangeText={setConPw}
                  secureTextEntry={!showCon}
                  placeholder="Re-enter new password"
                  placeholderTextColor={MUTED2}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowCon(v => !v)} hitSlop={8}>
                  <Feather name={showCon ? 'eye-off' : 'eye'} size={14} color={MUTED} />
                </Pressable>
              </View>
              {conPw.length > 0 && conPw !== newPw && (
                <Text style={{ color: RED_L, fontSize: 11, fontFamily: 'Inter_400Regular', marginLeft: 4 }}>Passwords do not match</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={savePw}
              disabled={changingPw || !curPw || !newPw || !conPw}
              activeOpacity={0.85}
              style={[(!curPw || !newPw || !conPw || changingPw) && { opacity: 0.5 }]}
            >
              <LinearGradient colors={[RED, '#DC2626']} style={mo.submitBtn}>
                <Feather name={changingPw ? 'loader' : 'check'} size={16} color="#fff" />
                <Text style={mo.submitTxt}>{changingPw ? 'Updating…' : 'Update Password'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Hero styles ────────────────────────────────────────────────────────
const hero = StyleSheet.create({
  wrap:        { overflow: 'hidden', paddingBottom: 24 },
  grid:        { position: 'absolute', inset: 0, opacity: 0.04, backgroundColor: 'transparent',
                 borderWidth: 0.5, borderColor: '#fff' },
  orb:         { position: 'absolute', borderRadius: 999 },

  avatarWrap:  { width: 100, height: 100, position: 'relative', marginBottom: 2 },
  ring3:       { position: 'absolute', inset: -4, borderRadius: 999 },
  ring2:       { position: 'absolute', inset: -3, borderRadius: 999 },
  ringGap:     { position: 'absolute', inset: 2, borderRadius: 999, backgroundColor: BG },
  avatarInner: { position: 'absolute', inset: 4, borderRadius: 999, overflow: 'hidden', backgroundColor: BG },
  avatarImg:   { width: '100%', height: '100%', borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  avatarLetter:{ color: '#fff', fontSize: 36, fontFamily: 'Inter_700Bold' },
  onlinePip:   { position: 'absolute', bottom: 3, right: 3, width: 14, height: 14, borderRadius: 7, backgroundColor: GREEN_L, borderWidth: 2.5, borderColor: BG },
  editBadge:   { position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: INDIGO, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: BG },

  name:        { color: TEXT, fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
  email:       { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular' },
  saBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  saTxt:       { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  pip:         { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN_L },
  status:      { color: GREEN_L, fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  resetPill:   { backgroundColor: AMBER + '20', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, borderWidth: 1, borderColor: AMBER + '40' },
  resetTxt:    { color: AMBER_L, fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  rateWrap:    { width: '90%', marginTop: 20, gap: 0 },
  rateTrack:   { height: 5, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 99, overflow: 'hidden' },
  rateFill:    { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99 },
});

// ── Profile page styles ────────────────────────────────────────────────
const p = StyleSheet.create({
  editChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: INDIGO + '18', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: INDIGO + '35' },
  editChipTxt: { color: INDIGO_L, fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  appIconBox:  { width: 56, height: 56, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: VIOLET + '40' },
  verBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },

  aboutCell:   { flex: 1, alignItems: 'center', gap: 5 },
  aboutCellIcon:{ width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  aboutCellVal: { fontSize: 10, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  aboutCellLbl: { color: MUTED, fontSize: 9, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  logoutWrap:  { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: RED + '35' },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  logoutBar:   { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: RED_L },
  logoutIcon:  { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  logoutTxt:   { color: RED_L, fontSize: 16, fontFamily: 'Inter_700Bold' },
  logoutChev:  { width: 32, height: 32, borderRadius: 10, backgroundColor: RED + '18', justifyContent: 'center', alignItems: 'center' },
});

// ── Modal styles ───────────────────────────────────────────────────────
const mo = StyleSheet.create({
  hdr:       { flexDirection: 'row', alignItems: 'center', padding: 18, paddingBottom: 16, gap: 14 },
  hdrIcon:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  hdrTitle:  { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  hdrSub:    { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  closeBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

  avatarWrap:  { width: 110, height: 110, position: 'relative' },
  avatarRing:  { position: 'absolute', inset: -3, borderRadius: 999 },
  avatarGap:   { position: 'absolute', inset: 1, borderRadius: 999, backgroundColor: '#060A1E' },
  avatarInner: { position: 'absolute', inset: 4, borderRadius: 999, overflow: 'hidden', backgroundColor: '#060A1E' },
  avatarImg:   { width: '100%', height: '100%', borderRadius: 999, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  cameraOverlay: { position: 'absolute', inset: 0, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.50)', justifyContent: 'center', alignItems: 'center' },

  submitBtn:  { borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitTxt:  { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
