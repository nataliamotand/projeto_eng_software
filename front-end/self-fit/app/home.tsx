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
  ActivityIndicator 
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';
import NotificationButton from '../src/components/ui/NotificationButton';

const { width } = Dimensions.get('window');

function formatarTempoRelativo(dataIso: string) {
  if (!dataIso) return 'Agora';
  
  const agora = new Date();
  const dataPost = new Date(dataIso);

  // Calcula a diferença em milissegundos
  const diffInMs = agora.getTime() - dataPost.getTime();
  const diffEmSegundos = Math.floor(diffInMs / 1000);

  // Se a diferença for negativa (por causa de fuso horário), assume que foi agora
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
  const [userProfile, setUserProfile] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [userData, setUserData] = useState({ nome: '', handle: '' });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  
  // NOVO ESTADO: Para a bolinha de notificações
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(0);
  
  useEffect(() => {
    async function syncHome() {
      try {
        setLoading(true);
        
        // 1. Busca dados do usuário logado
        const userRes = await api.get('/usuarios/me');
        const { nome, tipo_perfil, foto_perfil } = userRes.data;
        
        setUserData({ 
          nome, 
          handle: `@${nome.toLowerCase().replace(/\s/g, '')}` 
        });
        setUserProfile(tipo_perfil);
        setAvatarUri(foto_perfil ? String(foto_perfil) : null);

        // 2. BUSCA CONTAGEM DE NOTIFICAÇÕES (Nova Funcionalidade)
        try {
            const countRes = await api.get('/notificacoes/contagem');
            setNotificacoesAtivas(countRes.data.contagem);
        } catch (e) {
            console.log("Erro ao buscar contagem de notificações");
        }

        // 3. Busca o Feed
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
          <View style={styles.avatar}>
            <Image source={avatarUri ? { uri: avatarUri } : require('../assets/images/logo.png')} style={styles.avatarImage} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData.nome}</Text>
            <Text style={styles.userHandle}>{userData.handle}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {userProfile === 'STUDENT' && (
            <TouchableOpacity 
              onPress={() => router.push('/add_friends')}
              style={{ marginRight: 15 }}
            >
              <FontAwesome name="user-plus" size={20} color={colors.white} />
            </TouchableOpacity>
          )}
          {/* PASSO 4: Passando a quantidade para o botão disparar a bolinha vermelha */}
          <NotificationButton quantidade={notificacoesAtivas} />
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
                <Text style={styles.postAuthor}>{item.usuario_nome}</Text>
                {/* PASSO 5: Substituído "Agora" pela função de tempo real */}
                <Text style={styles.postTime}>{formatarTempoRelativo(item.data)}</Text>
              </View>
              <Text style={styles.postSubtitle}>{item.titulo}</Text>
              <Text style={styles.workoutTitle}>{item.descricao}</Text>
            </View>
          )}
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
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImage: { 
    width: '100%', // Preenche todo o container
    height: '100%', 
    borderRadius: 22.5, // Mantém arredondado
    resizeMode: 'cover' // Faz a foto preencher sem distorcer
  },
  userInfo: { flexDirection: 'column' },
  userName: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  userHandle: { color: colors.white, opacity: 0.8, fontSize: 12 },
  content: { flex: 1, padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: colors.gray, textAlign: 'center' },
  postCard: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  postAuthor: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  postTime: { color: colors.gray, fontSize: 11 },
  postSubtitle: { color: colors.white, fontSize: 12, marginBottom: 4, opacity: 0.7 },
  workoutTitle: { color: colors.red, fontWeight: 'bold', fontSize: 16 },
});