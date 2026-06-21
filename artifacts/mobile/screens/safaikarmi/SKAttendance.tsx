import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function SKAttendance() {
  const { user } = useAuth();
  const { getAttendanceByWorker, isTodayAttendanceMarked, markAttendance } = useAppData();
  const colors = useColors();
  const [monthOffset, setMonthOffset] = useState(0);

  const history = getAttendanceByWorker(user?.id ?? '');
  const markedToday = isTodayAttendanceMarked(user?.id ?? '');
  const presentDays = history.filter(a => a.status === 'present').length;
  const absentDays = history.filter(a => a.status === 'absent').length;

  const now = new Date();
  const displayDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthKey = `${displayDate.getFullYear()}-${(displayDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const monthLabel = displayDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const monthRecords = history.filter(a => a.date.startsWith(monthKey));
  const monthPresent = monthRecords.filter(a => a.status === 'present').length;

  const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();

  async function handleMark() {
    if (markedToday) { Alert.alert('Already Marked', 'Your attendance is already recorded for today.'); return; }
    const ok = await markAttendance(user?.id ?? '', 'manual');
    if (ok) Alert.alert('✓ Marked!', `Attendance recorded at ${new Date().toLocaleTimeString()}`);
    else Alert.alert('Error', 'Could not mark attendance.');
  }

  function getStatusForDate(day: number): 'present' | 'absent' | 'none' {
    const dateStr = `${monthKey}-${day.toString().padStart(2, '0')}`;
    const record = history.find(a => a.date === dateStr);
    if (!record) return 'none';
    return record.status === 'present' ? 'present' : 'absent';
  }

  const isToday = (day: number) => {
    const today = new Date();
    return monthOffset === 0 && day === today.getDate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Attendance</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
        {/* Today Status */}
        <View style={[styles.todayCard, { backgroundColor: markedToday ? colors.resolvedBg : '#FFF8E1', borderColor: markedToday ? colors.resolved + '60' : '#FFD54F60' }]}>
          <View style={[styles.todayIconWrap, { backgroundColor: markedToday ? colors.resolved + '20' : '#FFD54F30' }]}>
            <Feather name={markedToday ? 'check-circle' : 'clock'} size={26} color={markedToday ? colors.resolved : '#F57F17'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.todayStatus, { color: markedToday ? colors.resolved : '#E65100' }]}>
              {markedToday ? 'Present Today' : 'Not Marked Yet'}
            </Text>
            <Text style={[styles.todaySub, { color: colors.mutedForeground }]}>
              {markedToday ? 'Attendance is recorded for today' : 'Mark attendance to get started'}
            </Text>
          </View>
        </View>

        {!markedToday && (
          <TouchableOpacity style={styles.markBtn} onPress={handleMark} activeOpacity={0.85}>
            <LinearGradient colors={['#006A35', '#00A550']} style={styles.markBtnGradient}>
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.markBtnText}>Mark Today's Attendance</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Present', value: presentDays, color: colors.resolved, bg: colors.resolvedBg, icon: 'check-circle' },
            { label: 'Absent', value: absentDays, color: colors.destructive, bg: '#FDECEA', icon: 'x-circle' },
            { label: 'This Month', value: monthPresent, color: colors.safaikarmi, bg: colors.safaikarmiBg, icon: 'calendar' },
          ].map(s => (
            <View key={s.label} style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.summaryIconWrap, { backgroundColor: s.bg }]}>
                <Feather name={s.icon as any} size={14} color={s.color} />
              </View>
              <Text style={[styles.summaryVal, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Calendar */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.calendarNav}>
            <TouchableOpacity onPress={() => setMonthOffset(o => o - 1)} style={[styles.navBtn, { backgroundColor: colors.surface }]}>
              <Feather name="chevron-left" size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => setMonthOffset(o => Math.min(0, o + 1))} style={[styles.navBtn, { backgroundColor: colors.surface }]} disabled={monthOffset === 0}>
              <Feather name="chevron-right" size={18} color={monthOffset === 0 ? colors.mutedForeground : colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <Text key={d} style={[styles.weekDay, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {Array.from({ length: firstDayOfWeek }, (_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const status = getStatusForDate(day);
              const today = isToday(day);
              const dayOfWeek = new Date(displayDate.getFullYear(), displayDate.getMonth(), day).getDay();
              const isSunday = dayOfWeek === 0;
              return (
                <View key={day} style={[styles.dayCell, today && styles.todayCell]}>
                  <View style={[
                    styles.dayCircle,
                    status === 'present' && { backgroundColor: colors.safaikarmi },
                    status === 'absent' && { backgroundColor: '#FDECEA' },
                    today && status === 'none' && { borderWidth: 2, borderColor: colors.safaikarmi },
                  ]}>
                    <Text style={[
                      styles.dayText,
                      { color: status === 'present' ? '#fff' : status === 'absent' ? colors.destructive : isSunday ? colors.mutedForeground : colors.text },
                      today && status === 'none' && { color: colors.safaikarmi, fontFamily: 'Inter_700Bold' },
                    ]}>
                      {day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.legend}>
            {[
              { color: colors.safaikarmi, label: 'Present' },
              { color: '#FDECEA', label: 'Absent', textColor: colors.destructive },
              { color: 'transparent', label: 'Not recorded', border: colors.mutedForeground },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color, borderWidth: l.border ? 1 : 0, borderColor: l.border }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* History */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>History ({history.length})</Text>
        {history.slice(0, 10).map(a => (
          <View key={a.id} style={[styles.histRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.histDot, { backgroundColor: a.status === 'present' ? colors.resolved : colors.destructive }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.histDate, { color: colors.text }]}>{a.date}</Text>
              <Text style={[styles.histMethod, { color: colors.mutedForeground }]}>
                via {a.method} {a.checkInTime ? `· ${a.checkInTime}` : ''}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: a.status === 'present' ? colors.resolvedBg : '#FDECEA' }]}>
              <Text style={[styles.statusText, { color: a.status === 'present' ? colors.resolved : colors.destructive }]}>
                {a.status === 'present' ? 'Present' : 'Absent'}
              </Text>
            </View>
          </View>
        ))}
        {history.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>No attendance records yet.</Text>
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
  todayCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 18, borderWidth: 1.5 },
  todayIconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  todayStatus: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  todaySub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  markBtn: { borderRadius: 16, overflow: 'hidden' },
  markBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  markBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center', gap: 6 },
  summaryIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  summaryVal: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  summaryLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  calendarCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  calendarNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  weekDays: { flexDirection: 'row' },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_600SemiBold', paddingVertical: 4 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 3 },
  todayCell: {},
  dayCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  legend: { flexDirection: 'row', gap: 14, justifyContent: 'center', paddingTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  histDot: { width: 10, height: 10, borderRadius: 5 },
  histDate: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  histMethod: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  empty: { borderRadius: 12, padding: 24, borderWidth: 1, alignItems: 'center' },
});
