import React, { useState, useCallback } from 'react';
import { 
  SafeAreaView, View, Text, StyleSheet, FlatList, 
  TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../src/services/api';
import { colors } from '../src/components/ui/theme';
import Header from '../src/components/ui/Header';
import StickyFooter from '../src/components/ui/StickyFooter';

export default function ClientsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'my' | 'discover'>('my');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  const loadStudents = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const endpoint = tab === 'my' ? '/professor/alunos' : '/professor/descobrir-alunos';
      const response = await api.get(endpoint);
      setStudents(response.data);
    } catch (error) {
      console.error("Erro ao carregar lista de alunos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, refreshing]);

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [loadStudents])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  async function handleLinkStudent(alunoId: number) {
    try {
      await api.put(`/professor/vincular-aluno/${alunoId}`);
      Alert.alert("Sucesso", "Aluno vinculado à sua base!");
      setTab('my');
    } catch (error) {
      Alert.alert("Erro", "Não foi possível realizar o vínculo.");
    }
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image 
        source={item.foto_perfil ? { uri: item.foto_perfil } : require('../assets/images/logo.png')} 
        style={styles.avatar} 
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.nome}</Text>
        <Text style={styles.goal}>{item.objetivo || 'Foco em evolução'}</Text>
      </View>
      
      {tab === 'my' ? (
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => {
            router.push({
              pathname: '/client_details',
              params: { alunoId: item.id }
            });
          }}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.red} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => handleLinkStudent(item.id)}
        >
          <FontAwesome5 name="user-plus" size={18} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Gestão de Alunos" />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'my' && styles.activeTab]} 
          onPress={() => setTab('my')}
        >
          <Text style={[styles.tabText, tab === 'my' && styles.activeTabText]}>Meus Alunos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'discover' && styles.activeTab]} 
          onPress={() => setTab('discover')}
        >
          <Text style={[styles.tabText, tab === 'discover' && styles.activeTabText]}>Descobrir</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.red} />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Nenhum aluno por aqui.</Text>
            </View>
          }
        />
      )}

      <StickyFooter active="clients" userProfile="TEACHER" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#111', padding: 5, borderRadius: 12, margin: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: colors.red },
  tabText: { color: '#666', fontWeight: 'bold' },
  activeTabText: { color: colors.white },
  listPadding: { padding: 16, paddingBottom: 100 },
  card: { 
    flexDirection: 'row', backgroundColor: '#161616', padding: 15, borderRadius: 15, 
    alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#222' 
  },
  avatar: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#333' },
  info: { flex: 1, marginLeft: 15 },
  name: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  goal: { color: colors.grayText, fontSize: 13, marginTop: 3 },
  detailsButton: { padding: 5 },
  linkButton: { backgroundColor: colors.red, padding: 12, borderRadius: 10 },
  emptyText: { color: '#444', fontSize: 14 }
});