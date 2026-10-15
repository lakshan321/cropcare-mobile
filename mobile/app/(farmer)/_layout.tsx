import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { colors } from '../../src/theme/colors';

export default function FarmerLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.tabIcon, { color }]}>⌂</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: t.diagnose,
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>⊙</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t.saved,
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>▤</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: t.cases,
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>◷</Text>
          ),
        }}
      />

      {/* Stack/Sub screens hidden from tab bar */}
      <Tabs.Screen
        name="guidelines"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="preview"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="analysis"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="result"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="treatment"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="consult"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="language"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabIcon: {
    fontSize: 20,
    fontWeight: '800',
  },
});
