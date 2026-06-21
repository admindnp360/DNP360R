import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  icon: string;
  label: string;
  color?: string;
  bg?: string;
  onPress: () => void;
  size?: 'sm' | 'md';
}

export function QuickActionBtn({ icon, label, color, bg, onPress, size = 'md' }: Props) {
  const colors = useColors();
  const iconSize = size === 'sm' ? 18 : 22;
  const btnSize = size === 'sm' ? 44 : 52;
  return (
    <Pressable
      style={styles.wrap}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
    >
      <View style={[styles.btn, { width: btnSize, height: btnSize, borderRadius: btnSize / 4, backgroundColor: bg ?? colors.surface, borderColor: colors.border }]}>
        <Feather name={icon as any} size={iconSize} color={color ?? colors.primary} />
      </View>
      <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6, flex: 1 },
  btn: { justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  label: { fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center', lineHeight: 13 },
});
