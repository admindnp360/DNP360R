import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function SKPerformance() {
  const { user } = useAuth();
  const { getVisitsByWorker, getAttendanceByWorker } = useAppData();
  const colors = useColors();

  const visits = getVisitsByWorker(user?.id ?? '');
  const attendance = getAttendanceByWorker(user?.id ?? '');
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const collected = visits.filter(v => v.collectedGarbage).length;
  const efficiency = visits.length > 0 ? Math.round((collected / visits.length) * 100) : 0;

  const RATING = efficiency >= 90 ? 'Excellent' : efficiency >= 75 ? 'Good' : efficiency >= 50 ? 'Average' : 'Needs Improvement';
  const RATING_COLOR = efficiency >= 90 ? colors.resolved : efficiency >= 75 ? colors.safaikarmi : efficiency >= 50 ? colors.assigned : colors.destructive;

  const STATS = [
    { label: 'Total Visits', value: visits.length, icon: 'home', color: colors.safaikarmi, bg: colors.safaikarmiBg },
    { label: 'Garbage Collected', value: collected, icon: 'check-circle', color: colors.resolved, bg: colors.resolvedBg },
    { label: 'Present Days', value: presentDays, icon: 'calendar', color: colors.citizen, bg: colors.citizenBg },
    { label: 'Efficiency', value: `${efficiency}%`, icon: 'trending-up', color: RATING_COLOR, bg: colors.surface },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Performance</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Overall work metrics and stats</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        {/* Rating card */}
        <View style={[styles.ratingCard, { backgroundColor: RATING_COLOR + '15', borderColor: RATING_COLOR + '40' }]}>
          <View style={[styles.ratingCircle, { backgroundColor: RATING_COLOR + '25' }]}>
            <Text style={[styles.ratingPct, { color: RATING_COLOR }]}>{efficiency}%</Text>
          </View>
          <View>
            <Text style={[styles.ratingLabel, { color: RATING_COLOR }]}>{RATING}</Text>
            <Text style={[styles.ratingSub, { color: colors.mutedForeground }]}>Collection Efficiency</Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.grid}>
          {STATS.map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconWrap, { backgroundColor: s.bg }]}>
                <Feather name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Performance */}
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.detailTitle, { color: colors.text }]}>Performance Details</Text>
          {[
            { label: 'Houses Visited', value: `${visits.length}`, icon: 'home' },
            { label: 'Garbage Collected', value: `${collected}/${visits.length}`, icon: 'trash-2' },
            { label: 'Attendance Days', value: `${presentDays}`, icon: 'calendar' },
            { label: 'Collection Rate', value: `${efficiency}%`, icon: 'percent' },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.detailRow, { borderBottomColor: colors.border, borderBottomWidth: i < arr.length - 1 ? 1 : 0 }]}>
              <Feather name={item.icon as any} size={15} color={colors.mutedForeground} />
              <Text style={[styles.detailLabel, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.detailValue, { color: colors.safaikarmi }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.tipCard, { backgroundColor: colors.citizenBg, borderColor: colors.citizen + '40' }]}>
          <Feather name="star" size={16} color={colors.citizen} />
          <Text style={[styles.tipText, { color: colors.text }]}>
            Keep your collection rate above 90% to earn the 'Top Performer' badge this month!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  ratingCard: { flexDirection: 'row', alignItems: 'center', gap: 20, borderRadius: 16, padding: 20, borderWidth: 1.5 },
  ratingCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  ratingPct: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  ratingLabel: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  ratingSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', borderRadius: 12, padding: 14, borderWidth: 1, gap: 6 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  detailCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  detailTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', padding: 16, paddingBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  detailLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  detailValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  tipCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 14, padding: 16, borderWidth: 1 },
  tipText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
});
