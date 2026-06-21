import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function SKScan() {
  const { user } = useAuth();
  const { houses, getHouseByRegistration, addHouseVisit, getVisitsByWorker } = useAppData();
  const colors = useColors();

  const [manualReg, setManualReg] = useState('');
  const [scanning, setScanning] = useState(false);
  const [garbageCollected, setGarbageCollected] = useState(true);
  const [notes, setNotes] = useState('');

  const recentVisits = getVisitsByWorker(user?.id ?? '').slice(0, 8);

  async function simulateScan() {
    setScanning(true);
    await new Promise(r => setTimeout(r, 1500));
    const randomHouse = houses[Math.floor(Math.random() * houses.length)];
    setScanning(false);
    if (randomHouse) {
      await markVisit(randomHouse.registrationNumber);
    }
  }

  async function markVisit(regNum: string) {
    const house = getHouseByRegistration(regNum.trim().toUpperCase()) ??
      houses.find(h => h.registrationNumber.toUpperCase() === regNum.trim().toUpperCase());

    if (!house) {
      Alert.alert('Not Found', `House "${regNum}" is not registered. Verify the registration number.`);
      return;
    }
    await addHouseVisit({
      houseId: house.id,
      houseRegistrationNumber: house.registrationNumber,
      workerId: user?.id ?? '',
      wardId: house.wardId,
      collectedGarbage: garbageCollected,
      notes: notes.trim() || undefined,
      visitedAt: new Date().toISOString(),
    });
    setManualReg('');
    setNotes('');
    Alert.alert('✓ Visit Marked', `${house.ownerName}\n${house.address}\n\nGarbage: ${garbageCollected ? 'Collected' : 'Not Collected'}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Scan QR Code</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Mark house visit by scanning or manual entry</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Camera Frame */}
        <View style={[styles.scanFrame, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cameraArea, { backgroundColor: '#0F1C2C' }]}>
            <View style={styles.corners}>
              {[['tl', 0], ['tr', 0], ['bl', 1], ['br', 1]].map(([pos, _]) => (
                <View key={pos as string} style={[styles.corner,
                  pos === 'tl' && { top: 20, left: 20, borderTopWidth: 3, borderLeftWidth: 3 },
                  pos === 'tr' && { top: 20, right: 20, borderTopWidth: 3, borderRightWidth: 3 },
                  pos === 'bl' && { bottom: 20, left: 20, borderBottomWidth: 3, borderLeftWidth: 3 },
                  pos === 'br' && { bottom: 20, right: 20, borderBottomWidth: 3, borderRightWidth: 3 },
                ]} />
              ))}
            </View>
            {scanning ? (
              <View style={styles.scanningMsg}>
                <Feather name="loader" size={32} color="#7EFBA4" />
                <Text style={styles.scanningText}>Scanning…</Text>
              </View>
            ) : (
              <View style={styles.scanningMsg}>
                <Feather name="maximize" size={36} color="#7EFBA4" />
                <Text style={styles.scanningText}>Point camera at QR code</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: colors.safaikarmi }, scanning && { opacity: 0.6 }]}
            onPress={simulateScan}
            disabled={scanning}
            activeOpacity={0.85}
          >
            <Feather name="maximize" size={18} color="#fff" />
            <Text style={styles.scanBtnText}>{scanning ? 'Scanning…' : 'Simulate QR Scan'}</Text>
          </TouchableOpacity>
        </View>

        {/* Manual Entry */}
        <View style={[styles.manualCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Manual Entry</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Enter house registration number</Text>

          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="home" size={16} color={colors.safaikarmi} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. DNP-H-001"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
              value={manualReg}
              onChangeText={setManualReg}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Garbage Collected</Text>
            <View style={styles.toggleBtns}>
              {[true, false].map(v => (
                <TouchableOpacity
                  key={v.toString()}
                  style={[styles.toggleBtn, { backgroundColor: garbageCollected === v ? (v ? colors.safaikarmi : colors.destructive) : colors.surface, borderColor: colors.border }]}
                  onPress={() => setGarbageCollected(v)}
                >
                  <Text style={{ color: garbageCollected === v ? '#fff' : colors.mutedForeground, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                    {v ? '✓ Yes' : '✗ No'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="file-text" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <TouchableOpacity
            style={[styles.markBtn, { backgroundColor: colors.safaikarmi, opacity: !manualReg.trim() ? 0.5 : 1 }]}
            onPress={() => markVisit(manualReg)}
            disabled={!manualReg.trim()}
            activeOpacity={0.85}
          >
            <Feather name="check-circle" size={16} color="#fff" />
            <Text style={styles.markBtnText}>Mark House Visit</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Visits */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Visits</Text>
        {recentVisits.map(v => (
          <View key={v.id} style={[styles.visitRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.visitIcon, { backgroundColor: colors.safaikarmiBg }]}>
              <Feather name="home" size={15} color={colors.safaikarmi} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.regNum, { color: colors.text }]}>{v.houseRegistrationNumber}</Text>
              <Text style={[styles.visitTime, { color: colors.mutedForeground }]}>{v.visitedAt}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: v.collectedGarbage ? colors.resolvedBg : colors.submittedBg }]}>
              <Text style={{ fontSize: 10, fontFamily: 'Inter_500Medium', color: v.collectedGarbage ? colors.resolved : colors.submitted }}>
                {v.collectedGarbage ? '✓' : '✗'}
              </Text>
            </View>
          </View>
        ))}
        {recentVisits.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>No visits yet. Start scanning!</Text>
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
  scanFrame: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cameraArea: { height: 220, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  corners: { ...StyleSheet.absoluteFillObject },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#7EFBA4' },
  scanningMsg: { alignItems: 'center', gap: 8 },
  scanningText: { color: '#7EFBA4', fontSize: 13, fontFamily: 'Inter_500Medium' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15 },
  scanBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  manualCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  cardSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: -4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 13 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  toggleBtns: { flexDirection: 'row', gap: 8 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  markBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  markBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  visitIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  regNum: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  visitTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  badge: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  empty: { borderRadius: 12, padding: 24, borderWidth: 1, alignItems: 'center' },
});
