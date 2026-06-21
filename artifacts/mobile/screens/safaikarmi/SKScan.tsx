import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  function nowTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  async function markVisit(regNum: string) {
    const reg = regNum.trim().toUpperCase();
    const house = getHouseByRegistration(reg) ?? houses.find(h => h.registrationNumber.toUpperCase() === reg);
    if (!house) {
      Alert.alert('Not Found', `House "${regNum}" is not registered.`);
      return;
    }
    const visitDate = new Date().toISOString().split('T')[0];
    await addHouseVisit({
      houseId: house.id,
      houseRegistrationNumber: house.registrationNumber,
      ownerName: house.ownerName,
      address: house.address,
      workerId: user?.id ?? '',
      workerName: user?.name,
      wardId: house.wardId,
      collectedGarbage: garbageCollected,
      notes: notes.trim() || undefined,
      visitDate,
      visitTime: nowTime(),
      status: 'visited',
    });
    setManualReg('');
    setNotes('');
    Alert.alert('✓ Visit Recorded', `${house.ownerName}\n${house.address}\n\nGarbage: ${garbageCollected ? '✓ Collected' : '✗ Not Collected'}`);
  }

  async function simulateScan() {
    if (houses.length === 0) { Alert.alert('No Houses', 'No houses registered in the system.'); return; }
    setScanning(true);
    await new Promise(r => setTimeout(r, 1800));
    const randomHouse = houses[Math.floor(Math.random() * houses.length)];
    setScanning(false);
    await markVisit(randomHouse.registrationNumber);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>QR Scanner</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>Mark house visits by scanning or manual entry</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: colors.safaikarmiBg }]}>
          <Feather name="camera" size={14} color={colors.safaikarmi} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Camera Frame */}
        <View style={[styles.scanFrame, { borderColor: colors.border }]}>
          <View style={styles.cameraArea}>
            <LinearGradient colors={['#0A1A0F', '#142B1A']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.corners}>
              {([['tl', true, false], ['tr', true, true], ['bl', false, false], ['br', false, true]] as const).map(([pos, top, right]) => (
                <View
                  key={pos}
                  style={[
                    styles.corner,
                    top ? { top: 18 } : { bottom: 18 },
                    right ? { right: 18 } : { left: 18 },
                    !top && !right && { borderBottomWidth: 3, borderLeftWidth: 3 },
                    !top && right && { borderBottomWidth: 3, borderRightWidth: 3 },
                    top && !right && { borderTopWidth: 3, borderLeftWidth: 3 },
                    top && right && { borderTopWidth: 3, borderRightWidth: 3 },
                  ]}
                />
              ))}
            </View>
            {scanning ? (
              <View style={styles.scanMessage}>
                <View style={[styles.scanningPulse, { borderColor: '#7EFBA4' }]}>
                  <Feather name="loader" size={28} color="#7EFBA4" />
                </View>
                <Text style={styles.scanText}>Scanning QR Code…</Text>
                <Text style={styles.scanSubText}>Please wait</Text>
              </View>
            ) : (
              <View style={styles.scanMessage}>
                <View style={[styles.scanIcon, { borderColor: '#7EFBA4' }]}>
                  <Feather name="maximize" size={30} color="#7EFBA4" />
                </View>
                <Text style={styles.scanText}>Point at House QR Code</Text>
                <Text style={styles.scanSubText}>Simulated camera view</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: colors.safaikarmi, opacity: scanning ? 0.7 : 1 }]}
            onPress={simulateScan}
            disabled={scanning}
            activeOpacity={0.85}
          >
            <Feather name="camera" size={18} color="#fff" />
            <Text style={styles.scanBtnText}>{scanning ? 'Scanning…' : 'Simulate QR Scan'}</Text>
          </TouchableOpacity>
        </View>

        {/* Manual Entry */}
        <View style={[styles.manualCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.manualCardHeader}>
            <View style={[styles.manualIcon, { backgroundColor: colors.safaikarmiBg }]}>
              <Feather name="edit-3" size={16} color={colors.safaikarmi} />
            </View>
            <View>
              <Text style={[styles.manualTitle, { color: colors.text }]}>Manual Entry</Text>
              <Text style={[styles.manualSub, { color: colors.mutedForeground }]}>Enter registration number</Text>
            </View>
          </View>

          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="hash" size={16} color={colors.safaikarmi} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. DNPH001"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
              value={manualReg}
              onChangeText={setManualReg}
            />
          </View>

          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Garbage Status</Text>
            <View style={styles.toggleBtns}>
              <TouchableOpacity
                style={[styles.toggleBtn, { backgroundColor: garbageCollected ? colors.safaikarmi : colors.surface, borderColor: garbageCollected ? colors.safaikarmi : colors.border }]}
                onPress={() => setGarbageCollected(true)}
              >
                <Feather name="check" size={13} color={garbageCollected ? '#fff' : colors.mutedForeground} />
                <Text style={[styles.toggleBtnText, { color: garbageCollected ? '#fff' : colors.mutedForeground }]}>Collected</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, { backgroundColor: !garbageCollected ? colors.destructive : colors.surface, borderColor: !garbageCollected ? colors.destructive : colors.border }]}
                onPress={() => setGarbageCollected(false)}
              >
                <Feather name="x" size={13} color={!garbageCollected ? '#fff' : colors.mutedForeground} />
                <Text style={[styles.toggleBtnText, { color: !garbageCollected ? '#fff' : colors.mutedForeground }]}>Not Collected</Text>
              </TouchableOpacity>
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
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: colors.text }]}>Recent Visits</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.safaikarmiBg }]}>
            <Text style={[styles.countText, { color: colors.safaikarmi }]}>{recentVisits.length}</Text>
          </View>
        </View>
        {recentVisits.map(v => (
          <View key={v.id} style={[styles.visitRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.visitIcon, { backgroundColor: colors.safaikarmiBg }]}>
              <Feather name="home" size={15} color={colors.safaikarmi} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.visitReg, { color: colors.text }]}>{v.houseRegistrationNumber}</Text>
              <Text style={[styles.visitTime, { color: colors.mutedForeground }]}>{v.visitDate} · {v.visitTime}</Text>
            </View>
            <View style={[styles.garbageBadge, { backgroundColor: v.collectedGarbage ? colors.resolvedBg : '#FDECEA' }]}>
              <Feather name={v.collectedGarbage ? 'check' : 'x'} size={11} color={v.collectedGarbage ? colors.resolved : colors.destructive} />
            </View>
          </View>
        ))}
        {recentVisits.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="camera-off" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No visits yet. Start scanning!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  headerBadge: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  cameraArea: { height: 220, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  corners: { ...StyleSheet.absoluteFillObject },
  corner: { position: 'absolute', width: 26, height: 26, borderColor: '#7EFBA4' },
  scanMessage: { alignItems: 'center', gap: 10 },
  scanIcon: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(126,251,164,0.1)' },
  scanningPulse: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(126,251,164,0.1)' },
  scanText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  scanSubText: { color: '#7EFBA4', fontSize: 11, fontFamily: 'Inter_400Regular' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  scanBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  manualCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  manualCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  manualIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  manualTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  manualSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 13 },
  toggleContainer: { gap: 8 },
  toggleLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  toggleBtns: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  toggleBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  markBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  markBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  recentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recentTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  countText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  visitIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  visitReg: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  visitTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  garbageBadge: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  empty: { borderRadius: 14, padding: 32, borderWidth: 1, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
