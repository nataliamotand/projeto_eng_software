import React, { useMemo, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../src/components/ui/Header';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';

const { width } = Dimensions.get('window');

LocaleConfig.locales['pt'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt';

const defaultAvatar = require('../assets/images/logo.png');

function buildHandle(nome: string): string {
  return nome.toLowerCase().replace(/\s/g, '');
}

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [nome, setNome] = useState('');
  const [handle, setHandle] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // ESTADOS DINÂMICOS VINDOS DO BACK-END
  const [trainingsCount, setTrainingsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [res, historyRes] = await Promise.all([
          api.get('/usuarios/me'),
          api.get('/alunos/historico-treinos')
        ]);

        if (cancelled) return;

        const {
          nome: n,
          tipo_perfil,
          email,
          foto_perfil,
          seguidores_count,
          seguindo_count,
          treinos_count // Novo campo linkado
        } = res.data;

        setNome(n);
        setUserProfile(tipo_perfil === 'TEACHER' ? 'TEACHER' : 'STUDENT');
        setHandle(`@${buildHandle(n || email?.split('@')[0] || 'usuario')}`);
        setAvatarUri(foto_perfil ? String(foto_perfil) : null);

        // ATRIBUIÇÃO DINÂMICA COMPLETA
        setTrainingsCount(treinos_count || 0);
        setFollowersCount(seguidores_count || 0);
        setFollowingCount(seguindo_count || 0);
        setWorkoutHistory(historyRes.data);

      } catch (e) {
        if (!cancelled) setError('Não foi possível sincronizar os dados do perfil.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Lógica de Logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.replace('/welcome');
    } catch (e) {
      console.error("Erro ao deslogar:", e);
    }
  };

  const isTeacher = userProfile === 'TEACHER';

  // Memoização do calendário para performance (mapeia treinos reais)
  const workoutMap = useMemo(() => {
    const m: Record<string, { date: string; title: string }> = {};
    workoutHistory.forEach((w) => {
      const dateKey = new Date(w.data_fim).toISOString().split('T')[0];
      m[dateKey] = { date: dateKey, title: w.titulo };
    });
    return m;
  }, [workoutHistory]);

  // Renderização customizada dos dias no calendário
  function renderDay({ date }: any) {
    const dateString: string = date.dateString;
    const workout = workoutMap[dateString];

    return (
      <View style={styles.dayWrapper}>
        {workout ? (
          <View style={styles.dayCircle}>
            <Text style={styles.dayNumber}>{String(date.day)}</Text>
          </View>
        ) : (
          <Text style={[styles.dayNumber, { color: colors.white }]}>{String(date.day)}</Text>
        )}
        {workout && <Text style={styles.dayLabel} numberOfLines={1}>{workout.title}</Text>}
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Perfil" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.red} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Perfil"
        right={
          <TouchableOpacity onPress={() => { router.push('/edit_profile'); }}>
            <Ionicons name="settings-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 200, flexGrow: 1 }}>
        <View style={[styles.profileCard, isTeacher && styles.profileCardTeacher]}>
          <Image source={avatarUri ? { uri: avatarUri } : defaultAvatar} style={styles.avatarLarge} />
          <View style={styles.statsWrap}>
            <Text style={styles.profileName}>{nome || '—'}</Text>
            <Text style={styles.profileHandle}>{handle}</Text>
            {!isTeacher && (
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statNumber}>{trainingsCount}</Text>
                  <Text style={styles.statLabel}>Treinamentos</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statNumber}>{followersCount}</Text>
                  <Text style={styles.statLabel}>Seguidores</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statNumber}>{followingCount}</Text>
                  <Text style={styles.statLabel}>Seguindo</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {!isTeacher && (
          <>
            <View style={styles.calendarWrap}>
              <Calendar
                theme={{
                  backgroundColor: 'transparent',
                  calendarBackground: 'transparent',
                  textSectionTitleColor: colors.white,
                  dayTextColor: colors.white,
                  arrowColor: colors.red,
                  monthTextColor: colors.white,
                  todayTextColor: colors.white,
                }}
                dayComponent={renderDay}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => { router.push('/calendar'); }}>
                <View style={styles.actionLeft}>
                  <FontAwesome name="calendar" size={18} color={colors.white} style={{ marginRight: 12 }} />
                  <Text style={styles.actionText}>Calendário</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]} onPress={() => { router.push('/previous_workouts'); }}>
                <View style={styles.actionLeft}>
                  <MaterialIcons name="fitness-center" size={18} color={colors.white} style={{ marginRight: 12 }} />
                  <Text style={styles.actionText}>Treinos</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]} onPress={() => { router.push('/measures'); }}>
                <View style={styles.actionLeft}>
                  <MaterialIcons name="monitor-weight" size={18} color={colors.white} style={{ marginRight: 12 }} />
                  <Text style={styles.actionText}>Medições</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]} onPress={() => { router.push('/metrics'); }}>
                <View style={styles.actionLeft}>
                  <MaterialIcons name="insights" size={18} color={colors.white} style={{ marginRight: 12 }} />
                  <Text style={styles.actionText}>Métricas</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]} onPress={handleLogout}>
                <View style={styles.actionLeft}>
                  <Ionicons name="log-out-outline" size={18} color={colors.red} style={{ marginRight: 12 }} />
                  <Text style={[styles.actionText, { color: colors.red }]}>Sair da Conta</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <StickyFooter active="profile" userProfile={userProfile} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconTouch: { marginLeft: 12 },
  container: { flex: 1 },
  profileCard: { backgroundColor: colors.background, paddingTop: 48, paddingHorizontal: 16, paddingBottom: 18, flexDirection: 'row', alignItems: 'center' },
  profileCardTeacher: { paddingTop: 28, paddingBottom: 28 },
  avatarLarge: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#222' },
  statsWrap: { marginLeft: 16, flex: 1, flexDirection: 'column', alignItems: 'flex-start' },
  profileName: { color: colors.white, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  profileHandle: { color: colors.grayText, fontSize: 13, marginBottom: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  statCol: { alignItems: 'center', flex: 1 },
  statNumber: { color: colors.white, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.grayText, fontSize: 12, marginTop: 4 },
  calendarWrap: { paddingHorizontal: 12, paddingTop: 18 },
  dayWrapper: { alignItems: 'center', width: 40 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { color: colors.white, fontSize: 14 },
  dayLabel: { color: colors.lightGray, fontSize: 10, marginTop: 4, textAlign: 'center' },
  actions: { paddingHorizontal: 16, paddingTop: 32 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.darkGray, padding: 14, borderRadius: 12, justifyContent: 'space-between' },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});