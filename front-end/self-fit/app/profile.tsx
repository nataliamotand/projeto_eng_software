import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
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
  const [objetivo, setObjetivo] = useState<string | null>(null);

  // Stats de aluno
  const [trainingsCount, setTrainingsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);

  // Stats de professor
  const [cref, setCref] = useState<string | null>(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [worksheetsCount, setWorksheetsCount] = useState(0);
  const [especialidade, setEspecialidade] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [meRes, historyRes, alunoRes] = await Promise.all([
          api.get('/usuarios/me'),
          api.get('/alunos/historico-treinos').catch(() => ({ data: [] })),
          api.get('/alunos/me').catch(() => ({ data: null }))
        ]);

        if (cancelled) return;

        const {
          nome: n,
          tipo_perfil,
          email,
          foto_perfil,
          seguidores_count,
          seguindo_count,
          treinos_count
        } = meRes.data;

        // CORREÇÃO DO MERGE: Restaurando definição de perfil
        const perfil = tipo_perfil === 'TEACHER' ? 'TEACHER' : 'STUDENT';
        setUserProfile(perfil); 
        setNome(n);
        setHandle(`@${buildHandle(n || email?.split('@')[0] || 'usuario')}`);
        setAvatarUri(foto_perfil ? String(foto_perfil) : null);

        if (perfil === 'STUDENT') {
          setTrainingsCount(treinos_count || 0);
          setFollowersCount(seguidores_count || 0);
          setFollowingCount(seguindo_count || 0);
          setWorkoutHistory(historyRes.data);
          
          // Mantendo funcionalidade do nome do professor
          if (alunoRes?.data?.professor_nome) {
            setProfessorNome(alunoRes.data.professor_nome);
          }
          setObjetivo(alunoRes.data?.objetivo || null);
        } else {
          const [profRes, alunosRes, fichasRes] = await Promise.all([
            api.get('/professores/me').catch(() => ({ data: {} })),
            api.get('/professor/alunos').catch(() => ({ data: [] })),
            api.get('/professor/fichas/quantidade').catch(() => ({ data: { quantidade: 0 } })),
          ]);

          if (!cancelled) {
            setCref(profRes.data?.cref || null);
            setStudentsCount(Array.isArray(alunosRes.data) ? alunosRes.data.length : 0);
            setWorksheetsCount(fichasRes.data?.quantidade || 0);
            setEspecialidade(profRes.data?.especialidade || null);
          }
        }
      } catch (e) {
        if (!cancelled) setError('Erro ao carregar perfil.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []));

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.replace('/welcome');
    } catch (e) {
      console.error('Erro ao deslogar:', e);
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
          <View style={styles.dayCircle}>
            <Text style={styles.dayNumber}>{String(date.day)}</Text>
          </View>
        ) : (
          <Text style={[styles.dayNumber, { color: colors.white }]}>{String(date.day)}</Text>
        )}
        {workout && (
          <Text style={styles.dayLabel} numberOfLines={1}>{workout.title}</Text>
        )}
      </View>
    );
  }

  const stats = isTeacher
    ? [
        { value: cref || '—', label: 'Certificado' },
        { value: String(studentsCount), label: 'Alunos' },
        { value: String(worksheetsCount), label: 'Fichas' },
      ]
    : [
        { value: String(trainingsCount), label: 'Treinos' },
        { value: String(followersCount), label: 'Seguidores' },
        { value: String(followingCount), label: 'Seguindo' },
      ];

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
        <View style={[styles.profileCard, isTeacher && styles.profileCardTeacher]}>
          <Image source={avatarUri ? { uri: avatarUri } : defaultAvatar} style={styles.avatarLarge} />
          <View style={styles.statsWrap}>
            <Text style={styles.profileName}>{nome || '—'}</Text>
            <Text style={styles.profileHandle}>{handle}</Text>

            {!isTeacher && (
              <View style={styles.coachChip}>
                <MaterialIcons name="verified-user" size={10} color={professorNome ? colors.red : '#333'} />
                <Text style={[styles.coachText, { color: professorNome ? '#AAA' : '#333' }]}>
                  {professorNome ? `Acompanhamento Ativo: Prof. ${professorNome}` : 'Sem professor vinculado'}
                </Text>
              </View>
            )}

            {!isTeacher && (
              <View style={styles.objetivoTag}>
                <Text style={styles.objetivoTagText}>{objetivo || 'Sem objetivo definido'}</Text>
              </View>
            )}

            {isTeacher && (
              <View style={styles.objetivoTag}>
                <Text style={styles.objetivoTagText}>{especialidade || 'Sem especialidade'}</Text>
              </View>
            )}

            <View style={styles.statsRow}>
              {stats.map((s, i) => (
                <View key={i} style={styles.statCol}>
                  <Text style={styles.statNumber} numberOfLines={1} adjustsFontSizeToFit>
                    {s.value}
                  </Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
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
  safeArea:           { flex: 1, backgroundColor: colors.background },
  centered:           { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  settingsWrap:       { position: 'absolute', right: 16, top: 64, zIndex: 20 },
  iconTouch:          { marginLeft: 12 },
  container:          { flex: 1 },
  profileCard:        { backgroundColor: colors.background, paddingVertical: 35, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  profileCardTeacher: { paddingVertical: 25 },
  avatarLarge:        { width: 96, height: 96, borderRadius: 48, backgroundColor: '#222', transform: [{ translateY: -15 }] },
  statsWrap:          { marginLeft: 16, flex: 1, flexDirection: 'column', alignItems: 'flex-start' },
  profileName:        { color: colors.white, fontSize: 18, fontWeight: '800', marginBottom: 2 },
  profileHandle:      { color: colors.grayText, fontSize: 13, marginBottom: 4 },
  coachChip:          { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  coachText:          { fontSize: 10, fontWeight: '700', marginLeft: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  objetivoTag:        { backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginBottom: 8, alignSelf: 'flex-start' },
  objetivoTagText:    { color: colors.red, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  statsRow:           { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 2 },
  statCol:            { alignItems: 'center', flex: 1 },
  statNumber:         { color: colors.white, fontSize: 18, fontWeight: '700' },
  statNumberCref:     { fontSize: 13, fontWeight: '700' },
  statLabel:          { color: colors.grayText, fontSize: 10, marginTop: 4, textTransform: 'uppercase' },
  calendarWrap:       { paddingHorizontal: 12, paddingTop: 18 },
  dayWrapper:         { alignItems: 'center', width: 40 },
  dayCircle:          { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  dayNumber:          { color: colors.white, fontSize: 14 },
  dayLabel:           { color: colors.lightGray, fontSize: 10, marginTop: 4, textAlign: 'center' },
  actions:            { paddingHorizontal: 16, paddingTop: 12 },
  actionButton:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', padding: 16, borderRadius: 14, justifyContent: 'space-between', borderWidth: 1, borderColor: '#111' },
  actionLeft:         { flexDirection: 'row', alignItems: 'center' },
  actionText:         { color: colors.white, fontSize: 15, fontWeight: '700' },
});