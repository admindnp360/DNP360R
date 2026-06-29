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

const BG     = '#060B18';
const GLASS  = 'rgba(255,255,255,0.06)';
const GLASS2 = 'rgba(255,255,255,0.10)';
const BD     = 'rgba(255,255,255,0.11)';
const TEXT   = '#F0F4FF';
const MUTED  = 'rgba(255,255,255,0.40)';

export default function AdminProfile() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { showAlert } = useAlert();
  const { users, complaints, notices, wards, houses, secretKeys, supportDetails, updateSupportDetails, passwordResetRequests } = useAppData();

  const [notifEnabled, setNotifEnabled]         = useState(true);
  const [showEditModal, setShowEditModal]         = useState(false);
  const [showSupportModal, setShowSupportModal]   = useState(false);
  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [currentPw, setCurrentPw]               = useState('');
  const [newPw, setNewPw]                       = useState('');
  const [confirmPw, setConfirmPw]               = useState('');
  const [showCurrentPw, setShowCurrentPw]       = useState(false);
  const [showNewPw, setShowNewPw]               = useState(false);
  const [showConfirmPw, setShowConfirmPw]       = useState(false);
  const [changingPw, setChangingPw]             = useState(false);
  const [editName, setEditName]                 = useState('');
  const [editMobile, setEditMobile]             = useState('');
  const [editAddress, setEditAddress]           = useState('');
  const [savingProfile, setSavingProfile]       = useState(false);
  const [editPhone, setEditPhone]               = useState('');
  const [editEmail, setEditEmail]               = useState('');
  const [editSupportAddr, setEditSupportAddr]   = useState('');
  const [editHours, setEditHours]               = useState('');
  const [saving, setSaving]                     = useState(false);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── COMPACT PROFILE HEADER ── */}
        <View style={s.profileHeader}>
          <View style={s.profileHeaderInner}>
            {/* Avatar + info row */}
            <View style={s.profileRow}>
              <View style={s.avatarWrap}>
                <LinearGradient colors={['#6366F1', '#8B5CF6', '#EC4899']} style={s.avatar}>
                  <Text style={s.avatarLetter}>{user.name[0].toUpperCase()}</Text>
                </LinearGradient>
                <View style={s.onlineDot} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.rolePill}>
                  <Feather name="shield" size={9} color="#818CF8" />
                  <Text style={s.rolePillTxt}>System Administrator</Text>
                </View>
                <Text style={s.profileName} numberOfLines={1}>{user.name}</Text>
                <Text style={s.profileEmail} numberOfLines={1}>{user.email}</Text>
              </View>
              <TouchableOpacity style={s.editBtn} onPress={openEdit} activeOpacity={0.8}>
                <Feather name="edit-2" size={14} color="#818CF8" />
              </TouchableOpacity>
            </View>

            {/* Tags row */}
            <View style={s.tagsRow}>
              <View style={s.tag}>
                <Feather name="check-circle" size={9} color="#34D399" />
                <Text style={[s.tagTxt, { color: '#34D399' }]}>Verified · Full Access</Text>
              </View>
              {pendingResets > 0 && (
                <TouchableOpacity style={[s.tag, { borderColor: 'rgba(252,211,77,0.30)', backgroundColor: 'rgba(252,211,77,0.10)' }]} onPress={() => router.push('/(tabs)/tertiary')} activeOpacity={0.8}>
                  <Feather name="alert-circle" size={9} color="#FCD34D" />
                  <Text style={[s.tagTxt, { color: '#FCD34D' }]}>{pendingResets} reset{pendingResets > 1 ? 's' : ''} pending</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={s.body}>

          {/* ── QUICK STATS ── */}
          <View style={s.statsRow}>
            {[
              { label: 'Citizens',  value: citizens,    icon: 'users',      color: '#818CF8', grad: ['#6366F1','#8B5CF6'] as const },
              { label: 'Workers',   value: workers,     icon: 'user-check', color: '#34D399', grad: ['#10B981','#059669'] as const },
              { label: 'Officials', value: officials,   icon: 'briefcase',  color: '#FCD34D', grad: ['#F59E0B','#EF4444'] as const },
              { label: 'Wards',     value: wards.length,icon: 'map',        color: '#22D3EE', grad: ['#0EA5E9','#2563EB'] as const },
            ].map(stat => (
              <View key={stat.label} style={[s.statCell, { borderColor: stat.color + '28' }]}>
                <LinearGradient colors={[stat.color + '20', stat.color + '08']} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={stat.grad} style={s.statIcon}>
                  <Feather name={stat.icon as any} size={13} color="#fff" />
                </LinearGradient>
                <Text style={[s.statVal, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.statLbl}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* ── SYSTEM PERFORMANCE ── */}
          <View style={s.card}>
            <View style={s.cardHdr}>
              <LinearGradient colors={['#F59E0B', '#EF4444']} style={s.cardHdrIcon}>
                <Feather name="activity" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.cardTitle}>System Performance</Text>
            </View>
            <View style={s.metricsRow}>
              {[
                { label: 'Total',    value: complaints.length, color: '#818CF8', icon: 'clipboard'   },
                { label: 'Resolved', value: resolved,          color: '#34D399', icon: 'check-circle' },
                { label: 'Pending',  value: pending,           color: '#FB7185', icon: 'alert-circle' },
                { label: 'Rate',     value: `${rate}%`,        color: '#22D3EE', icon: 'trending-up'  },
              ].map((m, i) => (
                <View key={m.label} style={[s.metricCell, i < 3 && s.metricDiv]}>
                  <Feather name={m.icon as any} size={13} color={m.color} />
                  <Text style={[s.metricVal, { color: m.color }]}>{m.value}</Text>
                  <Text style={s.metricLbl}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── PLATFORM OVERVIEW ── */}
          <View style={s.card}>
            <View style={s.cardHdr}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={s.cardHdrIcon}>
                <Feather name="grid" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.cardTitle}>Platform Overview</Text>
            </View>
            {[
              { label: 'Active Notices', value: notices.filter(n => n.isActive).length, icon: 'volume-2', color: '#22D3EE', tab: '/(tabs)/tertiary'  },
              { label: 'Active Keys',    value: activeKeys,                             icon: 'key',      color: '#818CF8', tab: '/(tabs)/secondary' },
              { label: 'Reg. Houses',    value: houses.filter(h => h.isActive).length, icon: 'home',     color: '#34D399', tab: '/(tabs)/tertiary'  },
              { label: 'Total Users',    value: users.length,                          icon: 'users',    color: '#FCD34D', tab: '/(tabs)/action'    },
            ].map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[s.listRow, i < arr.length - 1 && s.rowDiv]}
                onPress={() => router.push(item.tab as any)}
                activeOpacity={0.7}
              >
                <View style={[s.listIcon, { backgroundColor: item.color + '18' }]}>
                  <Feather name={item.icon as any} size={13} color={item.color} />
                </View>
                <Text style={s.listLabel}>{item.label}</Text>
                <Text style={[s.listValue, { color: item.color }]}>{item.value}</Text>
                <Feather name="chevron-right" size={13} color={MUTED} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ── ACCOUNT INFO ── */}
          <View style={s.card}>
            <View style={s.cardHdr}>
              <LinearGradient colors={['#0EA5E9', '#2563EB']} style={s.cardHdrIcon}>
                <Feather name="user" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.cardTitle}>Account Information</Text>
              <TouchableOpacity onPress={openEdit} style={s.editChip} activeOpacity={0.8}>
                <Feather name="edit-2" size={10} color="#818CF8" />
                <Text style={s.editChipTxt}>Edit</Text>
              </TouchableOpacity>
            </View>
            {[
              { icon: 'mail',     grad: ['#6366F1','#8B5CF6'] as const, label: 'Email',        value: user.email },
              { icon: 'phone',    grad: ['#10B981','#059669'] as const, label: 'Mobile',       value: user.mobile ?? 'Not set' },
              { icon: 'hash',     grad: ['#0EA5E9','#2563EB'] as const, label: 'User ID',      value: (user.role as string) === 'superadmin' ? 'SUPERADMIN' : user.id },
              { icon: 'calendar', grad: ['#EC4899','#DB2777'] as const, label: 'Member Since', value: user.createdAt ?? '—' },
            ].map((row, i, arr) => (
              <View key={row.label} style={[s.listRow, i < arr.length - 1 && s.rowDiv]}>
                <LinearGradient colors={row.grad} style={s.listIcon}>
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
              <LinearGradient colors={['#6B7280', '#374151']} style={s.cardHdrIcon}>
                <Feather name="settings" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.cardTitle}>Settings</Text>
            </View>

            <View style={[s.listRow, s.rowDiv]}>
              <LinearGradient colors={['#F59E0B', '#EF4444']} style={s.listIcon}>
                <Feather name="bell" size={13} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.listLabel}>Notifications</Text>
                <Text style={s.listSub}>Alerts, complaints, notices</Text>
              </View>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: BD, true: '#6366F1AA' }}
                thumbColor={notifEnabled ? '#818CF8' : MUTED}
              />
            </View>

            <TouchableOpacity style={[s.listRow, s.rowDiv]} onPress={openSupport} activeOpacity={0.7}>
              <LinearGradient colors={['#10B981', '#059669']} style={s.listIcon}>
                <Feather name="phone-call" size={13} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.listLabel}>Edit Support Details</Text>
                <Text style={s.listSub}>{supportDetails.phone}</Text>
              </View>
              <Feather name="chevron-right" size={14} color={MUTED} />
            </TouchableOpacity>

            {!!(user as any)?.isSuperAdmin && (
              <TouchableOpacity style={s.listRow} onPress={openChangePw} activeOpacity={0.7}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={s.listIcon}>
                  <Feather name="lock" size={13} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.listLabel}>Change Password</Text>
                  <Text style={s.listSub}>Update Super Admin credentials</Text>
                </View>
                <Feather name="chevron-right" size={14} color={MUTED} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── ABOUT DNP360 ── */}
          <View style={[s.card, { overflow: 'hidden' }]}>
            <LinearGradient colors={['rgba(99,102,241,0.18)', 'rgba(6,182,212,0.07)']} style={StyleSheet.absoluteFill} />
            <View style={s.aboutAccent} />
            <View style={s.aboutContent}>
              <View style={s.aboutTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.aboutName}>DNP360</Text>
                  <Text style={s.aboutVer}>v1.0.0 · Nagar Parishad Daudnagar</Text>
                  <Text style={s.aboutSub}>Bihar, India · Digital India Initiative</Text>
                </View>
                <LinearGradient colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.05)']} style={s.aboutShield}>
                  <Feather name="shield" size={24} color="rgba(255,255,255,0.9)" />
                </LinearGradient>
              </View>
              <Text style={s.aboutDesc}>Smart governance connecting citizens, Safai Karmis, and officials for efficient municipal management.</Text>
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
            <LinearGradient colors={['rgba(251,113,133,0.16)', 'rgba(239,68,68,0.08)']} style={s.logoutBtn}>
              <View style={s.logoutAccent} />
              <View style={s.logoutIcon}>
                <Feather name="log-out" size={17} color="#FB7185" />
              </View>
              <Text style={s.logoutTxt}>Sign Out</Text>
              <Feather name="chevron-right" size={15} color="#FB7185" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={s.footer}>DNP360 · Nagar Parishad Daudnagar · Bihar, India</Text>
        </View>
      </ScrollView>

      {/* ── EDIT PROFILE MODAL ── */}
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
              { label: 'Full Name *', value: editName,    setter: setEditName,    icon: 'user',    ph: 'Your full name',  caps: 'words' as const,     key: 'name' },
              { label: 'Mobile',      value: editMobile,  setter: setEditMobile,  icon: 'phone',   ph: '10-digit number', caps: 'none' as const,      key: 'mobile', num: true },
              { label: 'Address',     value: editAddress, setter: setEditAddress, icon: 'map-pin', ph: 'Street, Ward…',   caps: 'sentences' as const, key: 'addr' },
            ].map(f => (
              <View key={f.key}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <View style={s.fieldWrap}>
                  <Feather name={f.icon as any} size={16} color="#818CF8" />
                  <TextInput
                    style={s.fieldInput}
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

      {/* ── EDIT SUPPORT MODAL ── */}
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
              { label: 'Phone Number',   value: editPhone,       setter: setEditPhone,       key: 'phone', ph: '06184-XXXXXX',          icon: 'phone',   num: true  },
              { label: 'Email',          value: editEmail,       setter: setEditEmail,       key: 'email', ph: 'support@dnp360.in',     icon: 'mail',    num: false },
              { label: 'Office Address', value: editSupportAddr, setter: setEditSupportAddr, key: 'addr',  ph: 'Municipal Office…',     icon: 'map-pin', num: false },
              { label: 'Office Hours',   value: editHours,       setter: setEditHours,       key: 'hrs',   ph: 'Mon–Sat, 10 AM – 5 PM',icon: 'clock',   num: false },
            ].map(f => (
              <View key={f.key}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <View style={s.fieldWrap}>
                  <Feather name={f.icon as any} size={16} color="#34D399" />
                  <TextInput
                    style={s.fieldInput}
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

      {/* ── CHANGE PASSWORD MODAL ── */}
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
              <LinearGradient colors={['#EF4444', '#DC2626']} style={{ width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }}>
                <Feather name="lock" size={26} color="#fff" />
              </LinearGradient>
              <Text style={{ color: TEXT, fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 12 }}>Update Super Admin Password</Text>
              <Text style={{ color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }}>
                Enter your current password, then choose a new one. Min 6 characters.
              </Text>
            </View>

            {[
              { label: 'Current Password', value: currentPw, setter: setCurrentPw, show: showCurrentPw, setShow: setShowCurrentPw, icon: 'lock', color: '#FB7185' },
              { label: 'New Password',     value: newPw,     setter: setNewPw,     show: showNewPw,     setShow: setShowNewPw,     icon: 'key',  color: '#FB7185' },
            ].map(f => (
              <View key={f.label}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <View style={s.fieldWrap}>
                  <Feather name={f.icon as any} size={16} color={f.color} />
                  <TextInput
                    style={s.fieldInput}
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

            {newPw.length > 0 && (
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: newPw.length >= i * 2 ? (newPw.length >= 8 ? '#34D399' : newPw.length >= 6 ? '#FCD34D' : '#FB7185') : BD }} />
                  ))}
                </View>
                <Text style={{ color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
                  Strength: {newPw.length < 4 ? 'Weak' : newPw.length < 6 ? 'Fair' : newPw.length < 8 ? 'Good' : 'Strong'}
                </Text>
              </View>
            )}

            <View>
              <Text style={s.fieldLabel}>Confirm New Password</Text>
              <View style={[s.fieldWrap, { borderColor: confirmPw && confirmPw !== newPw ? '#FB7185' : BD }]}>
                <Feather name="check-circle" size={16} color={confirmPw && confirmPw === newPw ? '#34D399' : '#FB7185'} />
                <TextInput
                  style={s.fieldInput}
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
  // ── profile header
  profileHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  profileHeaderInner: { backgroundColor: GLASS, borderRadius: 22, borderWidth: 1, borderColor: BD, padding: 16, gap: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 24, fontFamily: 'Inter_700Bold' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: '#34D399', borderWidth: 2, borderColor: BG },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(129,140,248,0.14)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(129,140,248,0.26)', alignSelf: 'flex-start', marginBottom: 4 },
  rolePillTxt: { color: '#818CF8', fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  profileName: { color: TEXT, fontSize: 17, fontFamily: 'Inter_700Bold' },
  profileEmail: { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(129,140,248,0.12)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.24)', justifyContent: 'center', alignItems: 'center' },
  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(52,211,153,0.10)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)' },
  tagTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  // ── body
  body: { padding: 16, gap: 14 },

  // ── stats
  statsRow: { flexDirection: 'row', gap: 8 },
  statCell: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 10, alignItems: 'center', gap: 5, overflow: 'hidden' },
  statIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  statVal:  { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLbl:  { color: MUTED, fontSize: 9, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },

  // ── card
  card: { backgroundColor: GLASS, borderRadius: 20, borderWidth: 1, borderColor: BD, overflow: 'hidden' },
  cardHdr: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, paddingBottom: 10 },
  cardHdrIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: TEXT, fontSize: 14, fontFamily: 'Inter_700Bold', flex: 1 },
  editChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(129,140,248,0.12)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(129,140,248,0.26)' },
  editChipTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#818CF8' },

  // ── metrics
  metricsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: BD },
  metricCell: { flex: 1, alignItems: 'center', paddingVertical: 13, gap: 3 },
  metricDiv:  { borderRightWidth: 1, borderRightColor: BD },
  metricVal:  { fontSize: 19, fontFamily: 'Inter_700Bold' },
  metricLbl:  { color: MUTED, fontSize: 9, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.4 },

  // ── list rows
  listRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rowDiv:    { borderBottomWidth: 1, borderBottomColor: BD },
  listIcon:  { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  listLabel: { color: TEXT, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  listValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  listSub:   { color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 1 },

  // ── about
  aboutContent: { padding: 18, gap: 10 },
  aboutAccent:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#6366F1' },
  aboutTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  aboutName:    { color: TEXT, fontSize: 20, fontFamily: 'Inter_700Bold' },
  aboutVer:     { color: MUTED, fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 3 },
  aboutSub:     { color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2, opacity: 0.7 },
  aboutShield:  { width: 48, height: 48, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  aboutDesc:    { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  aboutTags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  aboutTag:     { backgroundColor: GLASS2, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: BD },
  aboutTagTxt:  { color: TEXT, fontSize: 10, fontFamily: 'Inter_600SemiBold', opacity: 0.8 },

  // ── logout
  logoutWrap:   { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(251,113,133,0.26)' },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  logoutAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#FB7185' },
  logoutIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(251,113,133,0.14)', justifyContent: 'center', alignItems: 'center' },
  logoutTxt:    { flex: 1, color: '#FB7185', fontSize: 14, fontFamily: 'Inter_700Bold' },

  footer: { color: MUTED, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: -4 },

  // ── modals
  modalHdr:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  modalHdrTitle:  { color: '#fff', fontSize: 19, fontFamily: 'Inter_700Bold' },
  closeBtn:       { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  editPreview:    { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, backgroundColor: GLASS, borderWidth: 1, borderColor: BD },
  editAvatar:     { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  editAvatarLetter: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  editPreviewName: { color: TEXT, fontSize: 15, fontFamily: 'Inter_700Bold' },
  editPreviewRole: { color: '#818CF8', fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2 },
  fieldLabel:     { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: TEXT, marginBottom: 6 },
  fieldWrap:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, borderColor: BD, backgroundColor: GLASS, paddingHorizontal: 14 },
  fieldInput:     { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 13, color: TEXT },
  submitBtn:      { borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitBtnTxt:   { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
