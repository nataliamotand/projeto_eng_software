import React, { useState, useCallback } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';
import NotificationButton from '../src/components/ui/NotificationButton';

const { width } = Dimensions.get('window');

// Helper para tempo relativo (ex: "há 2 horas")
function formatarTempoRelativo(dataIso: string | Date | undefined) {
  if (!dataIso) return 'Agora';
  const agora = new Date();
  const dataPost = new Date(dataIso);
  const diffInMs = agora.getTime() - dataPost.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);

  if (diffInSec < 60) return 'Agora mesmo';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `há ${diffInMin} min`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `há ${diffInHours} h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `há ${diffInDays} dias`;
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [userData, setUserData] = useState({ nome: '', handle: '' });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(0);

  const syncHome = useCallback(async () => {
    try {
      // 1. Dados do Usuário
      const userRes = await api.get('/usuarios/me');
      const { nome, tipo_perfil, foto_perfil } = userRes.data;
      
      setUserData({ 
        nome, 
        handle: `@${nome.toLowerCase().replace(/\s/g, '')}` 
      });
      setUserProfile(tipo_perfil);
      setAvatarUri(foto_perfil ? String(foto_perfil) : null);

      // 2. Notificações
      try {
        const countRes = await api.get('/notificacoes/contagem');
        setNotificacoesAtivas(countRes.data.contagem);
      } catch (e) { /* Silencioso */ }

      // 3. Feed Dinâmico
      const endpoint = tipo_perfil === 'TEACHER' ? '/professor/feed-alunos' : '/aluno/feed-amigos';
      const feedRes = await api.get(endpoint);
      setFeedPosts(feedRes.data);

    } catch (err) {
      console.error("Erro na sincronização da Home:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncHome();
    }, [syncHome])
  );

  const onRefresh = () => {
    setRefreshing(true);
    syncHome();
  };

  const handleCardPress = (item: any) => {
    if (item.tipo === 'TREINO') {
      // Extrai apenas o número do ID (ex: "pe_tr_12" -> "12")
      const treinoId = item.id.split('_').pop();
      router.push({
        pathname: '/view_workout',
        params: { treinoId, alunoNome: item.usuario_nome }
      });
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.safeArea, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.red} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER DINÂMICO */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile')}>
            <Image 
              source={avatarUri ? { uri: avatarUri } : require('../assets/images/logo.png')} 
              style={styles.avatarImage} 
            />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData.nome}</Text>
            <Text style={styles.userHandle}>{userData.handle}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {userProfile === 'STUDENT' && (
            <TouchableOpacity onPress={() => router.push('/add_friends')} style={{ marginRight: 15 }}>
              <FontAwesome name="user-plus" size={20} color={colors.white} />
            </TouchableOpacity>
          )}
          <NotificationButton quantidade={notificacoesAtivas} />
        </View>
      </View>

      {/* FEED PRINCIPAL */}
      <View style={styles.content}>
        <FlatList
          data={feedPosts}
          keyExtractor={(p) => p.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {userProfile === 'TEACHER' ? "Nenhuma atividade dos seus alunos." : "Siga amigos para ver o feed."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isTreino = item.tipo === 'TREINO';
            return (
              <TouchableOpacity 
                style={styles.postCard} 
                activeOpacity={isTreino ? 0.7 : 1}
                onPress={() => handleCardPress(item)}
              >
                <View style={styles.postHeader}>
                  <View style={styles.postAuthorRow}>
                    <Image
                      source={item.usuario_foto ? { uri: item.usuario_foto } : require('../assets/images/logo.png')}
                      style={styles.postAvatar}
                    />
                    <Text style={styles.postAuthor}>{item.usuario_nome}</Text>
                  </View>
                  <Text style={styles.postTime}>{formatarTempoRelativo(item.data)}</Text>
                </View>

                <View style={styles.postBody}>
                  <View style={styles.typeIcon}>
                    {isTreino ? (
                      <MaterialCommunityIcons name="arm-flex" size={24} color={colors.red} />
                    ) : (
                      <Ionicons name="trending-up" size={24} color={colors.green} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postSubtitle}>{item.titulo}</Text>
                    <Text style={styles.workoutTitle}>{item.descricao}</Text>
                    {isTreino && (
                      <View style={styles.viewDetailHint}>
                        <Text style={styles.hintText}>Toque para ver exercícios</Text>
                        <Ionicons name="chevron-forward" size={12} color={colors.gray} />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

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
    paddingTop: 55, 
    paddingBottom: 20,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#000', overflow: 'hidden', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  avatarImage: { width: '100%', height: '100%' },
  userInfo: { flexDirection: 'column' },
  userName: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  userHandle: { color: colors.white, opacity: 0.8, fontSize: 12 },
  content: { flex: 1, padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: colors.gray, textAlign: 'center', fontSize: 14 },
  postCard: { backgroundColor: '#111', padding: 16, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#1A1A1A' },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: '#222' },
  postAuthor: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  postTime: { color: colors.gray, fontSize: 11 },
  postBody: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { marginRight: 15, marginTop: 2 },
  postSubtitle: { color: colors.grayText, fontSize: 12, marginBottom: 4 },
  workoutTitle: { color: colors.red, fontWeight: 'bold', fontSize: 15, lineHeight: 22 },
  viewDetailHint: { flexDirection: 'row', alignItems: 'center', marginTop: 8, opacity: 0.6 },
  hintText: { color: colors.gray, fontSize: 11, marginRight: 4 }
});