import React, { useMemo, useState, useEffect } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, Image, TouchableOpacity,
  FlatList, TextInput, Dimensions, Modal, Pressable, Alert,
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';

const { width } = Dimensions.get('window');

// ─── Sub-componentes ────────────────────────────────────────────────

function Header({ user }: { user: any }) {
  const router = useRouter();
  const avatarUri = user?.foto_perfil ? String(user.foto_perfil) : null;
  const nome = user?.nome || 'Professor';
  const handle = user?.email?.split('@')?.[0] ? `@${user.email.split('@')[0]}` : '@prof';

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
          <Text style={styles.userName}>{nome}</Text>
          <Text style={styles.userHandle}>{handle}</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconTouch} onPress={() => router.push('/notifications')}>
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

// ─── Componente principal ───────────────────────────────────────────

export default function Clients() {
  const [query, setQuery] = useState('');
  const [modalQuery, setModalQuery] = useState(''); // FIX: query separada para o modal
  const [clients, setClients] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [openOptionsClientId, setOpenOptionsClientId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false); // FIX: feedback de loading
  const [addingId, setAddingId] = useState<string | null>(null); // FIX: evita double-tap

  const router = useRouter();

  // FIX: fetchSuggestions e fetchClients dentro do componente
  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await api.get('/professor/descobrir-alunos');
      const formatted = res.data.map((aluno: any) => ({
        id: String(aluno.id),
        name: aluno.nome,
        username: aluno.username,
        subtitle: aluno.objetivo || 'Disponível',
        avatar: aluno.foto_perfil
          ? { uri: aluno.foto_perfil }
          : require('../assets/images/logo.png'),
      }));
      setSuggestions(formatted);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get('/professor/alunos');
      const formatted = res.data.map((aluno: any) => ({
        id: String(aluno.id),
        name: aluno.nome,
        username: aluno.username,
        objective: aluno.objetivo || 'Geral',
        avatar: aluno.foto_perfil || 'https://picsum.photos/200',
      }));
      setClients(formatted);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  };

  // Carrega alunos vinculados ao entrar na tela
  useEffect(() => {
    fetchClients();
  }, []);

  // FIX: busca sugestões toda vez que o modal abre (e limpa query do modal)
  useEffect(() => {
    if (showAddModal) {
      setModalQuery('');
      fetchSuggestions();
    }
  }, [showAddModal]);

  // Dados do usuário logado
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/usuarios/me');
        if (!cancelled) setUser(res.data);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // FIX: clients incluído nas deps para recalcular após adicionar aluno
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q)
    );
  }, [query, clients]);

  // FIX: chama o endpoint correto PUT /professor/vincular-aluno/{id}
  const handleAddAluno = async (item: any) => {
    if (addingId === item.id) return; // evita double-tap
    setAddingId(item.id);
    try {
      await api.put(`/professor/vincular-aluno/${item.id}`);

      // Atualiza lista local imediatamente (sem precisar recarregar)
      setClients((prev) => [
        {
          id: item.id,
          name: item.name,
          username: item.username,
          objective: item.subtitle || 'Geral',
          avatar: item.avatar?.uri || 'https://picsum.photos/200',
        },
        ...prev,
      ]);

      // Remove da lista de sugestões
      setSuggestions((prev) => prev.filter((s) => s.id !== item.id));
    } catch (error) {
      console.error('Erro ao vincular aluno:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o aluno. Tente novamente.');
    } finally {
      setAddingId(null);
    }
  };

  // Desvincular aluno (apenas local por enquanto — adicione endpoint se necessário)
