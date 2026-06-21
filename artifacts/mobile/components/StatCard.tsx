import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  label: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  badge?: string;
  badgeColor?: string;
  accentLeft?: string;
}

export function StatCard({ label, value, icon, iconColor, iconBg, badge, badgeColor, accentLeft }: Props) {
  const colors = useColors();
  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.card, borderColor: colors.border },
      accentLeft ? { borderLeftWidth: 4, borderLeftColor: accentLeft } : {},
    ]}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg ?? colors.surface }]}>
          <Feather name={icon as any} size={18} color={iconColor ?? colors.primary} />
        </View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badgeColor ?? colors.primary }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  value: { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 32 },
  label: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
