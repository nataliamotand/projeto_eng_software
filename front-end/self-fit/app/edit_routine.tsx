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

// Tipagem baseada no seu modelo de dados
interface RoutineExercise {
  id: string | number;
  name: string;
  target: string;
  notes: string;
  series: number;
  weight: string;
  reps: string;
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

  // 1. CARREGAR DADOS EXISTENTES (HIDRATAÇÃO)
  useEffect(() => {
    if (id) loadRoutineData();
  }, [id]);

  async function loadRoutineData() {
    try {
      setLoading(true);
      const response = await api.get(`/fichas/${id}`);
      const data = response.data;

      setRoutineTitle(data.titulo);
      
      // Mapeia os exercícios do banco para o formato do estado do Front-end
      const mappedExercises = data.exercicios.map((ex: any) => ({
        id: ex.exercicio_referencia_id, // Ex: "3_4_Sit-Up"
        name: ex.exercicio_referencia_id.replace(/_/g, ' '),
        target: '', // Opcional: buscar na API de exercícios se necessário
        notes: ex.observacao || '',
        series: ex.series,
        weight: String(ex.carga),
        reps: String(ex.repeticoes)
      }));

      setSelectedExercises(mappedExercises);
    } catch (error) {
      console.error("Erro ao carregar rotina:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados da rotina.");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  // 2. CAPTURAR NOVOS EXERCÍCIOS (Caso o usuário adicione mais na edição)
  useFocusEffect(
    useCallback(() => {
      const added = (globalThis as any).__PENDING_SELECTED_EXERCISES;
      if (Array.isArray(added) && added.length > 0) {
        const toAdd = added.map((p: any) => ({
          id: p.id,
          name: p.name || p.title || '',
          target: p.target || p.muscle || '',
          notes: '',
          series: 3,
          weight: "0",
          reps: "12"
        }));

        setSelectedExercises(prev => {
          const existingIds = new Set(prev.map(e => String(e.id)));
          return [...prev, ...toAdd.filter(ex => !existingIds.has(String(ex.id)))];
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
          series: Number(ex.series),
          repeticoes: String(ex.reps),
          carga: String(ex.weight),
          observacao: ex.notes
        }))
      };

      await api.put(`/fichas/${id}`, payload);

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

  // Funções de manipulação local
  function updateEx(exId: string | number, field: keyof RoutineExercise, value: any) {
    setSelectedExercises(prev => prev.map(ex => ex.id === exId ? { ...ex, [field]: value } : ex));
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
            <View style={styles.cardHeader}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <TouchableOpacity onPress={() => { setMenuTargetId(ex.id); setMenuVisible(true); }}>
                <Ionicons name="trash-outline" size={20} color={colors.red} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputsRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Séries</Text>
                <TextInput
                  style={styles.smallInput}
                  value={String(ex.series)}
                  keyboardType="numeric"
                  onChangeText={(v) => updateEx(ex.id, 'series', v)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reps</Text>
                <TextInput
                  style={styles.smallInput}
                  value={ex.reps}
                  keyboardType="numeric"
                  onChangeText={(v) => updateEx(ex.id, 'reps', v)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput
                  style={styles.smallInput}
                  value={ex.weight}
                  keyboardType="numeric"
                  onChangeText={(v) => updateEx(ex.id, 'weight', v)}
                />
              </View>
            </View>

            <TextInput
              style={styles.notesInput}
              value={ex.notes}
              placeholder="Observações..."
              placeholderTextColor="#444"
              onChangeText={(v) => updateEx(ex.id, 'notes', v)}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  exerciseName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  inputsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { alignItems: 'center' },
  label: { color: '#666', fontSize: 10, marginBottom: 5, fontWeight: 'bold' },
  smallInput: { backgroundColor: '#1A1A1A', color: '#fff', width: 60, textAlign: 'center', padding: 10, borderRadius: 8 },
  notesInput: { color: '#888', marginTop: 15, fontSize: 13, fontStyle: 'italic' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, padding: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', borderRadius: 10 },
  addButtonText: { color: '#fff', marginLeft: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#111', padding: 30, borderRadius: 20, alignItems: 'center' },
  btnDelete: { backgroundColor: colors.red, paddingHorizontal: 30, paddingVertical: 10, borderRadius: 10 }
});