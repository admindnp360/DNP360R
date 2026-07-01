import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

const TAB_USERS   = '/(tabs)/action';
const TAB_HOUSEDB = '/(tabs)/secondary';
const TAB_MANAGE  = '/(tabs)/tertiary';

/* ── Section header with gradient badge ── */
function SectionTitle({ icon, label, color, colors }: { icon: any; label: string; color: string; colors: readonly string[] }) {
  return (
    <View style={th.row}>
      <LinearGradient colors={[...colors] as any} style={th.badge}>
        <Feather name={icon} size={11} color="#fff" />
      </LinearGradient>
      <Text style={th.label}>{label}</Text>
    </View>
  );
}

const th = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  label: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1, textTransform: 'uppercase' },
});

export default function AdminHome() {
  const { user } = useAuth();
  const { complaints, houses, wards, users, notices, secretKeys, passwordResetRequests, attendance } = useAppData();
  const [search, setSearch] = useState('');

  const citizens   = users.filter(u => u.role === 'citizen');
  const workers    = users.filter(u => u.role === 'safaikarmi');
  const officials  = users.filter(u => u.role === 'official');
  const pending    = complaints.filter(c => c.status === 'submitted' || c.status === 'assigned').length;
  const inProgress = complaints.filter(c => c.status === 'in_progress').length;
  const resolved   = complaints.filter(c => c.status === 'resolved').length;
  const rate       = complaints.length > 0 ? Math.round((resolved / complaints.length) * 100) : 0;
  const pendingResets = passwordResetRequests.filter(r => r.status === 'pending').length;
  const activeHouses  = houses.filter(h => h.isActive).length;
  const activeNotices = notices.filter(n => n.isActive).length;
  const activeKeys    = secretKeys.filter(k => k.isActive).length;

  const q = search.trim().toLowerCase();
  const houseResults = q.length >= 2 ? houses.filter(h =>
    h.registrationNumber?.toLowerCase().includes(q) || h.ownerName?.toLowerCase().includes(q) ||
    h.mobile?.toLowerCase().includes(q) || h.address?.toLowerCase().includes(q)) : [];
  const userResults = q.length >= 2 ? users.filter(u =>
    u.name?.toLowerCase().includes(q) || u.id?.toLowerCase().includes(q) ||
    u.mobile?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) : [];
  const wardResults = q.length >= 2 ? wards.filter(w =>
    w.name?.toLowerCase().includes(q) || String(w.wardNumber).includes(q) || w.area?.toLowerCase().includes(q)) : [];
  const totalResults = houseResults.length + userResults.length + wardResults.length;
  const clearSearch = useCallback(() => setSearch(''), []);

  // ── Today's attendance ────────────────────────────────────────────
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAtt = attendance.filter(a => a.date === todayStr);
  const allWorkerIds = workers.map(w => w.id);
  const presentToday = todayAtt.filter(a => allWorkerIds.includes(a.workerId) && (a.status === 'present' || a.status === 'half_day')).length;
  const trackedToday = todayAtt.filter(a => allWorkerIds.includes(a.workerId)).length;
  const attRateToday = trackedToday > 0 ? Math.round((presentToday / trackedToday) * 100) : null;
  const attColor = attRateToday == null ? '#94A3B8' : attRateToday >= 80 ? '#34D399' : attRateToday >= 50 ? '#FCD34D' : '#FB7185';

  const wardAttToday = wards
    .filter(w => (w.assignedWorkers ?? []).length > 0)
    .map(w => {
      const wIds = w.assignedWorkers ?? [];
      const wAtt = todayAtt.filter(a => wIds.includes(a.workerId));
      const wPres = wAtt.filter(a => a.status === 'present' || a.status === 'half_day').length;
      const pct = wAtt.length > 0 ? Math.round((wPres / wAtt.length) * 100) : null;
      return { wn: w.wardNumber, name: w.name, pct, total: wIds.length };
    });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const rateColor = rate >= 60 ? '#34D399' : rate >= 30 ? '#FCD34D' : '#F87171';

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <LinearGradient colors={['#04081A', '#080F28', '#0C1538']} style={StyleSheet.absoluteFill} />

      {/* Ambient orbs */}
      <View style={[s.orb, { backgroundColor: '#6366F122', top: -70, right: -60, width: 280, height: 280 }]} />
      <View style={[s.orb, { backgroundColor: '#2563EB18', bottom: 80, left: -70, width: 240, height: 240 }]} />
      <View style={[s.orb, { backgroundColor: '#8B5CF615', top: '35%', right: -50, width: 180, height: 180 }]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── TOP BAR ── */}
        <View style={s.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{greeting},</Text>
            <Text style={s.name} numberOfLines={1}>{user?.name ?? 'Admin'}</Text>
          </View>
          <View style={s.headerRight}>
            {pendingResets > 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(TAB_MANAGE)}
                style={s.alertPill}
              >
                <View style={s.alertPillDot} />
                <Text style={s.alertPillTxt}>{pendingResets} reset{pendingResets > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
              <LinearGradient colors={['#6366F1', '#8B5CF6', '#EC4899']} style={s.avatar}>
                <View style={s.avatarBevelTop} />
                <Text style={s.avatarLetter}>{(user?.name ?? 'A')[0].toUpperCase()}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SEARCH ── */}
        <View style={s.searchCard}>
          <View style={s.searchCardBevel} />
          <View style={s.searchRow}>
            <Feather name="search" size={14} color="#818CF8" />
            <TextInput
              style={s.searchInput}
              placeholder="Search houses, users, wards…"
              placeholderTextColor="#64748B"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x-circle" size={14} color="#475569" />
              </TouchableOpacity>
            )}
          </View>

          {q.length >= 2 && totalResults > 0 && (
            <View style={s.searchDrop}>
              <View style={s.searchDropDivider} />
              <Text style={s.searchDropCount}>{totalResults} result{totalResults !== 1 ? 's' : ''}</Text>

              {[
                { items: houseResults, icon: 'home',    color: '#818CF8', label: 'Houses',   route: TAB_HOUSEDB, getName: (h: any) => h.registrationNumber, getSub: (h: any) => `${h.ownerName} · W${h.wardNumber}` },
                { items: userResults,  icon: 'users',   color: '#34D399', label: 'Users',    route: TAB_USERS,   getName: (u: any) => u.name,               getSub: (u: any) => `${u.role} · ${u.id}` },
                { items: wardResults,  icon: 'map-pin', color: '#22D3EE', label: 'Wards',    route: TAB_HOUSEDB, getName: (w: any) => `Ward ${w.wardNumber} — ${w.name}`, getSub: (w: any) => w.area },
              ].map(section => section.items.length > 0 && (
                <View key={section.label}>
                  <View style={s.searchSecHdr}>
                    <LinearGradient colors={[section.color + '30', section.color + '10']} style={s.searchSecBadge}>
                      <Feather name={section.icon as any} size={9} color={section.color} />
                    </LinearGradient>
                    <Text style={[s.searchSecTxt, { color: section.color }]}>{section.label} ({section.items.length})</Text>
                  </View>
                  {section.items.slice(0, 4).map((item: any) => (
                    <TouchableOpacity key={item.id} style={s.searchItem} onPress={() => router.push(section.route as any)} activeOpacity={0.75}>
                      <View style={[s.searchItemAvatar, { backgroundColor: section.color + '18' }]}>
                        <Feather name={section.icon as any} size={11} color={section.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.searchItemName} numberOfLines={1}>{section.getName(item)}</Text>
                        <Text style={s.searchItemSub} numberOfLines={1}>{section.getSub(item)}</Text>
                      </View>
                      <Feather name="chevron-right" size={11} color="#64748B" />
                    </TouchableOpacity>
                  ))}
                  {section.items.length > 4 && <Text style={s.searchMore}>+{section.items.length - 4} more</Text>}
                </View>
              ))}
            </View>
          )}
          {q.length >= 2 && totalResults === 0 && (
            <View style={s.searchEmpty}>
              <Feather name="inbox" size={16} color="#94A3B8" />
              <Text style={s.searchEmptyTxt}>Nothing found</Text>
            </View>
          )}
        </View>

        {/* ── ALERT BANNER ── */}
        {pendingResets > 0 && (
          <TouchableOpacity activeOpacity={0.82} onPress={() => router.push(TAB_MANAGE)}>
            <LinearGradient colors={['rgba(251,113,133,0.18)', 'rgba(251,113,133,0.06)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.alertBanner}>
              <View style={s.alertBannerBevel} />
              <View style={s.alertDot} />
              <Text style={s.alertBannerTxt}>{pendingResets} password reset{pendingResets > 1 ? 's' : ''} pending review</Text>
              <Feather name="arrow-right" size={13} color="#FB7185" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── COMPLAINT CARD ── */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(TAB_MANAGE)}>
          <View style={s.glassCard}>
            <View style={s.glassCardBevelTop} />
            {/* Header */}
            <View style={s.complaintHdr}>
              <LinearGradient colors={['#FB7185', '#F43F5E']} style={s.complaintIconBox}>
                <Feather name="alert-circle" size={13} color="#fff" />
              </LinearGradient>
              <Text style={s.complaintTitle}>Complaint Overview</Text>
              <View style={[s.ratePill, { borderColor: rateColor + '40', backgroundColor: rateColor + '15' }]}>
                <View style={[s.rateDot, { backgroundColor: rateColor }]} />
                <Text style={[s.ratePillTxt, { color: rateColor }]}>{rate}%</Text>
              </View>
            </View>

            {/* Metrics row */}
            <View style={s.metricsRow}>
              {[
                { label: 'Total',    value: complaints.length, color: '#818CF8', colors: ['#818CF8','#6366F1'] as const },
                { label: 'Pending',  value: pending,           color: '#FB7185', colors: ['#FB7185','#F43F5E'] as const },
                { label: 'Progress', value: inProgress,        color: '#FCD34D', colors: ['#FCD34D','#F59E0B'] as const },
                { label: 'Resolved', value: resolved,          color: '#34D399', colors: ['#34D399','#10B981'] as const },
              ].map((m, i) => (
                <View key={m.label} style={[s.metricCell, i < 3 && s.metricDiv]}>
                  <LinearGradient colors={m.colors} style={s.metricDot} />
                  <Text style={[s.metricVal, { color: m.color }]}>{m.value}</Text>
                  <Text style={s.metricLbl}>{m.label}</Text>
                </View>
              ))}
            </View>

            {/* Progress bar */}
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${rate}%` as any, backgroundColor: rateColor }]} />
              <View style={[s.barGlow, { width: `${rate}%` as any, backgroundColor: rateColor }]} />
            </View>

            <View style={s.glassCardBevelBot} />
          </View>
        </TouchableOpacity>

        {/* ── TODAY'S ATTENDANCE CARD ── */}
        <SectionTitle icon="user-check" label="Today's Attendance" color="#34D399" colors={['#10B981','#059669']} />
        <View style={s.glassCard}>
          <View style={s.glassCardBevelTop} />

          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <LinearGradient colors={['#10B981', '#059669']} style={[s.complaintIconBox, { marginRight: 10 }]}>
              <Feather name="user-check" size={13} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F0F4FF', fontSize: 13, fontFamily: 'Inter_700Bold' }}>
                Safai Karmi Attendance
              </Text>
              <Text style={{ color: '#64748B', fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={[s.ratePill, { borderColor: attColor + '40', backgroundColor: attColor + '18' }]}>
              <View style={[s.rateDot, { backgroundColor: attColor }]} />
              <Text style={[s.ratePillTxt, { color: attColor }]}>
                {attRateToday != null ? `${attRateToday}%` : 'No data'}
              </Text>
            </View>
          </View>

          {/* Summary row */}
          <View style={s.metricsRow}>
            {[
              { label: 'Workers',  value: workers.length,  color: '#818CF8', colors: ['#818CF8','#6366F1'] as const },
              { label: 'Present',  value: trackedToday > 0 ? presentToday : '—',  color: '#34D399', colors: ['#34D399','#10B981'] as const },
              { label: 'Absent',   value: trackedToday > 0 ? trackedToday - presentToday : '—',   color: '#FB7185', colors: ['#FB7185','#F43F5E'] as const },
              { label: 'Tracked',  value: trackedToday,   color: '#FCD34D', colors: ['#FCD34D','#F59E0B'] as const },
            ].map((m, i) => (
              <View key={m.label} style={[s.metricCell, i < 3 && s.metricDiv]}>
                <LinearGradient colors={m.colors} style={s.metricDot} />
                <Text style={[s.metricVal, { color: m.color }]}>{m.value}</Text>
                <Text style={s.metricLbl}>{m.label}</Text>
              </View>
            ))}
          </View>

          {/* Overall progress bar */}
          <View style={[s.barTrack, { marginBottom: wardAttToday.length > 0 ? 12 : 0 }]}>
            <View style={[s.barFill, { width: `${attRateToday ?? 0}%` as any, backgroundColor: attColor }]} />
            <View style={[s.barGlow, { width: `${attRateToday ?? 0}%` as any, backgroundColor: attColor }]} />
          </View>

          {/* Per-ward breakdown */}
          {wardAttToday.length > 0 && (
            <View style={{ gap: 7 }}>
              <Text style={{ color: '#475569', fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>
                Ward Breakdown
              </Text>
              <ScrollView
                style={{ maxHeight: 130 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                <View style={{ gap: 7 }}>
                  {wardAttToday.map(w => {
                    const clr = w.pct == null ? '#475569' : w.pct >= 80 ? '#34D399' : w.pct >= 50 ? '#FCD34D' : '#FB7185';
                    return (
                      <View key={w.wn} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: '#64748B', fontSize: 9, fontFamily: 'Inter_600SemiBold', width: 32 }}>W{w.wn}</Text>
                        <View style={{ flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                          <View style={{ width: `${w.pct ?? 0}%`, height: 8, backgroundColor: clr, borderRadius: 4 }} />
                        </View>
                        <Text style={{ color: clr, fontSize: 9, fontFamily: 'Inter_700Bold', width: 30, textAlign: 'right' }}>
                          {w.pct != null ? `${w.pct}%` : '—'}
                        </Text>
                        <Text style={{ color: '#475569', fontSize: 9, width: 22 }}>({w.total})</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* No data state */}
          {trackedToday === 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Feather name="info" size={12} color="#475569" />
              <Text style={{ color: '#475569', fontSize: 10, fontFamily: 'Inter_400Regular' }}>
                No attendance records marked yet for today
              </Text>
            </View>
          )}

          <View style={s.glassCardBevelBot} />
        </View>

        {/* ── STATS GRID ── */}
        <SectionTitle icon="grid" label="System Overview" color="#818CF8" colors={['#6366F1','#4F46E5']} />
        <View style={s.grid}>
          {[
            { label: 'Citizens',  value: citizens.length,  icon: 'users',      colors: ['#6366F1','#4F46E5'] as const, glow: '#6366F1', route: `${TAB_USERS}?tab=citizen`    },
            { label: 'Workers',   value: workers.length,   icon: 'user-check', colors: ['#10B981','#059669'] as const, glow: '#10B981', route: `${TAB_USERS}?tab=safaikarmi` },
            { label: 'Officials', value: officials.length, icon: 'briefcase',  colors: ['#F59E0B','#D97706'] as const, glow: '#F59E0B', route: `${TAB_USERS}?tab=official`   },
            { label: 'Houses',    value: activeHouses,     icon: 'home',       colors: ['#06B6D4','#0891B2'] as const, glow: '#06B6D4', route: `${TAB_HOUSEDB}?view=houses`  },
            { label: 'Wards',     value: wards.length,     icon: 'map',        colors: ['#A855F7','#7C3AED'] as const, glow: '#A855F7', route: `${TAB_HOUSEDB}?view=wards`   },
            { label: 'Keys',      value: secretKeys.length,icon: 'key',        colors: ['#F472B6','#EC4899'] as const, glow: '#F472B6', route: `${TAB_MANAGE}?tab=genkey`    },
          ].map(stat => (
            <TouchableOpacity key={stat.label} style={s.statCard} onPress={() => router.push(stat.route as any)} activeOpacity={0.78}>
              <LinearGradient colors={[stat.glow + '1A', stat.glow + '06']} style={StyleSheet.absoluteFill} />
              <View style={[s.statCardBevel, { borderTopColor: stat.glow + '30' }]} />
              <LinearGradient colors={stat.colors} style={s.statIconBox}>
                <Feather name={stat.icon as any} size={16} color="#fff" />
              </LinearGradient>
              <Text style={[s.statVal, { color: stat.glow === '#F59E0B' ? '#FCD34D' : stat.glow }]}>{stat.value}</Text>
              <Text style={s.statLbl}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── QUICK ACCESS ── */}
        <SectionTitle icon="zap" label="Quick Access" color="#FCD34D" colors={['#F59E0B','#D97706']} />
        <View style={s.glassCard}>
          <View style={s.glassCardBevelTop} />
          {[
            {
              icon: 'users',    label: 'Manage Users',    sub: `${users.length} total accounts`,
              colors: ['#6366F1','#4F46E5'] as const, route: TAB_USERS,
            },
            {
              icon: 'database', label: 'House Database',  sub: `${activeHouses} active · ${wards.length} wards`,
              colors: ['#06B6D4','#0891B2'] as const, route: `${TAB_HOUSEDB}?view=houses`,
            },
            {
              icon: 'settings', label: 'Admin Manage',    sub: `${activeNotices} notices · ${activeKeys} keys`,
              colors: ['#A855F7','#7C3AED'] as const, route: TAB_MANAGE,
            },
            {
              icon: 'lock',     label: 'Password Resets', sub: pendingResets > 0 ? `${pendingResets} pending review` : 'No pending requests',
              colors: pendingResets > 0 ? ['#FB7185','#F43F5E'] as const : ['#10B981','#059669'] as const, route: `${TAB_MANAGE}?tab=resets`,
            },
          ].map((item, i, arr) => (
            <TouchableOpacity key={item.label} style={[s.qaRow, i < arr.length - 1 && s.qaDiv]} onPress={() => router.push(item.route as any)} activeOpacity={0.76}>
              <LinearGradient colors={item.colors} style={s.qaIconBox}>
                <Feather name={item.icon as any} size={14} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.qaLabel}>{item.label}</Text>
                <Text style={s.qaSub} numberOfLines={1}>{item.sub}</Text>
              </View>
              <View style={s.qaArrow}>
                <Feather name="chevron-right" size={13} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          ))}
          <View style={s.glassCardBevelBot} />
        </View>

        {/* ── ACTIVE NOTICES ── */}
        {activeNotices > 0 && (
          <TouchableOpacity activeOpacity={0.82} onPress={() => router.push(`${TAB_MANAGE}?tab=notices` as any)}>
            <LinearGradient colors={['rgba(34,211,238,0.13)', 'rgba(34,211,238,0.04)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.noticeBanner}>
              <View style={s.noticeBannerBevel} />
              <LinearGradient colors={['#22D3EE', '#06B6D4']} style={s.noticeBannerIcon}>
                <Feather name="volume-2" size={13} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.noticeBannerTitle}>Active Notices</Text>
                <Text style={s.noticeBannerSub}>{activeNotices} notice{activeNotices !== 1 ? 's' : ''} published</Text>
              </View>
              <Feather name="arrow-right" size={13} color="#22D3EE" />
            </LinearGradient>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.7 },
  scroll: { paddingBottom: 120, gap: 16, paddingHorizontal: 16, paddingTop: 6 },

  /* Top bar */
  topBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  greeting: { color: '#94A3B8', fontSize: 12, fontFamily: 'Inter_500Medium' },
  name: { color: '#F1F5F9', fontSize: 21, fontFamily: 'Inter_700Bold', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(251,113,133,0.14)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.28)' },
  alertPillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FB7185' },
  alertPillTxt: { color: '#FB7185', fontSize: 11, fontFamily: 'Inter_700Bold' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarBevelTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 22 },
  avatarLetter: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },

  /* Search */
  searchCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  searchCardBevel: { position: 'absolute', top: 0, left: 16, right: 16, height: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  searchIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  searchInput: { flex: 1, color: '#CBD5E1', fontSize: 13, fontFamily: 'Inter_400Regular' },
  searchDrop: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingBottom: 10 },
  searchDropDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 6 },
  searchDropCount: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.6, paddingVertical: 4 },
  searchSecHdr: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 4 },
  searchSecBadge: { width: 18, height: 18, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  searchSecTxt: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.4 },
  searchItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  searchItemAvatar: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  searchItemName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#CBD5E1' },
  searchItemSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#94A3B8' },
  searchMore: { color: '#94A3B8', fontSize: 10, fontFamily: 'Inter_500Medium', paddingTop: 4 },
  searchEmpty: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, justifyContent: 'center' },
  searchEmptyTxt: { color: '#94A3B8', fontSize: 13, fontFamily: 'Inter_400Regular' },

  /* Alert banner */
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(251,113,133,0.25)', borderTopColor: 'rgba(251,113,133,0.4)',
    overflow: 'hidden',
  },
  alertBannerBevel: { position: 'absolute', top: 0, left: 14, right: 14, height: 1, backgroundColor: 'rgba(251,113,133,0.3)', borderRadius: 16 },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FB7185' },
  alertBannerTxt: { flex: 1, color: '#FB7185', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  /* Glass card (reusable) */
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 22, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
  },
  glassCardBevelTop: { position: 'absolute', top: 0, left: 18, right: 18, height: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22 },
  glassCardBevelBot: { position: 'absolute', bottom: 0, left: 18, right: 18, height: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 22 },

  /* Complaint card */
  complaintHdr: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 12 },
  complaintIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  complaintTitle: { flex: 1, color: '#F1F5F9', fontSize: 14, fontFamily: 'Inter_700Bold' },
  ratePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, borderWidth: 1 },
  rateDot: { width: 5, height: 5, borderRadius: 3 },
  ratePillTxt: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  metricsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  metricCell: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  metricDiv: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' },
  metricDot: { width: 18, height: 3, borderRadius: 3 },
  metricVal: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  metricLbl: { color: '#94A3B8', fontSize: 9, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.6 },
  barTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16, marginBottom: 16, borderRadius: 99, overflow: 'hidden', marginTop: 4 },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99, opacity: 0.9 },
  barGlow: { position: 'absolute', left: 0, top: 1, height: 2, borderRadius: 99, opacity: 0.4 },

  /* Stats grid */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '30%', flexGrow: 1,
    borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14, gap: 6, alignItems: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  statCardBevel: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', borderRadius: 18 },
  statIconBox: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  statVal: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  statLbl: { color: '#CBD5E1', fontSize: 10, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },

  /* Quick access */
  qaRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 14 },
  qaDiv: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  qaIconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  qaLabel: { color: '#E2E8F0', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  qaSub: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  qaArrow: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center' },

  /* Notice banner */
  noticeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    padding: 15, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(34,211,238,0.2)', borderTopColor: 'rgba(34,211,238,0.35)',
    overflow: 'hidden',
  },
  noticeBannerBevel: { position: 'absolute', top: 0, left: 14, right: 14, height: 1, backgroundColor: 'rgba(34,211,238,0.25)', borderRadius: 18 },
  noticeBannerIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  noticeBannerTitle: { color: '#22D3EE', fontSize: 13, fontFamily: 'Inter_700Bold' },
  noticeBannerSub: { color: '#0E7490', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
});
