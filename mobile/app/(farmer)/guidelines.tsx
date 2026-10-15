import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { colors } from '../../src/theme/colors';

export default function GuidelinesScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← {t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.photoGuidelines}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 1 · PHOTO GUIDELINES</Text>
        </View>

        <Text style={styles.title}>{t.guidelinesTitle}</Text>
        <Text style={styles.sub}>{t.guidelinesSubtitle}</Text>

        {/* Good vs Bad comparison cards */}
        <View style={styles.comparisonGrid}>
          {/* Good Example */}
          <View style={[styles.card, styles.goodCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.goodIcon}>✓</Text>
              <Text style={styles.goodTitle}>{t.goodPhotoTitle}</Text>
            </View>
            <View style={styles.photoIllustrationGood}>
              <Text style={{ fontSize: 40 }}>🍃</Text>
            </View>
            <Text style={styles.cardDesc}>{t.goodPhotoDesc}</Text>
          </View>

          {/* Bad Example */}
          <View style={[styles.card, styles.badCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.badIcon}>✕</Text>
              <Text style={styles.badTitle}>{t.badPhotoTitle}</Text>
            </View>
            <View style={styles.photoIllustrationBad}>
              <Text style={{ fontSize: 40, opacity: 0.4 }}>🌫️</Text>
            </View>
            <Text style={styles.cardDesc}>{t.badPhotoDesc}</Text>
          </View>
        </View>

        {/* Practical Botanical Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsSectionTitle}>Key Instructions for Accuracy</Text>

          <View style={styles.tipRow}>
            <View style={styles.tipBadge}><Text style={styles.tipBadgeText}>1</Text></View>
            <Text style={styles.tipText}>{t.tip1}</Text>
          </View>

          <View style={styles.tipRow}>
            <View style={styles.tipBadge}><Text style={styles.tipBadgeText}>2</Text></View>
            <Text style={styles.tipText}>{t.tip2}</Text>
          </View>

          <View style={styles.tipRow}>
            <View style={styles.tipBadge}><Text style={styles.tipBadgeText}>3</Text></View>
            <Text style={styles.tipText}>{t.tip3}</Text>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(farmer)/capture')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>⊙ {t.openCameraBtn}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#ffffff',
  },
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  memberTag: {
    backgroundColor: '#e6ede3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  memberTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  comparisonGrid: {
    flexDirection: 'column',
    gap: 14,
    marginBottom: 24,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  goodCard: {
    borderColor: '#cce2d2',
    backgroundColor: '#f6faf7',
  },
  badCard: {
    borderColor: '#ffc8be',
    backgroundColor: '#fff7f5',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  goodIcon: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  badIcon: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
  },
  goodTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  badTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.danger,
  },
  photoIllustrationGood: {
    height: 90,
    backgroundColor: '#e8efe5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoIllustrationBad: {
    height: 90,
    backgroundColor: '#f3e6e3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
  },
  tipsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  tipsSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 14,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipBadgeText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
