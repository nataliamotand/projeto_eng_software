import React, { useState } from 'react';
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
} from 'react-native';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const colors = {
  background: '#000000',
  red: '#CC0000',
  darkRed: '#B30000',
  lightRed: '#E54F4F',
  darkNav: '#1A1A1A',
  cardBg: '#1F1F1F',
  inputBg: '#E5E5E5',
  white: '#FFFFFF',
  grayText: '#CFCFCF',
  startGray: '#6B7280',
};

// TODO: Implementar lógica para obter o perfil real do usuário (STUDENT/TEACHER)
const USER_PROFILE = 'STUDENT'; // focus implementation on STUDENT layout

const mockedRoutines = [
  {
    id: 1,
    title: 'Perna e Glúteo',
    approvedBy: 'Natália',
    exercises: 6,
    series: 18,
    status: 'approved',
  },
  {
    id: 2,
    title: 'Superior e Core',
    approvedBy: 'Professor Carlos',
    exercises: 5,
    series: 15,
    status: 'approved',
  },
  {
    id: 3,
    title: 'Cardio Leve',
    approvedBy: null,
    exercises: 4,
    series: 12,
    status: 'pending',
  },
];

function Header() {
  const router = require('expo-router').useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headerDetail} pointerEvents="none" />

      <View style={styles.headerLeft}>
        <View style={styles.avatar}>
          <Image source={require('../assets/images/logo.png')} style={styles.avatarImage} resizeMode="contain" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Gabrielli Valelia</Text>
          <Text style={styles.userHandle}>@valeliagabi</Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconTouch} onPress={() => { router.push('/add_friends'); }}>
          <FontAwesome name="user-plus" size={20} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconTouch} onPress={() => { router.push('/notifications'); }}>
          <Ionicons name="notifications-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RoutineCard({ item, onToggleMenu, onStart }: { item: any; onToggleMenu: () => void; onStart: () => void; }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardOptions} onPress={onToggleMenu}>
        <MaterialIcons name="more-vert" size={20} color={colors.grayText} />
      </TouchableOpacity>

      <Text style={styles.cardTitle}>{item.title}</Text>

      <View style={styles.cardRow}>
        <View style={styles.approvedRow}>
          <FontAwesome name={item.status === 'approved' ? 'check-circle' : 'clock-o'} size={14} color={colors.grayText} />
          <Text style={styles.approvedText}>
            {item.status === 'approved' ? ` Aprovada por ${item.approvedBy ?? '—'}` : ' Pendente'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statText}>{`${item.exercises} Exercícios`}</Text>
        <Text style={styles.statText}>{`${item.series} Séries`}</Text>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={onStart}>
        <Text style={styles.startButtonText}>Iniciar Rotina</Text>
      </TouchableOpacity>
    </View>
  );
}

function BottomNav() {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
        <FontAwesome name="home" size={24} color={colors.grayText} />
      </TouchableOpacity>

      <View style={styles.centerNavWrapper}>
        <TouchableOpacity style={styles.centerButton} onPress={() => router.push('/routines_and_workouts')}>
          <MaterialIcons name="fitness-center" size={28} color={colors.red} />
        </TouchableOpacity>
        <View style={styles.centerIndicator} />
      </View>

      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/clients')}>
        <MaterialCommunityIcons name="account-group" size={24} color={colors.grayText} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
        <FontAwesome name="user" size={24} color={colors.grayText} />
      </TouchableOpacity>
    </View>
  );
}

