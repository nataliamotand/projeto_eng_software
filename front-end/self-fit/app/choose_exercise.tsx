import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import ImageRotator from '../src/components/ui/image-rotator';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useExercises } from '../src/hooks/useExercises';
import { muscleOptions, displayMuscleLabel } from '../src/constants/muscles';
import { colors } from '../src/components/ui/theme';

const { width } = Dimensions.get('window');

type Exercise = {
  id?: string | number;
  name: string;
  target?: string;
  muscle?: string;
  gifUrl?: string;
  images?: string[];
  [key: string]: any;
};

export default function ChooseExercise() {
  const router = useRouter();
  const [selectedExercises, setSelectedExercises] = useState<Array<string | number>>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const { 
    exercises, 
    isLoading, 
    searchQuery, 
    setSearchQuery, 
    setMuscleFilter, 
    loadMore, 
    isLoadingMore, 
    hasMore 
  } = useExercises() as any;

  useEffect(() => {
    setMuscleFilter(selectedMuscle || 'Todos os Músculos');
  }, [selectedMuscle, setMuscleFilter]);

  const data = Array.isArray(exercises) ? exercises : [];

  const toggleSelect = useCallback((id: string | number) => {
    try {
      const existing = (globalThis as any).__CURRENT_ROUTINE_EXERCISES || [];
      const existingIds = existing.map((e: any) => String(e.id));
      
      if (existingIds.includes(String(id))) {
        return;
      }
    } catch (e) { /* ignore */ }

    setSelectedExercises((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      return [...prev, id];
    });
  }, []);

  // --- ALTERAÇÃO AQUI: CAPTURA DO ID ---
  const handleConfirmSelection = () => {
    const chosen = data
      .filter((it) => {
        const idToCompare = it.id ?? it.name;
        return selectedExercises.includes(idToCompare as string | number);
      })
      .map((it) => {
        // Se a API mandar o ID como "0001", o parseInt lá na frente funciona.
        // Se ela não mandar ID nenhum, usamos um timestamp temporário para não ser null.
        const fallbackId = Math.floor(Math.random() * 10000);
        const finalId = it.id ?? fallbackId;

        console.log(`📤 Enviando para criação: ${it.name} | ID: ${finalId}`);

        return {
          id: finalId, 
          name: it.name,
          images: it.images && it.images.length ? it.images : [it.gifUrl],
          target: it.target || it.muscle || '',
          sets: [{ id: Date.now().toString(), weight: '', reps: '' }],
          notes: ''
        };
      });

    if (chosen.length > 0) {
      (globalThis as any).__PENDING_SELECTED_EXERCISES = chosen;
      router.back();
    }
  };

  const renderExerciseItem = useCallback(({ item }: { item: Exercise }) => {
    const id = item.id ?? item.name;
    const isSelected = selectedExercises.includes(id as string | number);
    const targetLabel = item.target || item.muscle ? displayMuscleLabel(item.target || item.muscle) : '';

    return (
      <TouchableOpacity
        onPress={() => toggleSelect(id as string | number)}
        activeOpacity={0.7}
        style={[styles.card, isSelected ? styles.cardSelected : null]}
      >
        {isSelected && <View style={styles.selectedBar} />}

        <ImageRotator 
          images={item.images && item.images.length ? item.images : item.gifUrl ? [item.gifUrl] : []} 
          style={styles.thumb} 
        />

        <View style={styles.cardCenter}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseTarget}>{targetLabel}</Text>
        </View>

        <View style={styles.cardRight}>
          <MaterialIcons 
            name={isSelected ? "check-circle" : "add-circle-outline"} 
            size={24} 
            color={isSelected ? colors.red : colors.grayMid} 
          />
        </View>
      </TouchableOpacity>
    );
  }, [selectedExercises, toggleSelect]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backTouch}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adicionar Exercício</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.grayMid} style={{ marginLeft: 12 }} />
          <TextInput
            placeholder="Procurar exercício..."
            placeholderTextColor={colors.grayMid}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.chip, selectedMuscle === null && styles.chipActive]} 
              onPress={() => setSelectedMuscle(null)}
            >
              <Text style={[styles.chipText, selectedMuscle === null && styles.chipTextActive]}>Todos</Text>
            </TouchableOpacity>

            {muscleOptions.map((key) => (
              <TouchableOpacity 
                key={key} 
                style={[styles.chip, selectedMuscle === key && styles.chipActive]} 
                onPress={() => setSelectedMuscle(key)}
              >
                <Text style={[styles.chipText, selectedMuscle === key && styles.chipTextActive]}>
                  {displayMuscleLabel(key)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(it, idx) => String(it.id ?? idx)}
            renderItem={renderExerciseItem}
            contentContainerStyle={{ paddingBottom: 120 }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            onEndReached={() => hasMore && loadMore()}
            onEndReachedThreshold={0.5}
            ListFooterComponent={isLoadingMore ? <ActivityIndicator color={colors.red} style={{ margin: 16 }} /> : null}
          />
        )}
      </View>

      {selectedExercises.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleConfirmSelection}>
          <Text style={styles.fabText}>
            Adicionar {selectedExercises.length} exercício{selectedExercises.length > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// Estilos mantidos iguais...
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { 
    paddingHorizontal: 16, paddingTop: 40, paddingBottom: 12, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' 
  },
  backTouch: { width: 32 },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  container: { flex: 1, paddingHorizontal: 16 },
  searchBox: { 
    backgroundColor: colors.darkNav, borderRadius: 25, 
    flexDirection: 'row', alignItems: 'center', height: 45, marginTop: 10 
  },
  searchInput: { flex: 1, color: colors.white, marginLeft: 10, fontSize: 14 },
  filterRow: { marginVertical: 15 },
  chip: { backgroundColor: '#1A1A1A', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: colors.red },
  chipText: { color: '#888', fontSize: 13 },
  chipTextActive: { color: colors.white, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111' },
  cardSelected: { backgroundColor: '#0D0D0D' },
  selectedBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.red },
  thumb: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', marginRight: 12 },
  cardCenter: { flex: 1 },
  exerciseName: { color: colors.white, fontSize: 15, fontWeight: '600' },
  exerciseTarget: { color: '#9A9A9A', fontSize: 12, marginTop: 4 },
  cardRight: { width: 40, alignItems: 'center' },
  separator: { height: 1, backgroundColor: '#0D0D0D' },
  fab: { 
    position: 'absolute', bottom: 30, width: '90%', alignSelf: 'center', 
    backgroundColor: colors.red, paddingVertical: 16, borderRadius: 12, 
    alignItems: 'center', elevation: 8, shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 
  },
  fabText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});