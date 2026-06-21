import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '@/components/SearchBar';
import { useAppData } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import type { User, UserRole } from '@/types';

const ROLE_LABELS: Record<string, string> = { safaikarmi: 'Safai Karmi', official: 'Official', admin: 'Admin' };
const ROLE_COLORS: Record<string, string> = { safaikarmi: '#006A35', official: '#904D00', admin: '#003884' };
const ROLE_BG: Record<string, string> = { safaikarmi: '#D1FAE5', official: '#FFDCC3', admin: '#D7E3FF' };
const ROLE_FILTERS: ('all' | Exclude<UserRole, 'citizen'>)[] = ['all', 'safaikarmi', 'official', 'admin'];

export default function AdminUsers() {
  const { users, updateUser, deleteUser } = useAppData();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Exclude<UserRole, 'citizen'>>('all');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const nonCitizens = users.filter(u => u.role !== 'citizen');
  const filtered = nonCitizens.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !(u.employeeId ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function handleFreeze(u: User) {
    Alert.alert(u.isActive ? 'Freeze Account?' : 'Unfreeze Account?', `${u.name}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: u.isActive ? 'Freeze' : 'Unfreeze', onPress: () => updateUser(u.id, { isActive: !u.isActive }) },
    ]);
  }

  function handleEdit(u: User) {
    setEditUser(u);
    setEditName(u.name);
    setEditMobile(u.mobile ?? '');
    setEditEmail(u.email);
  }

  function handleSaveEdit() {
    if (!editUser) return;
    updateUser(editUser.id, { name: editName.trim(), mobile: editMobile.trim(), email: editEmail.trim() });
    setEditUser(null);
    Alert.alert('✓ Updated', 'User details saved.');
  }

  function handleDelete(u: User) {
    Alert.alert('Delete User?', `Permanently remove ${u.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteUser(u.id) },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>User Management</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.adminBg }]}>
          <Text style={[styles.countText, { color: colors.adminColor }]}>{filtered.length} users</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name, email, ID…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {ROLE_FILTERS.map(r => (
            <Pressable
              key={r}
              style={[styles.chip, { backgroundColor: roleFilter === r ? colors.adminColor : colors.card, borderColor: roleFilter === r ? colors.adminColor : colors.border }]}
              onPress={() => setRoleFilter(r)}
            >
              <Text style={[styles.chipText, { color: roleFilter === r ? '#fff' : colors.mutedForeground }]}>
                {r === 'all' ? 'All Staff' : ROLE_LABELS[r]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
        {filtered.map(u => (
          <View key={u.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: u.isActive ? 1 : 0.65 }]}>
            <View style={styles.cardTop}>
              <View style={[styles.avatar, { backgroundColor: ROLE_BG[u.role] }]}>
                <Text style={[styles.avatarLetter, { color: ROLE_COLORS[u.role] }]}>{u.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{u.name}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: ROLE_BG[u.role] }]}>
                    <Text style={[styles.roleText, { color: ROLE_COLORS[u.role] }]}>{ROLE_LABELS[u.role]}</Text>
                  </View>
                </View>
                <Text style={[styles.email, { color: colors.mutedForeground }]} numberOfLines={1}>{u.email}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: u.isActive ? '#FFF3E0' : colors.resolvedBg }]}
                onPress={() => handleFreeze(u)}
                activeOpacity={0.7}
              >
                <Feather name={u.isActive ? 'lock' : 'unlock'} size={16} color={u.isActive ? colors.official : colors.resolved} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.adminBg }]} onPress={() => handleEdit(u)} activeOpacity={0.7}>
                <Feather name="edit-2" size={16} color={colors.adminColor} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#FDECEA' }]} onPress={() => handleDelete(u)} activeOpacity={0.7}>
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <View style={[styles.statusPill, { backgroundColor: u.isActive ? colors.resolvedBg : colors.submittedBg }]}>
                <Feather name={u.isActive ? 'check-circle' : 'x-circle'} size={10} color={u.isActive ? colors.resolved : colors.submitted} />
                <Text style={[styles.statusText, { color: u.isActive ? colors.resolved : colors.submitted }]}>
                  {u.isActive ? 'Active' : 'Frozen'}
                </Text>
              </View>
            </View>

            <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
              {u.employeeId && <View style={styles.metaChip}><Feather name="briefcase" size={9} color={colors.mutedForeground} /><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{u.employeeId}</Text></View>}
              <View style={styles.metaChip}><Feather name="hash" size={9} color={colors.mutedForeground} /><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{u.id}</Text></View>
              {u.createdAt && <View style={styles.metaChip}><Feather name="calendar" size={9} color={colors.mutedForeground} /><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{u.createdAt}</Text></View>}
            </View>
          </View>
        ))}
        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={36} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>No staff users found</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!editUser} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit User</Text>
            <Pressable onPress={() => setEditUser(null)}><Feather name="x" size={22} color={colors.text} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {[
              { label: 'Full Name', value: editName, onChange: setEditName, key: 'name' },
              { label: 'Email', value: editEmail, onChange: setEditEmail, key: 'email' },
              { label: 'Mobile', value: editMobile, onChange: setEditMobile, key: 'mobile' },
            ].map(f => (
              <View key={f.key}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{f.label}</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                  value={f.value}
                  onChangeText={f.onChange}
                  autoCapitalize={f.key === 'name' ? 'words' : 'none'}
                />
              </View>
            ))}
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.adminColor }]} onPress={handleSaveEdit} activeOpacity={0.85}>
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  countText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  controls: { padding: 16, paddingBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 },
  email: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  roleText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  statusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 10, borderTopWidth: 1 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  fieldInput: { borderRadius: 12, borderWidth: 1, padding: 13, fontSize: 14, fontFamily: 'Inter_400Regular' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
