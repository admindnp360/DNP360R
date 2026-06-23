import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '@/components/SearchBar';
import { useAlert } from '@/contexts/AlertContext';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import type { User, UserRole } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  safaikarmi: 'Safai Karmi',
  official: 'Official',
  admin: 'Admin',
  citizen: 'Citizen',
};
const ROLE_GRADS: Record<string, readonly [string, string]> = {
  safaikarmi: ['#10B981', '#059669'],
  official:   ['#F59E0B', '#EF4444'],
  admin:      ['#6366F1', '#8B5CF6'],
  citizen:    ['#0EA5E9', '#2563EB'],
};
const ROLE_ICONS: Record<string, string> = {
  safaikarmi: 'trash-2',
  official: 'briefcase',
  admin: 'shield',
  citizen: 'user',
};

type RoleFilter = 'all' | Exclude<UserRole, never>;
const STAFF_FILTERS: RoleFilter[] = ['all', 'safaikarmi', 'official', 'admin'];
const ALL_FILTERS: RoleFilter[] = ['all', 'citizen', 'safaikarmi', 'official', 'admin'];

const SUPERADMIN_ID = 'SUPERADMIN';

export default function AdminUsers() {
  const { users, updateUser, deleteUser, secretKeys, updateSecretKeyCode } = useAppData();
  const { user: currentUser } = useAuth();
  const colors = useColors();
  const isSuperAdmin = !!(currentUser as any)?.isSuperAdmin;

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editKeyCode, setEditKeyCode] = useState('');
  const [showKeyEdit, setShowKeyEdit] = useState(false);
  const [editingKey, setEditingKey] = useState<{ id: string; code: string; role: string } | null>(null);

  const sourceUsers = isSuperAdmin ? users : users.filter(u => u.role !== 'citizen');
  const filters = isSuperAdmin ? ALL_FILTERS : STAFF_FILTERS;

  const filtered = sourceUsers.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q)
        || (u.employeeId ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const nonCitizens = users.filter(u => u.role !== 'citizen');
  const activeCt    = nonCitizens.filter(u => u.isActive).length;
  const frozenCt    = nonCitizens.filter(u => !u.isActive).length;
  const citizenCt   = users.filter(u => u.role === 'citizen').length;
  const totalCt     = users.length;

  const { showAlert } = useAlert();

  function getUserKey(userId: string) {
    return secretKeys.find(k => k.usedBy === userId) ?? null;
  }

  function handleFreeze(u: User) {
    if (u.id === SUPERADMIN_ID) {
      showAlert('Protected', 'The Super Admin account cannot be modified.', undefined, 'warning');
      return;
    }
    showAlert(u.isActive ? 'Freeze Account?' : 'Unfreeze Account?', u.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: u.isActive ? 'Freeze' : 'Unfreeze', onPress: () => updateUser(u.id, { isActive: !u.isActive }) },
    ], 'warning');
  }

  function handleEdit(u: User) {
    const key = getUserKey(u.id);
    setEditUser(u);
    setEditName(u.name);
    setEditMobile(u.mobile ?? '');
    setEditEmail(u.email);
    setEditKeyCode(key?.code ?? '');
    setEditingKey(key ? { id: key.id, code: key.code, role: key.role } : null);
    setShowKeyEdit(false);
  }

  async function handleSaveEdit() {
    if (!editUser) return;
    updateUser(editUser.id, { name: editName.trim(), mobile: editMobile.trim(), email: editEmail.trim() });
    if (isSuperAdmin && editingKey && editKeyCode.trim() && editKeyCode.trim() !== editingKey.code) {
      await updateSecretKeyCode(editingKey.id, editKeyCode.trim().toUpperCase());
    }
    setEditUser(null);
    showAlert('Updated', 'User details saved.', undefined, 'success');
  }

  function handleDelete(u: User) {
    if (u.id === SUPERADMIN_ID || (u as any).cannotBeDeleted) {
      showAlert('Protected', 'This account cannot be deleted.', undefined, 'warning');
      return;
    }
    showAlert('Delete User?', `Permanently remove ${u.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteUser(u.id) },
    ], 'error');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#050818' }} edges={['top']}>
      {/* HERO */}
      <LinearGradient
        colors={isSuperAdmin ? ['#3B0A6B', '#1A237E', '#0D1B4B'] : ['#0D1B4B', '#1A237E', '#283593']}
        style={styles.heroHdr}
      >
        <View style={styles.heroTop}>
          <View>
            <View style={styles.heroTitleRow}>
              {isSuperAdmin && (
                <LinearGradient colors={['#7C3AED','#6366F1']} style={styles.superBadge}>
                  <Feather name="star" size={9} color="#FFD700" />
                  <Text style={styles.superBadgeText}>SUPER ADMIN</Text>
                </LinearGradient>
              )}
              <Text style={styles.heroTitle}>{isSuperAdmin ? 'All Users' : 'User Management'}</Text>
            </View>
            <Text style={styles.heroSub}>{isSuperAdmin ? 'All accounts · Secret key control' : 'Staff accounts & permissions'}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeNum}>{isSuperAdmin ? totalCt : nonCitizens.length}</Text>
            <Text style={styles.heroBadgeLbl}>{isSuperAdmin ? 'Total' : 'Staff'}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.heroStats}>
            {isSuperAdmin ? (
              <>
                {[
                  { label: 'Active',    value: activeCt,                                        grad: ['#10B981','#059669'] as const, icon: 'user-check' },
                  { label: 'Frozen',    value: frozenCt,                                        grad: ['#EF4444','#DC2626'] as const, icon: 'lock' },
                  { label: 'Citizens',  value: citizenCt,                                       grad: ['#0EA5E9','#2563EB'] as const, icon: 'users' },
                  { label: 'Officials', value: nonCitizens.filter(u=>u.role==='official').length, grad: ['#F59E0B','#EF4444'] as const, icon: 'briefcase' },
                  { label: 'Workers',   value: nonCitizens.filter(u=>u.role==='safaikarmi').length, grad: ['#10B981','#059669'] as const, icon: 'trash-2' },
                ].map(s => (
                  <View key={s.label} style={styles.heroStat}>
                    <LinearGradient colors={s.grad} style={styles.heroStatIcon}>
                      <Feather name={s.icon as any} size={11} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.heroStatVal}>{s.value}</Text>
                    <Text style={styles.heroStatLbl}>{s.label}</Text>
                  </View>
                ))}
              </>
            ) : (
              <>
                {[
                  { label: 'Active',   value: activeCt,                                        grad: ['#10B981','#059669'] as const, icon: 'user-check' },
                  { label: 'Frozen',   value: frozenCt,                                        grad: ['#EF4444','#DC2626'] as const, icon: 'lock' },
                  { label: 'Workers',  value: nonCitizens.filter(u=>u.role==='safaikarmi').length, grad: ['#10B981','#059669'] as const, icon: 'trash-2' },
                  { label: 'Officials',value: nonCitizens.filter(u=>u.role==='official').length, grad: ['#F59E0B','#EF4444'] as const, icon: 'briefcase' },
                ].map(s => (
                  <View key={s.label} style={styles.heroStat}>
                    <LinearGradient colors={s.grad} style={styles.heroStatIcon}>
                      <Feather name={s.icon as any} size={11} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.heroStatVal}>{s.value}</Text>
                    <Text style={styles.heroStatLbl}>{s.label}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* SEARCH + FILTERS */}
      <View style={[styles.controls, { backgroundColor: colors.background }]}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, email, ID…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {filters.map(r => {
            const active = roleFilter === r;
            const grad = r !== 'all' ? (ROLE_GRADS[r] ?? ['#6366F1','#8B5CF6'] as const) : ['#6366F1','#8B5CF6'] as const;
            return active ? (
              <LinearGradient key={r} colors={grad} style={styles.filterChipActive}>
                <Text style={styles.filterChipActiveText}>
                  {r === 'all' ? (isSuperAdmin ? 'All Users' : 'All Staff') : ROLE_LABELS[r]}
                </Text>
              </LinearGradient>
            ) : (
              <Pressable key={r} style={[styles.filterChip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setRoleFilter(r)}>
                <Text style={[styles.filterChipText, { color: colors.mutedForeground }]}>
                  {r === 'all' ? (isSuperAdmin ? 'All Users' : 'All Staff') : ROLE_LABELS[r]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* USERS LIST */}
      <ScrollView
        contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
      >
        {filtered.map(u => {
          const grad = ROLE_GRADS[u.role] ?? (['#6366F1','#8B5CF6'] as const);
          const isProtected = u.id === SUPERADMIN_ID || !!(u as any).cannotBeDeleted;
          const linkedKey = isSuperAdmin ? getUserKey(u.id) : null;

          return (
            <View key={u.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: isProtected ? '#7C3AED44' : colors.border, opacity: u.isActive ? 1 : 0.72 }]}>
              <LinearGradient colors={grad} style={styles.accentBar} />

              {isProtected && (
                <View style={styles.protectedBanner}>
                  <Feather name="star" size={9} color="#FFD700" />
                  <Text style={styles.protectedBannerText}>Super Admin · Protected Account</Text>
                </View>
              )}

              <View style={styles.cardInner}>
                <View style={styles.cardTop}>
                  <LinearGradient colors={grad} style={styles.avatar}>
                    <Text style={styles.avatarLetter}>{u.name[0].toUpperCase()}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{u.name}</Text>
                      <LinearGradient colors={grad} style={styles.roleBadge}>
                        <Text style={styles.roleText}>{ROLE_LABELS[u.role] ?? u.role}</Text>
                      </LinearGradient>
                    </View>
                    <Text style={[styles.userEmail, { color: colors.mutedForeground }]} numberOfLines={1}>{u.email}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: u.isActive ? '#D1FAE5' : '#FEE2E2' }]}>
                    <View style={[styles.statusDot, { backgroundColor: u.isActive ? '#10B981' : '#EF4444' }]} />
                    <Text style={[styles.statusText, { color: u.isActive ? '#059669' : '#DC2626' }]}>{u.isActive ? 'Active' : 'Frozen'}</Text>
                  </View>
                </View>

                {/* Secret Key Row (superadmin only, staff users only) */}
                {isSuperAdmin && linkedKey && u.role !== 'citizen' && (
                  <View style={styles.keyRow}>
                    <LinearGradient colors={grad} style={styles.keyIconWrap}>
                      <Feather name="key" size={10} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.keyCode, { color: grad[0] }]}>{linkedKey.code}</Text>
                    <View style={[styles.keyStatusDot, { backgroundColor: linkedKey.isActive ? '#10B981' : '#EF4444' }]} />
                    <Text style={[styles.keyStatusTxt, { color: linkedKey.isActive ? '#059669' : '#DC2626' }]}>
                      {linkedKey.isActive ? 'Active' : 'Revoked'}
                    </Text>
                  </View>
                )}

                {/* Meta row */}
                <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                  {u.employeeId && (
                    <View style={styles.metaChip}>
                      <Feather name="briefcase" size={9} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{u.employeeId}</Text>
                    </View>
                  )}
                  <View style={styles.metaChip}>
                    <Feather name="calendar" size={9} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{u.createdAt}</Text>
                  </View>
                </View>

                {/* Actions */}
                {!isProtected && (
                  <View style={styles.actions}>
                    {u.role !== 'citizen' && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: u.isActive ? '#FEF3C7' : '#D1FAE5', flex: 1 }]} onPress={() => handleFreeze(u)} activeOpacity={0.8}>
                        <Feather name={u.isActive ? 'lock' : 'unlock'} size={14} color={u.isActive ? '#D97706' : '#059669'} />
                        <Text style={[styles.actionBtnText, { color: u.isActive ? '#D97706' : '#059669' }]}>{u.isActive ? 'Freeze' : 'Unfreeze'}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EEF2FF', flex: 1 }]} onPress={() => handleEdit(u)} activeOpacity={0.8}>
                      <Feather name="edit-2" size={14} color="#6366F1" />
                      <Text style={[styles.actionBtnText, { color: '#6366F1' }]}>{isSuperAdmin && linkedKey ? 'Edit + Key' : 'Edit'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => handleDelete(u)} activeOpacity={0.8}>
                      <Feather name="trash-2" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={['#6366F1','#8B5CF6']} style={styles.emptyIcon}>
              <Feather name="users" size={28} color="#fff" />
            </LinearGradient>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No users found</Text>
          </View>
        )}
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={!!editUser} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <LinearGradient
            colors={isSuperAdmin ? ['#3B0A6B', '#1A237E'] : ['#0D1B4B', '#1A237E']}
            style={styles.modalHdr}
          >
            <View>
              <Text style={styles.modalHdrTitle}>
                {isSuperAdmin ? 'Edit User (Super Admin)' : 'Edit User'}
              </Text>
              {editUser && <Text style={styles.modalHdrSub}>{ROLE_LABELS[editUser.role] ?? editUser.role}</Text>}
            </View>
            <Pressable style={styles.modalClose} onPress={() => setEditUser(null)}>
              <Feather name="x" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {editUser && (
              <View style={[styles.editPreview, { backgroundColor: '#6366F110', borderColor: '#6366F130' }]}>
                <LinearGradient colors={ROLE_GRADS[editUser.role] ?? ['#6366F1','#8B5CF6']} style={styles.editAvatar}>
                  <Text style={styles.editAvatarLetter}>{(editName[0] ?? '?').toUpperCase()}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editPreviewName, { color: colors.text }]}>{editName || editUser.name}</Text>
                  <Text style={styles.editPreviewRole}>{ROLE_LABELS[editUser.role] ?? editUser.role}</Text>
                  {editingKey && (
                    <View style={styles.editKeyChip}>
                      <Feather name="key" size={10} color="#8B5CF6" />
                      <Text style={styles.editKeyChipText}>{editingKey.code}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Standard fields */}
            {[
              { label: 'Full Name', value: editName,   set: setEditName,   icon: 'user',       key: 'name',   caps: 'words'  as const },
              { label: 'Email',     value: editEmail,  set: setEditEmail,  icon: 'mail',       key: 'email',  caps: 'none'   as const },
              { label: 'Mobile',    value: editMobile, set: setEditMobile, icon: 'smartphone', key: 'mobile', caps: 'none'   as const, num: true },
            ].map(f => (
              <View key={f.key}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{f.label}</Text>
                <View style={[styles.fieldRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name={f.icon as any} size={16} color="#6366F1" />
                  <TextInput
                    style={[styles.fieldInput, { color: colors.text }]}
                    value={f.value}
                    onChangeText={f.set}
                    autoCapitalize={f.caps}
                    keyboardType={(f as any).num ? 'phone-pad' : 'default'}
                    placeholder={f.label}
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
            ))}

            {/* Secret Key Edit — Super Admin only + staff with linked key */}
            {isSuperAdmin && editUser?.role !== 'citizen' && editingKey && (
              <View>
                <View style={styles.keyEditHeader}>
                  <LinearGradient colors={['#7C3AED','#6366F1']} style={styles.keyEditIconWrap}>
                    <Feather name="key" size={14} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 0 }]}>Secret Key Code</Text>
                    <Text style={styles.keyEditSub}>Current: <Text style={styles.keyEditCurrent}>{editingKey.code}</Text></Text>
                  </View>
                  <Pressable onPress={() => setShowKeyEdit(p => !p)} style={[styles.showKeyBtn, { backgroundColor: showKeyEdit ? '#EEF2FF' : '#F1F5F9' }]}>
                    <Feather name={showKeyEdit ? 'eye-off' : 'eye'} size={14} color="#6366F1" />
                  </Pressable>
                </View>

                <View style={[styles.fieldRow, { backgroundColor: colors.card, borderColor: '#8B5CF630' }]}>
                  <Feather name="key" size={16} color="#8B5CF6" />
                  <TextInput
                    style={[styles.fieldInput, { color: colors.text, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 }]}
                    value={editKeyCode}
                    onChangeText={v => setEditKeyCode(v.replace(/[^A-Z0-9]/g, '').toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    secureTextEntry={!showKeyEdit}
                    placeholder="New secret code…"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>

                <View style={styles.keyEditWarning}>
                  <Feather name="alert-triangle" size={12} color="#F59E0B" />
                  <Text style={styles.keyEditWarningText}>
                    Changing this code will require the staff member to use the new code for their next login. Share securely.
                  </Text>
                </View>
              </View>
            )}

            {isSuperAdmin && editUser?.role !== 'citizen' && !editingKey && (
              <View style={[styles.keyEditWarning, { backgroundColor: '#FEF3C720', borderColor: '#F59E0B30' }]}>
                <Feather name="info" size={12} color="#F59E0B" />
                <Text style={styles.keyEditWarningText}>This user has no linked secret key (may not have registered via a key).</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleSaveEdit} activeOpacity={0.85}>
              <LinearGradient colors={isSuperAdmin ? ['#7C3AED','#6366F1'] : ['#6366F1','#8B5CF6']} style={styles.saveBtn}>
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroHdr: { padding: 20, paddingBottom: 18, gap: 16 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: 'Inter_700Bold' },
  heroSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  superBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  superBadgeText: { color: '#FFD700', fontSize: 9, fontFamily: 'Inter_700Bold' },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  heroBadgeNum: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  heroBadgeLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'Inter_500Medium' },
  heroStats: { flexDirection: 'row', gap: 8 },
  heroStat: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, alignItems: 'center', gap: 4, minWidth: 66 },
  heroStatIcon: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  heroStatVal: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  heroStatLbl: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontFamily: 'Inter_500Medium' },

  controls: { padding: 14, paddingBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, marginRight: 8 },
  filterChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  filterChipActive: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, marginRight: 8 },
  filterChipActiveText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  userCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  accentBar: { height: 4 },
  protectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(124,58,237,0.15)' },
  protectedBannerText: { color: '#A78BFA', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  cardInner: { padding: 10, gap: 7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  userName: { fontSize: 14, fontFamily: 'Inter_700Bold', flex: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  roleText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  userEmail: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: 'Inter_700Bold' },

  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(99,102,241,0.12)' },
  keyIconWrap: { width: 20, height: 20, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  keyCode: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, flex: 1 },
  keyStatusDot: { width: 5, height: 5, borderRadius: 3 },
  keyStatusTxt: { fontSize: 9, fontFamily: 'Inter_600SemiBold' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 6, borderTopWidth: 1 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 7 },
  actionBtnText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  actionIconBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  modalHdrTitle: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalHdrSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  editPreview: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  editAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  editAvatarLetter: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  editPreviewName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  editPreviewRole: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#6366F1', marginTop: 2 },
  editKeyChip: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  editKeyChipText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#8B5CF6', letterSpacing: 1 },

  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  fieldInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 14 },

  keyEditHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  keyEditIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  keyEditSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#6B7280', marginTop: 1 },
  keyEditCurrent: { fontFamily: 'Inter_700Bold', color: '#8B5CF6', letterSpacing: 1 },
  showKeyBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  keyEditWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEF3C710', borderRadius: 10, borderWidth: 1, borderColor: '#F59E0B25', padding: 10 },
  keyEditWarningText: { color: '#D97706', fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 16 },

  saveBtn: { borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
