import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatCard } from '@/components/StatCard';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function SKHome() {
  const { user } = useAuth();
  const { wards, getVisitsByWorker, getAttendanceByWorker, isTodayAttendanceMarked, markAttendance } = useAppData();
  const colors = useColors();

  const myWard = wards.find(w => w.id === user?.wardId);
  const todayStr = new Date().toISOString().split('T')[0];
  const visits = getVisitsByWorker(user?.id ?? '');
  const todayVisits = visits.filter(v => v.visitedAt?.startsWith(todayStr));
  const attendance = getAttendanceByWorker(user?.id ?? '');
  const attendanceMarked = isTodayAttendanceMarked(user?.id ?? '');

  async function handleMarkAttendance() {
    if (attendanceMarked) { Alert.alert('Already Marked', 'Your attendance for today is already marked.'); return; }
    const success = await markAttendance(user?.id ?? '', 'manual');
    if (success) Alert.alert('✓ Attendance Marked', `Marked at ${new Date().toLocaleTimeString()}`);
    else Alert.alert('Error', 'Could not mark attendance. Try again.');
  }

  const totalHouses = myWard?.totalHouses ?? 0;
  const progressPct = totalHouses > 0 ? Math.min(100, Math.round((todayVisits.length / totalHouses) * 100)) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <LinearGradient colors={['#004D20', '#006A35']} style={styles.header}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>Good Day,</Text>
              <Text style={styles.name}>{user?.name ?? 'Worker'}</Text>
              <Text style={styles.emp}>ID: {user?.employeeId ?? 'N/A'}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{(user?.name ?? 'S')[0]}</Text>
            </View>
          </View>
          <View style={[styles.attendanceBadge, { backgroundColor: attendanceMarked ? 'rgba(120,255,150,0.2)' : 'rgba(255,200,100,0.2)' }]}>
            <Feather name={attendanceMarked ? 'check-circle' : 'clock'} size={13} color={attendanceMarked ? '#A0FFB0' : '#FFCC88'} />
            <Text style={[styles.attendanceText, { color: attendanceMarked ? '#A0FFB0' : '#FFCC88' }]}>
              {attendanceMarked ? 'Attendance Marked Today' : 'Attendance Not Marked Yet'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {!attendanceMarked && (
            <TouchableOpacity style={[styles.markBtn, { backgroundColor: colors.safaikarmi }]} onPress={handleMarkAttendance} activeOpacity={0.85}>
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.markBtnText}>Mark Today's Attendance</Text>
            </TouchableOpacity>
          )}

          <View style={styles.grid}>
            <StatCard label="Today's Visits" value={todayVisits.length} icon="home" iconColor={colors.safaikarmi} iconBg={colors.safaikarmiBg} accentLeft={colors.safaikarmi} />
            <StatCard label="Total Houses" value={totalHouses} icon="map" iconColor={colors.citizen} iconBg={colors.citizenBg} accentLeft={colors.citizen} />
          </View>
          <View style={styles.grid}>
            <StatCard label="This Month" value={attendance.length} icon="calendar" iconColor={colors.accent} iconBg={colors.submittedBg} accentLeft={colors.accent} />
            <StatCard label="Progress" value={`${progressPct}%`} icon="trending-up" iconColor={colors.resolved} iconBg={colors.resolvedBg} accentLeft={colors.resolved} />
          </View>

          {myWard && (
            <View style={[styles.wardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.wardTop}>
                <View style={[styles.wardIcon, { backgroundColor: colors.safaikarmiBg }]}>
                  <Feather name="map-pin" size={18} color={colors.safaikarmi} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.wardName, { color: colors.text }]}>{myWard.name}</Text>
                  <Text style={[styles.wardArea, { color: colors.mutedForeground }]}>{myWard.area}</Text>
                </View>
                <View style={[styles.wardNum, { backgroundColor: colors.safaikarmiBg }]}>
                  <Text style={[styles.wardNumText, { color: colors.safaikarmi }]}>W-{myWard.wardNumber}</Text>
                </View>
              </View>

              <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
                <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: colors.safaikarmi }]} />
              </View>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                {todayVisits.length} of {totalHouses} houses visited today ({progressPct}%)
              </Text>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Visits</Text>
          {visits.slice(0, 5).map(v => (
            <View key={v.id} style={[styles.visitRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.visitIcon, { backgroundColor: colors.safaikarmiBg }]}>
                <Feather name="home" size={16} color={colors.safaikarmi} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.visitHouse, { color: colors.text }]}>{v.houseRegistrationNumber}</Text>
                <Text style={[styles.visitTime, { color: colors.mutedForeground }]}>{v.visitedAt}</Text>
              </View>
              <View style={[styles.visitBadge, { backgroundColor: v.collectedGarbage ? colors.resolvedBg : colors.submittedBg }]}>
                <Text style={{ fontSize: 10, fontFamily: 'Inter_500Medium', color: v.collectedGarbage ? colors.resolved : colors.submitted }}>
                  {v.collectedGarbage ? '✓ Collected' : 'No Collection'}
                </Text>
              </View>
            </View>
          ))}
          {visits.length === 0 && (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }]}>No visits recorded yet. Start scanning QR codes!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 14, paddingBottom: 28, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  greeting: { color: '#9FFCB0', fontSize: 13, fontFamily: 'Inter_400Regular' },
  name: { color: '#FFFFFF', fontSize: 24, fontFamily: 'Inter_700Bold' },
  emp: { color: '#7EFBA4', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Inter_700Bold' },
  attendanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, alignSelf: 'flex-start' },
  attendanceText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  body: { padding: 16, gap: 14 },
  markBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15 },
  markBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  grid: { flexDirection: 'row', gap: 10 },
  wardCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 12 },
  wardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wardIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  wardName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  wardArea: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  wardNum: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  wardNumText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  visitIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  visitHouse: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  visitTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  visitBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  empty: { borderRadius: 12, padding: 24, borderWidth: 1, alignItems: 'center' },
});
