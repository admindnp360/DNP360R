import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const EMERGENCY_CONTACTS = [
  { name: 'Police Control Room', number: '100', icon: 'shield', color: '#003884', bg: '#D7E3FF', desc: 'Law & Order Emergency' },
  { name: 'Ambulance / Medical', number: '108', icon: 'activity', color: '#BA1A1A', bg: '#FDECEA', desc: 'Medical Emergency' },
  { name: 'Fire Brigade', number: '101', icon: 'wind', color: '#904D00', bg: '#FFDCC3', desc: 'Fire Emergency' },
  { name: 'Disaster Management', number: '1070', icon: 'alert-triangle', color: '#6B00C7', bg: '#EDE7F6', desc: 'Natural Disaster Relief' },
  { name: 'DNP Municipal Office', number: '06184200000', icon: 'home', color: '#005AB6', bg: '#DBE9FE', desc: 'Nagar Parishad Helpline' },
  { name: 'Women Helpline', number: '1091', icon: 'heart', color: '#C2185B', bg: '#FCE4EC', desc: 'Safety & Security' },
];

const SERVICES = [
  { label: 'Birth Certificate', icon: 'file-plus', color: '#005AB6' },
  { label: 'Death Certificate', icon: 'file-minus', color: '#904D00' },
  { label: 'Property Tax', icon: 'credit-card', color: '#006A35' },
  { label: 'Water Bill', icon: 'droplet', color: '#0277BD' },
  { label: 'Trade License', icon: 'briefcase', color: '#6B00C7' },
  { label: 'Building Plan', icon: 'map', color: '#004D40' },
];

function callNumber(number: string) {
  Alert.alert(
    'Call ' + number,
    'Do you want to call this number?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL(`tel:${number}`) },
    ]
  );
}

export default function CitizenEmergency() {
  const colors = useColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Emergency Contacts</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>Tap any card to call immediately</Text>
        </View>

        <View style={styles.grid}>
          {EMERGENCY_CONTACTS.map(e => (
            <Pressable
              key={e.name}
              style={({ pressed }) => [styles.contactCard, { backgroundColor: e.bg, borderColor: e.color + '40', opacity: pressed ? 0.8 : 1 }]}
              onPress={() => callNumber(e.number)}
            >
              <View style={[styles.iconCircle, { backgroundColor: e.color + '20' }]}>
                <Feather name={e.icon as any} size={22} color={e.color} />
              </View>
              <Text style={[styles.contactNumber, { color: e.color }]}>{e.number}</Text>
              <Text style={[styles.contactName, { color: '#0F1C2C' }]} numberOfLines={2}>{e.name}</Text>
              <Text style={[styles.contactDesc, { color: '#727785' }]}>{e.desc}</Text>
              <View style={[styles.callBtn, { backgroundColor: e.color }]}>
                <Feather name="phone" size={12} color="#fff" />
                <Text style={styles.callBtnText}>Call Now</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Municipal Services</Text>
        <View style={[styles.servicesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SERVICES.map((s, i) => (
            <Pressable
              key={s.label}
              style={({ pressed }) => [styles.serviceRow, { borderBottomColor: colors.border, borderBottomWidth: i < SERVICES.length - 1 ? 1 : 0, opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.serviceIcon, { backgroundColor: s.color + '15' }]}>
                <Feather name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={[styles.serviceLabel, { color: colors.text }]}>{s.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.infoBanner, { backgroundColor: colors.dnpBlue ?? '#0F2D6B' }]}>
          <Feather name="info" size={16} color="#ABC7FF" />
          <Text style={styles.infoText}>
            Municipal Office Hours: Mon–Sat, 10 AM – 5 PM{'\n'}
            Address: Nagar Parishad Daudnagar, Bihar
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  pageSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  contactCard: { width: '47%', borderRadius: 16, padding: 14, borderWidth: 1, gap: 6 },
  iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  contactNumber: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  contactName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', lineHeight: 16 },
  contactDesc: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginTop: 4, alignSelf: 'flex-start' },
  callBtnText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  servicesCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  serviceIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  serviceLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  infoBanner: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 14, padding: 16 },
  infoText: { color: '#8AB0D8', fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18 },
});
