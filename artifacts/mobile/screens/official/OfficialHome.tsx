import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComplaintCard } from '@/components/ComplaintCard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColors } from '@/hooks/useColors';

export default function OfficialHome() {
  const { user } = useAuth();
  const { complaints, wards, users } = useAppData();
  const colors = useColors();
  const { t } = useLanguage();

  const myWard = wards.find(w => w.officialId === user?.id);
  const workers = users.filter(u => u.role === 'safaikarmi');
  const pending = complaints.filter(c => c.status === 'submitted');
  const inProgress = complaints.filter(c => c.status === 'in_progress');
  const resolved = complaints.filter(c => c.status === 'resolved');
  const critical = complaints.filter(c => c.status === 'submitted').slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={['#78350F', '#92400E', '#B45309']} style={styles.header}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{t('official')} · {t('nagar')}</Text>
              <Text style={styles.name}>{user?.name ?? 'Official'}</Text>
              <Text style={styles.emp}>ID: {user?.id ?? 'N/A'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{(user?.name ?? 'O')[0]}</Text>
              </View>
              <LanguageSwitcher />
            </View>
          </View>
          {myWard && (
            <LinearGradient colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']} style={styles.wardBadge}>
              <Feather name="map-pin" size={11} color="#FDE68A" />
              <Text style={styles.wardText}>{myWard.name}</Text>
            </LinearGradient>
          )}

          <View style={styles.heroStats}>
            {[
              { label: t('total'), value: complaints.length, grad: ['#D97706','#F59E0B'] as const },
              { label: t('pending'), value: pending.length, grad: ['#DC2626','#EF4444'] as const },
              { label: t('inProgress'), value: inProgress.length, grad: ['#7C3AED','#8B5CF6'] as const },
              { label: t('resolved'), value: resolved.length, grad: ['#059669','#10B981'] as const },
            ].map(s => (
              <LinearGradient key={s.label} colors={s.grad} style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{s.value}</Text>
                <Text style={styles.heroStatLbl}>{s.label}</Text>
              </LinearGradient>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.grid}>
            <StatCard label={t('total') + ' ' + t('complaints')} value={complaints.length} icon="clipboard" iconColor="#B45309" iconBg="#FEF3C7" accentLeft="#B45309" />
            <StatCard label={t('pending')} value={pending.length} icon="clock" iconColor={colors.submitted} iconBg={colors.submittedBg} accentLeft={colors.submitted} />
          </View>
          <View style={styles.grid}>
            <StatCard label={t('inProgress')} value={inProgress.length} icon="loader" iconColor={colors.inProgress} iconBg={colors.inProgressBg} accentLeft={colors.inProgress} />
            <StatCard label={t('resolved')} value={resolved.length} icon="check-circle" iconColor={colors.resolved} iconBg={colors.resolvedBg} accentLeft={colors.resolved} />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: '#D9770640' }]}>
            <SectionHeader title={t('workers') + ' Overview'} />
            <View style={styles.workersRow}>
              <View style={styles.workerStat}>
                <Text style={[styles.workerNum, { color: '#B45309' }]}>{workers.length}</Text>
                <Text style={[styles.workerLabel, { color: colors.mutedForeground }]}>{t('total')}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.workerStat}>
                <Text style={[styles.workerNum, { color: colors.resolved }]}>{workers.filter(w => w.isActive).length}</Text>
                <Text style={[styles.workerLabel, { color: colors.mutedForeground }]}>{t('active')}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.workerStat}>
                <Text style={[styles.workerNum, { color: colors.citizen }]}>{wards.length}</Text>
                <Text style={[styles.workerLabel, { color: colors.mutedForeground }]}>{t('ward')}s</Text>
              </View>
            </View>
          </View>

          <View>
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>Ward Health Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
              {wards.map(ward => {
                const wardPending = complaints.filter(c => c.wardId === ward.id && c.status !== 'resolved').length;
                const wardWorkers = users.filter(u => u.role === 'safaikarmi' && ward.assignedWorkers.includes(u.id));
                const health = wardPending === 0 ? 'good' : wardPending <= 2 ? 'warn' : 'critical';
                const healthColor = health === 'good' ? '#16A34A' : health === 'warn' ? '#D97706' : '#DC2626';
                const healthBg    = health === 'good' ? '#DCFCE7' : health === 'warn' ? '#FEF3C7' : '#FEE2E2';
                const healthLabel = health === 'good' ? 'Healthy' : health === 'warn' ? 'Warning' : 'Critical';
                return (
                  <View key={ward.id} style={[styles.wardCard, { backgroundColor: colors.card, borderColor: '#D9770630' }]}>
                    <View style={styles.wardCardTop}>
                      <Text style={[styles.wardNum, { color: '#B45309' }]}>W{ward.wardNumber}</Text>
                      <View style={[styles.healthPill, { backgroundColor: healthBg }]}>
                        <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
                        <Text style={[styles.healthLabel, { color: healthColor }]}>{healthLabel}</Text>
                      </View>
                    </View>
                    <Text style={[styles.wardName, { color: colors.text }]} numberOfLines={1}>{ward.name}</Text>
                    <Text style={[styles.wardArea, { color: colors.mutedForeground }]} numberOfLines={1}>{ward.area}</Text>
                    <View style={styles.wardStats}>
                      <View style={styles.wardStat}>
                        <Feather name="alert-circle" size={12} color={wardPending > 0 ? '#DC2626' : colors.mutedForeground} />
                        <Text style={[styles.wardStatText, { color: wardPending > 0 ? '#DC2626' : colors.mutedForeground }]}>{wardPending} {t('pending')}</Text>
                      </View>
                      <View style={styles.wardStat}>
                        <Feather name="user" size={12} color={wardWorkers.length > 0 ? '#16A34A' : colors.mutedForeground} />
                        <Text style={[styles.wardStatText, { color: wardWorkers.length > 0 ? '#16A34A' : colors.mutedForeground }]}>{wardWorkers.length} SK</Text>
                      </View>
                    </View>
                    <View style={styles.wardHouses}>
                      <Feather name="home" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.wardStatText, { color: colors.mutedForeground }]}>{ward.totalHouses} {t('houses')}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {critical.length > 0 && (
            <>
              <SectionHeader title={t('pending') + ' ' + t('complaints')} actionLabel="View All" />
              <View style={{ gap: 10 }}>
                {critical.map(c => <ComplaintCard key={c.id} complaint={c} />)}
              </View>
            </>
          )}

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: '#D9770640' }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Stats</Text>
            {[
              { label: 'Resolution Rate', value: complaints.length > 0 ? `${Math.round((resolved.length / complaints.length) * 100)}%` : '0%', color: colors.resolved },
              { label: 'Total Houses', value: wards.reduce((s, w) => s + w.totalHouses, 0), color: '#B45309' },
              { label: 'Active Workers', value: workers.filter(w => w.isActive).length, color: colors.safaikarmi },
            ].map((stat, i, arr) => (
              <View key={stat.label} style={[styles.quickRow, { borderBottomColor: colors.border, borderBottomWidth: i < arr.length - 1 ? 1 : 0 }]}>
                <Text style={[styles.quickLabel, { color: colors.text }]}>{stat.label}</Text>
                <Text style={[styles.quickValue, { color: stat.color }]}>{stat.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.announceBannerWrap} activeOpacity={0.85} onPress={() => Linking.openURL('tel:0618400000')}>
            <LinearGradient colors={['#78350F', '#B45309']} style={styles.announceBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.bannerIconWrap}>
                <Feather name="phone" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>{t('nagar')}</Text>
                <Text style={styles.bannerSub}>Municipal Office: 06184-XXXXXX</Text>
              </View>
              <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 14, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, gap: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: '#FDE68A', fontSize: 11, fontFamily: 'Inter_400Regular' },
  name: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Inter_700Bold' },
  emp: { color: '#FCD34D', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Inter_700Bold' },
  wardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, alignSelf: 'flex-start' },
  wardText: { color: '#FDE68A', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  heroStats: { flexDirection: 'row', gap: 8 },
  heroStat: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 2 },
  heroStatVal: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  heroStatLbl: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  body: { padding: 16, gap: 14 },
  grid: { flexDirection: 'row', gap: 10 },
  card: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 14 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  workersRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  workerStat: { alignItems: 'center', gap: 4 },
  workerNum: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  workerLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  divider: { width: 1, height: 40 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  quickLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  quickValue: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  sectionTitleText: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  wardCard: { width: 148, borderRadius: 14, padding: 12, borderWidth: 1, gap: 4 },
  wardCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  wardNum: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  healthPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  healthLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  wardName: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  wardArea: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 6 },
  wardStats: { flexDirection: 'row', gap: 10 },
  wardStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  wardStatText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  wardHouses: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  announceBannerWrap: { borderRadius: 16, overflow: 'hidden' },
  announceBanner: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 16, padding: 16 },
  bannerIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  bannerTitle: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_700Bold' },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
