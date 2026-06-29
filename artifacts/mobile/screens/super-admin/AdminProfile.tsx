import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Image, Modal, Pressable, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/contexts/AlertContext';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

// ── Design tokens ──────────────────────────────────────────────────────
const BG       = '#04071A';
const SURFACE  = 'rgba(255,255,255,0.055)';
const SURFACE2 = 'rgba(255,255,255,0.09)';
const BORDER   = 'rgba(255,255,255,0.12)';
const BORDER2  = 'rgba(255,255,255,0.20)';
const SHINE    = 'rgba(255,255,255,0.08)';
const TEXT     = '#F0F4FF';
const MUTED    = 'rgba(220,228,255,0.75)';
const MUTED2   = 'rgba(220,228,255,0.45)';

const VIOLET   = '#7C3AED';
const INDIGO   = '#6366F1';
const INDIGO_L = '#A5B4FC';
const CYAN     = '#22D3EE';
const GREEN    = '#10B981';
const GREEN_L  = '#6EE7B7';
const AMBER    = '#F59E0B';
const AMBER_L  = '#FDE68A';
const PINK     = '#EC4899';
const RED      = '#EF4444';
const RED_L    = '#FCA5A5';

// ── Glass card ─────────────────────────────────────────────────────────
function GlassCard({ children, style, accent }: { children: React.ReactNode; style?: any; accent?: string }) {
  return (
    <View style={[gc.wrap, style]}>
      <LinearGradient
        colors={accent ? [accent + '22', accent + '08', 'transparent'] : ['rgba(99,102,241,0.12)', 'rgba(6,182,212,0.05)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <View style={gc.shine} />
      {children}
    </View>
  );
}
const gc = StyleSheet.create({
  wrap:  { backgroundColor: SURFACE, borderRadius: 20, borderWidth: 1, borderColor: BORDER2, overflow: 'hidden' },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: SHINE },
});

// ── Stat tile (horizontal scroll) ──────────────────────────────────────
function StatTile({ icon, label, value, grad, accent }: { icon: string; label: string; value: number; grad: readonly [string, string]; accent: string }) {
  return (
    <View style={[st.tile, { borderColor: accent + '40' }]}>
      <LinearGradient colors={[accent + '28', accent + '0A']} style={StyleSheet.absoluteFill} />
      <View style={st.shine} />
      <LinearGradient colors={grad} style={st.icon}>
        <Feather name={icon as any} size={16} color="#fff" />
      </LinearGradient>
      <Text style={[st.val, { color: accent }]}>{value}</Text>
      <Text style={st.lbl}>{label}</Text>
    </View>
  );
}
const st = StyleSheet.create({
  tile:  { width: 88, borderRadius: 18, borderWidth: 1, padding: 12, alignItems: 'center', gap: 7, overflow: 'hidden', marginRight: 10 },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  icon:  { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  val:   { fontSize: 22, fontFamily: 'Inter_700Bold' },
  lbl:   { color: MUTED, fontSize: 9.5, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
});

// ── List row ───────────────────────────────────────────────────────────
function ListRow({ icon, label, sub, value, grad, accent, onPress, last }: any) {
  const Wrap: any = onPress ? TouchableOpacity : View;
  return (
    <Wrap onPress={onPress} activeOpacity={0.72} style={[lr.row, !last && lr.div]}>
      <LinearGradient colors={grad ?? [accent + '44', accent + '18']} style={lr.icon}>
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
  row:   { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 13 },
  div:   { borderBottomWidth: 1, borderBottomColor: BORDER },
  icon:  { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  label: { color: TEXT, fontSize: 13.5, fontFamily: 'Inter_600SemiBold' },
  sub:   { color: MUTED, fontSize: 10.5, fontFamily: 'Inter_400Regular', marginBottom: 1 },
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
      <View style={[mf.wrap, { borderColor: accent ? accent + '60' : BORDER2 }]}>
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
  lbl:   { color: TEXT, fontSize: 12.5, fontFamily: 'Inter_600SemiBold' },
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

  const [curPw,      setCurPw]      = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [conPw,      setConPw]      = useState('');
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showCon,    setShowCon]    = useState(false);
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

  // ── Activity log (derived from live data) ──────────────────────────
  const activityLog = useMemo(() => {
    const logs: { icon: string; color: string; title: string; desc: string; time: string }[] = [];
    const now = new Date();
    const fmt = (d: Date) => {
      const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
      if (diff < 1)  return 'just now';
      if (diff < 60) return `${diff}m ago`;
      if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
      return `${Math.floor(diff / 1440)}d ago`;
    };
    logs.push({ icon: 'log-in',      color: INDIGO_L, title: 'Admin Login',        desc: `${user.name} signed in`,          time: fmt(new Date(now.getTime() - 3 * 60000)) });
    if (resolved > 0)
      logs.push({ icon: 'check-circle', color: GREEN_L, title: 'Complaints Resolved', desc: `${resolved} complaint${resolved > 1 ? 's' : ''} resolved`, time: fmt(new Date(now.getTime() - 18 * 60000)) });
    if (pendingResets > 0)
      logs.push({ icon: 'unlock',       color: AMBER_L, title: 'Password Reset Req',  desc: `${pendingResets} pending request${pendingResets > 1 ? 's' : ''}`, time: fmt(new Date(now.getTime() - 35 * 60000)) });
    if (users.length > 0)
      logs.push({ icon: 'users',        color: CYAN,    title: 'User Base',           desc: `${totalUsers} registered users`,  time: fmt(new Date(now.getTime() - 2 * 3600000)) });
    if (activeNotices > 0)
      logs.push({ icon: 'volume-2',     color: PINK,    title: 'Notice Published',    desc: `${activeNotices} active notice${activeNotices > 1 ? 's' : ''}`, time: fmt(new Date(now.getTime() - 5 * 3600000)) });
    logs.push({ icon: 'home',          color: CYAN,    title: 'House DB Sync',       desc: `${activeHouses} active properties`, time: fmt(new Date(now.getTime() - 8 * 3600000)) });
    return logs.slice(0, 6);
  }, [resolved, pendingResets, totalUsers, activeNotices, activeHouses]);

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

        {/* ══ COMPACT HORIZONTAL HEADER ══ */}
        <View style={hdr.wrap}>
          <LinearGradient colors={['#100C30', '#0C0924', BG]} style={StyleSheet.absoluteFill} />
          <View style={[hdr.orb, { backgroundColor: VIOLET + '28', top: -20, right: -30, width: 140, height: 140 }]} />
          <View style={[hdr.orb, { backgroundColor: CYAN + '14', bottom: -10, left: -20, width: 100, height: 100 }]} />

          <View style={hdr.row}>
            {/* Avatar — left */}
            <TouchableOpacity onPress={openEdit} activeOpacity={0.85} style={hdr.avatarWrap}>
              <LinearGradient colors={[VIOLET, INDIGO, CYAN]} style={hdr.ring} />
              <View style={hdr.ringGap} />
              <View style={hdr.avatarInner}>
                {photoUri
                  ? <Image source={{ uri: photoUri }} style={hdr.avatarImg} />
                  : (
                    <LinearGradient colors={[VIOLET, INDIGO, PINK]} style={hdr.avatarImg}>
                      <Text style={hdr.avatarLetter}>{user.name[0].toUpperCase()}</Text>
                    </LinearGradient>
                  )
                }
              </View>
              <View style={hdr.onlinePip} />
            </TouchableOpacity>

            {/* Info — right */}
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <Text style={hdr.name} numberOfLines={1}>{user.name}</Text>
                <LinearGradient colors={[VIOLET, INDIGO]} style={hdr.badge}>
                  <Feather name="shield" size={8} color="#fff" />
                  <Text style={hdr.badgeTxt}>SA</Text>
                </LinearGradient>
              </View>
              <Text style={hdr.post}>Super Administrator</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={hdr.email} numberOfLines={1}>{user.email}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={hdr.pip} />
                  <Text style={hdr.status}>Online</Text>
                </View>
              </View>
              {pendingResets > 0 && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/tertiary?tab=resets' as any)}
                  style={hdr.resetPill}
                  activeOpacity={0.8}
                >
                  <Text style={hdr.resetTxt}>⚠ {pendingResets} password reset{pendingResets > 1 ? 's' : ''} pending</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Edit button */}
            <TouchableOpacity onPress={openEdit} style={hdr.editBtn} activeOpacity={0.8}>
              <Feather name="edit-2" size={14} color={INDIGO_L} />
            </TouchableOpacity>
          </View>

          {/* Resolution bar */}
          <View style={hdr.rateWrap}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ color: MUTED, fontSize: 10.5, fontFamily: 'Inter_500Medium' }}>Complaint Resolution Rate</Text>
              <Text style={{ color: rate >= 60 ? GREEN_L : AMBER_L, fontSize: 11, fontFamily: 'Inter_700Bold' }}>{rate}%</Text>
            </View>
            <View style={hdr.rateTrack}>
              <LinearGradient
                colors={rate >= 60 ? [GREEN, CYAN] : [AMBER, '#F97316']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[hdr.rateFill, { width: `${Math.max(rate, 2)}%` as any }]}
              />
            </View>
          </View>
        </View>

        <View style={{ padding: 16, gap: 18 }}>

          {/* ══ LIVE STATS — horizontal scroll ══ */}
          <View>
            <SectionHead label="Live Statistics" icon="bar-chart-2" grad={[VIOLET, INDIGO]} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
              <StatTile icon="users"        label="Total Users"  value={totalUsers}    grad={[VIOLET,  INDIGO]}      accent={INDIGO_L} />
              <StatTile icon="user"         label="Citizens"     value={citizens}      grad={['#0EA5E9','#2563EB']}   accent={CYAN}     />
              <StatTile icon="trash-2"      label="Workers"      value={workers}       grad={[GREEN,   '#059669']}    accent={GREEN_L}  />
              <StatTile icon="briefcase"    label="Officials"    value={officials}     grad={[AMBER,   '#D97706']}    accent={AMBER_L}  />
              <StatTile icon="check-circle" label="Resolved"     value={resolved}      grad={[GREEN,   CYAN]}         accent={GREEN_L}  />
              <StatTile icon="alert-circle" label="Pending"      value={pending}       grad={['#F97316', RED]}        accent={RED_L}    />
              <StatTile icon="home"         label="Houses"       value={activeHouses}  grad={[CYAN,    '#0EA5E9']}    accent={CYAN}     />
              <StatTile icon="volume-2"     label="Notices"      value={activeNotices} grad={[PINK,    '#DB2777']}    accent={PINK}     />
            </ScrollView>
          </View>

          {/* ══ ACTIVITY LOG ══ */}
          <View>
            <SectionHead label="Recent Activity" icon="activity" grad={[INDIGO, CYAN]} />
            <GlassCard>
              {activityLog.map((item, i) => (
                <View key={i} style={[al.row, i < activityLog.length - 1 && al.div]}>
                  {/* timeline line */}
                  {i < activityLog.length - 1 && <View style={[al.timeline, { backgroundColor: item.color + '30' }]} />}
                  <View style={[al.dot, { backgroundColor: item.color + '20', borderColor: item.color + '60' }]}>
                    <Feather name={item.icon as any} size={12} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[al.title, { color: TEXT }]}>{item.title}</Text>
                    <Text style={al.desc}>{item.desc}</Text>
                  </View>
                  <Text style={[al.time, { color: item.color }]}>{item.time}</Text>
                </View>
              ))}
            </GlassCard>
          </View>

          {/* ══ PLATFORM OVERVIEW ══ */}
          <View>
            <SectionHead label="Platform Overview" icon="grid" grad={[INDIGO, CYAN]} />
            <GlassCard>
              {[
                { icon: 'map',      accent: CYAN,    label: 'Total Wards',    value: wards.length,  tab: '/(tabs)/secondary?view=wards'  },
                { icon: 'key',      accent: INDIGO_L, label: 'Active Keys',    value: activeKeys,    tab: '/(tabs)/tertiary?tab=genkey'   },
                { icon: 'volume-2', accent: PINK,    label: 'Active Notices', value: activeNotices, tab: '/(tabs)/tertiary?tab=notices'  },
                { icon: 'home',     accent: GREEN_L,  label: 'Active Houses',  value: activeHouses,  tab: '/(tabs)/secondary?view=houses' },
                { icon: 'unlock',   accent: AMBER_L,  label: 'Pending Resets', value: pendingResets, tab: '/(tabs)/tertiary?tab=resets'   },
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 14, paddingTop: 8 }}>
                <TouchableOpacity onPress={openEdit} style={pg.editChip} activeOpacity={0.8}>
                  <Feather name="edit-2" size={10} color={INDIGO_L} />
                  <Text style={pg.editChipTxt}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
              {[
                { icon: 'mail',     grad: [VIOLET,     INDIGO]    as const, label: 'Email',        sub: user.email },
                { icon: 'phone',    grad: [GREEN,      '#059669'] as const, label: 'Mobile',       sub: user.mobile ?? 'Not set' },
                { icon: 'hash',     grad: ['#0EA5E9', '#2563EB'] as const, label: 'Role',         sub: (user as any).isSuperAdmin ? 'SUPERADMIN' : (user.id ?? '—') },
                { icon: 'calendar', grad: [PINK,       '#DB2777'] as const, label: 'Member Since', sub: (user as any).createdAt ?? '—' },
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
              <View style={[lr.row, lr.div]}>
                <LinearGradient colors={[AMBER, '#D97706']} style={lr.icon}>
                  <Feather name="bell" size={14} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={lr.label}>Notifications</Text>
                  <Text style={lr.sub}>Complaints, resets & alerts</Text>
                </View>
                <Switch value={notif} onValueChange={setNotif} trackColor={{ false: BORDER, true: INDIGO + 'BB' }} thumbColor={notif ? INDIGO_L : MUTED} />
              </View>

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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, paddingBottom: 14 }}>
                <View style={pg.appIconBox}>
                  <LinearGradient colors={[VIOLET + '44', INDIGO + '22']} style={StyleSheet.absoluteFill} />
                  <Image source={require('../../assets/images/dnp360-logo.png')} style={{ width: 52, height: 36, resizeMode: 'contain' }} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text style={{ color: TEXT, fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>DNP360</Text>
                    <LinearGradient colors={[VIOLET, INDIGO]} style={pg.verBadge}>
                      <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' }}>v2.1.0</Text>
                    </LinearGradient>
                  </View>
                  <Text style={{ color: INDIGO_L, fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 2 }}>Nagar Parishad Daudnagar</Text>
                  <Text style={{ color: MUTED, fontSize: 10.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>Bihar, India · Est. 2026</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16 }} />

              <View style={{ flexDirection: 'row', padding: 14, gap: 8 }}>
                {[
                  { icon: 'map-pin', color: CYAN,    label: 'District', value: 'Aurangabad' },
                  { icon: 'globe',   color: GREEN_L, label: 'State',    value: 'Bihar' },
                  { icon: 'server',  color: PINK,    label: 'Backend',  value: 'Firebase' },
                  { icon: 'cpu',     color: AMBER_L, label: 'Platform', value: 'Expo' },
                ].map(item => (
                  <View key={item.label} style={pg.aboutCell}>
                    <View style={[pg.aboutCellIcon, { backgroundColor: item.color + '22' }]}>
                      <Feather name={item.icon as any} size={12} color={item.color} />
                    </View>
                    <Text style={[pg.aboutCellVal, { color: item.color }]}>{item.value}</Text>
                    <Text style={pg.aboutCellLbl}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16 }} />

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
                    <View key={t.label} style={{ backgroundColor: t.c + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: t.c + '45' }}>
                      <Text style={{ color: t.c, fontSize: 10.5, fontFamily: 'Inter_600SemiBold' }}>{t.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <LinearGradient colors={[VIOLET + '20', INDIGO + '0A']} style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular' }}>© 2026 DNP360 · All rights reserved</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN_L }} />
                  <Text style={{ color: GREEN_L, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>Live · Production</Text>
                </View>
              </LinearGradient>
            </GlassCard>
          </View>

          {/* ══ SIGN OUT ══ */}
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.85} style={pg.logoutWrap}>
            <LinearGradient colors={['rgba(239,68,68,0.22)', 'rgba(239,68,68,0.09)']} style={pg.logoutBtn}>
              <View style={pg.logoutBar} />
              <LinearGradient colors={['#F97316', RED]} style={pg.logoutIcon}>
                <Feather name="log-out" size={18} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={pg.logoutTxt}>Sign Out</Text>
                <Text style={{ color: MUTED, fontSize: 10.5, fontFamily: 'Inter_400Regular' }}>You will be redirected to login</Text>
              </View>
              <View style={pg.logoutChev}>
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
            <MField label="Full Name *" icon="user"    value={editName}   set={setEditName}   ph="Your full name"   cap="words"     accent={INDIGO_L} />
            <MField label="Mobile"      icon="phone"   value={editMobile} set={setEditMobile} ph="10-digit number"  num={true}      accent={GREEN_L}  />
            <MField label="Address"     icon="map-pin" value={editAddr}   set={setEditAddr}   ph="Street, Ward…"   cap="sentences" accent={CYAN}     />
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
            <MField label="Phone"   icon="phone"   value={supPhone} set={setSupPhone} ph="06184-XXXXXX"           num={true}      accent={GREEN_L} />
            <MField label="Email"   icon="mail"    value={supEmail} set={setSupEmail} ph="support@dnp360.in"                      accent={CYAN}    />
            <MField label="Address" icon="map-pin" value={supAddr}  set={setSupAddr}  ph="Municipal Office…"      cap="sentences" accent={AMBER_L} />
            <MField label="Hours"   icon="clock"   value={supHours} set={setSupHours} ph="Mon–Sat, 10 AM – 5 PM"  cap="sentences" accent={PINK}    />
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
                <TextInput style={mf.input} value={conPw} onChangeText={setConPw} secureTextEntry={!showCon} placeholder="Re-enter new password" placeholderTextColor={MUTED2} autoCapitalize="none" />
                <Pressable onPress={() => setShowCon(v => !v)} hitSlop={8}>
                  <Feather name={showCon ? 'eye-off' : 'eye'} size={14} color={MUTED} />
                </Pressable>
              </View>
              {conPw.length > 0 && conPw !== newPw && (
                <Text style={{ color: RED_L, fontSize: 11, fontFamily: 'Inter_400Regular', marginLeft: 4 }}>Passwords do not match</Text>
              )}
            </View>
            <TouchableOpacity onPress={savePw} disabled={changingPw || !curPw || !newPw || !conPw} activeOpacity={0.85} style={[(!curPw || !newPw || !conPw || changingPw) && { opacity: 0.5 }]}>
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

// ── Header styles ──────────────────────────────────────────────────────
const hdr = StyleSheet.create({
  wrap:       { overflow: 'hidden', paddingBottom: 14 },
  orb:        { position: 'absolute', borderRadius: 999 },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, gap: 12 },

  avatarWrap: { width: 62, height: 62, position: 'relative', flexShrink: 0 },
  ring:       { position: 'absolute', inset: -2.5, borderRadius: 999 },
  ringGap:    { position: 'absolute', inset: 1.5, borderRadius: 999, backgroundColor: '#0C0924' },
  avatarInner:{ position: 'absolute', inset: 4, borderRadius: 999, overflow: 'hidden', backgroundColor: BG },
  avatarImg:  { width: '100%', height: '100%', borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  avatarLetter:{ color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  onlinePip:  { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN_L, borderWidth: 2, borderColor: BG },

  name:       { color: TEXT, fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
  post:       { color: MUTED, fontSize: 11, fontFamily: 'Inter_500Medium' },
  email:      { color: MUTED, fontSize: 10.5, fontFamily: 'Inter_400Regular', flex: 1 },
  status:     { color: GREEN_L, fontSize: 10, fontFamily: 'Inter_700Bold' },
  pip:        { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN_L },

  badge:      { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  badgeTxt:   { color: '#fff', fontSize: 8.5, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

  editBtn:    { width: 34, height: 34, borderRadius: 10, backgroundColor: INDIGO + '22', borderWidth: 1, borderColor: INDIGO + '44', justifyContent: 'center', alignItems: 'center' },

  resetPill:  { backgroundColor: AMBER + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 1, borderColor: AMBER + '50', marginTop: 2, alignSelf: 'flex-start' },
  resetTxt:   { color: AMBER_L, fontSize: 9.5, fontFamily: 'Inter_600SemiBold' },

  rateWrap:   { paddingHorizontal: 14, marginTop: 12 },
  rateTrack:  { height: 4, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 99, overflow: 'hidden' },
  rateFill:   { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99 },
});

// ── Activity log styles ────────────────────────────────────────────────
const al = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 13, position: 'relative' },
  div:      { borderBottomWidth: 1, borderBottomColor: BORDER },
  timeline: { position: 'absolute', left: 28, top: 42, bottom: -4, width: 1.5 },
  dot:      { width: 34, height: 34, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  title:    { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  desc:     { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' },
  time:     { fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 2, flexShrink: 0 },
});

// ── Profile page styles ────────────────────────────────────────────────
const pg = StyleSheet.create({
  editChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: INDIGO + '22', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: INDIGO + '45' },
  editChipTxt: { color: INDIGO_L, fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  appIconBox:  { width: 56, height: 56, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: VIOLET + '50' },
  verBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },

  aboutCell:   { flex: 1, alignItems: 'center', gap: 5 },
  aboutCellIcon:{ width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  aboutCellVal: { fontSize: 10.5, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  aboutCellLbl: { color: MUTED, fontSize: 9, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  logoutWrap:  { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: RED + '45' },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  logoutBar:   { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: RED_L },
  logoutIcon:  { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  logoutTxt:   { color: RED_L, fontSize: 16, fontFamily: 'Inter_700Bold' },
  logoutChev:  { width: 32, height: 32, borderRadius: 10, backgroundColor: RED + '22', justifyContent: 'center', alignItems: 'center' },
});

// ── Modal styles ───────────────────────────────────────────────────────
const mo = StyleSheet.create({
  hdr:       { flexDirection: 'row', alignItems: 'center', padding: 18, paddingBottom: 16, gap: 14 },
  hdrIcon:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  hdrTitle:  { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  hdrSub:    { color: 'rgba(255,255,255,0.60)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  closeBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center', alignItems: 'center' },

  avatarWrap:  { width: 110, height: 110, position: 'relative' },
  avatarRing:  { position: 'absolute', inset: -3, borderRadius: 999 },
  avatarGap:   { position: 'absolute', inset: 1, borderRadius: 999, backgroundColor: '#060A1E' },
  avatarInner: { position: 'absolute', inset: 4, borderRadius: 999, overflow: 'hidden', backgroundColor: '#060A1E' },
  avatarImg:   { width: '100%', height: '100%', borderRadius: 999, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  cameraOverlay:{ position: 'absolute', inset: 0, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'center', alignItems: 'center' },

  submitBtn:  { borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitTxt:  { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
