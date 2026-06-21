import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NoticeCard } from '@/components/NoticeCard';
import { SearchBar } from '@/components/SearchBar';
import { useAppData } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

type Filter = 'all' | 'notice' | 'announcement' | 'alert';

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'alert', label: 'Alerts', icon: 'alert-triangle' },
  { key: 'announcement', label: 'News', icon: 'volume-2' },
  { key: 'notice', label: 'Notices', icon: 'file-text' },
];

export default function CitizenNotices() {
  const { notices } = useAppData();
  const colors = useColors();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const filtered = notices.filter(n => {
    if (!n.isActive) return false;
    if (filter !== 'all' && n.type !== filter) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Public Notices</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>{filtered.length} active</Text>
      </View>

      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search notices…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map(f => (
            <Pressable
              key={f.key}
              style={[styles.chip, { borderColor: filter === f.key ? colors.accent : colors.border, backgroundColor: filter === f.key ? colors.accent + '20' : colors.card }]}
              onPress={() => setFilter(f.key)}
            >
              <Feather name={f.icon as any} size={12} color={filter === f.key ? colors.accent : colors.mutedForeground} />
              <Text style={[styles.chipText, { color: filter === f.key ? colors.accent : colors.mutedForeground }]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map(n => <NoticeCard key={n.id} notice={n} />)}
        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notices found</Text>
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
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  list: { padding: 16, gap: 10, paddingBottom: 100 },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
