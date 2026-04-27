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
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
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
  const [professorNome, setProfessorNome] = useState<string | null>(null);

  const [trainingsCount, setTrainingsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [res, historyRes, alunoRes] = await Promise.all([
          api.get('/usuarios/me'),
          api.get('/alunos/historico-treinos').catch(() => ({ data: [] })),
          api.get('/alunos/me').catch(() => ({ data: null }))
        ]);

        if (cancelled) return;
        
        const { nome: n, tipo_perfil, email, foto_perfil, seguidores_count, seguindo_count, treinos_count } = res.data;
        
        setNome(n);
        setUserProfile(tipo_perfil === 'TEACHER' ? 'TEACHER' : 'STUDENT');
        setHandle(`@${buildHandle(n || email?.split('@')[0] || 'usuario')}`);
        setAvatarUri(foto_perfil ? String(foto_perfil) : null);
        setTrainingsCount(treinos_count || 0);
        setFollowersCount(seguidores_count || 0);
        setFollowingCount(seguindo_count || 0);
        setWorkoutHistory(historyRes.data);

        // MUDANÇA: Captura o nome dinâmico vindo diretamente do objeto do aluno
        if (alunoRes.data?.professor_nome) {
          setProfessorNome(alunoRes.data.professor_nome);
        }

      } catch (e) {
        if (!cancelled) setError('Erro ao carregar perfil.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.replace('/welcome'); 
    } catch (e) {
      console.error("Erro ao deslogar:", e);
    }
  };

  const isTeacher = userProfile === 'TEACHER';

  const workoutMap = useMemo(() => {
    const m: Record<string, { date: string; title: string }> = {};
    workoutHistory.forEach((w) => {
      if (w.data_fim) {
        const dateKey = new Date(w.data_fim).toISOString().split('T')[0];
        m[dateKey] = { date: dateKey, title: w.titulo };
      }
    });
    return m;
  }, [workoutHistory]);

  function renderDay({ date }: any) {
    const dateString: string = date.dateString;
    const workout = workoutMap[dateString];
    return (
      <View style={styles.dayWrapper}>
        {workout ? (
          <View style={styles.dayCircle}><Text style={styles.dayNumber}>{String(date.day)}</Text></View>
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
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.red} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Perfil" />

      <View style={styles.settingsWrap}>
        <TouchableOpacity onPress={() => router.push('/edit_profile')} style={styles.iconTouch}>
          <Ionicons name="settings-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* CARD DE PERFIL: Alinhamento vertical recalibrado para centralização total */}
        <View style={[styles.profileCard, isTeacher && styles.profileCardTeacher]}>
          <View style={styles.avatarContainer}>
            <Image source={avatarUri ? { uri: avatarUri } : defaultAvatar} style={styles.avatarLarge} />
          </View>
          <View style={styles.statsWrap}>
            <Text style={styles.profileName}>{nome || '—'}</Text>
            <Text style={styles.profileHandle}>{handle}</Text>
            
            {!isTeacher && (
              <View style={styles.coachChip}>
                <MaterialIcons 
                  name="verified-user" 
                  size={10} 
                  color={professorNome ? colors.red : '#333'} 
                />
                <Text style={[styles.coachText, { color: professorNome ? '#AAA' : '#333' }]}>
                  {/* Agora exibe o nome vindo do banco ou status pendente */}
                  {professorNome ? `Treinado por ${professorNome}` : 'Sem professor vinculado'}
                </Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{isTeacher ? '—' : trainingsCount}</Text>
                <Text style={styles.statLabel}>{isTeacher ? 'Certificado' : 'Treinos'}</Text>
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
          </View>
        </View>

        {!isTeacher && (
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
        )}

        <View style={styles.actions}>
          {!isTeacher && (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/calendar')}>
                <View style={styles.actionLeft}>
                  <FontAwesome name="calendar" size={18} color={colors.white} style={{ marginRight: 12 }} />
                  <Text style={styles.actionText}>Calendário</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]} onPress={() => router.push('/previous_workouts')}>
                <View style={styles.actionLeft}>
                  <MaterialIcons name="fitness-center" size={18} color={colors.white} style={{ marginRight: 12 }} />
                  <Text style={styles.actionText}>Histórico</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]} onPress={() => router.push('/measures')}>
                <View style={styles.actionLeft}>
                  <MaterialIcons name="monitor-weight" size={18} color={colors.white} style={{ marginRight: 12 }} />
                  <Text style={styles.actionText}>Medições</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]} onPress={() => router.push('/metrics')}>
                <View style={styles.actionLeft}>
                  <MaterialIcons name="insights" size={18} color={colors.white} style={{ marginRight: 12 }} />
                  <Text style={styles.actionText}>Métricas</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]} onPress={handleLogout}>
            <View style={styles.actionLeft}>
              <Ionicons name="log-out-outline" size={18} color={colors.red} style={{ marginRight: 12 }} />
              <Text style={[styles.actionText, { color: colors.red }]}>Sair da Conta</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <StickyFooter active="profile" userProfile={userProfile} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  settingsWrap: { position: 'absolute', right: 16, top: 64, zIndex: 20 },
  iconTouch: { marginLeft: 12 },
  container: { flex: 1 },
  // AJUSTE: Padding simétrico para equilibrar o peso visual
  profileCard: { 
    backgroundColor: colors.background, 
    paddingTop: 30, 
    paddingBottom: 30, 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  profileCardTeacher: { paddingTop: 20, paddingBottom: 20 },
  avatarContainer: { justifyContent: 'center', alignItems: 'center' },
  // AJUSTE: Otimização de centralização vertical (compensando o bloco de estatísticas)
  avatarLarge: { 
    width: 96, 
    height: 96, 
    borderRadius: 48, 
    backgroundColor: '#222',
    transform: [{ translateY: -15 }] // Eleva o avatar para alinhar com o centro visual do texto
  },
  statsWrap: { marginLeft: 20, flex: 1, flexDirection: 'column', justifyContent: 'center' },
  profileName: { color: colors.white, fontSize: 18, fontWeight: '800', marginBottom: 1 },
  profileHandle: { color: colors.grayText, fontSize: 13, marginBottom: 4 },
  coachChip: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  coachText: { fontSize: 10, fontWeight: '700', marginLeft: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 2 },
  statCol: { alignItems: 'center', flex: 1 },
  statNumber: { color: colors.white, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.grayText, fontSize: 10, marginTop: 4, textTransform: 'uppercase' },
  calendarWrap: { paddingHorizontal: 12, paddingTop: 18 },
  dayWrapper: { alignItems: 'center', width: 40 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { color: colors.white, fontSize: 14 },
  dayLabel: { color: colors.lightGray, fontSize: 10, marginTop: 4, textAlign: 'center' },
  actions: { paddingHorizontal: 16, paddingTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', padding: 16, borderRadius: 14, justifyContent: 'space-between', borderWidth: 1, borderColor: '#111' },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});