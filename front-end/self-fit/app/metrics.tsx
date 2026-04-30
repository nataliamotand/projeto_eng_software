import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '../src/components/ui/Header';
import { colors } from '../src/components/ui/theme';
import { BarChart, LineChart } from 'react-native-chart-kit';
import api from '../src/services/api';

const { width } = Dimensions.get('window');

const chartConfig = {
  backgroundGradientFrom: colors.background,
  backgroundGradientTo: colors.background,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(204, 0, 0, ${opacity})`,
  labelColor: () => colors.lightGray,
  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.white },
  style: { borderRadius: 12 },
};

export default function Metrics() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Captura o ID do aluno (modo professor) ou fica undefined (modo aluno)
  const studentId = params.studentId || params.id;

  const [loading, setLoading] = useState(true);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');

  const loadMetrics = async () => {
    try {
      setLoading(true);

      // 1. Identifica o perfil para o StickyFooter
      const userRes = await api.get('/usuarios/me');
      setUserRole(userRes.data.tipo_perfil);

      // 2. Define os endpoints baseado no contexto (Professor vs Aluno)
      // Se tiver studentId, usa as rotas de professor consolidada na main.py
      const evoEndpoint = studentId 
        ? `/professor/aluno/${studentId}/medidas` 
        : '/alunos/meu-historico';
      
      const trainEndpoint = studentId 
        ? `/professor/aluno/${studentId}/historico` 
        : '/alunos/historico-treinos';

      const [evoRes, trainRes] = await Promise.all([
        api.get(evoEndpoint),
        api.get(trainEndpoint)
      ]);
      
      setEvolutionData(evoRes.data);
      setTrainingHistory(trainRes.data);
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [studentId]);

  // Processa Volume Total (Carga)
  const volumeChart = useMemo(() => {
    if (!trainingHistory || trainingHistory.length === 0) return null;
    const lastFive = [...trainingHistory].reverse().slice(-5);
    return {
      labels: lastFive.map(t => new Date(t.data_fim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })),
      datasets: [{ data: lastFive.map(t => t.volume_total || 0) }]
    };
  }, [trainingHistory]);

  // Processa BF e Massa Muscular
  const bodyCompChart = useMemo(() => {
    if (!evolutionData || evolutionData.length === 0) return null;
    const lastFive = [...evolutionData].reverse().slice(-5);
    return {
      labels: lastFive.map(e => new Date(e.data_registro).getDate().toString()),
      datasets: [
        { data: lastFive.map(e => e.porcentagem_gordura || 0), color: () => colors.red },
        { data: lastFive.map(e => e.massa_muscular || 0), color: () => colors.white }
      ],
      legend: ["% BF", "Músculo (kg)"]
    };
  }, [evolutionData]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={studentId ? "Métricas do Aluno" : "Minha Performance"} onBack={() => router.replace('/profile')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volume de Treino (Carga Total)</Text>
          {volumeChart ? (
            <BarChart
              data={volumeChart}
              width={width - 32}
              height={220}
              fromZero
              yAxisLabel=""
              yAxisSuffix="kg"
              chartConfig={{ ...chartConfig, barPercentage: 0.7 }}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          ) : (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>Sem treinos finalizados.</Text></View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Composição Corporal</Text>
          {bodyCompChart ? (
            <LineChart
              data={bodyCompChart}
              width={width - 32}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>Sem medidas registradas.</Text></View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recordes Recentes</Text>
          {trainingHistory.length > 0 ? (
            trainingHistory
              .sort((a, b) => b.volume_total - a.volume_total)
              .slice(0, 3)
              .map((item, idx) => (
                <View key={idx} style={styles.prCard}>
                  <View style={styles.prLeft}>
                    <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                    <Text style={styles.prExercise}>{item.titulo || 'Treino Concluído'}</Text>
                  </View>
                  <Text style={styles.prWeight}>{item.volume_total}kg</Text>
                </View>
              ))
          ) : (
            <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContent: { padding: 16, paddingBottom: 24 },
  section: { marginBottom: 30 },
  sectionTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  chart: { borderRadius: 12 },
  emptyCard: { height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', borderRadius: 12 },
  emptyText: { color: colors.grayMid },
  prCard: { backgroundColor: '#111', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  prLeft: { flexDirection: 'row', alignItems: 'center' },
  prExercise: { color: colors.white, fontWeight: '700', marginLeft: 10 },
  prWeight: { color: colors.red, fontWeight: '800' },
});