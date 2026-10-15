import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiRequest, API_BASE_URL } from '../../src/api/client';
import { DiagnosisResult } from '../../src/types';
import { colors } from '../../src/theme/colors';

export default function DiagnosisResultScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  const diagnosisId = (params.diagnosisId as string) || '';

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [farmerNotes, setFarmerNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchDiagnosis = async () => {
      if (!diagnosisId) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiRequest<{ diagnosis: DiagnosisResult }>(`/api/diagnosis/${diagnosisId}`);
        if (res.success && res.data?.diagnosis) {
          setDiagnosis(res.data.diagnosis);
          setFarmerNotes(res.data.diagnosis.farmerNotes || '');
        }
      } catch (err) {
        console.error('Failed to load diagnosis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnosis();
  }, [diagnosisId]);

  // Update farmer observations
  const handleUpdateNotes = async () => {
    if (!diagnosisId) return;
    setSavingNotes(true);
    try {
      const res = await apiRequest(`/api/diagnosis/${diagnosisId}/notes`, {
        method: 'PATCH',
        body: { farmerNotes },
      });
      if (res.success) {
        Alert.alert('Saved', 'Your observations have been updated.');
      }
    } catch (e) {
      console.warn('Error saving notes:', e);
    } finally {
      setSavingNotes(false);
    }
  };

  // Save to History (Member 3 entity)
  const handleSaveToHistory = async () => {
    if (!diagnosisId) return;
    setSavingRecord(true);
    try {
      const res = await apiRequest('/api/saved-diagnoses', {
        method: 'POST',
        body: {
          diagnosisId,
          personalObservations: farmerNotes,
        },
      });
      if (res.success) {
        setSaveSuccess(true);
        Alert.alert('Saved', 'This diagnosis has been added to your Saved Diagnoses history.');
      } else {
        Alert.alert('Notice', res.message || 'Could not save record.');
      }
    } catch (e) {
      console.warn('Error saving diagnosis:', e);
    } finally {
      setSavingRecord(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Retrieving diagnosis outcome...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!diagnosis) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 40 }}>🍃</Text>
          <Text style={styles.emptyText}>No diagnosis record found.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(farmer)')}>
            <Text style={styles.primaryButtonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isSevere = diagnosis.severity === 'Severe';
  const isHealthy = diagnosis.severity === 'Healthy';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(farmer)')}>
          <Text style={styles.backText}>← {t.home}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.resultTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Workload Tag */}
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 2 · DIAGNOSIS RESULTS & SEVERITY</Text>
        </View>

        {/* Mock Mode Explicit Label */}
        <View style={[styles.badgeBanner, diagnosis.isMock ? styles.mockBanner : styles.realBanner]}>
          <Text style={[styles.badgeBannerText, diagnosis.isMock ? styles.mockBannerText : styles.realBannerText]}>
            {diagnosis.isMock ? `⚡ ${t.mockBadge}` : `● ${t.realBadge}`}
          </Text>
        </View>

        {/* Diagnosis Header Card */}
        <View style={styles.resultCard}>
          {diagnosis.imageUrl ? (
            <Image
              source={{ uri: `${API_BASE_URL}${diagnosis.imageUrl}` }}
              style={styles.leafPhoto}
              resizeMode="cover"
            />
          ) : null}

          <View style={styles.resultDetails}>
            <View style={styles.cropRow}>
              <Text style={styles.cropName}>{diagnosis.crop}</Text>
              <View
                style={[
                  styles.severityBadge,
                  isSevere ? styles.severitySevere : isHealthy ? styles.severityHealthy : styles.severityModerate,
                ]}
              >
                <Text
                  style={[
                    styles.severityText,
                    isSevere ? styles.textSevere : isHealthy ? styles.textHealthy : styles.textModerate,
                  ]}
                >
                  {diagnosis.severity}
                </Text>
              </View>
            </View>

            <Text style={styles.diseaseName}>{diagnosis.disease}</Text>

            {/* Confidence Bar */}
            <View style={styles.confidenceSection}>
              <View style={styles.confidenceLabelRow}>
                <Text style={styles.confidenceLabel}>{t.confidence}</Text>
                <Text style={styles.confidenceValue}>{diagnosis.confidence}%</Text>
              </View>
              <View style={styles.confidenceTrack}>
                <View style={[styles.confidenceFill, { width: `${diagnosis.confidence}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Symptoms Section */}
        {diagnosis.symptoms && diagnosis.symptoms.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>{t.symptoms}</Text>
            {diagnosis.symptoms.map((symptom, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{symptom}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Causes Section */}
        {diagnosis.causes && diagnosis.causes.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>{t.causes}</Text>
            {diagnosis.causes.map((cause, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{cause}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Personal Observations / Field Notes (CRUD - Update) */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeader}>{t.personalObservations}</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Record when symptoms started, affected rows, watering conditions..."
            placeholderTextColor="#9ca3af"
            value={farmerNotes}
            onChangeText={setFarmerNotes}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.saveNotesBtn}
            onPress={handleUpdateNotes}
            disabled={savingNotes}
          >
            {savingNotes ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.saveNotesBtnText}>💾 Update Observations</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Action Shortcuts */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, saveSuccess && styles.savedBtnSuccess]}
            onPress={handleSaveToHistory}
            disabled={savingRecord || saveSuccess}
          >
            {savingRecord ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {saveSuccess ? '✓ Diagnosis Saved' : `▤ ${t.saveDiagnosisBtn}`}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.treatmentButton}
            onPress={() =>
              router.push({
                pathname: '/(farmer)/treatment',
                params: { diagnosisId: diagnosis._id },
              })
            }
          >
            <Text style={styles.treatmentButtonText}>🌱 {t.treatmentBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.consultButton}
            onPress={() =>
              router.push({
                pathname: '/(farmer)/consult',
                params: {
                  diagnosisId: diagnosis._id,
                  crop: diagnosis.crop,
                  disease: diagnosis.disease,
                  severity: diagnosis.severity,
                  confidence: diagnosis.confidence.toString(),
                  imageUrl: diagnosis.imageUrl,
                },
              })
            }
          >
            <Text style={styles.consultButtonText}>👨‍🌾 {t.consultOfficerBtn}</Text>
          </TouchableOpacity>
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
    marginBottom: 10,
  },
  memberTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  badgeBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  badgeBannerText: {
    fontSize: 11,
    fontWeight: '800',
  },
  mockBanner: {
    backgroundColor: '#fff4db',
    borderWidth: 1,
    borderColor: '#edd395',
  },
  mockBannerText: {
    color: '#8a5a10',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  realBanner: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: '#bfe3be',
  },
  realBannerText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  leafPhoto: {
    width: '100%',
    height: 180,
  },
  resultDetails: {
    padding: 18,
  },
  cropRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cropName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severitySevere: {
    backgroundColor: '#ffebeb',
  },
  severityModerate: {
    backgroundColor: '#fff5db',
  },
  severityHealthy: {
    backgroundColor: '#eaf5eb',
  },
  severityText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textSevere: {
    color: colors.danger,
  },
  textModerate: {
    color: '#8a5a10',
  },
  textHealthy: {
    color: colors.primary,
  },
  diseaseName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  confidenceSection: {
    marginTop: 4,
  },
  confidenceLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  confidenceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  confidenceTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eaf0e7',
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bulletPoint: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  notesInput: {
    backgroundColor: '#f9fbf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 70,
    marginBottom: 10,
  },
  saveNotesBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#eaf4eb',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveNotesBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
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
  savedBtnSuccess: {
    backgroundColor: '#3f7849',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  treatmentButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  treatmentButtonText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  consultButton: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#e8dcba',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  consultButtonText: {
    color: '#8a5a10',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginVertical: 16,
    fontSize: 14,
    color: colors.textMuted,
  },
});
