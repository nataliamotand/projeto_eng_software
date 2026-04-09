import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import ImageRotator from '../src/components/ui/image-rotator';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/components/ui/theme';

const { width } = Dimensions.get('window');

const muscleMap: Record<string, string> = {
  "upper back": "Costas (parte de cima)",
  "triceps": "Tríceps",
  "traps": "Trapézio",
  "spine": "Lombar",
  "serratus anterior": "Serrátil",
  "quads": "Quadríceps",
  "pectorals": "Peito",
  "levator scapulae": "Pescoço",
  "lats": "Costas",
  "hamstrings": "Posterior de coxa",
  "glutes": "Glúteos",
  "forearms": "Antebraço",
  "delts": "Ombro",
  "cardiovascular system": "Cardio",
  "calves": "Panturrilha",
  "biceps": "Bíceps",
  "adductors": "Adutor",
  "abs": "Abdômen",
  "abductors": "Abdutor"
};

// Timer isolated to avoid re-rendering the whole list every second
const Timer: React.FC<{ initialSeconds?: number }> = React.memo(({ initialSeconds = 0 }) => {
  const [sec, setSec] = useState<number>(initialSeconds);

  useEffect(() => {
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    if (sec >= 3600) {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${pad(m)}:${pad(s)}`;
  }, [sec]);

  return <Text style={styles.timerText}>{fmt}</Text>;
});

type SetRow = { id: string; weight?: string; reps?: string; distance?: string; time?: string; floors?: string; isCompleted?: boolean };
type WorkoutExercise = {
  id: string | number;
  name: string;
  image?: string;
  images?: string[];
  target?: string;
  tracking: 'strength' | 'cardio';
  sets: SetRow[];
};

export default function Workout(): JSX.Element {
  const router = useRouter();

  // Mocked incoming route params -> workoutData
  const [workoutData, setWorkoutData] = useState<WorkoutExercise[]>(() => [
    {
      id: 'ex1',
      name: 'Agachamento',
      image: '',
      tracking: 'strength',
      sets: [
        { id: 's1', weight: '60', reps: '8', isCompleted: false },
        { id: 's2', weight: '65', reps: '6', isCompleted: false },
        { id: 's3', weight: '70', reps: '4', isCompleted: false },
      ],
    },
    {
      id: 'ex2',
      name: 'Corrida Leve',
      image: '',
      tracking: 'cardio',
      sets: [
        { id: 'c1', distance: '1.5', time: '08:00', isCompleted: false },
        { id: 'c2', distance: '1.0', time: '05:30', isCompleted: false },
      ],
    },
  ]);

  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTargetId, setMenuTargetId] = useState<string | number | null>(null);

  // Toggle completion of a set (isolated update)
  const toggleSetCompleted = useCallback((exId: string | number, setId: string) => {
    setWorkoutData((prev) =>
      prev.map((ex) => {
        if (String(ex.id) !== String(exId)) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, isCompleted: !s.isCompleted } : s)),
        };
      }),
    );
  }, []);

  const updateSetValue = useCallback((exId: string | number, setId: string, field: keyof SetRow, value: string) => {
    setWorkoutData((prev) =>
      prev.map((ex) => {
        if (String(ex.id) !== String(exId)) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
        };
      }),
    );
  }, []);

  const addSeriesToExercise = useCallback((exId: string | number) => {
    setWorkoutData((prev) =>
      prev.map((ex) => {
        if (String(ex.id) !== String(exId)) return ex;
        const newSet: SetRow =
          ex.tracking === 'strength'
            ? { id: `${Date.now()}`, weight: '', reps: '', isCompleted: false }
            : { id: `${Date.now()}`, distance: '', time: '', isCompleted: false };
        return { ...ex, sets: [...ex.sets, newSet] };
      }),
    );
  }, []);

  const addExercise = useCallback(() => {
    // Open the exercise picker (same flow as CreateRoutine)
    router.push('/choose_exercise');
  }, []);

  // When returning from the exercise picker, merge any pending selected exercises
  useFocusEffect(
    React.useCallback(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const added = globalThis.__PENDING_SELECTED_EXERCISES;
        if (Array.isArray(added) && added.length > 0) {
          const toAdd: WorkoutExercise[] = added.map((p: any) => {
            const tracking = p.tracking || (p.type === 'cardio' ? 'cardio' : 'strength');
            const defaultSets =
              tracking === 'cardio'
                ? [{ id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`, distance: p.distance || p.plannedDistance || '', time: p.time || p.plannedTime || '', isCompleted: false }]
                : [{ id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`, weight: p.weight || p.plannedWeight || '', reps: p.reps || p.plannedReps || '', isCompleted: false }];

            return {
              id: p.id ?? `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              name: p.name || p.title || '',
              images: p.images && p.images.length ? p.images : p.image ? [p.image] : p.gifUrl ? [p.gifUrl] : [],
              target: p.target || p.muscle || '',
              tracking,
              sets: defaultSets,
            } as WorkoutExercise;
          });

          setWorkoutData((prev) => {
            const existingIds = new Set(prev.map((e) => String(e.id)));
            const merged = [...prev];
            for (const ex of toAdd) {
              if (!existingIds.has(String(ex.id))) merged.push(ex);
            }
            return merged;
          });

          // clear global var
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          delete globalThis.__PENDING_SELECTED_EXERCISES;
        }
      } catch (e) {
        // ignore
      }
      return () => {};
    }, []),
  );

  function handleCancel() {
    setCancelConfirmVisible(true);
  }

  function openMenuFor(id: string | number) {
    setMenuTargetId(id);
    setMenuVisible(true);
  }

  function closeMenu() {
    setMenuVisible(false);
    setMenuTargetId(null);
  }

  function handleDeleteExercise(id?: string | number | null) {
    if (id == null) return closeMenu();
    setWorkoutData((prev) => prev.filter((ex) => String(ex.id) !== String(id)));
    closeMenu();
  }

  function handleDeleteSeries(id?: string | number | null) {
    if (id == null) return closeMenu();
    setWorkoutData((prev) =>
      prev.map((ex) => {
        if (String(ex.id) === String(id)) {
          const newSets = ex.sets.length > 1
            ? ex.sets.slice(0, -1)
            : [
                ex.tracking === 'cardio'
                  ? { id: `${Date.now()}`, distance: '', time: '', isCompleted: false }
                  : { id: `${Date.now()}`, weight: '', reps: '', isCompleted: false },
              ];
          return { ...ex, sets: newSets };
        }
        return ex;
      }),
    );
    closeMenu();
  }

  function confirmCancel() {
    setCancelConfirmVisible(false);
    router.back();
  }

  function handleFinish() {
    // Placeholder: save workout results
    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <Timer initialSeconds={0} />

        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Text style={styles.finishButtonText}>Concluir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {workoutData.map((ex) => (
          <View key={String(ex.id)} style={styles.card}>
            <View style={styles.cardHeader}>
              <ImageRotator images={ex.images && ex.images.length ? ex.images : ex.image ? [ex.image] : []} style={styles.exImage} />
              <View style={styles.cardHeaderCenter}>
                <Text style={styles.exName}>{ex.name}</Text>
                {ex.target ? <Text style={styles.exTarget}>{muscleMap[String(ex.target).toLowerCase()] || ex.target}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => openMenuFor(ex.id)}>
                <Ionicons name="ellipsis-vertical" size={20} color={colors.grayLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.setsTable}>
              <View style={styles.setsHeader}>
                <Text style={styles.setsHeaderIndex}>SÉRIE</Text>
                {ex.tracking === 'strength' ? (
                  <>
                    <Text style={styles.setsHeaderText}>KG</Text>
                    <Text style={styles.setsHeaderText}>REPS</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.setsHeaderText}>KM</Text>
                    <Text style={styles.setsHeaderText}>TEMPO</Text>
                  </>
                )}
                <View style={{ width: 40 }} />
              </View>

              {ex.sets.map((s, idx) => (
                <View key={s.id} style={[styles.setRow, s.isCompleted ? styles.setRowDone : null]}>
                  <Text style={styles.setIndex}>{String(idx + 1)}</Text>

                  {ex.tracking === 'strength' ? (
                    <>
                      <TextInput
                        style={styles.setInput}
                        value={s.weight ?? ''}
                        placeholder={s.weight ?? ''}
                        placeholderTextColor={colors.grayMid}
                        onChangeText={(val) => updateSetValue(ex.id, s.id, 'weight', val)}
                        keyboardType="numeric"
                      />

                      <TextInput
                        style={styles.setInput}
                        value={s.reps ?? ''}
                        placeholder={s.reps ?? ''}
                        placeholderTextColor={colors.grayMid}
                        onChangeText={(val) => updateSetValue(ex.id, s.id, 'reps', val)}
                        keyboardType="numeric"
                      />
                    </>
                  ) : (
                    <>
                      <TextInput
                        style={styles.setInput}
                        value={s.distance ?? ''}
                        placeholder={s.distance ?? ''}
                        placeholderTextColor={colors.grayMid}
                        onChangeText={(val) => updateSetValue(ex.id, s.id, 'distance', val)}
                        keyboardType="numeric"
                      />

                      <TextInput
                        style={styles.setInput}
                        value={s.time ?? ''}
                        placeholder={s.time ?? ''}
                        placeholderTextColor={colors.grayMid}
                        onChangeText={(val) => updateSetValue(ex.id, s.id, 'time', val)}
                        keyboardType="default"
                      />
                    </>
                  )}

                  <TouchableOpacity style={styles.checkTouch} onPress={() => toggleSetCompleted(ex.id, s.id)}>
                    <FontAwesome name={s.isCompleted ? 'check-circle' : 'circle-thin'} size={22} color={s.isCompleted ? colors.red : colors.grayLight} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addSeriesButton} onPress={() => addSeriesToExercise(ex.id)}>
                <FontAwesome name="plus" size={14} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.addSeriesText}>Adicionar Série</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addExerciseButton} onPress={addExercise}>
          <FontAwesome name="plus" size={18} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.addExerciseText}>Adicionar exercício</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={cancelConfirmVisible} transparent animationType="fade" onRequestClose={() => setCancelConfirmVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCancelConfirmVisible(false)}>
          <View style={styles.modalContentCentered}>
            <Text style={[styles.modalTitle, { marginBottom: 12 }]}>Cancelar treino?</Text>
            <TouchableOpacity style={styles.modalOptionButton} onPress={confirmCancel}>
              <Text style={styles.modalOptionText}>Sim, cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalOptionButton, { marginTop: 8 }]} onPress={() => setCancelConfirmVisible(false)}>
              <Text style={styles.modalOptionText}>Manter treino</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.modalContentCentered}>
            <TouchableOpacity style={[styles.modalOptionButton, { marginBottom: 8 }]} onPress={() => handleDeleteSeries(menuTargetId)}>
              <Text style={[styles.modalOptionText, { color: colors.grayLight }]}>Deletar uma série</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOptionButton} onPress={() => handleDeleteExercise(menuTargetId)}>
              <Text style={[styles.modalOptionText, { color: colors.red }]}>Remover exercício</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  cancelButton: { backgroundColor: '#2A2A2A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  cancelButtonText: { color: colors.white, fontWeight: '600' },
  timerText: { color: colors.white, fontWeight: '700', fontFamily: 'monospace', fontSize: 18 },
  finishButton: { backgroundColor: colors.red, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  finishButtonText: { color: colors.white, fontWeight: '700' },

  contentContainer: { padding: 16, paddingBottom: 220 },
  card: { backgroundColor: colors.cardBg, borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#111' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  exImage: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: '#222' },
  cardHeaderCenter: { flex: 1 },
  exName: { color: colors.white, fontWeight: '700' },
  exTarget: { color: colors.grayLight, fontSize: 12, marginTop: 4 },

  setsTable: { marginTop: 12 },
  setsHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#111' },
  setsHeaderIndex: { color: colors.grayLight, width: 36, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  setsHeaderText: { color: colors.grayLight, flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700' },

  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, justifyContent: 'flex-start', backgroundColor: 'transparent', borderRadius: 6, marginTop: 6 },
  setRowDone: { backgroundColor: colors.rowDone },
  setIndex: { color: colors.white, width: 36, textAlign: 'center' },
  setInput: { color: colors.white, flex: 1, marginHorizontal: 6, textAlign: 'center', borderRadius: 6, backgroundColor: '#0A0A0A', paddingVertical: 6, paddingHorizontal: 8 },
  checkTouch: { width: 40, alignItems: 'center' },

  addSeriesButton: { marginTop: 10, backgroundColor: '#2A2A2A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  addSeriesText: { color: colors.white, fontWeight: '700' },

  addExerciseButton: { marginTop: 18, backgroundColor: colors.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, width: width - 32 },
  addExerciseText: { color: colors.white, fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContentCentered: { backgroundColor: '#0A0A0A', padding: 20, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderColor: '#111', borderWidth: 1, alignItems: 'stretch', width: '100%' },
  modalOptionButton: { backgroundColor: '#111', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, width: '100%', alignItems: 'center' },
  modalOptionText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  modalTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
