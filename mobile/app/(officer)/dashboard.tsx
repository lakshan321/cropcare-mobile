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

export default function OfficerDashboardScreen() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
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
  const [districtFilter, setDistrictFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'highest_priority'>('highest_priority');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const districts = ['All', 'Kandy', 'Gampaha', 'Galle', 'Matale', 'Nuwara Eliya', 'Kurunegala'];

  const fetchCases = async () => {
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        priority: priorityFilter,
        sort: sortBy,
      });
      if (districtFilter !== 'All') {
        queryParams.append('district', districtFilter);
      }
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
  }, [statusFilter, priorityFilter, districtFilter, sortBy, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const handleClaimCase = async (caseItem: ConsultationCase) => {
    if (!user) return;
    setClaimingId(caseItem._id);
    try {
      const res = await apiRequest(`/api/officer/cases/${caseItem._id}/status`, {
        method: 'PATCH',
        body: {
          assignedOfficerId: user.id,
          assignedOfficerName: user.fullName,
          status: caseItem.status === 'Submitted' ? 'In Review' : caseItem.status,
        },
      });
      if (res.success) {
        fetchCases();
      }
    } catch (e) {
      console.warn('Failed to claim case:', e);
    } finally {
      setClaimingId(null);
    }
  };

  const getPriorityTheme = (priority: CasePriority) => {
    switch (priority) {
      case 'High':
        return {
          bg: '#fef2f2',
          border: '#fca5a5',
          text: '#b91c1c',
          dot: '#dc2626',
          label: 'CRITICAL / HIGH',
        };
      case 'Medium':
        return {
          bg: '#fffbeb',
          border: '#fde68a',
          text: '#b45309',
          dot: '#f59e0b',
          label: 'MEDIUM URGENCY',
        };
      case 'Low':
        return {
          bg: '#f0fdf4',
          border: '#bbf7d0',
          text: '#15803d',
          dot: '#22c55e',
          label: 'STANDARD / LOW',
        };
    }
  };

  const getStatusTheme = (status: CaseStatus) => {
    switch (status) {
      case 'Submitted':
        return {
          bg: '#fff7ed',
          border: '#fed7aa',
          text: '#c2410c',
          icon: '⏳',
          label: 'Awaiting Triage',
        };
      case 'In Review':
        return {
          bg: '#eff6ff',
          border: '#bfdbfe',
          text: '#1d4ed8',
          icon: '🔬',
          label: 'Under Review',
        };
      case 'Resolved':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          text: '#047857',
          icon: '✅',
          label: 'Advice Published',
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Official Government / Department Header */}
      <View style={styles.govBar}>
        <View style={styles.govBarLeft}>
          <Text style={styles.govEmblem}>🏛️</Text>
          <View>
            <Text style={styles.govTitle}>DEPARTMENT OF AGRICULTURE · SRI LANKA</Text>
            <Text style={styles.govSubtitle}>Agrarian Development & Plant Health Division</Text>
          </View>
        </View>

        {/* Quick Language Toggle */}
        <View style={styles.langPills}>
          {(['en', 'si', 'ta'] as const).map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => setLanguage(l)}
              style={[styles.langPill, language === l && styles.langPillActive]}
            >
              <Text style={[styles.langPillText, language === l && styles.langPillTextActive]}>
                {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'த'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Officer Identity & Quick Actions Header */}
      <View style={styles.officerHeader}>
        <View style={styles.officerProfile}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>AO</Text>
          </View>
          <View>
            <View style={styles.officerNameRow}>
              <Text style={styles.officerName}>{user?.fullName || 'Agricultural Officer'}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>OFFICIAL</Text>
              </View>
            </View>
            <Text style={styles.officerDistrict}>
              ID: {user?.id?.slice(-6).toUpperCase() || 'AGR-089'} · {user?.district || 'Central'} District Unit · Plant Pathology Desk
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>⎋ Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Workload Indicator for Group Milestone */}
        <View style={styles.memberTag}>
          <View style={styles.memberTagPulse} />
          <Text style={styles.memberTagText}>MEMBER 4 COMPONENT · OFFICER TRIAGE CONSOLE</Text>
        </View>

        {/* Console Heading */}
        <View style={styles.titleSection}>
          <Text style={styles.consoleTitle}>Clinical Triage & Field Surveillance</Text>
          <Text style={styles.consoleSubtitle}>
            Review farmer disease submissions, evaluate AI diagnoses, publish verified agronomic prescriptions, and monitor regional epidemic spread.
          </Text>
        </View>

        {/* Executive KPI Stats Ribbon */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>TOTAL CASES</Text>
              <Text style={styles.statIcon}>📋</Text>
            </View>
            <Text style={styles.statNumber}>{counts.total}</Text>
            <Text style={styles.statSub}>Logged cases</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#f97316' }]}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>SUBMITTED</Text>
              <Text style={styles.statIcon}>⏳</Text>
            </View>
            <Text style={[styles.statNumber, { color: '#c2410c' }]}>{counts.submitted}</Text>
            <Text style={styles.statSub}>Awaiting triage</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#6366f1' }]}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>IN REVIEW</Text>
              <Text style={styles.statIcon}>🔬</Text>
            </View>
            <Text style={[styles.statNumber, { color: '#4338ca' }]}>{counts.inReview}</Text>
            <Text style={styles.statSub}>Under analysis</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>RESOLVED</Text>
              <Text style={styles.statIcon}>✅</Text>
            </View>
            <Text style={[styles.statNumber, { color: '#047857' }]}>{counts.resolved}</Text>
            <Text style={styles.statSub}>Advice released</Text>
          </View>
        </View>

        {/* High Priority Emergency Epidemic Alert Banner */}
        {counts.highPriority > 0 && (
          <View style={styles.epidemicBanner}>
            <View style={styles.epidemicLeft}>
              <View style={styles.epidemicIconCircle}>
                <Text style={{ fontSize: 18 }}>🚨</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.epidemicTitle}>
                  {counts.highPriority} Urgent Case{counts.highPriority > 1 ? 's' : ''} Flagged for Severe Infection
                </Text>
                <Text style={styles.epidemicDesc}>
                  Pathogen symptoms indicate aggressive crop risk. Prompt triage and containment advice is required.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.epidemicActionBtn}
              onPress={() => {
                setPriorityFilter('High');
                setStatusFilter('All');
              }}
            >
              <Text style={styles.epidemicActionBtnText}>View Urgent</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Outbreak Analytics Command Shortcut Banner */}
        <TouchableOpacity
          style={styles.analyticsCommandCard}
          onPress={() => router.push('/(officer)/analytics')}
          activeOpacity={0.88}
        >
          <View style={styles.analyticsCommandLeft}>
            <View style={styles.analyticsIconWrap}>
              <Text style={{ fontSize: 22 }}>📊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.analyticsTitleRow}>
                <Text style={styles.analyticsCardTitle}>Regional Outbreak Surveillance & GIS Analytics</Text>
                <View style={styles.liveChip}>
                  <Text style={styles.liveChipText}>LIVE METRICS</Text>
                </View>
              </View>
              <Text style={styles.analyticsCardDesc}>
                Analyze pathogen clustering across districts, monitor crop vulnerability indices, and export official CSV reports.
              </Text>
            </View>
          </View>
          <View style={styles.analyticsArrowWrap}>
            <Text style={styles.analyticsArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Search & Filter Command Panel */}
        <View style={styles.controlPanel}>
          <Text style={styles.controlPanelHeader}>TRIAGE FILTERS & CONTROLS</Text>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search farmer name, crop, case ID, location..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
                <Text style={{ color: '#64748b', fontSize: 12 }}>✕ Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Status Tabs */}
          <View style={styles.tabScrollRow}>
            {[
              { id: 'All', label: 'All Cases', count: counts.total },
              { id: 'Submitted', label: 'Submitted', count: counts.submitted },
              { id: 'In Review', label: 'In Review', count: counts.inReview },
              { id: 'Resolved', label: 'Resolved', count: counts.resolved },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.statusTab, statusFilter === tab.id && styles.statusTabActive]}
                onPress={() => setStatusFilter(tab.id)}
              >
                <Text style={[styles.statusTabText, statusFilter === tab.id && styles.statusTabTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.tabBadge, statusFilter === tab.id && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, statusFilter === tab.id && styles.tabBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority & District Filter Row */}
          <View style={styles.secondaryFilterRow}>
            {/* Priority Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipScroll}>
              <Text style={styles.filterInlineLabel}>Urgency:</Text>
              {['All', 'High', 'Medium', 'Low'].map((pr) => (
                <TouchableOpacity
                  key={pr}
                  style={[styles.miniChip, priorityFilter === pr && styles.miniChipActive]}
                  onPress={() => setPriorityFilter(pr)}
                >
                  <Text style={[styles.miniChipText, priorityFilter === pr && styles.miniChipTextActive]}>
                    {pr === 'High' ? '🚨 High' : pr === 'Medium' ? '⚡ Medium' : pr === 'Low' ? '🌱 Low' : 'All'}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.filterDivider} />

              {/* District Selector */}
              <Text style={styles.filterInlineLabel}>District:</Text>
              {districts.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.miniChip, districtFilter === d && styles.miniChipActive]}
                  onPress={() => setDistrictFilter(d)}
                >
                  <Text style={[styles.miniChipText, districtFilter === d && styles.miniChipTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.filterDivider} />

              {/* Sort Toggle */}
              <TouchableOpacity
                style={[styles.miniChip, sortBy === 'highest_priority' && styles.miniChipActive]}
                onPress={() => setSortBy(sortBy === 'highest_priority' ? 'newest' : 'highest_priority')}
              >
                <Text style={[styles.miniChipText, sortBy === 'highest_priority' && styles.miniChipTextActive]}>
                  {sortBy === 'highest_priority' ? '🔥 Critical First' : '⏱ Newest First'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Case Queue Section Header */}
        <View style={styles.queueHeaderRow}>
          <View>
            <Text style={styles.queueTitle}>Active Triage Queue</Text>
            <Text style={styles.queueSub}>
              Showing {cases.length} record{cases.length === 1 ? '' : 's'} matching current parameters
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshQueueBtn} onPress={fetchCases}>
            <Text style={styles.refreshQueueText}>↻ Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Cases List */}
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#059669" size="large" />
            <Text style={styles.loadingText}>Loading official case queue...</Text>
          </View>
        ) : cases.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Text style={{ fontSize: 32 }}>📁</Text>
            </View>
            <Text style={styles.emptyTitle}>No Consultations Found</Text>
            <Text style={styles.emptySub}>
              There are no cases matching the selected filters. Change filter parameters or reset search.
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setStatusFilter('All');
                setPriorityFilter('All');
                setDistrictFilter('All');
                setSearchQuery('');
              }}
            >
              <Text style={styles.resetFilterBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cases.map((c) => {
            const pTheme = getPriorityTheme(c.priority);
            const sTheme = getStatusTheme(c.status);

            return (
              <View key={c._id} style={styles.caseCard}>
                {/* Case Top Bar */}
                <View style={styles.caseCardHeader}>
                  <View style={styles.caseRefBadge}>
                    <Text style={styles.caseRefIcon}>#</Text>
                    <Text style={styles.caseRefText}>CASE-{c._id.slice(-6).toUpperCase()}</Text>
                  </View>

                  <View style={styles.badgeGroup}>
                    {/* Urgency Badge */}
                    <View style={[styles.pillBadge, { backgroundColor: pTheme.bg, borderColor: pTheme.border }]}>
                      <View style={[styles.pillDot, { backgroundColor: pTheme.dot }]} />
                      <Text style={[styles.pillText, { color: pTheme.text }]}>{pTheme.label}</Text>
                    </View>

                    {/* Status Badge */}
                    <View style={[styles.pillBadge, { backgroundColor: sTheme.bg, borderColor: sTheme.border }]}>
                      <Text style={styles.pillIcon}>{sTheme.icon}</Text>
                      <Text style={[styles.pillText, { color: sTheme.text }]}>{sTheme.label}</Text>
                    </View>
                  </View>
                </View>

                {/* Farmer & Location Info Row */}
                <View style={styles.farmerDetailRow}>
                  <View style={styles.farmerAvatarMini}>
                    <Text style={{ fontSize: 13 }}>👨‍🌾</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.farmerFullName}>{c.farmerName}</Text>
                    <Text style={styles.farmerLocationText}>
                      📍 {c.location} · {c.district || 'Central District'} · {c.office || 'Agrarian Services Unit'}
                    </Text>
                  </View>
                  <Text style={styles.submissionTimestamp}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                {/* Specimen & AI Classification Box */}
                <View style={styles.specimenBox}>
                  <View style={styles.imageWrap}>
                    {c.imageUrl ? (
                      <Image
                        source={{ uri: `${API_BASE_URL}${c.imageUrl}` }}
                        style={styles.leafThumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.leafPlaceholder}>
                        <Text style={{ fontSize: 24 }}>🍃</Text>
                        <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>No Photo</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.specimenDetails}>
                    <View style={styles.cropRow}>
                      <Text style={styles.cropBadgeText}>CROP: {c.crop.toUpperCase()}</Text>
                    </View>

                    <View style={styles.aiPredictionPill}>
                      <Text style={styles.aiPredictionLabel}>AI Suggestion:</Text>
                      <Text style={styles.aiPredictionValue}>{c.aiSuggestedDisease}</Text>
                    </View>

                    {c.farmerNotes ? (
                      <Text style={styles.farmerNotesQuote} numberOfLines={2}>
                        "{c.farmerNotes}"
                      </Text>
                    ) : (
                      <Text style={styles.farmerNotesEmpty}>No field notes submitted by farmer.</Text>
                    )}
                  </View>
                </View>

                {/* Assignment & Action Footer */}
                <View style={styles.caseFooter}>
                  <View style={styles.assignmentInfo}>
                    <Text style={styles.assignmentLabel}>OFFICER STATUS</Text>
                    {c.assignedOfficerName ? (
                      <Text style={styles.assignedNameText}>
                        👤 Assigned: <Text style={{ fontWeight: '800' }}>{c.assignedOfficerName}</Text>
                      </Text>
                    ) : (
                      <TouchableOpacity
                        style={styles.claimBtn}
                        onPress={() => handleClaimCase(c)}
                        disabled={claimingId === c._id}
                      >
                        <Text style={styles.claimBtnText}>
                          {claimingId === c._id ? 'Claiming...' : '＋ Claim to My Desk'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.reviewActionBtn}
                    onPress={() => router.push(`/(officer)/review/${c._id}`)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.reviewActionBtnText}>
                      {c.status === 'Resolved' ? 'View Official Advice →' : 'Triage & Prescribe →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  govBar: {
    backgroundColor: '#090d16',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  govBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  govEmblem: {
    fontSize: 22,
  },
  govTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#e2e8f0',
    letterSpacing: 0.8,
  },
  govSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
  },
  langPills: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  langPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langPillActive: {
    backgroundColor: '#059669',
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  langPillTextActive: {
    color: '#ffffff',
  },
  officerHeader: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  officerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34d399',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  officerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  officerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  verifiedBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#059669',
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  officerDistrict: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  logoutText: {
    fontSize: 12,
    color: '#f87171',
    fontWeight: '700',
  },
  content: {
    backgroundColor: '#f8fafc',
    padding: 18,
    paddingBottom: 60,
  },
  memberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  memberTagPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  memberTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#065f46',
    letterSpacing: 0.6,
  },
  titleSection: {
    marginBottom: 16,
  },
  consoleTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  consoleSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  statIcon: {
    fontSize: 14,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4,
  },
  statSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  epidemicBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  epidemicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  epidemicIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  epidemicTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#991b1b',
  },
  epidemicDesc: {
    fontSize: 11,
    color: '#7f1d1d',
    marginTop: 2,
    lineHeight: 15,
  },
  epidemicActionBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  epidemicActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  analyticsCommandCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  analyticsCommandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  analyticsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  analyticsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  analyticsCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  liveChip: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#059669',
  },
  liveChipText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  analyticsCardDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    lineHeight: 16,
  },
  analyticsArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  analyticsArrow: {
    fontSize: 16,
    color: '#34d399',
    fontWeight: '800',
  },
  controlPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  controlPanelHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  searchClearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabScrollRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  statusTabActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  statusTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  statusTabTextActive: {
    color: '#ffffff',
  },
  tabBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: '#334155',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  tabBadgeTextActive: {
    color: '#34d399',
  },
  secondaryFilterRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  filterChipScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterInlineLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginRight: 2,
  },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  miniChipTextActive: {
    color: '#ffffff',
  },
  filterDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  queueSub: {
    fontSize: 11,
    color: '#64748b',
  },
  refreshQueueBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  refreshQueueText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  caseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  caseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 4,
  },
  caseRefIcon: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
  },
  caseRefText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillIcon: {
    fontSize: 10,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  farmerDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  farmerAvatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  farmerFullName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  farmerLocationText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  submissionTimestamp: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  specimenBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  leafThumbnail: {
    width: '100%',
    height: '100%',
  },
  leafPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specimenDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  cropRow: {
    marginBottom: 4,
  },
  cropBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  aiPredictionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  aiPredictionLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  aiPredictionValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  farmerNotesQuote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#475569',
    lineHeight: 15,
  },
  farmerNotesEmpty: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  assignedNameText: {
    fontSize: 11,
    color: '#334155',
  },
  claimBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  claimBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  reviewActionBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#059669',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewActionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  resetFilterBtn: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetFilterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
