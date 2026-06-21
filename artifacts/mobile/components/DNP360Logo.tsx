import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export function DNP360Logo({ size = 'md', variant = 'light' }: Props) {
  const scales = { sm: 0.7, md: 1, lg: 1.4 };
  const scale = scales[size];

  return (
    <View style={[styles.row, { gap: 2 * scale }]}>
      <Text style={[styles.dnp, { fontSize: 28 * scale, color: variant === 'dark' ? '#ABC7FF' : '#FFFFFF' }]}>
        DNP
      </Text>
      <View style={[styles.badge, { paddingHorizontal: 8 * scale, paddingVertical: 3 * scale, borderRadius: 8 * scale }]}>
        <Text style={[styles.three60, { fontSize: 24 * scale }]}>360</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dnp: { fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  badge: { backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  three60: { fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
});
