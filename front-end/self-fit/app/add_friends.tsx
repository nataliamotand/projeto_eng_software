import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api'; // Certifique-se de que o caminho está correto

const { width } = Dimensions.get('window');

// Interface para tipar o usuário que vem do banco
interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo_perfil: string;
  foto_perfil?: string | null;
}

export default function AddFriends(){
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Carregar usuários reais do Back-end
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/usuarios/descobrir');
      setUsers(response.data);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      Alert.alert("Erro", "Não foi possível carregar a lista de usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 2. Lógica de Seguir
  const handleFollow = async (userId: number, userName: string) => {
    try {
      await api.post(`/usuarios/seguir/${userId}`);
      Alert.alert("Sucesso", `Solicitação enviada para ${userName}!`);
      
      // Opcional: Remove o usuário da lista após seguir para dar feedback visual
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Erro ao seguir usuário.";
      Alert.alert("Atenção", errorMsg);
    }
  };

  // 3. Filtro de busca (Local para performance, ou pode ser via API)
  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  function renderUser({ item }: { item: Usuario }) {
    const avatarSource = item.foto_perfil
      ? { uri: item.foto_perfil }
      : require('../assets/images/logo.png');

    return (
      <View style={styles.userRow}>
        <View style={styles.userLeft}>
          <Image 
            source={avatarSource} 
            style={styles.avatar} 
          />
          <View style={styles.userTexts}>
            <Text style={styles.userName}>{item.nome}</Text>
            <Text style={styles.userLogin}>{item.email}</Text>
          </View>
        </View>

        <View style={styles.userRight}>
          <TouchableOpacity
            style={styles.followButton}
            onPress={() => handleFollow(item.id, item.nome)}
          >
            <Text style={styles.followText}>Seguir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backTouch}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.title}>Encontrar pessoas</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.grayText} style={{ marginLeft: 12 }} />
        <TextInput
          placeholder="Buscar"
          placeholderTextColor={colors.grayText}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id.toString()}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 12,
  },
  backTouch: { width: 40 },
  title: { flex: 1, color: colors.white, fontSize: 18, fontWeight: '700', textAlign: 'left' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    marginHorizontal: 16,
    borderRadius: 999,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  list: { paddingHorizontal: 12, paddingBottom: 24 },
  emptyText: { color: colors.grayText, textAlign: 'center', marginTop: 20 },

  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  userLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#222' },
  userTexts: { marginLeft: 12 },
  userName: { color: colors.white, fontWeight: '700', fontSize: 15 },
  userLogin: { color: colors.grayText, fontSize: 13, marginTop: 4 },

  userRight: { flexDirection: 'row', alignItems: 'center' },
  followButton: { backgroundColor: colors.red, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  followText: { color: colors.white, fontWeight: '700' },
});