import React, { useState, useMemo, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';

const { width } = Dimensions.get('window');

export default function Measures() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<'STUDENT' | 'TEACHER' | null>(null);
  
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [leanMass, setLeanMass] = useState('');

  const [measurementsHistory, setMeasurementsHistory] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'peso' | 'porcentagem_gordura' | 'massa_muscular'>('peso');

  // 1. BUSCAR PERFIL E HISTÓRICO
  async function loadInitialData() {
    try {
      setLoading(true);
      
      // Busca quem é o usuário logado
      const userRes = await api.get('/usuarios/me');
      setUserRole(userRes.data.tipo_perfil);

      // Busca o histórico
      const historyRes = await api.get('/alunos/meu-historico');
      setMeasurementsHistory(historyRes.data);
      
      if (historyRes.data.length > 0) {
        const last = historyRes.data[historyRes.data.length - 1];
        setWeight(last.peso.toString());
        setBodyFat(last.porcentagem_gordura.toString());
        setLeanMass(last.massa_muscular.toString());
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      // Se for um professor tentando ver o "meu-historico", o 403 cai aqui
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. REGISTRAR (SÓ PARA ALUNOS)
  async function handleRegisterMeasurement() {
    if (!weight || !bodyFat || !leanMass) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    try {
      setSaving(true);
      await api.post('/alunos/evolucao', {
        peso: parseFloat(weight),
        porcentagem_gordura: parseFloat(bodyFat),
        massa_muscular: parseFloat(leanMass)
      });

      Alert.alert("Sucesso", "Medida processada! (Limite de 1 registro por dia aplicado)");
      
      // Atualiza o histórico para refletir a nova linha ou alteração no gráfico
      const response = await api.get('/alunos/meu-historico');
      setMeasurementsHistory(response.data);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível salvar as medidas.");
    } finally {
      setSaving(false);
    }
  }

// 3. FORMATAR DADOS PARA O GRÁFICO (CORRIGIDO PARA UTC)
const chartData = useMemo(() => {
  if (measurementsHistory.length === 0) return null;

  const lastSix = measurementsHistory.slice(-6);

  const labels = lastSix.map((m) => {
    // Criamos o objeto de data
    const d = new Date(m.data_registro);
    
    // Usamos getUTCDate() para pegar o dia real do banco
    const dia = d.getUTCDate(); 
    
    // Usamos toLocaleDateString com a opção timeZone: 'UTC' para o mês
    const mes = d.toLocaleDateString('pt-BR', { 
      month: 'short', 
      timeZone: 'UTC' 
    }).replace('.', '');

    return `${dia}/${mes}`;
  });

  const data = lastSix.map((m) => m[selectedMetric]);

  return { labels, data };
}, [measurementsHistory, selectedMetric]);

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.red} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {userRole === 'TEACHER' ? 'Evolução do Aluno' : 'Minha Evolução'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        
        {/* SÓ MOSTRA INPUTS SE FOR ALUNO */}
        {userRole === 'STUDENT' ? (
          <>
            <View style={styles.rowInputs}>
              <View style={styles.colInputRow}>
                <Text style={styles.inputLabel}>Peso (kg)</Text>
                <TextInput 
                  keyboardType="numeric" 
                  value={weight} 
                  onChangeText={setWeight} 
                  style={styles.numericInput} 
                  placeholder="Ex: 75.5"
                  placeholderTextColor={colors.grayMid} 
                />
              </View>
              <View style={styles.colInputRow}>
                <Text style={styles.inputLabel}>Gordura (%)</Text>
                <TextInput 
                  keyboardType="numeric" 
                  value={bodyFat} 
                  onChangeText={setBodyFat} 
                  style={styles.numericInput} 
                  placeholder="Ex: 15"
                  placeholderTextColor={colors.grayMid} 
                />
              </View>
              <View style={styles.colInputRow}>
                <Text style={styles.inputLabel}>Massa Magra (kg)</Text>
                <TextInput 
                  keyboardType="numeric" 
                  value={leanMass} 
                  onChangeText={setLeanMass} 
                  style={styles.numericInput} 
                  placeholder="Ex: 60"
                  placeholderTextColor={colors.grayMid} 
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, saving && { opacity: 0.6 }]} 
              onPress={handleRegisterMeasurement}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerText}>Registrar Medida de Hoje</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.teacherNotice}>
            <Ionicons name="eye-outline" size={20} color={colors.grayMid} />
            <Text style={styles.teacherNoticeText}>Modo de visualização (Apenas leitura)</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Gráfico de Evolução</Text>

        <View style={styles.metricTabs}>
          <TouchableOpacity 
            style={[styles.metricTab, selectedMetric === 'peso' && styles.metricTabActive]} 
            onPress={() => setSelectedMetric('peso')}
          >
            <Text style={styles.metricTabText}>Peso</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.metricTab, selectedMetric === 'porcentagem_gordura' && styles.metricTabActive]} 
            onPress={() => setSelectedMetric('porcentagem_gordura')}
          >
            <Text style={styles.metricTabText}>% BF</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.metricTab, selectedMetric === 'massa_muscular' && styles.metricTabActive]} 
            onPress={() => setSelectedMetric('massa_muscular')}
          >
            <Text style={styles.metricTabText}>Músculo</Text>
          </TouchableOpacity>
        </View>

        {chartData ? (
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [{ data: chartData.data, color: () => colors.red, strokeWidth: 2 }],
            }}
            width={width - 32}
            height={220}
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
            style={{ marginVertical: 16, borderRadius: 12 }}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={{ color: colors.grayMid }}>Nenhum histórico disponível.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 40, paddingBottom: 12, backgroundColor: colors.background },
  headerLeft: { width: 40 },
  headerRight: { width: 40 },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 18, flex: 1, textAlign: 'center' },
  contentContainer: { padding: 16, paddingBottom: 100 },
  sectionTitle: { color: colors.white, fontWeight: '700', fontSize: 16 },
  rowInputs: { flexDirection: 'column', marginTop: 8 },
  colInputRow: { width: '100%', marginBottom: 12 },
  inputLabel: { color: colors.grayLight, marginBottom: 6, fontSize: 13 },
  numericInput: { backgroundColor: colors.inputBg, color: colors.white, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, fontSize: 16 },
  registerButton: { marginTop: 12, backgroundColor: colors.red, paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  registerText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  metricTabs: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  metricTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#111', marginRight: 8 },
  metricTabActive: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: colors.red },
  metricTabText: { color: colors.white, fontWeight: '600', fontSize: 12 },
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 12, marginTop: 16 },
  teacherNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', padding: 16, borderRadius: 10, marginTop: 8 },
  teacherNoticeText: { color: colors.grayMid, marginLeft: 8, fontSize: 14 }
});