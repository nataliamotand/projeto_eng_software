import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import ImageRotator from '../src/components/ui/image-rotator';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const colors = {
  background: '#000000',
  red: '#CC0000',
  white: '#FFFFFF',
  darkNav: '#1A1A1A',
  grayLight: '#CFCFCF',
  grayMid: '#9A9A9A',
};

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

type SetRow = { id?: string | number; reps?: string; weight?: string; distance?: string; time?: string; floors?: string };

type RoutineExercise = {
  id: string | number;
  name: string;
  image?: string;
  images?: string[]; // existing line
  target?: string; // new line added
  notes?: string;
  restEnabled?: boolean;
  sets: SetRow[];
};

function createEmptySet(): SetRow {
  return { id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`, weight: '', reps: '', distance: '', time: '', floors: '' };
}

export default function CreateRoutine(): JSX.Element {
  const router = useRouter();

  const [routineTitle, setRoutineTitle] = useState('');

  // start with empty selection for CREATE flow
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);

  // hydrate from global current routine if present (preserve across navigations)
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const current = globalThis.__CURRENT_ROUTINE_EXERCISES;
      if (Array.isArray(current) && current.length > 0) {
        setSelectedExercises(current);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // persist selectedExercises to global so it's not lost when screen remounts
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      globalThis.__CURRENT_ROUTINE_EXERCISES = selectedExercises;
    } catch (e) {
      // ignore
    }
  }, [selectedExercises]);

  // When the screen gains focus, check for pending selected exercises
  useFocusEffect(
    React.useCallback(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const added = globalThis.__PENDING_SELECTED_EXERCISES;
        if (Array.isArray(added) && added.length > 0) {
          const toAdd: RoutineExercise[] = added.map((p: any) => ({
            id: p.id,
            name: p.name || p.title || '',
            image: undefined,
            target: p.target || p.muscle || '',
            notes: p.notes || '',
            restEnabled: false,
            sets: Array.isArray(p.sets) && p.sets.length > 0 ? p.sets : [createEmptySet()],
            // keep images on original payload if present (consumers may read `images`)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            images: p.images && p.images.length ? p.images : p.image ? [p.image] : p.gifUrl ? [p.gifUrl] : [],
          } as RoutineExercise));

          setSelectedExercises((prev) => {
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
        console.error('Failed to read pending selected exercises', e);
      }
      return () => {};
    }, []),
  );

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTargetId, setMenuTargetId] = useState<string | number | null>(null);
  const [publishMenuVisible, setPublishMenuVisible] = useState(false);

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
    setSelectedExercises((prev) => prev.filter((ex) => String(ex.id) !== String(id)));
    // also update global cache
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      globalThis.__CURRENT_ROUTINE_EXERCISES = (globalThis.__CURRENT_ROUTINE_EXERCISES || []).filter((ex: any) => String(ex.id) !== String(id));
    } catch (e) {
      // ignore
    }
    closeMenu();
  }

  function handleDeleteSeries(id?: string | number | null) {
    if (id == null) return closeMenu();
    setSelectedExercises((prev) =>
      prev.map((ex) => {
        if (String(ex.id) === String(id)) {
          // remove last series if more than one, otherwise keep single empty
          const newSets = ex.sets.length > 1 ? ex.sets.slice(0, -1) : [createEmptySet()];
          return { ...ex, sets: newSets };
        }
        return ex;
      }),
    );
    closeMenu();
  }

  function handleAddExercise() {
    // Placeholder: abrir `choose_exercise` e retornar seleção
    router.push('/choose_exercise');
  }

  function handleCancel() {
    router.back();
  }

  function handleUpdate() {
    // open publish menu only when valid (handled by button disabled state)
    setPublishMenuVisible(true);
  }

  function handleRequestApproval() {
    console.log('Solicitar aprovação', { routineTitle, selectedExercises });
    setPublishMenuVisible(false);
    // Placeholder: implementar fluxo de solicitação
  }

  function handleProceedAlone() {
    console.log('Seguir por conta própria', { routineTitle, selectedExercises });
    setPublishMenuVisible(false);
    // Placeholder: implementar fluxo de publicação imediata
  }

  function addSeriesToExercise(exId: string | number) {
    setSelectedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exId) {
          return { ...ex, sets: [...ex.sets, createEmptySet()] };
        }
        return ex;
      }),
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Criar Rotina</Text>

        {(() => {
          const canCreate = Boolean(routineTitle && String(routineTitle).trim().length > 0 && selectedExercises.length > 0);
          return (
            <TouchableOpacity style={[styles.updateButton, !canCreate ? { opacity: 0.45 } : null]} onPress={() => canCreate && handleUpdate()} disabled={!canCreate}>
              <Text style={styles.updateText}>Criar</Text>
            </TouchableOpacity>
          );
        })()}
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
                <TextInput
                  value={routineTitle}
                  onChangeText={setRoutineTitle}
                  placeholder="Título da rotina"
                  placeholderTextColor={colors.grayMid}
                  style={[styles.titleInput, { fontSize: 18 }]}
                />
        </View>

        {selectedExercises.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="fitness-center" size={48} color={colors.grayLight} />
            <Text style={styles.emptyText}>Comece por adicionar um exercício à sua rotina</Text>

            <TouchableOpacity style={styles.primaryButton} onPress={handleAddExercise}>
              <FontAwesome name="plus" size={18} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Adicionar exercício</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {selectedExercises.map((ex) => (
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

                <View style={styles.cardBody}>
                  <TextInput
                    style={styles.notesInput}
                    value={ex.notes}
                    onChangeText={(val) => {
                      setSelectedExercises((prev) =>
                        prev.map((p) => (p.id === ex.id ? { ...p, notes: val } : p)),
                      );
                    }}
                    placeholder="Adicionar notas da rotina..."
                    placeholderTextColor={colors.grayMid}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.setsTable}>
                    <>
                          <View style={styles.setsHeader}>
                        <Text style={styles.setsHeaderIndex}>SÉRIE</Text>
                        <Text style={styles.setsHeaderText}>KG</Text>
                        <Text style={styles.setsHeaderText}>REPS</Text>
                        <Text style={styles.setsHeaderText}>KM</Text>
                        <Text style={styles.setsHeaderText}>TEMPO</Text>
                        <Text style={styles.setsHeaderText}>DEGRAUS/NÍVEL</Text>
                      </View>

                      {ex.sets.map((s, idx) => (
                        <View key={String(s.id ?? idx)} style={styles.setRow}>
                          <Text style={styles.setIndex}>{String(idx + 1)}</Text>

                          <TextInput
                            style={styles.setInput}
                            value={s.weight ?? ''}
                            keyboardType="numeric"
                            onChangeText={(val) => {
                              setSelectedExercises((prev) =>
                                prev.map((p) => {
                                  if (p.id === ex.id) {
                                    const newSets = p.sets.map((ss, si) => (si === idx ? { ...ss, weight: val } : ss));
                                    return { ...p, sets: newSets };
                                  }
                                  return p;
                                }),
                              );
                            }}
                          />

                          <TextInput
                            style={styles.setInput}
                            value={s.reps ?? ''}
                            keyboardType="numeric"
                            onChangeText={(val) => {
                              setSelectedExercises((prev) =>
                                prev.map((p) => {
                                  if (p.id === ex.id) {
                                    const newSets = p.sets.map((ss, si) => (si === idx ? { ...ss, reps: val } : ss));
                                    return { ...p, sets: newSets };
                                  }
                                  return p;
                                }),
                              );
                            }}
                          />

                          <TextInput
                            style={styles.setInput}
                            value={s.distance ?? ''}
                            keyboardType="numeric"
                            onChangeText={(val) => {
                              setSelectedExercises((prev) =>
                                prev.map((p) => {
                                  if (p.id === ex.id) {
                                    const newSets = p.sets.map((ss, si) => (si === idx ? { ...ss, distance: val } : ss));
                                    return { ...p, sets: newSets };
                                  }
                                  return p;
                                }),
                              );
                            }}
                          />

                          <TextInput
                            style={styles.setInput}
                            value={s.time ?? ''}
                            keyboardType="numeric"
                            onChangeText={(val) => {
                              setSelectedExercises((prev) =>
                                prev.map((p) => {
                                  if (p.id === ex.id) {
                                    const newSets = p.sets.map((ss, si) => (si === idx ? { ...ss, time: val } : ss));
                                    return { ...p, sets: newSets };
                                  }
                                  return p;
                                }),
                              );
                            }}
                          />

                          <TextInput
                            style={styles.setInput}
                            value={s.floors ?? ''}
                            keyboardType="numeric"
                            onChangeText={(val) => {
                              setSelectedExercises((prev) =>
                                prev.map((p) => {
                                  if (p.id === ex.id) {
                                    const newSets = p.sets.map((ss, si) => (si === idx ? { ...ss, floors: val } : ss));
                                    return { ...p, sets: newSets };
                                  }
                                  return p;
                                }),
                              );
                            }}
                          />
                        </View>
                      ))}
                    </>

                    <TouchableOpacity style={styles.secondaryButton} onPress={() => addSeriesToExercise(ex.id)}>
                      <FontAwesome name="plus" size={14} color={colors.white} style={{ marginRight: 8 }} />
                      <Text style={styles.secondaryButtonText}>Adicionar Série</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={[styles.primaryButton, { marginTop: 12, width: '100%' }]} onPress={handleAddExercise}>
              <FontAwesome name="plus" size={18} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={[styles.primaryButtonText, { fontSize: 16 }]}>Adicionar exercício</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={closeMenu}>
          <Pressable style={styles.modalBackdrop} onPress={closeMenu}>
            <View style={styles.modalContentCentered}>
              <TouchableOpacity style={[styles.modalDeleteButton, { marginBottom: 8 }]} onPress={() => handleDeleteSeries(menuTargetId)}>
                <Text style={[styles.modalDeleteText, { color: colors.grayLight }]}>Deletar uma série</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalDeleteButton} onPress={() => handleDeleteExercise(menuTargetId)}>
                <Text style={styles.modalDeleteText}>Remover exercício</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
        <Modal visible={publishMenuVisible} transparent animationType="fade" onRequestClose={() => setPublishMenuVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPublishMenuVisible(false)}>
            <View style={styles.modalContentCentered}>
              <Text style={[styles.modalTitle, { marginBottom: 12 }]}>Publicar rotina</Text>

              <TouchableOpacity style={styles.modalOptionButton} onPress={handleRequestApproval}>
                <Text style={styles.modalOptionText}>Solicitar aprovação do professor/personal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalOptionButton, { marginTop: 8 }]} onPress={handleProceedAlone}>
                <Text style={styles.modalOptionText}>Seguir por conta própria</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  cancelText: {
    color: colors.white,
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  updateButton: {
    backgroundColor: colors.red,
  exTarget: { color: '#9A9A9A', fontSize: 12, marginTop: 4 },
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  updateText: {
    color: colors.white,
    fontWeight: '700',
  },
  contentContainer: {
    paddingTop: 28,
    paddingHorizontal: 16,
    paddingBottom: 220,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    color: colors.grayLight,
    marginBottom: 8,
  },
  titleInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    color: colors.white,
    paddingVertical: 8,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  emptyText: {
    color: colors.grayLight,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
    width: width * 0.75,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    width: '80%',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  listWrap: {
    marginTop: 8,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#111',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A0A0A',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderColor: '#111',
    borderWidth: 1,
  },
  modalContentCentered: {
    backgroundColor: '#0A0A0A',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderColor: '#111',
    borderWidth: 1,
    alignItems: 'stretch',
    width: '100%',
  },
  modalDeleteButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalDeleteText: {
    color: colors.red,
    fontWeight: '700',
    fontSize: 16,
  },
  modalCancelButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  modalCancelText: {
    color: colors.grayLight,
    fontSize: 15,
  },
  modalOptionButton: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalOptionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  setsHeaderIndex: {
    color: colors.grayLight,
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  exImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: '#222',
  },
  cardHeaderCenter: {
    flex: 1,
  },
  exName: {
    color: colors.white,
    fontWeight: '700',
  },
  cardBody: {
    marginTop: 12,
  },
  notesText: {
    color: colors.grayLight,
    marginBottom: 8,
  },
  notesInput: {
    color: colors.white,
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#111',
    marginBottom: 8,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  restText: {
    color: colors.grayLight,
    marginLeft: 8,
  },
  setsTable: {
    backgroundColor: 'transparent',
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  setsHeaderText: {
    color: colors.grayLight,
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    justifyContent: 'flex-start',
  },
  setIndex: {
    color: colors.white,
    width: 36,
    textAlign: 'center',
  },
  setInput: {
    color: colors.white,
    flex: 1,
    marginHorizontal: 6,
    textAlign: 'center',
    borderRadius: 6,
    borderWidth: 0,
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
});
