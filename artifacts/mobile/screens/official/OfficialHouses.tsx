import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HouseCard } from '@/components/HouseCard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SearchBar } from '@/components/SearchBar';
import { useAppData } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColors } from '@/hooks/useColors';

export default function OfficialHouses() {
  const { houses, wards } = useAppData();
  const colors = useColors();
  const { t } = useLanguage();
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

  const activeHouses = houses.filter(h => h.isActive).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <LinearGradient colors={['#78350F', '#92400E', '#B45309']} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>{t('houses')}</Text>
            <Text style={styles.heroSub}>{activeHouses} registered</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']} style={styles.heroIcon}>
              <Feather name="home" size={20} color="#FDE68A" />
            </LinearGradient>
            <LanguageSwitcher />
          </View>
        </View>
        <View style={styles.heroStats}>
          {[
            { label: 'Registered', value: activeHouses, grad: ['#D97706','#F59E0B'] as const },
            { label: 'Wards', value: wards.length, grad: ['#059669','#10B981'] as const },
            { label: 'Filtered', value: filtered.length, grad: ['#7C3AED','#8B5CF6'] as const },
          ].map(s => (
            <LinearGradient key={s.label} colors={s.grad} style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{s.value}</Text>
              <Text style={styles.heroStatLbl}>{s.label}</Text>
            </LinearGradient>
          ))}
        </View>
      </LinearGradient>

      <View style={[styles.controls, { backgroundColor: colors.background }]}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('search') + ' by name, number, address…'} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <Pressable
            style={[styles.wardChip, { backgroundColor: wardFilter === 'all' ? '#B45309' : colors.card, borderColor: wardFilter === 'all' ? '#B45309' : colors.border }]}
            onPress={() => setWardFilter('all')}
          >
            <Text style={[styles.wardChipText, { color: wardFilter === 'all' ? '#fff' : colors.mutedForeground }]}>All {t('ward')}s</Text>
          </Pressable>
          {wards.map(w => (
            <Pressable
              key={w.id}
              style={[styles.wardChip, { backgroundColor: wardFilter === w.id ? '#B45309' : colors.card, borderColor: wardFilter === w.id ? '#B45309' : colors.border }]}
              onPress={() => setWardFilter(w.id)}
            >
              <Text style={[styles.wardChipText, { color: wardFilter === w.id ? '#fff' : colors.mutedForeground }]}>
                {t('ward')} {w.wardNumber}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
        {filtered.map(h => <HouseCard key={h.id} house={h} />)}
        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={['#92400E', '#D97706']} style={styles.emptyIcon}>
              <Feather name="home" size={28} color="#fff" />
            </LinearGradient>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('noData')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, paddingBottom: 22, gap: 14, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTitle: { color: '#fff', fontSize: 26, fontFamily: 'Inter_700Bold' },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  heroIcon: { width: 46, height: 46, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  heroStats: { flexDirection: 'row', gap: 10 },
  heroStat: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 2 },
  heroStatVal: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  heroStatLbl: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  controls: { padding: 14, paddingBottom: 8 },
  wardChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1, marginRight: 8 },
  wardChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
