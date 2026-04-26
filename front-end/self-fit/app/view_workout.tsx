import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';
import { colors } from '../src/components/ui/theme';

export default function ViewWorkout() {
  const router = useRouter();
  const { treinoId, alunoNome } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/treinos/detalhes/${treinoId}`);
        setWorkout(res.data);
      } catch (e) {
        console.error("Erro ao carregar detalhes:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [treinoId]);

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={colors.red} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Simples Customizado */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resumo do Treino</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topCard}>
          <Text style={styles.alunoName}>{alunoNome}</Text>
          <Text style={styles.workoutTitle}>{workout?.titulo}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={colors.red} />
              <Text style={styles.metaText}>{workout?.duracao_minutos} min</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="weight-lifter" size={16} color={colors.red} />
              <Text style={styles.metaText}>{workout?.volume_total} kg vol.</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>EXERCÍCIOS E CARGAS</Text>

        {workout?.exercicios.map((ex: any, i: number) => (
          <View key={i} style={styles.exCard}>
            <View style={styles.exIconContainer}>
              <Text style={styles.exIndex}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exName}>{ex.nome.split('_').pop()}</Text>
              <Text style={styles.exDetails}>
                {ex.series} séries de {ex.repeticoes} reps
              </Text>
            </View>
            <View style={styles.cargaBadge}>
              <Text style={styles.cargaText}>{ex.carga}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 16 },
  topCard: { backgroundColor: '#111', padding: 20, borderRadius: 16, marginBottom: 25 },
  alunoName: { color: colors.red, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 },
  workoutTitle: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', marginTop: 15, gap: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.grayText, fontSize: 14 },
  sectionTitle: { color: colors.gray, fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  exCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', padding: 16, borderRadius: 12, marginBottom: 10 },
  exIconContainer: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  exIndex: { color: colors.red, fontWeight: 'bold' },
  exName: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  exDetails: { color: colors.grayText, fontSize: 12, marginTop: 2 },
  cargaBadge: { backgroundColor: colors.red, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  cargaText: { color: colors.white, fontWeight: 'bold', fontSize: 12 }
});