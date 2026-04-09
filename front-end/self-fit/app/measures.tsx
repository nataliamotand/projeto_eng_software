import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { colors } from '../src/components/ui/theme';

const { width } = Dimensions.get('window');

export default function Measures(): JSX.Element {
  const router = useRouter();

  const [weight, setWeight] = useState('68');
  const [bodyFat, setBodyFat] = useState('18');
  const [leanMass, setLeanMass] = useState('55.8');

  const [measurementsHistory, setMeasurementsHistory] = useState([
    { date: '01/Mar', weight: 70, bodyFat: 19, leanMass: 56.7 },
    { date: '15/Mar', weight: 69, bodyFat: 18.5, leanMass: 56.2 },
    { date: '01/Abr', weight: 68.5, bodyFat: 18.2, leanMass: 56.1 },
    { date: '05/Abr', weight: 68, bodyFat: 18, leanMass: 55.8 },
  ] as Array<{ date: string; weight: number; bodyFat: number; leanMass: number }>);

  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'bodyFat' | 'leanMass'>('weight');

  function handleRegisterMeasurement() {
    const entry = { date: 'Agora', weight: Number(weight || 0), bodyFat: Number(bodyFat || 0), leanMass: Number(leanMass || 0) };
    setMeasurementsHistory((prev) => [...prev, entry]);
  }

  const chartData = useMemo(() => {
    const labels = measurementsHistory.map((m) => m.date);
    const data = measurementsHistory.map((m) => m[selectedMetric]);
    return { labels, data };
  }, [measurementsHistory, selectedMetric]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Medições</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>

        <View style={styles.rowInputs}>
          <View style={styles.colInputRow}>
            <Text style={styles.inputLabel}>Peso (kg)</Text>
            <TextInput keyboardType="numeric" value={weight} onChangeText={setWeight} style={styles.numericInput} placeholderTextColor={colors.grayMid} />
          </View>
          <View style={styles.colInputRow}>
            <Text style={styles.inputLabel}>Gordura (%)</Text>
            <TextInput keyboardType="numeric" value={bodyFat} onChangeText={setBodyFat} style={styles.numericInput} placeholderTextColor={colors.grayMid} />
          </View>
          <View style={styles.colInputRow}>
            <Text style={styles.inputLabel}>Massa Magra (kg)</Text>
            <TextInput keyboardType="numeric" value={leanMass} onChangeText={setLeanMass} style={styles.numericInput} placeholderTextColor={colors.grayMid} />
          </View>
        </View>

        <TouchableOpacity style={styles.registerButton} onPress={handleRegisterMeasurement}>
          <Text style={styles.registerText}>Registrar Medida</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Evolução</Text>

        <View style={styles.metricTabs}>
          <TouchableOpacity style={[styles.metricTab, selectedMetric === 'weight' ? styles.metricTabActive : null]} onPress={() => setSelectedMetric('weight')}>
            <Text style={styles.metricTabText}>Peso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.metricTab, selectedMetric === 'bodyFat' ? styles.metricTabActive : null]} onPress={() => setSelectedMetric('bodyFat')}>
            <Text style={styles.metricTabText}>% Gordura</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.metricTab, selectedMetric === 'leanMass' ? styles.metricTabActive : null]} onPress={() => setSelectedMetric('leanMass')}>
            <Text style={styles.metricTabText}>Massa Magra</Text>
          </TouchableOpacity>
        </View>

        <LineChart
          data={{
            labels: chartData.labels,
            datasets: [
              {
                data: chartData.data,
                color: () => colors.red,
                strokeWidth: 2,
              },
            ],
          }}
          width={width - 32}
          height={220}
          yAxisLabel=""
          chartConfig={{
            backgroundColor: colors.background,
            backgroundGradientFrom: colors.background,
            backgroundGradientTo: colors.background,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(204,0,0,${opacity})`,
            labelColor: () => colors.grayLight,
            propsForDots: { r: '4', strokeWidth: '1', stroke: colors.white },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 28, paddingBottom: 12, backgroundColor: colors.background },
  headerLeft: { width: 40 },
  headerRight: { width: 40 },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 16, flex: 1, textAlign: 'center' },

  contentContainer: { padding: 16, paddingBottom: 200 },
  sectionTitle: { color: colors.white, fontWeight: '700', fontSize: 16 },
  rowInputs: { flexDirection: 'column', marginTop: 8 },
  colInputRow: { width: '100%', marginBottom: 8 },
  inputLabel: { color: colors.grayLight, marginBottom: 6 },
  numericInput: { backgroundColor: colors.inputBg, color: colors.white, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },

  registerButton: { marginTop: 12, backgroundColor: colors.red, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  registerText: { color: colors.white, fontWeight: '700' },

  metricTabs: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  metricTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#0A0A0A', marginRight: 8 },
  metricTabActive: { backgroundColor: '#1F1F1F', borderWidth: 1, borderColor: colors.red },
  metricTabText: { color: colors.white, fontWeight: '700' },
});
