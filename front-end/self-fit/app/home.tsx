import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl // <--- Adicionado para o Pull-to-Refresh
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';
import NotificationButton from '../src/components/ui/NotificationButton';

const { width } = Dimensions.get('window');

function formatarTempoRelativo(dataIso: string | Date | undefined) {
  if (dataIso == null || dataIso === '') return 'Agora';
  const agora = new Date();
  const dataPost = dataIso instanceof Date ? dataIso : new Date(dataIso);
  const diffInMs = agora.getTime() - dataPost.getTime();
  const diffEmSegundos = Math.floor(diffInMs / 1000);

  if (diffEmSegundos < 60) return 'Agora mesmo';
  const diffEmMinutos = Math.floor(diffEmSegundos / 60);
  if (diffEmMinutos < 60) return `há ${diffEmMinutos} min`;
  const diffEmHoras = Math.floor(diffEmMinutos / 60);
  if (diffEmHoras < 24) return `há ${diffEmHoras} h`;
  const diffEmDias = Math.floor(diffEmHoras / 24);
  return `há ${diffEmDias} dias`;
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // <--- Estado de refresh
  const [userProfile, setUserProfile] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [userData, setUserData] = useState({ nome: '', handle: '' });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(0);

  const syncHome = useCallback(async () => {
    try {
      // 1. Busca dados do usuário logado
      const userRes = await api.get('/usuarios/me');
      const { nome, tipo_perfil, foto_perfil } = userRes.data;
      
      setUserData({ 
        nome, 
        handle: `@${nome.toLowerCase().replace(/\s/g, '')}` 
      });
      setUserProfile(tipo_perfil);
      setAvatarUri(foto_perfil ? String(foto_perfil) : null);

      // 2. Busca contagem de notificações
      try {
          const countRes = await api.get('/notificacoes/contagem');
          setNotificacoesAtivas(countRes.data.contagem);
      } catch (e) { console.log("Erro Notificações"); }

      // 3. Busca o Feed
      const endpoint = tipo_perfil === 'TEACHER' ? '/professor/feed-alunos' : '/aluno/feed-amigos';
      const feedRes = await api.get(endpoint);
      setFeedPosts(feedRes.data);

    } catch (err) {
      console.error("Erro na linkagem da Home:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    syncHome();
  }, [syncHome]);

  const onRefresh = () => {
    setRefreshing(true);
    syncHome();
  };

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
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/edit_profile')}>
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

      {/* FEED DE ATIVIDADES */}
      <View style={styles.content}>
        <FlatList
          data={feedPosts}
          keyExtractor={(p) => p.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {userProfile === 'TEACHER' ? "Seus alunos ainda não treinaram." : "Siga amigos para ver atividades."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const fotoFeed =
              typeof item.usuario_foto === 'string' && item.usuario_foto.trim().length > 0
                ? item.usuario_foto.trim()
                : null;
            return (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postAuthorRow}>
                  <Image
                    source={fotoFeed ? { uri: fotoFeed } : require('../assets/images/logo.png')}
                    style={styles.postAvatar}
                    resizeMode="cover"
                  />
                  <Text style={styles.postAuthor}>{item.usuario_nome}</Text>
                </View>
                <Text style={styles.postTime}>{formatarTempoRelativo(item.data)}</Text>
              </View>
              <Text style={styles.postSubtitle}>{item.titulo}</Text>
              <Text style={styles.workoutTitle}>{item.descricao}</Text>
            </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 100 }}
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
    paddingTop: 50, 
    paddingBottom: 20,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#000', overflow: 'hidden', marginRight: 12 },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  userInfo: { flexDirection: 'column' },
  userName: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  userHandle: { color: colors.white, opacity: 0.8, fontSize: 12 },
  content: { flex: 1, padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: colors.gray, textAlign: 'center' },
  postCard: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8, backgroundColor: '#333' },
  postAuthor: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  postTime: { color: colors.gray, fontSize: 11 },
  postSubtitle: { color: colors.white, fontSize: 12, marginBottom: 4, opacity: 0.7 },
  workoutTitle: { color: colors.red, fontWeight: 'bold', fontSize: 16 },
});