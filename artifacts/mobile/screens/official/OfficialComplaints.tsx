import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComplaintCard } from '@/components/ComplaintCard';
import { SearchBar } from '@/components/SearchBar';
import { useAppData } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { COMPLAINT_CATEGORIES } from '@/types';

type StatusFilter = 'all' | 'submitted' | 'assigned' | 'in_progress' | 'resolved';

const STATUS_TABS: { key: StatusFilter; label: string; color?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
];

const NEXT_STATUS: Record<string, string> = {
  submitted: 'assigned',
  assigned: 'in_progress',
  in_progress: 'resolved',
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  submitted: 'Assign',
  assigned: 'Start Progress',
  in_progress: 'Mark Resolved',
};

export default function OfficialComplaints() {
  const { complaints, updateComplaint } = useAppData();
  const colors = useColors();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = complaints.filter(c => {
    if (status !== 'all' && c.status !== status) return false;
    if (search && !c.description.toLowerCase().includes(search.toLowerCase()) && !COMPLAINT_CATEGORIES[c.category]?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleUpdate(id: string, currentStatus: string) {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;
    Alert.alert('Update Status', `Move to "${nextStatus.replace('_', ' ')}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: async () => { await updateComplaint(id, { status: nextStatus as any }); } },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Complaint Management</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>{filtered.length} complaints</Text>
      </View>

      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search complaints…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STATUS_TABS.map(t => (
            <Pressable key={t.key} style={[styles.tab, status === t.key && { backgroundColor: colors.official }]} onPress={() => setStatus(t.key)}>
              <Text style={[styles.tabText, { color: status === t.key ? '#fff' : colors.mutedForeground }]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
        {filtered.map(c => (
          <View key={c.id}>
            <ComplaintCard complaint={c} />
            {NEXT_STATUS[c.status] && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.official }]}
                onPress={() => handleUpdate(c.id, c.status)}
              >
                <Feather name="arrow-right-circle" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>{NEXT_STATUS_LABEL[c.status]}</Text>
              </Pressable>
            )}
          </View>
        ))}
        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No complaints found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  controls: { padding: 16, gap: 10 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, marginRight: 8 },
  tabText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, paddingVertical: 8, marginTop: 4 },
  actionBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
