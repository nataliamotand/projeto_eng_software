import React, { useState, useCallback } from 'react';
import { 
  SafeAreaView, View, Text, StyleSheet, FlatList, 
  TouchableOpacity, Image, ActivityIndicator, RefreshControl, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../src/services/api';
import { colors } from '../src/components/ui/theme';
import Header from '../src/components/ui/Header';
import StickyFooter from '../src/components/ui/StickyFooter';

type TabType = 'my' | 'discover' | 'fichas';

export default function ClientsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>('my');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [students, setStudents] = useState<any[]>([]);
  const [fichasModelos, setFichasModelos] = useState<any[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (tab === 'my') {
        const res = await api.get('/professor/alunos');
        setStudents(res.data);
      } else if (tab === 'discover') {
        const res = await api.get('/professor/descobrir-alunos');
        setStudents(res.data);
      } else {
        const [resModelos, resReqs] = await Promise.all([
          api.get('/professor/fichas/modelos'),
          api.get('/professor/fichas/solicitacoes')
        ]);
        setFichasModelos(resModelos.data);
        setSolicitacoes(resReqs.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // --- RENDERIZAÇÃO DE ALUNOS (ABAS MEUS E DESCOBRIR) ---
  const renderStudentItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.studentCard}
      onPress={() => {
        if (tab === 'my') {
          router.push(`/client_details?id=${item.id}`);
        }
      }}
    >
      <Image 
        source={item.foto_perfil ? { uri: item.foto_perfil } : require('../assets/images/logo.png')} 
        style={styles.studentAvatar} 
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.studentName}>{item.nome}</Text>
        <Text style={styles.studentObjective}>{item.objetivo || 'Sem objetivo definido'}</Text>
      </View>
      {tab === 'discover' ? (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={async () => {
            await api.put(`/professor/vincular-aluno/${item.id}`);
            loadData();
          }}
        >
          <Ionicons name="person-add" size={20} color={colors.white} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#444" />
      )}
    </TouchableOpacity>
  );

  // --- RENDERIZAÇÃO DA ABA DE FICHAS ---
  const renderFichasContent = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Solicitações Pendentes</Text>
        {solicitacoes.length > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{solicitacoes.length}</Text></View>
        )}
      </View>
      
      {solicitacoes.length === 0 && <Text style={styles.emptyText}>Nenhuma solicitação no momento.</Text>}

      {solicitacoes.map((item) => (
        <TouchableOpacity key={`sol-${item.id}`} style={styles.fichaCard} onPress={() => router.push(`/create_routine?studentId=${item.aluno_id}`)}>
          <View style={styles.iconCircle}><MaterialCommunityIcons name="bell-alert" size={20} color={colors.red} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fichaTitle}>Solicitação de Ficha</Text>
            <Text style={styles.fichaSubtitle}>Aluno aguardando prescrição</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.grayText} />
        </TouchableOpacity>
      ))}

      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>Meus Modelos de Fichas</Text>
      </View>

      {fichasModelos.map((ficha) => (
        <TouchableOpacity key={`ficha-${ficha.id}`} style={styles.fichaCard} onPress={() => router.push(`/edit_routine?fichaId=${ficha.id}`)}>
          <View style={[styles.iconCircle, { backgroundColor: '#222' }]}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fichaTitle}>{ficha.titulo}</Text>
            <Text style={styles.fichaSubtitle}>{ficha.exercicios?.length || 0} exercícios</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.grayText} />
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity style={styles.addTemplateBtn} onPress={() => router.push('/create_routine')}>
        <Ionicons name="add" size={20} color={colors.red} />
        <Text style={styles.addTemplateText}>Criar Nova Ficha Modelo</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Gestão de Alunos e Fichas" />
      
      <View style={styles.tabContainer}>
        {(['my', 'discover', 'fichas'] as TabType[]).map((t) => (
          <TouchableOpacity 
            key={t}
            style={[styles.tab, tab === t && styles.activeTab]} 
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t === 'my' ? 'Meus Alunos' : t === 'discover' ? 'Descobrir' : 'Fichas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
      ) : (
        <View style={{ flex: 1 }}>
          {tab === 'fichas' ? (
            <View style={{ flex: 1, paddingHorizontal: 16 }}>{renderFichasContent()}</View>
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderStudentItem}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData()} tintColor={colors.red} />}
              ListEmptyComponent={<Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>}
            />
          )}
        </View>
      )}

      <StickyFooter active="clients" userProfile="TEACHER" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#111', padding: 5, borderRadius: 12, margin: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: colors.red },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  activeTabText: { color: colors.white },
  
  studentCard: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  studentAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  studentName: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  studentObjective: { color: colors.grayText, fontSize: 12, marginTop: 4 },
  addButton: { backgroundColor: colors.red, padding: 8, borderRadius: 8 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  sectionTitle: { color: colors.white, fontSize: 14, fontWeight: 'bold', opacity: 0.6 },
  badge: { backgroundColor: colors.red, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
  fichaCard: { flexDirection: 'row', backgroundColor: '#111', padding: 16, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#251010', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  fichaTitle: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  fichaSubtitle: { color: colors.grayText, fontSize: 12, marginTop: 2 },
  addTemplateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.red, borderStyle: 'dashed', padding: 16, borderRadius: 15, marginTop: 10, gap: 10 },
  addTemplateText: { color: colors.white, fontWeight: 'bold' },
  emptyText: { color: colors.grayText, textAlign: 'center', marginTop: 20 }
});