import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert
} from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api'; 

const { width } = Dimensions.get('window');

// 1. COMPONENTE DE HEADER DINÂMICO
function Header({ user }: { user: any }) {
  const router = useRouter();
  const avatarUri = user?.foto_perfil ? String(user.foto_perfil) : null;

  return (
    <View style={styles.header}>
      <View style={styles.headerDetail} pointerEvents="none" />
      <View style={styles.headerLeft}>
        <View style={styles.avatar}>
          <Image
            source={avatarUri ? { uri: avatarUri } : require('../assets/images/logo.png')}
            style={styles.avatarImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.nome || 'Carregando...'}</Text>
          <Text style={styles.userHandle}>@{user?.email?.split('@')[0] || 'usuario'}</Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconTouch} onPress={() => router.push('/add_friends')}>
          <FontAwesome name="user-plus" size={20} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconTouch} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RoutinesAndWorkouts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [routines, setRoutines] = useState<any[]>([]);
  
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      try {
        const userRes = await api.get('/usuarios/me');
        setUser(userRes.data);
      } catch (err) { console.error("Erro ao carregar usuário:", err); }

      try {
        const routinesRes = await api.get('/alunos/minhas-rotinas');
        setRoutines(routinesRes.data);
      } catch (err) { console.error("Erro ao carregar rotinas:", err); }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedRoutine = routines.find(r => r.id === openMenuId);
  const isProfessorRoutine = selectedRoutine?.criado_por_professor === true;

  function handleEdit(id: number) {
    if (isProfessorRoutine) {
      Alert.alert("Bloqueado", "Esta rotina foi criada pelo professor e não pode ser editada.");
      return;
    }
    setOpenMenuId(null);
    router.push(`/create_routine?id=${id}`);
  }

  function handleDelete(id: number) {
    if (isProfessorRoutine) return;
    setOpenMenuId(null);
    // Aqui viria a lógica de delete no banco
  }

  function handleSendRequest() {
    if (!requestMessage.trim()) {
      Alert.alert("Erro", "O texto da solicitação não pode ser nulo.");
      return;
    }
    console.log('Notificação enviada para professor:', requestMessage);
    setRequestMessage('');
    setShowRequestModal(false);
    Alert.alert("Enviado", "Sua solicitação foi encaminhada ao professor.");
  }

  if (loading) return <View style={styles.loadingArea}><ActivityIndicator color={colors.red} size="large" /></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header user={user} />

      <View style={styles.container}>
        <View style={styles.inner}>
          
          <TouchableOpacity style={styles.newRoutineButton} onPress={() => setShowNewMenu(!showNewMenu)}>
            <MaterialIcons name="note-add" size={20} color={colors.white} />
            <Text style={styles.newRoutineText}>Nova Rotina</Text>
          </TouchableOpacity>

          {showNewMenu && (
            <View style={styles.newMenu}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowNewMenu(false); router.push('/create_routine'); }}>
                <FontAwesome name="plus-circle" size={18} color={colors.white} />
                <Text style={styles.menuText}>Seguir por conta própria</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowNewMenu(false); setShowRequestModal(true); }}>
                <Ionicons name="mail" size={18} color={colors.white} />
                <Text style={styles.menuText}>Solicitar ao professor</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ROTINAS</Text>
          </View>

          <FlatList
            data={routines}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {/* CORREÇÃO 1: Menu só aparece se NÃO for do professor */}
                {!item.criado_por_professor && (
                  <TouchableOpacity 
                    style={styles.cardOptions} 
                    onPress={() => setOpenMenuId(item.id)}
                  >
                    <MaterialIcons name="more-vert" size={20} color={colors.grayText} />
                  </TouchableOpacity>
                )}

                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.cardRow}>
                  <FontAwesome name={item.status === 'approved' ? 'check-circle' : 'clock-o'} size={14} color={colors.grayText} />
                  <Text style={styles.approvedText}>
                    {item.criado_por_professor ? ` Criada pelo Professor` : ` Sua rotina`}
                  </Text>
                </View>
                <TouchableOpacity style={styles.startButton} onPress={() => router.push(`/workout?id=${item.id}`)}>
                  <Text style={styles.startButtonText}>Iniciar Rotina</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.list}
          />

          <Modal visible={openMenuId !== null} transparent animationType="fade">
            <Pressable style={styles.modalBackdrop} onPress={() => setOpenMenuId(null)}>
              <View style={styles.modalContentCentered}>
                <Text style={styles.modalAlertText}>Opções da Rotina</Text>
                <TouchableOpacity style={styles.modalOptionButton} onPress={() => handleEdit(openMenuId!)}>
                  <Text style={styles.modalOptionText}>Editar rotina</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalOptionButton, { marginTop: 8 }]} onPress={() => handleDelete(openMenuId!)}>
                  <Text style={[styles.modalOptionText, { color: colors.red }]}>Excluir rotina</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>

          <Modal visible={showRequestModal} transparent animationType="slide">
            <View style={styles.modalBackdrop}>
              <View style={styles.modalContentCentered}>
                <Text style={styles.modalTitle}>Solicitar ao professor</Text>
                <TextInput
                  style={styles.requestInput}
                  placeholder="Ex: Gostaria de focar em ombros essa semana..."
                  placeholderTextColor="#666"
                  multiline
                  value={requestMessage}
                  onChangeText={setRequestMessage}
                />
                <View style={styles.requestButtonsRow}>
                  <TouchableOpacity style={[styles.requestButton, { backgroundColor: colors.red }]} onPress={handleSendRequest}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Enviar Pedido</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

        </View>
      </View>

      <StickyFooter active="workouts" userProfile={user?.tipo_perfil} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.red,
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  headerDetail: {
    position: 'absolute',
    right: -width * 0.15,
    top: -40,
    width: width * 0.5,
    height: 120,
    backgroundColor: colors.lightRed,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    transform: [{ rotate: '15deg' }],
    opacity: 0.18,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: { width: 40, height: 24 },
  userInfo: { flexDirection: 'column' },
  userName: { color: colors.white, fontSize: 16, fontWeight: '700' },
  userHandle: { color: colors.white, fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconTouch: { marginLeft: 14, padding: 6 },
  container: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -12,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  loadingArea: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  newRoutineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkRed,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  newRoutineText: { color: colors.white, marginLeft: 8, fontWeight: '700' },
  newMenu: {
    backgroundColor: '#121212',
    borderRadius: 10,
    paddingVertical: 6,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6 },
  menuText: { color: colors.white, marginLeft: 10, fontSize: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  sectionTitle: { color: colors.white, fontSize: 24, fontWeight: '700' },
  list: { paddingBottom: 100 },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  // CORREÇÃO 2: Hitbox aumentada e Pointer Cursor
  cardOptions: { 
    position: 'absolute', 
    right: 0, 
    top: 0, 
    padding: 20, // Hitbox maior para facilitar o toque
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // @ts-ignore
    cursor: 'pointer' 
  },
  cardTitle: { color: colors.red, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  approvedText: { color: colors.grayText, marginLeft: 8, fontSize: 13 },
  startButton: {
    marginTop: 15,
    backgroundColor: '#222',
    height: 45,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: { color: colors.white, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContentCentered: {
    backgroundColor: '#0F0F0F',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    width: '100%',
  },
  modalTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalAlertText: { color: colors.grayText, fontSize: 12, textAlign: 'center', marginBottom: 15, textTransform: 'uppercase' },
  modalOptionButton: {
    backgroundColor: '#161616',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalOptionText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  requestInput: {
    backgroundColor: '#050505',
    borderColor: '#333',
    borderWidth: 1,
    color: colors.white,
    padding: 12,
    borderRadius: 10,
    textAlignVertical: 'top',
    minHeight: 120,
    marginBottom: 16,
  },
  requestButtonsRow: { flexDirection: 'row', justifyContent: 'center' },
  requestButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
});