import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
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
        <TouchableOpacity style={styles.iconTouch} onPress={() => { /* TODO: notificações */ }}>
          <Ionicons name="notifications-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RoutineCard({ item }: { item: any }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardOptions} onPress={() => { /* TODO: opções da rotina */ }}>
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

      <TouchableOpacity style={styles.startButton} onPress={() => { /* TODO: iniciar rotina */ }}>
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

      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
        <FontAwesome name="user" size={24} color={colors.grayText} />
      </TouchableOpacity>
    </View>
  );
}

export default function RoutinesAndWorkouts(): JSX.Element {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const router = useRouter();

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
                  // TODO: Abrir fluxo de solicitação de rotina
                }}
              >
                <Ionicons name="mail" size={18} color={colors.white} />
                <Text style={styles.menuText}>Solicitar nova rotina</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ROTINAS</Text>
            <TouchableOpacity style={styles.filterTouch} onPress={() => { /* TODO: abrir filtro */ }}>
              <Text style={styles.filterText}>Todas</Text>
              <Ionicons name="chevron-down" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          {USER_PROFILE === 'STUDENT' && (
            <FlatList
              data={mockedRoutines}
              keyExtractor={(r) => String(r.id)}
              renderItem={({ item }) => <RoutineCard item={item} />}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
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
    backgroundColor: colors.red,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  startButtonText: { color: colors.white, fontWeight: '700' },

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
