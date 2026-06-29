import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

const BG      = '#060B18';
const GLASS   = 'rgba(255,255,255,0.06)';
const GLASS2  = 'rgba(255,255,255,0.10)';
const BD      = 'rgba(255,255,255,0.11)';
const TEXT    = '#F0F4FF';
const MUTED   = 'rgba(255,255,255,0.40)';
const MUTED2  = 'rgba(255,255,255,0.18)';

const TAB_USERS   = '/(tabs)/action';
const TAB_HOUSEDB = '/(tabs)/secondary';
const TAB_MANAGE  = '/(tabs)/tertiary';

export default function AdminHome() {
  const { user } = useAuth();
  const { complaints, houses, wards, users, notices, secretKeys, passwordResetRequests } = useAppData();
  const [globalSearch, setGlobalSearch] = useState('');

  const citizens  = users.filter(u => u.role === 'citizen');
  const workers   = users.filter(u => u.role === 'safaikarmi');
  const officials = users.filter(u => u.role === 'official');
  const pending   = complaints.filter(c => c.status === 'submitted' || c.status === 'assigned').length;
  const inProgress = complaints.filter(c => c.status === 'in_progress').length;
  const resolved  = complaints.filter(c => c.status === 'resolved').length;
  const rate      = complaints.length > 0 ? Math.round((resolved / complaints.length) * 100) : 0;
  const pendingResets = passwordResetRequests.filter(r => r.status === 'pending').length;
  const activeHouses  = houses.filter(h => h.isActive).length;

  const trimmed = globalSearch.trim().toLowerCase();
  const houseResults = trimmed.length >= 2 ? houses.filter(h =>
    h.registrationNumber?.toLowerCase().includes(trimmed) ||
    h.ownerName?.toLowerCase().includes(trimmed) ||
    h.mobile?.toLowerCase().includes(trimmed) ||
    h.address?.toLowerCase().includes(trimmed)
  ) : [];
  const userResults = trimmed.length >= 2 ? users.filter(u =>
    u.name?.toLowerCase().includes(trimmed) ||
    u.id?.toLowerCase().includes(trimmed) ||
    u.mobile?.toLowerCase().includes(trimmed) ||
    u.email?.toLowerCase().includes(trimmed)
  ) : [];
  const wardResults = trimmed.length >= 2 ? wards.filter(w =>
    w.name?.toLowerCase().includes(trimmed) ||
    String(w.wardNumber).includes(trimmed) ||
    w.area?.toLowerCase().includes(trimmed)
  ) : [];
  const totalResults = houseResults.length + userResults.length + wardResults.length;

  const clearSearch = useCallback(() => setGlobalSearch(''), []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ── COMPACT HEADER ── */}
        <View style={s.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{greeting}</Text>
            <Text style={s.name} numberOfLines={1}>{user?.name ?? 'Admin'}</Text>
          </View>
          <View style={s.headerRight}>
            {pendingResets > 0 && (
              <TouchableOpacity style={s.alertBadge} onPress={() => router.push(TAB_MANAGE)} activeOpacity={0.8}>
                <View style={s.alertDot} />
                <Text style={s.alertBadgeTxt}>{pendingResets}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
              <LinearGradient colors={['#6366F1', '#8B5CF6', '#EC4899']} style={s.avatar}>
                <Text style={s.avatarLetter}>{(user?.name ?? 'A')[0].toUpperCase()}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.body}>

          {/* ── SEARCH ── */}
          <View style={s.searchWrap}>
            <View style={s.searchBar}>
              <Feather name="search" size={14} color={MUTED} />
              <TextInput
                style={s.searchInput}
                placeholder="Search houses, users, wards…"
                placeholderTextColor={MUTED}
                value={globalSearch}
                onChangeText={setGlobalSearch}
              />
              {globalSearch.length > 0 && (
                <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x-circle" size={14} color={MUTED} />
                </TouchableOpacity>
              )}
            </View>

            {trimmed.length >= 2 && totalResults > 0 && (
              <View style={s.searchDropdown}>
                <Text style={s.searchCount}>{totalResults} result{totalResults !== 1 ? 's' : ''}</Text>

                {houseResults.length > 0 && (
                  <>
                    <View style={s.searchSecHdr}>
                      <Feather name="home" size={10} color="#818CF8" />
                      <Text style={[s.searchSecTxt, { color: '#818CF8' }]}>Houses ({houseResults.length})</Text>
                    </View>
                    {houseResults.slice(0, 4).map(h => (
                      <TouchableOpacity key={h.id} style={s.searchRow} onPress={() => router.push(TAB_HOUSEDB)} activeOpacity={0.75}>
                        <View style={[s.searchAvatar, { backgroundColor: 'rgba(99,102,241,0.18)' }]}>
                          <Feather name="home" size={12} color="#818CF8" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.searchRowName, { color: '#818CF8' }]} numberOfLines={1}>{h.registrationNumber}</Text>
                          <Text style={s.searchRowSub} numberOfLines={1}>{h.ownerName} · W{h.wardNumber}</Text>
                        </View>
                        <Feather name="chevron-right" size={12} color={MUTED2} />
                      </TouchableOpacity>
                    ))}
                    {houseResults.length > 4 && <Text style={s.searchMore}>+{houseResults.length - 4} more</Text>}
                  </>
                )}

                {userResults.length > 0 && (
                  <>
                    <View style={s.searchSecHdr}>
                      <Feather name="users" size={10} color="#34D399" />
                      <Text style={[s.searchSecTxt, { color: '#34D399' }]}>Users ({userResults.length})</Text>
                    </View>
                    {userResults.slice(0, 4).map(u => (
                      <TouchableOpacity key={u.id} style={s.searchRow} onPress={() => router.push(TAB_USERS)} activeOpacity={0.75}>
                        <View style={[s.searchAvatar, { backgroundColor: 'rgba(52,211,153,0.18)' }]}>
                          <Feather name="user" size={12} color="#34D399" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.searchRowName, { color: TEXT }]} numberOfLines={1}>{u.name}</Text>
                          <Text style={s.searchRowSub} numberOfLines={1}>{u.role} · {u.id}</Text>
                        </View>
                        <Feather name="chevron-right" size={12} color={MUTED2} />
                      </TouchableOpacity>
                    ))}
                    {userResults.length > 4 && <Text style={s.searchMore}>+{userResults.length - 4} more</Text>}
                  </>
                )}

                {wardResults.length > 0 && (
                  <>
                    <View style={s.searchSecHdr}>
                      <Feather name="map-pin" size={10} color="#22D3EE" />
                      <Text style={[s.searchSecTxt, { color: '#22D3EE' }]}>Wards ({wardResults.length})</Text>
                    </View>
                    {wardResults.slice(0, 3).map(w => (
                      <TouchableOpacity key={w.id} style={s.searchRow} onPress={() => router.push(TAB_HOUSEDB)} activeOpacity={0.75}>
                        <View style={[s.searchAvatar, { backgroundColor: 'rgba(34,211,238,0.18)' }]}>
                          <Feather name="map" size={12} color="#22D3EE" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.searchRowName, { color: TEXT }]} numberOfLines={1}>Ward {w.wardNumber} — {w.name}</Text>
                          <Text style={s.searchRowSub} numberOfLines={1}>{w.area}</Text>
                        </View>
                        <Feather name="chevron-right" size={12} color={MUTED2} />
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            )}

            {trimmed.length >= 2 && totalResults === 0 && (
              <View style={s.searchEmpty}>
                <Feather name="search" size={16} color={MUTED} />
                <Text style={s.searchEmptyTxt}>Nothing found</Text>
              </View>
            )}
          </View>

          {/* ── PENDING RESETS BANNER ── */}
          {pendingResets > 0 && (
            <TouchableOpacity style={s.alertBanner} activeOpacity={0.82} onPress={() => router.push(TAB_MANAGE)}>
              <LinearGradient colors={['rgba(251,113,133,0.18)', 'rgba(251,113,133,0.07)']} style={s.alertBannerInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={s.alertPulse} />
                <Text style={s.alertBannerTxt}>{pendingResets} password reset{pendingResets > 1 ? 's' : ''} pending review</Text>
                <Feather name="arrow-right" size={13} color="#FB7185" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── COMPLAINTS CARD ── */}
          <TouchableOpacity style={s.card} onPress={() => router.push(TAB_MANAGE)} activeOpacity={0.85}>
            <View style={s.cardHdr}>
              <View style={[s.iconBox, { backgroundColor: 'rgba(251,113,133,0.14)' }]}>
                <Feather name="alert-circle" size={14} color="#FB7185" />
              </View>
              <Text style={s.cardTitle}>Complaint Overview</Text>
              <View style={[s.ratePill, { backgroundColor: rate >= 60 ? 'rgba(52,211,153,0.14)' : 'rgba(252,211,77,0.14)' }]}>
                <Text style={[s.ratePillTxt, { color: rate >= 60 ? '#34D399' : '#FCD34D' }]}>{rate}% resolved</Text>
              </View>
            </View>
            <View style={s.metricsRow}>
              {[
                { label: 'Total',    value: complaints.length, color: '#818CF8' },
                { label: 'Pending',  value: pending,           color: '#FB7185' },
                { label: 'Progress', value: inProgress,        color: '#FCD34D' },
                { label: 'Resolved', value: resolved,          color: '#34D399' },
              ].map((m, i) => (
                <View key={m.label} style={[s.metricCell, i < 3 && s.metricDiv]}>
                  <Text style={[s.metricVal, { color: m.color }]}>{m.value}</Text>
                  <Text style={s.metricLbl}>{m.label}</Text>
                </View>
              ))}
            </View>
            <View style={s.progressBarWrap}>
              <View style={[s.progressBarFill, { width: `${rate}%` as any, backgroundColor: rate >= 60 ? '#34D399' : '#FCD34D' }]} />
            </View>
          </TouchableOpacity>

          {/* ── STATS GRID ── */}
          <Text style={s.sectionTitle}>System Overview</Text>
          <View style={s.grid}>
            {[
              { label: 'Citizens',  value: citizens.length,   icon: 'users',      color: '#818CF8', route: `${TAB_USERS}?tab=citizen`      },
              { label: 'Workers',   value: workers.length,    icon: 'user-check', color: '#34D399', route: `${TAB_USERS}?tab=safaikarmi`   },
              { label: 'Officials', value: officials.length,  icon: 'briefcase',  color: '#FCD34D', route: `${TAB_USERS}?tab=official`     },
              { label: 'Houses',    value: activeHouses,      icon: 'home',       color: '#22D3EE', route: `${TAB_HOUSEDB}?view=houses`    },
              { label: 'Wards',     value: wards.length,      icon: 'map',        color: '#C084FC', route: `${TAB_HOUSEDB}?view=wards`     },
              { label: 'Keys',      value: secretKeys.length, icon: 'key',        color: '#F472B6', route: `${TAB_MANAGE}?tab=genkey`      },
            ].map(stat => (
              <TouchableOpacity
                key={stat.label}
                style={[s.statCard, { borderColor: stat.color + '28' }]}
                onPress={() => router.push(stat.route as any)}
                activeOpacity={0.75}
              >
                <LinearGradient colors={[stat.color + '22', stat.color + '0A']} style={StyleSheet.absoluteFill} />
                <View style={[s.statIcon, { backgroundColor: stat.color + '1A' }]}>
                  <Feather name={stat.icon as any} size={16} color={stat.color} />
                </View>
                <Text style={[s.statVal, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.statLbl}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── QUICK ACCESS ── */}
          <Text style={s.sectionTitle}>Quick Access</Text>
          <View style={s.card}>
            {[
              { icon: 'users',    label: 'Manage Users',    sub: `${users.length} total accounts`,                                                                color: '#818CF8', route: TAB_USERS                    },
              { icon: 'database', label: 'House Database',  sub: `${activeHouses} active · ${wards.length} wards`,                                               color: '#22D3EE', route: `${TAB_HOUSEDB}?view=houses`  },
              { icon: 'settings', label: 'Admin Manage',    sub: `${notices.filter(n => n.isActive).length} notices · ${secretKeys.filter(k=>k.isActive).length} keys`, color: '#C084FC', route: TAB_MANAGE             },
              { icon: 'lock',     label: 'Password Resets', sub: pendingResets > 0 ? `${pendingResets} pending review` : 'No pending requests',                  color: pendingResets > 0 ? '#FB7185' : '#34D399', route: `${TAB_MANAGE}?tab=resets` },
            ].map((item, i, arr) => (
              <TouchableOpacity key={item.label} style={[s.qaRow, i < arr.length - 1 && s.qaDiv]} onPress={() => router.push(item.route as any)} activeOpacity={0.74}>
                <View style={[s.iconBox, { backgroundColor: item.color + '16', width: 36, height: 36, borderRadius: 11 }]}>
                  <Feather name={item.icon as any} size={15} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.qaLabel}>{item.label}</Text>
                  <Text style={s.qaSub} numberOfLines={1}>{item.sub}</Text>
                </View>
                <Feather name="chevron-right" size={14} color={MUTED2} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ── ACTIVE NOTICES BANNER ── */}
          {notices.filter(n => n.isActive).length > 0 && (
            <TouchableOpacity style={s.noticeBanner} onPress={() => router.push(`${TAB_MANAGE}?tab=notices` as any)} activeOpacity={0.82}>
              <LinearGradient colors={['rgba(34,211,238,0.14)', 'rgba(34,211,238,0.05)']} style={s.noticeBannerInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={[s.iconBox, { backgroundColor: 'rgba(34,211,238,0.16)', width: 36, height: 36, borderRadius: 11 }]}>
                  <Feather name="volume-2" size={14} color="#22D3EE" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#22D3EE', fontSize: 13, fontFamily: 'Inter_700Bold' }}>Active Notices</Text>
                  <Text style={{ color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' }}>{notices.filter(n => n.isActive).length} notice{notices.filter(n => n.isActive).length !== 1 ? 's' : ''} published</Text>
                </View>
                <Feather name="arrow-right" size={14} color="#22D3EE" />
              </LinearGradient>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  greeting: { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular' },
  name: { color: TEXT, fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,113,133,0.16)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.30)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  alertDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FB7185' },
  alertBadgeTxt: { color: '#FB7185', fontSize: 11, fontFamily: 'Inter_700Bold' },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },

  body: { paddingHorizontal: 14, paddingTop: 6, gap: 14 },

  searchWrap: { backgroundColor: GLASS, borderRadius: 16, borderWidth: 1, borderColor: BD, overflow: 'hidden' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingVertical: 12 },
  searchInput: { flex: 1, color: TEXT, fontSize: 14, fontFamily: 'Inter_400Regular' },
  searchDropdown: { borderTopWidth: 1, borderTopColor: BD, paddingHorizontal: 12, paddingBottom: 10 },
  searchCount: { color: MUTED, fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, paddingVertical: 8 },
  searchSecHdr: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginBottom: 4 },
  searchSecTxt: { fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  searchAvatar: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  searchRowName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: TEXT },
  searchRowSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: MUTED },
  searchMore: { color: MUTED, fontSize: 10, fontFamily: 'Inter_500Medium', paddingVertical: 4 },
  searchEmpty: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, justifyContent: 'center' },
  searchEmptyTxt: { color: MUTED, fontSize: 13, fontFamily: 'Inter_400Regular' },

  alertBanner: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(251,113,133,0.28)', overflow: 'hidden' },
  alertBannerInner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  alertPulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FB7185' },
  alertBannerTxt: { flex: 1, color: '#FB7185', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  card: { backgroundColor: GLASS, borderRadius: 20, borderWidth: 1, borderColor: BD, overflow: 'hidden' },
  cardHdr: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  cardTitle: { color: TEXT, fontSize: 14, fontFamily: 'Inter_700Bold', flex: 1 },
  iconBox: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  ratePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  ratePillTxt: { fontSize: 10, fontFamily: 'Inter_700Bold' },

  metricsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: BD },
  metricCell: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  metricDiv: { borderRightWidth: 1, borderRightColor: BD },
  metricVal: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  metricLbl: { color: MUTED, fontSize: 9, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  progressBarWrap: { height: 3, backgroundColor: BD, marginHorizontal: 14, marginBottom: 14, borderRadius: 99, overflow: 'hidden', marginTop: 2 },
  progressBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99 },

  sectionTitle: { color: TEXT, fontSize: 15, fontFamily: 'Inter_700Bold' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { color: '#818CF8', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '30%', flexGrow: 1, borderRadius: 18, padding: 13, borderWidth: 1, gap: 5, alignItems: 'center', overflow: 'hidden' },
  statIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statVal: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  statLbl: { color: MUTED, fontSize: 10, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },

  wardCard: { width: 150, borderRadius: 18, padding: 13, borderWidth: 1, gap: 2, overflow: 'hidden' },
  wardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  wardNum: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  healthPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 99 },
  healthDot: { width: 5, height: 5, borderRadius: 3 },
  healthLbl: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  wardName: { color: TEXT, fontSize: 12, fontFamily: 'Inter_700Bold' },
  wardArea: { color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular' },
  wardDivider: { borderTopWidth: 1, marginVertical: 7 },
  wardStatRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 },
  wardStatTxt: { fontSize: 10, fontFamily: 'Inter_500Medium' },

  qaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  qaDiv: { borderBottomWidth: 1, borderBottomColor: BD },
  qaLabel: { color: TEXT, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  qaSub: { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },

  noticeBanner: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(34,211,238,0.22)', overflow: 'hidden' },
  noticeBannerInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
});
