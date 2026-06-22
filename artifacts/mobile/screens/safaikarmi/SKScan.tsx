import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function SKScan() {
  const { user } = useAuth();
  const { houses, getHouseByRegistration, addHouseVisit, getVisitsByWorker } = useAppData();
  const colors = useColors();

  const [scanning, setScanning] = useState(false);
  const [pendingHouse, setPendingHouse] = useState<{ id: string; reg: string; owner: string; address: string; wardId: string } | null>(null);
  const [garbageCollected, setGarbageCollected] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const allVisits = getVisitsByWorker(user?.id ?? '');
  const todayCount = allVisits.filter(v => v.visitDate === todayStr).length;
  const recentVisits = allVisits.slice(0, 6);

  function nowTime() {
    const n = new Date();
    return `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`;
  }

  async function simulateScan() {
    if (houses.length === 0) {
      // Show placeholder result for demo
      setPendingHouse({ id: 'demo', reg: 'DNPH001', owner: 'Ramesh Kumar', address: 'Ward 3, Daudnagar', wardId: 'W3' });
      setGarbageCollected(true);
      return;
    }
    setScanning(true);
    await new Promise(r => setTimeout(r, 1600));
    setScanning(false);
    const h = houses[Math.floor(Math.random() * houses.length)];
    setPendingHouse({ id: h.id, reg: h.registrationNumber, owner: h.ownerName, address: h.address, wardId: h.wardId });
    setGarbageCollected(true);
  }

  async function confirmVisit() {
    if (!pendingHouse) return;
    setConfirming(true);
    const house = getHouseByRegistration(pendingHouse.reg) ?? houses.find(h => h.id === pendingHouse.id);
    if (house) {
      await addHouseVisit({
        houseId: house.id,
        houseRegistrationNumber: house.registrationNumber,
        ownerName: house.ownerName,
        address: house.address,
        workerId: user?.id ?? '',
        workerName: user?.name,
        wardId: house.wardId,
        collectedGarbage: garbageCollected,
        visitDate: new Date().toISOString().split('T')[0],
        visitTime: nowTime(),
        status: 'visited',
      });
    }
    setConfirming(false);
    setPendingHouse(null);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#010D06' }} edges={['top']}>

      {/* ── Hero header ── */}
      <LinearGradient colors={['#010D06', '#042A16', '#084D28']} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>QR Scanner</Text>
            <Text style={styles.heroSub}>Scan house QR to record visit</Text>
          </View>
          <LinearGradient colors={['rgba(52,211,153,0.22)', 'rgba(16,185,129,0.1)']}
            style={styles.heroIconWrap}>
            <Feather name="camera" size={22} color="#34D399" />
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Today', value: todayCount, colors: ['#10B981','#059669'] as const },
            { label: 'Total', value: allVisits.length, colors: ['#3B82F6','#2563EB'] as const },
            { label: 'Houses', value: houses.length, colors: ['#8B5CF6','#6D28D9'] as const },
          ].map(s => (
            <LinearGradient key={s.label} colors={s.colors} style={styles.statPill}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </LinearGradient>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Camera / Scan frame ── */}
        <View style={styles.scanCard}>
          <LinearGradient colors={['#010D06','#031A0F','#052E1A']} style={styles.cameraArea}>

            {/* Corner brackets */}
            {[['tl',true,false],['tr',true,true],['bl',false,false],['br',false,true]].map(([pos,top,right]) => (
              <View key={String(pos)} style={[
                styles.corner,
                top ? { top: 18 } : { bottom: 18 },
                right ? { right: 18 } : { left: 18 },
                !top && !right  && { borderBottomWidth: 3, borderLeftWidth: 3 },
                !top && !!right && { borderBottomWidth: 3, borderRightWidth: 3 },
                !!top && !right  && { borderTopWidth: 3, borderLeftWidth: 3 },
                !!top && !!right && { borderTopWidth: 3, borderRightWidth: 3 },
              ]} />
            ))}

            {/* Animated scan line */}
            {scanning && (
              <LinearGradient
                colors={['transparent','#34D399','transparent']}
                style={styles.scanLine}
              />
            )}

            <View style={styles.cameraCenter}>
              <LinearGradient
                colors={scanning
                  ? ['rgba(52,211,153,0.3)','rgba(16,185,129,0.1)']
                  : ['rgba(52,211,153,0.15)','rgba(16,185,129,0.05)']}
                style={styles.cameraIconRing}
              >
                <Feather name={scanning ? 'loader' : 'maximize'} size={34} color="#34D399" />
              </LinearGradient>
              <Text style={styles.cameraLabel}>
                {scanning ? 'Scanning QR Code…' : 'Point camera at House QR'}
              </Text>
              <Text style={styles.cameraSub}>
                {scanning ? 'Please hold steady' : 'Tap the button below to scan'}
              </Text>
            </View>
          </LinearGradient>

          {/* Scan button */}
          <TouchableOpacity
            onPress={simulateScan}
            disabled={scanning}
            activeOpacity={0.86}
            style={scanning ? { opacity: 0.65 } : {}}
          >
            <LinearGradient colors={['#10B981','#059669']} style={styles.scanBtn}>
              <Feather name="camera" size={18} color="#fff" />
              <Text style={styles.scanBtnTxt}>{scanning ? 'Scanning…' : 'Scan QR Code'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Recent visits ── */}
        <View style={{ gap: 10 }}>
          <View style={styles.sectionHead}>
            <LinearGradient colors={['#3B82F6','#2563EB']} style={styles.sectionIcon}>
              <Feather name="clock" size={13} color="#fff" />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Visits</Text>
            <View style={[styles.countBadge, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[styles.countTxt, { color: '#059669' }]}>{allVisits.length}</Text>
            </View>
          </View>

          {recentVisits.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={['#10B981','#059669']} style={styles.emptyIcon}>
                <Feather name="camera-off" size={24} color="#fff" />
              </LinearGradient>
              <Text style={[styles.emptyTxt, { color: colors.mutedForeground }]}>No visits yet — start scanning!</Text>
            </View>
          ) : (
            recentVisits.map(v => (
              <View key={v.id} style={[styles.visitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <LinearGradient
                  colors={v.collectedGarbage ? ['#10B981','#059669'] : ['#EF4444','#DC2626']}
                  style={styles.visitAccent}
                />
                <View style={styles.visitInner}>
                  <LinearGradient
                    colors={v.collectedGarbage ? ['#10B981','#059669'] : ['#6B7280','#4B5563']}
                    style={styles.visitAvatar}
                  >
                    <Feather name="home" size={13} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.visitReg, { color: colors.text }]}>{v.houseRegistrationNumber}</Text>
                    <Text style={[styles.visitMeta, { color: colors.mutedForeground }]}>
                      {v.visitDate} · {v.visitTime}
                    </Text>
                  </View>
                  <View style={[styles.garbagePill, {
                    backgroundColor: v.collectedGarbage ? '#D1FAE5' : '#FEE2E2',
                  }]}>
                    <Feather name={v.collectedGarbage ? 'check' : 'x'} size={10}
                      color={v.collectedGarbage ? '#059669' : '#DC2626'} />
                    <Text style={[styles.garbageTxt, {
                      color: v.collectedGarbage ? '#059669' : '#DC2626',
                    }]}>{v.collectedGarbage ? 'Collected' : 'Skipped'}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Scan result modal ── */}
      <Modal visible={!!pendingHouse} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>House Scanned</Text>

            {pendingHouse && (
              <>
                {/* House info */}
                <LinearGradient colors={['rgba(52,211,153,0.15)','rgba(16,185,129,0.05)']}
                  style={styles.houseCard}>
                  <LinearGradient colors={['#10B981','#059669']} style={styles.houseAvatar}>
                    <Feather name="home" size={20} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.houseReg}>{pendingHouse.reg}</Text>
                    <Text style={styles.houseOwner}>{pendingHouse.owner}</Text>
                    <Text style={styles.houseAddr}>{pendingHouse.address}</Text>
                  </View>
                </LinearGradient>

                {/* Garbage toggle */}
                <Text style={styles.toggleLabel}>Was garbage collected?</Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity onPress={() => setGarbageCollected(true)} style={{ flex: 1 }} activeOpacity={0.85}>
                    {garbageCollected ? (
                      <LinearGradient colors={['#10B981','#059669']} style={styles.toggleActive}>
                        <Feather name="check" size={15} color="#fff" />
                        <Text style={styles.toggleActiveTxt}>Yes, Collected</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.toggleInactive}>
                        <Feather name="check" size={15} color="#6B7280" />
                        <Text style={styles.toggleInactiveTxt}>Yes, Collected</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setGarbageCollected(false)} style={{ flex: 1 }} activeOpacity={0.85}>
                    {!garbageCollected ? (
                      <LinearGradient colors={['#EF4444','#DC2626']} style={styles.toggleActive}>
                        <Feather name="x" size={15} color="#fff" />
                        <Text style={styles.toggleActiveTxt}>Not Collected</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.toggleInactive}>
                        <Feather name="x" size={15} color="#6B7280" />
                        <Text style={styles.toggleInactiveTxt}>Not Collected</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Actions */}
                <TouchableOpacity onPress={confirmVisit} disabled={confirming}
                  activeOpacity={0.87} style={confirming ? { opacity: 0.65 } : {}}>
                  <LinearGradient colors={['#10B981','#059669']} style={styles.confirmBtn}>
                    <Feather name="check-circle" size={17} color="#fff" />
                    <Text style={styles.confirmBtnTxt}>{confirming ? 'Saving…' : 'Confirm Visit'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setPendingHouse(null)} style={styles.cancelBtn} activeOpacity={0.85}>
                  <Text style={styles.cancelTxt}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* Hero */
  hero: { padding: 20, paddingBottom: 18, gap: 14 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTitle: { color: '#fff', fontSize: 26, fontFamily: 'Inter_700Bold' },
  heroSub: { color: 'rgba(110,231,183,0.6)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  heroIconWrap: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: { flex: 1, borderRadius: 13, paddingVertical: 12, alignItems: 'center', gap: 2 },
  statVal: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLbl: { color: 'rgba(255,255,255,0.65)', fontSize: 9, fontFamily: 'Inter_600SemiBold' },

  /* Scan card */
  scanCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#064E3B' },
  cameraArea: { height: 240, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#34D399' },
  scanLine: { position: 'absolute', left: 28, right: 28, height: 2, top: '50%' },
  cameraCenter: { alignItems: 'center', gap: 10 },
  cameraIconRing: {
    width: 70, height: 70, borderRadius: 35,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#34D399',
  },
  cameraLabel: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  cameraSub: { color: '#6EE7B7', fontSize: 11, fontFamily: 'Inter_400Regular' },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, padding: 16,
  },
  scanBtnTxt: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },

  /* Recent visits */
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', flex: 1 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  countTxt: { fontSize: 12, fontFamily: 'Inter_700Bold' },

  visitCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  visitAccent: { height: 3 },
  visitInner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  visitAvatar: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  visitReg: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  visitMeta: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
  garbagePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
  },
  garbageTxt: { fontSize: 10, fontFamily: 'Inter_700Bold' },

  empty: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  emptyTxt: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  /* Modal */
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: '#081C0E',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, gap: 16,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)',
  },
  modalHandle: {
    alignSelf: 'center', width: 40, height: 4,
    borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 4,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },

  houseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)',
  },
  houseAvatar: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  houseReg: { color: '#34D399', fontSize: 14, fontFamily: 'Inter_700Bold' },
  houseOwner: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  houseAddr: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },

  toggleLabel: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleActive: {
    borderRadius: 13, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
  toggleActiveTxt: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  toggleInactive: {
    borderRadius: 13, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleInactiveTxt: { color: '#6B7280', fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 15,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 7,
  },
  confirmBtnTxt: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelTxt: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'Inter_500Medium' },
});
