import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '@/components/SearchBar';
import { useAppData } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import type { UserRole } from '@/types';

const ROLE_LABELS: Record<string, string> = { citizen: 'Citizen', safaikarmi: 'Safai Karmi', official: 'Official', admin: 'Admin' };
const ROLE_COLORS: Record<string, string> = { citizen: '#005AB6', safaikarmi: '#006A35', official: '#904D00', admin: '#003884' };
const ROLE_BG: Record<string, string> = { citizen: '#DBE9FE', safaikarmi: '#D1FAE5', official: '#FFDCC3', admin: '#D7E3FF' };
const ROLE_FILTERS: (UserRole | 'all')[] = ['all', 'citizen', 'safaikarmi', 'official', 'admin'];

export default function AdminUsers() {
  const { users, updateUser, deleteUser } = useAppData();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleToggle(u: typeof users[0]) {
    Alert.alert(
      u.isActive ? 'Deactivate User?' : 'Activate User?',
      `${u.name}\n${u.email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: u.isActive ? 'Deactivate' : 'Activate', onPress: () => updateUser(u.id, { isActive: !u.isActive }) },
      ]
    );
  }

  function handleDelete(u: typeof users[0]) {
    Alert.alert('Delete User?', `This will permanently remove ${u.name}. This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteUser(u.id) },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>User Management</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>{filtered.length} users</Text>
      </View>

      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search users…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {ROLE_FILTERS.map(r => (
            <Pressable key={r} style={[styles.chip, { backgroundColor: roleFilter === r ? colors.adminColor : colors.card, borderColor: roleFilter === r ? colors.adminColor : colors.border }]} onPress={() => setRoleFilter(r)}>
              <Text style={[styles.chipText, { color: roleFilter === r ? '#fff' : colors.mutedForeground }]}>
                {r === 'all' ? 'All Roles' : ROLE_LABELS[r]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
        {filtered.map(u => (
          <View key={u.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: u.isActive ? 1 : 0.65 }]}>
            <View style={styles.top}>
              <View style={[styles.avatar, { backgroundColor: ROLE_BG[u.role] }]}>
                <Text style={[styles.avatarLetter, { color: ROLE_COLORS[u.role] }]}>{u.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>{u.name}</Text>
                <Text style={[styles.email, { color: colors.mutedForeground }]}>{u.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: ROLE_BG[u.role] }]}>
                <Text style={[styles.roleText, { color: ROLE_COLORS[u.role] }]}>{ROLE_LABELS[u.role]}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable style={[styles.actionBtn, { backgroundColor: u.isActive ? colors.submittedBg : colors.resolvedBg }]} onPress={() => handleToggle(u)}>
                <Feather name={u.isActive ? 'user-x' : 'user-check'} size={14} color={u.isActive ? colors.submitted : colors.resolved} />
                <Text style={[styles.actionText, { color: u.isActive ? colors.submitted : colors.resolved }]}>
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#FDECEA' }]} onPress={() => handleDelete(u)}>
                <Feather name="trash-2" size={14} color={colors.destructive} />
                <Text style={[styles.actionText, { color: colors.destructive }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={36} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>No users found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  controls: { padding: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  email: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 },
  actionText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 10 },
});
