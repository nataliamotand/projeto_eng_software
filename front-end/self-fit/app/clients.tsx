import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';

const { width } = Dimensions.get('window');

const mockedClients = [
  {
    id: 'c1',
    name: 'João Silva',
    username: 'joaosilva',
    objective: 'Hipertrofia',
    avatar: 'https://picsum.photos/seed/joao/200/200',
  },
  {
    id: 'c2',
    name: 'Mariana Costa',
    username: 'marianac',
    objective: 'Perda de peso',
    avatar: 'https://picsum.photos/seed/mariana/200/200',
  },
  {
    id: 'c3',
    name: 'Lucas Pereira',
    username: 'lucasp',
    objective: 'Condicionamento/Cardio',
    avatar: 'https://picsum.photos/seed/lucas/200/200',
  },
];

function Header() {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headerDetail} pointerEvents="none" />

      <View style={styles.headerLeft}>
        <View style={styles.avatar}>
          <Image source={require('../assets/images/logo.png')} style={styles.avatarImage} resizeMode="contain" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Professor João</Text>
          <Text style={styles.userHandle}>@profjoao</Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconTouch} onPress={() => { router.push('/notifications'); }}>
          <Ionicons name="notifications-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StudentCard({ item, onView, onOptions }: { item: any; onView: () => void; onOptions: () => void }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardOptions} onPress={onOptions}>
        <MaterialIcons name="more-vert" size={20} color={colors.grayText} />
      </TouchableOpacity>

      <View style={styles.cardTop}>
        <Image source={{ uri: item.avatar }} style={styles.clientAvatar} />

        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.clientUsername}>@{item.username}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewButtonGray} onPress={onView}>
        <Text style={styles.viewButtonText}>Visualizar Aluno</Text>
      </TouchableOpacity>
    </View>
  );
}

function BottomNav() {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
        <FontAwesome name="home" size={22} color={colors.grayText} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/routines_and_workouts')}>
        <MaterialIcons name="fitness-center" size={24} color={colors.grayText} />
      </TouchableOpacity>

      <View style={styles.centerNavWrapper}>
        <TouchableOpacity style={styles.centerButton} onPress={() => { /* já estamos aqui */ }}>
          <MaterialCommunityIcons name="account-group" size={22} color={colors.red} />
        </TouchableOpacity>
        <View style={styles.centerIndicator} />
      </View>

      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
        <FontAwesome name="user" size={22} color={colors.grayText} />
      </TouchableOpacity>
    </View>
  );
}

