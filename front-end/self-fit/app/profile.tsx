import React, { useMemo } from 'react';
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
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const colors = {
  background: '#000000',
  red: '#CC0000',
  darkRed: '#B30000',
  darkGray: '#1A1A1A',
  cardBg: '#121212',
  white: '#FFFFFF',
  grayText: '#CFCFCF',
  lightGray: '#9B9B9B',
};

// MOCKED DATA
const USER = {
  name: 'Gabrielli Valelia',
  username: 'valeliagabi',
  avatar: require('../assets/images/logo.png'),
  trainings: 42,
  followers: 1240,
  following: 186,
};

// generate a few workout days in current month
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');

const workoutDays = [
  { date: `${year}-${month}-03`, title: 'Costas e' },
  { date: `${year}-${month}-06`, title: 'Perna e' },
  { date: `${year}-${month}-10`, title: 'Peito' },
  { date: `${year}-${month}-15`, title: 'Cardio' },
  { date: `${year}-${month}-22`, title: 'Core' },
];

// Configure calendar locale to Portuguese
LocaleConfig.locales['pt'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt';

export default function Profile(): JSX.Element {
  const router = useRouter();

  const workoutMap = useMemo(() => {
    const m: Record<string, { date: string; title: string }> = {};
    workoutDays.forEach((w) => (m[w.date] = w));
    return m;
  }, []);

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

        {workout && <Text style={styles.dayLabel}>{workout.title}</Text>}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.settingsWrap}>
        <TouchableOpacity onPress={() => { /* TODO: open settings */ }} style={styles.iconTouch}>
          <Ionicons name="settings-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
      

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.profileCard}>
          <Image source={USER.avatar} style={styles.avatarLarge} />
          <View style={styles.statsWrap}>
            <Text style={styles.profileName}>{USER.name}</Text>
            <Text style={styles.profileHandle}>@{USER.username}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{USER.trainings}</Text>
                <Text style={styles.statLabel}>Treinamentos</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{USER.followers}</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{USER.following}</Text>
                <Text style={styles.statLabel}>Seguindo</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.calendarWrap}>
          <Calendar
            // use transparent background so underlying card shows
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

          <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]} onPress={() => { router.push('/routines_and_workouts'); }}>
            <View style={styles.actionLeft}>
              <MaterialIcons name="fitness-center" size={18} color={colors.white} style={{ marginRight: 12 }} />
              <Text style={styles.actionText}>Treinos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => { router.push('/home'); }}>
          <FontAwesome name="home" size={24} color={colors.grayText} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => { router.push('/routines_and_workouts'); }}>
          <MaterialIcons name="fitness-center" size={26} color={colors.grayText} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => { /* already on profile */ }}>
          <FontAwesome name="user" size={24} color={colors.red} />
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.darkRed,
    paddingHorizontal: 16,
    paddingTop: 30,
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
    backgroundColor: colors.red,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    transform: [{ rotate: '15deg' }],
    opacity: 0.25,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarSmallImage: { width: 42, height: 26 },
  userInfoHeader: { flexDirection: 'column' },
  headerName: { color: colors.white, fontWeight: '700', fontSize: 16 },
  headerHandle: { color: colors.grayText, fontSize: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconTouch: { marginLeft: 12 },
  settingsWrap: { position: 'absolute', right: 16, top: 64, zIndex: 20 },

  container: { flex: 1, backgroundColor: 'transparent' },
  profileCard: {
    backgroundColor: colors.background,
    marginTop: 0,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
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

  actions: { paddingHorizontal: 16, paddingTop: 18 },
  actions: { paddingHorizontal: 16, paddingTop: 32 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.darkGray, padding: 14, borderRadius: 12, justifyContent: 'space-between' },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: colors.white, fontSize: 16, fontWeight: '700' },

  bottomNav: {
    backgroundColor: colors.darkGray,
    height: 64,
    paddingVertical: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', width: 72, height: 64 },
  activeIndicator: { marginTop: 6, width: 28, height: 3, backgroundColor: colors.red, borderRadius: 2 },
});
