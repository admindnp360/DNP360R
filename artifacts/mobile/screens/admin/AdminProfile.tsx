import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/contexts/AlertContext';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

// ── Glass design tokens ──────────────────────────────────────────────
const BG       = '#060B18';
const GLASS    = 'rgba(255,255,255,0.06)';
const GLASS_HI = 'rgba(255,255,255,0.09)';
const GLASS_BD = 'rgba(255,255,255,0.10)';
const TEXT     = '#F0F4FF';
const MUTED    = 'rgba(255,255,255,0.42)';

export default function AdminProfile() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { showAlert } = useAlert();
  const { users, complaints, notices, wards, houses, secretKeys, supportDetails, updateSupportDetails, passwordResetRequests } = useAppData();

  const [notifEnabled, setNotifEnabled]     = useState(true);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [currentPw, setCurrentPw]           = useState('');
  const [newPw, setNewPw]                   = useState('');
  const [confirmPw, setConfirmPw]           = useState('');
  const [showCurrentPw, setShowCurrentPw]   = useState(false);
  const [showNewPw, setShowNewPw]           = useState(false);
  const [showConfirmPw, setShowConfirmPw]   = useState(false);
  const [changingPw, setChangingPw]         = useState(false);
  const [editName, setEditName]             = useState('');
  const [editMobile, setEditMobile]         = useState('');
  const [editAddress, setEditAddress]       = useState('');
  const [savingProfile, setSavingProfile]   = useState(false);
  const [editPhone, setEditPhone]           = useState('');
  const [editEmail, setEditEmail]           = useState('');
  const [editSupportAddr, setEditSupportAddr] = useState('');
  const [editHours, setEditHours]           = useState('');
  const [saving, setSaving]                 = useState(false);

  if (!user) return null;

  const citizens  = users.filter(u => u.role === 'citizen').length;
  const workers   = users.filter(u => u.role === 'safaikarmi').length;
  const officials = users.filter(u => u.role === 'official').length;
  const resolved  = complaints.filter(c => c.status === 'resolved').length;
  const pending   = complaints.filter(c => c.status === 'submitted').length;
  const rate      = complaints.length > 0 ? Math.round((resolved / complaints.length) * 100) : 0;
  const pendingResets = passwordResetRequests.filter(r => r.status === 'pending').length;
  const activeKeys    = secretKeys.filter(k => k.isActive).length;

  function openEdit() {
    setEditName(user!.name); setEditMobile(user!.mobile ?? ''); setEditAddress(user!.address ?? '');
    setShowEditModal(true);
  }
  function openSupport() {
    setEditPhone(supportDetails.phone); setEditEmail(supportDetails.email);
    setEditSupportAddr(supportDetails.address); setEditHours(supportDetails.hours);
    setShowSupportModal(true);
  }
  async function handleSaveProfile() {
    if (!editName.trim()) { showAlert('Missing', 'Name cannot be empty.', undefined, 'warning'); return; }
    setSavingProfile(true);
    try {
      await updateProfile({ name: editName.trim(), mobile: editMobile.trim() || undefined, address: editAddress.trim() || undefined });
      setShowEditModal(false); showAlert('Updated', 'Profile saved successfully.', undefined, 'success');
    } finally { setSavingProfile(false); }
  }
  async function handleSaveSupport() {
    setSaving(true);
    try {
      await updateSupportDetails({ phone: editPhone.trim(), email: editEmail.trim(), address: editSupportAddr.trim(), hours: editHours.trim() });
      setShowSupportModal(false); showAlert('Saved', 'Support details updated.', undefined, 'success');
    } finally { setSaving(false); }
  }
  async function handleLogout() {
    showAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ], 'warning');
  }
  function openChangePw() {
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setShowCurrentPw(false); setShowNewPw(false); setShowConfirmPw(false);
    setShowChangePwModal(true);
  }
  async function handleChangePassword() {
    if (!newPw || !currentPw || !confirmPw) { showAlert('Missing Fields', 'Please fill in all fields.', undefined, 'warning'); return; }
    if (newPw !== confirmPw) { showAlert('Mismatch', 'New password and confirm password do not match.', undefined, 'warning'); return; }
    setChangingPw(true);
    try {
      const result = await changePassword(currentPw, newPw);
      if (result.success) {
        setShowChangePwModal(false);
        showAlert('Password Changed', 'Your password has been updated successfully.', undefined, 'success');
      } else {
        showAlert('Error', result.error ?? 'Failed to change password.', undefined, 'error');
      }
    } finally { setChangingPw(false); }
  }

  const QUICK_STATS = [
    { label: 'Citizens',  value: citizens,      icon: 'users',      color: '#818CF8', grad: ['#6366F1','#8B5CF6'] as const },
    { label: 'Workers',   value: workers,        icon: 'user-check', color: '#34D399', grad: ['#10B981','#059669'] as const },
    { label: 'Officials', value: officials,      icon: 'briefcase',  color: '#FCD34D', grad: ['#F59E0B','#EF4444'] as const },
    { label: 'Wards',     value: wards.length,   icon: 'map',        color: '#22D3EE', grad: ['#0EA5E9','#2563EB'] as const },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── HERO ── */}
        <View style={s.hero}>
          <LinearGradient colors={['#0F1A3E', '#0A1128', BG]} style={StyleSheet.absoluteFill} />
          {/* glow orbs */}
          <View style={[s.orb, { top: -40, right: -30, backgroundColor: 'rgba(99,102,241,0.20)', width: 180, height: 180 }]} />
          <View style={[s.orb, { top: 20, left: -50, backgroundColor: 'rgba(6,182,212,0.10)', width: 140, height: 140 }]} />

          {/* Top bar */}
          <View style={s.heroTopBar}>
            <View style={s.adminBadge}>
              <Feather name="shield" size={10} color="#818CF8" />
              <Text style={s.adminBadgeTxt}>System Administrator</Text>
            </View>
            <TouchableOpacity style={s.editIconBtn} onPress={openEdit} activeOpacity={0.8}>
              <Feather name="edit-2" size={15} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={s.avatarSection}>
            <View style={s.avatarOuterRing}>
              <View style={s.avatarMidRing}>
                <LinearGradient colors={['#6366F1', '#8B5CF6', '#EC4899']} style={s.avatarGrad}>
                  <Text style={s.avatarLetter}>{user.name[0].toUpperCase()}</Text>
                </LinearGradient>
              </View>
            </View>
            <View style={s.onlineDot} />
          </View>

          <Text style={s.heroName}>{user.name}</Text>
          <Text style={s.heroEmail}>{user.email}</Text>

          <View style={s.heroBadgeRow}>
            <View style={s.heroBadge}>
              <Feather name="check-circle" size={10} color="#34D399" />
              <Text style={s.heroBadgeTxt}>Verified · Full Access</Text>
            </View>
            <View style={[s.heroBadge, { borderColor: 'rgba(34,211,238,0.25)', backgroundColor: 'rgba(34,211,238,0.08)' }]}>
              <Feather name="calendar" size={10} color="#22D3EE" />
              <Text style={[s.heroBadgeTxt, { color: '#22D3EE' }]}>Since {user.createdAt}</Text>
            </View>
          </View>

          {/* Pending Reset Alert */}
          {pendingResets > 0 && (
            <TouchableOpacity style={s.resetAlert} onPress={() => router.push('/(tabs)/tertiary')} activeOpacity={0.85}>
              <Feather name="alert-circle" size={13} color="#FCD34D" />
              <Text style={s.resetAlertTxt}>{pendingResets} password reset{pendingResets > 1 ? 's' : ''} awaiting review</Text>
              <Feather name="arrow-right" size={12} color="#FCD34D" />
            </TouchableOpacity>
          )}
        </View>

        <View style={s.body}>

          {/* ── QUICK STATS ── */}
          <View style={s.quickRow}>
            {QUICK_STATS.map(stat => (
              <View key={stat.label} style={[s.quickCell, { backgroundColor: stat.color + '12', borderColor: stat.color + '28' }]}>
                <LinearGradient colors={stat.grad} style={s.quickIcon}>
                  <Feather name={stat.icon as any} size={14} color="#fff" />
                </LinearGradient>
                <Text style={[s.quickVal, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.quickLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* ── SYSTEM PERFORMANCE ── */}
          <View style={s.glassCard}>
            <View style={s.panelHdr}>
              <LinearGradient colors={['#F59E0B', '#EF4444']} style={s.panelHdrIcon}>
                <Feather name="activity" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.panelTitle}>System Performance</Text>
            </View>
            <View style={s.metricsRow}>
              {[
                { label: 'Total',    value: complaints.length, color: '#818CF8', icon: 'clipboard' },
                { label: 'Resolved', value: resolved,          color: '#34D399', icon: 'check-circle' },
                { label: 'Pending',  value: pending,           color: '#FB7185', icon: 'alert-circle' },
                { label: 'Rate',     value: `${rate}%`,        color: '#22D3EE', icon: 'trending-up' },
              ].map((m, i) => (
                <View key={m.label} style={[s.metricCell, i < 3 && s.metricDivider]}>
                  <Feather name={m.icon as any} size={14} color={m.color} />
                  <Text style={[s.metricVal, { color: m.color }]}>{m.value}</Text>
                  <Text style={s.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── PLATFORM OVERVIEW ── */}
          <View style={s.glassCard}>
            <View style={s.panelHdr}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={s.panelHdrIcon}>
                <Feather name="grid" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.panelTitle}>Platform Overview</Text>
            </View>
            {[
              { label: 'Active Notices',   value: notices.filter(n => n.isActive).length,  icon: 'volume-2', color: '#22D3EE', tab: '/(tabs)/tertiary'  },
              { label: 'Active Keys',      value: activeKeys,                              icon: 'key',      color: '#818CF8', tab: '/(tabs)/secondary' },
              { label: 'Reg. Houses',      value: houses.filter(h => h.isActive).length,  icon: 'home',     color: '#34D399', tab: '/(tabs)/tertiary'  },
              { label: 'Total Users',      value: users.length,                           icon: 'users',    color: '#FCD34D', tab: '/(tabs)/action'    },
            ].map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[s.overviewRow, i < arr.length - 1 && s.rowDivider]}
                onPress={() => router.push(item.tab as any)}
                activeOpacity={0.7}
              >
                <View style={[s.overviewIcon, { backgroundColor: item.color + '18' }]}>
                  <Feather name={item.icon as any} size={13} color={item.color} />
                </View>
                <Text style={s.overviewLabel}>{item.label}</Text>
                <Text style={[s.overviewValue, { color: item.color }]}>{item.value}</Text>
                <Feather name="chevron-right" size={13} color={MUTED} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ── ACCOUNT INFO ── */}
          <View style={s.glassCard}>
            <View style={s.panelHdr}>
              <LinearGradient colors={['#0EA5E9', '#2563EB']} style={s.panelHdrIcon}>
                <Feather name="user" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.panelTitle}>Account Information</Text>
              <TouchableOpacity onPress={openEdit} style={s.editChip} activeOpacity={0.8}>
                <Feather name="edit-2" size={10} color="#818CF8" />
                <Text style={s.editChipTxt}>Edit</Text>
              </TouchableOpacity>
            </View>
            {[
              { icon: 'mail',      grad: ['#6366F1','#8B5CF6'] as const, label: 'Email',        value: user.email },
              { icon: 'phone',     grad: ['#10B981','#059669'] as const, label: 'Mobile',       value: user.mobile ?? 'Not set' },
              { icon: 'hash',      grad: ['#0EA5E9','#2563EB'] as const, label: 'User ID',      value: user.role === 'superadmin' ? 'SUPERADMIN' : user.id },
              { icon: 'calendar',  grad: ['#EC4899','#DB2777'] as const, label: 'Member Since', value: user.createdAt ?? '—' },
            ].map((row, i, arr) => (
              <View key={row.label} style={[s.infoRow, i < arr.length - 1 && s.rowDivider]}>
                <LinearGradient colors={row.grad} style={s.infoRowIcon}>
                  <Feather name={row.icon as any} size={13} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoRowLabel}>{row.label}</Text>
                  <Text style={s.infoRowValue} numberOfLines={1}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── SETTINGS ── */}
          <View style={s.glassCard}>
            <View style={s.panelHdr}>
              <LinearGradient colors={['#6B7280', '#374151']} style={s.panelHdrIcon}>
                <Feather name="settings" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.panelTitle}>Settings</Text>
            </View>

            <View style={[s.infoRow, s.rowDivider]}>
              <LinearGradient colors={['#F59E0B', '#EF4444']} style={s.infoRowIcon}>
                <Feather name="bell" size={13} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.infoRowValue}>Notifications</Text>
                <Text style={s.infoRowLabel}>Alerts, complaints, notices</Text>
              </View>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: GLASS_BD, true: '#6366F1AA' }}
                thumbColor={notifEnabled ? '#818CF8' : MUTED}
              />
            </View>

            <TouchableOpacity style={[s.infoRow, s.rowDivider]} onPress={openSupport} activeOpacity={0.7}>
              <LinearGradient colors={['#10B981', '#059669']} style={s.infoRowIcon}>
                <Feather name="phone-call" size={13} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.infoRowValue}>Edit Support Details</Text>
                <Text style={s.infoRowLabel}>{supportDetails.phone}</Text>
              </View>
              <Feather name="chevron-right" size={14} color={MUTED} />
            </TouchableOpacity>

            {!!(user as any)?.isSuperAdmin && (
              <TouchableOpacity style={s.infoRow} onPress={openChangePw} activeOpacity={0.7}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={s.infoRowIcon}>
                  <Feather name="lock" size={13} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoRowValue}>Change Password</Text>
                  <Text style={s.infoRowLabel}>Update Super Admin credentials</Text>
                </View>
                <Feather name="chevron-right" size={14} color={MUTED} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── ABOUT DNP360 ── */}
          <View style={[s.glassCard, { overflow: 'hidden' }]}>
            <LinearGradient colors={['rgba(99,102,241,0.20)', 'rgba(139,92,246,0.10)', 'rgba(6,182,212,0.08)']} style={StyleSheet.absoluteFill} />
            <View style={[s.aboutBorder, { backgroundColor: '#6366F1' }]} />
            <View style={s.aboutContent}>
              <View style={s.aboutTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.aboutName}>DNP360</Text>
                  <Text style={s.aboutVer}>v1.0.0 · Nagar Parishad Daudnagar</Text>
                  <Text style={s.aboutSub}>Bihar, India · Digital India Initiative</Text>
                </View>
                <LinearGradient colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.06)']} style={s.aboutShield}>
                  <Feather name="shield" size={26} color="rgba(255,255,255,0.9)" />
                </LinearGradient>
              </View>
              <Text style={s.aboutDesc}>
                Smart governance connecting citizens, Safai Karmis, and officials for efficient municipal management.
              </Text>
              <View style={s.aboutTags}>
                {['Digital India', 'Smart Gov', 'Bihar', 'Open Data'].map(tag => (
                  <View key={tag} style={s.aboutTag}>
                    <Text style={s.aboutTagTxt}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── SIGN OUT ── */}
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.85} style={s.logoutWrap}>
            <LinearGradient colors={['rgba(251,113,133,0.18)', 'rgba(239,68,68,0.10)']} style={s.logoutBtn}>
              <View style={s.logoutLeft} />
              <View style={s.logoutIcon}>
                <Feather name="log-out" size={18} color="#FB7185" />
              </View>
              <Text style={s.logoutTxt}>Sign Out</Text>
              <Feather name="chevron-right" size={16} color="#FB7185" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={s.footer}>DNP360 · Nagar Parishad Daudnagar · Bihar, India</Text>
        </View>
      </ScrollView>

      {/* ══════════════════════════════════
           EDIT PROFILE MODAL
         ══════════════════════════════════ */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#080E22' }}>
          <LinearGradient colors={['#0D1B4B', '#1A237E']} style={s.modalHdr}>
            <Text style={s.modalHdrTitle}>Edit Profile</Text>
            <Pressable style={s.closeBtn} onPress={() => setShowEditModal(false)}>
              <Feather name="x" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <View style={s.editPreview}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={s.editAvatar}>
                <Text style={s.editAvatarLetter}>{(editName[0] ?? user.name[0] ?? '?').toUpperCase()}</Text>
              </LinearGradient>
              <View>
                <Text style={s.editPreviewName}>{editName || user.name}</Text>
                <Text style={s.editPreviewRole}>System Administrator</Text>
              </View>
            </View>
            {[
              { label: 'Full Name *', value: editName,    setter: setEditName,    icon: 'user',    ph: 'Your full name',   caps: 'words' as const,     key: 'name' },
              { label: 'Mobile',      value: editMobile,  setter: setEditMobile,  icon: 'phone',   ph: '10-digit number',  caps: 'none' as const,  key: 'mobile', num: true },
              { label: 'Address',     value: editAddress, setter: setEditAddress, icon: 'map-pin', ph: 'Street, Ward…',    caps: 'sentences' as const, key: 'addr' },
            ].map(f => (
              <View key={f.key}>
                <Text style={[s.fieldLabel, { color: TEXT }]}>{f.label}</Text>
                <View style={[s.fieldWrap, { backgroundColor: GLASS, borderColor: GLASS_BD }]}>
                  <Feather name={f.icon as any} size={16} color="#818CF8" />
                  <TextInput
                    style={[s.fieldInput, { color: TEXT }]}
                    value={f.value} onChangeText={f.setter}
                    autoCapitalize={f.caps}
                    keyboardType={(f as any).num ? 'phone-pad' : 'default'}
                    placeholder={f.ph} placeholderTextColor={MUTED}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={handleSaveProfile} disabled={savingProfile} activeOpacity={0.85} style={savingProfile ? { opacity: 0.6 } : {}}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={s.submitBtn}>
                <Feather name="check" size={16} color="#fff" />
                <Text style={s.submitBtnTxt}>{savingProfile ? 'Saving…' : 'Save Changes'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════════════════════════════
           EDIT SUPPORT MODAL
         ══════════════════════════════════ */}
      <Modal visible={showSupportModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#080E22' }}>
          <LinearGradient colors={['#064E3B', '#065F46']} style={s.modalHdr}>
            <Text style={s.modalHdrTitle}>Edit Support Details</Text>
            <Pressable style={s.closeBtn} onPress={() => setShowSupportModal(false)}>
              <Feather name="x" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {[
              { label: 'Phone Number',   value: editPhone,       setter: setEditPhone,       key: 'phone', ph: '06184-XXXXXX',           icon: 'phone',   num: true },
              { label: 'Email',          value: editEmail,       setter: setEditEmail,       key: 'email', ph: 'support@dnp360.in',      icon: 'mail',    num: false },
              { label: 'Office Address', value: editSupportAddr, setter: setEditSupportAddr, key: 'addr',  ph: 'Municipal Office…',      icon: 'map-pin', num: false },
              { label: 'Office Hours',   value: editHours,       setter: setEditHours,       key: 'hrs',   ph: 'Mon–Sat, 10 AM – 5 PM', icon: 'clock',   num: false },
            ].map(f => (
              <View key={f.key}>
                <Text style={[s.fieldLabel, { color: TEXT }]}>{f.label}</Text>
                <View style={[s.fieldWrap, { backgroundColor: GLASS, borderColor: GLASS_BD }]}>
                  <Feather name={f.icon as any} size={16} color="#34D399" />
                  <TextInput
                    style={[s.fieldInput, { color: TEXT }]}
                    value={f.value} onChangeText={f.setter}
                    autoCapitalize="none"
                    keyboardType={f.num ? 'phone-pad' : 'default'}
                    placeholder={f.ph} placeholderTextColor={MUTED}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={handleSaveSupport} disabled={saving} activeOpacity={0.85} style={saving ? { opacity: 0.6 } : {}}>
              <LinearGradient colors={['#10B981', '#059669']} style={s.submitBtn}>
                <Feather name="save" size={16} color="#fff" />
                <Text style={s.submitBtnTxt}>{saving ? 'Saving…' : 'Save Support Details'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════════════════════════════
           CHANGE PASSWORD MODAL
         ══════════════════════════════════ */}
      <Modal visible={showChangePwModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#080E22' }}>
          <LinearGradient colors={['#7F1D1D', '#DC2626']} style={s.modalHdr}>
            <Text style={s.modalHdrTitle}>Change Password</Text>
            <Pressable style={s.closeBtn} onPress={() => setShowChangePwModal(false)}>
              <Feather name="x" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <LinearGradient colors={['#EF4444', '#DC2626']} style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }}>
                <Feather name="lock" size={28} color="#fff" />
              </LinearGradient>
              <Text style={{ color: TEXT, fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 12 }}>Update Super Admin Password</Text>
              <Text style={{ color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }}>
                Enter your current password, then choose a new one. Min 6 characters.
              </Text>
            </View>

            {[
              { label: 'Current Password', value: currentPw, setter: setCurrentPw, show: showCurrentPw, setShow: setShowCurrentPw, icon: 'lock', color: '#FB7185' },
              { label: 'New Password',     value: newPw,     setter: setNewPw,     show: showNewPw,     setShow: setShowNewPw,     icon: 'key',  color: '#FB7185' },
            ].map(f => (
              <View key={f.label}>
                <Text style={[s.fieldLabel, { color: TEXT }]}>{f.label}</Text>
                <View style={[s.fieldWrap, { backgroundColor: GLASS, borderColor: GLASS_BD }]}>
                  <Feather name={f.icon as any} size={16} color={f.color} />
                  <TextInput
                    style={[s.fieldInput, { color: TEXT }]}
                    value={f.value} onChangeText={f.setter}
                    secureTextEntry={!f.show}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                    placeholderTextColor={MUTED}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => f.setShow((v: boolean) => !v)} hitSlop={8}>
                    <Feather name={f.show ? 'eye-off' : 'eye'} size={16} color={MUTED} />
                  </Pressable>
                </View>
              </View>
            ))}

            {/* Strength indicator */}
            {newPw.length > 0 && (
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: newPw.length >= i * 2 ? (newPw.length >= 8 ? '#34D399' : newPw.length >= 6 ? '#FCD34D' : '#FB7185') : GLASS_BD }} />
                  ))}
                </View>
                <Text style={{ color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
                  Strength: {newPw.length < 4 ? 'Weak' : newPw.length < 6 ? 'Fair' : newPw.length < 8 ? 'Good' : 'Strong'}
                </Text>
              </View>
            )}

            <View>
              <Text style={[s.fieldLabel, { color: TEXT }]}>Confirm New Password</Text>
              <View style={[s.fieldWrap, { backgroundColor: GLASS, borderColor: confirmPw && confirmPw !== newPw ? '#FB7185' : GLASS_BD }]}>
                <Feather name="check-circle" size={16} color={confirmPw && confirmPw === newPw ? '#34D399' : '#FB7185'} />
                <TextInput
                  style={[s.fieldInput, { color: TEXT }]}
                  value={confirmPw} onChangeText={setConfirmPw}
                  secureTextEntry={!showConfirmPw}
                  placeholder="Re-enter new password"
                  placeholderTextColor={MUTED}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowConfirmPw(v => !v)} hitSlop={8}>
                  <Feather name={showConfirmPw ? 'eye-off' : 'eye'} size={16} color={MUTED} />
                </Pressable>
              </View>
              {confirmPw.length > 0 && confirmPw !== newPw && (
                <Text style={{ color: '#FB7185', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4, marginLeft: 4 }}>Passwords do not match</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={changingPw || !currentPw || !newPw || !confirmPw}
              activeOpacity={0.85}
              style={[(!currentPw || !newPw || !confirmPw || changingPw) && { opacity: 0.5 }]}
            >
              <LinearGradient colors={['#EF4444', '#DC2626']} style={s.submitBtn}>
                <Feather name={changingPw ? 'loader' : 'check'} size={16} color="#fff" />
                <Text style={s.submitBtnTxt}>{changingPw ? 'Updating…' : 'Update Password'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  orb: { position: 'absolute', borderRadius: 999 },

  // ── hero
  hero: { overflow: 'hidden', paddingBottom: 28 },
  heroTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, marginBottom: 22 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(129,140,248,0.14)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(129,140,248,0.30)' },
  adminBadgeTxt: { color: '#818CF8', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  editIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: GLASS_HI, borderWidth: 1, borderColor: GLASS_BD, justifyContent: 'center', alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 16, position: 'relative' },
  avatarOuterRing: { width: 102, height: 102, borderRadius: 51, borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.40)', justifyContent: 'center', alignItems: 'center' },
  avatarMidRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.50)', justifyContent: 'center', alignItems: 'center' },
  avatarGrad: { width: 78, height: 78, borderRadius: 39, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 32, fontFamily: 'Inter_700Bold' },
  onlineDot: { position: 'absolute', bottom: 4, right: '36%', width: 14, height: 14, borderRadius: 7, backgroundColor: '#34D399', borderWidth: 2, borderColor: BG },
  heroName: { color: TEXT, fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center', paddingHorizontal: 20 },
  heroEmpId: { color: '#818CF8', fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'center', marginTop: 3 },
  heroEmail: { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 2, marginBottom: 12 },
  heroBadgeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(52,211,153,0.10)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)' },
  heroBadgeTxt: { color: '#34D399', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  resetAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(252,211,77,0.10)', marginHorizontal: 20, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(252,211,77,0.28)' },
  resetAlertTxt: { flex: 1, color: '#FCD34D', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  // ── body
  body: { padding: 16, gap: 18 },

  // ── quick stats
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCell: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 12, alignItems: 'center', gap: 6 },
  quickIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickVal:  { fontSize: 20, fontFamily: 'Inter_700Bold' },
  quickLabel:{ color: MUTED, fontSize: 10, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },

  // ── glass card / panel
  glassCard:    { backgroundColor: GLASS, borderRadius: 20, borderWidth: 1, borderColor: GLASS_BD, overflow: 'hidden' },
  panelHdr:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 10 },
  panelHdrIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  panelTitle:   { color: TEXT, fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1 },
  editChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(129,140,248,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(129,140,248,0.28)' },
  editChipTxt:  { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#818CF8' },

  // ── metrics
  metricsRow:   { flexDirection: 'row', borderTopWidth: 1, borderTopColor: GLASS_BD },
  metricCell:   { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  metricDivider:{ borderRightWidth: 1, borderRightColor: GLASS_BD },
  metricVal:    { fontSize: 20, fontFamily: 'Inter_700Bold' },
  metricLabel:  { color: MUTED, fontSize: 9, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.4 },

  // ── overview rows
  overviewRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rowDivider:   { borderBottomWidth: 1, borderBottomColor: GLASS_BD },
  overviewIcon: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  overviewLabel:{ flex: 1, color: TEXT, fontSize: 13, fontFamily: 'Inter_500Medium' },
  overviewValue:{ fontSize: 16, fontFamily: 'Inter_700Bold' },

  // ── info rows
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  infoRowIcon:  { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  infoRowLabel: { color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 1 },
  infoRowValue: { color: TEXT, fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // ── about
  aboutContent: { padding: 20, gap: 12 },
  aboutBorder:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  aboutTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  aboutName:    { color: TEXT, fontSize: 22, fontFamily: 'Inter_700Bold' },
  aboutVer:     { color: MUTED, fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 3 },
  aboutSub:     { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2, opacity: 0.7 },
  aboutShield:  { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  aboutDesc:    { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  aboutTags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  aboutTag:     { backgroundColor: GLASS_HI, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: GLASS_BD },
  aboutTagTxt:  { color: TEXT, fontSize: 10, fontFamily: 'Inter_600SemiBold', opacity: 0.8 },

  // ── sign out
  logoutWrap: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(251,113,133,0.28)' },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  logoutLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#FB7185' },
  logoutIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(251,113,133,0.14)', justifyContent: 'center', alignItems: 'center' },
  logoutTxt:  { flex: 1, color: '#FB7185', fontSize: 15, fontFamily: 'Inter_700Bold' },

  footer: { color: MUTED, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: -6 },

  // ── modals
  modalHdr:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  modalHdrTitle: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  closeBtn:      { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  editPreview:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, backgroundColor: GLASS, borderWidth: 1, borderColor: GLASS_BD },
  editAvatar:      { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  editAvatarLetter:{ color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  editPreviewName: { color: TEXT, fontSize: 16, fontFamily: 'Inter_700Bold' },
  editPreviewRole: { color: '#818CF8', fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 2 },

  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  fieldWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  fieldInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 14 },
  submitBtn:  { borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitBtnTxt: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
