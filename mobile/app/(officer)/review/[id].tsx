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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { apiRequest, API_BASE_URL } from '../../../src/api/client';
import { ConsultationCase, CasePriority } from '../../../src/types';

export default function OfficerCaseReviewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const caseId = id as string;

  const [caseData, setCaseData] = useState<ConsultationCase | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Dossier Tab
  const [activeTab, setActiveTab] = useState<'prescription' | 'specimen' | 'audit'>('prescription');

  // Editable prescription fields
  const [confirmedDisease, setConfirmedDisease] = useState('');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [treatment, setTreatment] = useState('');
  const [instructions, setInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Priority control
  const [priority, setPriority] = useState<CasePriority>('Medium');

  // Button state flags
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Image zoom modal
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Common quick-fill pathogens
  const commonPathogens = [
    'Early Blight (Alternaria solani)',
    'Late Blight (Phytophthora infestans)',
    'Bacterial Wilt (Ralstonia solanacearum)',
    'Tomato Yellow Leaf Curl Virus (TYLCV)',
    'Paddy Blast (Magnaporthe oryzae)',
    'Chilli Anthracnose (Colletotrichum)',
    'Potato Powdery Mildew',
  ];

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
          setConfirmedDisease(c.aiSuggestedDisease || 'Early Blight (Alternaria solani)');
          setSeverity(c.priority === 'High' ? 'Severe' : 'Moderate');
          setTreatment('Apply Mancozeb 75% WP @ 2.5g/L or Copper Oxychloride 50 WP. Alternate with bio-fungicide Trichoderma harzianum.');
          setInstructions('Inspect lower canopy leaves daily. Discard infected foliage in sealed bags. Improve furrow drainage to reduce humidity.');
          const defaultFollowUp = new Date();
          defaultFollowUp.setDate(defaultFollowUp.getDate() + 10);
          setFollowUpDate(defaultFollowUp.toISOString().split('T')[0]);
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

  // Update Priority
  const handleUpdatePriority = async (newPriority: CasePriority) => {
    setPriority(newPriority);
    try {
      await apiRequest(`/api/officer/cases/${caseId}/status`, {
        method: 'PATCH',
        body: { priority: newPriority },
      });
      fetchCase();
    } catch (e) {
      console.warn('Failed to update priority:', e);
    }
  };

  // 1. Save Private Draft (CRUD - Save Draft)
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setActionNotice(null);
    try {
      const res = await apiRequest(`/api/officer/cases/${caseId}/draft`, {
        method: 'PUT',
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
        setActionNotice('Confidential working draft saved. Not visible to farmer.');
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
    Alert.alert('Discard Working Draft', 'Are you sure you want to discard your private working draft notes?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          const res = await apiRequest(`/api/officer/cases/${caseId}/draft`, { method: 'DELETE' });
          if (res.success) {
            setActionNotice('Working draft discarded.');
            fetchCase();
          }
        },
      },
    ]);
  };

  // 3. Publish Official Advice (CRUD - Publish Response)
  const handlePublish = async () => {
    if (!confirmedDisease.trim() || !treatment.trim() || !instructions.trim()) {
      Alert.alert(
        'Missing Information',
        'Please complete the confirmed disease name, treatment recommendations, and field instructions before publishing.'
      );
      return;
    }

    setPublishing(true);
    setActionNotice(null);
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
          'Prescription Published',
          'Official agricultural advice has been signed and released to the farmer. Case status updated to Resolved.',
          [{ text: 'OK', onPress: () => fetchCase() }]
        );
      } else {
        Alert.alert('Publishing Notice', res.message || 'Failed to publish.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error occurred while publishing.');
    } finally {
      setPublishing(false);
    }
  };

  // 4. Update Published Advice (CRUD - Update Published)
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
        Alert.alert('Advice Updated', 'The published agronomic response has been updated.');
        fetchCase();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update published advice.');
    } finally {
      setPublishing(false);
    }
  };

  // 5. Withdraw Advice & Reopen (CRUD - Withdraw & Audit)
  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Official Advice & Reopen',
      'Are you sure you want to withdraw this published advice? The case will transition back to "In Review" and the action will be permanently logged in the audit ledger.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw & Reopen',
          style: 'destructive',
          onPress: async () => {
            setWithdrawing(true);
            try {
              const res = await apiRequest(`/api/officer/cases/${caseId}/withdraw`, {
                method: 'POST',
                body: { reason: 'Officer withdrew response for clinical re-examination and prescription refinement.' },
              });
              if (res.success) {
                Alert.alert('Case Reopened', 'Official response revoked. Case is now In Review.');
                fetchCase();
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not withdraw advice.');
            } finally {
              setWithdrawing(false);
            }
          },
        },
      ]
    );
  };

  const handleQuickFollowUp = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator color="#059669" size="large" />
          <Text style={styles.loadingText}>Retrieving official case dossier...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!caseData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>⚠</Text>
          <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: '700' }}>Case record not found.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Return to Triage Queue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isResolved = caseData.status === 'Resolved';
  const hasDraft = Boolean(caseData.privateDraft);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Dossier Bar */}
      <View style={styles.dossierBar}>
        <TouchableOpacity style={styles.backArrowBtn} onPress={() => router.back()}>
          <Text style={styles.backArrowText}>← Triage</Text>
        </TouchableOpacity>

        <View style={styles.dossierBarTitle}>
          <Text style={styles.dossierTitle}>CASE DOSSIER #{caseData._id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.dossierSubtitle}>
            {caseData.crop.toUpperCase()} · {caseData.farmerName} · {caseData.district || 'Central'}
          </Text>
        </View>

        <View style={styles.statusPillSmall}>
          <Text style={styles.statusPillSmallText}>{caseData.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Navigation Dossier Tabs */}
      <View style={styles.tabsHeader}>
        <TouchableOpacity
          style={[styles.dossierTab, activeTab === 'prescription' && styles.dossierTabActive]}
          onPress={() => setActiveTab('prescription')}
        >
          <Text style={[styles.dossierTabText, activeTab === 'prescription' && styles.dossierTabTextActive]}>
            ✍️ Prescription Studio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dossierTab, activeTab === 'specimen' && styles.dossierTabActive]}
          onPress={() => setActiveTab('specimen')}
        >
          <Text style={[styles.dossierTabText, activeTab === 'specimen' && styles.dossierTabTextActive]}>
            🍃 Farmer Specimen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dossierTab, activeTab === 'audit' && styles.dossierTabActive]}
          onPress={() => setActiveTab('audit')}
        >
          <Text style={[styles.dossierTabText, activeTab === 'audit' && styles.dossierTabTextActive]}>
            📜 Audit Ledger ({caseData.auditTrail?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notice alert */}
        {actionNotice ? (
          <View style={styles.actionNoticeBox}>
            <Text style={styles.actionNoticeText}>✓ {actionNotice}</Text>
          </View>
        ) : null}

        {/* TAB 1: PRESCRIPTION STUDIO */}
        {activeTab === 'prescription' && (
          <View>
            {/* Urgency & Assignment Bar */}
            <View style={styles.triageMetaCard}>
              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaFieldLabel}>CASE URGENCY LEVEL</Text>
                  <View style={styles.prioritySelectorRow}>
                    {(['Low', 'Medium', 'High'] as CasePriority[]).map((pr) => (
                      <TouchableOpacity
                        key={pr}
                        style={[
                          styles.priorityOption,
                          priority === pr && (pr === 'High' ? styles.prHigh : pr === 'Medium' ? styles.prMed : styles.prLow),
                        ]}
                        onPress={() => handleUpdatePriority(pr)}
                      >
                        <Text style={[styles.priorityOptionText, priority === pr && styles.priorityOptionTextActive]}>
                          {pr === 'High' ? '🚨 High' : pr === 'Medium' ? '⚡ Med' : '🌱 Low'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.metaDivider} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.metaFieldLabel}>OFFICIAL ASSIGNMENT</Text>
                  <Text style={styles.officerAssignedName}>
                    {caseData.assignedOfficerName || 'Assigned to: ' + (user?.fullName || 'Current Officer')}
                  </Text>
                  <Text style={styles.versionTag}>Dossier Version: v{caseData.version}</Text>
                </View>
              </View>
            </View>

            {/* Prescribed Diagnosis Card */}
            <View style={styles.formCard}>
              <View style={styles.formCardHeader}>
                <Text style={styles.formCardTitle}>1. CONFIRMED PATHOGEN DIAGNOSIS</Text>
                <View style={styles.aiTag}>
                  <Text style={styles.aiTagText}>AI: {caseData.aiSuggestedDisease}</Text>
                </View>
              </View>

              <TextInput
                style={styles.textInput}
                value={confirmedDisease}
                onChangeText={setConfirmedDisease}
                placeholder="Enter confirmed scientific pathogen name..."
                placeholderTextColor="#94a3b8"
              />

              {/* Quick Pathogen Chips */}
              <Text style={styles.quickChipsLabel}>Quick Standard Pathogens:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsScroll}>
                {commonPathogens.map((cp) => (
                  <TouchableOpacity
                    key={cp}
                    style={styles.quickChip}
                    onPress={() => setConfirmedDisease(cp)}
                  >
                    <Text style={styles.quickChipText}>{cp}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Severity Rating */}
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>2. CLINICAL SEVERITY ASSESSMENT</Text>
              <View style={styles.severityGrid}>
                {[
                  { level: 'Mild', desc: 'Under 10% canopy infection' },
                  { level: 'Moderate', desc: '10%–35% foliage lesions' },
                  { level: 'Severe', desc: '35%+ or systemic wilt' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.level}
                    style={[
                      styles.severityCard,
                      severity === item.level && styles.severityCardActive,
                    ]}
                    onPress={() => setSeverity(item.level as any)}
                  >
                    <Text style={[styles.severityTitle, severity === item.level && styles.severityTitleActive]}>
                      {item.level}
                    </Text>
                    <Text style={[styles.severityDesc, severity === item.level && styles.severityDescActive]}>
                      {item.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Treatment Prescription */}
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>3. CHEMICAL & BIOLOGICAL TREATMENT PRESCRIPTION</Text>
              <Text style={styles.formCardHelp}>
                Specify active ingredients, application dosage (e.g. g/L), spraying frequency, and withholding intervals.
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={treatment}
                onChangeText={setTreatment}
                placeholder="Enter treatment regimen, fungicide/pesticide dosage, and schedule..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Cultural & Field Instructions */}
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>4. FIELD MANAGEMENT & HYGIENE INSTRUCTIONS</Text>
              <Text style={styles.formCardHelp}>
                Water management, eradication of infected leaves, pruning, crop spacing, and biological barrier advice.
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={instructions}
                onChangeText={setInstructions}
                placeholder="Enter field sanitation and preventive instructions..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Scheduled Follow-up Date */}
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>5. RECOMMENDED FIELD INSPECTION / FOLLOW-UP DATE</Text>
              <View style={styles.dateRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={followUpDate}
                  onChangeText={setFollowUpDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickFollowUp(7)}>
                  <Text style={styles.quickDateBtnText}>+7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickFollowUp(14)}>
                  <Text style={styles.quickDateBtnText}>+14 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickFollowUp(30)}>
                  <Text style={styles.quickDateBtnText}>+30 Days</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons Studio */}
            <View style={styles.actionsCard}>
              <Text style={styles.actionsHeader}>DEPARTMENT ACTION CONSOLE</Text>

              {/* Draft Status Banner */}
              {hasDraft && !isResolved && (
                <View style={styles.draftStatusBanner}>
                  <Text style={styles.draftStatusText}>
                    🔒 You have an active confidential working draft saved for this case.
                  </Text>
                </View>
              )}

              {/* 1. Save Confidential Draft & Discard Row */}
              <View style={styles.draftActionRow}>
                <TouchableOpacity
                  style={styles.saveDraftBtn}
                  onPress={handleSaveDraft}
                  disabled={savingDraft || publishing}
                >
                  <Text style={styles.saveDraftBtnText}>
                    {savingDraft ? 'Saving Draft...' : '🔒 Save Confidential Draft'}
                  </Text>
                </TouchableOpacity>

                {hasDraft && (
                  <TouchableOpacity style={styles.discardDraftBtn} onPress={handleDiscardDraft}>
                    <Text style={styles.discardDraftBtnText}>Discard</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 2. Official Publication Button */}
              {!isResolved ? (
                <TouchableOpacity
                  style={styles.publishOfficialBtn}
                  onPress={handlePublish}
                  disabled={publishing || savingDraft}
                >
                  <Text style={styles.publishOfficialBtnText}>
                    {publishing ? 'Publishing Prescription...' : '🏛 Publish Official Prescription to Farmer →'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.resolvedActions}>
                  <TouchableOpacity
                    style={styles.editPublishedBtn}
                    onPress={handleEditPublished}
                    disabled={publishing}
                  >
                    <Text style={styles.editPublishedBtnText}>
                      {publishing ? 'Updating...' : '✎ Update Published Prescription'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.withdrawBtn}
                    onPress={handleWithdraw}
                    disabled={withdrawing}
                  >
                    <Text style={styles.withdrawBtnText}>
                      {withdrawing ? 'Revoking...' : '↺ Revoke & Reopen Case'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB 2: SPECIMEN & FARMER OBSERVATIONS */}
        {activeTab === 'specimen' && (
          <View style={styles.specimenTabContainer}>
            {/* Leaf Image Card */}
            <View style={styles.specimenCard}>
              <Text style={styles.specimenCardTitle}>FARMER SPECIMEN PHOTOGRAPH</Text>
              <View style={styles.specimenFrame}>
                {caseData.imageUrl ? (
                  <TouchableOpacity onPress={() => setImageModalOpen(true)} activeOpacity={0.9}>
                    <Image
                      source={{ uri: `${API_BASE_URL}${caseData.imageUrl}` }}
                      style={styles.specimenImage}
                      resizeMode="cover"
                    />
                    <View style={styles.expandOverlay}>
                      <Text style={styles.expandOverlayText}>🔍 Tap to View Full High-Res Specimen</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noSpecimenBox}>
                    <Text style={{ fontSize: 36 }}>🍃</Text>
                    <Text style={{ color: '#94a3b8', marginTop: 8 }}>No leaf photograph attached</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Farmer Submission Details Card */}
            <View style={styles.specimenCard}>
              <Text style={styles.specimenCardTitle}>FARMER FIELD CONTEXT</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Farmer Full Name:</Text>
                <Text style={styles.detailValue}>{caseData.farmerName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Crop Variety:</Text>
                <Text style={styles.detailValue}>{caseData.crop}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Farm Location:</Text>
                <Text style={styles.detailValue}>
                  {caseData.location} · {caseData.district || 'Central District'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Extension Office:</Text>
                <Text style={styles.detailValue}>{caseData.office || 'Agrarian Services Centre'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Submitted Timestamp:</Text>
                <Text style={styles.detailValue}>{new Date(caseData.createdAt).toLocaleString()}</Text>
              </View>

              <View style={styles.fieldNotesBox}>
                <Text style={styles.fieldNotesLabel}>Farmer's Reported Symptoms:</Text>
                <Text style={styles.fieldNotesText}>
                  {caseData.farmerNotes ? `"${caseData.farmerNotes}"` : 'No additional field notes provided by farmer.'}
                </Text>
              </View>
            </View>

            {/* AI Diagnostic Confidence Card */}
            <View style={styles.specimenCard}>
              <Text style={styles.specimenCardTitle}>AI DIAGNOSTIC INFERENCE METRICS</Text>
              <View style={styles.aiMetricRow}>
                <View>
                  <Text style={styles.aiPathogen}>{caseData.aiSuggestedDisease}</Text>
                  <Text style={styles.aiCropMatch}>Predicted for Crop: {caseData.crop}</Text>
                </View>
                <View style={styles.aiConfidenceBadge}>
                  <Text style={styles.aiConfidenceText}>94% MATCH</Text>
                </View>
              </View>
              <Text style={styles.aiDisclaim}>
                * Automated computer vision inference engine. Must be verified and confirmed by an authorized Agricultural Officer prior to farmer treatment.
              </Text>
            </View>
          </View>
        )}

        {/* TAB 3: AUDIT LEDGER */}
        {activeTab === 'audit' && (
          <View style={styles.auditContainer}>
            <View style={styles.auditHeaderCard}>
              <Text style={styles.auditHeaderTitle}>OFFICIAL REGISTRATION & AUDIT TRAIL</Text>
              <Text style={styles.auditHeaderSub}>
                Every state transition, draft update, and advice publication is permanently recorded in the immutable audit ledger.
              </Text>
            </View>

            {caseData.auditTrail && caseData.auditTrail.length > 0 ? (
              caseData.auditTrail.map((entry, idx) => (
                <View key={idx} style={styles.auditItem}>
                  <View style={styles.auditLineLeft}>
                    <View style={styles.auditDot} />
                    {idx < (caseData.auditTrail?.length ?? 0) - 1 && <View style={styles.auditConnector} />}
                  </View>
                  <View style={styles.auditItemContent}>
                    <View style={styles.auditActionRow}>
                      <Text style={styles.auditAction}>{entry.action}</Text>
                      <Text style={styles.auditTime}>{new Date(entry.timestamp).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.auditActor}>
                      By: {entry.by?.name} ({entry.by?.role})
                    </Text>
                    {entry.note ? <Text style={styles.auditNote}>"{entry.note}"</Text> : null}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={{ color: '#94a3b8' }}>No audit trail entries found.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Full Image Modal */}
      <Modal visible={imageModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setImageModalOpen(false)}>
            <Text style={styles.modalCloseBtnText}>✕ Close</Text>
          </TouchableOpacity>
          {caseData.imageUrl ? (
            <Image
              source={{ uri: `${API_BASE_URL}${caseData.imageUrl}` }}
              style={styles.modalFullImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  dossierBar: {
    backgroundColor: '#090d16',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backArrowBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backArrowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34d399',
  },
  dossierBarTitle: {
    alignItems: 'center',
  },
  dossierTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  dossierSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusPillSmall: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  statusPillSmallText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#34d399',
  },
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dossierTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  dossierTabActive: {
    borderBottomColor: '#10b981',
    backgroundColor: '#0f172a',
  },
  dossierTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  dossierTabTextActive: {
    color: '#34d399',
    fontWeight: '900',
  },
  content: {
    backgroundColor: '#f8fafc',
    padding: 16,
    paddingBottom: 60,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 14,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  actionNoticeBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  actionNoticeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  triageMetaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityOption: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  prHigh: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  prMed: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  prLow: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  priorityOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  priorityOptionTextActive: {
    fontWeight: '900',
    color: '#0f172a',
  },
  metaDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#cbd5e1',
  },
  officerAssignedName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  versionTag: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  formCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  formCardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.6,
  },
  aiTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  aiTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  formCardHelp: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
    lineHeight: 15,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quickChipsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    marginTop: 10,
    marginBottom: 6,
  },
  quickChipsScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  quickChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  severityGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  severityCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  severityCardActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  severityTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#334155',
  },
  severityTitleActive: {
    color: '#34d399',
  },
  severityDesc: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 3,
  },
  severityDescActive: {
    color: '#e2e8f0',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  quickDateBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  quickDateBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  actionsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginTop: 6,
  },
  actionsHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  draftStatusBanner: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  draftStatusText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '700',
  },
  draftActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  saveDraftBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveDraftBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  discardDraftBtn: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  discardDraftBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fca5a5',
  },
  publishOfficialBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  publishOfficialBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  resolvedActions: {
    gap: 10,
  },
  editPublishedBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editPublishedBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  withdrawBtn: {
    backgroundColor: '#b91c1c',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  withdrawBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  specimenTabContainer: {
    gap: 14,
  },
  specimenCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  specimenCardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  specimenFrame: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  specimenImage: {
    width: '100%',
    height: '100%',
  },
  expandOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  expandOverlayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  noSpecimenBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  fieldNotesBox: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  fieldNotesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 4,
  },
  fieldNotesText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#1e293b',
    lineHeight: 18,
  },
  aiMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  aiPathogen: {
    fontSize: 13,
    fontWeight: '900',
    color: '#065f46',
  },
  aiCropMatch: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  aiConfidenceBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aiConfidenceText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
  },
  aiDisclaim: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 10,
    lineHeight: 14,
  },
  auditContainer: {
    gap: 12,
  },
  auditHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  auditHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.6,
  },
  auditHeaderSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  auditItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  auditLineLeft: {
    width: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  auditDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
    marginTop: 4,
  },
  auditConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
  },
  auditItemContent: {
    flex: 1,
  },
  auditActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditAction: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  auditTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  auditActor: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  auditNote: {
    fontSize: 11,
    color: '#334155',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalFullImage: {
    width: '100%',
    height: '75%',
  },
});
