import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/contexts/AlertContext';
import { useAppData } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import type { PasswordResetRequest, SecretKey } from '@/types';

type Tab = 'genkey' | 'notices' | 'resets';

const TAB_CONFIG = [
  { key: 'notices',  label: 'Notices',   icon: 'volume-2', grad: ['#0EA5E9', '#0284C7'] as const },
  { key: 'resets',   label: 'Resets',    icon: 'unlock',   grad: ['#F97316', '#EF4444'] as const },
  { key: 'genkey',   label: 'Gen. Key',  icon: 'key',      grad: ['#7C3AED', '#4F46E5'] as const },
] as const;

const PRIORITY_CONFIG = {
  high:   { grad: ['#FEF2F2', '#FEE2E2'] as const, text: '#DC2626', badge: '#DC2626', badgeBg: '#FEE2E2' },
  medium: { grad: ['#FFFBEB', '#FEF3C7'] as const, text: '#D97706', badge: '#D97706', badgeBg: '#FEF3C7' },
  low:    { grad: ['#F0FDF4', '#DCFCE7'] as const, text: '#16A34A', badge: '#16A34A', badgeBg: '#DCFCE7' },
};

export default function AdminManagement() {
  const {
    notices, passwordResetRequests, secretKeys,
    addNotice, deleteNotice,
    updatePasswordResetRequest,
    addSecretKey,
  } = useAppData();
  const { resetUserPassword } = useAuth();
  const colors = useColors();
  const [generating, setGenerating] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<SecretKey | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const GEN_ROLES = [
    { role: 'safaikarmi' as SecretKey['role'], label: 'Safai Karmi', desc: 'Field sanitation worker access key', icon: 'trash-2', grad: ['#10B981', '#059669'] as const },
    { role: 'official'   as SecretKey['role'], label: 'Official',    desc: 'Ward official access key',           icon: 'briefcase', grad: ['#0EA5E9', '#2563EB'] as const },
  ];

  const ROLE_GRADS: Record<string, readonly [string, string]> = {
    safaikarmi: ['#10B981', '#059669'],
    official:   ['#0EA5E9', '#2563EB'],
    admin:      ['#6366F1', '#8B5CF6'],
  };

  async function handleGenerate(role: SecretKey['role']) {
    setGenerating(role);
    try { setNewKey(await addSecretKey(role)); } finally { setGenerating(null); }
  }

  async function handleCopyCode(code: string) {
    await Clipboard.setStringAsync(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  }

  const latestKey = secretKeys.length > 0
    ? [...secretKeys].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    : null;

  const [tab, setTab] = useState<Tab>('notices');
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeType, setNoticeType] = useState<'notice' | 'announcement' | 'alert'>('notice');
  const [noticePriority, setNoticePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [saving, setSaving] = useState(false);

  const pendingResets = passwordResetRequests.filter(r => r.status === 'pending').length;
  const allResets = [...passwordResetRequests].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  async function handleAddNotice() {
    if (!noticeTitle.trim() || !noticeContent.trim()) { showAlert('Missing', 'Title and content required.', undefined, 'warning'); return; }
    setSaving(true);
    try {
      await addNotice({ title: noticeTitle.trim(), content: noticeContent.trim(), type: noticeType, priority: noticePriority, isActive: true });
      setShowNoticeModal(false); setNoticeTitle(''); setNoticeContent('');
      showAlert('Published', 'Notice is now visible to all citizens.', undefined, 'success');
    } finally { setSaving(false); }
  }

  function openApproveModal(req: PasswordResetRequest) { setSelectedRequest(req); setTempPassword(''); setAdminNote(''); setShowApproveModal(true); }

  async function handleApproveReset() {
    if (!selectedRequest) return;
    if (tempPassword.trim().length < 6) { showAlert('Too Short', 'Password must be at least 6 characters.', undefined, 'warning'); return; }
    setSaving(true);
    try {
      const ok = await resetUserPassword(selectedRequest.email, tempPassword.trim());
      if (!ok) { showAlert('Error', 'No user found with this email.', undefined, 'error'); return; }
      await updatePasswordResetRequest(selectedRequest.id, 'approved', adminNote.trim() || undefined);
      setShowApproveModal(false); setSelectedRequest(null); setTempPassword(''); setAdminNote('');
      showAlert('Approved', `Password reset for ${selectedRequest.name}. Temp password: ${tempPassword.trim()}. Contact them via registered mobile.`, undefined, 'success');
    } finally { setSaving(false); }
  }

  async function handleRejectReset(req: PasswordResetRequest) {
    showAlert('Reject Request', `Reject reset for ${req.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => updatePasswordResetRequest(req.id, 'rejected') },
    ], 'warning');
  }

  const { showAlert } = useAlert();

  const activeTab = TAB_CONFIG.find(t => t.key === tab)!;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>

      {/* Gradient Header */}
      <LinearGradient colors={activeTab.grad} style={styles.header}>
        <Text style={styles.headerTitle}>Management</Text>
        <Text style={styles.headerSub}>
          {tab === 'notices' ? `${notices.length} notices published`
            : tab === 'resets' ? `${pendingResets} pending request${pendingResets !== 1 ? 's' : ''}`
            : 'Generate & manage secret access keys'}
        </Text>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TAB_CONFIG.map(t => {
          const isActive = tab === t.key;
          const hasBadge = t.key === 'resets' && pendingResets > 0;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tabItem}
              onPress={() => setTab(t.key as Tab)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconWrap, isActive && { backgroundColor: t.grad[0] + '18' }]}>
                <Feather name={t.icon as any} size={16} color={isActive ? t.grad[0] : colors.mutedForeground} />
                {hasBadge && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{pendingResets}</Text></View>}
              </View>
              <Text style={[styles.tabLabel, { color: isActive ? t.grad[0] : colors.mutedForeground, fontFamily: isActive ? 'Inter_700Bold' : 'Inter_500Medium' }]}>
                {t.label}
              </Text>
              {isActive && <View style={[styles.tabUnderline, { backgroundColor: t.grad[0] }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── GEN KEY TAB ── */}
      {tab === 'genkey' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>

          {/* Header */}
          <View style={styles.gkTitleRow}>
            <LinearGradient colors={['#7C3AED','#4F46E5']} style={styles.gkTitleIcon}>
              <Feather name="key" size={16} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={[styles.gkTitle, { color: colors.text }]}>Generate Secret Key</Text>
              <Text style={[styles.gkSub, { color: colors.mutedForeground }]}>Issue unique access codes for staff</Text>
            </View>
          </View>

          {/* Two full-width role cards stacked */}
          {GEN_ROLES.map(item => {
            const isThis = generating === item.role;
            const isOther = generating !== null && generating !== item.role;
            return (
              <TouchableOpacity
                key={item.role}
                onPress={() => handleGenerate(item.role)}
                disabled={generating !== null}
                activeOpacity={0.88}
                style={isOther ? { opacity: 0.35 } : {}}
              >
                <LinearGradient colors={item.grad} style={styles.gkRoleCard}>
                  <View style={styles.gkRoleCardInner}>
                    <LinearGradient colors={['rgba(255,255,255,0.25)','rgba(255,255,255,0.08)']} style={styles.gkRoleIconBox}>
                      <Feather name={item.icon as any} size={24} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gkRoleName}>{item.label}</Text>
                      <Text style={styles.gkRoleDesc}>{item.desc}</Text>
                    </View>
                    <View style={styles.gkPlusBox}>
                      {isThis
                        ? <Feather name="loader" size={20} color="rgba(255,255,255,0.9)" />
                        : <Feather name="plus" size={22} color="rgba(255,255,255,0.9)" />}
                    </View>
                  </View>
                  <View style={styles.gkFormatRow}>
                    <Feather name="hash" size={10} color="rgba(255,255,255,0.55)" />
                    <Text style={styles.gkFormatTxt}>
                      {item.role === 'safaikarmi' ? 'Format: SK-XXXX-XXXX' : 'Format: OF-XXXX-XXXX'}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}

          {/* Latest generated key */}
          {latestKey && (
            <View style={[styles.gkLatestWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.gkLatestHdr}>
                <Feather name="clock" size={11} color={colors.mutedForeground} />
                <Text style={[styles.gkLatestLabel, { color: colors.mutedForeground }]}>Latest Generated</Text>
                <View style={[styles.gkRolePill, { backgroundColor: (ROLE_GRADS[latestKey.role]?.[0] ?? '#7C3AED') + '20' }]}>
                  <Text style={[styles.gkRolePillTxt, { color: ROLE_GRADS[latestKey.role]?.[0] ?? '#7C3AED' }]}>
                    {latestKey.role === 'safaikarmi' ? 'Safai Karmi' : 'Official'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleCopyCode(latestKey.code)}
              >
                <View style={[styles.gkLatestCodeRow, { borderColor: (ROLE_GRADS[latestKey.role]?.[0] ?? '#7C3AED') + '40', backgroundColor: (ROLE_GRADS[latestKey.role]?.[0] ?? '#7C3AED') + '10' }]}>
                  <Feather name="key" size={14} color={ROLE_GRADS[latestKey.role]?.[0] ?? '#7C3AED'} />
                  <Text style={[styles.gkLatestCode, { color: ROLE_GRADS[latestKey.role]?.[0] ?? '#7C3AED' }]} numberOfLines={1}>
                    {latestKey.code}
                  </Text>
                  <Feather name="copy" size={14} color={ROLE_GRADS[latestKey.role]?.[0] ?? '#7C3AED'} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.gkLatestDate, { color: colors.mutedForeground }]}>Created {latestKey.createdAt}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── NEW KEY MODAL ── */}
      <Modal visible={!!newKey} animationType="slide" transparent>
        <View style={styles.overlay}>
          <LinearGradient colors={['#08101F', '#0D1B4B']} style={styles.newKeySheet}>
            <View style={styles.celebRing}>
              <LinearGradient colors={ROLE_GRADS[newKey?.role ?? 'safaikarmi']} style={styles.celebGrad}>
                <Feather name="key" size={30} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.celebTitle}>Key Generated!</Text>
            <Text style={[styles.celebRole, { color: 'rgba(255,255,255,0.6)' }]}>
              {newKey?.role === 'safaikarmi' ? 'Safai Karmi' : 'Official'} Access Code
            </Text>

            {/* Tap-to-copy single-line code */}
            <TouchableOpacity activeOpacity={0.85} onPress={() => newKey && handleCopyCode(newKey.code)} style={{ width: '100%' }}>
              <LinearGradient
                colors={codeCopied ? ['#10B981','#059669'] : ROLE_GRADS[newKey?.role ?? 'safaikarmi']}
                style={styles.codeReveal}
              >
                <Feather name={codeCopied ? 'check' : 'key'} size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.codeRevealText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {codeCopied ? 'Copied!' : newKey?.code}
                </Text>
                {!codeCopied && <Feather name="copy" size={16} color="rgba(255,255,255,0.7)" />}
              </LinearGradient>
            </TouchableOpacity>

            <View style={[styles.celebNote, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.09)' }]}>
              <Feather name="alert-circle" size={12} color="rgba(255,255,255,0.45)" />
              <Text style={styles.celebNoteText}>Share this code securely. It will not be shown again after closing.</Text>
            </View>
            <TouchableOpacity onPress={() => { setNewKey(null); setCodeCopied(false); }} activeOpacity={0.85}>
              <LinearGradient colors={ROLE_GRADS[newKey?.role ?? 'safaikarmi']} style={styles.celebDoneBtn}>
                <Text style={styles.celebDoneText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* ── NOTICES TAB ── */}
      {tab === 'notices' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 110 }}>
          <TouchableOpacity style={styles.publishBtn} onPress={() => setShowNoticeModal(true)} activeOpacity={0.85}>
            <LinearGradient colors={['#0EA5E9', '#0284C7']} style={styles.publishBtnGrad}>
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.publishBtnText}>Publish New Notice</Text>
            </LinearGradient>
          </TouchableOpacity>

          {notices.map(n => {
            const pc = PRIORITY_CONFIG[n.priority];
            return (
              <View key={n.id} style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.noticePriorityBar, { backgroundColor: pc.badge }]} />
                <View style={styles.noticeCardContent}>
                  <View style={styles.noticeTop}>
                    <View style={[styles.priorityChip, { backgroundColor: pc.badgeBg }]}>
                      <Feather name={n.priority === 'high' ? 'alert-triangle' : n.priority === 'medium' ? 'alert-circle' : 'info'} size={10} color={pc.badge} />
                      <Text style={[styles.priorityChipText, { color: pc.badge }]}>{n.priority.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.typeChip, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.typeChipText, { color: colors.mutedForeground }]}>{n.type}</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                      onPress={() => showAlert('Delete?', n.title, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteNotice(n.id) }], 'error')}
                      style={styles.deleteBtn}
                    >
                      <Feather name="trash-2" size={15} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.noticeTitle, { color: colors.text }]}>{n.title}</Text>
                  <Text style={[styles.noticeContent, { color: colors.mutedForeground }]} numberOfLines={2}>{n.content}</Text>
                  <View style={styles.noticeFooter}>
                    <Feather name="calendar" size={10} color={colors.mutedForeground} />
                    <Text style={[styles.noticeDate, { color: colors.mutedForeground }]}>{n.createdAt}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {notices.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="volume-x" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notices Yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Publish your first notice above</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── RESETS TAB ── */}
      {tab === 'resets' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 110 }}>
          <View style={[styles.infoBox, { backgroundColor: '#FFF7ED', borderColor: '#F9731640' }]}>
            <LinearGradient colors={['#F97316', '#EF4444']} style={styles.infoIcon}>
              <Feather name="unlock" size={14} color="#fff" />
            </LinearGradient>
            <Text style={styles.infoText}>
              Users who forgot their password appear here. Set a temporary password and share it via their registered mobile number.
            </Text>
          </View>

          {pendingResets > 0 && (
            <View style={styles.pendingHeader}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingLabel}>Pending Review ({pendingResets})</Text>
            </View>
          )}

          {allResets.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.emptyIcon}>
                <Feather name="check" size={22} color="#fff" />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No password reset requests yet</Text>
            </View>
          ) : (
            allResets.map(req => {
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';
              const statusColor = isApproved ? '#10B981' : isPending ? '#F97316' : '#EF4444';
              const statusBg = isApproved ? '#ECFDF5' : isPending ? '#FFF7ED' : '#FEF2F2';
              return (
                <View key={req.id} style={[styles.resetCard, { backgroundColor: colors.card, borderColor: isPending ? '#F9731640' : colors.border }]}>
                  {isPending && <View style={styles.resetUrgentBar} />}
                  <View style={styles.resetCardInner}>
                    <LinearGradient colors={isPending ? ['#F97316', '#EF4444'] : isApproved ? ['#10B981', '#059669'] : ['#9CA3AF', '#6B7280']} style={styles.resetAvatar}>
                      <Text style={styles.resetAvatarLetter}>{req.name[0]?.toUpperCase()}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resetName, { color: colors.text }]}>{req.name}</Text>
                      <Text style={[styles.resetEmail, { color: colors.mutedForeground }]} numberOfLines={1}>{req.email}</Text>
                      <View style={styles.resetMeta}>
                        <Feather name="clock" size={10} color={colors.mutedForeground} />
                        <Text style={[styles.resetDate, { color: colors.mutedForeground }]}>{req.requestedAt}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>{req.status}</Text>
                    </View>
                  </View>

                  {isPending && (
                    <View style={[styles.resetActions, { borderTopColor: colors.border }]}>
                      <TouchableOpacity style={[styles.rejectBtn, { borderColor: '#EF4444' }]} onPress={() => handleRejectReset(req)} activeOpacity={0.8}>
                        <Feather name="x" size={14} color="#EF4444" />
                        <Text style={[styles.rejectBtnText, { color: '#EF4444' }]}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => openApproveModal(req)} activeOpacity={0.85}>
                        <LinearGradient colors={['#10B981', '#059669']} style={styles.approveBtnGrad}>
                          <Feather name="check" size={14} color="#fff" />
                          <Text style={styles.approveBtnText}>Approve & Set Password</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── NOTICE MODAL ── */}
      <Modal visible={showNoticeModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <LinearGradient colors={['#0EA5E9', '#0284C7']} style={styles.modalHdr}>
            <Text style={styles.modalHdrTitle}>New Notice</Text>
            <Pressable style={styles.closeBtn} onPress={() => setShowNoticeModal(false)}>
              <Feather name="x" size={20} color="#fff" />
            </Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Type</Text>
            <View style={styles.chipRow}>
              {(['notice', 'announcement', 'alert'] as const).map(t => (
                <Pressable key={t} style={[styles.chip, { borderColor: noticeType === t ? '#0EA5E9' : colors.border, backgroundColor: noticeType === t ? '#0EA5E915' : colors.card }]} onPress={() => setNoticeType(t)}>
                  <Text style={[styles.chipText, { color: noticeType === t ? '#0EA5E9' : colors.mutedForeground }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Priority</Text>
            <View style={styles.chipRow}>
              {(['low', 'medium', 'high'] as const).map(p => {
                const pc = PRIORITY_CONFIG[p];
                return (
                  <Pressable key={p} style={[styles.chip, { borderColor: noticePriority === p ? pc.badge : colors.border, backgroundColor: noticePriority === p ? pc.badgeBg : colors.card }]} onPress={() => setNoticePriority(p)}>
                    <Text style={[styles.chipText, { color: noticePriority === p ? pc.badge : colors.mutedForeground }]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Title *</Text>
            <TextInput style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="Notice title…" placeholderTextColor={colors.mutedForeground} value={noticeTitle} onChangeText={setNoticeTitle} />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Content *</Text>
            <TextInput style={[styles.textarea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="Write content…" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={5} value={noticeContent} onChangeText={setNoticeContent} textAlignVertical="top" />
            <TouchableOpacity onPress={handleAddNotice} disabled={saving} activeOpacity={0.85} style={saving ? { opacity: 0.6 } : {}}>
              <LinearGradient colors={['#0EA5E9', '#0284C7']} style={styles.submitBtn}>
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>{saving ? 'Publishing…' : 'Publish Notice'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── APPROVE RESET MODAL ── */}
      <Modal visible={showApproveModal && !!selectedRequest} animationType="slide" presentationStyle="pageSheet">
        {selectedRequest && (
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient colors={['#F97316', '#EF4444']} style={styles.modalHdr}>
              <Text style={styles.modalHdrTitle}>Approve Reset</Text>
              <Pressable style={styles.closeBtn} onPress={() => { setShowApproveModal(false); setSelectedRequest(null); }}>
                <Feather name="x" size={20} color="#fff" />
              </Pressable>
            </LinearGradient>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
              <View style={[styles.requestPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <LinearGradient colors={['#F97316', '#EF4444']} style={styles.requestAvatar}>
                  <Text style={styles.requestAvatarLetter}>{selectedRequest.name[0]?.toUpperCase()}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.requestName, { color: colors.text }]}>{selectedRequest.name}</Text>
                  <Text style={[styles.requestEmail, { color: colors.mutedForeground }]}>{selectedRequest.email}</Text>
                </View>
              </View>
              <View style={[styles.infoBox, { backgroundColor: '#FFF7ED', borderColor: '#F9731640' }]}>
                <Feather name="info" size={14} color="#F97316" />
                <Text style={[styles.infoText, { color: '#92400E' }]}>Set a temporary password and share it with the user via their registered mobile number. They should change it after logging in.</Text>
              </View>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Temporary Password *</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="Min. 6 characters" placeholderTextColor={colors.mutedForeground}
                value={tempPassword} onChangeText={setTempPassword} autoCapitalize="none"
              />
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Note to User (optional)</Text>
              <TextInput
                style={[styles.textarea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="e.g. Contact office if you need help…" placeholderTextColor={colors.mutedForeground}
                value={adminNote} onChangeText={setAdminNote} multiline numberOfLines={3} textAlignVertical="top"
              />
              <TouchableOpacity onPress={handleApproveReset} disabled={saving} activeOpacity={0.85} style={saving ? { opacity: 0.6 } : {}}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.submitBtn}>
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>{saving ? 'Processing…' : 'Confirm & Reset Password'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => { setShowApproveModal(false); setSelectedRequest(null); }} activeOpacity={0.8}>
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 16, paddingBottom: 22, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 26, fontFamily: 'Inter_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3, position: 'relative' },
  tabIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  tabBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  tabLabel: { fontSize: 11 },
  tabUnderline: { position: 'absolute', bottom: 0, left: 12, right: 12, height: 2.5, borderTopLeftRadius: 2, borderTopRightRadius: 2 },

  publishBtn: { borderRadius: 14, overflow: 'hidden' },
  publishBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  publishBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

  noticeCard: { borderRadius: 14, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  noticePriorityBar: { width: 4 },
  noticeCardContent: { flex: 1, padding: 13, gap: 6 },
  noticeTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  priorityChipText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  typeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  typeChipText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  deleteBtn: { padding: 4 },
  noticeTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  noticeContent: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  noticeFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  noticeDate: { fontSize: 10, fontFamily: 'Inter_400Regular' },

  infoBox: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'flex-start' },
  infoIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', lineHeight: 18, color: '#92400E' },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316' },
  pendingLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#F97316' },

  resetCard: { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden' },
  resetUrgentBar: { height: 3, backgroundColor: '#F97316' },
  resetCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  resetAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  resetAvatarLetter: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  resetName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  resetEmail: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  resetMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  resetDate: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  resetActions: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, paddingVertical: 10 },
  rejectBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  approveBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  approveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  approveBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 36, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  modalHdrTitle: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  fieldInput: { borderRadius: 12, borderWidth: 1, padding: 13, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 120 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  submitBtn: { borderRadius: 14, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  cancelBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },

  requestPreview: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  requestAvatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  requestAvatarLetter: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  requestName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  requestEmail: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },

  genCard: { borderRadius: 20, padding: 18, gap: 16 },
  genCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  genCardIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  genCardTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  genCardSub: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  genBtnRow: { flexDirection: 'row', gap: 8 },
  genBtnWrap: { flex: 1 },
  genBtn: { borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  genBtnText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  genLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  genLoadingText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Inter_400Regular' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  newKeySheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 16, alignItems: 'center' },
  celebRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  celebGrad: { width: 74, height: 74, borderRadius: 37, justifyContent: 'center', alignItems: 'center' },
  celebTitle: { color: '#fff', fontSize: 26, fontFamily: 'Inter_700Bold' },
  celebRole: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  codeReveal: { borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 18, alignSelf: 'stretch', justifyContent: 'center' },
  codeRevealText: { color: '#fff', fontSize: 30, fontFamily: 'Inter_700Bold', letterSpacing: 4 },
  celebNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, alignSelf: 'stretch' },
  celebNoteText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18 },
  celebDoneBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 60 },
  celebDoneText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
