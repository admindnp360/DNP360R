import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { House } from '@/types';
import { useColors } from '@/hooks/useColors';

interface Props { house: House; compact?: boolean }

export function HouseCard({ house, compact }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
          <Feather name="home" size={18} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.reg, { color: colors.primary }]}>{house.registrationNumber}</Text>
          <Text style={[styles.owner, { color: colors.text }]}>{house.ownerName}</Text>
          {!compact && <Text style={[styles.address, { color: colors.mutedForeground }]} numberOfLines={1}>{house.address}</Text>}
        </View>
        <View style={[styles.ward, { backgroundColor: colors.surface }]}>
          <Text style={[styles.wardText, { color: colors.primary }]}>W-{house.wardNumber}</Text>
        </View>
      </View>
      {!compact && (
        <View style={[styles.mobile, { borderTopColor: colors.border }]}>
          <Feather name="phone" size={12} color={colors.mutedForeground} />
          <Text style={[styles.mobileText, { color: colors.mutedForeground }]}>{house.mobile}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 14, borderWidth: 1, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, gap: 2 },
  reg: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  owner: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  address: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  ward: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  wardText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  mobile: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 10, borderTopWidth: 1 },
  mobileText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
