import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Complaint } from '@/types';
import { COMPLAINT_CATEGORIES } from '@/types';
import { useColors } from '@/hooks/useColors';

interface Props {
  complaint: Complaint;
  onPress?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const STATUS_ICONS: Record<string, string> = {
  submitted: 'clock',
  assigned: 'user-check',
  in_progress: 'loader',
  resolved: 'check-circle',
};

export function ComplaintCard({ complaint, onPress }: Props) {
  const colors = useColors();

  const statusColor = {
    submitted: colors.submitted,
    assigned: colors.assigned,
    in_progress: colors.inProgress,
    resolved: colors.resolved,
  }[complaint.status];

  const statusBg = {
    submitted: colors.submittedBg,
    assigned: colors.assignedBg,
    in_progress: colors.inProgressBg,
    resolved: colors.resolvedBg,
  }[complaint.status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.category, { color: colors.text }]} numberOfLines={1}>
            {COMPLAINT_CATEGORIES[complaint.category]}
          </Text>
          <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
            {complaint.description}
          </Text>
          <Text style={[styles.location, { color: colors.mutedForeground }]} numberOfLines={1}>
            <Feather name="map-pin" size={11} /> {complaint.location}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Feather name={STATUS_ICONS[complaint.status] as any} size={12} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[complaint.status]}
          </Text>
        </View>
      </View>
      <Text style={[styles.date, { color: colors.mutedForeground }]}>{complaint.createdAt}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 14, borderWidth: 1, gap: 8 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  info: { flex: 1, gap: 3 },
  category: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  desc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  location: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, flexShrink: 0 },
  statusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  date: { fontSize: 10, fontFamily: 'Inter_400Regular' },
});
