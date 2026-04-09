import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Modal } from 'react-native';
import Header from '../src/components/ui/Header';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';

const { width } = Dimensions.get('window');

type Workout = {
  id: string;
  title: string;
  date: string; // ISO
  duration: string;
  exercises: { name: string; sets?: number; reps?: string }[];
  totalVolumeKg?: number;
};

const MOCK_WORKOUTS: Workout[] = [
  {
    id: 'w1',
    title: 'Perna e Glúteo - Força',
    date: '2026-04-08T10:00:00Z',
    duration: '52 min',
    exercises: [
      { name: 'Agachamento Livre', sets: 4, reps: '6-8' },
      { name: 'Leg Press', sets: 3, reps: '8-10' },
      { name: 'Passada', sets: 3, reps: '10-12' },
    ],
    totalVolumeKg: 12800,
  },
  {
    id: 'w2',
    title: 'Treino Peito / Tríceps',
    date: '2026-04-05T11:30:00Z',
    duration: '47 min',
    exercises: [
      { name: 'Supino Reto', sets: 4, reps: '6-8' },
      { name: 'Supino Inclinado', sets: 3, reps: '8-10' },
      { name: 'Tríceps Pulley', sets: 3, reps: '10-12' },
    ],
    totalVolumeKg: 9800,
  },
  {
    id: 'w3',
    title: 'Cardio Intenso',
    date: '2026-03-30T07:00:00Z',
    duration: '30 min',
    exercises: [
      { name: 'Corrida (esteira)' },
      { name: 'Burpees', sets: 4, reps: '12' },
    ],
    totalVolumeKg: 0,
  },
  {
    id: 'w4',
    title: 'Costas e Bíceps',
    date: '2026-03-22T17:00:00Z',
    duration: '60 min',
    exercises: [
      { name: 'Puxada na barra', sets: 4, reps: '8-10' },
      { name: 'Remada Curvada', sets: 4, reps: '6-8' },
    ],
    totalVolumeKg: 11200,
  },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function generateWorkoutsForStudent(studentId?: string | number) {
  if (!studentId) return MOCK_WORKOUTS;
  const idNum = Number(studentId) || 0;

  // create variations per student: shift dates and tweak titles
  return MOCK_WORKOUTS.map((w, idx) => {
    const shifted = new Date(w.date);
    shifted.setDate(shifted.getDate() - (idNum % 7) + idx);
    return {
      ...w,
      id: `${w.id}-s${idNum}`,
      title: `${w.title} (${idNum})`,
      date: shifted.toISOString(),
    };
  });
}

export default function PreviousWorkouts(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams();
  const studentId = (params as any)?.studentId;

  const sorted = useMemo(() => {
    const list = generateWorkoutsForStudent(studentId);
    return [...list].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }, [studentId]);

  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  function openWorkoutModal(item: Workout) {
    setSelectedWorkout(item);
    setModalVisible(true);
  }

  function renderItem({ item }: { item: Workout }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => openWorkoutModal(item)}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{formatDate(item.date)} • {item.duration}</Text>
          <Text style={styles.cardMeta}>{item.exercises.length} exercícios • {item.totalVolumeKg ? `${Math.round(item.totalVolumeKg / 1000)}k kg` : '—'}</Text>
        </View>

        <View style={styles.cardRight}>
          <MaterialIcons name="chevron-right" size={24} color={colors.lightGray} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Treinos Anteriores" />

      <FlatList
        data={sorted}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            {selectedWorkout && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedWorkout.title}</Text>
                  <Text style={styles.modalMeta}>{formatDate(selectedWorkout.date)} • {selectedWorkout.duration}</Text>
                </View>

                <View style={{ marginTop: 12 }}>
                  {selectedWorkout.exercises.map((ex, idx) => {
                    const setsArray = Array.isArray((ex as any).sets) ? (ex as any).sets : [];
                    const isStrength = setsArray.some((s: any) => s && (s.weight !== undefined || 'weight' in s));
                    return (
                      <View key={idx} style={{ marginBottom: 12 }}>
                        <View style={styles.exerciseHeader}>
                          <Text style={styles.exerciseTitle}>{ex.name}</Text>
                          <Text style={styles.exerciseTarget}>{/* placeholder for target */}</Text>
                        </View>

                        <View style={styles.setsHeader}>
                          <Text style={styles.setsHeaderIndex}>SÉRIE</Text>
                          {isStrength ? (
                            <>
                              <Text style={styles.setsHeaderCol}>KG</Text>
                              <Text style={styles.setsHeaderCol}>REPS</Text>
                            </>
                          ) : (
                            <>
                              <Text style={styles.setsHeaderCol}>KM</Text>
                              <Text style={styles.setsHeaderCol}>TEMPO</Text>
                            </>
                          )}
                          <View style={{ width: 40 }} />
                        </View>

                        {setsArray.map((s: any, si: number) => (
                          <View key={(s && (s.id ?? si)) || si} style={styles.setRowReadonly}>
                            <Text style={styles.setIndex}>{si + 1}</Text>
                            {isStrength ? (
                              <>
                                <Text style={styles.setValue}>{s.weight ?? '-'}</Text>
                                <Text style={styles.setValue}>{s.reps ?? '-'}</Text>
                              </>
                            ) : (
                              <>
                                <Text style={styles.setValue}>{s.distance ?? '-'}</Text>
                                <Text style={styles.setValue}>{s.time ?? '-'}</Text>
                              </>
                            )}
                            <Text style={styles.setStatus}>{s.isCompleted ? '✓' : ''}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <StickyFooter active="workouts" />
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
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#070707',
  },
  headerLeft: { width: 40 },
  headerRight: { width: 40 },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 18 },

  listContent: { padding: 16, paddingBottom: 80 },
  separator: { height: 8 },

  card: {
    backgroundColor: colors.darkGray,
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flex: 1, paddingRight: 8 },
  cardTitle: { color: colors.white, fontWeight: '700', fontSize: 15, marginBottom: 6 },
  cardMeta: { color: colors.lightGray, fontSize: 13 },
  cardRight: { marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 680, backgroundColor: '#0A0A0A', borderRadius: 12, padding: 18 },
  modalHeader: { borderBottomWidth: 1, borderBottomColor: '#070707', paddingBottom: 8 },
  modalTitle: { color: colors.white, fontWeight: '800', fontSize: 16 },
  modalMeta: { color: colors.lightGray, fontSize: 12, marginTop: 6 },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#070707' },
  exerciseName: { color: colors.white },
  exerciseInfo: { color: colors.lightGray },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseTitle: { color: colors.white, fontWeight: '700' },
  exerciseTarget: { color: colors.lightGray, fontSize: 12 },
  setsHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#070707' },
  setsHeaderIndex: { color: colors.lightGray, width: 56, textAlign: 'center' },
  setsHeaderCol: { color: colors.lightGray, flex: 1, textAlign: 'center' },
  setRowReadonly: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#070707' },
  setIndex: { color: colors.lightGray, width: 56, textAlign: 'center' },
  setValue: { color: colors.white, flex: 1, textAlign: 'center', minWidth: 36 },
  setStatus: { width: 40, textAlign: 'center', color: colors.lightGray },
});
