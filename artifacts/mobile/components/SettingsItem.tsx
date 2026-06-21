import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  iconColor?: string;
  danger?: boolean;
  last?: boolean;
}

export function SettingsItem({ icon, label, subtitle, onPress, toggle, toggleValue, onToggle, iconColor, danger, last }: Props) {
  const colors = useColors();
  const labelColor = danger ? colors.destructive : colors.text;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.border, borderBottomWidth: last ? 0 : 1, opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
      disabled={toggle}
    >
      <View style={[styles.icon, { backgroundColor: iconColor ? iconColor + '20' : colors.surface }]}>
        <Feather name={icon as any} size={16} color={iconColor ?? (danger ? colors.destructive : colors.primary)} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {subtitle && <Text style={[styles.sub, { color: colors.mutedForeground }]}>{subtitle}</Text>}
      </View>
      {toggle ? (
        <Switch value={toggleValue} onValueChange={onToggle} trackColor={{ true: colors.primary }} />
      ) : (
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14 },
  icon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  text: { flex: 1, gap: 1 },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  sub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
