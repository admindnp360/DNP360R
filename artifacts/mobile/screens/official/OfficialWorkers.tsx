import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '@/components/SearchBar';
import { useAppData } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

export default function OfficialWorkers() {
  const { users, getAttendanceByWorker, isTodayAttendanceMarked } = useAppData();
  const colors = useColors();
  const [search, setSearch] = useState('');

  const workers = users.filter(u => u.role === 'safaikarmi' && (
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || (u.employeeId ?? '').toLowerCase().includes(search.toLowerCase())
  ));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Workers</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>{workers.length} safai karmis</Text>
      </View>

      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search workers…" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
        {workers.map(w => {
          const markedToday = isTodayAttendanceMarked(w.id);
          const att = getAttendanceByWorker(w.id);
          const present = att.filter(a => a.status === 'present').length;
          return (
            <View key={w.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.top}>
                <View style={[styles.avatar, { backgroundColor: colors.safaikarmiBg }]}>
                  <Text style={[styles.avatarLetter, { color: colors.safaikarmi }]}>{w.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.text }]}>{w.name}</Text>
                  <Text style={[styles.empId, { color: colors.mutedForeground }]}>{w.employeeId ?? 'N/A'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: markedToday ? colors.resolvedBg : colors.submittedBg }]}>
                  <Feather name={markedToday ? 'check-circle' : 'clock'} size={11} color={markedToday ? colors.resolved : colors.submitted} />
                  <Text style={[styles.statusText, { color: markedToday ? colors.resolved : colors.submitted }]}>
                    {markedToday ? 'Present' : 'Absent'}
                  </Text>
                </View>
              </View>
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Feather name="calendar" size={12} color={colors.mutedForeground} />
                <Text style={[styles.footerText, { color: colors.mutedForeground }]}>{present} days present</Text>
                {w.wardId && (
                  <>
                    <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Ward {w.wardId.replace(/[^0-9]/g, '')}</Text>
                  </>
                )}
              </View>
            </View>
          );
        })}
        {workers.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={36} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>No workers found</Text>
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
  controls: { padding: 16 },
  card: { borderRadius: 12, padding: 14, borderWidth: 1, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  empId: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 10, borderTopWidth: 1 },
  footerText: { fontSize: 11, fontFamily: 'Inter_400Regular', marginRight: 8 },
  empty: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center', gap: 10 },
});
