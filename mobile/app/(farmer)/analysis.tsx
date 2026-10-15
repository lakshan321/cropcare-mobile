import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiRequest } from '../../src/api/client';
import { colors } from '../../src/theme/colors';

export default function AnalysisScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  const draftId = (params.draftId as string) || '';
  const cropNote = (params.cropNote as string) || '';

  const [cancelled, setCancelled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pulse animation value
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulsing scanner animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Trigger analysis API call
    let isMounted = true;

    const runAnalysis = async () => {
      try {
        const res = await apiRequest('/api/diagnosis/analyze', {
          method: 'POST',
          body: {
            draftId: draftId || undefined,
            cropHint: cropNote || undefined,
            farmerNotes: cropNote,
          },
        });

        if (!isMounted) return;

        if (res.success && res.data?.diagnosis) {
          router.replace({
            pathname: '/(farmer)/result',
            params: {
              diagnosisId: res.data.diagnosis._id,
            },
          });
        } else {
          setErrorMessage(res.message || 'Analysis could not be completed.');
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Network error occurred during analysis.');
        }
      }
    };

    runAnalysis();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Analysis',
      'Are you sure you want to stop this analysis?',
      [
        { text: 'Keep Analyzing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            setCancelled(true);
            router.replace('/(farmer)');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 1 · IMAGE ANALYSIS STATE</Text>
        </View>

        {/* Animated Scanner Pulse */}
        <Animated.View style={[styles.scannerRing, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.leafCircle}>
            <Text style={{ fontSize: 56 }}>🔬</Text>
          </View>
        </Animated.View>

        <Text style={styles.title}>{t.analyzingTitle}</Text>
        <Text style={styles.subtitle}>{t.analyzingSubtitle}</Text>

        <View style={styles.statusChipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>✓ Leaf Texture</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>✓ Lesion Spots</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>◷ Matching Pathology</Text>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.replace('/(farmer)/capture')}
            >
              <Text style={styles.retryButtonText}>Try Another Photo</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>{t.cancelAnalysis}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  memberTag: {
    backgroundColor: '#e6ede3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 36,
  },
  memberTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  scannerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#dcecdb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  leafCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 24,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 36,
  },
  chip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#ffc8be',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});
