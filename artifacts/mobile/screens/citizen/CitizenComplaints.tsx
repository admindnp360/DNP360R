import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComplaintCard } from '@/components/ComplaintCard';
import { SearchBar } from '@/components/SearchBar';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { COMPLAINT_CATEGORIES } from '@/types';

type Filter = 'all' | 'active' | 'resolved';

const CATEGORIES = Object.entries(COMPLAINT_CATEGORIES) as [string, string][];

export default function CitizenComplaints() {
  const { user } = useAuth();
  const { getComplaintsByUser, addComplaint } = useAppData();
  const colors = useColors();

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState<string>('garbage_collection');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const complaints = getComplaintsByUser(user?.id ?? '');
  const filtered = complaints.filter(c => {
    if (filter === 'active' && c.status === 'resolved') return false;
    if (filter === 'resolved' && c.status !== 'resolved') return false;
    if (search && !c.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleSubmit() {
    if (!description.trim() || !location.trim()) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await addComplaint({
        citizenId: user?.id ?? '',
        citizenName: user?.name ?? '',
        category: category as any,
        description: description.trim(),
        location: location.trim(),
        status: 'submitted',
        wardId: '',
        images: [],
      });
      setShowModal(false);
      setDescription('');
      setLocation('');
      setCategory('garbage_collection');
      Alert.alert('Submitted!', 'Your complaint has been submitted successfully.');
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${complaints.length})` },
    { key: 'active', label: `Active (${complaints.filter(c => c.status !== 'resolved').length})` },
    { key: 'resolved', label: `Resolved (${complaints.filter(c => c.status === 'resolved').length})` },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.headerBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Complaints</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.citizen }]} onPress={() => setShowModal(true)}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search complaints…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {tabs.map(t => (
            <Pressable key={t.key} style={[styles.tab, filter === t.key && { backgroundColor: colors.citizen }]} onPress={() => setFilter(t.key)}>
              <Text style={[styles.tabText, { color: filter === t.key ? '#fff' : colors.mutedForeground }]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
        {filtered.map(c => <ComplaintCard key={c.id} complaint={c} />)}
        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No complaints found</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {filter === 'all' ? 'Tap + New to submit your first complaint' : 'No complaints in this category'}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Complaint</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Feather name="x" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map(([key, label]) => (
                  <Pressable
                    key={key}
                    style={[styles.catBtn, { borderColor: category === key ? colors.citizen : colors.border, backgroundColor: category === key ? colors.citizenBg : colors.card }]}
                    onPress={() => setCategory(key)}
                  >
                    <Text style={[styles.catText, { color: category === key ? colors.citizen : colors.text }]}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Describe the issue clearly…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="map-pin" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter specific location"
                  placeholderTextColor={colors.mutedForeground}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.citizen }, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit Complaint'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  filters: { padding: 16, gap: 10 },
  tabs: { flexDirection: 'row' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, marginRight: 8, backgroundColor: 'transparent' },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  list: { flex: 1 },
  empty: { borderRadius: 16, padding: 32, borderWidth: 1, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  modalBody: { padding: 16, gap: 12, paddingBottom: 40 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  catText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 100, textAlignVertical: 'top' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 14 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15, marginTop: 8 },
  submitText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
