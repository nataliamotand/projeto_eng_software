import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  Modal, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  
  // Estados de controle
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [userData, setUserData] = useState({ nome: '', handle: '' });
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  
  // Estados do Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  useEffect(() => {
    async function syncHome() {
      try {
        setLoading(true);
        
        // 1. Busca quem é o usuário logado (Usando o Token do interceptor)
        const userRes = await api.get('/usuarios/me');
        const { nome, tipo_perfil } = userRes.data;
        
        setUserData({ 
          nome, 
          handle: `@${nome.toLowerCase().replace(/\s/g, '')}` 
        });
        setUserProfile(tipo_perfil);

        // 2. Busca o feed baseado na Regra do Eduardo
        // Se Professor -> /professor/feed-alunos | Se Aluno -> /aluno/feed-amigos
        const endpoint = tipo_perfil === 'TEACHER' ? '/professor/feed-alunos' : '/aluno/feed-amigos';
        const feedRes = await api.get(endpoint);
        setFeedPosts(feedRes.data);

      } catch (err) {
        console.error("Erro na linkagem da Home:", err);
      } finally {
        setLoading(false);
      }
    }

    syncHome();
  }, []);

  // Tela de carregamento enquanto a API não responde
  if (loading) {
    return (
      <View style={[styles.safeArea, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.red} />
        <Text style={{ color: colors.white, marginTop: 10 }}>Sincronizando seu perfil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER DINÂMICO */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Image source={require('../assets/images/logo.png')} style={styles.avatarImage} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData.nome}</Text>
            <Text style={styles.userHandle}>{userData.handle}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* REGRA: Só Aluno vê botão de adicionar amigo */}
          {userProfile === 'STUDENT' && (
            <TouchableOpacity onPress={() => router.push('/add_friends')}>
              <FontAwesome name="user-plus" size={20} color={colors.white} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FEED DE ATIVIDADES */}
      <View style={styles.content}>
        <FlatList
          data={feedPosts}
          keyExtractor={(p) => p.id.toString()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {userProfile === 'TEACHER' 
                  ? "Seus alunos ainda não treinaram hoje." 
                  : "Nenhuma atividade dos seus amigos."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <Text style={styles.postAuthor}>{item.authorName}</Text>
                <Text style={styles.postTime}>{item.timeAgo || 'Agora'}</Text>
              </View>
              
              <Text style={styles.postSmall}>
                {userProfile === 'TEACHER' ? "Concluiu o treino planejado:" : "Finalizou um treino:"}
              </Text>
              <Text style={styles.workoutTitle}>{item.workoutTitle}</Text>
              
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => { setSelectedPost(item); setModalVisible(true); }}
              >
                <Text style={styles.viewButtonText}>Visualizar Detalhes</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }} // Espaço para não cobrir o footer
        />
      </View>

      {/* FOOTER INTELIGENTE */}
      <StickyFooter active="home" userProfile={userProfile} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { 
    backgroundColor: colors.red, 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  headerRight: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatar: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    backgroundColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  avatarImage: { 
    width: 30, 
    height: 20, 
    resizeMode: 'contain' 
  },
  userInfo: { 
    flexDirection: 'column' 
  },
  userName: { 
    color: colors.white, 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  userHandle: { 
    color: colors.white, 
    opacity: 0.8, 
    fontSize: 12 
  },
  content: { 
    flex: 1, 
    padding: 16 
  },
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 50 
  },
  emptyText: { 
    color: colors.gray, 
    textAlign: 'center' 
  },
  postCard: { 
    backgroundColor: '#1A1A1A', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222'
  },
  postHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  postAuthor: { 
    color: colors.white, 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  postTime: { 
    color: colors.gray, 
    fontSize: 11 
  },
  postSmall: { 
    color: colors.gray, 
    fontSize: 12, 
    marginBottom: 4 
  },
  workoutTitle: { 
    color: colors.red, 
    fontWeight: 'bold', 
    fontSize: 17 
  },
  viewButton: { 
    marginTop: 12, 
    alignSelf: 'flex-start' 
  },
  viewButtonText: { 
    color: colors.white, 
    textDecorationLine: 'underline', 
    fontSize: 13 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    padding: 20 
  },
  modalCard: { 
    backgroundColor: '#1A1A1A', 
    padding: 20, 
    borderRadius: 15 
  },
  modalTitle: { 
    color: colors.white, 
    fontSize: 20, 
    fontWeight: '700' 
  },
  modalMeta: { 
    color: colors.gray, 
    marginTop: 5 
  },
  exerciseRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#333' 
  },
  exerciseName: { 
    color: colors.white 
  },
  exerciseInfo: { 
    color: colors.red 
  },
});