import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { API_BASE_URL } from '../../src/api/client';
import { tokenStorage } from '../../src/storage/secureStore';
import { colors } from '../../src/theme/colors';

export default function CaptureScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Launch Camera
  const handleTakePhoto = async () => {
    setErrorMessage('');
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          t.cameraPermissionDenied || 'Camera permission is required to capture plant photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndUploadImage(result.assets[0]);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setErrorMessage('Could not open camera. Try uploading from gallery instead.');
    }
  };

  // 2. Launch Photo Gallery
  const handleChooseGallery = async () => {
    setErrorMessage('');
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          t.galleryPermissionDenied || 'Gallery permission is required to select photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndUploadImage(result.assets[0]);
      }
    } catch (err: any) {
      console.error('Gallery error:', err);
      setErrorMessage('Could not open gallery.');
    }
  };

  // 3. Process & Upload Image Draft to Backend
  const processAndUploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    // Check file size (5MB limit)
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      setErrorMessage(t.fileTooLarge);
      return;
    }

    setUploading(true);
    try {
      const token = await tokenStorage.getToken();
      const formData = new FormData();

      const uri = asset.uri;
      const filename = uri.split('/').pop() || 'plant-leaf.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('image', blob, filename);
      } else {
        // React Native mobile FormData syntax
        formData.append('image', {
          uri,
          name: filename,
          type,
        } as any);
      }

      formData.append('cropNote', 'Mobile photo capture');

      const uploadResponse = await fetch(`${API_BASE_URL}/api/drafts`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const json = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(json.message || 'Image draft upload failed.');
      }

      // Navigate to Image Preview Screen with created draft details
      router.push({
        pathname: '/(farmer)/preview',
        params: {
          draftId: json.draft._id,
          imageUrl: json.draft.imageUrl,
          localUri: asset.uri,
        },
      });
    } catch (err: any) {
      console.error('Upload draft error:', err);
      setErrorMessage(err.message || 'Network error while uploading image. Please check connection and retry.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 1 · CAMERA & UPLOAD</Text>
        </View>

        <Text style={styles.title}>{t.captureTitle}</Text>
        <Text style={styles.sub}>{t.captureSubtitle}</Text>

        {/* Big Leaf Illustration / Viewfinder Card */}
        <View style={styles.viewfinderCard}>
          <View style={styles.viewfinderCenter}>
            <Text style={{ fontSize: 60 }}>🍃</Text>
            <Text style={styles.viewfinderText}>Aim at a single affected plant leaf</Text>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {errorMessage}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={[styles.primaryButton, uploading && styles.disabledButton]}
            onPress={handleTakePhoto}
            disabled={uploading}
            activeOpacity={0.85}
          >
            {uploading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>📷 {t.takePhoto}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, uploading && styles.disabledButton]}
            onPress={handleChooseGallery}
            disabled={uploading}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>🖼 {t.chooseGallery}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guidelinesLink}
            onPress={() => router.push('/(farmer)/guidelines')}
          >
            <Text style={styles.guidelinesLinkText}>📖 Review Photo Guidelines First</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
    justifyContent: 'center',
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
    fontSize: 24,
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
  viewfinderCard: {
    height: 240,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#cce2d2',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  viewfinderCenter: {
    alignItems: 'center',
  },
  viewfinderText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
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
  actionGroup: {
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
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  guidelinesLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  guidelinesLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
