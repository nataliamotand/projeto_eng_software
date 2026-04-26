import React, { useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, Image, 
  TouchableOpacity, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '../src/services/api';
import Header from '../src/components/ui/Header';
import { colors } from '../src/components/ui/theme';

export default function ClientDetails() {
  const router = useRouter();
  const { alunoId } = useLocalSearchParams();
  
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Rota que unificamos na main.py para pegar perfil individual
      const response = await api.get(`/professor/aluno/${alunoId}/perfil`);
      setStudent(response.data);
    } catch (error) {
      console.error("Erro ao carregar perfil do aluno:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados deste aluno.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [alunoId]);

  useFocusEffect(
    useCallback(() => {
      if (alunoId) loadData();
    }, [alunoId, loadData])
  );

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={colors.red} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Perfil do Aluno" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CARD DE PERFIL REAL */}
        <View style={styles.profileHeader}>
          <Image 
            source={student?.foto_perfil ? { uri: student.foto_perfil } : require('../assets/images/logo.png')} 
            style={styles.avatarLarge} 
          />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>{student?.nome}</Text>
            <Text style={styles.profileEmail}>{student?.email}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{student?.objetivo || 'Sem objetivo'}</Text>
            </View>
          </View>
        </View>

        {/* BOTÃO PRINCIPAL: CRIAR ROTINA */}
        <TouchableOpacity 
          style={styles.mainAction}
          onPress={() => router.push(`/create_routine?studentId=${alunoId}`)}
        >
          <FontAwesome5 name="plus" size={16} color={colors.white} />
          <Text style={styles.mainActionText}>Prescrever Nova Rotina</Text>
        </TouchableOpacity>

        {/* GRID DE GESTÃO */}
        <View style={styles.menuGrid}>
          <Text style={styles.sectionTitle}>Acompanhamento</Text>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push({ pathname: '/previous_workouts', params: { studentId: alunoId } })}
          >
            <View style={[styles.iconBox, { backgroundColor: '#251010' }]}>
              <MaterialIcons name="history" size={22} color={colors.red} />
            </View>
            <Text style={styles.menuLabel}>Histórico de Treinos Concluídos</Text>
            <Ionicons name="chevron-forward" size={18} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push(`/measures?id=${alunoId}`)}
          >
            <View style={[styles.iconBox, { backgroundColor: '#102515' }]}>
              <MaterialIcons name="straighten" size={22} color={colors.green} />
            </View>
            <Text style={styles.menuLabel}>Medições e Antropometria</Text>
            <Ionicons name="chevron-forward" size={18} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push(`/metrics?studentId=${alunoId}`)}
          >
            <View style={[styles.iconBox, { backgroundColor: '#101525' }]}>
              <MaterialIcons name="show-chart" size={22} color="#4A90E2" />
            </View>
            <Text style={styles.menuLabel}>Gráficos de Evolução</Text>
            <Ionicons name="chevron-forward" size={18} color="#333" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loadingCenter: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatarLarge: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.red },
  profileTextContainer: { marginLeft: 20, flex: 1 },
  profileName: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  profileEmail: { color: colors.grayText, fontSize: 14, marginTop: 4 },
  tag: { backgroundColor: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginTop: 10, alignSelf: 'flex-start' },
  tagText: { color: colors.red, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  mainAction: { 
    flexDirection: 'row', backgroundColor: colors.red, padding: 16, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 30 
  },
  mainActionText: { color: colors.white, fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  menuGrid: { gap: 12 },
  sectionTitle: { color: colors.white, fontSize: 14, fontWeight: 'bold', marginBottom: 8, opacity: 0.5 },
  menuItem: { 
    flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 12, 
    alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A' 
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, color: colors.white, marginLeft: 15, fontWeight: '600' },
});