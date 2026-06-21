import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HouseCard } from '@/components/HouseCard';
import { SearchBar } from '@/components/SearchBar';
import { useAppData } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

export default function OfficialHouses() {
  const { houses, wards } = useAppData();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState<string>('all');

  const filtered = houses.filter(h => {
    if (wardFilter !== 'all' && h.wardId !== wardFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!h.registrationNumber.toLowerCase().includes(q) && !h.ownerName.toLowerCase().includes(q) && !h.address.toLowerCase().includes(q)) return false;
    }
    return h.isActive;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Houses</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.officialBg }]}>
          <Text style={[styles.countText, { color: colors.official }]}>{houses.filter(h => h.isActive).length} registered</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name, number, address…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={[styles.wardChip, { backgroundColor: wardFilter === 'all' ? colors.official : colors.card, borderColor: wardFilter === 'all' ? colors.official : colors.border }]}>
            <Text style={[styles.wardChipText, { color: wardFilter === 'all' ? '#fff' : colors.mutedForeground }]} onPress={() => setWardFilter('all')}>All Wards</Text>
          </View>
          {wards.map(w => (
            <View key={w.id} style={[styles.wardChip, { backgroundColor: wardFilter === w.id ? colors.official : colors.card, borderColor: wardFilter === w.id ? colors.official : colors.border }]}>
              <Text style={[styles.wardChipText, { color: wardFilter === w.id ? '#fff' : colors.mutedForeground }]} onPress={() => setWardFilter(w.id)}>
                Ward {w.wardNumber}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
        {filtered.map(h => <HouseCard key={h.id} house={h} />)}
        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="home" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No houses found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  countText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  controls: { padding: 16 },
  wardChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1, marginRight: 8 },
  wardChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
