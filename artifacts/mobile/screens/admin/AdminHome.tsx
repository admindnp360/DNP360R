import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

const BG       = '#060B18';
const GLASS    = 'rgba(255,255,255,0.055)';
const GLASS_HI = 'rgba(255,255,255,0.09)';
const GLASS_BD = 'rgba(255,255,255,0.10)';
const TEXT     = '#F0F4FF';
const MUTED    = 'rgba(255,255,255,0.42)';
const MUTED2   = 'rgba(255,255,255,0.22)';

// Correct admin tab routes
const TAB_USERS    = '/(tabs)/action';
const TAB_HOUSEDB  = '/(tabs)/secondary';
const TAB_MANAGE   = '/(tabs)/tertiary';

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ── COMPACT HEADER ── */}
        <LinearGradient colors={['#0D1635', '#080E22', BG]} style={s.header}>
          <View style={[s.orb, { top: -24, right: -16, width: 130, height: 130, backgroundColor: 'rgba(99,102,241,0.15)' }]} />
          <View style={[s.orb, { bottom: 0, left: -30, width: 90, height: 90, backgroundColor: 'rgba(6,182,212,0.08)' }]} />

          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={s.rolePill}>
                <Feather name="shield" size={9} color="#818CF8" />
                <Text style={s.rolePillTxt}>System Administrator</Text>
              </View>
              <Text style={s.headerName}>{user?.name ?? 'Admin'}</Text>
              <View style={s.statusRow}>
                <View style={s.onlineDot} />
                <Text style={s.statusTxt}>Online · Full Access · DNP360</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
              <LinearGradient colors={['#6366F1', '#8B5CF6', '#EC4899']} style={s.avatar}>
                <Text style={s.avatarLetter}>{(user?.name ?? 'A')[0].toUpperCase()}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={s.body}>

          {/* ── ALERT BANNER ── */}
          {pendingResets > 0 && (
            <TouchableOpacity style={s.alertWrap} activeOpacity={0.82} onPress={() => router.push(TAB_MANAGE)}>
              <LinearGradient colors={['rgba(251,113,133,0.20)', 'rgba(251,113,133,0.08)']} style={s.alertInner}>
                <View style={s.alertDot} />
                <Text style={s.alertText}>{pendingResets} password reset{pendingResets > 1 ? 's' : ''} pending review</Text>
                <Feather name="arrow-right" size={14} color="#FB7185" />
              </LinearGradient>
            </TouchableOpacity>
          )}

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
                <TouchableOpacity onPress={() => setGlobalSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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

          {/* ── COMPLAINTS OVERVIEW ── */}
          <TouchableOpacity style={s.card} onPress={() => router.push(TAB_MANAGE)} activeOpacity={0.82}>
            <View style={s.cardHeader}>
              <View style={[s.cardIconBox, { backgroundColor: 'rgba(251,113,133,0.15)' }]}>
                <Feather name="alert-circle" size={13} color="#FB7185" />
              </View>
              <Text style={s.cardTitle}>Complaint Overview</Text>
              <Feather name="chevron-right" size={14} color={MUTED2} style={{ marginLeft: 'auto' }} />
            </View>
            <View style={s.metricsRow}>
              {[
                { label: 'Total',       value: complaints.length, color: '#818CF8' },
                { label: 'Pending',     value: pending,           color: '#FB7185' },
                { label: 'In Progress', value: inProgress,        color: '#FCD34D' },
                { label: 'Resolved',    value: resolved,          color: '#34D399' },
              ].map((m, i) => (
                <View key={m.label} style={[s.metricCell, i < 3 && s.metricDivider]}>
                  <Text style={[s.metricVal, { color: m.color }]}>{m.value}</Text>
                  <Text style={s.metricLbl}>{m.label}</Text>
                </View>
              ))}
            </View>
            <View style={[s.rateBar, { marginHorizontal: 14, marginBottom: 14 }]}>
              <View style={[s.rateBarFill, { width: `${rate}%` as any }]} />
              <Text style={s.rateBarTxt}>{rate}% resolved</Text>
            </View>
          </TouchableOpacity>

          {/* ── QUICK STATS GRID ── */}
          <Text style={s.sectionTitle}>System Overview</Text>
          <View style={s.grid}>
            {[
              { label: 'Citizens',    value: citizens.length,  icon: 'users',      color: '#818CF8', bg: 'rgba(99,102,241,0.12)',  tab: TAB_USERS },
              { label: 'Workers',     value: workers.length,   icon: 'user-check', color: '#34D399', bg: 'rgba(52,211,153,0.12)',  tab: TAB_USERS },
              { label: 'Officials',   value: officials.length, icon: 'briefcase',  color: '#FCD34D', bg: 'rgba(252,211,77,0.10)',  tab: TAB_USERS },
              { label: 'Secret Keys', value: secretKeys.length, icon: 'key',       color: '#F472B6', bg: 'rgba(244,63,94,0.10)',   tab: TAB_MANAGE },
              { label: 'Houses',      value: activeHouses,     icon: 'home',       color: '#22D3EE', bg: 'rgba(6,182,212,0.10)',   tab: TAB_HOUSEDB },
              { label: 'Wards',       value: wards.length,     icon: 'map',        color: '#C084FC', bg: 'rgba(139,92,246,0.10)', tab: TAB_HOUSEDB },
            ].map(stat => (
              <TouchableOpacity
                key={stat.label}
                style={[s.statCard, { backgroundColor: stat.bg, borderColor: stat.color + '30' }]}
                onPress={() => router.push(stat.tab as any)}
                activeOpacity={0.75}
              >
                <View style={[s.statIconBox, { backgroundColor: stat.color + '18', borderColor: stat.color + '28' }]}>
                  <Feather name={stat.icon as any} size={16} color={stat.color} />
                </View>
                <Text style={[s.statVal, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.statLbl}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── WARD HEALTH ── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Ward Health</Text>
            <TouchableOpacity onPress={() => router.push(TAB_HOUSEDB)} activeOpacity={0.7}>
              <Text style={s.seeAll}>Manage →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
            {wards.map(ward => {
              const wp  = complaints.filter(c => c.wardId === ward.id && c.status !== 'resolved').length;
              const ww  = users.filter(u => u.role === 'safaikarmi' && (ward.assignedWorkers ?? []).includes(u.id));
              const hlt = wp === 0 ? 'good' : wp <= 2 ? 'warn' : 'bad';
              const hC  = hlt === 'good' ? '#34D399' : hlt === 'warn' ? '#FBBF24' : '#FB7185';
              const hBg = hlt === 'good' ? 'rgba(52,211,153,0.09)' : hlt === 'warn' ? 'rgba(251,191,36,0.09)' : 'rgba(251,113,133,0.11)';
              const hBd = hlt === 'good' ? 'rgba(52,211,153,0.25)' : hlt === 'warn' ? 'rgba(251,191,36,0.25)' : 'rgba(251,113,133,0.28)';
              const hLbl = hlt === 'good' ? 'Healthy' : hlt === 'warn' ? 'Warning' : 'Critical';
              return (
                <TouchableOpacity key={ward.id} style={[s.wardCard, { backgroundColor: hBg, borderColor: hBd }]} onPress={() => router.push(TAB_HOUSEDB)} activeOpacity={0.8}>
                  <View style={s.wardTop}>
                    <Text style={[s.wardNum, { color: hC }]}>W{ward.wardNumber}</Text>
                    <View style={[s.healthPill, { backgroundColor: hC + '20' }]}>
                      <View style={[s.healthDot, { backgroundColor: hC }]} />
                      <Text style={[s.healthLbl, { color: hC }]}>{hLbl}</Text>
                    </View>
                  </View>
                  <Text style={s.wardName} numberOfLines={1}>{ward.name}</Text>
                  <Text style={s.wardArea} numberOfLines={1}>{ward.area}</Text>
                  <View style={[s.wardDivider, { borderTopColor: hBd }]} />
                  <View style={s.wardStatRow}>
                    <Feather name="alert-circle" size={10} color={wp > 0 ? '#FB7185' : MUTED} />
                    <Text style={[s.wardStatTxt, { color: wp > 0 ? '#FB7185' : MUTED }]}>{wp} pending</Text>
                    <Feather name="user" size={10} color={ww.length > 0 ? '#34D399' : MUTED} style={{ marginLeft: 6 }} />
                    <Text style={[s.wardStatTxt, { color: ww.length > 0 ? '#34D399' : MUTED }]}>{ww.length} SK</Text>
                  </View>
                  <View style={s.wardStatRow}>
                    <Feather name="home" size={10} color={MUTED} />
                    <Text style={[s.wardStatTxt, { color: MUTED }]}>{houses.filter(h => h.wardId === ward.id).length} houses</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── QUICK ACCESS ── */}
          <Text style={s.sectionTitle}>Quick Access</Text>
          <View style={s.card}>
            {[
              { icon: 'users',      label: 'Manage Users',     sub: `${users.length} total accounts`,             color: '#818CF8', tab: TAB_USERS },
              { icon: 'database',   label: 'House Database',   sub: `${activeHouses} active houses · ${wards.length} wards`, color: '#22D3EE', tab: TAB_HOUSEDB },
              { icon: 'settings',   label: 'Admin Manage',     sub: `${notices.filter(n=>n.isActive).length} notices · ${secretKeys.filter(k=>k.isActive).length} keys`, color: '#C084FC', tab: TAB_MANAGE },
              { icon: 'lock',       label: 'Password Resets',  sub: pendingResets > 0 ? `${pendingResets} pending review` : 'No pending requests', color: pendingResets > 0 ? '#FB7185' : '#34D399', tab: TAB_MANAGE },
            ].map((item, i, arr) => (
              <TouchableOpacity key={item.label} style={[s.qaRow, i < arr.length - 1 && s.qaRowDivider]} onPress={() => router.push(item.tab as any)} activeOpacity={0.74}>
                <View style={[s.qaIconBox, { backgroundColor: item.color + '16' }]}>
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

          {/* ── NOTICES BANNER ── */}
          {notices.filter(n => n.isActive).length > 0 && (
            <TouchableOpacity style={s.noticeWrap} onPress={() => router.push(TAB_MANAGE)} activeOpacity={0.82}>
              <LinearGradient colors={['rgba(6,182,212,0.16)', 'rgba(6,182,212,0.06)']} style={s.noticeInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={[s.qaIconBox, { backgroundColor: 'rgba(6,182,212,0.18)' }]}>
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
  header: { paddingTop: 12, paddingBottom: 20, paddingHorizontal: 18, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(129,140,248,0.14)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(129,140,248,0.26)', alignSelf: 'flex-start', marginBottom: 6 },
  rolePillTxt: { color: '#818CF8', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  headerName: { color: TEXT, fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' },
  statusTxt: { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },

  body: { padding: 14, gap: 16 },

  alertWrap: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(251,113,133,0.30)', overflow: 'hidden' },
  alertInner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  alertDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FB7185' },
  alertText: { flex: 1, color: '#FB7185', fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  searchWrap: { backgroundColor: GLASS, borderRadius: 16, borderWidth: 1, borderColor: GLASS_BD, overflow: 'hidden' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingVertical: 11 },
  searchInput: { flex: 1, color: TEXT, fontSize: 14, fontFamily: 'Inter_400Regular' },
  searchDropdown: { borderTopWidth: 1, borderTopColor: GLASS_BD, paddingHorizontal: 12, paddingBottom: 10 },
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

  card: { backgroundColor: GLASS, borderRadius: 20, borderWidth: 1, borderColor: GLASS_BD, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 12 },
  cardIconBox: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: TEXT, fontSize: 14, fontFamily: 'Inter_700Bold' },

  metricsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: GLASS_BD },
  metricCell: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  metricDivider: { borderRightWidth: 1, borderRightColor: GLASS_BD },
  metricVal: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  metricLbl: { color: MUTED, fontSize: 9, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  rateBar: { height: 4, backgroundColor: GLASS_BD, borderRadius: 99, overflow: 'hidden', marginTop: 6 },
  rateBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#34D399', borderRadius: 99 },
  rateBarTxt: { color: '#34D399', fontSize: 9, fontFamily: 'Inter_600SemiBold', marginTop: 4, textAlign: 'right' },

  sectionTitle: { color: TEXT, fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { color: '#818CF8', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '30%', flexGrow: 1, borderRadius: 18, padding: 13, borderWidth: 1, gap: 5, alignItems: 'center' },
  statIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginBottom: 2 },
  statVal: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  statLbl: { color: MUTED, fontSize: 10, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },

  wardCard: { width: 152, borderRadius: 18, padding: 13, borderWidth: 1, gap: 2 },
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
  qaRowDivider: { borderBottomWidth: 1, borderBottomColor: GLASS_BD },
  qaIconBox: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  qaLabel: { color: TEXT, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  qaSub: { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },

  noticeWrap: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(6,182,212,0.28)', overflow: 'hidden' },
  noticeInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
});
