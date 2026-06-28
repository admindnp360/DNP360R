import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/contexts/AlertContext';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Group, House, Ward } from '@/types';
import { PROPERTY_TYPES } from '@/types';
import SuperAdminImport from './SuperAdminImport';

// ─── Glass Design Tokens ──────────────────────────────────────────────
const BG        = '#060B18';
const GLASS     = 'rgba(255,255,255,0.07)';
const GLASS_HI  = 'rgba(255,255,255,0.12)';
const GLASS_BD  = 'rgba(255,255,255,0.13)';
const TEXT      = '#F0F4FF';
const MUTED     = 'rgba(255,255,255,0.45)';
const MUTED2    = 'rgba(255,255,255,0.25)';

type View_ = 'wards' | 'groups' | 'houses';

const WARD_GRADS: readonly [string, string][] = [
  ['#4F46E5', '#7C3AED'],
  ['#0EA5E9', '#0284C7'],
  ['#10B981', '#059669'],
  ['#F97316', '#EA580C'],
  ['#EC4899', '#DB2777'],
  ['#8B5CF6', '#6D28D9'],
];

const GROUP_COLORS = ['#10B981','#0EA5E9','#F97316','#8B5CF6','#EC4899','#EF4444','#F59E0B','#06B6D4'];

export default function SuperAdminHouseDB() {
  const {
    houses, wards, groups, users,
    addHouse, updateHouse, deleteHouse,
    addGroup, updateGroup, deleteGroup,
    addWard, updateWard, deleteWard,
    assignWorkerToWard, assignGroupToHouses, removeGroupFromHouses,
    syncStatus,
  } = useAppData();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  // ── Navigation state ──────────────────────────────────────────────
  const [view, setView]                   = useState<View_>('wards');
  const [selectedWard, setSelectedWard]   = useState<Ward | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expandedHouseId, setExpandedHouseId] = useState<string | null>(null);
  const [search, setSearch]               = useState('');
  const [globalSearch, setGlobalSearch]   = useState('');

  // ── Modal state ────────────────────────────────────────────────────
  const [showAddHouseModal, setShowAddHouseModal]   = useState(false);
  const [showAddGroupModal, setShowAddGroupModal]   = useState(false);
  const [showEditHouseModal, setShowEditHouseModal] = useState(false);
  const [showAddWardModal, setShowAddWardModal]     = useState(false);
  const [showWorkerModal, setShowWorkerModal]       = useState(false);
  const [showEditWardModal, setShowEditWardModal]   = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showMoveModal, setShowMoveModal]           = useState(false);
  const [showExportModal, setShowExportModal]       = useState(false);
  const [showImportModal, setShowImportModal]       = useState(false);

  // ── Form state ─────────────────────────────────────────────────────
  const [editingHouse, setEditingHouse]   = useState<House | null>(null);
  const [houseForm, setHouseForm]         = useState({ ownerName: '', fatherOrHusband: '', mobile: '', address: '', propertyType: 'Residential' as any });
  const [groupForm, setGroupForm]         = useState({ name: '', description: '', color: GROUP_COLORS[0] });
  const [wardForm, setWardForm]           = useState({ wardNumber: '', name: '', area: '' });
  const [workerModalWard, setWorkerModalWard] = useState<Ward | null>(null);
  const [workerSearch, setWorkerSearch]   = useState('');
  const [editingWard, setEditingWard]     = useState<Ward | null>(null);
  const [editWardForm, setEditWardForm]   = useState({ name: '', area: '' });
  const [editingGroup, setEditingGroup]   = useState<Group | null>(null);
  const [editGroupForm, setEditGroupForm] = useState({ name: '', description: '' });
  const [moveWardId, setMoveWardId]       = useState<string>('');
  const [moveGroupId, setMoveGroupId]     = useState<string | null>(null);

  // ── Selection (DB tab) ─────────────────────────────────────────────
  const [selectionMode, setSelectionMode]       = useState(false);
  const [selectedHouseIds, setSelectedHouseIds] = useState<string[]>([]);

  // ── Ward selection ─────────────────────────────────────────────────
  const [wardSelMode, setWardSelMode]       = useState(false);
  const [selectedWardIds, setSelectedWardIds] = useState<string[]>([]);
  function exitWardSel() { setWardSelMode(false); setSelectedWardIds([]); }
  function toggleWardSel(id: string) { setSelectedWardIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  async function handleBulkDeleteWards() {
    const withHouses = selectedWardIds.filter(id => houses.some(h => h.wardId === id));
    if (withHouses.length > 0) {
      showAlert('Cannot Delete', `${withHouses.length} ward(s) still have houses. Remove all houses first.`, undefined, 'warning'); return;
    }
    showAlert('Delete Wards?', `Permanently delete ${selectedWardIds.length} ward(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: async () => {
          setSaving(true);
          try { await Promise.all(selectedWardIds.map(id => deleteWard(id))); exitWardSel(); showAlert('Deleted', 'Wards removed.', undefined, 'success'); }
          finally { setSaving(false); }
        },
      },
    ], 'error');
  }

  // ── Group selection ────────────────────────────────────────────────
  const [groupSelMode, setGroupSelMode]       = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  function exitGroupSel() { setGroupSelMode(false); setSelectedGroupIds([]); }
  function toggleGroupSel(id: string) { setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  async function handleBulkDeleteGroups() {
    showAlert('Delete Groups?', `Delete ${selectedGroupIds.length} group(s)? Houses become ungrouped.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: async () => {
          setSaving(true);
          try { await Promise.all(selectedGroupIds.map(id => deleteGroup(id))); exitGroupSel(); showAlert('Deleted', 'Groups removed.', undefined, 'success'); }
          finally { setSaving(false); }
        },
      },
    ], 'error');
  }

  // ── Bulk delete ────────────────────────────────────────────────────
  async function handleDeleteSelected() {
    if (selectedHouseIds.length === 0) return;
    showAlert('Delete Houses?', `Permanently delete ${selectedHouseIds.length} house(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: async () => {
          setSaving(true);
          try {
            await Promise.all(selectedHouseIds.map(id => deleteHouse(id)));
            exitSelectionMode();
            showAlert('Deleted', `${selectedHouseIds.length} house(s) deleted.`, undefined, 'success');
          } finally { setSaving(false); }
        },
      },
    ], 'error');
  }

  // ── Loading state ──────────────────────────────────────────────────
  const [savingWorker, setSavingWorker] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [exporting, setExporting]       = useState(false);

  // ── Sync pulse ────────────────────────────────────────────────────
  const syncPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (syncStatus === 'pending') {
      Animated.loop(Animated.sequence([
        Animated.timing(syncPulse, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(syncPulse, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])).start();
    } else {
      syncPulse.stopAnimation();
      Animated.timing(syncPulse, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [syncStatus]);

  // ── Derived stats ─────────────────────────────────────────────────
  const totalHouses     = useMemo(() => houses.length, [houses]);
  const activeHouses    = useMemo(() => houses.filter(h => h.isActive).length, [houses]);
  const ungroupedHouses = useMemo(() => houses.filter(h => !h.groupId).length, [houses]);

  // ── Global search across all wards ────────────────────────────────
  const globalResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    return houses.filter(h =>
      h.registrationNumber.toLowerCase().includes(q) ||
      h.ownerName.toLowerCase().includes(q) ||
      (h.fatherOrHusband || '').toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q) ||
      (h.mobile || '').includes(q)
    );
  }, [houses, globalSearch]);

  // ── DB Tab – navigation helpers ───────────────────────────────────
  function goToGroups(ward: Ward) { setSelectedWard(ward); setView('groups'); setSearch(''); setGlobalSearch(''); exitWardSel(); exitGroupSel(); }
  function goToHouses(group: Group | null) { setSelectedGroup(group); setView('houses'); setSearch(''); setExpandedHouseId(null); exitGroupSel(); }
  function goBack() {
    if (view === 'houses') { setView('groups'); setExpandedHouseId(null); setSearch(''); exitSelectionMode(); }
    else if (view === 'groups') { setView('wards'); setSelectedWard(null); setSearch(''); exitGroupSel(); }
  }

  function exitSelectionMode() { setSelectionMode(false); setSelectedHouseIds([]); }
  function toggleHouseSelection(id: string) {
    setSelectedHouseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }
  function openMoveModal() {
    setMoveWardId(selectedWard?.id ?? wards[0]?.id ?? '');
    setMoveGroupId(null);
    setShowMoveModal(true);
  }

  // ── House detail modal ────────────────────────────────────────────
  const [detailHouse, setDetailHouse] = useState<House | null>(null);
  const [activePanel, setActivePanel] = useState<'garbage' | 'complaints' | 'service' | null>(null);

  // ── House CRUD ────────────────────────────────────────────────────
  const houseList = useMemo(() => {
    let list: House[] = selectedGroup !== null
      ? houses.filter(h => h.groupId === selectedGroup.id)
      : selectedWard ? houses.filter(h => h.wardId === selectedWard.id) : [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(h =>
        h.registrationNumber.toLowerCase().includes(q) ||
        h.ownerName.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q)
      );
    }
    return list;
  }, [houses, selectedGroup, selectedWard, search]);

  async function handleAddHouse() {
    if (!selectedWard) return;
    if (!houseForm.ownerName.trim() || !houseForm.address.trim()) {
      showAlert('Missing Fields', 'Owner name and address are required.', undefined, 'warning'); return;
    }
    setSaving(true);
    try {
      const regNum = `DNPH${Date.now().toString().slice(-6)}`;
      await addHouse({
        registrationNumber: regNum, ownerName: houseForm.ownerName.trim(),
        fatherOrHusband: houseForm.fatherOrHusband.trim() || undefined,
        mobile: houseForm.mobile.trim(), address: houseForm.address.trim(),
        wardId: selectedWard.id, wardNumber: selectedWard.wardNumber,
        groupId: selectedGroup?.id, groupName: selectedGroup?.name,
        propertyType: houseForm.propertyType, status: 'Active', isActive: true, createdBy: user?.name,
      });
      setHouseForm({ ownerName: '', fatherOrHusband: '', mobile: '', address: '', propertyType: 'Residential' });
      setShowAddHouseModal(false);
      showAlert('House Added', `Registration: ${regNum}`, undefined, 'success');
    } finally { setSaving(false); }
  }

  async function handleSaveEditHouse() {
    if (!editingHouse) return;
    if (!houseForm.ownerName.trim() || !houseForm.address.trim()) {
      showAlert('Missing', 'Owner name and address required.', undefined, 'warning'); return;
    }
    setSaving(true);
    try {
      await updateHouse(editingHouse.id, {
        ownerName: houseForm.ownerName.trim(),
        fatherOrHusband: houseForm.fatherOrHusband.trim() || undefined,
        mobile: houseForm.mobile.trim(), address: houseForm.address.trim(),
        propertyType: houseForm.propertyType,
      });
      setShowEditHouseModal(false); setEditingHouse(null);
      showAlert('Updated', 'House details saved.', undefined, 'success');
    } finally { setSaving(false); }
  }

  async function handleDeleteHouse(h: House) {
    showAlert('Delete House?', `${h.ownerName} — ${h.registrationNumber}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHouse(h.id) },
    ], 'error');
  }

  function openEditHouse(h: House) {
    setEditingHouse(h);
    setHouseForm({ ownerName: h.ownerName, fatherOrHusband: h.fatherOrHusband || '', mobile: h.mobile, address: h.address, propertyType: h.propertyType || 'Residential' });
    setShowEditHouseModal(true);
  }

  // ── Ward CRUD ─────────────────────────────────────────────────────
  async function handleAddWard() {
    if (!wardForm.wardNumber.trim() || !wardForm.name.trim()) {
      showAlert('Missing', 'Ward number and name are required.', undefined, 'warning'); return;
    }
    if (wards.some(w => w.wardNumber === wardForm.wardNumber.trim())) {
      showAlert('Duplicate', `Ward ${wardForm.wardNumber} already exists.`, undefined, 'warning'); return;
    }
    setSaving(true);
    try {
      await addWard({ wardNumber: wardForm.wardNumber.trim(), name: wardForm.name.trim(), area: wardForm.area.trim() || wardForm.name.trim(), assignedWorkers: [], totalHouses: 0 });
      setWardForm({ wardNumber: '', name: '', area: '' }); setShowAddWardModal(false);
      showAlert('Ward Created', wardForm.name.trim(), undefined, 'success');
    } finally { setSaving(false); }
  }

  async function handleSaveEditWard() {
    if (!editingWard || !editWardForm.name.trim()) {
      showAlert('Missing', 'Ward name is required.', undefined, 'warning'); return;
    }
    setSaving(true);
    try {
      await updateWard(editingWard.id, { name: editWardForm.name.trim(), area: editWardForm.area.trim() || editWardForm.name.trim() });
      setShowEditWardModal(false); setEditingWard(null);
      showAlert('Updated', 'Ward details saved.', undefined, 'success');
    } finally { setSaving(false); }
  }

  async function handleDeleteWard(ward: Ward) {
    const wHouses = houses.filter(h => h.wardId === ward.id).length;
    if (wHouses > 0) {
      showAlert('Cannot Delete', `Ward ${ward.wardNumber} has ${wHouses} house(s). Remove all houses first.`, undefined, 'warning'); return;
    }
    showAlert('Delete Ward?', `Ward ${ward.wardNumber} — "${ward.name}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWard(ward.id) },
    ], 'error');
  }

  function openEditWard(ward: Ward) {
    setEditingWard(ward); setEditWardForm({ name: ward.name, area: ward.area || '' }); setShowEditWardModal(true);
  }

  // ── Group CRUD ────────────────────────────────────────────────────
  async function handleAddGroup() {
    if (!groupForm.name.trim()) { showAlert('Missing', 'Group name is required.', undefined, 'warning'); return; }
    setSaving(true);
    try {
      await addGroup({ name: groupForm.name.trim(), description: groupForm.description.trim(), color: groupForm.color, createdAt: new Date().toISOString().split('T')[0], createdBy: user?.name });
      setGroupForm({ name: '', description: '', color: GROUP_COLORS[0] }); setShowAddGroupModal(false);
      showAlert('Group Created', groupForm.name.trim(), undefined, 'success');
    } finally { setSaving(false); }
  }

  async function handleSaveEditGroup() {
    if (!editingGroup || !editGroupForm.name.trim()) { showAlert('Missing', 'Group name is required.', undefined, 'warning'); return; }
    setSaving(true);
    try {
      await updateGroup(editingGroup.id, { name: editGroupForm.name.trim(), description: editGroupForm.description.trim() });
      setShowEditGroupModal(false); setEditingGroup(null);
      showAlert('Updated', 'Group details saved.', undefined, 'success');
    } finally { setSaving(false); }
  }

  async function handleDeleteGroup(g: Group) {
    const count = houses.filter(h => h.groupId === g.id).length;
    showAlert('Delete Group?', `"${g.name}" has ${count} house(s). Houses will become ungrouped.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGroup(g.id) },
    ], 'error');
  }

  function openEditGroup(g: Group) {
    setEditingGroup(g); setEditGroupForm({ name: g.name, description: g.description || '' }); setShowEditGroupModal(true);
  }

  // ── Worker assignment ─────────────────────────────────────────────
  const safaikarmis = users.filter(u => u.role === 'safaikarmi' && u.isActive !== false);

  function openWorkerModal(ward: Ward) { setWorkerModalWard(ward); setWorkerSearch(''); setShowWorkerModal(true); }

  async function handleAssignWorker(workerId: string) {
    if (!workerModalWard) return;
    setSavingWorker(true);
    try {
      await assignWorkerToWard(workerModalWard.id, workerId);
      setWorkerModalWard(prev => prev ? { ...prev, assignedWorkers: prev.assignedWorkers.includes(workerId) ? prev.assignedWorkers : [...prev.assignedWorkers, workerId] } : prev);
    } finally { setSavingWorker(false); }
  }

  async function handleRemoveWorker(workerId: string) {
    if (!workerModalWard) return;
    const newWorkers = workerModalWard.assignedWorkers.filter(id => id !== workerId);
    setSavingWorker(true);
    try {
      await updateWard(workerModalWard.id, { assignedWorkers: newWorkers });
      setWorkerModalWard(prev => prev ? { ...prev, assignedWorkers: newWorkers } : prev);
    } finally { setSavingWorker(false); }
  }

  // ── Move houses ───────────────────────────────────────────────────
  async function handleMoveHouses() {
    if (selectedHouseIds.length === 0) return;
    setSaving(true);
    try {
      const targetWard  = wards.find(w => w.id === moveWardId);
      const targetGroup = moveGroupId ? groups.find(g => g.id === moveGroupId) : null;
      const isCrossWard = targetWard && targetWard.id !== selectedWard?.id;
      if (isCrossWard || moveGroupId === null) {
        await Promise.all(selectedHouseIds.map(id => updateHouse(id, {
          wardId: targetWard?.id ?? selectedWard?.id, wardNumber: targetWard?.wardNumber ?? selectedWard?.wardNumber,
          groupId: targetGroup?.id, groupName: targetGroup?.name,
        })));
      } else if (targetGroup) {
        await assignGroupToHouses(selectedHouseIds, targetGroup.id, targetGroup.name);
      }
      setShowMoveModal(false); exitSelectionMode();
      showAlert('Done', `${selectedHouseIds.length} house(s) moved successfully.`, undefined, 'success');
    } catch { showAlert('Error', 'Failed to move houses.', undefined, 'error'); }
    finally { setSaving(false); }
  }

  async function handleUngroupSelected() {
    if (selectedHouseIds.length === 0) return;
    showAlert('Ungroup Houses?', `Remove ${selectedHouseIds.length} house(s) from their group?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Ungroup', style: 'destructive', onPress: async () => {
          setSaving(true);
          try { await removeGroupFromHouses(selectedHouseIds); exitSelectionMode(); showAlert('Done', 'Houses ungrouped.', undefined, 'success'); }
          finally { setSaving(false); }
        },
      },
    ], 'warning');
  }

  // ── Export CSV ────────────────────────────────────────────────────
  function buildCSV(list: House[]): string {
    const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const headers = ['S.No','Registration No','Owner Name','Father/Husband','Ward No','Group','Address','Mobile','Property Type','Status','Added On'];
    const rows = list.map((h, i) => [
      String(i+1), escape(h.registrationNumber), escape(h.ownerName), escape(h.fatherOrHusband||''),
      escape(`Ward ${h.wardNumber}`), escape(h.groupName||'Ungrouped'), escape(h.address),
      escape(h.mobile||''), escape(h.propertyType||'Residential'), escape(h.status||'Active'), escape(h.createdAt||''),
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  async function handleExportCSV() {
    if (houseList.length === 0) { showAlert('Nothing to Export', 'No houses match the current filter.', undefined, 'warning'); return; }
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) { showAlert('Not Supported', 'Sharing is not available on this device.', undefined, 'error'); return; }
    setExporting(true); setShowExportModal(false);
    try {
      const csv = buildCSV(houseList);
      const ward = selectedWard ? `Ward${selectedWard.wardNumber}` : 'AllWards';
      const grp  = selectedGroup ? `_${selectedGroup.name.replace(/\s+/g,'')}` : '';
      const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
      const filename = `HouseDB_${ward}${grp}_${date}.csv`;
      const path = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: `Export ${filename}`, UTI: 'public.comma-separated-values-text' });
    } catch (e: any) { showAlert('Export Failed', e?.message ?? 'Unknown error.', undefined, 'error'); }
    finally { setExporting(false); }
  }

  // ─────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────
  const syncColor = syncStatus === 'synced' ? '#34D399' : syncStatus === 'pending' ? '#FBBF24' : '#F87171';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      {view === 'wards' && (
        <View style={s.waHdr}>
          <View style={{ flex: 1 }}>
            <Text style={s.waHdrTitle}>Wards</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <Animated.View style={[s.waSyncDot, { backgroundColor: syncColor, opacity: syncPulse }]} />
              <Text style={s.waHdrSub}>{wards.length} wards · {totalHouses} houses</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[s.waHdrBtn, { backgroundColor: 'rgba(249,115,22,0.14)', borderColor: 'rgba(249,115,22,0.28)' }]} onPress={() => setShowImportModal(true)} activeOpacity={0.8}>
              <Feather name="upload" size={16} color="#F97316" />
            </TouchableOpacity>
            <TouchableOpacity style={[s.waHdrBtn, { backgroundColor: 'rgba(79,70,229,0.14)', borderColor: 'rgba(79,70,229,0.28)' }]} onPress={() => setShowAddWardModal(true)} activeOpacity={0.8}>
              <Feather name="plus" size={18} color="#818CF8" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Back header (groups / houses) ──────────────────────────── */}
      {view !== 'wards' && (
        <View style={s.waSubHdr}>
          <TouchableOpacity onPress={goBack} style={s.waBackCircle} activeOpacity={0.75}>
            <Feather name="arrow-left" size={17} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            {view === 'groups' && selectedWard && (
              <>
                <Text style={s.waHdrTitle} numberOfLines={1}>{selectedWard.name}</Text>
                <Text style={s.waHdrSub}>Ward {selectedWard.wardNumber}</Text>
              </>
            )}
            {view === 'houses' && (
              <>
                <Text style={s.waHdrTitle} numberOfLines={1}>{selectedGroup?.name ?? 'All Houses'}</Text>
                <Text style={s.waHdrSub}>{selectedWard?.name} · {houseList.length} houses</Text>
              </>
            )}
          </View>
          {view === 'groups' && (
            <TouchableOpacity style={[s.waHdrBtn, { backgroundColor: 'rgba(16,185,129,0.14)', borderColor: 'rgba(16,185,129,0.28)' }]} onPress={() => setShowAddGroupModal(true)} activeOpacity={0.8}>
              <Feather name="plus" size={16} color="#34D399" />
            </TouchableOpacity>
          )}
          {view === 'houses' && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={s.waHdrBtn} onPress={() => setShowExportModal(true)} activeOpacity={0.8} disabled={exporting}>
                {exporting ? <ActivityIndicator size={12} color="#818CF8" /> : <Feather name="download-cloud" size={15} color="#818CF8" />}
              </TouchableOpacity>
              <TouchableOpacity style={[s.waHdrBtn, { backgroundColor: 'rgba(79,70,229,0.14)', borderColor: 'rgba(79,70,229,0.28)' }]} onPress={() => setShowAddHouseModal(true)} activeOpacity={0.8}>
                <Feather name="plus" size={15} color="#818CF8" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Unified search bar ─────────────────────────────────────── */}
      {(view === 'wards' || view === 'houses') && (
        <View style={s.waSearchWrap}>
          <Feather name="search" size={14} color={MUTED} />
          <TextInput
            style={[s.waSearchIn, { color: TEXT }]}
            placeholder={view === 'wards' ? 'Search all houses — name, reg no, mobile…' : 'Search houses…'}
            placeholderTextColor={MUTED}
            value={view === 'wards' ? globalSearch : search}
            onChangeText={view === 'wards' ? setGlobalSearch : setSearch}
          />
          {(view === 'wards' ? globalSearch : search).length > 0 && (
            <TouchableOpacity onPress={() => view === 'wards' ? setGlobalSearch('') : setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x-circle" size={14} color={MUTED} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ═══════════════════ COMMUNITIES VIEW ═══════════════════════ */}
      {view === 'wards' && (
        <View style={{ flex: 1 }}>
          {/* Ward selection bar */}
          {wardSelMode && (
            <View style={s.selBar}>
              <TouchableOpacity onPress={exitWardSel} style={s.selBarCancel}>
                <Feather name="x" size={14} color={MUTED} />
              </TouchableOpacity>
              <Text style={[s.selBarCount, { color: TEXT }]}>{selectedWardIds.length} selected</Text>
              <TouchableOpacity
                onPress={() => selectedWardIds.length === wards.length ? setSelectedWardIds([]) : setSelectedWardIds(wards.map(w => w.id))}
                style={[s.selAction, { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.28)' }]}
              >
                <Feather name={selectedWardIds.length === wards.length ? 'check-square' : 'square'} size={12} color="#818CF8" />
                <Text style={[s.selActionText, { color: '#818CF8' }]}>{selectedWardIds.length === wards.length ? 'Deselect All' : 'Select All'}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={[s.selAction, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.28)' }]} onPress={handleBulkDeleteWards} disabled={selectedWardIds.length === 0 || saving}>
                <Feather name="trash-2" size={12} color="#EF4444" />
                <Text style={[s.selActionText, { color: '#EF4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {globalSearch.trim().length >= 2 ? (
              <View>
                <View style={s.waSecHdr}>
                  <Text style={s.waSecTxt}>{globalResults.length} result{globalResults.length !== 1 ? 's' : ''}</Text>
                </View>
                {globalResults.length === 0 ? (
                  <View style={s.waEmpty}>
                    <Feather name="search" size={30} color={MUTED2} />
                    <Text style={[s.waEmptyT, { color: TEXT }]}>No houses found</Text>
                    <Text style={[s.waEmptyS, { color: MUTED }]}>Try a different search term</Text>
                  </View>
                ) : globalResults.map(h => (
                  <TouchableOpacity key={h.id} style={s.waListRow} onPress={() => setDetailHouse(h)} activeOpacity={0.7}>
                    <LinearGradient colors={['#4F46E5','#7C3AED']} style={s.waListAvatar}>
                      <Feather name="home" size={13} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.waRowName, { color: TEXT }]} numberOfLines={1}>{h.ownerName}</Text>
                      <Text style={[s.waRowSub, { color: MUTED }]} numberOfLines={1}>
                        {h.registrationNumber} · W{h.wardNumber}{h.groupName ? ` · ${h.groupName}` : ''}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={14} color={MUTED2} />
                    <View style={s.waSep} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View>
                <View style={s.waSecHdr}>
                  <Text style={s.waSecTxt}>{wards.length} Ward{wards.length !== 1 ? 's' : ''}</Text>
                  {!wardSelMode && <Text style={[s.waSecTxt, { fontFamily: 'Inter_400Regular', color: MUTED, textTransform: 'none' }]}>Long-press to select</Text>}
                </View>
                {wards.length === 0 ? (
                  <View style={s.waEmpty}>
                    <Feather name="map" size={30} color={MUTED2} />
                    <Text style={[s.waEmptyT, { color: TEXT }]}>No wards yet</Text>
                    <Text style={[s.waEmptyS, { color: MUTED }]}>Tap + to add the first ward</Text>
                  </View>
                ) : [...wards].sort((a, b) => Number(a.wardNumber ?? 0) - Number(b.wardNumber ?? 0)).map((ward, idx) => {
                  const grad = WARD_GRADS[idx % WARD_GRADS.length];
                  const wHouses = houses.filter(h => h.wardId === ward.id).length;
                  const wWorkers = (ward.assignedWorkers ?? []).length;
                  const isSelW = selectedWardIds.includes(ward.id);
                  return (
                    <View key={ward.id}>
                      <TouchableOpacity
                        style={[s.waCommRow, isSelW && { backgroundColor: 'rgba(99,102,241,0.07)' }]}
                        onPress={() => wardSelMode ? toggleWardSel(ward.id) : goToGroups(ward)}
                        onLongPress={() => { if (!wardSelMode) setWardSelMode(true); toggleWardSel(ward.id); }}
                        activeOpacity={0.7}
                      >
                        {wardSelMode ? (
                          <View style={[s.checkbox, { borderColor: isSelW ? '#6366F1' : GLASS_BD, backgroundColor: isSelW ? '#6366F1' : 'transparent' }]}>
                            {isSelW && <Feather name="check" size={10} color="#fff" />}
                          </View>
                        ) : (
                          <LinearGradient colors={grad} style={s.waCommAvatar}>
                            <Text style={s.waCommAvatarTxt}>W{ward.wardNumber}</Text>
                          </LinearGradient>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[s.waRowName, { color: TEXT }]} numberOfLines={1}>{ward.name}</Text>
                          <Text style={[s.waRowSub, { color: MUTED }]} numberOfLines={1}>{ward.area}</Text>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
                            <View style={s.waMiniStat}>
                              <Feather name="home" size={8} color="#818CF8" />
                              <Text style={[s.waMiniStatTxt, { color: '#818CF8' }]}>{wHouses}</Text>
                            </View>
                            <View style={s.waMiniStat}>
                              <Feather name="users" size={8} color="#34D399" />
                              <Text style={[s.waMiniStatTxt, { color: '#34D399' }]}>{wWorkers} workers</Text>
                            </View>
                          </View>
                        </View>
                        {!wardSelMode && (
                          <View style={{ alignItems: 'flex-end', gap: 6 }}>
                            <Feather name="chevron-right" size={14} color={MUTED2} />
                            <View style={{ flexDirection: 'row', gap: 5 }}>
                              <TouchableOpacity onPress={() => openWorkerModal(ward)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={s.waMiniBtn}>
                                <Feather name="user-plus" size={10} color="#818CF8" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => openEditWard(ward)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={s.waMiniBtn}>
                                <Feather name="edit-2" size={10} color="#34D399" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteWard(ward)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={[s.waMiniBtn, { backgroundColor: 'rgba(239,68,68,0.14)', borderColor: 'rgba(239,68,68,0.28)' }]}>
                                <Feather name="trash-2" size={10} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                      <View style={s.waSep} />
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* ═══════════════════════ GROUPS VIEW ═══════════════════════ */}
      {view === 'groups' && selectedWard && (
        <View style={{ flex: 1 }}>
          {/* Group selection bar */}
          {groupSelMode && (
            <View style={s.selBar}>
              <TouchableOpacity onPress={exitGroupSel} style={s.selBarCancel}>
                <Feather name="x" size={14} color={MUTED} />
              </TouchableOpacity>
              <Text style={[s.selBarCount, { color: TEXT }]}>{selectedGroupIds.length} selected</Text>
              <TouchableOpacity
                onPress={() => selectedGroupIds.length === groups.length ? setSelectedGroupIds([]) : setSelectedGroupIds(groups.map(g => g.id))}
                style={[s.selAction, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.28)' }]}
              >
                <Feather name={selectedGroupIds.length === groups.length ? 'check-square' : 'square'} size={12} color="#34D399" />
                <Text style={[s.selActionText, { color: '#34D399' }]}>{selectedGroupIds.length === groups.length ? 'Deselect All' : 'Select All'}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={[s.selAction, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.28)' }]} onPress={handleBulkDeleteGroups} disabled={selectedGroupIds.length === 0 || saving}>
                <Feather name="trash-2" size={12} color="#EF4444" />
                <Text style={[s.selActionText, { color: '#EF4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <View style={s.waSecHdr}>
              <Text style={s.waSecTxt}>{groups.length + 1} group{groups.length + 1 !== 1 ? 's' : ''}</Text>
              {!groupSelMode && <Text style={[s.waSecTxt, { fontFamily: 'Inter_400Regular', color: MUTED, textTransform: 'none' }]}>Long-press to select</Text>}
            </View>
            {/* "All Houses" row — not selectable */}
            <TouchableOpacity style={s.waCommRow} onPress={() => !groupSelMode && goToHouses(null)} activeOpacity={0.7}>
              <LinearGradient colors={['#4F46E5','#7C3AED']} style={s.waCommAvatar}>
                <Feather name="grid" size={14} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.waRowName, { color: TEXT }]}>All Houses</Text>
                <Text style={[s.waRowSub, { color: MUTED }]}>{houses.filter(h => h.wardId === selectedWard.id).length} houses in ward</Text>
              </View>
              {!groupSelMode && <Feather name="chevron-right" size={14} color={MUTED2} />}
            </TouchableOpacity>
            <View style={s.waSep} />
            {groups.map((g, idx) => {
              const color = g.color || GROUP_COLORS[idx % GROUP_COLORS.length];
              const count = houses.filter(h => h.groupId === g.id).length;
              const isSelG = selectedGroupIds.includes(g.id);
              return (
                <View key={g.id}>
                  <TouchableOpacity
                    style={[s.waCommRow, isSelG && { backgroundColor: 'rgba(99,102,241,0.07)' }]}
                    onPress={() => groupSelMode ? toggleGroupSel(g.id) : goToHouses(g)}
                    onLongPress={() => { if (!groupSelMode) setGroupSelMode(true); toggleGroupSel(g.id); }}
                    activeOpacity={0.7}
                  >
                    {groupSelMode ? (
                      <View style={[s.checkbox, { borderColor: isSelG ? '#6366F1' : GLASS_BD, backgroundColor: isSelG ? '#6366F1' : 'transparent' }]}>
                        {isSelG && <Feather name="check" size={10} color="#fff" />}
                      </View>
                    ) : (
                      <View style={[s.waCommAvatar, { backgroundColor: color }]}>
                        <Feather name="layers" size={14} color="#fff" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[s.waRowName, { color: TEXT }]} numberOfLines={1}>{g.name}</Text>
                      <Text style={[s.waRowSub, { color: MUTED }]} numberOfLines={1}>{g.description || `${count} houses`}</Text>
                    </View>
                    {!groupSelMode && (
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={[s.waCountBubble, { backgroundColor: color + '22', borderColor: color + '40' }]}>
                          <Text style={[s.waCountBubbleTxt, { color }]}>{count}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 5 }}>
                          <TouchableOpacity onPress={() => openEditGroup(g)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={s.waMiniBtn}>
                            <Feather name="edit-2" size={10} color="#34D399" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteGroup(g)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={[s.waMiniBtn, { backgroundColor: 'rgba(239,68,68,0.14)', borderColor: 'rgba(239,68,68,0.28)' }]}>
                            <Feather name="trash-2" size={10} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={s.waSep} />
                </View>
              );
            })}
            {groups.length === 0 && (
              <View style={s.waEmpty}>
                <Feather name="layers" size={30} color={MUTED2} />
                <Text style={[s.waEmptyT, { color: TEXT }]}>No groups yet</Text>
                <Text style={[s.waEmptyS, { color: MUTED }]}>Tap + to add a group</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* ════════════════════════ HOUSES VIEW ════════════════════════ */}
      {view === 'houses' && selectedWard && (
        <View style={{ flex: 1 }}>
          {selectionMode && (
            <View style={s.selBar}>
              <TouchableOpacity onPress={exitSelectionMode} style={s.selBarCancel}>
                <Feather name="x" size={14} color={MUTED} />
              </TouchableOpacity>
              <Text style={[s.selBarCount, { color: TEXT }]}>{selectedHouseIds.length} selected</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={[s.selAction, { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: 'rgba(249,115,22,0.28)' }]} onPress={handleUngroupSelected} disabled={selectedHouseIds.length === 0}>
                <Feather name="link-2" size={12} color="#F97316" />
                <Text style={[s.selActionText, { color: '#F97316' }]}>Ungroup</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.selAction, { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.28)' }]} onPress={openMoveModal} disabled={selectedHouseIds.length === 0}>
                <Feather name="move" size={12} color="#818CF8" />
                <Text style={[s.selActionText, { color: '#818CF8' }]}>Move</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.selAction, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.28)' }]} onPress={handleDeleteSelected} disabled={selectedHouseIds.length === 0 || saving}>
                <Feather name="trash-2" size={12} color="#EF4444" />
                <Text style={[s.selActionText, { color: '#EF4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <View style={s.waSecHdr}>
              <Text style={s.waSecTxt}>{houseList.length} house{houseList.length !== 1 ? 's' : ''}</Text>
              {selectionMode ? (
                <TouchableOpacity
                  onPress={() => selectedHouseIds.length === houseList.length
                    ? setSelectedHouseIds([])
                    : setSelectedHouseIds(houseList.map(h => h.id))}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.12)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.28)' }}
                >
                  <Feather name={selectedHouseIds.length === houseList.length ? 'check-square' : 'square'} size={12} color="#818CF8" />
                  <Text style={{ color: '#818CF8', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                    {selectedHouseIds.length === houseList.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[s.waSecTxt, { fontFamily: 'Inter_400Regular', color: MUTED, textTransform: 'none' }]}>Long-press to select</Text>
              )}
            </View>
            {houseList.map((h, idx) => {
              const isSelected = selectedHouseIds.includes(h.id);
              const grpColor = groups.find(g => g.id === h.groupId)?.color ?? '#6366F1';
              return (
                <View key={h.id}>
                  <TouchableOpacity
                    style={[s.waListRow, isSelected && { backgroundColor: 'rgba(99,102,241,0.07)' }]}
                    onPress={() => selectionMode ? toggleHouseSelection(h.id) : setDetailHouse(h)}
                    onLongPress={() => { if (!selectionMode) setSelectionMode(true); toggleHouseSelection(h.id); }}
                    activeOpacity={0.7}
                  >
                    {selectionMode ? (
                      <View style={[s.checkbox, { borderColor: isSelected ? '#6366F1' : GLASS_BD, backgroundColor: isSelected ? '#6366F1' : 'transparent' }]}>
                        {isSelected && <Feather name="check" size={10} color="#fff" />}
                      </View>
                    ) : (
                      <Text style={{ width: 22, fontSize: 10, fontFamily: 'Inter_500Medium', color: MUTED2, textAlign: 'center' }}>{idx + 1}</Text>
                    )}
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: '#818CF8' }} numberOfLines={1}>{h.registrationNumber}</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: TEXT, maxWidth: '45%' }} numberOfLines={1}>{h.ownerName}</Text>
                    </View>
                    {h.groupId && <View style={[s.waGrpDot, { backgroundColor: grpColor }]} />}
                    <Feather name="chevron-right" size={13} color={MUTED2} />
                  </TouchableOpacity>
                  <View style={s.waSep} />
                </View>
              );
            })}
            {houseList.length === 0 && (
              <View style={s.waEmpty}>
                <Feather name="home" size={30} color={MUTED2} />
                <Text style={[s.waEmptyT, { color: TEXT }]}>No houses found</Text>
                <Text style={[s.waEmptyS, { color: MUTED }]}>Add a house using the + button</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}


      {/* ═══════════════════════════════════════════════════════════════
           MODALS
         ═══════════════════════════════════════════════════════════════ */}

      {/* CSV Import Modal */}
      <Modal visible={showImportModal} animationType="slide" presentationStyle="fullScreen">
        <View style={{ flex: 1, backgroundColor: BG }}>
          <SuperAdminImport embedded />
          <Pressable
            style={{ position: 'absolute', top: 52, right: 16, zIndex: 100, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setShowImportModal(false)}
          >
            <Feather name="x" size={18} color="#fff" />
          </Pressable>
        </View>
      </Modal>

      {/* Add House Modal */}
      <Modal visible={showAddHouseModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <LinearGradient colors={['#4F46E5','#7C3AED']} style={s.modalHdr}>
            <Text style={s.modalTitle}>Add House</Text>
            <Pressable onPress={() => setShowAddHouseModal(false)} style={s.closeBtn}><Feather name="x" size={19} color="#fff" /></Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {[
              { label: 'Owner Name *', key: 'ownerName', placeholder: 'Ram Prasad' },
              { label: 'Father / Husband Name', key: 'fatherOrHusband', placeholder: 'Shiv Prasad' },
              { label: 'Mobile', key: 'mobile', placeholder: '9876543210', keyboard: 'phone-pad' },
              { label: 'Address *', key: 'address', placeholder: 'Ward 1, Near Temple…' },
            ].map(f => (
              <View key={f.key}>
                <Text style={[s.fieldLabel, { color: MUTED }]}>{f.label}</Text>
                <TextInput
                  style={[s.fieldInput, { backgroundColor: GLASS, borderColor: GLASS_BD, color: TEXT }]}
                  placeholder={f.placeholder} placeholderTextColor={MUTED2}
                  value={(houseForm as any)[f.key]}
                  onChangeText={v => setHouseForm(p => ({ ...p, [f.key]: v }))}
                  keyboardType={f.keyboard as any}
                />
              </View>
            ))}
            <Text style={[s.fieldLabel, { color: MUTED }]}>Property Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {PROPERTY_TYPES.map(pt => (
                <TouchableOpacity key={pt} style={[s.typePill, houseForm.propertyType === pt && { backgroundColor: '#4F46E5', borderColor: '#4F46E5' }, { borderColor: GLASS_BD }]} onPress={() => setHouseForm(p => ({ ...p, propertyType: pt }))}>
                  <Text style={[s.typePillText, { color: houseForm.propertyType === pt ? '#fff' : MUTED }]}>{pt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={handleAddHouse} disabled={saving} activeOpacity={0.85}>
              <LinearGradient colors={['#4F46E5','#7C3AED']} style={s.saveBtn}>
                <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Add House'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit House Modal */}
      <Modal visible={showEditHouseModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <LinearGradient colors={['#0EA5E9','#0284C7']} style={s.modalHdr}>
            <Text style={s.modalTitle}>Edit House</Text>
            <Pressable onPress={() => setShowEditHouseModal(false)} style={s.closeBtn}><Feather name="x" size={19} color="#fff" /></Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {[
              { label: 'Owner Name *', key: 'ownerName', placeholder: 'Ram Prasad' },
              { label: 'Father / Husband Name', key: 'fatherOrHusband', placeholder: 'Shiv Prasad' },
              { label: 'Mobile', key: 'mobile', placeholder: '9876543210', keyboard: 'phone-pad' },
              { label: 'Address *', key: 'address', placeholder: 'Ward 1, Near Temple…' },
            ].map(f => (
              <View key={f.key}>
                <Text style={[s.fieldLabel, { color: MUTED }]}>{f.label}</Text>
                <TextInput
                  style={[s.fieldInput, { backgroundColor: GLASS, borderColor: GLASS_BD, color: TEXT }]}
                  placeholder={f.placeholder} placeholderTextColor={MUTED2}
                  value={(houseForm as any)[f.key]}
                  onChangeText={v => setHouseForm(p => ({ ...p, [f.key]: v }))}
                  keyboardType={f.keyboard as any}
                />
              </View>
            ))}
            <Text style={[s.fieldLabel, { color: MUTED }]}>Property Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {PROPERTY_TYPES.map(pt => (
                <TouchableOpacity key={pt} style={[s.typePill, houseForm.propertyType === pt && { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' }, { borderColor: GLASS_BD }]} onPress={() => setHouseForm(p => ({ ...p, propertyType: pt }))}>
                  <Text style={[s.typePillText, { color: houseForm.propertyType === pt ? '#fff' : MUTED }]}>{pt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={handleSaveEditHouse} disabled={saving} activeOpacity={0.85}>
              <LinearGradient colors={['#0EA5E9','#0284C7']} style={s.saveBtn}>
                <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Group Modal */}
      <Modal visible={showAddGroupModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <LinearGradient colors={['#10B981','#059669']} style={s.modalHdr}>
            <Text style={s.modalTitle}>Create Group</Text>
            <Pressable onPress={() => setShowAddGroupModal(false)} style={s.closeBtn}><Feather name="x" size={19} color="#fff" /></Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {[
              { label: 'Group Name *', key: 'name', placeholder: 'Zone A' },
              { label: 'Description', key: 'description', placeholder: 'Optional description…' },
            ].map(f => (
              <View key={f.key}>
                <Text style={[s.fieldLabel, { color: MUTED }]}>{f.label}</Text>
                <TextInput
                  style={[s.fieldInput, { backgroundColor: GLASS, borderColor: GLASS_BD, color: TEXT }]}
                  placeholder={f.placeholder} placeholderTextColor={MUTED2}
                  value={(groupForm as any)[f.key]}
                  onChangeText={v => setGroupForm(p => ({ ...p, [f.key]: v }))}
                />
              </View>
            ))}
            <Text style={[s.fieldLabel, { color: MUTED }]}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {GROUP_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setGroupForm(p => ({ ...p, color: c }))}>
                  <View style={[s.colorDot, { backgroundColor: c, borderWidth: groupForm.color === c ? 3 : 0, borderColor: '#fff' }]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={handleAddGroup} disabled={saving} activeOpacity={0.85}>
              <LinearGradient colors={['#10B981','#059669']} style={s.saveBtn}>
                <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Create Group'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Group Modal */}
      <Modal visible={showEditGroupModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <LinearGradient colors={['#10B981','#059669']} style={s.modalHdr}>
            <Text style={s.modalTitle}>Edit Group</Text>
            <Pressable onPress={() => setShowEditGroupModal(false)} style={s.closeBtn}><Feather name="x" size={19} color="#fff" /></Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {[
              { label: 'Group Name *', key: 'name', placeholder: 'Zone A' },
              { label: 'Description', key: 'description', placeholder: 'Optional description…' },
            ].map(f => (
              <View key={f.key}>
                <Text style={[s.fieldLabel, { color: MUTED }]}>{f.label}</Text>
                <TextInput
                  style={[s.fieldInput, { backgroundColor: GLASS, borderColor: GLASS_BD, color: TEXT }]}
                  placeholder={f.placeholder} placeholderTextColor={MUTED2}
                  value={(editGroupForm as any)[f.key]}
                  onChangeText={v => setEditGroupForm(p => ({ ...p, [f.key]: v }))}
                />
              </View>
            ))}
            <TouchableOpacity onPress={handleSaveEditGroup} disabled={saving} activeOpacity={0.85}>
              <LinearGradient colors={['#10B981','#059669']} style={s.saveBtn}>
                <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Ward Modal */}
      <Modal visible={showAddWardModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <LinearGradient colors={['#4F46E5','#6366F1']} style={s.modalHdr}>
            <Text style={s.modalTitle}>Add Ward</Text>
            <Pressable onPress={() => setShowAddWardModal(false)} style={s.closeBtn}><Feather name="x" size={19} color="#fff" /></Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {[
              { label: 'Ward Number *', key: 'wardNumber', placeholder: '1', keyboard: 'numeric' },
              { label: 'Ward Name *', key: 'name', placeholder: 'Ward 1 Central' },
              { label: 'Area / Locality', key: 'area', placeholder: 'Station Road Area' },
            ].map(f => (
              <View key={f.key}>
                <Text style={[s.fieldLabel, { color: MUTED }]}>{f.label}</Text>
                <TextInput
                  style={[s.fieldInput, { backgroundColor: GLASS, borderColor: GLASS_BD, color: TEXT }]}
                  placeholder={f.placeholder} placeholderTextColor={MUTED2}
                  value={(wardForm as any)[f.key]}
                  onChangeText={v => setWardForm(p => ({ ...p, [f.key]: v }))}
                  keyboardType={f.keyboard as any}
                />
              </View>
            ))}
            <TouchableOpacity onPress={handleAddWard} disabled={saving} activeOpacity={0.85}>
              <LinearGradient colors={['#4F46E5','#6366F1']} style={s.saveBtn}>
                <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Create Ward'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Ward Modal */}
      <Modal visible={showEditWardModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <LinearGradient colors={['#4F46E5','#6366F1']} style={s.modalHdr}>
            <Text style={s.modalTitle}>Edit Ward</Text>
            <Pressable onPress={() => setShowEditWardModal(false)} style={s.closeBtn}><Feather name="x" size={19} color="#fff" /></Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {[
              { label: 'Ward Name *', key: 'name', placeholder: 'Ward 1 Central' },
              { label: 'Area / Locality', key: 'area', placeholder: 'Station Road Area' },
            ].map(f => (
              <View key={f.key}>
                <Text style={[s.fieldLabel, { color: MUTED }]}>{f.label}</Text>
                <TextInput
                  style={[s.fieldInput, { backgroundColor: GLASS, borderColor: GLASS_BD, color: TEXT }]}
                  placeholder={f.placeholder} placeholderTextColor={MUTED2}
                  value={(editWardForm as any)[f.key]}
                  onChangeText={v => setEditWardForm(p => ({ ...p, [f.key]: v }))}
                />
              </View>
            ))}
            <TouchableOpacity onPress={handleSaveEditWard} disabled={saving} activeOpacity={0.85}>
              <LinearGradient colors={['#4F46E5','#6366F1']} style={s.saveBtn}>
                <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Worker Assignment Modal */}
      <Modal visible={showWorkerModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <LinearGradient colors={['#7C3AED','#4F46E5']} style={s.modalHdr}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalTitle}>Assign Workers</Text>
              <Text style={s.modalSub}>Ward {workerModalWard?.wardNumber} — {workerModalWard?.name}</Text>
            </View>
            <Pressable onPress={() => setShowWorkerModal(false)} style={s.closeBtn}><Feather name="x" size={19} color="#fff" /></Pressable>
          </LinearGradient>
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <View style={s.searchBox}>
              <Feather name="search" size={14} color={MUTED} />
              <TextInput style={[s.searchInput, { color: TEXT }]} placeholder="Search workers…" placeholderTextColor={MUTED2} value={workerSearch} onChangeText={setWorkerSearch} />
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {safaikarmis
              .filter(u => !workerSearch || u.name?.toLowerCase().includes(workerSearch.toLowerCase()))
              .map(u => {
                const assigned = workerModalWard?.assignedWorkers.includes(u.id) ?? false;
                return (
                  <TouchableOpacity key={u.id} style={[s.workerRow, { borderColor: assigned ? '#10B98135' : GLASS_BD }]} onPress={() => assigned ? handleRemoveWorker(u.id) : handleAssignWorker(u.id)} activeOpacity={0.85} disabled={savingWorker}>
                    {assigned && <LinearGradient colors={['#10B98112','#05966908']} style={StyleSheet.absoluteFill} />}
                    <LinearGradient colors={assigned ? ['#10B981','#059669'] : ['#374151','#1F2937']} style={s.workerAvatar}>
                      <Text style={s.workerAvatarText}>{u.name?.[0]?.toUpperCase() ?? '?'}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.workerName, { color: TEXT }]}>{u.name}</Text>
                      <Text style={[s.workerRole, { color: MUTED }]}>Safai Karmi</Text>
                    </View>
                    {assigned
                      ? <View style={s.assignedBadge}><Feather name="check" size={11} color="#10B981" /><Text style={s.assignedText}>Assigned</Text></View>
                      : <View style={s.unassignedBadge}><Feather name="plus" size={11} color={MUTED} /><Text style={s.unassignedText}>Assign</Text></View>
                    }
                  </TouchableOpacity>
                );
              })}
            {safaikarmis.length === 0 && (
              <View style={s.emptyCard}>
                <Feather name="users" size={28} color={MUTED2} />
                <Text style={[s.emptyTitle, { color: TEXT }]}>No Workers Found</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Move Houses Modal */}
      <Modal visible={showMoveModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <LinearGradient colors={['#4F46E5','#7C3AED']} style={s.modalHdr}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalTitle}>Move Houses</Text>
              <Text style={s.modalSub}>{selectedHouseIds.length} house(s) selected</Text>
            </View>
            <Pressable onPress={() => setShowMoveModal(false)} style={s.closeBtn}><Feather name="x" size={19} color="#fff" /></Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            <View>
              <Text style={[s.fieldLabel, { color: MUTED, marginBottom: 10 }]}>Select Ward</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {wards.map((w, idx) => {
                  const grad = WARD_GRADS[idx % WARD_GRADS.length];
                  const active = moveWardId === w.id;
                  return (
                    <TouchableOpacity key={w.id} onPress={() => { setMoveWardId(w.id); setMoveGroupId(null); }}>
                      {active
                        ? <LinearGradient colors={grad} style={s.wardPillActive}><Text style={s.wardPillActiveText}>Ward {w.wardNumber}</Text></LinearGradient>
                        : <View style={s.wardPill}><Text style={[s.wardPillText, { color: MUTED }]}>Ward {w.wardNumber}</Text></View>
                      }
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <View>
              <Text style={[s.fieldLabel, { color: MUTED, marginBottom: 10 }]}>Select Group (optional)</Text>
              <TouchableOpacity style={[s.moveGroupRow, { borderColor: moveGroupId === null ? '#6366F150' : GLASS_BD, backgroundColor: moveGroupId === null ? '#6366F112' : GLASS }]} onPress={() => setMoveGroupId(null)} activeOpacity={0.8}>
                <Text style={[s.moveGroupName, { color: moveGroupId === null ? '#6366F1' : MUTED }]}>Ungrouped (no group)</Text>
                {moveGroupId === null && <Feather name="check" size={14} color="#6366F1" />}
              </TouchableOpacity>
              {groups.filter(g => !moveWardId || wards.find(w => w.id === moveWardId)).map((g, idx) => {
                const color = g.color || GROUP_COLORS[idx % GROUP_COLORS.length];
                return (
                  <TouchableOpacity key={g.id} style={[s.moveGroupRow, { borderColor: moveGroupId === g.id ? color + '50' : GLASS_BD, backgroundColor: moveGroupId === g.id ? color + '12' : GLASS, marginTop: 8 }]} onPress={() => setMoveGroupId(g.id)} activeOpacity={0.8}>
                    <View style={[s.groupDot, { backgroundColor: color }]} />
                    <Text style={[s.moveGroupName, { color: moveGroupId === g.id ? color : TEXT }]}>{g.name}</Text>
                    {moveGroupId === g.id && <Feather name="check" size={14} color={color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={handleMoveHouses} disabled={saving} activeOpacity={0.85}>
              <LinearGradient colors={['#4F46E5','#7C3AED']} style={s.saveBtn}>
                <Text style={s.saveBtnText}>{saving ? 'Moving…' : `Move ${selectedHouseIds.length} Houses`}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── House Detail Modal ────────────────────────────────────────── */}
      <Modal visible={!!detailHouse} animationType="slide" presentationStyle="pageSheet"
        onDismiss={() => setActivePanel(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#070C1A' }}>
          {detailHouse && (
            <>
              {/* ── Hero header ── */}
              <LinearGradient colors={['#1E1B4B','#0F172A']} style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <LinearGradient colors={['#6366F1','#8B5CF6']} style={{ width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                      <Feather name="home" size={20} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#C4B5FD', fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                        {detailHouse.registrationNumber}
                      </Text>
                      <Text style={{ color: '#F0F4FF', fontSize: 17, fontFamily: 'Inter_700Bold' }} numberOfLines={1}>
                        {detailHouse.ownerName}
                      </Text>
                      {detailHouse.fatherOrHusband ? (
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 }}>
                          S/o D/o W/o {detailHouse.fatherOrHusband}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Pressable onPress={() => { setDetailHouse(null); setActivePanel(null); }}
                    style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                    <Feather name="x" size={16} color="#fff" />
                  </Pressable>
                </View>
                {/* Status + type badges */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: detailHouse.isActive ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)', borderWidth: 1, borderColor: detailHouse.isActive ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)' }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: detailHouse.isActive ? '#10B981' : '#EF4444' }} />
                    <Text style={{ color: detailHouse.isActive ? '#10B981' : '#EF4444', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                      {detailHouse.status || 'Active'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.30)' }}>
                    <Feather name="tag" size={10} color="#818CF8" />
                    <Text style={{ color: '#818CF8', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>{detailHouse.propertyType || 'Residential'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(14,165,233,0.15)', borderWidth: 1, borderColor: 'rgba(14,165,233,0.30)' }}>
                    <Feather name="map-pin" size={10} color="#38BDF8" />
                    <Text style={{ color: '#38BDF8', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Ward {detailHouse.wardNumber}</Text>
                  </View>
                </View>
              </LinearGradient>

              <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* ── 5-button action bar ── */}
                <View style={{ flexDirection: 'row', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 5 }}>
                  <TouchableOpacity style={{ flex: 2, borderRadius: 12, overflow: 'hidden' }}
                    onPress={() => { setDetailHouse(null); setActivePanel(null); openEditHouse(detailHouse); }} activeOpacity={0.85}>
                    <LinearGradient colors={['#2563EB','#1D4ED8']} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}>
                      <Feather name="edit-2" size={13} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' }}>Edit</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 2, borderRadius: 12, overflow: 'hidden' }}
                    onPress={() => { setDetailHouse(null); setActivePanel(null); handleDeleteHouse(detailHouse); }} activeOpacity={0.85}>
                    <LinearGradient colors={['#DC2626','#B91C1C']} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}>
                      <Feather name="trash-2" size={13} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' }}>Delete</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  {([
                    { key: 'garbage' as const, icon: 'trash-2' as const,      label: 'Garbage', color: '#10B981', bg: 'rgba(16,185,129,0.12)',  bd: 'rgba(16,185,129,0.28)' },
                    { key: 'complaints' as const, icon: 'alert-circle' as const, label: 'Complaint', color: '#F97316', bg: 'rgba(249,115,22,0.12)', bd: 'rgba(249,115,22,0.28)' },
                    { key: 'service' as const, icon: 'tool' as const,          label: 'Service',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', bd: 'rgba(139,92,246,0.28)' },
                  ] as const).map(btn => {
                    const active = activePanel === btn.key;
                    return (
                      <TouchableOpacity key={btn.key}
                        style={{ flex: 1, borderRadius: 12, backgroundColor: active ? btn.color + '25' : btn.bg, borderWidth: 1, borderColor: active ? btn.color + '60' : btn.bd, alignItems: 'center', justifyContent: 'center', paddingVertical: 7, gap: 2 }}
                        activeOpacity={0.75}
                        onPress={() => setActivePanel(active ? null : btn.key)}>
                        <Feather name={btn.icon} size={13} color={btn.color} />
                        <Text style={{ color: btn.color, fontSize: 7.5, fontFamily: 'Inter_600SemiBold', textAlign: 'center' }}>{btn.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ── Inline panel for secondary buttons ── */}
                {activePanel === 'garbage' && (
                  <View style={{ backgroundColor: 'rgba(16,185,129,0.07)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.22)', overflow: 'hidden' }}>
                    <LinearGradient colors={['rgba(16,185,129,0.18)','rgba(16,185,129,0.06)']} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(16,185,129,0.15)' }}>
                      <Feather name="trash-2" size={14} color="#10B981" />
                      <Text style={{ color: '#10B981', fontSize: 13, fontFamily: 'Inter_700Bold', flex: 1 }}>Garbage Collection</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>No data</Text>
                      </View>
                    </LinearGradient>
                    <View style={{ padding: 16, alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                        <Feather name="inbox" size={20} color="rgba(16,185,129,0.5)" />
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
                        No garbage collection records found{'\n'}for {detailHouse.registrationNumber}
                      </Text>
                    </View>
                  </View>
                )}

                {activePanel === 'complaints' && (
                  <View style={{ backgroundColor: 'rgba(249,115,22,0.07)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(249,115,22,0.22)', overflow: 'hidden' }}>
                    <LinearGradient colors={['rgba(249,115,22,0.18)','rgba(249,115,22,0.06)']} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(249,115,22,0.15)' }}>
                      <Feather name="alert-circle" size={14} color="#F97316" />
                      <Text style={{ color: '#F97316', fontSize: 13, fontFamily: 'Inter_700Bold', flex: 1 }}>Complaints</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>No data</Text>
                      </View>
                    </LinearGradient>
                    <View style={{ padding: 16, alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                        <Feather name="inbox" size={20} color="rgba(249,115,22,0.5)" />
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
                        No complaints registered{'\n'}from {detailHouse.registrationNumber}
                      </Text>
                    </View>
                  </View>
                )}

                {activePanel === 'service' && (
                  <View style={{ backgroundColor: 'rgba(139,92,246,0.07)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)', overflow: 'hidden' }}>
                    <LinearGradient colors={['rgba(139,92,246,0.18)','rgba(139,92,246,0.06)']} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(139,92,246,0.15)' }}>
                      <Feather name="tool" size={14} color="#8B5CF6" />
                      <Text style={{ color: '#8B5CF6', fontSize: 13, fontFamily: 'Inter_700Bold', flex: 1 }}>Service Requests</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>No data</Text>
                      </View>
                    </LinearGradient>
                    <View style={{ padding: 16, alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                        <Feather name="inbox" size={20} color="rgba(139,92,246,0.5)" />
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
                        No service requests found{'\n'}for {detailHouse.registrationNumber}
                      </Text>
                    </View>
                  </View>
                )}

                {/* ── House info card ── */}
                <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', overflow: 'hidden' }}>
                  {/* Section: Identity */}
                  <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
                    <Text style={{ color: '#818CF8', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Identity</Text>
                    {[
                      { icon: 'hash' as const,  label: 'Reg. No',      value: detailHouse.registrationNumber, color: '#C4B5FD' },
                      { icon: 'user' as const,  label: 'Owner',        value: detailHouse.ownerName,          color: TEXT },
                      { icon: 'users' as const, label: 'Father/Husb.', value: detailHouse.fatherOrHusband || '—', color: TEXT },
                      { icon: 'phone' as const, label: 'Mobile',       value: detailHouse.mobile || '—',      color: '#34D399' },
                    ].map((row, i, arr) => (
                      <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                          <Feather name={row.icon} size={12} color="#818CF8" />
                        </View>
                        <Text style={{ color: 'rgba(255,255,255,0.42)', fontSize: 11, fontFamily: 'Inter_500Medium', flex: 1 }}>{row.label}</Text>
                        <Text style={{ color: row.color, fontSize: 12, fontFamily: 'Inter_600SemiBold', maxWidth: '55%', textAlign: 'right' }} numberOfLines={1}>{row.value}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ height: 1, backgroundColor: 'rgba(99,102,241,0.15)', marginHorizontal: 14 }} />

                  {/* Section: Location */}
                  <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
                    <Text style={{ color: '#38BDF8', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Location</Text>
                    {[
                      { icon: 'map-pin' as const, label: 'Ward',    value: `Ward ${detailHouse.wardNumber}` },
                      { icon: 'layers' as const,  label: 'Group',   value: detailHouse.groupName || 'Ungrouped' },
                      { icon: 'home' as const,    label: 'Address', value: detailHouse.address },
                    ].map((row, i, arr) => (
                      <View key={row.label} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(14,165,233,0.10)', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 1 }}>
                          <Feather name={row.icon} size={12} color="#38BDF8" />
                        </View>
                        <Text style={{ color: 'rgba(255,255,255,0.42)', fontSize: 11, fontFamily: 'Inter_500Medium', flex: 1 }}>{row.label}</Text>
                        <Text style={{ color: TEXT, fontSize: 12, fontFamily: 'Inter_600SemiBold', maxWidth: '55%', textAlign: 'right' }}>{row.value}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ height: 1, backgroundColor: 'rgba(14,165,233,0.15)', marginHorizontal: 14 }} />

                  {/* Section: Meta */}
                  <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12 }}>
                    <Text style={{ color: '#F59E0B', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Property Info</Text>
                    {[
                      { icon: 'tag' as const,      label: 'Property Type', value: detailHouse.propertyType || 'Residential' },
                      { icon: 'calendar' as const, label: 'Added On',      value: detailHouse.createdAt || '—' },
                    ].map((row, i, arr) => (
                      <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.10)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                          <Feather name={row.icon} size={12} color="#F59E0B" />
                        </View>
                        <Text style={{ color: 'rgba(255,255,255,0.42)', fontSize: 11, fontFamily: 'Inter_500Medium', flex: 1 }}>{row.label}</Text>
                        <Text style={{ color: TEXT, fontSize: 12, fontFamily: 'Inter_600SemiBold', maxWidth: '55%', textAlign: 'right' }}>{row.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>

              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Export Modal */}
      <Modal visible={showExportModal} animationType="fade" transparent>
        <View style={s.exportOverlay}>
          <View style={s.exportSheet}>
            <LinearGradient colors={['#4F46E5','#7C3AED']} style={s.exportHeader}>
              <View style={s.exportHeaderRow}>
                <LinearGradient colors={['rgba(255,255,255,0.2)','rgba(255,255,255,0.1)']} style={s.exportHeaderIcon}>
                  <Feather name="download-cloud" size={20} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.exportTitle}>Export CSV</Text>
                  <Text style={s.exportSub}>House Database</Text>
                </View>
                <Pressable onPress={() => setShowExportModal(false)} style={s.closeBtn}>
                  <Feather name="x" size={17} color="#fff" />
                </Pressable>
              </View>
            </LinearGradient>
            <View style={{ padding: 20, gap: 16 }}>
              <View style={[s.exportScopeBox]}>
                <Text style={[s.exportScopeLabel, { color: MUTED }]}>Exporting from</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Feather name="map-pin" size={12} color="#6366F1" />
                  <Text style={[s.exportScopeValue, { color: TEXT }]}>Ward {selectedWard?.wardNumber} — {selectedWard?.name}</Text>
                </View>
                {selectedGroup && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Feather name="layers" size={12} color="#10B981" />
                    <Text style={[s.exportScopeValue, { color: TEXT }]}>{selectedGroup.name}</Text>
                  </View>
                )}
                <View style={[s.exportCountBadge, { marginTop: 10 }]}>
                  <Feather name="home" size={12} color="#6366F1" />
                  <Text style={[s.exportCountText, { color: TEXT }]}>{houseList.length} houses will be exported</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleExportCSV} disabled={exporting} activeOpacity={0.85}>
                <LinearGradient colors={['#4F46E5','#7C3AED']} style={s.saveBtn}>
                  {exporting ? <ActivityIndicator size={16} color="#fff" /> : (
                    <>
                      <Feather name="download-cloud" size={16} color="#fff" />
                      <Text style={s.saveBtnText}>Export CSV</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // Header
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  superBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,215,0,0.12)', borderColor: 'rgba(255,215,0,0.25)', borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  superBadgeText: { color: '#FFD700', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  headerTitle: { color: '#F0F4FF', fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  syncWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  statRow: { flexDirection: 'row', gap: 10 },
  statPill: { flex: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 10, alignItems: 'center', gap: 4 },
  statNum: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'Inter_500Medium' },

  // Info bar (always visible at top of DB segment)
  infoBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(15,20,50,0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(99,102,241,0.18)', paddingHorizontal: 14, paddingVertical: 10 },
  infoBarStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoBarIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  infoBarNum: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#818CF8' },
  infoBarLbl: { fontSize: 9, fontFamily: 'Inter_500Medium', color: MUTED, marginTop: 1 },
  infoBarDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.09)' },
  infoBarSync: { alignItems: 'center', justifyContent: 'center' },
  infoBarSyncDot: { width: 8, height: 8, borderRadius: 4 },
  infoBarSyncTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  // Segment bar
  segBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8 },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, margin: 6, borderWidth: 1, borderColor: 'transparent', position: 'relative' },
  segLabel: { fontSize: 13 },
  segUnderline: { position: 'absolute', bottom: -7, left: 16, right: 16, height: 2, borderRadius: 1 },

  // Breadcrumb
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  breadLink: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  breadCur: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#6366F110', borderWidth: 1, borderColor: '#6366F125' },
  backBtnText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  // Section label
  sectionLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#818CF8', letterSpacing: 0.5 },

  // Action chips
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  actionChipText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  // DB search bar
  dbSearchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  dbSearchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GLASS, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: GLASS_BD },
  dbSearchInput: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', padding: 0 },
  addWardBtn: { },
  addWardBtnGrad: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  // Search result cards
  searchResultCard: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  searchResultLeft: { flex: 1, gap: 2 },

  // Ward cards
  wardCard: { borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  wardAccentBar: { width: 4, alignSelf: 'stretch' },
  wardRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 10, paddingVertical: 11, paddingRight: 4 },
  wardBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  wardBadgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  wardName: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  wardArea: { fontSize: 8, fontFamily: 'Inter_400Regular' },
  wardMetaRow: { flexDirection: 'row', gap: 6 },
  wardActions: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 6 },
  wardActionsCol: { flexDirection: 'column', alignItems: 'center', gap: 3, paddingRight: 7, paddingVertical: 7 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, backgroundColor: 'rgba(255,255,255,0.06)' },
  metaText: { fontSize: 7, fontFamily: 'Inter_600SemiBold' },
  iconBtn: { width: 20, height: 20, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

  // Group views
  allHousesCard: { borderRadius: 16, borderWidth: 1, borderColor: '#6366F135', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  groupCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  groupAccentBar: { width: 4, alignSelf: 'stretch' },
  groupCardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 12, paddingVertical: 14, paddingRight: 6 },
  groupIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  groupDot: { width: 12, height: 12, borderRadius: 6 },
  groupName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  groupDesc: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  countBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  addHouseChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#6366F118', borderWidth: 1, borderColor: '#6366F130' },
  addHouseChipText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#6366F1' },
  crossBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F9731612', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#F9731630' },
  crossBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#F97316' },
  addGroupBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  addGroupBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  addGroupBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },

  // Houses view
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GLASS, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: GLASS_BD },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', padding: 0 },
  exportBtn: { },
  exportBtnGrad: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  colHeader: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  colCell: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  colDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 8 },
  selBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(99,102,241,0.08)', borderBottomWidth: 1, borderBottomColor: 'rgba(99,102,241,0.15)' },
  selBarCancel: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center' },
  selBarCount: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  selAction: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  selActionText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  houseCard: { borderRadius: 16, borderWidth: 1, borderColor: GLASS_BD, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: GLASS },
  houseCardLeft: { },
  houseNumBox: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(99,102,241,0.15)', justifyContent: 'center', alignItems: 'center' },
  houseNumText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#818CF8' },
  houseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  houseIdx: { fontSize: 12, fontFamily: 'Inter_500Medium', color: MUTED, textAlign: 'center' },
  houseCellFlex: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  regDot: { width: 6, height: 6, borderRadius: 3 },
  regText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  ownerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  houseDetail: { backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', padding: 16, gap: 10 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  detailTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  detailAction: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  detailCard: { backgroundColor: GLASS, borderRadius: 16, borderWidth: 1, borderColor: GLASS_BD, padding: 16, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  detailLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  detailIconBox: { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.15)', justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  detailValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'right' },
  fab: { position: 'absolute', bottom: 24, right: 20 },
  fabGrad: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },

  // Groups segment
  wardPillBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
  wardPillLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginRight: 2 },
  wardPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: GLASS_BD, backgroundColor: GLASS },
  wardPillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  wardPillActive: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  wardPillActiveText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  grpGroupCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 14, paddingVertical: 14 },
  grpColorBar: { width: 4, alignSelf: 'stretch' },
  grpHousesHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
  grpBackBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#6366F110', borderWidth: 1, borderColor: '#6366F125', justifyContent: 'center', alignItems: 'center' },
  groupChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  groupChipDot: { width: 8, height: 8, borderRadius: 4 },
  groupChipText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  grpHouseCount: { marginLeft: 'auto', fontSize: 12, fontFamily: 'Inter_500Medium' },
  grpSelBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 14, marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: '#4F46E525', backgroundColor: '#4F46E50A', padding: 10 },
  grpSelectAll: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grpSelectAllText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#818CF8' },
  grpSelCount: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#818CF8' },
  grpHouseCard: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', backgroundColor: GLASS },
  groupSmallChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  grpSmallChipText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  grpSelectCard: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  grpColorDot: { width: 12, height: 12, borderRadius: 6 },

  // Empty states
  globalResultCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: GLASS, borderRadius: 12, borderWidth: 1, borderColor: GLASS_BD, paddingHorizontal: 12, paddingVertical: 10 },
  globalResultDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' },
  emptyCard: { borderRadius: 18, borderWidth: 1, borderColor: GLASS_BD, padding: 36, alignItems: 'center', gap: 12, backgroundColor: GLASS },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 40 },
  emptyIcon: { width: 70, height: 70, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  // Modals
  modalHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 24 },
  modalTitle: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  // Forms
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  fieldInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },
  typePill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, backgroundColor: GLASS },
  typePillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  saveBtn: { borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

  // Worker modal
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, overflow: 'hidden', backgroundColor: GLASS },
  workerAvatar: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  workerAvatarText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  workerName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  workerRole: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  assignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#10B98115', borderWidth: 1, borderColor: '#10B98130' },
  assignedText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#10B981' },
  unassignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: GLASS, borderWidth: 1, borderColor: GLASS_BD },
  unassignedText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: MUTED },

  // Move modal
  moveGroupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  moveGroupName: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  // Export modal
  exportOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  exportSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', backgroundColor: '#0D1535', borderWidth: 1, borderColor: GLASS_BD },
  exportHeader: { padding: 20 },
  exportHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exportHeaderIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  exportTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  exportSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  exportScopeBox: { backgroundColor: GLASS, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: GLASS_BD },
  exportScopeLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  exportScopeValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  exportCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6366F112', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#6366F125' },
  exportCountText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  // ── WhatsApp Community Style ─────────────────────────────────────────
  waHdr:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  waSubHdr:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  waHdrTitle:      { color: '#F0F4FF', fontSize: 19, fontFamily: 'Inter_700Bold' },
  waHdrSub:        { color: 'rgba(255,255,255,0.42)', fontSize: 11, fontFamily: 'Inter_400Regular' },
  waHdrBtn:        { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  waBackCircle:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(99,102,241,0.18)', justifyContent: 'center', alignItems: 'center' },
  waSyncDot:       { width: 7, height: 7, borderRadius: 4 },
  waSearchWrap:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginVertical: 9, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  waSearchIn:      { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', padding: 0 },
  waSecHdr:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 7 },
  waSecTxt:        { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#818CF8', letterSpacing: 0.8, textTransform: 'uppercase' },
  waCommRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 1 },
  waCommAvatar:    { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  waCommAvatarTxt: { color: '#fff', fontSize: 7, fontFamily: 'Inter_700Bold' },
  waListRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 7 },
  waListAvatar:    { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  waRowName:       { fontSize: 12, fontFamily: 'Inter_700Bold' },
  waRowSub:        { fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 1 },
  waSep:           { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 72 },
  waMiniStat:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waMiniStatTxt:   { fontSize: 10, fontFamily: 'Inter_500Medium' },
  waMiniBtn:       { width: 24, height: 24, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', justifyContent: 'center', alignItems: 'center' },
  waCountBubble:   { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  waCountBubbleTxt:{ fontSize: 12, fontFamily: 'Inter_700Bold' },
  waEmpty:         { alignItems: 'center', gap: 10, paddingTop: 60, paddingBottom: 40 },
  waEmptyT:        { fontSize: 16, fontFamily: 'Inter_700Bold' },
  waEmptyS:        { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', color: 'rgba(255,255,255,0.42)' },
  waHouseNum:      { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  waHouseNumTxt:   { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#818CF8' },
  waGrpDot:        { width: 8, height: 8, borderRadius: 4, marginRight: 2 },
});
