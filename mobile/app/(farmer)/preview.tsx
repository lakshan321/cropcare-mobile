import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../src/context/LanguageContext';
import { API_BASE_URL, apiRequest } from '../../src/api/client';
import { colors } from '../../src/theme/colors';

export default function ImagePreviewScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  const [draftId, setDraftId] = useState<string>((params.draftId as string) || '');
  const [imageUrl, setImageUrl] = useState<string>((params.imageUrl as string) || '');
  const [localUri, setLocalUri] = useState<string>((params.localUri as string) || '');
  const [cropNote, setCropNote] = useState('Tomato (Plot A)');
  const [loading, setLoading] = useState(false);

  // Display URI: prioritize local preview or backend URL
  const displayImageUri = localUri || (imageUrl ? `${API_BASE_URL}${imageUrl}` : '');

  // Retake or replace image
  const handleRetake = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLocalUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Retake error:', e);
    }
  };

  // Cancel & delete draft (no accidental submission)
  const handleCancel = async () => {
    Alert.alert(
      'Discard Photo Draft',
      'Are you sure you want to discard this image preview?',
      [
        { text: 'Keep Photo', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            if (draftId) {
              await apiRequest(`/api/drafts/${draftId}`, { method: 'DELETE' });
            }
            router.replace('/(farmer)');
          },
        },
      ]
    );
  };

  // Proceed to Analysis
  const handleProceedToAnalysis = async () => {
    setLoading(true);
    // Update draft note before analysis
    if (draftId) {
      await apiRequest(`/api/drafts/${draftId}`, {
        method: 'PUT',
        body: { cropNote },
      });
    }

    router.push({
      pathname: '/(farmer)/analysis',
      params: {
        draftId,
        imageUrl,
        cropNote,
      },
    });
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleCancel}>
          <Text style={styles.cancelText}>✕ {t.cancel}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.previewTitle}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 1 · IMAGE PREVIEW & RETAKE</Text>
        </View>

        <Text style={styles.title}>{t.previewTitle}</Text>
        <Text style={styles.sub}>{t.previewSubtitle}</Text>

        {/* Large Image Preview (Milestone 02 Variant B) */}
        <View style={styles.previewContainer}>
          {displayImageUri ? (
            <Image
              source={{ uri: displayImageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallbackBox}>
              <Text style={{ fontSize: 60 }}>🍃</Text>
              <Text style={{ color: colors.textMuted, marginTop: 8 }}>Sample plant leaf</Text>
            </View>
          )}
        </View>

        {/* Crop & Plot Note Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t.cropNoteLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Tomato, Bell Pepper, Paddy Field B"
            placeholderTextColor="#9ca3af"
            value={cropNote}
            onChangeText={setCropNote}
          />
        </View>

        {/* Retake Button */}
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
          <Text style={styles.retakeButtonText}>🔄 {t.retakePhoto}</Text>
        </TouchableOpacity>

        {/* Proceed Button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleProceedToAnalysis}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>{t.analyzeButton}</Text>
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
  headerBtn: {
    paddingVertical: 4,
  },
  cancelText: {
    color: colors.danger,
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
  previewContainer: {
    height: 320,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  fallbackBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  retakeButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  retakeButtonText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: '700',
  },
});
