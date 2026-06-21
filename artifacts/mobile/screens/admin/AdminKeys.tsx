import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import type { SecretKey } from '@/types';

const ROLE_LABELS: Record<string, string> = { safaikarmi: 'Safai Karmi', official: 'Official', admin: 'Admin' };
const ROLE_COLORS: Record<string, string> = { safaikarmi: '#006A35', official: '#904D00', admin: '#003884' };
const ROLE_BG: Record<string, string> = { safaikarmi: '#D1FAE5', official: '#FFDCC3', admin: '#D7E3FF' };

export default function AdminKeys() {
  const { secretKeys, addSecretKey, toggleSecretKey, deleteSecretKey } = useAppData();
  const colors = useColors();
  const [generating, setGenerating] = useState(false);

  async function handleGenerate(role: SecretKey['role']) {
    setGenerating(true);
    try {
      const key = await addSecretKey(role);
      Alert.alert('✓ Key Generated', `New key for ${ROLE_LABELS[role]}:\n\n${key.code}\n\nShare this securely with the assigned employee.`);
    } finally {
      setGenerating(false);
    }
  }

  function handleToggle(key: SecretKey) {
    Alert.alert(
      key.isActive ? 'Revoke Key?' : 'Activate Key?',
      `Code: ${key.code}\nRole: ${ROLE_LABELS[key.role]}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: key.isActive ? 'Revoke' : 'Activate', onPress: () => toggleSecretKey(key.id) },
      ]
    );
  }

  function handleDelete(key: SecretKey) {
    Alert.alert('Delete Key?', `This will permanently delete code "${key.code}". If assigned, the employee will lose access.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSecretKey(key.id) },
    ]);
  }

  const activeKeys = secretKeys.filter(k => k.isActive);
  const revokedKeys = secretKeys.filter(k => !k.isActive);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Secret Keys</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>{activeKeys.length} active</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        {/* Generate section */}
        <View style={[styles.genCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.genTitle, { color: colors.text }]}>Generate New Key</Text>
          <Text style={[styles.genSub, { color: colors.mutedForeground }]}>Create access codes for employees</Text>
          <View style={styles.genBtns}>
            {(['safaikarmi', 'official', 'admin'] as SecretKey['role'][]).map(role => (
              <TouchableOpacity
                key={role}
                style={[styles.genBtn, { backgroundColor: ROLE_BG[role], borderColor: ROLE_COLORS[role] + '50' }, generating && { opacity: 0.6 }]}
                onPress={() => handleGenerate(role)}
                disabled={generating}
                activeOpacity={0.8}
              >
                <Feather name="key" size={14} color={ROLE_COLORS[role]} />
                <Text style={[styles.genBtnText, { color: ROLE_COLORS[role] }]}>{ROLE_LABELS[role]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active keys */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Keys ({activeKeys.length})</Text>
        {activeKeys.map(k => (
          <View key={k.id} style={[styles.keyCard, { backgroundColor: colors.card, borderColor: ROLE_COLORS[k.role] + '30', borderLeftColor: ROLE_COLORS[k.role] }]}>
            <View style={styles.keyTop}>
              <View style={[styles.roleBadge, { backgroundColor: ROLE_BG[k.role] }]}>
                <Text style={[styles.roleText, { color: ROLE_COLORS[k.role] }]}>{ROLE_LABELS[k.role]}</Text>
              </View>
              <Text style={[styles.keyCode, { color: colors.text }]}>{k.code}</Text>
            </View>
            <Text style={[styles.keyDate, { color: colors.mutedForeground }]}>Created: {k.createdAt}</Text>
            <View style={styles.keyActions}>
              <Pressable style={[styles.keyBtn, { backgroundColor: colors.submittedBg }]} onPress={() => handleToggle(k)}>
                <Feather name="slash" size={13} color={colors.submitted} />
                <Text style={[styles.keyBtnText, { color: colors.submitted }]}>Revoke</Text>
              </Pressable>
              <Pressable style={[styles.keyBtn, { backgroundColor: '#FDECEA' }]} onPress={() => handleDelete(k)}>
                <Feather name="trash-2" size={13} color={colors.destructive} />
                <Text style={[styles.keyBtnText, { color: colors.destructive }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* Revoked keys */}
        {revokedKeys.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Revoked Keys ({revokedKeys.length})</Text>
            {revokedKeys.map(k => (
              <View key={k.id} style={[styles.keyCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.6 }]}>
                <View style={styles.keyTop}>
                  <View style={[styles.roleBadge, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.roleText, { color: colors.mutedForeground }]}>{ROLE_LABELS[k.role]}</Text>
                  </View>
                  <Text style={[styles.keyCode, { color: colors.mutedForeground, textDecorationLine: 'line-through' }]}>{k.code}</Text>
                </View>
                <View style={styles.keyActions}>
                  <Pressable style={[styles.keyBtn, { backgroundColor: colors.resolvedBg }]} onPress={() => handleToggle(k)}>
                    <Feather name="check-circle" size={13} color={colors.resolved} />
                    <Text style={[styles.keyBtnText, { color: colors.resolved }]}>Reactivate</Text>
                  </Pressable>
                  <Pressable style={[styles.keyBtn, { backgroundColor: '#FDECEA' }]} onPress={() => handleDelete(k)}>
                    <Feather name="trash-2" size={13} color={colors.destructive} />
                    <Text style={[styles.keyBtnText, { color: colors.destructive }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}

        {secretKeys.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="key" size={36} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>No secret keys generated yet</Text>
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
  genCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  genTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  genSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: -6 },
  genBtns: { flexDirection: 'row', gap: 10 },
  genBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  genBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  keyCard: { borderRadius: 12, padding: 14, borderWidth: 1, borderLeftWidth: 4, gap: 8 },
  keyTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  keyCode: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  keyDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  keyActions: { flexDirection: 'row', gap: 8 },
  keyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10 },
  keyBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 10 },
});
