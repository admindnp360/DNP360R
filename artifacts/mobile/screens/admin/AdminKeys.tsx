import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import type { SecretKey } from '@/types';

const ROLE_LABELS: Record<string, string> = { safaikarmi: 'Safai Karmi', official: 'Official', admin: 'Admin' };
const ROLE_COLORS: Record<string, string> = { safaikarmi: '#006A35', official: '#904D00', admin: '#003884' };
const ROLE_BG: Record<string, string> = { safaikarmi: '#D1FAE5', official: '#FFDCC3', admin: '#D7E3FF' };

export default function AdminKeys() {
  const { secretKeys, users, addSecretKey, toggleSecretKey, deleteSecretKey } = useAppData();
  const colors = useColors();
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<SecretKey | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredKeys = secretKeys.filter(k => {
    if (filter === 'active') return k.isActive;
    if (filter === 'inactive') return !k.isActive;
    return true;
  });

  const getUserName = (userId?: string) => {
    if (!userId) return null;
    return users.find(u => u.id === userId)?.name ?? null;
  };

  async function handleGenerate(role: SecretKey['role']) {
    setGenerating(true);
    try {
      const key = await addSecretKey(role);
      setNewKey(key);
    } finally {
      setGenerating(false);
    }
  }

  function handleToggle(k: SecretKey) {
    Alert.alert(k.isActive ? 'Revoke Key?' : 'Activate Key?', `Code: ${k.code}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: k.isActive ? 'Revoke' : 'Activate', onPress: () => toggleSecretKey(k.id) },
    ]);
  }

  function handleDelete(k: SecretKey) {
    Alert.alert('Delete Key?', `Permanently delete ${k.code}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSecretKey(k.id) },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Secret Keys</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.adminBg }]}>
          <Text style={[styles.countText, { color: colors.adminColor }]}>{secretKeys.filter(k => k.isActive).length} active</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Generate Section */}
        <View style={[styles.generateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.generateTitle, { color: colors.text }]}>Generate New Key</Text>
          <Text style={[styles.generateSub, { color: colors.mutedForeground }]}>Select role to create a unique access code</Text>
          <View style={styles.roleButtonRow}>
            {(['safaikarmi', 'official', 'admin'] as const).map(role => (
              <TouchableOpacity
                key={role}
                style={[styles.roleBtn, { backgroundColor: ROLE_BG[role], opacity: generating ? 0.6 : 1 }]}
                onPress={() => handleGenerate(role)}
                disabled={generating}
                activeOpacity={0.8}
              >
                <Feather name={role === 'safaikarmi' ? 'trash' : role === 'official' ? 'briefcase' : 'shield'} size={13} color={ROLE_COLORS[role]} />
                <Text style={[styles.roleBtnText, { color: ROLE_COLORS[role] }]}>{ROLE_LABELS[role]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterRow}>
          {(['all', 'active', 'inactive'] as const).map(f => (
            <Pressable
              key={f}
              style={[styles.filterChip, { backgroundColor: filter === f ? colors.adminColor : colors.card, borderColor: filter === f ? colors.adminColor : colors.border }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, { color: filter === f ? '#fff' : colors.mutedForeground }]}>
                {f === 'all' ? 'All' : f === 'active' ? '● Active' : '○ Revoked'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Keys List */}
        {filteredKeys.map(k => {
          const assignedName = getUserName(k.usedBy);
          return (
            <View key={k.id} style={[styles.keyCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: k.isActive ? 1 : 0.65 }]}>
              <View style={styles.keyRow}>
                <View style={[styles.roleTag, { backgroundColor: ROLE_BG[k.role] }]}>
                  <Text style={[styles.roleTagText, { color: ROLE_COLORS[k.role] }]}>{ROLE_LABELS[k.role]}</Text>
                </View>
                <View style={[styles.codeWrap, { backgroundColor: colors.surface }]}>
                  <Feather name="key" size={11} color={colors.adminColor} />
                  <Text style={[styles.codeText, { color: colors.text }]}>{k.code}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: k.isActive ? '#FFF3E0' : colors.resolvedBg }]} onPress={() => handleToggle(k)} activeOpacity={0.7}>
                  <Feather name={k.isActive ? 'lock' : 'unlock'} size={15} color={k.isActive ? colors.official : colors.resolved} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#FDECEA' }]} onPress={() => handleDelete(k)} activeOpacity={0.7}>
                  <Feather name="trash-2" size={15} color={colors.destructive} />
                </TouchableOpacity>
              </View>

              {assignedName && (
                <View style={styles.assignedRow}>
                  <Feather name="user-check" size={11} color={colors.safaikarmi} />
                  <Text style={[styles.assignedText, { color: colors.text }]}>Used by: <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{assignedName}</Text></Text>
                </View>
              )}

              <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                {k.usedBy && (
                  <View style={styles.metaItem}>
                    <Feather name="hash" size={9} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{k.usedBy}</Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Feather name="calendar" size={9} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{k.createdAt}</Text>
                </View>
                <View style={styles.metaItem}>
                  <View style={[styles.statusDot, { backgroundColor: k.isActive ? colors.resolved : colors.destructive }]} />
                  <Text style={[styles.metaText, { color: k.isActive ? colors.resolved : colors.destructive }]}>
                    {k.isActive ? 'Active' : 'Revoked'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {filteredKeys.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="key" size={36} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>No keys found</Text>
          </View>
        )}
      </ScrollView>

      {/* New Key Modal */}
      <Modal visible={!!newKey} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.newKeySheet, { backgroundColor: colors.card }]}>
            <View style={[styles.newKeyIconWrap, { backgroundColor: colors.adminBg }]}>
              <Feather name="key" size={28} color={colors.adminColor} />
            </View>
            <Text style={[styles.newKeyTitle, { color: colors.text }]}>Key Generated!</Text>
            <Text style={[styles.newKeyRole, { color: colors.mutedForeground }]}>
              {ROLE_LABELS[newKey?.role ?? 'admin']} Access Code
            </Text>
            <View style={[styles.newCodeBox, { backgroundColor: colors.adminBg, borderColor: colors.adminColor + '60' }]}>
              <Text style={[styles.newCode, { color: colors.adminColor }]}>{newKey?.code}</Text>
            </View>
            <Text style={[styles.newKeyNote, { color: colors.mutedForeground }]}>
              Share this code securely. It will not be shown again after closing.
            </Text>
            <TouchableOpacity style={[styles.closeKeyBtn, { backgroundColor: colors.adminColor }]} onPress={() => setNewKey(null)} activeOpacity={0.85}>
              <Text style={styles.closeKeyBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  countText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  generateCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  generateTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  generateSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  roleButtonRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  roleBtnText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  keyCard: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  roleTagText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  codeWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  codeText: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assignedText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', paddingTop: 8, borderTopWidth: 1 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 10 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  newKeySheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, alignItems: 'center', gap: 12 },
  newKeyIconWrap: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  newKeyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  newKeyRole: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  newCodeBox: { borderRadius: 16, paddingHorizontal: 28, paddingVertical: 20, borderWidth: 2, alignSelf: 'stretch', alignItems: 'center' },
  newCode: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: 4 },
  newKeyNote: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
  closeKeyBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 },
  closeKeyBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
