import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SearchBar } from '@/components/SearchBar';
import { useAppData } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColors } from '@/hooks/useColors';

export default function OfficialWorkers() {
  const { users, getAttendanceByWorker, isTodayAttendanceMarked } = useAppData();
  const colors = useColors();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const workers = users.filter(u => u.role === 'safaikarmi' && (
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || (u.employeeId ?? '').toLowerCase().includes(search.toLowerCase())
  ));

  const activeWorkers = workers.filter(w => w.isActive).length;
  const presentToday = workers.filter(w => isTodayAttendanceMarked(w.id)).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <LinearGradient colors={['#78350F', '#92400E', '#B45309']} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>{t('workers')}</Text>
            <Text style={styles.heroSub}>{workers.length} safai karmis</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']} style={styles.heroIcon}>
              <Feather name="users" size={20} color="#FDE68A" />
            </LinearGradient>
            <LanguageSwitcher />
          </View>
        </View>
        <View style={styles.heroStats}>
          {[
            { label: t('total'), value: workers.length, grad: ['#D97706','#F59E0B'] as const },
            { label: t('active'), value: activeWorkers, grad: ['#059669','#10B981'] as const },
            { label: 'Present Today', value: presentToday, grad: ['#7C3AED','#8B5CF6'] as const },
          ].map(s => (
            <LinearGradient key={s.label} colors={s.grad} style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{s.value}</Text>
              <Text style={styles.heroStatLbl}>{s.label}</Text>
            </LinearGradient>
          ))}
        </View>
      </LinearGradient>

      <View style={[styles.controls, { backgroundColor: colors.background }]}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('search') + ' workers…'} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
        {workers.map(w => {
          const markedToday = isTodayAttendanceMarked(w.id);
          const att = getAttendanceByWorker(w.id);
          const present = att.filter(a => a.status === 'present').length;
          return (
            <View key={w.id} style={[styles.card, { backgroundColor: colors.card, borderColor: '#D9770630' }]}>
              <LinearGradient colors={['#92400E', '#B45309']} style={styles.accentBar} />
              <View style={styles.cardInner}>
                <View style={styles.top}>
                  <LinearGradient colors={['#B45309', '#D97706']} style={styles.avatar}>
                    <Text style={styles.avatarLetter}>{w.name[0]}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{w.name}</Text>
                    <Text style={[styles.empId, { color: colors.mutedForeground }]}>{w.employeeId ?? 'N/A'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: markedToday ? '#D1FAE5' : '#FEE2E2' }]}>
                    <Feather name={markedToday ? 'check-circle' : 'clock'} size={11} color={markedToday ? '#059669' : '#DC2626'} />
                    <Text style={[styles.statusText, { color: markedToday ? '#059669' : '#DC2626' }]}>
                      {markedToday ? 'Present' : 'Absent'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                  <Feather name="calendar" size={12} color="#B45309" />
                  <Text style={[styles.footerText, { color: colors.mutedForeground }]}>{present} days present</Text>
                  {w.wardId && (
                    <>
                      <Feather name="map-pin" size={12} color="#B45309" />
                      <Text style={[styles.footerText, { color: colors.mutedForeground }]}>{t('ward')} {w.wardId.replace(/[^0-9]/g, '')}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          );
        })}
        {workers.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={['#92400E', '#D97706']} style={styles.emptyIcon}>
              <Feather name="users" size={28} color="#fff" />
            </LinearGradient>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>{t('noData')}</Text>
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
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  accentBar: { height: 3 },
  cardInner: { padding: 14, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  empId: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 10, borderTopWidth: 1 },
  footerText: { fontSize: 11, fontFamily: 'Inter_400Regular', marginRight: 8 },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});
