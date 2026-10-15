import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiRequest, API_BASE_URL } from '../../src/api/client';
import { ConsultationCase, CaseStatus } from '../../src/types';
import { colors } from '../../src/theme/colors';

export default function CasesScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  const [cases, setCases] = useState<ConsultationCase[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit notes modal state
  const [editingCase, setEditingCase] = useState<ConsultationCase | null>(null);
  const [editNotesText, setEditNotesText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchCases = async () => {
    try {
      const endpoint = filterStatus !== 'All' ? `/api/consultations/my?status=${filterStatus}` : '/api/consultations/my';
      const res = await apiRequest<{ cases: ConsultationCase[] }>(endpoint);
      if (res.success && res.data?.cases) {
        setCases(res.data.cases);
      }
    } catch (e) {
      console.warn('Error fetching farmer cases:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [filterStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  // Edit Notes (CRUD - Update while Submitted)
  const openEditModal = (c: ConsultationCase) => {
    setEditingCase(c);
    setEditNotesText(c.farmerNotes);
  };

  const handleSaveNotes = async () => {
    if (!editingCase) return;
    setSavingEdit(true);
    try {
      const res = await apiRequest<{ consultation: ConsultationCase }>(`/api/consultations/${editingCase._id}`, {
        method: 'PATCH',
        body: { farmerNotes: editNotesText },
      });

      if (res.success && res.data?.consultation) {
        setCases(cases.map((c) => (c._id === editingCase._id ? res.data!.consultation : c)));
        setEditingCase(null);
      } else {
        Alert.alert('Notice', res.message || 'Could not update notes.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Update failed.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Cancel Case (CRUD - Delete while Submitted)
  const handleCancelCase = (id: string) => {
    Alert.alert(
      'Withdraw Consultation',
      'Are you sure you want to withdraw and delete this consultation request?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            const res = await apiRequest(`/api/consultations/${id}`, { method: 'DELETE' });
            if (res.success) {
              setCases(cases.filter((c) => c._id !== id));
            } else {
              Alert.alert('Notice', res.message || 'Could not cancel consultation.');
            }
          },
        },
      ]
    );
  };

  const getStatusBadgeStyle = (status: CaseStatus) => {
    switch (status) {
      case 'Submitted':
        return styles.badgeSubmitted;
      case 'In Review':
        return styles.badgeInReview;
      case 'Resolved':
        return styles.badgeResolved;
      default:
        return {};
    }
  };

  const getStatusTextStyle = (status: CaseStatus) => {
    switch (status) {
      case 'Submitted':
        return styles.textSubmitted;
      case 'In Review':
        return styles.textInReview;
      case 'Resolved':
        return styles.textResolved;
      default:
        return {};
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.casesTitle}</Text>
        <TouchableOpacity
          style={styles.newConsultBtn}
          onPress={() => router.push('/(farmer)/capture')}
        >
          <Text style={styles.newConsultBtnText}>+ New Case</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 3 · CASE STATUS & EXPERT FEEDBACK</Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {['All', 'Submitted', 'In Review', 'Resolved'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, filterStatus === st && styles.filterChipActive]}
              onPress={() => setFilterStatus(st)}
            >
              <Text style={[styles.filterChipText, filterStatus === st && styles.filterChipTextActive]}>
                {st === 'All'
                  ? t.all
                  : st === 'Submitted'
                  ? t.statusSubmitted
                  : st === 'In Review'
                  ? t.statusInReview
                  : t.statusResolved}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingSub}>Loading your consultations...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            {cases.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>📋</Text>
                <Text style={styles.emptyTitle}>{t.noCases}</Text>
                <Text style={styles.emptySub}>
                  When you submit a consultation request, you can track progress and read official officer instructions right here.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push('/(farmer)/capture')}
                >
                  <Text style={styles.primaryButtonText}>Diagnose & Consult Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              cases.map((c) => {
                const canEditOrCancel = c.status === 'Submitted';

                return (
                  <View key={c._id} style={styles.caseCard}>
                    {/* Header: ID & Status */}
                    <View style={styles.caseHeader}>
                      <View style={styles.caseHeaderLeft}>
                        <Text style={styles.caseId}>Case #{c._id.slice(-6).toUpperCase()}</Text>
                        <Text style={styles.caseCrop}>{c.crop} · {c.district}</Text>
                      </View>
                      <View style={[styles.statusBadge, getStatusBadgeStyle(c.status)]}>
                        <Text style={[styles.statusBadgeText, getStatusTextStyle(c.status)]}>
                          {c.status}
                        </Text>
                      </View>
                    </View>

                    {/* Case Image Thumbnail + Farmer Notes */}
                    <View style={styles.caseBodyRow}>
                      {c.imageUrl ? (
                        <Image
                          source={{ uri: `${API_BASE_URL}${c.imageUrl}` }}
                          style={styles.caseThumbnail}
                        />
                      ) : null}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.caseNotesTitle}>Your Symptoms & Notes:</Text>
                        <Text style={styles.caseNotesText}>{c.farmerNotes}</Text>
                      </View>
                    </View>

                    <Text style={styles.caseOfficeText}>🏛 Office: {c.office}</Text>

                    {/* Official Published Expert Feedback (Resolved) */}
                    {c.publishedResponse && !c.publishedResponse.isWithdrawn ? (
                      <View style={styles.publishedBox}>
                        <View style={styles.publishedHeaderRow}>
                          <Text style={styles.expertTitle}>✓ {t.expertFeedbackTitle}</Text>
                        </View>
                        <Text style={styles.confirmedDiseaseText}>
                          {t.confirmedDisease}: <Text style={{ fontWeight: '800' }}>{c.publishedResponse.confirmedDisease}</Text>
                        </Text>
                        <Text style={styles.treatmentAdviceText}>
                          {c.publishedResponse.treatment}
                        </Text>
                        {c.publishedResponse.instructions ? (
                          <Text style={styles.instructionsText}>
                            Instructions: {c.publishedResponse.instructions}
                          </Text>
                        ) : null}
                        <View style={styles.officerMetaRow}>
                          <Text style={styles.officerNameText}>
                            👨‍🔬 {c.publishedResponse.officerName}
                          </Text>
                          {c.publishedResponse.followUpDate ? (
                            <Text style={styles.followUpText}>
                              📅 Follow-up: {new Date(c.publishedResponse.followUpDate).toLocaleDateString()}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ) : (
                      <View style={styles.pendingReviewBox}>
                        <Text style={styles.pendingReviewText}>
                          {c.status === 'In Review'
                            ? `⏳ An Agricultural Officer is actively reviewing your case (${c.assignedOfficerName || 'Assigned'}).`
                            : `⏳ ${t.awaitingReview}`}
                        </Text>
                      </View>
                    )}

                    {/* Editable / Cancellable if still Submitted */}
                    {canEditOrCancel && (
                      <View style={styles.caseActionsRow}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => openEditModal(c)}
                        >
                          <Text style={styles.editBtnText}>✏ {t.editNotesBtn}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => handleCancelCase(c._id)}
                        >
                          <Text style={styles.cancelBtnText}>✕ {t.cancelCaseBtn}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* Edit Notes Modal */}
      <Modal
        visible={Boolean(editingCase)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingCase(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Case Notes</Text>
            <Text style={styles.modalSub}>Update your symptoms before an officer starts review:</Text>

            <TextInput
              style={styles.modalInput}
              value={editNotesText}
              onChangeText={setEditNotesText}
              multiline
              numberOfLines={4}
              placeholder="Describe symptoms or plot conditions..."
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingCase(null)}
                disabled={savingEdit}
              >
                <Text style={styles.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveNotes}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>{t.save}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  newConsultBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newConsultBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    padding: 20,
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  listContent: {
    paddingBottom: 30,
  },
  caseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseHeaderLeft: {},
  caseId: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  caseCrop: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeSubmitted: {
    backgroundColor: '#fff4db',
  },
  badgeInReview: {
    backgroundColor: '#e8eff7',
  },
  badgeResolved: {
    backgroundColor: colors.successLight,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textSubmitted: {
    color: '#8a5a10',
  },
  textInReview: {
    color: '#1a5699',
  },
  textResolved: {
    color: colors.success,
  },
  caseBodyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  caseThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#eaf0e7',
  },
  caseNotesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 2,
  },
  caseNotesText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  caseOfficeText: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 10,
  },
  publishedBox: {
    backgroundColor: '#f5faf6',
    borderWidth: 1,
    borderColor: '#cce2d2',
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    marginBottom: 8,
  },
  publishedHeaderRow: {
    marginBottom: 6,
  },
  expertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  confirmedDiseaseText: {
    fontSize: 13,
    color: colors.primaryDark,
    marginBottom: 4,
  },
  treatmentAdviceText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 8,
  },
  officerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0eee3',
    paddingTop: 8,
  },
  officerNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  followUpText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  pendingReviewBox: {
    backgroundColor: '#fbfcfb',
    borderWidth: 1,
    borderColor: '#edf1ec',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  pendingReviewText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  caseActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  editBtn: {
    backgroundColor: '#eaf4eb',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  cancelBtn: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSub: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: '#f9fbf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
