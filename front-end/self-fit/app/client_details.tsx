import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

const colors = {
  background: '#000000',
  red: '#CC0000',
  darkRed: '#B30000',
  darkGray: '#1A1A1A',
  cardBg: '#121212',
  white: '#FFFFFF',
  grayText: '#CFCFCF',
  lightGray: '#9A9A9A',
};

// MOCKED DATA
const clientData = {
  id: 1,
  name: 'Gabrielli Valelia',
  username: 'valeliagabi',
  objective: 'Hipertrofia',
  age: 24,
  avatar: 'https://picsum.photos/seed/gabrielli/400/400',
};

export default function ClientDetails(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams ? useLocalSearchParams() : {};
  const studentId = (params as any).id ?? clientData.id;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { router.back(); }} style={styles.headerIconLeft}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Detalhes do Aluno</Text>

        <TouchableOpacity onPress={() => { /* TODO: abrir menu de ações */ }} style={styles.headerIconRight}>
          <MaterialIcons name="more-vert" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Image source={{ uri: clientData.avatar }} style={styles.avatarLarge} />

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{clientData.name}</Text>
            <Text style={styles.profileHandle}>@{clientData.username}</Text>
            <Text style={styles.profileMeta}>{clientData.age} anos</Text>

            <View style={styles.objectiveTag}>
              <Text style={styles.objectiveText}>Objetivo: {clientData.objective}</Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => { router.push(`/create_routine?id=${studentId}`); }}
          >
            <FontAwesome name="file" size={18} color={colors.white} />
            <Text style={styles.primaryButtonText}>Criar Rotina para {clientData.name}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionGrid}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => { router.push(`/previous_workouts?studentId=${studentId}`); }}>
            <View style={styles.secondaryLeft}><MaterialIcons name="calendar-today" size={20} color={colors.white} /></View>
            <Text style={styles.secondaryText}>Visualizar treinos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => { router.push(`/measures?id=${studentId}`); }}>
            <View style={styles.secondaryLeft}><MaterialIcons name="monitor-weight" size={20} color={colors.white} /></View>
            <Text style={styles.secondaryText}>Visualizar medições</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => { router.push(`/metrics?studentId=${studentId}`); }}>
            <View style={styles.secondaryLeft}><MaterialIcons name="insights" size={20} color={colors.white} /></View>
            <Text style={styles.secondaryText}>Visualizar métricas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => { router.push('/notifications'); }}>
            <View style={styles.secondaryLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.white} />
              <View style={styles.pendingDot} />
            </View>
            <Text style={styles.secondaryText}>Rotinas pendentes de aprovação</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerIconLeft: { width: 40 },
  headerIconRight: { width: 40, alignItems: 'flex-end' },
  headerTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },

  contentContainer: { paddingBottom: 140 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: colors.background,
  },
  avatarLarge: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#222' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { color: colors.white, fontSize: 20, fontWeight: '800' },
  profileHandle: { color: colors.grayText, marginTop: 6 },
  profileMeta: { color: colors.grayText, marginTop: 6 },
  objectiveTag: { marginTop: 10, backgroundColor: '#0B0B0B', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  objectiveText: { color: colors.white, fontWeight: '600' },

  ctaWrap: { paddingHorizontal: 16, marginTop: 12 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  primaryButtonText: { color: colors.white, fontWeight: '700', marginLeft: 10 },

  sectionGrid: { paddingHorizontal: 16, marginTop: 16, gap: 12 },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  secondaryLeft: { width: 36, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.white, marginLeft: 12, fontWeight: '700' },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red, position: 'absolute', right: -2, top: -2 },
});
