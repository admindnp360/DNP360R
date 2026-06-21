import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsItem } from '@/components/SettingsItem';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

const ROLE_LABELS: Record<string, string> = {
  citizen: 'Citizen',
  safaikarmi: 'Safai Karmi',
  official: 'Municipal Official',
  admin: 'System Administrator',
};

const ROLE_COLORS: Record<string, string> = {
  citizen: '#005AB6',
  safaikarmi: '#006A35',
  official: '#904D00',
  admin: '#003884',
};

const ROLE_BG: Record<string, string> = {
  citizen: '#DBE9FE',
  safaikarmi: '#D1FAE5',
  official: '#FFDCC3',
  admin: '#D7E3FF',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const colors = useColors();

  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role] ?? colors.primary;
  const roleBg = ROLE_BG[user.role] ?? colors.surface;
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  const INFO_ROWS = [
    { icon: 'mail', label: 'Email', value: user.email },
    { icon: 'smartphone', label: 'Mobile', value: user.mobile },
    ...(user.address ? [{ icon: 'map-pin', label: 'Address', value: user.address }] : []),
    ...(user.employeeId ? [{ icon: 'briefcase', label: 'Employee ID', value: user.employeeId }] : []),
    ...(user.wardId ? [{ icon: 'map', label: 'Assigned Ward', value: user.wardId.replace('ward-', 'Ward ') }] : []),
    { icon: 'calendar', label: 'Member Since', value: user.createdAt },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile header */}
        <View style={[styles.profileHeader, { backgroundColor: roleColor }]}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{user.name[0].toUpperCase()}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: roleBg }]}>
              <Text style={[styles.roleBadgeText, { color: roleColor }]}>{roleLabel}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileId}>ID: {user.id}</Text>
        </View>

        {/* Profile info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACCOUNT INFORMATION</Text>
          {INFO_ROWS.map((row, i) => (
            <View key={row.label} style={[styles.infoRow, { borderBottomColor: colors.border, borderBottomWidth: i < INFO_ROWS.length - 1 ? 1 : 0 }]}>
              <View style={[styles.infoIcon, { backgroundColor: roleBg }]}>
                <Feather name={row.icon as any} size={14} color={roleColor} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SETTINGS</Text>
          <SettingsItem
            icon="bell"
            label="Notifications"
            subtitle="Complaint updates, notices, alerts"
            toggle
            toggleValue
            onToggle={() => {}}
            iconColor={roleColor}
          />
          <SettingsItem
            icon="globe"
            label="Language"
            subtitle="English (India)"
            onPress={() => Alert.alert('Language', 'Language selection coming soon.')}
            iconColor="#6B00C7"
          />
          <SettingsItem
            icon="help-circle"
            label="Help & Support"
            subtitle="FAQs, contact support"
            onPress={() => Alert.alert('Support', 'Contact: support@dnp360.in\nPhone: 06184-XXXXXX')}
            iconColor="#004D40"
            last
          />
        </View>

        {/* About */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ABOUT</Text>
          <SettingsItem
            icon="info"
            label="About DNP360"
            subtitle="Version 1.0.0 · Nagar Parishad Daudnagar"
            onPress={() => Alert.alert('DNP360', 'Daudnagar Nagar Parishad 360\nVersion 1.0.0\n\nSmart Governance · Digital India\n\nBihar, India')}
            iconColor={roleColor}
          />
          <SettingsItem
            icon="file-text"
            label="Privacy Policy"
            onPress={() => {}}
            iconColor="#727785"
            last
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: '#FDECEA' }]} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color="#BA1A1A" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          DNP360 · Nagar Parishad Daudnagar{'\n'}Bihar, India · v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileHeader: { paddingTop: 32, paddingBottom: 32, paddingHorizontal: 20, alignItems: 'center', gap: 6 },
  avatarWrap: { alignItems: 'center', gap: 10, marginBottom: 4 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarLetter: { color: '#FFFFFF', fontSize: 36, fontFamily: 'Inter_700Bold' },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99 },
  roleBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  profileName: { color: '#FFFFFF', fontSize: 24, fontFamily: 'Inter_700Bold' },
  profileId: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  section: { marginHorizontal: 16, marginTop: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoContent: { flex: 1, gap: 1 },
  infoLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  infoValue: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, marginTop: 16, borderRadius: 14, paddingVertical: 15 },
  logoutText: { color: '#BA1A1A', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  footer: { textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 16, marginBottom: 8, lineHeight: 18 },
});
