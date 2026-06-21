import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

type Tab = 'wards' | 'notices';

export default function AdminManagement() {
  const { wards, notices, addWard, addNotice, deleteNotice } = useAppData();
  const colors = useColors();
  const [tab, setTab] = useState<Tab>('wards');
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeType, setNoticeType] = useState<'notice' | 'announcement' | 'alert'>('notice');
  const [noticePriority, setNoticePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [saving, setSaving] = useState(false);

  async function handleAddNotice() {
    if (!noticeTitle.trim() || !noticeContent.trim()) { Alert.alert('Missing fields', 'Title and content are required.'); return; }
    setSaving(true);
    try {
      await addNotice({ title: noticeTitle.trim(), content: noticeContent.trim(), type: noticeType, priority: noticePriority, isActive: true });
      setShowNoticeModal(false);
      setNoticeTitle(''); setNoticeContent('');
      Alert.alert('✓ Notice Published', 'The notice is now visible to all citizens.');
    } finally { setSaving(false); }
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'wards', label: 'Wards', icon: 'map' },
    { key: 'notices', label: 'Notices', icon: 'volume-2' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Management</Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map(t => (
          <Pressable key={t.key} style={[styles.tabBtn, tab === t.key && { backgroundColor: colors.adminColor, borderColor: colors.adminColor }]} onPress={() => setTab(t.key)}>
            <Feather name={t.icon as any} size={14} color={tab === t.key ? '#fff' : colors.mutedForeground} />
            <Text style={[styles.tabBtnText, { color: tab === t.key ? '#fff' : colors.mutedForeground }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'wards' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
          {wards.map(w => (
            <View key={w.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.wardTop}>
                <View style={[styles.wardNumBadge, { backgroundColor: colors.adminBg }]}>
                  <Text style={[styles.wardNumText, { color: colors.adminColor }]}>W-{w.wardNumber}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.wardName, { color: colors.text }]}>{w.name}</Text>
                  <Text style={[styles.wardArea, { color: colors.mutedForeground }]}>{w.area}</Text>
                </View>
              </View>
              <View style={[styles.wardStats, { borderTopColor: colors.border }]}>
                {[
                  { label: 'Houses', value: w.totalHouses, icon: 'home' },
                  { label: 'Workers', value: w.assignedWorkers.length, icon: 'user-check' },
                ].map(s => (
                  <View key={s.label} style={styles.wardStat}>
                    <Feather name={s.icon as any} size={12} color={colors.mutedForeground} />
                    <Text style={[styles.wardStatText, { color: colors.mutedForeground }]}>{s.value} {s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
          <TouchableOpacity style={[styles.addNoticeBtn, { backgroundColor: colors.adminColor }]} onPress={() => setShowNoticeModal(true)} activeOpacity={0.85}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addNoticeBtnText}>Publish New Notice</Text>
          </TouchableOpacity>

          {notices.map(n => (
            <View key={n.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: n.isActive ? 1 : 0.6 }]}>
              <View style={styles.noticeTop}>
                <View style={[styles.noticeBadge, { backgroundColor: n.priority === 'high' ? '#FDECEA' : n.priority === 'medium' ? '#FFF3E0' : colors.surface }]}>
                  <Text style={[styles.noticeBadgeText, { color: n.priority === 'high' ? colors.destructive : n.priority === 'medium' ? colors.official : colors.mutedForeground }]}>
                    {n.priority.toUpperCase()}
                  </Text>
                </View>
                <Pressable style={styles.deleteBtn} onPress={() => Alert.alert('Delete Notice?', n.title, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteNotice(n.id) }])}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </Pressable>
              </View>
              <Text style={[styles.noticeTitle, { color: colors.text }]}>{n.title}</Text>
              <Text style={[styles.noticeContent, { color: colors.mutedForeground }]} numberOfLines={2}>{n.content}</Text>
              <Text style={[styles.noticeDate, { color: colors.mutedForeground }]}>{n.createdAt}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={showNoticeModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Notice</Text>
            <Pressable onPress={() => setShowNoticeModal(false)}><Feather name="x" size={22} color={colors.text} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <Text style={[styles.label, { color: colors.text }]}>Type</Text>
            <View style={styles.typeRow}>
              {(['notice', 'announcement', 'alert'] as const).map(t => (
                <Pressable key={t} style={[styles.typeBtn, { borderColor: noticeType === t ? colors.adminColor : colors.border, backgroundColor: noticeType === t ? colors.adminBg : colors.card }]} onPress={() => setNoticeType(t)}>
                  <Text style={[styles.typeBtnText, { color: noticeType === t ? colors.adminColor : colors.mutedForeground }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
            <View style={styles.typeRow}>
              {(['low', 'medium', 'high'] as const).map(p => (
                <Pressable key={p} style={[styles.typeBtn, { borderColor: noticePriority === p ? colors.official : colors.border, backgroundColor: noticePriority === p ? colors.officialBg : colors.card }]} onPress={() => setNoticePriority(p)}>
                  <Text style={[styles.typeBtnText, { color: noticePriority === p ? colors.official : colors.mutedForeground }]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="Notice title…" placeholderTextColor={colors.mutedForeground} value={noticeTitle} onChangeText={setNoticeTitle} />
            <Text style={[styles.label, { color: colors.text }]}>Content *</Text>
            <TextInput style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="Write notice content…" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={5} value={noticeContent} onChangeText={setNoticeContent} textAlignVertical="top" />
            <TouchableOpacity style={[styles.publishBtn, { backgroundColor: colors.adminColor }, saving && { opacity: 0.6 }]} onPress={handleAddNotice} disabled={saving} activeOpacity={0.85}>
              <Feather name="send" size={16} color="#fff" />
              <Text style={styles.publishBtnText}>{saving ? 'Publishing…' : 'Publish Notice'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  tabRow: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'transparent' },
  tabBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  card: { borderRadius: 12, padding: 14, borderWidth: 1, gap: 10 },
  wardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wardNumBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  wardNumText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  wardName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  wardArea: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  wardStats: { flexDirection: 'row', gap: 16, paddingTop: 10, borderTopWidth: 1 },
  wardStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  wardStatText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  addNoticeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  addNoticeBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  noticeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noticeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  noticeBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  deleteBtn: { padding: 4 },
  noticeTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  noticeContent: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  noticeDate: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  typeBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 120 },
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15 },
  publishBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
