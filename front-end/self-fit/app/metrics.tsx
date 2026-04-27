import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '../src/components/ui/Header';
import StickyFooter from '../src/components/ui/StickyFooter';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';

const { width } = Dimensions.get('window');
const MUTED_RED = '#B00000'; 

// Mapeamento expandido para identificação de grupos musculares
const MUSCLE_MAPPING: Record<string, string> = {
  'Supino': 'Peito', 'Crucifixo': 'Peito', 'Flexão': 'Peito', 'Pec Deck': 'Peito',
  'Remada': 'Costas', 'Puxada': 'Costas', 'Barra': 'Costas', 'Serrote': 'Costas',
  'Agachamento': 'Pernas', 'Leg Press': 'Pernas', 'Extensora': 'Pernas', 'Afundo': 'Pernas',
  'Desenvolvimento': 'Ombro', 'Elevação': 'Ombro', 'Deltoide': 'Ombro',
  'Prancha': 'Core', 'Abdominal': 'Core', 'Infra': 'Core',
  'Rosca': 'Bíceps', 'Martelo': 'Bíceps', 
  'Tríceps': 'Tríceps', 'Pulley': 'Tríceps', 'Corda': 'Tríceps'
};

const chartConfig = {
  backgroundGradientFrom: '#000',
  backgroundGradientTo: '#000',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(176, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(160, 160, 160, ${opacity})`,
  style: { borderRadius: 16 },
  propsForBackgroundLines: { strokeWidth: 0.1, stroke: '#333' },
  // Ajuste: Barras robustas para melhor visualização
  barPercentage: 0.7, 
};

export default function Metrics(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams();
  const studentId = (params as any)?.studentId;
  
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState<any>(null);
  const [mainStatus, setMainStatus] = useState<any>(null);

  // Calcula o intervalo real da semana (Domingo a Sábado)
  const getWeekRange = (weeksAgo: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek - (weeksAgo * 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${fmt(start)} a ${fmt(end)}`;
  };

  const processMetrics = useCallback((history: any[]) => {
    const weekLabels = [getWeekRange(3), getWeekRange(2), getWeekRange(1), getWeekRange(0)];
    const frequency = [0, 0, 0, 0];
    const volume = [0, 0, 0, 0];
    const muscleCount: Record<string, number> = { 
      Peito: 0, Costas: 0, Pernas: 0, Ombro: 0, Core: 0, Bíceps: 0, Tríceps: 0, Outros: 0 
    };
    const prs: Record<string, { weight: number, date: string }> = {};
    let totalMinutes = 0;
    const now = new Date();
    
    // Início da semana atual para alinhar o calendário
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    startOfCurrentWeek.setDate(now.getDate() - now.getDay());

    history.forEach(workout => {
      const workoutDate = workout.data_fim ? new Date(workout.data_fim) : new Date();
      if (isNaN(workoutDate.getTime())) return; 

      // Início da semana do treino (domingo correspondente)
      const startOfWorkoutWeek = new Date(workoutDate);
      startOfWorkoutWeek.setHours(0, 0, 0, 0);
      startOfWorkoutWeek.setDate(workoutDate.getDate() - workoutDate.getDay());

      // Diferença exata em janelas de 7 dias
      const diffWeeks = Math.round((startOfCurrentWeek.getTime() - startOfWorkoutWeek.getTime()) / (1000 * 60 * 60 * 24 * 7));
      
      totalMinutes += Number(workout.duracao_minutos) || 0;
      
      if (diffWeeks >= 0 && diffWeeks < 4) {
        const weekIdx = 3 - diffWeeks;
        frequency[weekIdx]++;
        volume[weekIdx] += Number(workout.volume_total) || 0;
      }

      workout.exercicios?.forEach((ex: any) => {
        let matched = false;
        const exerciseName = ex.nome.toLowerCase();
        Object.keys(MUSCLE_MAPPING).forEach(key => {
          if (exerciseName.includes(key.toLowerCase())) {
            muscleCount[MUSCLE_MAPPING[key]]++;
            matched = true;
          }
        });
        if (!matched) muscleCount['Outros']++;

        const load = parseFloat(ex.carga?.replace('kg', '')) || 0;
        if (!prs[ex.nome] || load > prs[ex.nome].weight) {
          prs[ex.nome] = { weight: load, date: workoutDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) };
        }
      });
    });

    setMainStatus({
      title: frequency[3] > 0 ? "STATUS: ATIVO" : "STATUS: RECUPERAÇÃO",
      desc: frequency[3] > 0 ? "Consistência mantida. Continue o ritmo." : "Tente retomar a rotina esta semana.",
      icon: "flash"
    });

    setProcessedData({
      totalMonth: history.filter(w => w.data_fim && new Date(w.data_fim).getMonth() === now.getMonth()).length,
      avgTime: Math.round(totalMinutes / (history.length || 1)),
      frequency: { 
        labels: weekLabels, 
        datasets: [{ 
          data: frequency,
          // Cor sólida para a semana atual
          colors: frequency.map((_, i) => (opacity = 1) => i === 3 ? `rgba(217, 0, 0, 1)` : `rgba(217, 0, 0, 0.4)`)
        }] 
      },
      volume: { labels: weekLabels, datasets: [{ data: volume }] },
      muscleDistribution: Object.keys(muscleCount).map((name, idx) => ({
        name, population: muscleCount[name], 
        color: ['#800000', '#5C0000', '#B00000', '#420000', '#2B0000', '#A52A2A', '#D2691E', '#333'][idx] || '#444',
        legendFontColor: '#AAA', legendFontSize: 11,
      })).filter(m => m.population > 0),
      prs: Object.entries(prs).map(([exercise, info]) => ({ exercise, ...info })).sort((a, b) => b.weight - a.weight).slice(0, 3)
    });
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(studentId ? `/professor/aluno/${studentId}/historico` : '/alunos/historico-treinos');
      processMetrics(res.data);
    } catch (err) { Alert.alert("Erro", "Falha ao carregar métricas."); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [studentId]);

  if (loading) return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color={MUTED_RED} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Performance Técnica" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroContainer}>
          <View style={styles.heroCard}>
            <Text style={styles.heroValue}>{processedData?.totalMonth}</Text>
            <Text style={styles.heroLabel}>TREINOS / MÊS</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.heroCard}>
            <Text style={styles.heroValue}>{processedData?.avgTime}<Text style={{fontSize: 16, fontWeight: '400'}}>min</Text></Text>
            <Text style={styles.heroLabel}>MÉDIA / TREINO</Text>
          </View>
        </View>

        <View style={styles.fullWidthStatus}>
          <MaterialCommunityIcons name={mainStatus?.icon} size={20} color={MUTED_RED} />
          <View style={{marginLeft: 15}}>
            <Text style={styles.statusTitle}>{mainStatus?.title}</Text>
            <Text style={styles.statusDesc}>{mainStatus?.desc}</Text>
          </View>
        </View>

        {/* FREQUÊNCIA: Barras largas com contagem exata no topo */}
        <View style={styles.dataSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-check" size={18} color={MUTED_RED} />
            <Text style={styles.sectionTitle}>Frequência Semanal</Text>
          </View>
          <View style={styles.chartContainer}>
            <BarChart 
              data={processedData?.frequency} 
              width={width - 40} 
              height={220} 
              fromZero 
              showValuesOnTopOfBars={true} 
              withCustomBarColorFromData={true}
              flatColor={true}
              chartConfig={chartConfig} 
              style={styles.chart} 
            />
          </View>
        </View>

        <View style={styles.dataSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chart-donut" size={18} color={MUTED_RED} />
            <Text style={styles.sectionTitle}>Distribuição Muscular</Text>
          </View>
          <View style={styles.chartContainer}>
            <PieChart 
              data={processedData?.muscleDistribution} width={width - 40} height={180} accessor="population" 
              backgroundColor="transparent" chartConfig={chartConfig} hasLegend absolute 
            />
          </View>
        </View>

        {/* VOLUME DE CARGA: Progressão temporal real */}
        <View style={styles.dataSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chart-line" size={18} color={MUTED_RED} />
            <Text style={styles.sectionTitle}>Volume de Carga (kg)</Text>
          </View>
          <View style={styles.chartContainer}>
            <LineChart 
              data={processedData?.volume} width={width - 40} height={180} 
              chartConfig={{...chartConfig, color: (opacity) => `rgba(200, 200, 200, ${opacity})` }} 
              bezier style={styles.chart} 
            />
          </View>
        </View>

        <View style={{paddingHorizontal: 20}}>
          <Text style={styles.mainHeading}>Recordes Pessoais (PRs)</Text>
          {processedData?.prs.map((pr: any, i: number) => (
            <View key={i} style={styles.prRow}>
              <Text style={styles.prRank}>#{i+1}</Text>
              <View style={{flex: 1, marginLeft: 15}}>
                <Text style={styles.prName}>{pr.exercise}</Text>
                <Text style={styles.prDate}>{pr.date}</Text>
              </View>
              <View style={styles.prValue}><Text style={styles.prWeight}>{pr.weight}</Text><Text style={styles.prUnit}>KG</Text></View>
            </View>
          ))}
        </View>

        <StickyFooter showNav={false} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  scrollContent: { paddingBottom: 100 },
  heroContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 40, marginBottom: 30, alignItems: 'center', justifyContent: 'center' },
  heroCard: { flex: 1, alignItems: 'center' },
  verticalDivider: { width: 1, height: 40, backgroundColor: '#151515' },
  heroValue: { color: '#FFF', fontSize: 40, fontWeight: '800' },
  heroLabel: { color: '#555', fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 1 },
  fullWidthStatus: { backgroundColor: '#080808', width: '100%', paddingVertical: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#111', marginBottom: 35 },
  statusTitle: { color: MUTED_RED, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  statusDesc: { color: '#666', fontSize: 11, marginTop: 2 },
  dataSection: { paddingHorizontal: 20, marginBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#FFF', fontSize: 13, fontWeight: '700', marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1.2 },
  chartContainer: { backgroundColor: '#050505', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  chart: { borderRadius: 16 },
  mainHeading: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 20 },
  prRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#080808', padding: 16, borderRadius: 12, marginBottom: 8 },
  prRank: { color: MUTED_RED, fontSize: 14, fontWeight: '900', opacity: 0.7 },
  prName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  prDate: { color: '#444', fontSize: 11, marginTop: 1 },
  prValue: { alignItems: 'flex-end' },
  prWeight: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  prUnit: { color: MUTED_RED, fontSize: 9, fontWeight: '700' }
});