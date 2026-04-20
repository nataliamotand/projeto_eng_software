import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Dimensions, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '../src/components/ui/Header';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme'; // Usando o seu arquivo de tema
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import api from '../src/services/api';

const { width } = Dimensions.get('window');

// Configuração de Gráficos padronizada com o Vermelho do sistema
const chartConfig = {
  backgroundGradientFrom: '#000',
  backgroundGradientTo: '#000',
  color: (opacity = 1) => `rgba(204, 0, 0, ${opacity})`, // Vermelho Self-Fit (#CC0000)
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
  strokeWidth: 3,
  propsForDots: { r: "5", strokeWidth: "2", stroke: colors.white },
  fillShadowGradient: colors.red,
  fillShadowGradientOpacity: 0.2,
};

export default function Metrics(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const res = await api.get('/alunos/dashboard-metrics');
        setMetrics(res.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchMetrics();
  }, []);

  if (loading || !metrics) return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" color={colors.red} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Métricas de Treino" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. RESUMO EXECUTIVO (3 PILARES) */}
        <View style={styles.summaryRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>PESO</Text>
            <Text style={styles.statValue}>{metrics.resumo.peso_atual}<Text style={styles.unit}>kg</Text></Text>
            <Text style={styles.statSub}>-{metrics.resumo.perda_total}kg</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SEQ.</Text>
            <Text style={styles.statValue}>{metrics.resumo.streak}<Text style={styles.unit}>d</Text></Text>
            <Text style={styles.statSub}>FREQUÊNCIA</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>BF%</Text>
            <Text style={styles.statValue}>{metrics.gordura[metrics.gordura.length - 1] || 0}<Text style={styles.unit}>%</Text></Text>
            <Text style={styles.statSub}>GORDURA</Text>
          </View>
        </View>

        {/* 2. TRAJETÓRIA DE PESO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evolução de Peso</Text>
          <LineChart
            data={{ labels: metrics.labels.slice(-5), datasets: [{ data: metrics.pesos.slice(-5) }] }}
            width={width - 64}
            height={200}
            chartConfig={chartConfig}
            bezier
            withInnerLines={false}
            style={styles.chart}
          />
        </View>

        {/* 3. CONSISTÊNCIA SEMANAL */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Atividade Semanal</Text>
          <BarChart
            data={{ labels: ['S','T','Q','Q','S','S','D'], datasets: [{ data: metrics.frequencia_semanal }] }}
            width={width - 64}
            height={180}
            chartConfig={{ ...chartConfig, barPercentage: 0.6 }}
            fromZero
            withInnerLines={false}
            style={styles.chart}
          />
        </View>

        {/* 4. MAPA DE TREINO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Distribuição Muscular</Text>
          <PieChart
            data={[
              { name: 'Peito', population: 20, color: '#B22222', legendFontColor: '#AAA', legendFontSize: 12 },
              { name: 'Costas', population: 25, color: '#8B0000', legendFontColor: '#AAA', legendFontSize: 12 },
              { name: 'Pernas', population: 35, color: colors.red, legendFontColor: '#AAA', legendFontSize: 12 },
              { name: 'Outros', population: 20, color: '#444', legendFontColor: '#AAA', legendFontSize: 12 },
            ]}
            width={width - 64}
            height={160}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            chartConfig={chartConfig}
            hasLegend
            absolute
          />
        </View>

        {/* 5. RECORDES PESSOAIS (PRs) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>RECORDES PESSOAIS (PRs)</Text>
          <View style={styles.prList}>
            {[
              { id: 1, ex: 'Agachamento Livre', val: '120kg', date: '12/Abr' },
              { id: 2, ex: 'Supino Reto', val: '85kg', date: '05/Abr' },
              { id: 3, ex: 'Levantamento Terra', val: '150kg', date: '20/Mar' },
            ].map((pr) => (
              <View key={pr.id} style={styles.prCard}>
                <View style={styles.prLeft}>
                  <FontAwesome name="trophy" size={20} color="#FFD700" />
                  <Text style={styles.prName}>{pr.ex}</Text>
                </View>
                <View style={styles.prRight}>
                  <Text style={styles.prValue}>{pr.val}</Text>
                  <Text style={styles.prDate}>{pr.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.copyright}>© SELF-FIT • BIOMETRICS ENGINE</Text>
      </ScrollView>
      <StickyFooter active="metrics" userProfile="STUDENT" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 120 },

  // Summary Row (Estilo ID Visual)
  summaryRow: { 
    flexDirection: 'row', 
    backgroundColor: '#111', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'space-between'
  },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { color: colors.grayText || '#666', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statValue: { color: colors.white, fontSize: 24, fontWeight: '900', marginVertical: 4 },
  unit: { fontSize: 12, color: '#444' },
  statSub: { color: colors.red, fontSize: 9, fontWeight: '700' },
  divider: { width: 1, height: '100%', backgroundColor: '#222' },

  // Cards de Gráficos
  card: { backgroundColor: '#0A0A0A', borderRadius: 25, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#161616' },
  cardTitle: { color: colors.white, fontSize: 16, fontWeight: '800', marginBottom: 15 },
  chart: { marginLeft: -15 },

  // PR Section
  section: { marginTop: 10, marginBottom: 20 },
  sectionHeader: { color: colors.white, fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 15, paddingLeft: 5 },
  prCard: { 
    backgroundColor: '#111', 
    borderRadius: 15, 
    padding: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1A1A1A'
  },
  prLeft: { flexDirection: 'row', alignItems: 'center' },
  prName: { color: colors.white, fontWeight: '700', marginLeft: 12, fontSize: 14 },
  prRight: { alignItems: 'flex-end' },
  prValue: { color: colors.white, fontWeight: '800', fontSize: 15 },
  prDate: { color: '#444', fontSize: 11, marginTop: 2 },

  copyright: { color: '#222', textAlign: 'center', fontSize: 10, fontWeight: '900', marginTop: 10 },
});