const handleRemoveAluno = async (clientId: string) => {
  console.log('Desvinculando aluno id:', clientId);  // ← log 1
  try {
    const res = await api.put(`/professor/desvincular-aluno/${clientId}`);
    console.log('Resposta da API:', res.data);  // ← log 2
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  } catch (error: any) {
    console.error('Erro ao desvincular:', error?.response?.data);  // ← log 3
    Alert.alert('Erro', 'Não foi possível desvincular o aluno. Tente novamente.');
  } finally {
    setOpenOptionsClientId(null);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header user={user} />

      <View style={styles.container}>
        <View style={styles.inner}>

          {/* Botão abrir modal */}
          <TouchableOpacity
            style={styles.newRoutineButton}
            onPress={() => setShowAddModal(true)}
          >
            <MaterialIcons name="person-add" size={20} color={colors.white} />
            <Text style={styles.newRoutineText}>Adicionar Novo Aluno</Text>
          </TouchableOpacity>

          {/* Modal de busca e adição */}
          <Modal
            visible={showAddModal}
            animationType="slide"
            onRequestClose={() => setShowAddModal(false)}
          >
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.addHeader}>
                <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.backTouch}>
                  <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.addTitle}>Adicionar Aluno</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* FIX: usa modalQuery, separada da query da lista principal */}
              <View style={styles.searchWrapAdd}>
                <Ionicons name="search" size={18} color={colors.grayText} style={{ marginLeft: 12 }} />
                <TextInput
                  placeholder="Buscar por nome ou login..."
                  placeholderTextColor={colors.grayText}
                  value={modalQuery}
                  onChangeText={setModalQuery}
                  style={styles.searchInputAdd}
                />
              </View>

              {loadingSuggestions ? (
                <View style={{ alignItems: 'center', marginTop: 32 }}>
                  <Text style={{ color: colors.grayText }}>Buscando alunos...</Text>
                </View>
              ) : (
                <FlatList
                  data={suggestions.filter((s) => {
                    const q = modalQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      s.name.toLowerCase().includes(q) ||
                      s.username.toLowerCase().includes(q)
                    );
                  })}
                  keyExtractor={(i) => i.id}
                  ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 32 }}>
                      <Text style={{ color: colors.grayText }}>Nenhum aluno disponível.</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <View style={styles.userRow}>
                      <View style={styles.userLeft}>
                        <Image source={item.avatar} style={styles.suggestionAvatar} />
                        <View style={styles.userTexts}>
                          <Text style={styles.suggestionName}>{item.name}</Text>
                          <Text style={styles.userLogin}>@{item.username}</Text>
                          {item.subtitle ? (
                            <Text style={styles.userSubtitle}>{item.subtitle}</Text>
                          ) : null}
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.followButton,
                          addingId === item.id && { opacity: 0.5 }, // feedback visual
                        ]}
                        onPress={() => handleAddAluno(item)}
                        disabled={addingId === item.id}
                      >
                        <Text style={styles.followText}>
                          {addingId === item.id ? 'Adicionando...' : 'Adicionar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </SafeAreaView>
          </Modal>

          {/* Lista de alunos vinculados */}
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
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 32 }}>
                <Text style={{ color: colors.grayText }}>Nenhum aluno vinculado ainda.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <StudentCard
                item={item}
                onView={() => router.push(`/client_details?id=${item.id}`)}
                onOptions={() => setOpenOptionsClientId(item.id)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          />

          {/* Modal de opções do aluno */}
          <Modal
            visible={openOptionsClientId !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setOpenOptionsClientId(null)}
          >
            <Pressable style={styles.modalBackdrop} onPress={() => setOpenOptionsClientId(null)}>
              <View style={styles.modalContentCentered}>
                <TouchableOpacity
                  style={styles.modalOptionButton}
                  onPress={() => handleRemoveAluno(openOptionsClientId!)}
                >
                  <Text style={[styles.modalOptionText, { color: colors.red }]}>
                    Desvincular aluno
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>

        </View>
      </View>

      <StickyFooter active="clients" userProfile="TEACHER" />
    </SafeAreaView>
  );
}

// ─── Styles (idênticos ao original) ────────────────────────────────
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
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarImage: { width: 42, height: 26 },
  userInfo: { flexDirection: 'column' },
  userName: { color: colors.white, fontSize: 16, fontWeight: '700' },
  userHandle: { color: colors.white, fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconTouch: { marginLeft: 14, padding: 6 },
  container: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 16,
    borderTopRightRadius: 16, marginTop: -12, paddingHorizontal: 16, paddingTop: 18,
  },
  pageTitle: { color: colors.white, fontSize: 18, marginBottom: 12, fontWeight: '700' },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg,
    borderRadius: 999, paddingVertical: 8, paddingRight: 12, marginBottom: 12,
  },
  searchInput: { flex: 1, color: colors.white, marginLeft: 8, paddingVertical: 6, paddingHorizontal: 4 },
  searchWrapAdd: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.darkGray,
    marginHorizontal: 16, borderRadius: 999, marginBottom: 12,
  },
  searchInputAdd: { flex: 1, color: colors.white, paddingVertical: 10, paddingHorizontal: 12 },
  userRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
  },
  userLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  suggestionAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#222' },
  userTexts: { marginLeft: 12, flex: 1 },
  suggestionName: { color: colors.white, fontWeight: '700', fontSize: 15 },
  userLogin: { color: colors.grayText, fontSize: 13, marginTop: 4 },
  userSubtitle: { color: colors.grayText, fontSize: 12, marginTop: 2 },
  userRight: { flexDirection: 'row', alignItems: 'center' },
  followButton: {
    backgroundColor: colors.red, paddingHorizontal: 14,
    paddingVertical: 12, borderRadius: 8, alignItems: 'center',
  },
  followText: { color: colors.white, fontWeight: '700' },
  card: { backgroundColor: colors.cardBg, borderRadius: 12, padding: 12, marginBottom: 12 },
  cardOptions: { position: 'absolute', right: 8, top: 8, padding: 6, zIndex: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 64, height: 64, borderRadius: 32, marginRight: 12 },
  clientInfo: { flex: 1 },
  clientName: { color: colors.red, fontSize: 16, fontWeight: '700' },
  clientUsername: { color: colors.grayText, marginTop: 4 },
  viewButtonGray: {
    marginTop: 12, backgroundColor: colors.startGray,
    borderRadius: 8, paddingVertical: 10, alignItems: 'center',
  },
  viewButtonText: { color: colors.white, fontWeight: '700' },
  newRoutineButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.darkRed, paddingVertical: 12, borderRadius: 12, marginBottom: 12,
  },
  newRoutineText: { color: colors.white, marginLeft: 8, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContentCentered: {
    backgroundColor: '#0A0A0A', padding: 20, borderTopLeftRadius: 12,
    borderTopRightRadius: 12, borderColor: '#111', borderWidth: 1,
    alignItems: 'stretch', width: '100%',
  },
  modalOptionButton: {
    backgroundColor: '#111', paddingVertical: 12,
    paddingHorizontal: 14, borderRadius: 8, width: '100%', alignItems: 'center',
  },
  modalOptionText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  backTouch: { width: 40 },
  addHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 36, paddingBottom: 12,
  },
  addTitle: { flex: 1, color: colors.white, fontSize: 18, fontWeight: '700', textAlign: 'left' },
});