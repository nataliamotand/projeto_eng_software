import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Dimensions, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../src/components/ui/Header';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';
import { BarChart, LineChart } from 'react-native-chart-kit';
import api from '../src/services/api';

const { width } = Dimensions.get('window');

const chartConfig = {
  backgroundGradientFrom: '#0A0A0A',
  backgroundGradientTo: '#0A0A0A',
  color: (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.6})`, // Mais visível
  strokeWidth: 3,
  propsForDots: { r: "5", strokeWidth: "0", fill: "#FF2D55" },
  fillShadowGradient: "#FF2D55",
  fillShadowGradientOpacity: 0.15,
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

  if (loading || !metrics) return <ActivityIndicator style={styles.center} color="#FF2D55" />;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Centro de Performance" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. LINHA DE DESTAQUE: OS 3 PILARES (CENTRALIZADO E EQUILIBRADO) */}
        <View style={styles.topRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>PESO</Text>
            <Text style={styles.statValue}>{metrics.resumo.peso_atual}<Text style={styles.unit}>kg</Text></Text>
            <Text style={styles.statSub}>-{metrics.resumo.perda_total}kg</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>FREQ.</Text>
            <Text style={styles.statValue}>{metrics.resumo.streak}<Text style={styles.unit}>d</Text></Text>
            <Text style={styles.statSub}>SEQUÊNCIA</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>GORDURA</Text>
            <Text style={styles.statValue}>{metrics.gordura[metrics.gordura.length - 1] || 0}<Text style={styles.unit}>%</Text></Text>
            <Text style={styles.statSub}>BF ATUAL</Text>
          </View>
        </View>

        {/* 2. GRÁFICO DE EVOLUÇÃO (MAIS ESPAÇO E LEGIBILIDADE) */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Trajetória de Peso</Text>
            <TouchableOpacity onPress={() => {/* Navegar para lista de histórico */}}>
              <Text style={styles.detailsBtn}>Ver histórico</Text>
            </TouchableOpacity>
          </View>
          <LineChart
            data={{
              labels: metrics.labels.slice(-5),
              datasets: [{ data: metrics.pesos.slice(-5) }]
            }}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            withInnerLines={false}
            style={styles.chartAdjustment}
          />
        </View>

        {/* 3. ATIVIDADE SEMANAL */}
        <View style={styles.mainCard}>
          <Text style={styles.cardTitle}>Consistência Semanal</Text>
          <BarChart
            data={{
              labels: ['S','T','Q','Q','S','S','D'],
              datasets: [{ data: metrics.frequencia_semanal }]
            }}
            width={width - 40}
            height={200}
            chartConfig={{
              ...chartConfig,
              fillShadowGradient: "#FF2D55",
              fillShadowGradientOpacity: 1,
              barPercentage: 0.6,
            }}
            fromZero
            withInnerLines={false}
            style={styles.chartAdjustment}
          />
        </View>

        <Text style={styles.footerText}>SELF-FIT BIOMETRICS • 2026</Text>
      </ScrollView>
      <StickyFooter active="metrics" userProfile="STUDENT" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 120 },

  // NOVA LINHA DE TOPO
  topRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#111', 
    borderRadius: 24, 
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222'
  },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { color: '#555', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statValue: { color: '#FFF', fontSize: 26, fontWeight: '900', marginVertical: 4 },
  unit: { fontSize: 12, color: '#444' },
  statSub: { color: '#FF2D55', fontSize: 9, fontWeight: '700' },

  // CARDS DE GRÁFICOS
  mainCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 30,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  detailsBtn: { color: '#FF2D55', fontSize: 12, fontWeight: '700' },
  chartAdjustment: { marginLeft: -15, marginTop: 10 },

  footerText: { color: '#222', textAlign: 'center', fontSize: 10, fontWeight: '900', marginTop: 20 },
});