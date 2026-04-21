import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import ImageRotator from '../src/components/ui/image-rotator';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api'; // Importação da API adicionada

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

type SetRow = { id?: string | number; reps?: string; weight?: string; distance?: string; time?: string; floors?: string };

type RoutineExercise = {
  id: string | number;
  name: string;
  image?: string;
  images?: string[]; 
  target?: string; 
  notes?: string;
  restEnabled?: boolean;
  sets: SetRow[];
};

function createEmptySet(): SetRow {
  return { id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`, weight: '', reps: '', distance: '', time: '', floors: '' };
}

export default function CreateRoutine() {
  const router = useRouter();
  const [routineTitle, setRoutineTitle] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTargetId, setMenuTargetId] = useState<string | number | null>(null);
  const [publishMenuVisible, setPublishMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false); // Adicionei o estado de loading caso não tivesse

  // 1. Hidratação inicial
  useEffect(() => {
    const current = (globalThis as any).__CURRENT_ROUTINE_EXERCISES;
    if (Array.isArray(current) && current.length > 0) {
      setSelectedExercises(current);
    }
  }, []);

  // 2. Persistência no cache global
  useEffect(() => {
    (globalThis as any).__CURRENT_ROUTINE_EXERCISES = selectedExercises;
  }, [selectedExercises]);

  // 3. Captura de exercícios vindos da busca
  useFocusEffect(
    useCallback(() => {
      const added = (globalThis as any).__PENDING_SELECTED_EXERCISES;
      if (Array.isArray(added) && added.length > 0) {
        const toAdd: RoutineExercise[] = added.map((p: any) => ({
          id: p.id,
          name: p.name || p.title || '',
          target: p.target || p.muscle || '',
          notes: p.notes || '',
          restEnabled: false,
          sets: Array.isArray(p.sets) && p.sets.length > 0 ? p.sets : [createEmptySet()],
          images: p.images && p.images.length ? p.images : p.image ? [p.image] : p.gifUrl ? [p.gifUrl] : [],
        }));

        setSelectedExercises((prev) => {
          const existingIds = new Set(prev.map((e) => String(e.id)));
          const merged = [...prev];
          for (const ex of toAdd) {
            if (!existingIds.has(String(ex.id))) merged.push(ex);
          }
          return merged;
        });
        delete (globalThis as any).__PENDING_SELECTED_EXERCISES;
      }
    }, [])
  );

  // --- LÓGICA DE SALVAMENTO NO BACK-END (ATUALIZADA) ---
  async function handleProceedAlone() {
    try {
      setLoading(true);
      const payload = {
        titulo: routineTitle,
        exercicios: selectedExercises.map(ex => ({
          exercicio_referencia_id: String(ex.id), 
          series: ex.sets.length,
          repeticoes: String(ex.sets[0]?.reps || "0"),
          carga: String(ex.sets[0]?.weight || "0"),
          observacao: ex.notes || ""
        }))
      };

      console.log("🚀 Enviando rotina:", payload.titulo);

      await api.post('/fichas', payload);
      
      // Limpeza de cache após sucesso
      (globalThis as any).__CURRENT_ROUTINE_EXERCISES = [];
      setPublishMenuVisible(false);
      
      // Feedback e Navegação
      Alert.alert("Sucesso", "Treino salvo no seu perfil!", [
        { 
          text: "OK", 
          onPress: () => {
            // replace remove a tela de 'criar' do histórico, 
            // evitando que o usuário volte para o formulário ao usar o botão 'voltar' do Android
            router.replace('/routines_and_workouts'); 
          } 
        }
      ]);

      // Fallback para Web (onde o Alert.alert às vezes não bloqueia o código)
      if (Platform.OS === 'web') {
        router.replace('/routines_and_workouts');
      }

    } catch (error: any) {
      console.error("Erro ao salvar:", error.response?.data || error.message);
      Alert.alert("Erro", "Não foi possível salvar a rotina no servidor.");
    } finally {
      setLoading(false);
    }
  }

  // --- GERENCIAMENTO DE UI ---
  function openMenuFor(id: string | number) {
    setMenuTargetId(id);
    setMenuVisible(true);
  }

  function handleDeleteExercise(id?: string | number | null) {
    if (id == null) return setMenuVisible(false);
    setSelectedExercises((prev) => prev.filter((ex) => String(ex.id) !== String(id)));
    setMenuVisible(false);
  }

  function addSeriesToExercise(exId: string | number) {
    setSelectedExercises((prev) =>
      prev.map((ex) => ex.id === exId ? { ...ex, sets: [...ex.sets, createEmptySet()] } : ex)
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Criar Rotina</Text>

        <TouchableOpacity 
          style={[styles.updateButton, (!routineTitle || selectedExercises.length === 0) && { opacity: 0.45 }]} 
          onPress={() => setPublishMenuVisible(true)}
          disabled={!routineTitle || selectedExercises.length === 0 || loading}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.updateText}>Criar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <TextInput
            value={routineTitle}
            onChangeText={setRoutineTitle}
            placeholder="Título da rotina"
            placeholderTextColor={colors.grayMid}
            style={styles.titleInput}
          />
        </View>

        {selectedExercises.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="fitness-center" size={48} color={colors.grayLight} />
            <Text style={styles.emptyText}>Comece por adicionar um exercício à sua rotina</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/choose_exercise')}>
              <FontAwesome name="plus" size={18} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Adicionar exercício</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {selectedExercises.map((ex) => (
              <View key={String(ex.id)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <ImageRotator images={ex.images || []} style={styles.exImage} />
                  <View style={styles.cardHeaderCenter}>
                    <Text style={styles.exName}>{ex.name}</Text>
                    <Text style={styles.exTarget}>{muscleMap[String(ex.target).toLowerCase()] || ex.target}</Text>
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
                      setSelectedExercises(prev => prev.map(p => p.id === ex.id ? { ...p, notes: val } : p));
                    }}
                    placeholder="Adicionar notas (ex: cadência 4020)..."
                    placeholderTextColor={colors.grayMid}
                  />

                  <View style={styles.setsTable}>
                    <View style={styles.setsHeader}>
                      <Text style={styles.setsHeaderIndex}>SÉRIE</Text>
                      <Text style={styles.setsHeaderText}>KG</Text>
                      <Text style={styles.setsHeaderText}>REPS</Text>
                    </View>

                    {ex.sets.map((s, idx) => (
                      <View key={String(s.id ?? idx)} style={styles.setRow}>
                        <Text style={styles.setIndex}>{idx + 1}</Text>
                        <TextInput
                          style={styles.setInput}
                          value={s.weight}
                          keyboardType="numeric"
                          onChangeText={(val) => {
                            setSelectedExercises(prev => prev.map(p => {
                              if (p.id === ex.id) {
                                const newSets = p.sets.map((ss, si) => si === idx ? { ...ss, weight: val } : ss);
                                return { ...p, sets: newSets };
                              }
                              return p;
                            }));
                          }}
                        />
                        <TextInput
                          style={styles.setInput}
                          value={s.reps}
                          keyboardType="numeric"
                          onChangeText={(val) => {
                            setSelectedExercises(prev => prev.map(p => {
                              if (p.id === ex.id) {
                                const newSets = p.sets.map((ss, si) => si === idx ? { ...ss, reps: val } : ss);
                                return { ...p, sets: newSets };
                              }
                              return p;
                            }));
                          }}
                        />
                      </View>
                    ))}
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => addSeriesToExercise(ex.id)}>
                      <Text style={styles.secondaryButtonText}>+ Adicionar Série</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addMoreButton} onPress={() => router.push('/choose_exercise')}>
              <Text style={styles.addMoreText}>+ Adicionar mais exercícios</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* MODAL DE PUBLICAÇÃO */}
      <Modal visible={publishMenuVisible} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setPublishMenuVisible(false)}>
          <View style={styles.modalContentCentered}>
            <Text style={styles.modalTitle}>Finalizar Rotina</Text>
            <TouchableOpacity style={styles.modalOptionButton} onPress={handleProceedAlone}>
              <Text style={styles.modalOptionText}>Salvar e Publicar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalOptionButton, { marginTop: 10, backgroundColor: '#222' }]} onPress={() => setPublishMenuVisible(false)}>
              <Text style={styles.modalOptionText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* MODAL DE AÇÕES DO CARD */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.modalContentCentered}>
            <TouchableOpacity style={styles.modalDeleteButton} onPress={() => handleDeleteExercise(menuTargetId)}>
              <Text style={styles.modalDeleteText}>Remover Exercício</Text>
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
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.background
  },
  cancelButton: { backgroundColor: '#2A2A2A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  cancelButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  headerTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  updateButton: { backgroundColor: colors.red, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  updateText: { color: colors.white, fontWeight: '700' },
  contentContainer: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 20 },
  titleInput: { 
    color: colors.white, fontSize: 22, fontWeight: 'bold', 
    borderBottomWidth: 1, borderBottomColor: '#222', paddingVertical: 10 
  },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.grayLight, marginBottom: 20, textAlign: 'center', width: '80%' },
  primaryButton: { 
    backgroundColor: colors.red, flexDirection: 'row', 
    alignItems: 'center', justifyContent: 'center', 
    paddingVertical: 15, borderRadius: 12, width: '90%' 
  },
  primaryButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  listWrap: { marginTop: 10 },
  card: { backgroundColor: '#0A0A0A', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#111' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  exImage: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: '#222' },
  cardHeaderCenter: { flex: 1 },
  exName: { color: colors.white, fontWeight: '700', fontSize: 16 },
  exTarget: { color: '#9A9A9A', fontSize: 12, marginTop: 4 },
  cardBody: { marginTop: 5 },
  notesInput: { 
    color: colors.white, backgroundColor: '#111', borderRadius: 8, 
    padding: 12, marginBottom: 15, fontSize: 14, textAlignVertical: 'top' 
  },
  setsTable: { marginTop: 5 },
  setsHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 8 },
  setsHeaderIndex: { color: colors.grayLight, width: 40, fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  setsHeaderText: { color: colors.grayLight, flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 'bold' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  setIndex: { color: colors.white, width: 40, fontWeight: 'bold', textAlign: 'center' },
  setInput: { 
    color: colors.white, flex: 1, textAlign: 'center', 
    backgroundColor: '#1A1A1A', marginHorizontal: 5, borderRadius: 6, height: 38 
  },
  secondaryButton: { marginTop: 10, alignItems: 'center', padding: 10 },
  secondaryButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 13, opacity: 0.8 },
  addMoreButton: { 
    padding: 20, alignItems: 'center', borderWidth: 1, 
    borderColor: '#222', borderStyle: 'dashed', borderRadius: 12, marginTop: 10 
  },
  addMoreText: { color: colors.grayMid, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContentCentered: { backgroundColor: '#111', width: '85%', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  modalTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  modalOptionButton: { backgroundColor: colors.red, padding: 15, borderRadius: 12, alignItems: 'center', width: '100%' },
  modalOptionText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  modalDeleteButton: { padding: 15, width: '100%', alignItems: 'center' },
  modalDeleteText: { color: colors.red, fontWeight: 'bold', fontSize: 16 },
});