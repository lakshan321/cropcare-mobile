import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiRequest, API_BASE_URL } from '../../src/api/client';
import { ConsultationCase, CaseStatus, CasePriority } from '../../src/types';
import { colors } from '../../src/theme/colors';

export default function OfficerDashboardScreen() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [cases, setCases] = useState<ConsultationCase[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    open: 0,
    submitted: 0,
    inReview: 0,
    resolved: 0,
    highPriority: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'highest_priority'>('highest_priority');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCases = async () => {
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        priority: priorityFilter,
        sort: sortBy,
      });
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      const res = await apiRequest<{
        cases: ConsultationCase[];
        counts: typeof counts;
      }>(`/api/officer/cases?${queryParams.toString()}`);

      if (res.success && res.data) {
        setCases(res.data.cases);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (e) {
      console.warn('Error fetching officer cases:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, priorityFilter, sortBy, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const getPriorityBadgeStyle = (priority: CasePriority) => {
    switch (priority) {
      case 'High':
        return styles.priorityHigh;
      case 'Medium':
        return styles.priorityMedium;
      case 'Low':
        return styles.priorityLow;
    }
  };

  const getStatusBadgeStyle = (status: CaseStatus) => {
    switch (status) {
      case 'Submitted':
        return styles.statusSubmitted;
      case 'In Review':
        return styles.statusInReview;
      case 'Resolved':
        return styles.statusResolved;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.officerProfile}>
          <View style={styles.officerAvatar}>
            <Text style={{ fontSize: 18 }}>🏛</Text>
          </View>
          <View>
            <Text style={styles.officerName}>{user?.fullName || 'Agricultural Officer'}</Text>
            <Text style={styles.officerRole}>Officer Workspace · {user?.district || 'Regional Unit'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>⎋ Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Workload Tag */}
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 4 · AGRICULTURAL OFFICER DASHBOARD</Text>
        </View>

        <Text style={styles.title}>{t.officerDashboardTitle}</Text>
        <Text style={styles.sub}>{t.officerSubtitle}</Text>

        {/* Case Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: '#ffffff' }]}>
            <Text style={styles.metricNumber}>{counts.open}</Text>
            <Text style={styles.metricLabel}>{t.openCases}</Text>
            <Text style={styles.metricSub}>Submitted: {counts.submitted} | In Review: {counts.inReview}</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#ffffff' }]}>
            <Text style={[styles.metricNumber, { color: colors.success }]}>{counts.resolved}</Text>
            <Text style={styles.metricLabel}>{t.resolvedCases}</Text>
            <Text style={styles.metricSub}>Published expert advice</Text>
          </View>
        </View>

        {/* High Priority Alert Banner */}
        {counts.highPriority > 0 && (
          <View style={styles.highPriorityBanner}>
            <Text style={styles.highPriorityTitle}>
              ⚠ {counts.highPriority} High-Priority Case{counts.highPriority > 1 ? 's' : ''} Require Attention
            </Text>
            <Text style={styles.highPrioritySub}>Severe infection symptoms flagged by diagnostic analysis.</Text>
          </View>
        )}

        {/* Quick Links Row: Outbreak Analytics Shortcut */}
        <TouchableOpacity
          style={styles.analyticsShortcut}
          onPress={() => router.push('/(officer)/analytics')}
        >
          <View style={styles.analyticsShortcutRow}>
            <Text style={{ fontSize: 20 }}>📊</Text>
            <View>
              <Text style={styles.analyticsShortcutTitle}>Open Outbreak Analytics</Text>
              <Text style={styles.analyticsShortcutSub}>View disease heatmaps, district breakdowns & CSV export</Text>
            </View>
          </View>
          <Text style={styles.analyticsShortcutArrow}>→</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchCases}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 6 }}>
              <Text style={{ color: colors.textMuted }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter & Sort Controls */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {/* Status Filter */}
            {['All', 'Submitted', 'In Review', 'Resolved'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                  {st}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.filterDivider} />

            {/* Sort Toggle */}
            <TouchableOpacity
              style={[styles.filterChip, sortBy === 'highest_priority' && styles.filterChipActive]}
              onPress={() => setSortBy(sortBy === 'highest_priority' ? 'newest' : 'highest_priority')}
            >
              <Text style={[styles.filterChipText, sortBy === 'highest_priority' && styles.filterChipTextActive]}>
                {sortBy === 'highest_priority' ? '🔥 High Priority First' : '⏱ Newest First'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Case Queue List */}
        <Text style={styles.queueHeader}>Active Case Queue ({cases.length})</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingSub}>Loading case queue...</Text>
          </View>
        ) : cases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>✓</Text>
            <Text style={styles.emptyTitle}>{t.noCasesFound}</Text>
            <Text style={styles.emptySub}>All consultations have been reviewed or no records match your filters.</Text>
          </View>
        ) : (
          cases.map((c) => (
            <View key={c._id} style={styles.caseCard}>
              <View style={styles.caseCardHeader}>
                <View>
                  <Text style={styles.caseRef}>Case #{c._id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.farmerName}>{c.farmerName} · {c.location}</Text>
                </View>
                <View style={styles.badgeGroup}>
                  <View style={[styles.priorityBadge, getPriorityBadgeStyle(c.priority)]}>
                    <Text style={styles.priorityBadgeText}>{c.priority} Priority</Text>
                  </View>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(c.status)]}>
                    <Text style={styles.statusBadgeText}>{c.status}</Text>
                  </View>
                </View>
              </View>

              {/* Body: Thumbnail + Case Info */}
              <View style={styles.caseCardBody}>
                <View style={styles.thumbnailBox}>
                  {c.imageUrl ? (
                    <Image
                      source={{ uri: `${API_BASE_URL}${c.imageUrl}` }}
                      style={styles.thumbnail}
                    />
                  ) : (
                    <Text style={{ fontSize: 24 }}>🍃</Text>
                  )}
                </View>

                <View style={styles.caseTextInfo}>
                  <Text style={styles.cropTitle}>{c.crop} · AI: {c.aiSuggestedDisease}</Text>
                  <Text style={styles.farmerNotesSnippet} numberOfLines={2}>
                    "{c.farmerNotes}"
                  </Text>
                  <Text style={styles.submissionDate}>
                    Submitted {new Date(c.createdAt).toLocaleDateString()} · {c.office}
                  </Text>
                  {c.assignedOfficerName ? (
                    <Text style={styles.assignedOfficerText}>
                      Assigned: {c.assignedOfficerName}
                    </Text>
                  ) : (
                    <Text style={styles.unassignedText}>Unassigned</Text>
                  )}
                </View>
              </View>

              {/* Review Case Button */}
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => router.push(`/(officer)/review/${c._id}`)}
                activeOpacity={0.85}
              >
                <Text style={styles.reviewButtonText}>{t.reviewCaseBtn}</Text>
              </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#ffffff',
  },
  officerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  officerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eff5df',
    justifyContent: 'center',
    alignItems: 'center',
  },
  officerName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  officerRole: {
    fontSize: 11,
    color: colors.textMuted,
  },
  logoutBtn: {
    backgroundColor: '#f6f7f5',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '700',
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
    marginBottom: 10,
  },
  memberTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -1,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 2,
  },
  metricSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  highPriorityBanner: {
    backgroundColor: '#fff3f0',
    borderWidth: 1,
    borderColor: '#ffc8be',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  highPriorityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger,
    marginBottom: 2,
  },
  highPrioritySub: {
    fontSize: 12,
    color: colors.text,
  },
  analyticsShortcut: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsShortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  analyticsShortcutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  analyticsShortcutSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  analyticsShortcutArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  filterSection: {
    marginBottom: 18,
  },
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  queueHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 12,
  },
  caseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  caseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  caseRef: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  farmerName: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityHigh: {
    backgroundColor: '#ffebeb',
  },
  priorityMedium: {
    backgroundColor: '#fff5db',
  },
  priorityLow: {
    backgroundColor: '#eaf4eb',
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusSubmitted: {
    backgroundColor: '#fff4db',
  },
  statusInReview: {
    backgroundColor: '#e8eff7',
  },
  statusResolved: {
    backgroundColor: colors.successLight,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
  caseCardBody: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  thumbnailBox: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#eaf0e7',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  caseTextInfo: {
    flex: 1,
  },
  cropTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  farmerNotesSnippet: {
    fontSize: 12,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 17,
    marginBottom: 6,
  },
  submissionDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  assignedOfficerText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  unassignedText: {
    fontSize: 11,
    color: '#8a5a10',
    fontWeight: '700',
    marginTop: 2,
  },
  reviewButton: {
    backgroundColor: '#eff5df',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingSub: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
});
