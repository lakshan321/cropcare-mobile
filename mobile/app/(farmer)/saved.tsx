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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiRequest, API_BASE_URL } from '../../src/api/client';
import { SavedDiagnosis } from '../../src/types';
import { colors } from '../../src/theme/colors';

export default function SavedDiagnosesScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  const [records, setRecords] = useState<SavedDiagnosis[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit observation modal state
  const [editingRecord, setEditingRecord] = useState<SavedDiagnosis | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchRecords = async (query = '') => {
    try {
      const endpoint = query ? `/api/saved-diagnoses?search=${encodeURIComponent(query)}` : '/api/saved-diagnoses';
      const res = await apiRequest<{ records: SavedDiagnosis[] }>(endpoint);
      if (res.success && res.data?.records) {
        setRecords(res.data.records);
      }
    } catch (e) {
      console.warn('Error loading saved diagnoses:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords(searchQuery);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords(searchQuery);
  };

  // Open Edit Modal
  const openEditModal = (rec: SavedDiagnosis) => {
    setEditingRecord(rec);
    setEditNoteText(rec.personalObservations || '');
  };

  // Save Edited Note (CRUD - Update)
  const handleSaveEditedNote = async () => {
    if (!editingRecord) return;
    setSavingEdit(true);
    try {
      const res = await apiRequest<{ record: SavedDiagnosis }>(`/api/saved-diagnoses/${editingRecord._id}`, {
        method: 'PATCH',
        body: { personalObservations: editNoteText },
      });

      if (res.success && res.data?.record) {
        setRecords(records.map((r) => (r._id === editingRecord._id ? res.data!.record : r)));
        setEditingRecord(null);
      }
    } catch (e) {
      console.warn('Error updating note:', e);
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Record (CRUD - Delete)
  const handleDelete = (id: string) => {
    Alert.alert('Delete Record', t.deleteSavedConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          const res = await apiRequest(`/api/saved-diagnoses/${id}`, { method: 'DELETE' });
          if (res.success) {
            setRecords(records.filter((r) => r._id !== id));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.savedTitle}</Text>
        <TouchableOpacity
          style={styles.newCheckBtn}
          onPress={() => router.push('/(farmer)/capture')}
        >
          <Text style={styles.newCheckBtnText}>+ New Check</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 3 · SAVED DIAGNOSES HISTORY</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchSaved}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={{ color: colors.textMuted }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingSub}>Loading saved records...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            {records.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>▤</Text>
                <Text style={styles.emptyTitle}>{t.noSavedFound}</Text>
                <Text style={styles.emptySub}>
                  When you diagnose a plant leaf, tap "Save to My History" to track progress here.
                </Text>
                <TouchableOpacity
                  style={styles.startDiagnoseBtn}
                  onPress={() => router.push('/(farmer)/capture')}
                >
                  <Text style={styles.startDiagnoseBtnText}>Diagnose a Plant Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              records.map((rec) => (
                <View key={rec._id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={styles.imageAndCrop}>
                      <View style={styles.thumbnailBox}>
                        {rec.imageUrl ? (
                          <Image
                            source={{ uri: `${API_BASE_URL}${rec.imageUrl}` }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={{ fontSize: 20 }}>🍃</Text>
                        )}
                      </View>
                      <View>
                        <Text style={styles.cropTitle}>{rec.crop}</Text>
                        <Text style={styles.dateText}>
                          {new Date(rec.savedDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.severityChip}>
                      <Text style={styles.severityChipText}>{rec.severity}</Text>
                    </View>
                  </View>

                  <Text style={styles.diseaseName}>{rec.disease}</Text>
                  <Text style={styles.confidenceText}>Confidence: {rec.confidence}%</Text>

                  {/* Personal Observations */}
                  <View style={styles.observationsBox}>
                    <Text style={styles.obsLabel}>Field Notes:</Text>
                    <Text style={styles.obsText}>
                      {rec.personalObservations || 'No personal observations recorded yet.'}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditModal(rec)}
                    >
                      <Text style={styles.editBtnText}>✏ Edit Observation</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(rec._id)}
                    >
                      <Text style={styles.deleteBtnText}>🗑 Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Edit Observations Modal */}
      <Modal
        visible={Boolean(editingRecord)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingRecord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Field Observations</Text>
            <Text style={styles.modalSub}>{editingRecord?.crop} · {editingRecord?.disease}</Text>

            <TextInput
              style={styles.modalInput}
              value={editNoteText}
              onChangeText={setEditNoteText}
              multiline
              numberOfLines={4}
              placeholder="Update your observations, weather notes, or treatment results..."
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingRecord(null)}
                disabled={savingEdit}
              >
                <Text style={styles.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveEditedNote}
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
  newCheckBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newCheckBtnText: {
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  clearSearchBtn: {
    padding: 6,
  },
  listContent: {
    paddingBottom: 30,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  imageAndCrop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbnailBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#eaf0e7',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  cropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  severityChip: {
    backgroundColor: '#fff5db',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8a5a10',
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  confidenceText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  observationsBox: {
    backgroundColor: '#f9fbf8',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  obsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 2,
  },
  obsText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
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
  deleteBtn: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  deleteBtnText: {
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
  startDiagnoseBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  startDiagnoseBtnText: {
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
