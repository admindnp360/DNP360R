import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image, Modal, Pressable, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/contexts/AlertContext';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

// ─── Tokens ───────────────────────────────────────────────────────────
const BG      = '#070B1A';
const CARD    = 'rgba(255,255,255,0.055)';
const CARD_HI = 'rgba(255,255,255,0.09)';
const BD      = 'rgba(255,255,255,0.11)';
const TEXT    = '#F0F4FF';
const MUTED   = 'rgba(240,244,255,0.42)';
const MUTED2  = 'rgba(240,244,255,0.22)';

const INDIGO  = '#818CF8';
const CYAN    = '#22D3EE';
const GREEN   = '#34D399';
const PINK    = '#F472B6';
const AMBER   = '#FCD34D';
const RED     = '#FB7185';

export default function AdminProfile() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { showAlert } = useAlert();
  const {
    users, complaints, notices, wards, houses, secretKeys,
    supportDetails, updateSupportDetails, passwordResetRequests,
  } = useAppData();

  // ── Modal state ────────────────────────────────────────────────────
  const [showEdit, setShowEdit]       = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [notif, setNotif]             = useState(true);

  // ── Edit profile ───────────────────────────────────────────────────
  const [editName, setEditName]       = useState('');
  const [editMobile, setEditMobile]   = useState('');
  const [editAddr, setEditAddr]       = useState('');
  const [editPhoto, setEditPhoto]     = useState<string | undefined>();
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Support ────────────────────────────────────────────────────────
  const [supPhone, setSupPhone]       = useState('');
  const [supEmail, setSupEmail]       = useState('');
  const [supAddr, setSupAddr]         = useState('');
  const [supHours, setSupHours]       = useState('');
  const [savingSup, setSavingSup]     = useState(false);

  // ── Password ───────────────────────────────────────────────────────
  const [curPw, setCurPw]             = useState('');
  const [newPw, setNewPw]             = useState('');
  const [conPw, setConPw]             = useState('');
  const [showCur, setShowCur]         = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showCon, setShowCon]         = useState(false);
  const [changingPw, setChangingPw]   = useState(false);

  if (!user) return null;

  // ── Stats ──────────────────────────────────────────────────────────
  const totalUsers   = users.length;
  const citizens     = users.filter(u => u.role === 'citizen').length;
  const workers      = users.filter(u => u.role === 'safaikarmi').length;
  const officials    = users.filter(u => u.role === 'official').length;
  const resolved     = complaints.filter(c => c.status === 'resolved').length;
  const pending      = complaints.filter(c => c.status === 'submitted' || c.status === 'assigned').length;
  const rate         = complaints.length > 0 ? Math.round((resolved / complaints.length) * 100) : 0;
  const activeHouses = houses.filter(h => h.isActive).length;
  const activeNotices= notices.filter(n => n.isActive).length;
  const pendingResets= passwordResetRequests.filter(r => r.status === 'pending').length;
  const activeKeys   = secretKeys.filter(k => k.isActive).length;

  const photoUri = editPhoto ?? user.avatar ?? user.photo;

  // ── Handlers ───────────────────────────────────────────────────────
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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) setEditPhoto(result.assets[0].uri);
  }

  async function saveProfile() {
    if (!editName.trim()) { showAlert('Missing', 'Name cannot be empty.', undefined, 'warning'); return; }
    setSavingProfile(true);
    try {
      await updateProfile({ name: editName.trim(), mobile: editMobile.trim() || undefined, ...(editAddr ? { address: editAddr.trim() } : {}), ...(editPhoto ? { avatar: editPhoto } : {}) });
      setShowEdit(false);
      showAlert('Updated', 'Profile saved.', undefined, 'success');
    } finally { setSavingProfile(false); }
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
    showAlert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ], 'warning');
  }

  const pwStrength = newPw.length === 0 ? null : newPw.length < 4 ? { label: 'Weak', color: RED, bars: 1 } : newPw.length < 6 ? { label: 'Fair', color: AMBER, bars: 2 } : newPw.length < 8 ? { label: 'Good', color: CYAN, bars: 3 } : { label: 'Strong', color: GREEN, bars: 4 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ══ COMPACT PROFILE STRIP ══ */}
        <View style={s.strip}>
          <LinearGradient colors={['rgba(99,102,241,0.12)','rgba(6,182,212,0.04)']} style={StyleSheet.absoluteFill} />
          <View style={s.stripLeft}>
            {/* Mini avatar */}
            <TouchableOpacity onPress={openEdit} activeOpacity={0.8} style={s.miniAvatarWrap}>
              <LinearGradient colors={['#6366F1','#8B5CF6','#EC4899']} style={s.miniRing} />
              <View style={s.miniInner}>
                {photoUri
                  ? <Image source={{ uri: photoUri }} style={s.miniImg} />
                  : <LinearGradient colors={['#6366F1','#8B5CF6','#EC4899']} style={s.miniImg}>
                      <Text style={s.miniLetter}>{user.name[0].toUpperCase()}</Text>
                    </LinearGradient>
                }
              </View>
              <View style={s.miniOnline} />
            </TouchableOpacity>

            {/* Name + role */}
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.stripName} numberOfLines={1}>{user.name}</Text>
                <View style={s.superBadge}>
                  <Feather name="shield" size={7} color={INDIGO} />
                  <Text style={s.superBadgeTxt}>SA</Text>
                </View>
              </View>
              <Text style={s.stripEmail} numberOfLines={1}>{user.email}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <View style={s.onlinePip} />
                <Text style={s.stripStatus}>Online · Full Access</Text>
                {pendingResets > 0 && (
                  <TouchableOpacity onPress={() => router.push('/(tabs)/tertiary?tab=resets' as any)} activeOpacity={0.8} style={s.resetsPill}>
                    <Text style={s.resetsPillTxt}>⚠ {pendingResets} reset{pendingResets > 1 ? 's' : ''}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity style={s.stripBtn} onPress={openEdit} activeOpacity={0.8}>
              <Feather name="edit-2" size={13} color={INDIGO} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.stripBtn, { borderColor: 'rgba(251,113,133,0.3)', backgroundColor: 'rgba(251,113,133,0.10)' }]} onPress={handleLogout} activeOpacity={0.8}>
              <Feather name="log-out" size={13} color={RED} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Resolution rate — slim bar below strip */}
        <View style={s.rateBar}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text style={s.rateLabel}>Complaint Resolution Rate</Text>
            <Text style={[s.rateVal, { color: rate >= 60 ? GREEN : AMBER }]}>{rate}%</Text>
          </View>
          <View style={s.rateTrack}>
            <LinearGradient
              colors={rate >= 60 ? [GREEN, CYAN] : [AMBER, '#F97316']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.rateFill, { width: `${Math.max(rate, 2)}%` as any }]}
            />
          </View>
        </View>

        <View style={s.body}>

          {/* ── LIVE STATS GRID ── */}
          <Text style={s.sectionLabel}>Live Statistics</Text>
          <View style={s.statsGrid}>
            {[
              { label: 'Total Users',  value: totalUsers,    icon: 'users',       color: INDIGO, g: ['#6366F1','#8B5CF6'] as const },
              { label: 'Citizens',     value: citizens,      icon: 'user',        color: CYAN,   g: ['#0EA5E9','#2563EB'] as const },
              { label: 'Workers',      value: workers,       icon: 'trash-2',     color: GREEN,  g: ['#10B981','#059669'] as const },
              { label: 'Officials',    value: officials,     icon: 'briefcase',   color: AMBER,  g: ['#F59E0B','#EF4444'] as const },
              { label: 'Resolved',     value: resolved,      icon: 'check-circle',color: GREEN,  g: ['#10B981','#34D399'] as const },
              { label: 'Pending',      value: pending,       icon: 'alert-circle',color: RED,    g: ['#F97316','#EF4444'] as const },
              { label: 'Houses',       value: activeHouses,  icon: 'home',        color: CYAN,   g: ['#06B6D4','#0EA5E9'] as const },
              { label: 'Notices',      value: activeNotices, icon: 'volume-2',    color: PINK,   g: ['#EC4899','#DB2777'] as const },
            ].map(s2 => (
              <View key={s2.label} style={[s.statCell, { borderColor: s2.color + '28' }]}>
                <LinearGradient colors={[s2.color + '20', s2.color + '06']} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={s2.g} style={s.statIcon}>
                  <Feather name={s2.icon as any} size={13} color="#fff" />
                </LinearGradient>
                <Text style={[s.statVal, { color: s2.color }]}>{s2.value}</Text>
                <Text style={s.statLbl}>{s2.label}</Text>
              </View>
            ))}
          </View>

          {/* ── PLATFORM SNAPSHOT ── */}
          <View style={s.card}>
            <View style={s.cardHdr}>
              <LinearGradient colors={['#6366F1','#8B5CF6']} style={s.cardIcon}>
                <Feather name="grid" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.cardTitle}>Platform Snapshot</Text>
            </View>
            {[
              { icon: 'map',       color: CYAN,   label: 'Wards',         value: wards.length,  tab: '/(tabs)/secondary?view=wards'   },
              { icon: 'key',       color: INDIGO,  label: 'Active Keys',   value: activeKeys,    tab: '/(tabs)/tertiary?tab=genkey'    },
              { icon: 'volume-2',  color: PINK,    label: 'Active Notices',value: activeNotices, tab: '/(tabs)/tertiary?tab=notices'   },
              { icon: 'home',      color: GREEN,   label: 'Active Houses', value: activeHouses,  tab: '/(tabs)/secondary?view=houses'  },
              { icon: 'unlock',    color: AMBER,   label: 'Pending Resets',value: pendingResets, tab: '/(tabs)/tertiary?tab=resets'    },
            ].map((item, i, arr) => (
              <TouchableOpacity key={item.label} style={[s.listRow, i < arr.length - 1 && s.rowDiv]} onPress={() => router.push(item.tab as any)} activeOpacity={0.72}>
                <View style={[s.listIcon, { backgroundColor: item.color + '18' }]}>
                  <Feather name={item.icon as any} size={13} color={item.color} />
                </View>
                <Text style={s.listLabel}>{item.label}</Text>
                <Text style={[s.listValue, { color: item.color }]}>{item.value}</Text>
                <Feather name="chevron-right" size={13} color={MUTED2} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ── ACCOUNT INFO ── */}
          <View style={s.card}>
            <View style={s.cardHdr}>
              <LinearGradient colors={['#0EA5E9','#2563EB']} style={s.cardIcon}>
                <Feather name="user" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.cardTitle}>Account Info</Text>
              <TouchableOpacity onPress={openEdit} style={s.editChip} activeOpacity={0.8}>
                <Feather name="edit-2" size={10} color={INDIGO} />
                <Text style={s.editChipTxt}>Edit</Text>
              </TouchableOpacity>
            </View>
            {[
              { icon: 'mail',     g: ['#6366F1','#8B5CF6'] as const, label: 'Email',        value: user.email },
              { icon: 'phone',    g: ['#10B981','#059669'] as const, label: 'Mobile',       value: user.mobile ?? 'Not set' },
              { icon: 'hash',     g: ['#0EA5E9','#2563EB'] as const, label: 'User ID',      value: (user.role === 'superadmin') ? 'SUPERADMIN' : (user.id ?? '—') },
              { icon: 'calendar', g: ['#EC4899','#DB2777'] as const, label: 'Member Since', value: (user as any).createdAt ?? '—' },
            ].map((row, i, arr) => (
              <View key={row.label} style={[s.listRow, i < arr.length - 1 && s.rowDiv]}>
                <LinearGradient colors={row.g} style={s.listIcon}>
                  <Feather name={row.icon as any} size={13} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.listSub}>{row.label}</Text>
                  <Text style={s.listLabel} numberOfLines={1}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── SETTINGS ── */}
          <View style={s.card}>
            <View style={s.cardHdr}>
              <LinearGradient colors={['#6B7280','#374151']} style={s.cardIcon}>
                <Feather name="settings" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.cardTitle}>Settings</Text>
            </View>

            <View style={[s.listRow, s.rowDiv]}>
              <LinearGradient colors={['#F59E0B','#EF4444']} style={s.listIcon}>
                <Feather name="bell" size={13} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.listLabel}>Notifications</Text>
                <Text style={s.listSub}>Complaints, resets, alerts</Text>
              </View>
              <Switch value={notif} onValueChange={setNotif} trackColor={{ false: BD, true: INDIGO + 'AA' }} thumbColor={notif ? INDIGO : MUTED} />
            </View>

            <TouchableOpacity style={[s.listRow, s.rowDiv]} onPress={openSupport} activeOpacity={0.72}>
              <LinearGradient colors={['#10B981','#059669']} style={s.listIcon}>
                <Feather name="phone-call" size={13} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.listLabel}>Support Details</Text>
                <Text style={s.listSub}>{supportDetails.phone || 'Not configured'}</Text>
              </View>
              <Feather name="chevron-right" size={14} color={MUTED2} />
            </TouchableOpacity>

            {!!(user as any)?.isSuperAdmin && (
              <TouchableOpacity style={s.listRow} onPress={openPw} activeOpacity={0.72}>
                <LinearGradient colors={['#EF4444','#DC2626']} style={s.listIcon}>
                  <Feather name="lock" size={13} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.listLabel}>Change Password</Text>
                  <Text style={s.listSub}>Update credentials</Text>
                </View>
                <Feather name="chevron-right" size={14} color={MUTED2} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── ABOUT DNP360 ── */}
          <View style={[s.card, { overflow: 'hidden', borderColor: 'rgba(99,102,241,0.28)' }]}>
            {/* Background layers */}
            <LinearGradient colors={['rgba(99,102,241,0.18)','rgba(6,182,212,0.08)','rgba(7,11,26,0)']} style={StyleSheet.absoluteFill} />
            <View style={[s.aboutAccent, { width: 4, backgroundColor: INDIGO }]} />

            {/* Top — logo row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, paddingBottom: 12 }}>
              <LinearGradient colors={['#6366F1','#8B5CF6','#EC4899']} style={s.appIconWrap}>
                <Feather name="shield" size={22} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={{ color: TEXT, fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>DNP360</Text>
                  <View style={s.verBadge}>
                    <Text style={s.verTxt}>v2.1.0</Text>
                  </View>
                </View>
                <Text style={{ color: INDIGO, fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 2 }}>Nagar Parishad Daudnagar</Text>
                <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 1 }}>Bihar, India · Est. 2026</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: BD, marginHorizontal: 16 }} />

            {/* Info grid */}
            <View style={{ flexDirection: 'row', padding: 14, gap: 10 }}>
              {[
                { icon: 'map-pin', color: CYAN,  label: 'District',  value: 'Aurangabad' },
                { icon: 'globe',   color: GREEN, label: 'State',     value: 'Bihar' },
                { icon: 'server',  color: PINK,  label: 'Backend',   value: 'Firebase' },
                { icon: 'cpu',     color: AMBER, label: 'Platform',  value: 'React Native' },
              ].map(item => (
                <View key={item.label} style={s.aboutCell}>
                  <View style={[s.aboutCellIcon, { backgroundColor: item.color + '1A' }]}>
                    <Feather name={item.icon as any} size={11} color={item.color} />
                  </View>
                  <Text style={[s.aboutCellVal, { color: item.color }]}>{item.value}</Text>
                  <Text style={s.aboutCellLbl}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: BD, marginHorizontal: 16 }} />

            {/* Description */}
            <View style={{ padding: 14, paddingTop: 12, gap: 10 }}>
              <Text style={{ color: 'rgba(240,244,255,0.65)', fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 19 }}>
                A digital governance platform bridging <Text style={{ color: TEXT, fontFamily: 'Inter_600SemiBold' }}>citizens</Text>, <Text style={{ color: GREEN, fontFamily: 'Inter_600SemiBold' }}>Safai Karmis</Text>, and <Text style={{ color: AMBER, fontFamily: 'Inter_600SemiBold' }}>officials</Text> for efficient municipal service delivery under the Digital India initiative.
              </Text>

              {/* Feature tags */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: '🇮🇳 Digital India', c: INDIGO },
                  { label: '🏛 Smart Gov',      c: CYAN   },
                  { label: '♻ Swachh Bharat',  c: GREEN  },
                  { label: '📊 Open Data',      c: AMBER  },
                  { label: '🔐 Secure',         c: PINK   },
                ].map(t => (
                  <View key={t.label} style={{ backgroundColor: t.c + '14', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: t.c + '35' }}>
                    <Text style={{ color: t.c, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>{t.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Footer */}
            <LinearGradient colors={['rgba(99,102,241,0.12)','rgba(6,182,212,0.06)']} style={{ padding: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular' }}>© 2026 DNP360 · All rights reserved</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }} />
                <Text style={{ color: GREEN, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>Live · Production</Text>
              </View>
            </LinearGradient>
          </View>

          {/* ── SIGN OUT ── */}
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.85} style={s.logoutWrap}>
            <LinearGradient colors={['rgba(251,113,133,0.18)','rgba(239,68,68,0.08)']} style={s.logoutBtn}>
              <View style={s.logoutBar} />
              <LinearGradient colors={['#F97316','#EF4444']} style={s.logoutIcon}>
                <Feather name="log-out" size={17} color="#fff" />
              </LinearGradient>
              <Text style={s.logoutTxt}>Sign Out</Text>
              <View style={[s.logoutChev, { backgroundColor: 'rgba(251,113,133,0.14)' }]}>
                <Feather name="chevron-right" size={14} color={RED} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={{ color: MUTED, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', opacity: 0.6 }}>
            DNP360 · Nagar Parishad Daudnagar · Bihar, India
          </Text>

        </View>
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════
          EDIT PROFILE MODAL
      ══════════════════════════════════════════════════════════ */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#080E22' }}>
          <LinearGradient colors={['#1E1B4B','#312E81','#080E22']} style={m.hdr}>
            <View style={{ flex: 1 }}>
              <Text style={m.hdrTitle}>Edit Profile</Text>
              <Text style={m.hdrSub}>Update your info & photo</Text>
            </View>
            <Pressable style={m.closeBtn} onPress={() => setShowEdit(false)}>
              <Feather name="x" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
            {/* Avatar picker */}
            <View style={{ alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} style={m.avatarPickWrap}>
                <LinearGradient colors={['rgba(99,102,241,0.5)','rgba(139,92,246,0.2)','transparent']} style={m.avatarPickRing} />
                {editPhoto
                  ? <Image source={{ uri: editPhoto }} style={m.avatarPickImg} />
                  : user.avatar || user.photo
                    ? <Image source={{ uri: user.avatar ?? user.photo }} style={m.avatarPickImg} />
                    : (
                      <LinearGradient colors={['#6366F1','#8B5CF6','#EC4899']} style={m.avatarPickImg}>
                        <Text style={{ color: '#fff', fontSize: 32, fontFamily: 'Inter_700Bold' }}>{user.name[0].toUpperCase()}</Text>
                      </LinearGradient>
                    )
                }
                <View style={m.cameraOverlay}>
                  <Feather name="camera" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter_600SemiBold', marginTop: 3 }}>Change</Text>
                </View>
              </TouchableOpacity>
              <Text style={{ color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' }}>Tap to change photo</Text>
            </View>

            {[
              { label: 'Full Name *', value: editName,   set: setEditName,   icon: 'user',    ph: 'Your full name',  cap: 'words' as const,     num: false },
              { label: 'Mobile',      value: editMobile,  set: setEditMobile,  icon: 'phone',   ph: '10-digit number', cap: 'none' as const,      num: true  },
              { label: 'Address',     value: editAddr,    set: setEditAddr,    icon: 'map-pin', ph: 'Street, Ward…',   cap: 'sentences' as const, num: false },
            ].map(f => (
              <View key={f.label}>
                <Text style={m.fieldLbl}>{f.label}</Text>
                <View style={m.fieldWrap}>
                  <Feather name={f.icon as any} size={16} color={INDIGO} />
                  <TextInput style={m.fieldInput} value={f.value} onChangeText={f.set} autoCapitalize={f.cap} keyboardType={f.num ? 'phone-pad' : 'default'} placeholder={f.ph} placeholderTextColor={MUTED} />
                </View>
              </View>
            ))}

            <TouchableOpacity onPress={saveProfile} disabled={savingProfile} activeOpacity={0.85} style={savingProfile ? { opacity: 0.6 } : {}}>
              <LinearGradient colors={['#6366F1','#8B5CF6']} style={m.submitBtn}>
                <Feather name="check" size={16} color="#fff" />
                <Text style={m.submitTxt}>{savingProfile ? 'Saving…' : 'Save Changes'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          SUPPORT DETAILS MODAL
      ══════════════════════════════════════════════════════════ */}
      <Modal visible={showSupport} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#080E22' }}>
          <LinearGradient colors={['#064E3B','#065F46','#080E22']} style={m.hdr}>
            <View style={{ flex: 1 }}>
              <Text style={m.hdrTitle}>Support Details</Text>
              <Text style={m.hdrSub}>Citizen-facing contact info</Text>
            </View>
            <Pressable style={m.closeBtn} onPress={() => setShowSupport(false)}>
              <Feather name="x" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {[
              { label: 'Phone',   value: supPhone, set: setSupPhone, icon: 'phone',   ph: '06184-XXXXXX',          num: true  },
              { label: 'Email',   value: supEmail, set: setSupEmail, icon: 'mail',    ph: 'support@dnp360.in',     num: false },
              { label: 'Address', value: supAddr,  set: setSupAddr,  icon: 'map-pin', ph: 'Municipal Office…',     num: false },
              { label: 'Hours',   value: supHours, set: setSupHours, icon: 'clock',   ph: 'Mon–Sat, 10 AM – 5 PM', num: false },
            ].map(f => (
              <View key={f.label}>
                <Text style={m.fieldLbl}>{f.label}</Text>
                <View style={m.fieldWrap}>
                  <Feather name={f.icon as any} size={16} color={GREEN} />
                  <TextInput style={m.fieldInput} value={f.value} onChangeText={f.set} autoCapitalize="none" keyboardType={f.num ? 'phone-pad' : 'default'} placeholder={f.ph} placeholderTextColor={MUTED} />
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={saveSupport} disabled={savingSup} activeOpacity={0.85} style={savingSup ? { opacity: 0.6 } : {}}>
              <LinearGradient colors={['#10B981','#059669']} style={m.submitBtn}>
                <Feather name="save" size={16} color="#fff" />
                <Text style={m.submitTxt}>{savingSup ? 'Saving…' : 'Save Details'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          CHANGE PASSWORD MODAL
      ══════════════════════════════════════════════════════════ */}
      <Modal visible={showPw} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#080E22' }}>
          <LinearGradient colors={['#7F1D1D','#991B1B','#080E22']} style={m.hdr}>
            <View style={{ flex: 1 }}>
              <Text style={m.hdrTitle}>Change Password</Text>
              <Text style={m.hdrSub}>Minimum 6 characters</Text>
            </View>
            <Pressable style={m.closeBtn} onPress={() => setShowPw(false)}>
              <Feather name="x" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', paddingVertical: 4 }}>
              <LinearGradient colors={['#EF4444','#DC2626']} style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }}>
                <Feather name="lock" size={24} color="#fff" />
              </LinearGradient>
              <Text style={{ color: TEXT, fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 10 }}>Update Super Admin Password</Text>
            </View>

            {[
              { label: 'Current Password', val: curPw, set: setCurPw, show: showCur, setShow: setShowCur, color: RED   },
              { label: 'New Password',     val: newPw, set: setNewPw, show: showNew, setShow: setShowNew, color: RED   },
            ].map(f => (
              <View key={f.label}>
                <Text style={m.fieldLbl}>{f.label}</Text>
                <View style={m.fieldWrap}>
                  <Feather name="lock" size={16} color={f.color} />
                  <TextInput style={m.fieldInput} value={f.val} onChangeText={f.set} secureTextEntry={!f.show} placeholder={`Enter ${f.label.toLowerCase()}`} placeholderTextColor={MUTED} autoCapitalize="none" />
                  <Pressable onPress={() => f.setShow((v: boolean) => !v)} hitSlop={8}>
                    <Feather name={f.show ? 'eye-off' : 'eye'} size={15} color={MUTED} />
                  </Pressable>
                </View>
              </View>
            ))}

            {pwStrength && (
              <View style={{ gap: 5 }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[1,2,3,4].map(i => (
                    <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= pwStrength.bars ? pwStrength.color : BD }} />
                  ))}
                </View>
                <Text style={{ color: pwStrength.color, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                  {pwStrength.label}
                </Text>
              </View>
            )}

            <View>
              <Text style={m.fieldLbl}>Confirm New Password</Text>
              <View style={[m.fieldWrap, { borderColor: conPw && conPw !== newPw ? RED : BD }]}>
                <Feather name="check-circle" size={16} color={conPw && conPw === newPw ? GREEN : RED} />
                <TextInput style={m.fieldInput} value={conPw} onChangeText={setConPw} secureTextEntry={!showCon} placeholder="Re-enter new password" placeholderTextColor={MUTED} autoCapitalize="none" />
                <Pressable onPress={() => setShowCon(v => !v)} hitSlop={8}>
                  <Feather name={showCon ? 'eye-off' : 'eye'} size={15} color={MUTED} />
                </Pressable>
              </View>
              {conPw.length > 0 && conPw !== newPw && (
                <Text style={{ color: RED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4, marginLeft: 4 }}>Passwords do not match</Text>
              )}
            </View>

            <TouchableOpacity onPress={savePw} disabled={changingPw || !curPw || !newPw || !conPw} activeOpacity={0.85} style={[(!curPw || !newPw || !conPw || changingPw) && { opacity: 0.5 }]}>
              <LinearGradient colors={['#EF4444','#DC2626']} style={m.submitBtn}>
                <Feather name={changingPw ? 'loader' : 'check'} size={16} color="#fff" />
                <Text style={m.submitTxt}>{changingPw ? 'Updating…' : 'Update Password'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Main styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── compact strip ──
  strip:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: BD },
  stripLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },

  miniAvatarWrap: { width: 46, height: 46, position: 'relative', flexShrink: 0 },
  miniRing:    { position: 'absolute', inset: -2, borderRadius: 999 },
  miniInner:   { position: 'absolute', inset: 1.5, borderRadius: 999, overflow: 'hidden', backgroundColor: BG },
  miniImg:     { width: '100%', height: '100%', borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  miniLetter:  { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  miniOnline:  { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, backgroundColor: GREEN, borderWidth: 2, borderColor: BG },

  stripName:   { color: TEXT, fontSize: 14, fontFamily: 'Inter_700Bold' },
  stripEmail:  { color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular' },
  stripStatus: { color: GREEN, fontSize: 9, fontFamily: 'Inter_600SemiBold' },

  superBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(129,140,248,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(129,140,248,0.3)' },
  superBadgeTxt: { color: INDIGO, fontSize: 8, fontFamily: 'Inter_700Bold' },

  onlinePip:   { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  resetsPill:  { backgroundColor: 'rgba(252,211,77,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(252,211,77,0.35)' },
  resetsPillTxt: { color: AMBER, fontSize: 9, fontFamily: 'Inter_600SemiBold' },

  stripBtn:    { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(129,140,248,0.12)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.28)', justifyContent: 'center', alignItems: 'center' },

  // ── rate bar ──
  rateBar:     { paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BD },
  rateLabel:   { color: MUTED, fontSize: 10, fontFamily: 'Inter_500Medium' },
  rateVal:     { fontSize: 11, fontFamily: 'Inter_700Bold' },
  rateTrack:   { height: 4, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 99, overflow: 'hidden' },
  rateFill:    { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99 },

  // ── body ──
  body:        { padding: 16, gap: 14 },
  sectionLabel:{ color: TEXT, fontSize: 15, fontFamily: 'Inter_700Bold' },

  // stats grid — 4 columns
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statCell:    { width: '22%', flexGrow: 1, borderRadius: 16, borderWidth: 1, padding: 10, alignItems: 'center', gap: 5, overflow: 'hidden' },
  statIcon:    { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statVal:     { fontSize: 17, fontFamily: 'Inter_700Bold' },
  statLbl:     { color: MUTED, fontSize: 9, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },

  // card
  card:        { backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BD, overflow: 'hidden' },
  cardHdr:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, paddingBottom: 10 },
  cardIcon:    { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  cardTitle:   { color: TEXT, fontSize: 14, fontFamily: 'Inter_700Bold', flex: 1 },
  editChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(129,140,248,0.12)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(129,140,248,0.26)' },
  editChipTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: INDIGO },

  // list rows
  listRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rowDiv:      { borderBottomWidth: 1, borderBottomColor: BD },
  listIcon:    { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  listLabel:   { color: TEXT, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  listValue:   { fontSize: 15, fontFamily: 'Inter_700Bold', marginLeft: 'auto', marginRight: 6 },
  listSub:     { color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 1 },

  // about card
  aboutAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: INDIGO },
  appIconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  verBadge:    { backgroundColor: 'rgba(129,140,248,0.18)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(129,140,248,0.36)' },
  verTxt:      { color: INDIGO, fontSize: 10, fontFamily: 'Inter_700Bold' },
  aboutCell:   { flex: 1, alignItems: 'center', gap: 5 },
  aboutCellIcon:{ width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  aboutCellVal: { fontSize: 10, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  aboutCellLbl: { color: MUTED, fontSize: 9, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  // logout
  logoutWrap:  { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(251,113,133,0.28)' },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  logoutBar:   { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: RED },
  logoutIcon:  { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  logoutTxt:   { flex: 1, color: RED, fontSize: 15, fontFamily: 'Inter_700Bold' },
  logoutChev:  { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});

// ─── Modal styles ─────────────────────────────────────────────────────
const m = StyleSheet.create({
  hdr:        { flexDirection: 'row', alignItems: 'center', padding: 18, paddingBottom: 16, gap: 12 },
  hdrTitle:   { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  hdrSub:     { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  closeBtn:   { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  avatarPickWrap: { width: 110, height: 110, borderRadius: 55, position: 'relative' },
  avatarPickRing: { position: 'absolute', inset: -6, borderRadius: 999 },
  avatarPickImg:  { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  cameraOverlay:  { position: 'absolute', inset: 0, borderRadius: 55, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'center', alignItems: 'center' },

  fieldLbl:   { color: TEXT, fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  fieldWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, borderColor: BD, backgroundColor: CARD, paddingHorizontal: 14 },
  fieldInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 13, color: TEXT },
  submitBtn:  { borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitTxt:  { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
