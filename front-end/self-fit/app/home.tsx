import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StickyFooter from '../src/components/ui/StickyFooter';
import { colors } from '../src/components/ui/theme';

const { width } = Dimensions.get('window');

// profile control (STUDENT | TEACHER)
const USER_PROFILE = 'STUDENT';

// mocked feed posts
const mockedFeedPosts = [
  {
    id: 'p1',
    authorName: 'João Silva',
    authorAvatar: 'https://i.pravatar.cc/100?img=3',
    workoutTitle: 'Perna e Glúteo',
    duration: '45 min',
    timeAgo: 'Há 2 horas',
    likes: 12,
    exercises: [
      { name: 'Agachamento', sets: 4, reps: '8-10', rest: '90s' },
      { name: 'Leg Press', sets: 3, reps: '10-12', rest: '60s' },
      { name: 'Passada', sets: 3, reps: '12-12', rest: '60s' },
    ],
  },
  {
    id: 'p2',
    authorName: 'Mariana Costa',
    authorAvatar: 'https://i.pravatar.cc/100?img=5',
    workoutTitle: 'Treino de Força - Peito e Tríceps',
    duration: '50 min',
    timeAgo: 'Ontem',
    likes: 34,
    exercises: [
      { name: 'Supino Reto', sets: 4, reps: '6-8', rest: '120s' },
      { name: 'Supino Inclinado', sets: 3, reps: '8-10', rest: '90s' },
      { name: 'Tríceps Pulley', sets: 3, reps: '10-12', rest: '60s' },
    ],
  },
  {
    id: 'p3',
    authorName: 'Lucas Pereira',
    authorAvatar: null,
    workoutTitle: 'Cardio Intenso',
    duration: '30 min',
    timeAgo: '3 dias',
    likes: 7,
    exercises: [
      { name: 'Corrida (esteira)', sets: 1, reps: '30 min', rest: '—' },
      { name: 'Burpees', sets: 4, reps: '12', rest: '45s' },
    ],
  },
];

function Header() {
  const router = require('expo-router').useRouter();

  return (
    <View style={styles.header}>
      {/* decorative lighter curved detail top-right */}
      <View style={styles.headerDetail} pointerEvents="none" />

      <View style={styles.headerLeft}>
        {/* TODO: replace with navigation/avatar image if needed */}
        <View style={styles.avatar}>
          {/* TODO: replace require with the app avatar image if different */}
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
        <TouchableOpacity style={styles.iconTouch} onPress={() => { router.push('/notifications'); }}>
          <Ionicons name="notifications-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PostCard({ item, onView }: { item: any; onView: () => void }) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAuthorRow}>
          {item.authorAvatar ? (
            <Image source={{ uri: item.authorAvatar }} style={styles.postAvatar} />
          ) : (
            <View style={styles.postAvatarFallback}>
              <FontAwesome name="user" size={16} color={colors.gray} />
            </View>
          )}
          <Text style={styles.postAuthor}>{item.authorName}</Text>
        </View>
        <Text style={styles.postTime}>{item.timeAgo}</Text>
      </View>

      <View style={styles.postBody}>
        <Text style={styles.postSmall}>Concluiu o treino:</Text>
        <View style={styles.workoutRow}>
          <MaterialIcons name="fitness-center" size={18} color={colors.red} />
          <Text style={styles.workoutTitle}>{item.workoutTitle}</Text>
        </View>
        <Text style={styles.postDuration}>{item.duration}</Text>
      </View>

      <View style={styles.postFooter}>
        <View style={styles.postFooterSeparator} />
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.viewWorkout} onPress={onView}>
            <Text style={styles.viewWorkoutText}>Visualizar treino</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function Content() {
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  function onView(post: any) {
    setSelectedPost(post);
    setModalVisible(true);
  }

  return (
    <View style={styles.content}>
      <FlatList
        data={mockedFeedPosts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard item={item} onView={() => onView(item)} />}
        contentContainerStyle={{ padding: 16 }}
      />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            {selectedPost && (
              <>
                <Text style={styles.modalTitle}>{selectedPost.workoutTitle}</Text>
                <Text style={styles.modalMeta}>{selectedPost.authorName} • {selectedPost.duration}</Text>
                <View style={{ marginTop: 12 }}>
                  {selectedPost.exercises.map((ex: any, idx: number) => (
                    <View key={idx} style={styles.exerciseRow}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      <Text style={styles.exerciseInfo}>{ex.sets}x {ex.reps}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function BottomNav() {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          router.push('/home');
        }}
      >
        <FontAwesome name="home" size={24} color={colors.red} />
        <View style={styles.activeIndicator} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (USER_PROFILE === 'TEACHER') router.push('/clients');
          else router.push('/routines_and_workouts');
        }}
      >
        {USER_PROFILE === 'TEACHER' ? (
          <MaterialCommunityIcons name="account-group" size={24} color={colors.gray} />
        ) : (
          <MaterialIcons name="fitness-center" size={26} color={colors.gray} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          router.push('/profile');
        }}
      >
        <FontAwesome name="user" size={24} color={colors.gray} />
      </TouchableOpacity>
    </View>
  );
}

export default function Home(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <Content />
      <StickyFooter active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  header: {
    backgroundColor: colors.red,
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
    backgroundColor: colors.lightRed,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    transform: [{ rotate: '15deg' }],
    opacity: 0.25,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 42,
    height: 26,
  },
  userInfo: {
    flexDirection: 'column',
  },
  userName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  userHandle: {
    color: colors.white,
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTouch: {
    marginLeft: 14,
    padding: 6,
  },

  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -12,
    // ensure content overlaps header slightly
  },

  contentEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.red,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  primaryButtonText: { color: colors.white, fontWeight: '700' },

  postCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8, backgroundColor: '#111' },
  postAvatarFallback: { width: 36, height: 36, borderRadius: 18, marginRight: 8, backgroundColor: '#0B0B0B', alignItems: 'center', justifyContent: 'center' },
  postAuthor: { color: colors.white, fontWeight: '700' },
  postTime: { color: colors.gray, fontSize: 12 },

  postBody: { marginTop: 10 },
  postSmall: { color: colors.gray, marginBottom: 6 },
  workoutRow: { flexDirection: 'row', alignItems: 'center' },
  workoutTitle: { color: colors.white, fontWeight: '700', marginLeft: 8 },
  postDuration: { color: colors.gray, marginTop: 6, fontSize: 12 },

  postFooter: { marginTop: 12 },
  postFooterSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: '#0C0C0C', marginBottom: 8 },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  likeRow: { flexDirection: 'row', alignItems: 'center' },
  likeCount: { color: colors.gray, marginLeft: 6 },
  viewWorkout: {},
  viewWorkoutText: { color: colors.gray },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#0A0A0A', padding: 18, borderRadius: 12, width: '100%' },
  modalTitle: { color: colors.white, fontWeight: '700', fontSize: 18 },
  modalMeta: { color: colors.gray, marginTop: 6 },
  modalBody: { color: colors.gray, marginTop: 8 },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#070707' },
  exerciseName: { color: colors.white },
  exerciseInfo: { color: colors.gray, fontSize: 12 },

  bottomNav: {
    backgroundColor: colors.darkNav,
    height: 64,
    paddingVertical: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 64,
  },
  activeIndicator: {
    marginTop: 6,
    width: 28,
    height: 3,
    backgroundColor: colors.red,
    borderRadius: 2,
  },
});

