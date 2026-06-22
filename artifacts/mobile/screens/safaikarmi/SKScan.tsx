import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraScanner } from '@/components/CameraScanner';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function SKScan() {
  const { user } = useAuth();
  const { houses, getVisitsByWorker } = useAppData();
  const colors = useColors();
  const [cameraOpen, setCameraOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const allVisits = getVisitsByWorker(user?.id ?? '');
  const todayCount = allVisits.filter(v => v.visitDate === todayStr).length;
  const recentVisits = allVisits.slice(0, 6);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#010D06' }} edges={['top']}>

      {/* ── Hero ── */}
      <LinearGradient colors={['#010D06', '#042A16', '#084D28']} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>QR Scanner</Text>
            <Text style={styles.heroSub}>Tap below to scan house QR</Text>
          </View>
          <LinearGradient colors={['rgba(52,211,153,0.22)', 'rgba(16,185,129,0.1)']} style={styles.heroIcon}>
            <Feather name="camera" size={22} color="#34D399" />
          </LinearGradient>
        </View>

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
        {/* ── Big scan button ── */}
        <TouchableOpacity onPress={() => setCameraOpen(true)} activeOpacity={0.88}>
          <LinearGradient
            colors={['#010D06','#031A0F','#063018']}
            style={styles.scanArea}
          >
            {/* Corner brackets */}
            {[['tl',true,false],['tr',true,true],['bl',false,false],['br',false,true]].map(([pos,top,right]) => (
              <View key={String(pos)} style={[
                styles.corner,
                top ? { top: 22 } : { bottom: 22 },
                right ? { right: 22 } : { left: 22 },
                !top && !right  && { borderBottomWidth: 3, borderLeftWidth: 3 },
                !top && !!right && { borderBottomWidth: 3, borderRightWidth: 3 },
                !!top && !right  && { borderTopWidth: 3, borderLeftWidth: 3 },
                !!top && !!right && { borderTopWidth: 3, borderRightWidth: 3 },
              ]} />
            ))}

            <View style={styles.scanCenter}>
              <LinearGradient
                colors={['rgba(52,211,153,0.2)','rgba(16,185,129,0.06)']}
                style={styles.scanIconRing}
              >
                <Feather name="camera" size={36} color="#34D399" />
              </LinearGradient>
              <Text style={styles.scanLabel}>Tap to Open Camera</Text>
              <Text style={styles.scanSub}>Point at house QR code to scan</Text>
            </View>

            <LinearGradient colors={['#10B981','#059669']} style={styles.scanBtnInner}>
              <Feather name="camera" size={16} color="#fff" />
              <Text style={styles.scanBtnTxt}>Open QR Scanner</Text>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>

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

      <CameraScanner visible={cameraOpen} onClose={() => setCameraOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, paddingBottom: 18, gap: 14 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTitle: { color: '#fff', fontSize: 26, fontFamily: 'Inter_700Bold' },
  heroSub: { color: 'rgba(110,231,183,0.6)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  heroIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: { flex: 1, borderRadius: 13, paddingVertical: 12, alignItems: 'center', gap: 2 },
  statVal: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLbl: { color: 'rgba(255,255,255,0.65)', fontSize: 9, fontFamily: 'Inter_600SemiBold' },

  scanArea: {
    borderRadius: 20, overflow: 'hidden',
    height: 260, justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#064E3B',
  },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#34D399' },
  scanCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  scanIconRing: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#34D399' },
  scanLabel: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  scanSub: { color: '#6EE7B7', fontSize: 11, fontFamily: 'Inter_400Regular' },
  scanBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15 },
  scanBtnTxt: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },

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
  garbagePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  garbageTxt: { fontSize: 10, fontFamily: 'Inter_700Bold' },

  empty: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  emptyTxt: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
