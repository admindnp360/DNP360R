import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Notice } from '@/types';
import { useColors } from '@/hooks/useColors';

interface Props { notice: Notice }

const TYPE_META: Record<string, { icon: string; label: string }> = {
  notice: { icon: 'file-text', label: 'Notice' },
  announcement: { icon: 'volume-2', label: 'Announcement' },
  alert: { icon: 'alert-triangle', label: 'Alert' },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#BA1A1A', medium: '#904D00', low: '#005AB6',
};

export function NoticeCard({ notice }: Props) {
  const colors = useColors();
  const meta = TYPE_META[notice.type];
  const priorityColor = PRIORITY_COLORS[notice.priority];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: priorityColor }]}>
      <View style={styles.header}>
        <View style={styles.typeRow}>
          <Feather name={meta.icon as any} size={13} color={priorityColor} />
          <Text style={[styles.type, { color: priorityColor }]}>{meta.label}</Text>
        </View>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{notice.createdAt}</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{notice.title}</Text>
      <Text style={[styles.content, { color: colors.mutedForeground }]} numberOfLines={3}>{notice.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 14, borderWidth: 1, borderLeftWidth: 4, gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  type: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  date: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  title: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  content: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
});
