import React, { useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Modal, ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router'; // Adicionado useLocalSearchParams
import Header from '../src/components/ui/Header';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';

export default function PreviousWorkouts() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams(); // Captura o ID vindo do client_details
  
  const [user, setUser] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Define qual endpoint usar: histórico do aluno (Professor) ou próprio (Aluno)
      const historyEndpoint = studentId 
        ? `/professor/aluno/${studentId}/historico` 
        : '/alunos/historico-treinos';

      const [historyRes, userRes] = await Promise.all([
        api.get(historyEndpoint),
        api.get('/usuarios/me')
      ]);
      
      setWorkouts(historyRes.data);
      setUser(userRes.data);
    } catch (err: any) {
      console.error("Erro ao carregar dados do histórico:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [studentId]) // Recarrega se o studentId mudar
  );

  function formatDate(iso: string) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  function openWorkoutModal(item: any) {
    setSelectedWorkout(item);
    setModalVisible(true);
  }

  if (loading && workouts.length === 0) {
    return (
      <View style={styles.loadingArea}>
        <ActivityIndicator color={colors.red} size="large" />
        <Text style={{ color: colors.grayMid, marginTop: 10 }}>Sincronizando treinos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={studentId ? "Histórico do Aluno" : "Meus Treinos"} onBack={() => router.replace('/profile')} />

      <FlatList
        data={workouts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openWorkoutModal(item)}>
            <View style={styles.cardLeft}>
              {/* Ajustei para aceitar 'titulo' ou 'nome_treino' dependendo do retorno da API */}
              <Text style={styles.cardTitle}>{item.titulo || item.nome_treino}</Text>
              <Text style={styles.cardMeta}>
                {formatDate(item.data_fim || item.data_conclusao)} • {item.duracao_minutos} min
              </Text>
              <Text style={styles.cardMeta}>
                {item.exercicios?.length || 0} exercícios • {item.volume_total ? `${item.volume_total} kg` : '—'}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <MaterialIcons name="chevron-right" size={24} color={colors.lightGray} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="history" size={60} color="#222" />
            <Text style={styles.emptyText}>
              {studentId ? "Este aluno ainda não registrou treinos." : "Você ainda não finalizou nenhum treino."}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalCard}>
            {selectedWorkout && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedWorkout.titulo || selectedWorkout.nome_treino}</Text>
                  <Text style={styles.modalMeta}>
                    {formatDate(selectedWorkout.data_fim || selectedWorkout.data_conclusao)} • {selectedWorkout.duracao_minutos} min
                  </Text>
                </View>
                <ScrollView style={{ marginTop: 15 }} showsVerticalScrollIndicator={false}>
                  {selectedWorkout.exercicios && selectedWorkout.exercicios.length > 0 ? (
                    selectedWorkout.exercicios.map((ex: any, idx: number) => (
                      <View key={idx} style={styles.exerciseDetailRow}>
                        <Text style={styles.exerciseTitle}>
                          {ex.nome ? ex.nome.replace(/_/g, ' ') : 'Exercício'}
                        </Text>
                        <Text style={styles.exerciseInfo}>
                          {ex.series} sets • {ex.carga}kg
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: colors.grayMid, textAlign: 'center', marginTop: 20 }}>
                      Nenhum detalhe de exercício disponível.
                    </Text>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

// ... Seus estilos permanecem os mesmos ...

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loadingArea: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: colors.darkGray,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1A1A1A'
  },
  cardLeft: { flex: 1 },
  cardTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 4 },
  cardMeta: { color: colors.lightGray, fontSize: 13, marginTop: 2 },
  cardRight: { marginLeft: 10 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#444', marginTop: 15, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { 
    backgroundColor: '#0A0A0A', 
    borderTopLeftRadius: 25, 
    borderTopRightRadius: 25, 
    padding: 25, 
    minHeight: '40%' 
  },
  modalHeader: { borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 15 },
  modalTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  modalMeta: { color: colors.lightGray, marginTop: 5 },
  exerciseDetailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#111' 
  },
  exerciseTitle: { color: colors.white, fontWeight: '600' },
  exerciseInfo: { color: colors.red },
});