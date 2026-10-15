import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/api/client';
import { colors } from '../../src/theme/colors';

export default function ConsultScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();

  const diagnosisId = (params.diagnosisId as string) || '';
  const crop = (params.crop as string) || 'Tomato';
  const disease = (params.disease as string) || 'Early Blight';
  const severity = (params.severity as string) || 'Moderate';
  const confidence = (params.confidence as string) || '88';

  const [farmerNotes, setFarmerNotes] = useState('');
  const [location, setLocation] = useState(user?.district ? `${user.district} North` : 'Peradeniya, Kandy');
  const [district, setDistrict] = useState(user?.district || 'Kandy');
  const [office, setOffice] = useState('Kandy Agricultural Office');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const officeOptions = [
    'Kandy Agricultural Office',
    'Gampaha Agricultural Office',
    'Galle Agricultural Office',
    'Matale Extension Centre',
    'Nuwara Eliya Regional Unit',
  ];

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!farmerNotes.trim() || !location.trim()) {
      setErrorMessage('Please describe the symptoms and provide your location.');
      return;
    }

    if (!diagnosisId) {
      setErrorMessage('No active diagnosis record linked. Please run a plant diagnosis first.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/api/consultations', {
        method: 'POST',
        body: {
          diagnosisId,
          farmerNotes: farmerNotes.trim(),
          location: location.trim(),
          district: district.trim(),
          office,
          idempotencyKey: `consult-${diagnosisId}-${Date.now()}`,
        },
      });

      if (res.success) {
        Alert.alert(
          'Consultation Submitted',
          t.consultSuccess || 'Your case has been queued for an agricultural extension officer review.',
          [{ text: 'View My Cases', onPress: () => router.replace('/(farmer)/cases') }]
        );
      } else {
        setErrorMessage(res.message || 'Submission failed.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← {t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.consultTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 3 · EXPERT CONSULTATION</Text>
        </View>

        <Text style={styles.title}>{t.consultTitle}</Text>
        <Text style={styles.sub}>{t.consultSubtitle}</Text>

        {/* Linked AI Diagnosis Card */}
        <View style={styles.linkedCard}>
          <Text style={styles.linkedLabel}>LINKED CROP DIAGNOSIS</Text>
          <Text style={styles.linkedCrop}>{crop} · {disease}</Text>
          <Text style={styles.linkedMeta}>Severity: {severity} · Model Confidence: {confidence}%</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {errorMessage}</Text>
          </View>
        ) : null}

        {/* Symptoms / Notes Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Symptoms & Field Observations *</Text>
          <TextInput
            style={styles.textArea}
            placeholder={t.farmerNotesPlaceholder}
            placeholderTextColor="#9ca3af"
            value={farmerNotes}
            onChangeText={setFarmerNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Location / Village Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farm Location / Village *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Peradeniya, Gannoruwa"
            placeholderTextColor="#9ca3af"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* District Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>District *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Kandy, Gampaha, Galle"
            placeholderTextColor="#9ca3af"
            value={district}
            onChangeText={setDistrict}
          />
        </View>

        {/* Agricultural Extension Office Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t.selectOffice} *</Text>
          <View style={styles.officeOptions}>
            {officeOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.officeChip, office === opt && styles.officeChipActive]}
                onPress={() => setOffice(opt)}
              >
                <Text style={[styles.officeChipText, office === opt && styles.officeChipTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Consultation Button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>{t.submitConsultationBtn}</Text>
          )}
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
  linkedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cce2d2',
    marginBottom: 20,
  },
  linkedLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  linkedCrop: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 2,
  },
  linkedMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#ffc8be',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  officeOptions: {
    flexDirection: 'column',
    gap: 8,
  },
  officeChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 12,
  },
  officeChipActive: {
    backgroundColor: '#f6faf7',
    borderColor: colors.primary,
  },
  officeChipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  officeChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
