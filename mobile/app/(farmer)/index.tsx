import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiRequest, API_BASE_URL } from '../../src/api/client';
import { colors } from '../../src/theme/colors';
import { SavedDiagnosis } from '../../src/types';

export default function FarmerHomeScreen() {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [recentDiagnoses, setRecentDiagnoses] = useState<SavedDiagnosis[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentActivity = async () => {
    try {
      const res = await apiRequest<{ records: SavedDiagnosis[] }>('/api/saved-diagnoses?limit=3');
      if (res.success && res.data?.records) {
        setRecentDiagnoses(res.data.records);
      }
    } catch (e) {
      console.warn('Failed to load recent activity:', e);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentActivity();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* App Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.leafIcon}>
              <Text style={styles.leafSymbol}>❧</Text>
            </View>
            <View>
              <Text style={styles.appName}>{t.appName}</Text>
              <Text style={styles.welcomeUser}>
                {user?.fullName || 'Farmer'} · {user?.district || 'Sri Lanka'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.langButton}
              onPress={() => router.push('/(farmer)/language')}
            >
              <Text style={styles.langText}>
                {language === 'si' ? 'සිං' : language === 'ta' ? 'த' : 'EN'} ⌄
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>⎋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Member 1 Workload Indicator / Badge */}
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 1 · FARMER HOME & CAPTURE</Text>
        </View>

        {/* Hero Card: Primary Action */}
        <View style={styles.heroCard}>
          <Text style={styles.heroBadge}>AI LEAF DIAGNOSIS</Text>
          <Text style={styles.heroTitle}>{t.diagnosePrompt}</Text>
          <Text style={styles.heroSub}>{t.diagnosePromptSub}</Text>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => router.push('/(farmer)/capture')}
            activeOpacity={0.85}
          >
            <Text style={styles.heroButtonText}>⊙ {t.diagnose} Now</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Shortcuts Section */}
        <Text style={styles.sectionTitle}>{t.quickActions}</Text>
        <View style={styles.shortcutsGrid}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => router.push('/(farmer)/guidelines')}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#eaf4eb' }]}>
              <Text style={styles.shortcutIcon}>📖</Text>
            </View>
            <Text style={styles.shortcutTitle}>{t.photoGuidelines}</Text>
            <Text style={styles.shortcutSub}>{t.photoGuidelinesSub}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => router.push('/(farmer)/saved')}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#fdf3dd' }]}>
              <Text style={styles.shortcutIcon}>▤</Text>
            </View>
            <Text style={styles.shortcutTitle}>{t.savedDiagnoses}</Text>
            <Text style={styles.shortcutSub}>{t.savedDiagnosesSub}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => router.push('/(farmer)/cases')}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#e8eff7' }]}>
              <Text style={styles.shortcutIcon}>👨‍🌾</Text>
            </View>
            <Text style={styles.shortcutTitle}>{t.consultExpert}</Text>
            <Text style={styles.shortcutSub}>{t.consultExpertSub}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>{t.recentActivity}</Text>
          {recentDiagnoses.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(farmer)/saved')}>
              <Text style={styles.viewAllText}>View all →</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentDiagnoses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyText}>{t.noRecentActivity}</Text>
          </View>
        ) : (
          recentDiagnoses.map((item) => (
            <View key={item._id} style={styles.activityCard}>
              <View style={styles.activityImagePlaceholder}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: `${API_BASE_URL}${item.imageUrl}` }}
                    style={styles.activityImage}
                  />
                ) : (
                  <Text style={{ fontSize: 24 }}>🍃</Text>
                )}
              </View>
              <View style={styles.activityInfo}>
                <View style={styles.activityRow}>
                  <Text style={styles.activityCrop}>{item.crop}</Text>
                  <Text style={styles.activityConfidence}>{item.confidence}% Match</Text>
                </View>
                <Text style={styles.activityDisease}>{item.disease}</Text>
                <Text style={styles.activityDate}>
                  {new Date(item.savedDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leafIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafSymbol: {
    color: '#ffffff',
    fontSize: 24,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.5,
  },
  welcomeUser: {
    fontSize: 12,
    color: colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  langButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoutText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '700',
  },
  memberTag: {
    backgroundColor: '#e6ede3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  memberTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroBadge: {
    color: '#eff5df',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    color: '#d9e8dc',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  heroButton: {
    backgroundColor: '#eff5df',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  shortcutsGrid: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 24,
  },
  shortcutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  shortcutIcon: {
    fontSize: 18,
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 2,
  },
  shortcutSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  activityImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#eaf0e7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  activityImage: {
    width: '100%',
    height: '100%',
  },
  activityInfo: {
    flex: 1,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityCrop: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  activityConfidence: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  activityDisease: {
    fontSize: 13,
    color: colors.text,
    marginVertical: 2,
  },
  activityDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