export default function RoutinesAndWorkouts(): JSX.Element {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [routines, setRoutines] = useState(mockedRoutines);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const router = useRouter();

  function handleToggleMenu(id: number) {
    setOpenMenuId((cur) => (cur === id ? null : id));
  }

  function handleEdit(id: number) {
    setOpenMenuId(null);
    router.push(`/create_routine?id=${id}`);
  }

  function handleDelete(id: number) {
    setOpenMenuId(null);
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />

      <View style={styles.container}>
        <View style={styles.inner}>

          <TouchableOpacity
            style={styles.newRoutineButton}
            onPress={() => {
              setShowNewMenu((s) => !s);
            }}
          >
            <MaterialIcons name="note-add" size={20} color={colors.white} />
            <Text style={styles.newRoutineText}>Nova Rotina</Text>
          </TouchableOpacity>

          {showNewMenu && (
            <View style={styles.newMenu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowNewMenu(false);
                  router.push('/create_routine');
                }}
              >
                <FontAwesome name="plus-circle" size={18} color={colors.white} />
                <Text style={styles.menuText}>Criar nova rotina</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowNewMenu(false);
                  setShowRequestModal(true);
                }}
              >
                <Ionicons name="mail" size={18} color={colors.white} />
                <Text style={styles.menuText}>Solicitar nova rotina</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Modal de solicitação de rotina */}
          <Modal visible={showRequestModal} transparent animationType="slide" onRequestClose={() => setShowRequestModal(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowRequestModal(false)}>
              <View style={styles.modalContentCentered}>
                <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Solicitar nova rotina</Text>
                <Text style={{ color: colors.grayText, marginBottom: 12 }}>Escreva sua solicitação ao professor/personal:</Text>
                <TextInput
                  style={styles.requestInput}
                  placeholder="Descreva os objetivos, limitações e preferências..."
                  placeholderTextColor="#9A9A9A"
                  multiline
                  numberOfLines={4}
                  value={requestMessage}
                  onChangeText={setRequestMessage}
                />

                <View style={styles.requestButtonsRow}>
                  <TouchableOpacity
                    style={[styles.requestButton, { backgroundColor: colors.darkRed }]}
                    onPress={() => {
                      // Simular envio: aqui você pode integrar com backend/rota de mensagens
                      console.log('Solicitação enviada:', requestMessage);
                      setRequestMessage('');
                      setShowRequestModal(false);
                    }}
                  >
                    <Text style={[styles.requestButtonText, { color: colors.white }]}>Enviar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.requestButton, { backgroundColor: '#222', marginLeft: 8 }]}
                    onPress={() => {
                      setRequestMessage('');
                      setShowRequestModal(false);
                    }}
                  >
                    <Text style={[styles.requestButtonText, { color: colors.grayText }]}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Modal>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ROTINAS</Text>
            <TouchableOpacity style={styles.filterTouch} onPress={() => { /* TODO: abrir filtro */ }}>
              <Text style={styles.filterText}>Todas</Text>
              <Ionicons name="chevron-down" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          {USER_PROFILE === 'STUDENT' && (
            <>
              <FlatList
                data={routines}
                keyExtractor={(r) => String(r.id)}
                renderItem={({ item }) => (
                  <RoutineCard
                    item={item}
                    onToggleMenu={() => handleToggleMenu(item.id)}
                    onStart={() => router.push(`/workout?id=${item.id}`)}
                  />
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
              />

              <Modal visible={openMenuId !== null} transparent animationType="fade" onRequestClose={() => setOpenMenuId(null)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setOpenMenuId(null)}>
                  <View style={styles.modalContentCentered}>
                    <TouchableOpacity style={styles.modalOptionButton} onPress={() => handleEdit(openMenuId as number)}>
                      <Text style={styles.modalOptionText}>Editar rotina</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.modalOptionButton, { marginTop: 8 }]} onPress={() => handleDelete(openMenuId as number)}>
                      <Text style={[styles.modalOptionText, { color: colors.red }]}>Excluir rotina</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Modal>
            </>
          )}

          {USER_PROFILE === 'TEACHER' && (
            <View>
              {/* TODO: implementar view TEACHER */}
            </View>
          )}
        </View>
      </View>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.red,
    paddingHorizontal: 16,
    paddingTop: 26,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: { width: 42, height: 26 },
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
  pageTitle: { color: colors.white, fontSize: 14, marginBottom: 12, fontWeight: '700' },

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
    marginTop: 8,
    paddingHorizontal: 8,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  menuText: { color: colors.white, marginLeft: 10, fontSize: 14 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { color: colors.white, fontSize: 22, fontFamily: 'Anton', fontWeight: '700' },
  filterTouch: { flexDirection: 'row', alignItems: 'center' },
  filterText: { color: colors.white, marginRight: 6 },

  list: { paddingBottom: 32 },

  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
  },
  cardOptions: { position: 'absolute', right: 8, top: 8, padding: 6 },
  cardTitle: { color: colors.red, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  approvedRow: { flexDirection: 'row', alignItems: 'center' },
  approvedText: { color: colors.grayText, marginLeft: 6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statText: { color: colors.grayText },

  startButton: {
    marginTop: 12,
    backgroundColor: colors.startGray,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  startButtonText: { color: colors.white, fontWeight: '700' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContentCentered: {
    backgroundColor: '#0A0A0A',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderColor: '#111',
    borderWidth: 1,
    alignItems: 'stretch',
    width: '100%',
  },
  modalOptionButton: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalOptionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },

  requestInput: {
    backgroundColor: '#0B0B0B',
    borderColor: '#222',
    borderWidth: 1,
    color: colors.white,
    padding: 12,
    borderRadius: 8,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 12,
  },
  requestButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  requestButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: { fontWeight: '700' },

  bottomNav: {
    backgroundColor: colors.darkNav,
    height: 64,
    paddingVertical: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', width: 72, height: 64 },
  centerNavWrapper: { alignItems: 'center', justifyContent: 'center' },
  centerButton: {
    backgroundColor: 'transparent',
    padding: 6,
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIndicator: { marginTop: 6, width: 28, height: 3, backgroundColor: colors.red, borderRadius: 2 },
});
