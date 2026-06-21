import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={[styles.actionText, { color: colors.primary }]}>{actionLabel}</Text>
          <Feather name="chevron-right" size={14} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
