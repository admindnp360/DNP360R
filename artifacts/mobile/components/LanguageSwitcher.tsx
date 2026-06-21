import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: Props) {
  const { language, setLanguage } = useLanguage();
  const colors = useColors();

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="globe" size={12} color={colors.mutedForeground} />
      <Pressable
        style={[styles.option, language === 'en' && { backgroundColor: colors.primary }]}
        onPress={() => setLanguage('en')}
      >
        <Text style={[styles.optionText, { color: language === 'en' ? '#fff' : colors.mutedForeground }]}>EN</Text>
      </Pressable>
      <Pressable
        style={[styles.option, language === 'hi' && { backgroundColor: '#D97706' }]}
        onPress={() => setLanguage('hi')}
      >
        <Text style={[styles.optionText, { color: language === 'hi' ? '#fff' : colors.mutedForeground }]}>हि</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  option: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
});
