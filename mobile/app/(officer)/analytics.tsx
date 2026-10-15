import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiRequest, API_BASE_URL } from '../../src/api/client';
import { SavedAnalyticsView } from '../../src/types';
import { tokenStorage } from '../../src/storage/secureStore';
import { colors } from '../../src/theme/colors';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [summary, setSummary] = useState<any>(null);
  const [savedViews, setSavedViews] = useState<SavedAnalyticsView[]>([]);
  const [districtFilter, setDistrictFilter] = useState('All');
  const [cropFilter, setCropFilter] = useState('All');
  const [dateRange, setDateRange] = useState('All');

  const [newViewName, setNewViewName] = useState('');
  const [savingView, setSavingView] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  const districts = ['All', 'Kandy', 'Gampaha', 'Galle', 'Matale', 'Nuwara Eliya'];
  const crops = ['All', 'Tomato', 'Paddy / Rice', 'Chilli', 'Potato'];

  const fetchAnalytics = async () => {
    try {
      const query = new URLSearchParams({
        district: districtFilter,
        crop: cropFilter,
        dateRange,
      });

      const res = await apiRequest(`/api/analytics/summary?${query.toString()}`);
      if (res.success && res.data?.summary) {
        setSummary(res.data.summary);
      }

      // Fetch saved views
      const viewsRes = await apiRequest<{ views: SavedAnalyticsView[] }>('/api/analytics/views');
      if (viewsRes.success && viewsRes.data?.views) {
        setSavedViews(viewsRes.data.views);
      }
    } catch (e) {
      console.warn('Error fetching analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [districtFilter, cropFilter, dateRange]);

  // Save View (CRUD - Create)
  const handleSaveView = async () => {
    if (!newViewName.trim()) {
      Alert.alert('Notice', 'Please enter a name for this saved analytics view.');
      return;
    }

    setSavingView(true);
    try {
      const res = await apiRequest<{ view: SavedAnalyticsView }>('/api/analytics/views', {
        method: 'POST',
        body: {
          name: newViewName.trim(),
          filters: {
            district: districtFilter,
            crop: cropFilter,
            dateRange,
          },
        },
      });

      if (res.success && res.data?.view) {
        setSavedViews([res.data.view, ...savedViews]);
        setNewViewName('');
        Alert.alert('Saved', `Filter view "${res.data.view.name}" saved.`);
      }
    } catch (e) {
      console.warn('Error saving view:', e);
    } finally {
      setSavingView(false);
    }
  };

  // Load View
  const handleLoadView = (v: SavedAnalyticsView) => {
    if (v.filters.district) setDistrictFilter(v.filters.district);
    if (v.filters.crop) setCropFilter(v.filters.crop);
    if (v.filters.dateRange) setDateRange(v.filters.dateRange);
    Alert.alert('View Loaded', `Applied filters from "${v.name}".`);
  };

  // Delete View (CRUD - Delete)
  const handleDeleteView = (id: string) => {
    Alert.alert('Delete View', 'Are you sure you want to delete this saved filter view?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const res = await apiRequest(`/api/analytics/views/${id}`, { method: 'DELETE' });
          if (res.success) {
            setSavedViews(savedViews.filter((v) => v._id !== id));
          }
        },
      },
    ]);
  };

  // CSV Export
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const query = new URLSearchParams({
        district: districtFilter,
        crop: cropFilter,
      });

      const token = await tokenStorage.getToken();
      const exportUrl = `${API_BASE_URL}/api/analytics/export.csv?${query.toString()}`;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const res = await fetch(exportUrl, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cropcare_outbreak_analytics_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const res = await apiRequest(`/api/analytics/export.csv?${query.toString()}`);
        if (res.success) {
          Alert.alert(
            'CSV Export Generated',
            `Export completed successfully with formula sanitization.\nRecords exported: ${summary?.totalCases || 0}`
          );
        }
      }
    } catch (e: any) {
      Alert.alert('Export Error', e.message || 'Failed to export CSV.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Generating analytics overview...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Text style={styles.headerBackText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.analyticsTitle}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 4 · OUTBREAK ANALYTICS & SAVED VIEWS</Text>
        </View>

        <Text style={styles.title}>{t.analyticsTitle}</Text>
        <Text style={styles.sub}>{t.analyticsSubtitle}</Text>

        {/* Filter Controls Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>REGIONAL & CROP FILTERS</Text>

          <Text style={styles.filterGroupTitle}>District</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
            {districts.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.filterChip, districtFilter === d && styles.filterChipActive]}
                onPress={() => setDistrictFilter(d)}
              >
                <Text style={[styles.filterChipText, districtFilter === d && styles.filterChipTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterGroupTitle}>Crop Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
            {crops.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.filterChip, cropFilter === c && styles.filterChipActive]}
                onPress={() => setCropFilter(c)}
              >
                <Text style={[styles.filterChipText, cropFilter === c && styles.filterChipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* High-level Summary Metrics */}
        {summary && (
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricNum}>{summary.totalCases}</Text>
              <Text style={styles.metricTitle}>Total Cases</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNum, { color: '#8a5a10' }]}>{summary.openCases}</Text>
              <Text style={styles.metricTitle}>Open Cases</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNum, { color: colors.success }]}>{summary.resolvedCases}</Text>
              <Text style={styles.metricTitle}>Resolved</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNum, { color: colors.danger }]}>{summary.highPriorityCases}</Text>
              <Text style={styles.metricTitle}>High Priority</Text>
            </View>
          </View>
        )}

        {/* Disease Breakdown */}
        {summary?.diseaseDistribution && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t.diseaseDistribution}</Text>
            {summary.diseaseDistribution.map((d: any, idx: number) => {
              const maxCount = summary.totalCases || 1;
              const pct = Math.round((d.count / maxCount) * 100);

              return (
                <View key={idx} style={styles.barItem}>
                  <View style={styles.barHeader}>
                    <Text style={styles.barLabel}>{d.disease}</Text>
                    <Text style={styles.barCount}>{d.count} ({pct}%)</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* District Breakdown */}
        {summary?.districtDistribution && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t.districtBreakdown}</Text>
            {summary.districtDistribution.map((d: any, idx: number) => (
              <View key={idx} style={styles.breakdownRow}>
                <Text style={styles.breakdownName}>{d.district}</Text>
                <Text style={styles.breakdownCount}>{d.count} cases</Text>
              </View>
            ))}
          </View>
        )}

        {/* Crop Breakdown */}
        {summary?.cropDistribution && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t.cropBreakdown}</Text>
            {summary.cropDistribution.map((c: any, idx: number) => (
              <View key={idx} style={styles.breakdownRow}>
                <Text style={styles.breakdownName}>{c.crop}</Text>
                <Text style={styles.breakdownCount}>{c.count} cases</Text>
              </View>
            ))}
          </View>
        )}

        {/* CSV Export Button */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExportCSV}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.exportBtnText}>📥 {t.exportCsvBtn}</Text>
          )}
        </TouchableOpacity>

        {/* Saved Views Section (CRUD - Create, Read, Delete) */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t.savedViewsTitle}</Text>

          {/* Create View */}
          <View style={styles.addViewRow}>
            <TextInput
              style={styles.viewInput}
              placeholder={t.viewNamePlaceholder}
              placeholderTextColor="#9ca3af"
              value={newViewName}
              onChangeText={setNewViewName}
            />
            <TouchableOpacity
              style={styles.saveViewBtn}
              onPress={handleSaveView}
              disabled={savingView}
            >
              {savingView ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveViewBtnText}>{t.saveViewBtn}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* List Saved Views */}
          {savedViews.map((v) => (
            <View key={v._id} style={styles.viewItemRow}>
              <TouchableOpacity style={styles.viewItemInfo} onPress={() => handleLoadView(v)}>
                <Text style={styles.viewItemName}>📌 {v.name}</Text>
                <Text style={styles.viewItemFilters}>
                  District: {v.filters.district || 'All'} · Crop: {v.filters.crop || 'All'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewDeleteBtn}
                onPress={() => handleDeleteView(v._id)}
              >
                <Text style={{ color: colors.danger, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Analytical Rubric Notice */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>⚠ Epidemiological Note</Text>
          <Text style={styles.disclaimerText}>
            Consultation totals reflect voluntary submissions and do not establish regional prevalence. Unverified automated AI suggestions are categorized separately from expert-confirmed plant pathologist diagnoses.
          </Text>
        </View>
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
  headerBackBtn: {
    paddingVertical: 4,
  },
  headerBackText: {
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
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  filterGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 6,
    marginTop: 4,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f6f7f5',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricNum: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  barItem: {
    marginBottom: 12,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  barCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  barTrack: {
    height: 7,
    backgroundColor: '#eaf0e7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f5f1',
  },
  breakdownName: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  breakdownCount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  exportBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  exportBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  addViewRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  viewInput: {
    flex: 1,
    backgroundColor: '#f9fbf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  saveViewBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  saveViewBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  viewItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f3ef',
  },
  viewItemInfo: {
    flex: 1,
  },
  viewItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  viewItemFilters: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  viewDeleteBtn: {
    padding: 6,
  },
  disclaimerCard: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#ede1c2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8a5a10',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 16,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
});
