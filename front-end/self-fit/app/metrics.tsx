import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

const { width, height } = Dimensions.get('window');

const colors = {
  background: '#000000',
  red: '#CC0000',
  darkGray: '#1A1A1A',
  white: '#FFFFFF',
  lightGray: '#CFCFCF',
  gold: '#D4AF37',
};

// Function to generate mocked data optionally based on studentId
function generateMocks(studentId?: string | number) {
  const idNum = Number(studentId) || 0;

  const baseFreq = [3, 4, 2, 5];
  const freq = baseFreq.map((v, i) => v + ((idNum + i) % 3));

  const muscleBase = [
    { name: 'Peito', population: 20, color: '#B22222' },
    { name: 'Costas', population: 20, color: '#8B0000' },
    { name: 'Pernas', population: 40, color: '#CC0000' },
    { name: 'Ombro', population: 10, color: '#6B0F0F' },
    { name: 'Core', population: 10, color: '#4F4F4F' },
  ];

  // shift distribution slightly by id
  const muscleDistribution = muscleBase.map((m, idx) => ({
    name: m.name,
    population: m.population + ((idNum + idx) % 5) - 2,
    color: m.color,
    legendFontColor: colors.lightGray,
    legendFontSize: 12,
  }));

  const baseVolume = [12000, 13500, 11000, 15000];
  const volume = baseVolume.map((v, i) => v + ((idNum * 250) % 2000) - i * 200);

  const prs = [
    { id: 1, exercise: 'Agachamento Livre', weight: `${120 + (idNum % 10)}kg`, date: '12/Mar' },
    { id: 2, exercise: 'Supino Reto', weight: `${80 + (idNum % 6)}kg`, date: '05/Abr' },
    { id: 3, exercise: 'Levantamento Terra', weight: `${150 + (idNum % 12)}kg`, date: '20/Fev' },
  ];

  return {
    mockFrequency: { labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], datasets: [{ data: freq }] },
    mockMuscleDistribution: muscleDistribution,
    mockVolume: { labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], datasets: [{ data: volume }] },
    mockPRs: prs,
  };
}

const chartConfig = {
  backgroundGradientFrom: colors.background,
  backgroundGradientTo: colors.background,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(204,0,0,${opacity})`,
  labelColor: (opacity = 1) => `rgba(207,207,207,${opacity})`,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.white,
  },
  style: { borderRadius: 8 },
};

export default function Metrics(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams();
  const studentId = (params as any)?.studentId;
  const chartWidth = Math.min(width - 32, 760);

  const { mockFrequency, mockMuscleDistribution, mockVolume, mockPRs } = generateMocks(studentId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Métricas de Treino</Text>

        <TouchableOpacity onPress={() => { /* TODO: share/export */ }} style={styles.headerRight}>
          <Ionicons name="share-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Consistência */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{studentId ? `Métricas do Aluno #${studentId}` : 'Frequência Semanal'}</Text>
          <View style={styles.rowSummary}>
            <MaterialCommunityIcons name="fire" size={16} color={colors.red} />
            <Text style={styles.summaryText}>  Total no Mês: <Text style={styles.summaryHighlight}>14 treinos</Text></Text>
          </View>

          <BarChart
            data={mockFrequency}
            width={chartWidth}
            height={220}
            fromZero
            withInnerLines={false}
            chartConfig={{
              ...chartConfig,
              fillShadowGradient: colors.red,
              fillShadowGradientOpacity: 1,
              barPercentage: 0.6,
            }}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            yLabelsOffset={6}
          />
        </View>

        {/* Distribuição Muscular */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mapa de Treino</Text>
          <PieChart
            data={mockMuscleDistribution}
            width={chartWidth}
            height={160}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft={0}
            chartConfig={chartConfig}
            hasLegend={true}
            absolute={true}
          />
        </View>

        {/* Evolução de Volume */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volume de Treino (Carga Total)</Text>
          <Text style={styles.sectionSubtitle}>Acompanhe a soma de peso levantado por semana.</Text>

          <LineChart
            data={mockVolume}
            width={chartWidth}
            height={220}
            withInnerLines={false}
            withShadow={false}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(204,0,0,${opacity})`,
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Recordes Pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recordes Pessoais (PRs)</Text>
          <View style={{ marginTop: 8 }}>
            {mockPRs.map((pr) => (
              <View key={pr.id} style={styles.prCard}>
                <View style={styles.prLeft}>
                  <MaterialCommunityIcons name="trophy" size={20} color={colors.gold} />
                  <Text style={styles.prExercise}>{pr.exercise}</Text>
                </View>

                <View style={styles.prRight}>
                  <Text style={styles.prWeight}>{pr.weight}</Text>
                  <Text style={styles.prDate}>{pr.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>© Self-fit</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#070707',
  },
  headerLeft: { width: 40 },
  headerRight: { width: 40, alignItems: 'flex-end' },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 18 },

  scrollContent: { padding: 16, paddingBottom: Math.max(48, height * 0.12) },
  section: { marginBottom: 20 },
  sectionTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  sectionSubtitle: { color: colors.lightGray, fontSize: 12, marginBottom: 8 },
  rowSummary: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summaryText: { color: colors.lightGray, marginLeft: 6 },
  summaryHighlight: { color: colors.white, fontWeight: '700' },

  chart: { marginVertical: 8, borderRadius: 8 },

  prCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  prLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  prExercise: { color: colors.white, fontWeight: '700', marginLeft: 10, flexShrink: 1 },
  prRight: { alignItems: 'flex-end' },
  prWeight: { color: colors.white, fontWeight: '800', fontSize: 14 },
  prDate: { color: colors.lightGray, fontSize: 12 },

  footerNote: { alignItems: 'center', marginTop: 8 },
  footerText: { color: colors.lightGray, fontSize: 12 },
});
