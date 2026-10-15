import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '../../../src/context/LanguageContext';
import { apiRequest, API_BASE_URL } from '../../../src/api/client';
import { ConsultationCase } from '../../../src/types';
import { colors } from '../../../src/theme/colors';

export default function OfficerCaseReviewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  const caseId = id as string;

  const [caseData, setCaseData] = useState<ConsultationCase | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable response fields
  const [confirmedDisease, setConfirmedDisease] = useState('');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [treatment, setTreatment] = useState('');
  const [instructions, setInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Status & Priority controls
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchCase = async () => {
    try {
      const res = await apiRequest<{ case: ConsultationCase }>(`/api/officer/cases/${caseId}`);
      if (res.success && res.data?.case) {
        const c = res.data.case;
        setCaseData(c);
        setPriority(c.priority);

        // Pre-fill from private draft if exists, else from published response, else from AI suggestion
        if (c.privateDraft) {
          setConfirmedDisease(c.privateDraft.confirmedDisease || c.aiSuggestedDisease);
          setSeverity(c.privateDraft.severity || 'Moderate');
          setTreatment(c.privateDraft.treatment || '');
          setInstructions(c.privateDraft.instructions || '');
          if (c.privateDraft.followUpDate) {
            setFollowUpDate(new Date(c.privateDraft.followUpDate).toISOString().split('T')[0]);
          }
        } else if (c.publishedResponse) {
          setConfirmedDisease(c.publishedResponse.confirmedDisease);
          setSeverity(c.publishedResponse.severity);
          setTreatment(c.publishedResponse.treatment);
          setInstructions(c.publishedResponse.instructions);
          if (c.publishedResponse.followUpDate) {
            setFollowUpDate(new Date(c.publishedResponse.followUpDate).toISOString().split('T')[0]);
          }
        } else {
          setConfirmedDisease(c.aiSuggestedDisease);
          setSeverity(c.priority === 'High' ? 'Severe' : 'Moderate');
          setTreatment('Apply recommended copper fungicide or bio-pesticide spray.');
          setInstructions('Ensure adequate drainage and remove fallen infected foliage.');
        }
      }
    } catch (e) {
      console.warn('Error loading case review:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  // Update Priority / Assignment
  const handleUpdatePriority = async (newPriority: 'Low' | 'Medium' | 'High') => {
    setPriority(newPriority);
    await apiRequest(`/api/officer/cases/${caseId}/status`, {
      method: 'PATCH',
      body: { priority: newPriority },
    });
  };

  // 1. Save Private Draft (CRUD - Save Draft)
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setActionMessage('');
    try {
      const res = await apiRequest(`/api/officer/cases/${caseId}/draft`, {
        method: 'PUT',
        body: {
          confirmedDisease,
          severity,
          treatment,
          instructions,
          followUpDate: followUpDate || undefined,
          expectedVersion: caseData?.version,
        },
      });

      if (res.success) {
        setActionMessage('Private working draft saved securely. (Invisible to farmer)');
        fetchCase();
      } else {
        Alert.alert('Notice', res.message || 'Could not save draft.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Draft save failed.');
    } finally {
      setSavingDraft(false);
    }
  };

  // 2. Discard Draft (CRUD - Delete Draft)
  const handleDiscardDraft = () => {
    Alert.alert('Discard Draft', 'Are you sure you want to discard your private working draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          const res = await apiRequest(`/api/officer/cases/${caseId}/draft`, { method: 'DELETE' });
          if (res.success) {
            setActionMessage('Private draft discarded.');
            fetchCase();
          }
        },
      },
    ]);
  };

  // 3. Publish Expert Advice (CRUD - Publish Response)
  const handlePublish = async () => {
    if (!confirmedDisease.trim() || !treatment.trim() || !instructions.trim()) {
      Alert.alert('Validation Error', 'Please complete the confirmed disease, treatment advice, and instructions before publishing.');
      return;
    }

    setPublishing(true);
    setActionMessage('');
    try {
      const res = await apiRequest(`/api/officer/cases/${caseId}/publish`, {
        method: 'POST',
        body: {
          confirmedDisease: confirmedDisease.trim(),
          severity,
          treatment: treatment.trim(),
          instructions: instructions.trim(),
          followUpDate: followUpDate || undefined,
          expectedVersion: caseData?.version,
        },
      });

      if (res.success) {
        Alert.alert(
          'Advice Published',
          'Official expert response has been published to the farmer and case status is now Resolved.',
          [{ text: 'OK', onPress: () => fetchCase() }]
        );
      } else {
        Alert.alert('Notice', res.message || 'Publishing failed.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Publishing error.');
    } finally {
      setPublishing(false);
    }
  };

  // 4. Edit Published Advice (CRUD - Update Published)
  const handleEditPublished = async () => {
    setPublishing(true);
    try {
      const res = await apiRequest(`/api/officer/cases/${caseId}/published`, {
        method: 'PUT',
        body: {
          confirmedDisease: confirmedDisease.trim(),
          severity,
          treatment: treatment.trim(),
          instructions: instructions.trim(),
          followUpDate: followUpDate || undefined,
        },
      });

      if (res.success) {
        Alert.alert('Updated', 'Published response has been updated.');
        fetchCase();
      }
    } catch (e) {
      console.warn('Update error:', e);
    } finally {
      setPublishing(false);
    }
  };

  // 5. Withdraw Advice & Reopen Case (CRUD - Withdraw & Audit)
  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Advice & Reopen Case',
      t.withdrawConfirm || 'Are you sure you want to withdraw this published response and reopen the case to In Review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw & Reopen',
          style: 'destructive',
          onPress: async () => {
            const res = await apiRequest(`/api/officer/cases/${caseId}/withdraw`, {
              method: 'POST',
              body: { reason: 'Officer withdrew response for re-examination.' },
            });
            if (res.success) {
              Alert.alert('Reopened', 'Response withdrawn. Case is now back In Review.');
              fetchCase();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading case details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!caseData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingBox}>
          <Text style={{ fontSize: 32, marginBottom: 10 }}>⚠</Text>
          <Text style={{ color: colors.textMuted }}>Case record not found.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isResolved = caseData.status === 'Resolved' && caseData.publishedResponse && !caseData.publishedResponse.isWithdrawn;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Text style={styles.headerBackText}>← Queue</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case #{caseData._id.slice(-6).toUpperCase()}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 4 · EXPERT DIAGNOSIS & RESPONSE MANAGEMENT</Text>
        </View>

        {/* Farmer Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>FARMER CASE DETAILS</Text>
          <Text style={styles.farmerTitle}>{caseData.farmerName}</Text>
          <Text style={styles.farmerSub}>
            📍 {caseData.location} ({caseData.district}) · 📞 {caseData.farmerPhone || 'N/A'}
          </Text>
          <Text style={styles.officeSub}>🏛 Office: {caseData.office}</Text>

          <View style={styles.symptomsBox}>
            <Text style={styles.symptomsLabel}>Farmer's Reported Symptoms:</Text>
            <Text style={styles.symptomsText}>"{caseData.farmerNotes}"</Text>
          </View>
        </View>

        {/* Plant Leaf Image & AI Suggestion */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>LINKED CROP PHOTOGRAPH & AI RESULT</Text>
          {caseData.imageUrl ? (
            <Image
              source={{ uri: `${API_BASE_URL}${caseData.imageUrl}` }}
              style={styles.leafImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.missingImageBox}>
              <Text style={{ fontSize: 30 }}>🍃</Text>
              <Text style={styles.missingImageText}>No image provided</Text>
            </View>
          )}

          <View style={styles.aiSuggestionBox}>
            <View style={styles.aiRow}>
              <Text style={styles.aiCropText}>{caseData.crop}</Text>
              <Text style={styles.aiConfidenceText}>{caseData.aiConfidence}% AI Confidence</Text>
            </View>
            <Text style={styles.aiDiseaseText}>{caseData.aiSuggestedDisease}</Text>
          </View>
        </View>

        {/* Priority Selector */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>SET CASE PRIORITY</Text>
          <View style={styles.prioritySelectorRow}>
            {(['Low', 'Medium', 'High'] as const).map((pr) => (
              <TouchableOpacity
                key={pr}
                style={[
                  styles.priorityBtn,
                  priority === pr && (pr === 'High' ? styles.prHighActive : pr === 'Medium' ? styles.prMedActive : styles.prLowActive),
                ]}
                onPress={() => handleUpdatePriority(pr)}
              >
                <Text style={[styles.priorityBtnText, priority === pr && styles.priorityBtnTextActive]}>
                  {pr} Priority
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Notice */}
        {actionMessage ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>✓ {actionMessage}</Text>
          </View>
        ) : null}

        {/* Officer Response Form: Private Draft / Published Form */}
        <View style={styles.card}>
          <View style={styles.responseHeaderRow}>
            <Text style={styles.cardSectionLabel}>
              {isResolved ? 'PUBLISHED EXPERT ADVICE' : t.draftSectionTitle}
            </Text>
            <View style={styles.privateTag}>
              <Text style={styles.privateTagText}>
                {isResolved ? 'RESOLVED & PUBLISHED' : 'PRIVATE DRAFT'}
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Confirmed Disease Diagnosis *</Text>
          <TextInput
            style={styles.input}
            value={confirmedDisease}
            onChangeText={setConfirmedDisease}
            placeholder="e.g. Early Blight (Alternaria solani)"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.fieldLabel}>Confirmed Severity</Text>
          <View style={styles.severityRow}>
            {(['Mild', 'Moderate', 'Severe'] as const).map((sev) => (
              <TouchableOpacity
                key={sev}
                style={[styles.sevChip, severity === sev && styles.sevChipActive]}
                onPress={() => setSeverity(sev)}
              >
                <Text style={[styles.sevChipText, severity === sev && styles.sevChipTextActive]}>
                  {sev}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Treatment Recommendation *</Text>
          <TextInput
            style={styles.textArea}
            value={treatment}
            onChangeText={setTreatment}
            multiline
            numberOfLines={3}
            placeholder="Specify biological treatments, fungicides, or cultural measures..."
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.fieldLabel}>Farmer Instructions & Prevention Tips *</Text>
          <TextInput
            style={styles.textArea}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
            placeholder="Field hygiene, watering adjustments, crop rotation..."
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.fieldLabel}>Recommended Follow-Up Date (Optional)</Text>
          <TextInput
            style={styles.input}
            value={followUpDate}
            onChangeText={setFollowUpDate}
            placeholder="YYYY-MM-DD (e.g. 2026-10-25)"
            placeholderTextColor="#9ca3af"
          />

          {/* Action Buttons */}
          <View style={styles.responseActionsGroup}>
            {!isResolved ? (
              <>
                <TouchableOpacity
                  style={[styles.saveDraftBtn, savingDraft && styles.disabledBtn]}
                  onPress={handleSaveDraft}
                  disabled={savingDraft || publishing}
                >
                  {savingDraft ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Text style={styles.saveDraftBtnText}>💾 {t.saveDraftBtn}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.publishBtn, publishing && styles.disabledBtn]}
                  onPress={handlePublish}
                  disabled={publishing || savingDraft}
                >
                  {publishing ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.publishBtnText}>🚀 {t.publishResponseBtn}</Text>
                  )}
                </TouchableOpacity>

                {caseData.privateDraft && (
                  <TouchableOpacity style={styles.discardBtn} onPress={handleDiscardDraft}>
                    <Text style={styles.discardBtnText}>🗑 {t.discardDraftBtn}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.publishBtn}
                  onPress={handleEditPublished}
                  disabled={publishing}
                >
                  <Text style={styles.publishBtnText}>✏ {t.editPublishedBtn}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.withdrawBtn}
                  onPress={handleWithdraw}
                >
                  <Text style={styles.withdrawBtnText}>↩ {t.withdrawResponseBtn}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Audit Trail Section */}
        {caseData.auditTrail && caseData.auditTrail.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>CASE AUDIT HISTORY</Text>
            {caseData.auditTrail.map((ev, idx) => (
              <View key={idx} style={styles.auditItem}>
                <View style={styles.auditDot} />
                <View style={styles.auditDetails}>
                  <Text style={styles.auditAction}>{ev.action}</Text>
                  <Text style={styles.auditAuthor}>
                    By {ev.by.name} ({ev.by.role}) · {new Date(ev.timestamp).toLocaleString()}
                  </Text>
                  {ev.note ? <Text style={styles.auditNote}>"{ev.note}"</Text> : null}
                </View>
              </View>
            ))}
          </View>
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  farmerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  farmerSub: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  officeSub: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  symptomsBox: {
    backgroundColor: '#f9fbf8',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  symptomsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: 13,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  leafImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  missingImageBox: {
    height: 120,
    backgroundColor: '#f0f3ef',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  missingImageText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  aiSuggestionBox: {
    backgroundColor: '#f9fbf8',
    borderRadius: 12,
    padding: 12,
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  aiCropText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  aiConfidenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  aiDiseaseText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f6f7f5',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  prHighActive: {
    backgroundColor: '#ffebeb',
    borderColor: '#ffc8be',
  },
  prMedActive: {
    backgroundColor: '#fff5db',
    borderColor: '#edd395',
  },
  prLowActive: {
    backgroundColor: '#eaf4eb',
    borderColor: '#cce2d2',
  },
  priorityBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  priorityBtnTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  noticeBox: {
    backgroundColor: colors.successLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  noticeText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  responseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  privateTag: {
    backgroundColor: '#eff5df',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  privateTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fbf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sevChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f6f7f5',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sevChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sevChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  sevChipTextActive: {
    color: '#ffffff',
  },
  textArea: {
    backgroundColor: '#f9fbf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  responseActionsGroup: {
    marginTop: 18,
    gap: 10,
  },
  saveDraftBtn: {
    backgroundColor: '#eaf4eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveDraftBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  publishBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  publishBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  withdrawBtn: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#ffc8be',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  withdrawBtnText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  discardBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  discardBtnText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  auditItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  auditDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  auditDetails: {
    flex: 1,
  },
  auditAction: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  auditAuthor: {
    fontSize: 11,
    color: colors.textMuted,
  },
  auditNote: {
    fontSize: 12,
    color: colors.text,
    fontStyle: 'italic',
    marginTop: 2,
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
  backBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
