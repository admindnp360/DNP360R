import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function SplashScreen() {
  const { user, isLoading } = useAuth();

  const logoScale   = useRef(new Animated.Value(0.55)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const tagY        = useRef(new Animated.Value(14)).current;
  const barWidth    = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      /* 1. Logo scale + fade in */
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1, duration: 750,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1, duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      /* 2. Tagline slides up */
      Animated.parallel([
        Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(tagY,       { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      /* 3. Progress bar fills */
      Animated.timing(barWidth, {
        toValue: 1, duration: 1100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  /* Navigate once auth resolves AND bar animation has started */
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, { toValue: 0, duration: 320, useNativeDriver: true }).start(() => {
        router.replace(user ? '/(tabs)' : '/login');
      });
    }, 2600);
    return () => clearTimeout(timer);
  }, [isLoading, user]);

  return (
    <Animated.View style={[s.root, { opacity: screenOpacity }]}>
      <LinearGradient colors={['#04081A', '#080F28', '#0C1538']} style={StyleSheet.absoluteFill} />

      {/* Ambient orbs */}
      <View style={[s.orb, { backgroundColor: '#2563EB22', top: -80, right: -60, width: 300, height: 300 }]} />
      <View style={[s.orb, { backgroundColor: '#7C3AED18', bottom: 60, left: -80, width: 260, height: 260 }]} />
      <View style={[s.orb, { backgroundColor: '#06B6D412', top: '40%', right: -50, width: 180, height: 180 }]} />

      <View style={s.center}>
        {/* Glow halo behind logo */}
        <Animated.View style={[s.glow, { opacity: glowOpacity }]} />

        {/* Logo */}
        <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity }}>
          <Image
            source={require('../assets/images/dnp360-logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: tagOpacity, transform: [{ translateY: tagY }], alignItems: 'center', gap: 6 }}>
          <Text style={s.orgName}>Nagar Parishad Daudnagar</Text>
          <View style={s.badge}>
            <View style={s.badgeDot} />
            <Text style={s.badgeTxt}>Smart Governance · Digital India</Text>
          </View>
        </Animated.View>

        {/* Progress bar */}
        <View style={s.barTrack}>
          <Animated.View style={[
            s.barFill,
            { width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}>
            <LinearGradient colors={['#2563EB', '#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
      </View>

      <Text style={s.version}>Bihar · Govt. Trusted · v1.0</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.7 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },

  glow: {
    position: 'absolute',
    width: 220, height: 80,
    borderRadius: 110,
    backgroundColor: '#3B82F6',
    opacity: 0.07,
    elevation: 0,
  },
  logo: { width: 260, height: 130 },

  orgName: { color: '#475569', fontSize: 13, fontFamily: 'Inter_500Medium', letterSpacing: 0.3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#10B98135', backgroundColor: '#10B98110' },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  badgeTxt: { color: '#34D399', fontSize: 11, fontFamily: 'Inter_500Medium' },

  barTrack: { width: 180, height: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 10 },
  barFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },

  version: { textAlign: 'center', color: '#0F172A', fontSize: 9, fontFamily: 'Inter_400Regular', paddingBottom: 28 },
});
