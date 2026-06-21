import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComplaintCard } from '@/components/ComplaintCard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SearchBar } from '@/components/SearchBar';
import { useAppData } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { COMPLAINT_CATEGORIES } from '@/types';

type StatusFilter = 'all' | 'submitted' | 'assigned' | 'in_progress' | 'resolved';

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
  const { t } = useLanguage();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = complaints.filter(c => {
    if (status !== 'all' && c.status !== status) return false;
    if (search && !c.description.toLowerCase().includes(search.toLowerCase()) && !COMPLAINT_CATEGORIES[c.category]?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'submitted', label: t('pending') },
    { key: 'assigned', label: t('assigned') },
    { key: 'in_progress', label: t('inProgress') },
    { key: 'resolved', label: t('resolved') },
  ];

  async function handleUpdate(id: string, currentStatus: string) {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;
    Alert.alert('Update Status', `Move to "${nextStatus.replace('_', ' ')}"?`, [
      { text: t('cancel'), style: 'cancel' },
      { text: 'Update', onPress: async () => { await updateComplaint(id, { status: nextStatus as any }); } },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <LinearGradient colors={['#78350F', '#92400E', '#B45309']} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>{t('complaints')}</Text>
            <Text style={styles.heroSub}>{filtered.length} complaints</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']} style={styles.heroIcon}>
              <Feather name="clipboard" size={20} color="#FDE68A" />
            </LinearGradient>
            <LanguageSwitcher />
          </View>
        </View>

        <View style={styles.heroStats}>
          {[
            { label: 'All', value: complaints.length, color: '#FDE68A' },
            { label: t('pending'), value: complaints.filter(c => c.status === 'submitted').length, color: '#FCA5A5' },
            { label: t('inProgress'), value: complaints.filter(c => c.status === 'in_progress').length, color: '#A5B4FC' },
            { label: t('resolved'), value: complaints.filter(c => c.status === 'resolved').length, color: '#6EE7B7' },
          ].map(s => (
            <View key={s.label} style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.heroStatLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('search') + ' complaints…'} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {STATUS_TABS.map(tab => (
            <Pressable
              key={tab.key}
              style={[styles.tab, { backgroundColor: status === tab.key ? '#B45309' : colors.card, borderColor: status === tab.key ? '#B45309' : colors.border }]}
              onPress={() => setStatus(tab.key)}
            >
              <Text style={[styles.tabText, { color: status === tab.key ? '#fff' : colors.mutedForeground }]}>{tab.label}</Text>
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
                style={styles.actionBtn}
                onPress={() => handleUpdate(c.id, c.status)}
              >
                <LinearGradient colors={['#92400E', '#D97706']} style={styles.actionBtnGrad}>
                  <Feather name="arrow-right-circle" size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>{NEXT_STATUS_LABEL[c.status]}</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        ))}
        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={['#92400E', '#D97706']} style={styles.emptyIcon}>
              <Feather name="inbox" size={28} color="#fff" />
            </LinearGradient>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('noData')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, paddingBottom: 22, gap: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTitle: { color: '#fff', fontSize: 26, fontFamily: 'Inter_700Bold' },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  heroIcon: { width: 46, height: 46, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  heroStats: { flexDirection: 'row', gap: 8 },
  heroStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 },
  heroStatVal: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  heroStatLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  controls: { padding: 14, paddingBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, marginRight: 8 },
  tabText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  actionBtn: { borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  actionBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  actionBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
