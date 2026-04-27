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
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';

export default function ClientDetails() {
  const router = useRouter();
  // Lendo 'id' (deve ser idêntico ao que você passa na clients.tsx)
  const { id } = useLocalSearchParams(); 
  
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Carregamento de Dados
  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get(`/professor/aluno/${id}/perfil`);
      setStudent(response.data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados deste aluno.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id, loadData])
  );

  // 2. Lógica de Desvínculo (A "Cura" para o seu erro)
  const handleDesvincular = async () => {
    // TESTE DIRETO SEM ALERTA
    console.log(">>> TESTE: DISPARANDO DELETE DIRETO PARA ID:", id);
    
    try {
      // Garante que o ID é uma string limpa (evita problemas se o Expo passar array)
      const cleanId = Array.isArray(id) ? id[0] : id;
      
      const response = await api.delete(`/professor/desvincular-aluno/${cleanId}`);
      
      console.log(">>> RESPOSTA RECEBIDA:", response.status);
      
      if (response.status === 200) {
        Alert.alert("Sucesso", "Aluno removido com sucesso!");
        router.replace('/clients');
      }
    } catch (e: any) {
      console.error(">>> ERRO NA CHAMADA:", e.response?.data || e.message);
      Alert.alert("Erro", "Falha na comunicação com o servidor.");
    }
  };

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

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* CABEÇALHO DO PERFIL */}
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

        {/* BOTÃO DE PRESCRIÇÃO */}
        <TouchableOpacity 
          style={styles.mainAction}
          onPress={() => router.push(`/create_routine?studentId=${id}`)}
        >
          <FontAwesome5 name="plus" size={16} color={colors.white} />
          <Text style={styles.mainActionText}>Prescrever Nova Ficha</Text>
        </TouchableOpacity>

        <View style={styles.menuGrid}>
          <Text style={styles.sectionTitle}>Acompanhamento</Text>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push({ pathname: '/previous_workouts', params: { studentId: id } })}
          >
            <View style={[styles.iconBox, { backgroundColor: '#1A1A1A' }]}>
              <MaterialIcons name="history" size={22} color={colors.red} />
            </View>
            <Text style={styles.menuLabel}>Histórico de Treinos</Text>
            <Ionicons name="chevron-forward" size={18} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push(`/measures?id=${id}`)}
          >
            <View style={[styles.iconBox, { backgroundColor: '#1A1A1A' }]}>
              <MaterialIcons name="straighten" size={22} color={colors.green} />
            </View>
            <Text style={styles.menuLabel}>Medições e Medidas</Text>
            <Ionicons name="chevron-forward" size={18} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push({ 
              pathname: '/metrics', 
              params: { studentId: id } // 'id' é o ID do aluno que você pegou do useLocalSearchParams
            })}
          >
            <View style={[styles.iconBox, { backgroundColor: '#1A1A1A' }]}>
              <MaterialIcons name="show-chart" size={22} color="#4A90E2" />
            </View>
            <Text style={styles.menuLabel}>Gráficos de Performance</Text>
            <Ionicons name="chevron-forward" size={18} color="#444" />
          </TouchableOpacity>

          {/* BOTÃO DE DESVINCULAR (O QUE ESTAVA DANDO ERRO) */}
          <TouchableOpacity 
            style={[styles.menuItem, styles.dangerItem]} 
            onPress={handleDesvincular}
            activeOpacity={0.6}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,0,0,0.1)' }]}>
              <Ionicons name="person-remove" size={22} color={colors.red} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.red }]}>Remover Aluno da Consultoria</Text>
            <Ionicons name="alert-circle-outline" size={18} color={colors.red} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FOOTER - Verifique se o clique funciona com ele presente */}
      <StickyFooter active="clients" userProfile="TEACHER" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loadingCenter: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 220 }, // Padding alto para fugir do Footer
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatarLarge: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.red },
  profileTextContainer: { marginLeft: 20, flex: 1 },
  profileName: { color: colors.white, fontSize: 22, fontWeight: '800' },
  profileEmail: { color: colors.grayText, fontSize: 14, marginTop: 4 },
  tag: { backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginTop: 10, alignSelf: 'flex-start' },
  tagText: { color: colors.red, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  mainAction: { 
    flexDirection: 'row', backgroundColor: colors.red, padding: 18, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 35
  },
  mainActionText: { color: colors.white, fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  menuGrid: { gap: 12 },
  sectionTitle: { color: colors.white, fontSize: 13, fontWeight: 'bold', marginBottom: 6, opacity: 0.4, textTransform: 'uppercase' },
  menuItem: { 
    flexDirection: 'row', backgroundColor: '#111', padding: 16, borderRadius: 14, 
    alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A' 
  },
  dangerItem: { marginTop: 30, borderColor: 'rgba(255,0,0,0.3)', borderStyle: 'dashed' },
  iconBox: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, color: colors.white, marginLeft: 15, fontWeight: '600', fontSize: 15 },
});