import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { FontAwesome, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/components/ui/theme';
import api from '@/src/services/api';

const { width } = Dimensions.get('window');

// MOCKED WORKOUTS (some dates in 2026)
const mockedWorkouts = [
  { date: '2026-01-05', title: 'Costas e' },
  { date: '2026-01-12', title: 'Perna e' },
  { date: '2026-02-02', title: 'Peito, Bíceps' },
  { date: '2026-02-18', title: 'Cardio' },
  { date: '2026-03-03', title: 'Costas e' },
  { date: '2026-03-10', title: 'Perna e' },
  { date: '2026-04-22', title: 'Core' },
  { date: '2026-05-14', title: 'Peito' },
  { date: '2026-06-01', title: 'Cardio' },
  { date: '2026-07-08', title: 'Costas' },
  { date: '2026-08-19', title: 'Perna' },
  { date: '2026-09-23', title: 'Treino Full' },
  { date: '2026-10-05', title: 'Peito' },
  { date: '2026-11-11', title: 'Cardio' },
  { date: '2026-12-24', title: 'Core' },
];

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const monthShorts = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function buildMap(list: { date: string; title?: string }[]) {
  const m: Record<string, { date: string; title?: string }> = {};
  list.forEach((w) => (m[w.date] = w));
  return m;
}

function MonthView({ workoutMap }: { workoutMap: Record<string, any> }) {
  function renderDay({ date }: any) {
    const ds = date.dateString;
    const w = workoutMap[ds];

    return (
      <View style={styles.dayWrapper}>
        {w ? (
          <View style={styles.dayCircle}>
            <Text style={styles.dayNumber}>{String(date.day)}</Text>
          </View>
        ) : (
          <Text style={[styles.dayNumber, { color: colors.white }]}>{String(date.day)}</Text>
        )}
        {w && <Text style={styles.dayLabel}>{w.title}</Text>}
      </View>
    );
  }

  return (
    <View>
      <Calendar
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.white,
          dayTextColor: colors.white,
          arrowColor: colors.red,
          monthTextColor: colors.white,
          todayTextColor: colors.white,
        }}
        dayComponent={renderDay}
      />
    </View>
  );
}

