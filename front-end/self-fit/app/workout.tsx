import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, TextInput, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';
import { colors } from '../src/components/ui/theme';
import { buildNameMap } from '../src/services/exerciseApi';

type SeriesState = {
  weight: string;
  reps: string;
  distance: string;
  time: string;
  done: boolean;
};

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [routine, setRoutine] = useState<any>(null);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [seriesData, setSeriesData] = useState<SeriesState[][]>([]);
  const [startTime] = useState(new Date());

  useEffect(() => { loadWorkoutDetails(); }, [id]);

  async function loadWorkoutDetails() {
    try {
      setLoading(true);
      const [response, map] = await Promise.all([
        api.get(`/fichas/${id}`),
        buildNameMap(),
      ]);
      setRoutine(response.data);
      setNameMap(map);
      const initial: SeriesState[][] = response.data.exercicios.map((ex: any) =>
        Array.from({ length: Math.max(Number(ex.series) || 1, 1) }, () => ({
          weight: String(ex.carga || ''),
          reps: String(ex.repeticoes || ''),
          distance: '',
          time: '',
          done: false,
        }))
      );
      setSeriesData(initial);
    } catch (error) {
      console.error('Erro ao carregar treino:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do treino.');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  function updateSeries(seriesIdx: number, field: 'weight' | 'reps', value: string) {
    setSeriesData(prev => {
      const next = prev.map(ex => [...ex]);
      next[currentExIdx] = next[currentExIdx].map((s, i) =>
        i === seriesIdx ? { ...s, [field]: value } : s
      );
      return next;
    });
  }

  function toggleDone(seriesIdx: number) {
    setSeriesData(prev => {
      const next = prev.map(ex => [...ex]);
      next[currentExIdx] = next[currentExIdx].map((s, i) =>
        i === seriesIdx ? { ...s, done: !s.done } : s
      );
      return next;
    });
  }

  async function handleFinishWorkout() {
    try {
      setSaving(true);
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000) || 1;
      const totalVolume = seriesData.reduce((acc, exSeries) =>
        acc + exSeries.reduce((s, set) =>
          s + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0), 0);

      const payload = {
        titulo: routine.titulo,
        duracao_minutos: durationMinutes,
        volume_total: totalVolume,
        exercicios: routine.exercicios.map((ex: any, idx: number) => ({
          nome: nameMap[ex.exercicio_referencia_id] || ex.exercicio_referencia_id,
          series: (seriesData[idx] || []).length,
          repeticoes: String(seriesData[idx]?.[0]?.reps || ex.repeticoes),
          carga: String(seriesData[idx]?.[0]?.weight || ex.carga),
        })),
      };

      await api.post('/alunos/finalizar-treino', payload);
      Alert.alert('Treino Finalizado! 🏆', `Volume: ${totalVolume.toFixed(1)}kg\nDuração: ${durationMinutes}min`, [
        { text: 'Ver Histórico', onPress: () => router.replace('/previous_workouts') },
      ]);
      if (Platform.OS === 'web') router.replace('/previous_workouts');
    } catch (error: any) {
      console.error('Erro ao salvar:', error.response?.data || error.message);
      Alert.alert('Erro', 'O treino foi concluído, mas não conseguimos salvar no histórico.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.red} />
        <Text style={{ color: '#fff', marginTop: 10 }}>Preparando seu treino...</Text>
      </View>
    );
  }

  const exercises = routine?.exercicios || [];
  const totalExercises = exercises.length;
  const currentEx = exercises[currentExIdx];
  const currentSeries = seriesData[currentExIdx] || [];
  const allDone = currentSeries.every(s => s.done);
  const isLast = currentExIdx === totalExercises - 1;
  const exName = nameMap[currentEx?.exercicio_referencia_id] || currentEx?.exercicio_referencia_id || '';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{routine?.titulo}</Text>
          <Text style={styles.headerSub}>Exercício {currentExIdx + 1} de {totalExercises}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {/* Exercise name */}
      <View style={styles.exNameContainer}>
        <Text style={styles.exName}>{exName}</Text>
        {/* Progress dots */}
        <View style={styles.progressDots}>
          {exercises.map((_: any, i: number) => (
            <View key={i} style={[styles.dot, i === currentExIdx && styles.dotActive, i < currentExIdx && styles.dotDone]} />
          ))}
        </View>
      </View>

      {/* Series list */}
      <ScrollView style={styles.seriesList} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Column header */}
        <View style={styles.seriesHeader}>
          <Text style={styles.colIdx}>SÉRIE</Text>
          <Text style={styles.colLabel}>KG</Text>
          <Text style={styles.colLabel}>KM</Text>
          <Text style={styles.colLabel}>REPS</Text>
          <Text style={styles.colLabel}>TEMPO</Text>
          <Text style={styles.colCheck}>✓</Text>
        </View>

        {currentSeries.map((series, idx) => (
          <View key={idx} style={[styles.seriesRow, series.done && styles.seriesRowDone]}>
            <Text style={[styles.seriesIdx, series.done && styles.textDone]}>{idx + 1}</Text>
            <TextInput style={[styles.seriesInput, series.done && styles.inputDone]} value={series.weight} keyboardType="numeric" placeholder="-" placeholderTextColor="#444" onChangeText={v => updateSeries(idx, 'weight', v)} editable={!series.done} />
            <TextInput style={[styles.seriesInput, series.done && styles.inputDone]} value={series.distance} keyboardType="numeric" placeholder="-" placeholderTextColor="#444" onChangeText={v => updateSeries(idx, 'distance', v)} editable={!series.done} />
            <TextInput style={[styles.seriesInput, series.done && styles.inputDone]} value={series.reps} keyboardType="numeric" placeholder="-" placeholderTextColor="#444" onChangeText={v => updateSeries(idx, 'reps', v)} editable={!series.done} />
            <TextInput style={[styles.seriesInput, series.done && styles.inputDone]} value={series.time} keyboardType="numeric" placeholder="-" placeholderTextColor="#444" onChangeText={v => updateSeries(idx, 'time', v)} editable={!series.done} />
            <TouchableOpacity style={[styles.checkBtn, series.done && styles.checkBtnDone]} onPress={() => toggleDone(idx)}>
              <Ionicons name={series.done ? 'checkmark-circle' : 'checkmark-circle-outline'} size={30} color={series.done ? '#4CAF50' : '#333'} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.prevBtn, currentExIdx === 0 && { opacity: 0.3 }]}
          disabled={currentExIdx === 0}
          onPress={() => setCurrentExIdx(p => p - 1)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.white} />
          <Text style={styles.prevBtnText}>Anterior</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextBtn, saving && { opacity: 0.6 }]}
          disabled={saving}
          onPress={() => {
            if (!isLast) setCurrentExIdx(p => p + 1);
            else handleFinishWorkout();
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>{isLast ? 'Finalizar' : 'Próximo'}</Text>
              <Ionicons name={isLast ? 'trophy-outline' : 'arrow-forward'} size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  headerSub: { color: colors.grayMid, fontSize: 12, marginTop: 2 },
  exNameContainer: { paddingHorizontal: 20, paddingVertical: 18 },
  exName: { color: colors.red, fontSize: 26, fontWeight: '900', marginBottom: 12 },
  progressDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#222' },
  dotActive: { backgroundColor: colors.red, width: 20 },
  dotDone: { backgroundColor: '#444' },
  seriesList: { flex: 1, paddingHorizontal: 20 },
  seriesHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', marginBottom: 6,
  },
  colIdx: { color: colors.grayMid, fontSize: 10, fontWeight: 'bold', width: 34, textAlign: 'center' },
  colLabel: { flex: 1, minWidth: 0, color: colors.grayMid, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  colCheck: { width: 38, color: colors.grayMid, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  seriesRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, borderRadius: 8, marginBottom: 4,
    paddingHorizontal: 0,
  },
  seriesRowDone: { backgroundColor: '#0A1A0A' },
  seriesIdx: { color: colors.white, width: 34, fontWeight: 'bold', textAlign: 'center', fontSize: 14 },
  textDone: { color: '#4CAF50' },
  seriesInput: {
    flex: 1, minWidth: 0, height: 38, backgroundColor: '#1A1A1A', color: colors.white,
    borderRadius: 6, textAlign: 'center', fontSize: 14, fontWeight: '700',
    marginHorizontal: 2, padding: 0,
  },
  inputDone: { backgroundColor: '#0F1F0F', color: '#4CAF50' },
  checkBtn: { width: 48, alignItems: 'center' },
  checkBtnDone: {},
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#111',
  },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12 },
  prevBtnText: { color: colors.grayMid, fontWeight: '600' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.red, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, elevation: 4,
  },
  nextBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});