export default function Clients(): JSX.Element {
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState(mockedClients);
  const [openOptionsClientId, setOpenOptionsClientId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [suggestions, setSuggestions] = useState([
    { id: 's1', name: 'Mariana Silva', username: 'maris', subtitle: '3 em comum', avatar: require('../assets/images/logo.png') },
    { id: 's2', name: 'Carlos Pereira', username: 'carlosp', subtitle: 'Sugestões para você', avatar: require('../assets/images/react-logo.png') },
    { id: 's3', name: 'Ana Souza', username: 'anas', subtitle: '2 em comum', avatar: require('../assets/images/logo_google.png') },
    { id: 's4', name: 'Pedro Gomes', username: 'pedrog', subtitle: '1 em comum', avatar: require('../assets/images/icon.png') },
  ] as Array<any>);
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q));
  }, [query]);

  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />

      <View style={styles.container}>
        <View style={styles.inner}>

          <TouchableOpacity style={styles.newRoutineButton} onPress={() => { setShowAddModal(true); }}>
            <MaterialIcons name="person-add" size={20} color={colors.white} />
            <Text style={styles.newRoutineText}>Adicionar Novo Aluno</Text>
          </TouchableOpacity>
          <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.addHeader}>
                <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.backTouch}>
                  <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.addTitle}>Adicionar Aluno</Text>
                <View style={{ width: 40 }} />
              </View>

              <View style={styles.searchWrapAdd}>
                <Ionicons name="search" size={18} color={colors.grayText} style={{ marginLeft: 12 }} />
                <TextInput
                  placeholder="Buscar"
                  placeholderTextColor={colors.grayText}
                  value={query}
                  onChangeText={setQuery}
                  style={styles.searchInputAdd}
                />
              </View>

              <FlatList
                data={suggestions.filter((s) => {
                  const q = query.trim().toLowerCase();
                  if (!q) return true;
                  return s.name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q);
                })}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                  <View style={styles.userRow}>
                    <View style={styles.userLeft}>
                      <Image source={item.avatar} style={styles.avatar} />
                      <View style={styles.userTexts}>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.userLogin}>@{item.username}</Text>
                      </View>
                    </View>

                    <View style={styles.userRight}>
                      <TouchableOpacity
                        style={styles.followButton}
                        onPress={() => {
                          // add to clients and remove from suggestions
                          setClients((prev) => [{ id: `c${Date.now()}`, name: item.name, username: item.username, objective: 'Geral', avatar: item.avatar }, ...prev]);
                          setSuggestions((prev) => prev.filter((s) => s.id !== item.id));
                        }}
                      >
                        <Text style={styles.followText}>Adicionar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              />
            </SafeAreaView>
          </Modal>

          <Text style={styles.pageTitle}>MEUS ALUNOS</Text>

          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color={colors.placeholder} style={{ marginLeft: 10 }} />
            <TextInput
              placeholder="Buscar aluno por nome ou login..."
              placeholderTextColor={colors.placeholder}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StudentCard
                item={item}
                onView={() => {
                  // navegar para detalhes do aluno
                  router.push(`/client_details?id=${item.id}`);
                }}
                onOptions={() => setOpenOptionsClientId(item.id)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          />

          <Modal visible={openOptionsClientId !== null} transparent animationType="fade" onRequestClose={() => setOpenOptionsClientId(null)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setOpenOptionsClientId(null)}>
              <View style={styles.modalContentCentered}>
                <TouchableOpacity style={styles.modalOptionButton} onPress={() => {
                  // Desvincular: remover do estado (simulado)
                  setClients((prev) => prev.filter((c) => c.id !== openOptionsClientId));
                  setOpenOptionsClientId(null);
                }}>
                  <Text style={[styles.modalOptionText, { color: colors.red }]}>Desvincular aluno</Text>
                </TouchableOpacity>

                {/* Cancel removed per request; backdrop closes the modal */}
              </View>
            </Pressable>
          </Modal>
        </View>
      </View>

      <StickyFooter active="clients" />
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
    backgroundColor: '#E54F4F',
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
  pageTitle: { color: colors.white, fontSize: 18, marginBottom: 12, fontWeight: '700' },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 999,
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  /* Styles copied from add_friends for modal add list */
  searchWrapAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    marginHorizontal: 16,
    borderRadius: 999,
    marginBottom: 12,
  },
  searchInputAdd: {
    flex: 1,
    color: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
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
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  userSubtitle: { color: colors.grayText, fontSize: 12 },
  miniAvatars: { width: 40, height: 20, marginLeft: 8, position: 'relative' },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, position: 'absolute', borderWidth: 2, borderColor: colors.background },
  userRight: { flexDirection: 'row', alignItems: 'center' },
  followButton: { backgroundColor: colors.red, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  followText: { color: colors.white, fontWeight: '700' },
  closeTouch: { marginLeft: 10, padding: 6 },

  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardOptions: { position: 'absolute', right: 8, top: 8, padding: 6, zIndex: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 64, height: 64, borderRadius: 32, marginRight: 12 },
  clientInfo: { flex: 1 },
  clientName: { color: colors.red, fontSize: 16, fontWeight: '700' },
  clientUsername: { color: colors.grayText, marginTop: 4 },
  clientObjective: { color: '#BDBDBD', marginTop: 6 },
  viewButton: {
    marginTop: 12,
    backgroundColor: colors.red,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewButtonGray: {
    marginTop: 12,
    backgroundColor: colors.startGray,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewButtonText: { color: colors.white, fontWeight: '700' },

  newRoutineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkRed,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  newRoutineText: { color: colors.white, marginLeft: 8, fontWeight: '700' },

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
  backTouch: { width: 40 },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 12,
  },
  addTitle: { flex: 1, color: colors.white, fontSize: 18, fontWeight: '700', textAlign: 'left' },
  addBody: { paddingHorizontal: 16, paddingTop: 18 },
  input: {
    backgroundColor: colors.cardBg,
    color: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  followButton: { backgroundColor: colors.red, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  followText: { color: colors.white, fontWeight: '700' },
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
});
