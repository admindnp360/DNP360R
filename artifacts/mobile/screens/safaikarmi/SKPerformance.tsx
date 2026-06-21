import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function SKPerformance() {
  const { user } = useAuth();
  const { getVisitsByWorker, getAttendanceByWorker, wards } = useAppData();
  const colors = useColors();

  const visits = getVisitsByWorker(user?.id ?? '');
  const attendance = getAttendanceByWorker(user?.id ?? '');
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const collected = visits.filter(v => v.collectedGarbage).length;
  const efficiency = visits.length > 0 ? Math.round((collected / visits.length) * 100) : 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => v.visitDate === todayStr).length;
  const myWard = wards.find(w => w.id === user?.wardId);
  const totalHouses = myWard?.totalHouses ?? 0;
  const todayProgress = totalHouses > 0 ? Math.min(100, Math.round((todayVisits / totalHouses) * 100)) : 0;

  const RATING =
    efficiency >= 90 ? 'Excellent' :
    efficiency >= 75 ? 'Good' :
    efficiency >= 50 ? 'Average' :
    'Needs Improvement';

  const RATING_COLOR =
    efficiency >= 90 ? colors.resolved :
    efficiency >= 75 ? colors.safaikarmi :
    efficiency >= 50 ? colors.assigned :
    colors.destructive;

  const BADGES: { label: string; icon: string; earned: boolean; desc: string }[] = [
    { label: 'Perfect Collector', icon: 'award', earned: efficiency >= 95, desc: '95%+ collection rate' },
    { label: 'Consistent Worker', icon: 'calendar', earned: presentDays >= 20, desc: '20+ present days' },
    { label: 'House Pro', icon: 'home', earned: visits.length >= 50, desc: '50+ houses visited' },
    { label: 'Zero Skips', icon: 'check-circle', earned: efficiency === 100 && visits.length > 0, desc: '100% collection rate' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Performance</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Work metrics and achievements</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
        {/* Hero Efficiency Card */}
        <LinearGradient
          colors={efficiency >= 75 ? ['#003D1C', '#006A35'] : efficiency >= 50 ? ['#7A3800', '#A85000'] : ['#5F0000', '#9A0000']}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroRatingLabel}>{RATING}</Text>
              <Text style={styles.heroDesc}>Collection Efficiency</Text>
            </View>
            <View style={styles.heroCircle}>
              <Text style={styles.heroPct}>{efficiency}%</Text>
            </View>
          </View>
          <View style={[styles.heroBar, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <View style={[styles.heroBarFill, { width: `${efficiency}%`, backgroundColor: 'rgba(255,255,255,0.85)' }]} />
          </View>
          <View style={styles.heroStats}>
            {[
              { label: 'Collected', value: collected },
              { label: 'Total Visits', value: visits.length },
              { label: 'Skipped', value: visits.length - collected },
            ].map((s, i) => (
              <View key={s.label} style={[styles.heroStat, i < 2 && { borderRightColor: 'rgba(255,255,255,0.2)', borderRightWidth: 1 }]}>
                <Text style={styles.heroStatVal}>{s.value}</Text>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Today Progress */}
        <View style={[styles.todayCard, { backgroundColor: colors.card, borderColor: colors.safaikarmi + '50' }]}>
          <View style={styles.todayTop}>
            <View style={[styles.todayIcon, { backgroundColor: colors.safaikarmiBg }]}>
              <Feather name="sun" size={16} color={colors.safaikarmi} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.todayTitle, { color: colors.text }]}>Today's Progress</Text>
              <Text style={[styles.todaySub, { color: colors.mutedForeground }]}>{todayVisits} of {totalHouses} houses</Text>
            </View>
            <Text style={[styles.todayPct, { color: colors.safaikarmi }]}>{todayProgress}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
            <LinearGradient colors={['#006A35', '#00A550']} style={[styles.progressFill, { width: `${todayProgress}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          {[
            { label: 'Total Visits', value: visits.length, icon: 'home', color: colors.safaikarmi, bg: colors.safaikarmiBg },
            { label: 'Present Days', value: presentDays, icon: 'calendar', color: colors.citizen, bg: colors.citizenBg },
            { label: 'Absent Days', value: attendance.filter(a => a.status === 'absent').length, icon: 'x-circle', color: colors.destructive, bg: '#FDECEA' },
            { label: 'Garbage Collected', value: collected, icon: 'check-circle', color: colors.resolved, bg: colors.resolvedBg },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <Feather name={s.icon as any} size={16} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map(b => (
            <View
              key={b.label}
              style={[styles.badge, {
                backgroundColor: b.earned ? colors.safaikarmiBg : colors.card,
                borderColor: b.earned ? colors.safaikarmi + '60' : colors.border,
                opacity: b.earned ? 1 : 0.5,
              }]}
            >
              <View style={[styles.badgeIcon, { backgroundColor: b.earned ? colors.safaikarmi : colors.surface }]}>
                <Feather name={b.icon as any} size={18} color={b.earned ? '#fff' : colors.mutedForeground} />
              </View>
              <Text style={[styles.badgeName, { color: b.earned ? colors.text : colors.mutedForeground }]} numberOfLines={2}>{b.label}</Text>
              <Text style={[styles.badgeDesc, { color: colors.mutedForeground }]}>{b.desc}</Text>
              {b.earned && (
                <View style={[styles.earnedBadge, { backgroundColor: colors.safaikarmi }]}>
                  <Text style={styles.earnedText}>✓</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Performance Details */}
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.detailTitle, { color: colors.text }]}>Performance Details</Text>
          {[
            { label: 'Houses Visited', value: `${visits.length}`, icon: 'home', color: colors.safaikarmi },
            { label: 'Garbage Collected', value: `${collected} / ${visits.length}`, icon: 'trash-2', color: colors.resolved },
            { label: 'Attendance Days', value: `${presentDays}`, icon: 'calendar', color: colors.citizen },
            { label: 'Collection Rate', value: `${efficiency}%`, icon: 'trending-up', color: RATING_COLOR },
            { label: 'Today\'s Progress', value: `${todayVisits} / ${totalHouses}`, icon: 'sun', color: colors.official },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.detailRow, { borderBottomColor: colors.border, borderBottomWidth: i < arr.length - 1 ? 1 : 0 }]}>
              <View style={[styles.detailIconWrap, { backgroundColor: item.color + '15' }]}>
                <Feather name={item.icon as any} size={14} color={item.color} />
              </View>
              <Text style={[styles.detailLabel, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.detailValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.tipCard, { backgroundColor: colors.safaikarmiBg, borderColor: colors.safaikarmi + '40' }]}>
          <Feather name="star" size={16} color={colors.safaikarmi} />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {efficiency >= 90
              ? `Outstanding work! Keep maintaining 90%+ efficiency to stay a Top Performer.`
              : `Reach 90%+ collection efficiency to earn the Excellent rating and Top Performer badge!`}
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
  heroCard: { borderRadius: 20, padding: 20, gap: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroRatingLabel: { color: '#FFFFFF', fontSize: 24, fontFamily: 'Inter_700Bold' },
  heroDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  heroCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  heroPct: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Inter_700Bold' },
  heroBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  heroBarFill: { height: '100%', borderRadius: 3 },
  heroStats: { flexDirection: 'row' },
  heroStat: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  heroStatVal: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Inter_700Bold' },
  heroStatLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
  todayCard: { borderRadius: 14, padding: 14, borderWidth: 1.5, gap: 10 },
  todayTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todayIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  todayTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  todaySub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  todayPct: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', flexGrow: 1, borderRadius: 14, padding: 14, borderWidth: 1, gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '47%', flexGrow: 1, borderRadius: 14, padding: 14, borderWidth: 1, gap: 6, alignItems: 'center', position: 'relative' },
  badgeIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  badgeName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  badgeDesc: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  earnedBadge: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  earnedText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  detailCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  detailTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', padding: 16, paddingBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  detailIconWrap: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  detailLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  detailValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  tipCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 14, padding: 16, borderWidth: 1 },
  tipText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
});