function YearView({ workoutMap }: { workoutMap: Record<string, any> }) {
  // render 12 months each with mini grid
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  function monthDays(year: number, month: number) {
    return new Date(year, month, 0).getDate();
  }

  return (
    <View>
      <Text style={styles.yearTitle}>2026</Text>
      <View style={styles.yearGrid}>
        {months.map((m) => {
          const days = monthDays(2026, m);
          const firstDay = new Date(2026, m - 1, 1).getDay();
          const totalCells = Math.ceil((firstDay + days) / 7) * 7;
          const cells = Array.from({ length: totalCells }).map((_, idx) => {
            const dayIndex = idx - firstDay + 1;
            if (dayIndex < 1 || dayIndex > days) return null;
            const ds = `2026-${String(m).padStart(2, '0')}-${String(dayIndex).padStart(2, '0')}`;
            return { day: dayIndex, has: !!workoutMap[ds] };
          });

          return (
            <View key={m} style={styles.monthCard}>
              <Text style={styles.monthLabel}>{monthNames[m - 1]}</Text>
              <View style={styles.miniGrid}>
                {cells.map((c, i) => (
                  <View
                    key={i}
                    style={[
                      styles.miniCell,
                      { backgroundColor: c && c.has ? colors.red : '#1A1A1A' },
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MultiYearView({ workoutMap }: { workoutMap: Record<string, any> }) {
  // build weeks for the year 2026 (columns)
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 11, 31);
  const days: { date: string; has: boolean }[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = d.toISOString().slice(0, 10);
    days.push({ date: ds, has: !!workoutMap[ds] });
  }

  // group by week columns (Sunday-start)
  const weeks: Array<Array<{ date: string; has: boolean } | null>> = [];
  let week: Array<{ date: string; has: boolean } | null> = [];
  // pad start to sunday
  const pad = start.getDay();
  for (let i = 0; i < pad; i++) week.push(null);
  days.forEach((d) => {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  // compute mapping from date -> weekIndex
  const dateToWeekIndex: Record<string, number> = {};
  weeks.forEach((col, idx) => {
    col.forEach((cell) => {
      if (cell && (cell as any).date) dateToWeekIndex[(cell as any).date] = idx;
    });
  });

  // compute how many week-columns each month spans
  const colWidth = 10;
  const colSpacing = 4; // matches marginRight used when rendering columns
  const monthWeekCounts: number[] = [];
  for (let m = 1; m <= 12; m++) {
    let minIdx: number | null = null;
    let maxIdx: number | null = null;
    for (let day = 1; day <= new Date(2026, m, 0).getDate(); day++) {
      const ds = `2026-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const wi = dateToWeekIndex[ds];
      if (wi !== undefined) {
        if (minIdx === null || wi < minIdx) minIdx = wi;
        if (maxIdx === null || wi > maxIdx) maxIdx = wi;
      }
    }
    if (minIdx === null || maxIdx === null) monthWeekCounts.push(0);
    else monthWeekCounts.push(maxIdx - minIdx + 1);
  }

  return (
    <View>
      <Text style={styles.yearTitle}>2026</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'column' }}>
        <View style={styles.monthsHeaderRow}>
          {monthShorts.map((m, i) => {
            const rawWeeks = monthWeekCounts[i] || 0;
            const weeksForMonth = 4.34; // 52/12
            const w = weeksForMonth * (colWidth + colSpacing); // match each column's width+spacing
            return (
              <View key={i} style={{ width: w, paddingHorizontal: 2 }}>
                <Text style={[styles.monthAbbrev, { textAlign: 'center' }]}>{m}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', paddingVertical: 8 }}>
          {weeks.map((col, i) => (
            <View key={i} style={{ marginRight: colSpacing }}>
              {col.map((cell, r) => (
                <View
                  key={r}
                  style={{ width: colWidth, height: 10, marginBottom: 2, borderRadius: 2, backgroundColor: cell ? (cell.has ? colors.red : '#1A1A1A') : 'transparent' }}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function CalendarScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'multi-year'>('month');
  const [loading, setLoading] = useState(true);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);

        const historyRes = await api.get('/alunos/historico-treinos')
        if (cancelled) return;

        setWorkoutHistory(historyRes.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Memoização do calendário para performance (mapeia treinos reais)
  const workoutMap = useMemo(() => {
    const m: Record<string, { date: string; title: string }> = {};
    workoutHistory.forEach((w) => {
      const dateKey = new Date(w.data_fim).toISOString().split('T')[0];
      m[dateKey] = { date: dateKey, title: w.titulo };
    });
    return m;
  }, [workoutHistory]);


  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendário</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.periodTabs}>
        {([['month','Mês'],['year','Ano'],['multi-year','Plurianual']] as const).map(([mode, label]) => (
          <TouchableOpacity
            key={mode}
            style={[styles.periodTab, viewMode === mode && styles.periodTabActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.periodTabText, viewMode === mode && styles.periodTabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/profile')} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendário</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.periodTabs}>
        {([['month','Mês'],['year','Ano'],['multi-year','Plurianual']] as const).map(([mode, label]) => (
          <TouchableOpacity
            key={mode}
            style={[styles.periodTab, viewMode === mode && styles.periodTabActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.periodTabText, viewMode === mode && styles.periodTabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {viewMode === 'month' && <MonthView workoutMap={workoutMap} />}

        {viewMode === 'year' && <YearView workoutMap={workoutMap} />}

        {viewMode === 'multi-year' && <MultiYearView workoutMap={workoutMap} />}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 48, paddingBottom: 12 },
  headerLeft: { width: 40 },
  headerRight: { width: 40 },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 18 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  periodTabs: { flexDirection: 'row', marginHorizontal: 12, marginBottom: 12, backgroundColor: '#111', borderRadius: 10, padding: 4 },
  periodTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  periodTabActive: { backgroundColor: colors.red },
  periodTabText: { color: colors.grayText, fontWeight: '600', fontSize: 13 },
  periodTabTextActive: { color: colors.white },

  container: { flex: 1, paddingHorizontal: 12 },
  statsTop: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0a0a0a', padding: 12, borderRadius: 10, marginBottom: 12 },
  statBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statText: { color: colors.white, marginLeft: 8 },

  dayWrapper: { alignItems: 'center', width: 40 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { color: colors.white, fontSize: 14 },
  dayLabel: { color: colors.grayText, fontSize: 10, marginTop: 4, textAlign: 'center' },

  yearTitle: { color: colors.white, fontSize: 20, fontWeight: '800', marginBottom: 12 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  monthCard: { width: (width - 48) / 3, marginBottom: 12 },
  monthLabel: { color: colors.grayText, marginBottom: 6 },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  miniCell: { width: 10, height: 10, margin: 1, borderRadius: 2 },
  monthsHeader: { paddingVertical: 6, paddingHorizontal: 6 },
  monthsHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 6 },
  monthAbbrev: { color: colors.grayText, marginRight: 12, fontSize: 12 },

  bottomNav: { backgroundColor: colors.darkGray, height: 64, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center', justifyContent: 'center', width: 72, height: 64 },
  activeIndicator: { marginTop: 6, width: 28, height: 3, backgroundColor: colors.red, borderRadius: 2 },
  modeButton: { flexDirection: 'row', alignItems: 'center' },
  modeText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconTouch: { marginLeft: 12 },
  modeOverlay: { position: 'absolute', left: 0, right: 0, top: 56, bottom: 0, zIndex: 40 },
  modeMenu: { position: 'absolute', alignSelf: 'center', top: 0, backgroundColor: '#0b0b0b', borderRadius: 8, paddingVertical: 8, width: 160, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 6 },
  modeOption: { paddingVertical: 10, paddingHorizontal: 12 },
  modeOptionText: { color: colors.white, fontSize: 14 },
});
