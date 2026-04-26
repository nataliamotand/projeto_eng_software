import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ActivityIndicator, Alert, Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../src/services/api';
import { colors } from '../src/components/ui/theme';

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [routine, setRoutine] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime] = useState(new Date()); // Marca o início do treino

  useEffect(() => {
    loadWorkoutDetails();
  }, [id]);

  async function loadWorkoutDetails() {
    try {
      setLoading(true);
      const response = await api.get(`/fichas/${id}`);
      setRoutine(response.data);
    } catch (error) {
      console.error("Erro ao carregar treino:", error);
      Alert.alert("Erro", "Não foi possível carregar os detalhes do treino.");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA DE FINALIZAÇÃO ---
  async function handleFinishWorkout() {
    try {
      setSaving(true);

      // 1. Cálculo de Duração (Engenharia básica: tempo_fim - tempo_inicio)
      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.floor(durationMs / 60000) || 1; // Mínimo 1 min

      // 2. Cálculo de Volume Total (Carga x Reps x Séries)
      const totalVolume = routine.exercicios.reduce((acc: number, ex: any) => {
        const weight = parseFloat(ex.carga) || 0;
        const reps = parseInt(ex.repeticoes) || 0;
        return acc + (weight * reps * ex.series);
      }, 0);

      // 3. Montagem do Payload para o Histórico
      const payload = {
        titulo: routine.titulo,
        duracao_minutos: durationMinutes,
        volume_total: totalVolume,
        exercicios: routine.exercicios.map((ex: any) => ({
          nome: ex.exercicio_referencia_id,
          series: ex.series,
          repeticoes: ex.repeticoes,
          carga: ex.carga
        }))
      };

      console.log("📡 Salvando treino no histórico...");
      await api.post('/alunos/finalizar-treino', payload);

      Alert.alert("Treino Finalizado!", `Bom trabalho!\nVolume: ${totalVolume}kg\nDuração: ${durationMinutes}min`, [
        { text: "Ver Histórico", onPress: () => router.replace('/previous_workouts') }
      ]);

      // Fallback para Web
      if (Platform.OS === 'web') {
        router.replace('/previous_workouts');
      }

    } catch (error: any) {
      console.error("Erro ao salvar treino:", error.response?.data || error.message);
      Alert.alert("Erro", "O treino foi concluído, mas não conseguimos salvar no histórico.");
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

  const currentExercise = routine?.exercicios[currentIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{routine?.titulo}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* Card do Exercício Atual */}
        <View style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>
            {currentExercise?.exercicio_referencia_id.replace(/_/g, ' ')}
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SÉRIES</Text>
              <Text style={styles.statValue}>{currentExercise?.series}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>REPS</Text>
              <Text style={styles.statValue}>{currentExercise?.repeticoes}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>CARGA</Text>
              <Text style={styles.statValue}>{currentExercise?.carga} kg</Text>
            </View>
          </View>

          {currentExercise?.observacao && (
            <Text style={styles.obsText}>Obs: {currentExercise.observacao}</Text>
          )}
        </View>

        <View style={styles.timerPlaceholder}>
            <MaterialCommunityIcons name="timer-outline" size={40} color={colors.grayMid} />
            <Text style={styles.timerText}>Aguardando descanso...</Text>
            <Text style={{color: colors.grayMid, fontSize: 12}}>Exercício {currentIndex + 1} de {routine?.exercicios.length}</Text>
        </View>
      </View>

      {/* Navegação entre exercícios */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.navButton, currentIndex === 0 && { opacity: 0.3 }]}
          disabled={currentIndex === 0 || saving}
          onPress={() => setCurrentIndex(prev => prev - 1)}
        >
          <Text style={styles.navButtonText}>Anterior</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.mainButton, saving && { opacity: 0.7 }]}
          disabled={saving}
          onPress={() => {
            if (currentIndex < routine.exercicios.length - 1) {
              setCurrentIndex(prev => prev + 1);
            } else {
              handleFinishWorkout(); // <--- CHAMA A FUNÇÃO REAL DE SALVAMENTO
            }
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.mainButtonText}>
              {currentIndex === routine.exercicios.length - 1 ? "Finalizar" : "Próximo"}
            </Text>
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
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#111'
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  exerciseCard: { 
    backgroundColor: '#111', 
    borderRadius: 20, 
    padding: 25, 
    borderWidth: 1, 
    borderColor: '#222' 
  },
  exerciseName: { color: colors.red, fontSize: 24, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  statBox: { alignItems: 'center' },
  statLabel: { color: colors.grayMid, fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '700' },
  obsText: { color: colors.grayMid, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  timerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timerText: { color: colors.grayMid, fontSize: 18, marginTop: 10, marginBottom: 5 },
  footer: { 
    flexDirection: 'row', 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#111',
    justifyContent: 'space-between'
  },
  navButton: { padding: 15 },
  navButtonText: { color: colors.grayMid, fontWeight: 'bold' },
  mainButton: { 
    backgroundColor: colors.red, 
    minWidth: 140,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});