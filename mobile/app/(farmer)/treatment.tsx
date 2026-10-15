import React, { useEffect, useState } from 'react';
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
import { apiRequest } from '../../src/api/client';
import { DiagnosisResult, CareTask } from '../../src/types';
import { colors } from '../../src/theme/colors';

export default function TreatmentScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  const diagnosisId = (params.diagnosisId as string) || '';

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);

  const fetchDetails = async () => {
    try {
      if (diagnosisId) {
        const diagRes = await apiRequest<{ diagnosis: DiagnosisResult }>(`/api/diagnosis/${diagnosisId}`);
        if (diagRes.success && diagRes.data?.diagnosis) {
          setDiagnosis(diagRes.data.diagnosis);
        }
      }

      // Fetch user's care tasks
      const taskRes = await apiRequest<{ tasks: CareTask[] }>('/api/care-tasks');
      if (taskRes.success && taskRes.data?.tasks) {
        setTasks(taskRes.data.tasks);
      }
    } catch (e) {
      console.warn('Error fetching treatment details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [diagnosisId]);

  // Create Care Task (CRUD - Create)
  const handleAddTask = async () => {
    if (!newTaskText.trim()) {
      Alert.alert('Notice', 'Please type a task description first.');
      return;
    }

    setAddingTask(true);
    try {
      const res = await apiRequest<{ task: CareTask }>('/api/care-tasks', {
        method: 'POST',
        body: {
          task: newTaskText.trim(),
          category: 'custom',
          diagnosisId: diagnosisId || undefined,
        },
      });

      if (res.success && res.data?.task) {
        setTasks([res.data.task, ...tasks]);
        setNewTaskText('');
      }
    } catch (e) {
      console.warn('Error adding task:', e);
    } finally {
      setAddingTask(false);
    }
  };

  // Toggle Complete (CRUD - Update)
  const handleToggleTask = async (id: string, currentStatus: boolean) => {
    try {
      const res = await apiRequest<{ task: CareTask }>(`/api/care-tasks/${id}`, {
        method: 'PATCH',
        body: { isCompleted: !currentStatus },
      });

      if (res.success) {
        setTasks(tasks.map((tk) => (tk._id === id ? { ...tk, isCompleted: !currentStatus } : tk)));
      }
    } catch (e) {
      console.warn('Error toggling task:', e);
    }
  };

  // Delete Task (CRUD - Delete)
  const handleDeleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Remove this care task from your field schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const res = await apiRequest(`/api/care-tasks/${id}`, { method: 'DELETE' });
          if (res.success) {
            setTasks(tasks.filter((tk) => tk._id !== id));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading treatment guidance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← {t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.treatmentTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.memberTag}>
          <Text style={styles.memberTagText}>MEMBER 2 · TREATMENT, PREVENTION & CARE TASKS</Text>
        </View>

        {diagnosis && (
          <View style={styles.summaryCard}>
            <Text style={styles.cropSub}>{diagnosis.crop} · {diagnosis.severity} Severity</Text>
            <Text style={styles.diseaseTitle}>{diagnosis.disease}</Text>
          </View>
        )}

        {/* Immediate Field Actions */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionIcon}>⚡</Text>
            <Text style={styles.sectionTitle}>{t.immediateActions}</Text>
          </View>
          <Text style={styles.bulletItem}>
            1. Quarantine or isolate visibly infected plant rows to restrict airborne spore dispersal.
          </Text>
          <Text style={styles.bulletItem}>
            2. Prune heavily blighted leaves during dry mid-day hours using sanitized shears.
          </Text>
          <Text style={styles.bulletItem}>
            3. Cease overhead hose/sprinkler watering; apply irrigation strictly at root base.
          </Text>
        </View>

        {/* Organic Options */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionIcon}>🍃</Text>
            <Text style={styles.sectionTitle}>{t.organicOptions}</Text>
          </View>
          {diagnosis?.organicTreatment && diagnosis.organicTreatment.length > 0 ? (
            diagnosis.organicTreatment.map((item, idx) => (
              <Text key={idx} style={styles.bulletItem}>
                • {item}
              </Text>
            ))
          ) : (
            <>
              <Text style={styles.bulletItem}>• Spray neem seed kernel extract (5%) or pure cold-pressed neem oil (5ml/L).</Text>
              <Text style={styles.bulletItem}>• Apply Trichoderma viride or Pseudomonas fluorescens biological culture.</Text>
            </>
          )}
        </View>

        {/* Chemical Guidance without unsupported prescriptions */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionIcon}>🧪</Text>
            <Text style={styles.sectionTitle}>{t.chemicalGuidance}</Text>
          </View>
          {diagnosis?.chemicalTreatment && diagnosis.chemicalTreatment.length > 0 ? (
            diagnosis.chemicalTreatment.map((item, idx) => (
              <Text key={idx} style={styles.bulletItem}>
                • {item}
              </Text>
            ))
          ) : (
            <Text style={styles.bulletItem}>• Apply broad-spectrum copper oxychloride or Mancozeb protective fungicide.</Text>
          )}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              ⚠ {t.chemicalNotice} Wear protective masks, follow designated pre-harvest intervals (PHI), and verify with your local agricultural officer.
            </Text>
          </View>
        </View>

        {/* Long-term Prevention */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionIcon}>🛡</Text>
            <Text style={styles.sectionTitle}>{t.preventionTips}</Text>
          </View>
          {diagnosis?.prevention && diagnosis.prevention.length > 0 ? (
            diagnosis.prevention.map((item, idx) => (
              <Text key={idx} style={styles.bulletItem}>
                • {item}
              </Text>
            ))
          ) : (
            <>
              <Text style={styles.bulletItem}>• Practice crop rotation with non-solanaceous crops every season.</Text>
              <Text style={styles.bulletItem}>• Maintain adequate plant spacing for ventilation and airflow.</Text>
            </>
          )}
        </View>

        {/* Care Tasks CRUD (Create, Read, Update, Delete) */}
        <View style={styles.careSection}>
          <Text style={styles.careTitle}>📋 {t.careTasksTitle}</Text>
          <Text style={styles.careSub}>Create and manage actionable field care tasks:</Text>

          {/* Create Task Input */}
          <View style={styles.addTaskRow}>
            <TextInput
              style={styles.taskInput}
              placeholder={t.addTaskPlaceholder}
              placeholderTextColor="#9ca3af"
              value={newTaskText}
              onChangeText={setNewTaskText}
            />
            <TouchableOpacity
              style={styles.addTaskBtn}
              onPress={handleAddTask}
              disabled={addingTask}
            >
              {addingTask ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.addTaskBtnText}>+ Add</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* List Tasks */}
          {tasks.length === 0 ? (
            <View style={styles.emptyTasksBox}>
              <Text style={styles.emptyTasksText}>{t.noTasks}</Text>
            </View>
          ) : (
            tasks.map((task) => (
              <View key={task._id} style={styles.taskItem}>
                <TouchableOpacity
                  style={[styles.checkbox, task.isCompleted && styles.checkboxChecked]}
                  onPress={() => handleToggleTask(task._id, task.isCompleted)}
                >
                  {task.isCompleted && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>

                <Text style={[styles.taskDesc, task.isCompleted && styles.taskDescCompleted]}>
                  {task.task}
                </Text>

                <TouchableOpacity
                  style={styles.deleteTaskBtn}
                  onPress={() => handleDeleteTask(task._id)}
                >
                  <Text style={styles.deleteTaskText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Expert Consultation Shortcut */}
        <TouchableOpacity
          style={styles.consultButton}
          onPress={() =>
            router.push({
              pathname: '/(farmer)/consult',
              params: {
                diagnosisId: diagnosis?._id || diagnosisId,
                crop: diagnosis?.crop,
                disease: diagnosis?.disease,
              },
            })
          }
        >
          <Text style={styles.consultButtonText}>👨‍🌾 Need Official Agricultural Officer Advice? Consult Now →</Text>
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
  summaryCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  cropSub: {
    color: '#eff5df',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  diseaseTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  bulletItem: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginBottom: 8,
  },
  noticeBox: {
    backgroundColor: '#fff9ee',
    borderWidth: 1,
    borderColor: '#ede1c2',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  noticeText: {
    fontSize: 11,
    color: '#8a5a10',
    lineHeight: 16,
    fontWeight: '600',
  },
  careSection: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  careTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  careSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
  },
  addTaskRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  taskInput: {
    flex: 1,
    backgroundColor: '#f9fbf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  addTaskBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTaskBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyTasksBox: {
    padding: 16,
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f3ef',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  taskDesc: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  taskDescCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  deleteTaskBtn: {
    padding: 6,
  },
  deleteTaskText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  consultButton: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#e8dcba',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  consultButtonText: {
    color: '#8a5a10',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
});
