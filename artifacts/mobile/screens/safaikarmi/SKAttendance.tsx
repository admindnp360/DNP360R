import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function SKAttendance() {
  const { user } = useAuth();
  const { getAttendanceByWorker, isTodayAttendanceMarked, markAttendance } = useAppData();
  const colors = useColors();

  const history = getAttendanceByWorker(user?.id ?? '');
  const markedToday = isTodayAttendanceMarked(user?.id ?? '');
  const presentDays = history.filter(a => a.status === 'present').length;

  async function handleMark() {
    if (markedToday) { Alert.alert('Already Marked', 'Your attendance for today has already been recorded.'); return; }
    const ok = await markAttendance(user?.id ?? '', 'manual');
    if (ok) Alert.alert('✓ Marked!', `Attendance marked at ${new Date().toLocaleTimeString()}`);
    else Alert.alert('Error', 'Could not mark attendance.');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Attendance</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        {/* Today Status */}
        <View style={[styles.todayCard, { backgroundColor: markedToday ? colors.resolvedBg : colors.assignedBg, borderColor: markedToday ? colors.resolved : colors.assigned }]}>
          <Feather name={markedToday ? 'check-circle' : 'clock'} size={32} color={markedToday ? colors.resolved : colors.assigned} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.todayLabel, { color: markedToday ? colors.resolved : colors.assigned }]}>
              {markedToday ? 'Present Today' : 'Not Marked Yet'}
            </Text>
            <Text style={[styles.todaySub, { color: colors.mutedForeground }]}>
              {markedToday ? 'Your attendance is recorded for today' : 'Mark your attendance to get started'}
            </Text>
          </View>
        </View>

        {!markedToday && (
          <TouchableOpacity style={[styles.markBtn, { backgroundColor: colors.safaikarmi }]} onPress={handleMark} activeOpacity={0.85}>
            <Feather name="check-circle" size={18} color="#fff" />
            <Text style={styles.markBtnText}>Mark Today's Attendance</Text>
          </TouchableOpacity>
        )}

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryNum, { color: colors.safaikarmi }]}>{presentDays}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Present</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryNum, { color: colors.assigned }]}>{history.filter(a => a.status === 'absent').length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Absent</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryNum, { color: colors.citizen }]}>{history.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance History</Text>
        {history.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>No attendance records yet.</Text>
          </View>
        )}
        {history.map(a => (
          <View key={a.id} style={[styles.histRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.dot, { backgroundColor: a.status === 'present' ? colors.resolved : colors.destructive }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.histDate, { color: colors.text }]}>{a.date}</Text>
              <Text style={[styles.histMethod, { color: colors.mutedForeground }]}>via {a.method}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: a.status === 'present' ? colors.resolvedBg : '#FDECEA' }]}>
              <Text style={[styles.statusText, { color: a.status === 'present' ? colors.resolved : colors.destructive }]}>
                {a.status === 'present' ? 'Present' : 'Absent'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  todayCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 16, padding: 20, borderWidth: 1.5 },
  todayLabel: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  todaySub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3, lineHeight: 17 },
  markBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15 },
  markBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 16, borderWidth: 1, alignItems: 'center', gap: 4 },
  summaryNum: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  summaryLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  histDate: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  histMethod: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  empty: { borderRadius: 12, padding: 24, borderWidth: 1, alignItems: 'center' },
});
