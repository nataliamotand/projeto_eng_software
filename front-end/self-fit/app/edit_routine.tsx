import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../src/services/api';
import { colors } from '../src/components/ui/theme';
import ImageRotator from '../src/components/ImageRotator';
import { buildNameMap } from '../src/services/exerciseApi';

type SetRow = { id: string; weight: string; reps: string; distance: string; time: string; };

interface RoutineExercise {
  id: string | number;
  name: string;
  target: string;
  category: string;
  notes: string;
  sets: SetRow[];
}

function makeSet(weight = '', reps = '', idx = 0): SetRow {
  return { id: `${Date.now()}_${idx}`, weight, reps, distance: '', time: '' };
}

export default function EditRoutine() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Captura o ID da rotina vindo da navegação

  const [routineTitle, setRoutineTitle] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Controle de menus
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTargetId, setMenuTargetId] = useState<string | number | null>(null);

  // Cache key único por rotina para não conflitar com create_routine
  const cacheKey = `__EDIT_ROUTINE_EXERCISES_${id}`;
  const titleCacheKey = `__EDIT_ROUTINE_TITLE_${id}`;

  // 1. CARREGAR DADOS EXISTENTES (HIDRATAÇÃO)
  useEffect(() => {
    if (!id) return;
    // Se já temos dados em cache (voltando de choose_exercise), usa o cache
    const cached = (globalThis as any)[cacheKey];
    const cachedTitle = (globalThis as any)[titleCacheKey];
    if (Array.isArray(cached) && cached.length > 0) {
      setSelectedExercises(cached);
      if (cachedTitle) setRoutineTitle(cachedTitle);
      setLoading(false);
    } else {
      loadRoutineData();
    }
  }, [id]);

  // Persiste exercícios no cache global toda vez que mudam
  useEffect(() => {
    if (!loading) {
      (globalThis as any)[cacheKey] = selectedExercises;
    }
  }, [selectedExercises, loading]);

  // Persiste o título no cache global
  useEffect(() => {
    if (routineTitle) {
      (globalThis as any)[titleCacheKey] = routineTitle;
    }
  }, [routineTitle]);

  async function loadRoutineData() {
    try {
      setLoading(true);
      // Carrega dados da rotina e mapa de nomes em paralelo
      const [response, nameMap] = await Promise.all([
        api.get(`/fichas/${id}`),
        buildNameMap(),
      ]);
      const data = response.data;

      setRoutineTitle(data.titulo);
      
      // Mapeia os exercícios usando o nome correto do JSON local e expande séries individuais
      const mappedExercises = data.exercicios.map((ex: any) => {
        const refId = String(ex.exercicio_referencia_id);
        const count = Math.max(Number(ex.series) || 1, 1);
        const sets: SetRow[] = Array.from({ length: count }, (_, i) =>
          makeSet(String(ex.carga || ''), String(ex.repeticoes || ''), i)
        );
        return {
          id: refId,
          name: nameMap[refId] || refId,
          target: '',
          category: '',
          notes: ex.observacao || '',
          sets,
        };
      });

      setSelectedExercises(mappedExercises);
    } catch (error) {
      console.error("Erro ao carregar rotina:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados da rotina.");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  // 2. CAPTURAR NOVOS EXERCÍCIOS ao voltar de choose_exercise
  useFocusEffect(
    useCallback(() => {
      const added = (globalThis as any).__PENDING_SELECTED_EXERCISES;
      if (Array.isArray(added) && added.length > 0) {
        const toAdd = added.map((p: any) => ({
          id: p.id,
          name: p.name || p.title || '',
          target: p.target || p.muscle || '',
          category: p.category || '',
          notes: '',
          sets: [makeSet('', '12')],
        }));

        setSelectedExercises(prev => {
          const existingIds = new Set(prev.map(e => String(e.id)));
          const merged = [...prev, ...toAdd.filter(ex => !existingIds.has(String(ex.id)))];
          (globalThis as any)[cacheKey] = merged; // Atualiza cache imediatamente
          return merged;
        });
        delete (globalThis as any).__PENDING_SELECTED_EXERCISES;
      }
    }, [])
  );

  // 3. SALVAR ALTERAÇÕES (PUT)
  async function handleUpdate() {
    if (!routineTitle) return Alert.alert("Ops", "Dê um título para a sua rotina.");
    
    try {
      setSaving(true);
      const payload = {
        titulo: routineTitle,
        exercicios: selectedExercises.map(ex => ({
          exercicio_referencia_id: String(ex.id),
          series: ex.sets.length,
          repeticoes: String(ex.sets[0]?.reps || '0'),
          carga: String(ex.sets[0]?.weight || '0'),
          observacao: ex.notes
        }))
      };

      await api.put(`/fichas/${id}`, payload);

      // Limpa o cache ao salvar com sucesso
      delete (globalThis as any)[cacheKey];
      delete (globalThis as any)[titleCacheKey];

      Alert.alert("Sucesso", "Rotina atualizada com sucesso!", [
        { text: "OK", onPress: () => router.replace('/routines_and_workouts') }
      ]);

      if (Platform.OS === 'web') router.replace('/routines_and_workouts');

    } catch (error) {
      console.error("Erro ao atualizar:", error);
      Alert.alert("Erro", "Falha ao salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  function updateSet(exId: string | number, setIdx: number, field: keyof SetRow, value: string) {
    setSelectedExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      const sets = ex.sets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s);
      return { ...ex, sets };
    }));
  }

  function addSet(exId: string | number) {
    setSelectedExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, makeSet(last?.weight || '', last?.reps || '', ex.sets.length)] };
    }));
  }

  function removeSet(exId: string | number, setIdx: number) {
    setSelectedExercises(prev => prev.map(ex => {
      if (ex.id !== exId || ex.sets.length <= 1) return ex;
      return { ...ex, sets: ex.sets.filter((_, i) => i !== setIdx) };
    }));
  }

  function updateNotes(exId: string | number, value: string) {
    setSelectedExercises(prev => prev.map(ex => ex.id === exId ? { ...ex, notes: value } : ex));
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.red} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Rotina</Text>
        <TouchableOpacity onPress={handleUpdate} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={colors.red} /> : <Text style={styles.saveText}>Salvar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          style={styles.titleInput}
          value={routineTitle}
          onChangeText={setRoutineTitle}
          placeholder="Título da rotina"
          placeholderTextColor="#666"
        />

        {selectedExercises.map((ex) => (
          <View key={String(ex.id)} style={styles.exerciseCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <TouchableOpacity onPress={() => { setMenuTargetId(ex.id); setMenuVisible(true); }}>
                <Ionicons name="trash-outline" size={20} color={colors.red} />
              </TouchableOpacity>
            </View>

            {/* Column Headers */}
            <View style={styles.setsHeader}>
              <Text style={styles.setsHeaderIndex}>SÉRIE</Text>
              <Text style={styles.setsHeaderText}>KG</Text>
              <Text style={styles.setsHeaderText}>KM</Text>
              <Text style={styles.setsHeaderText}>REPS</Text>
              <Text style={styles.setsHeaderText}>TEMPO</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Each Set Row */}
            {ex.sets.map((s, idx) => (
              <View key={s.id} style={styles.setRow}>
                <Text style={styles.setIndex}>{idx + 1}</Text>
                <TextInput style={styles.setInput} value={s.weight} keyboardType="numeric" placeholder="-" placeholderTextColor="#333" onChangeText={v => updateSet(ex.id, idx, 'weight', v)} />
                <TextInput style={styles.setInput} value={s.distance} keyboardType="numeric" placeholder="-" placeholderTextColor="#333" onChangeText={v => updateSet(ex.id, idx, 'distance', v)} />
                <TextInput style={styles.setInput} value={s.reps} keyboardType="numeric" placeholder="-" placeholderTextColor="#333" onChangeText={v => updateSet(ex.id, idx, 'reps', v)} />
                <TextInput style={styles.setInput} value={s.time} keyboardType="numeric" placeholder="-" placeholderTextColor="#333" onChangeText={v => updateSet(ex.id, idx, 'time', v)} />
                <TouchableOpacity onPress={() => removeSet(ex.id, idx)} style={{ padding: 4 }}>
                  <Ionicons name="remove-circle-outline" size={20} color="#444" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Series button */}
            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(ex.id)}>
              <Ionicons name="add-circle-outline" size={18} color={colors.red} />
              <Text style={styles.addSetText}>Adicionar série</Text>
            </TouchableOpacity>

            {/* Notes */}
            <TextInput
              style={styles.notesInput}
              value={ex.notes}
              placeholder="Observações..."
              placeholderTextColor="#444"
              onChangeText={v => updateNotes(ex.id, v)}
            />
          </View>
        ))}

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/choose_exercise')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Adicionar mais exercícios</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de confirmação de exclusão de item */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={{color: '#fff', marginBottom: 20}}>Remover este exercício da rotina?</Text>
            <TouchableOpacity 
              style={styles.btnDelete}
              onPress={() => {
                setSelectedExercises(prev => prev.filter(e => e.id !== menuTargetId));
                setMenuVisible(false);
              }}
            >
              <Text style={{color: '#fff', fontWeight: 'bold'}}>Remover</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelText: { color: '#666', fontSize: 16 },
  saveText: { color: colors.red, fontSize: 16, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  titleInput: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 10 },
  exerciseCard: { backgroundColor: '#111', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exerciseName: { color: '#fff', fontSize: 15, fontWeight: 'bold', flex: 1, marginRight: 8 },
  setsHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', marginBottom: 4 },
  setsHeaderIndex: { color: '#555', fontSize: 10, fontWeight: 'bold', width: 36, textAlign: 'center' },
  setsHeaderText: { flex: 1, color: '#555', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  setIndex: { color: '#888', width: 36, textAlign: 'center', fontWeight: 'bold' },
  setInput: { flex: 1, backgroundColor: '#1A1A1A', color: '#fff', borderRadius: 8, textAlign: 'center', paddingVertical: 8, marginHorizontal: 4, fontSize: 15, fontWeight: '600' },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingVertical: 6, gap: 6 },
  addSetText: { color: colors.red, fontSize: 13, fontWeight: '600' },
  notesInput: { color: '#888', marginTop: 10, fontSize: 13, fontStyle: 'italic', borderTopWidth: 1, borderTopColor: '#1A1A1A', paddingTop: 10 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, padding: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', borderRadius: 10 },
  addButtonText: { color: '#fff', marginLeft: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#111', padding: 30, borderRadius: 20, alignItems: 'center' },
  btnDelete: { backgroundColor: colors.red, paddingHorizontal: 30, paddingVertical: 10, borderRadius: 10 }
});