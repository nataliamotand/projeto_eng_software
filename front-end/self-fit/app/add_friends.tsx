import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/components/ui/theme';

const { width } = Dimensions.get('window');

const mockedUsers = [
  { id: '1', name: 'Mariana Silva', username: 'maris', subtitle: '3 em comum', avatar: require('../assets/images/logo.png') },
  { id: '2', name: 'Carlos Pereira', username: 'carlosp', subtitle: 'Sugestões para você', avatar: require('../assets/images/react-logo.png') },
  { id: '3', name: 'Ana Souza', username: 'anas', subtitle: '2 em comum', avatar: require('../assets/images/logo_google.png') },
  { id: '4', name: 'Pedro Gomes', username: 'pedrog', subtitle: '1 em comum', avatar: require('../assets/images/icon.png') },
];

export default function AddFriends(): JSX.Element {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const filtered = mockedUsers.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });

  function renderUser({ item }: { item: typeof mockedUsers[0] }) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userLeft}>
          <Image source={item.avatar} style={styles.avatar} />
          <View style={styles.userTexts}>
            <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userLogin}>@{item.username}</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.userSubtitle}>{item.subtitle}</Text>
              {/* overlapping mini avatars (bonus) */}
              <View style={styles.miniAvatars}>
                <Image source={require('../assets/images/react-logo.png')} style={[styles.miniAvatar, { left: 0 }]} />
                <Image source={require('../assets/images/logo.png')} style={[styles.miniAvatar, { left: 10 }]} />
              </View>
            </View>
          </View>
        </View>

          <View style={styles.userRight}>
            <TouchableOpacity
              style={styles.followButton}
              onPress={() => {
                // TODO: Implementar ação de seguir/adicionar
              }}
            >
              <Text style={styles.followText}>Seguir</Text>
            </TouchableOpacity>
          </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            router.back();
          }}
          style={styles.backTouch}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.title}>Encontrar pessoas</Text>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.grayText} style={{ marginLeft: 12 }} />
        <TextInput
            placeholder="Buscar"
          placeholderTextColor={colors.grayText}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 12,
  },
  backTouch: { width: 40 },
  title: { flex: 1, color: colors.white, fontSize: 18, fontWeight: '700', textAlign: 'left' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    marginHorizontal: 16,
    borderRadius: 999,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  list: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },

  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  userLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#222' },
  userTexts: { marginLeft: 12 },
  userName: { color: colors.white, fontWeight: '700', fontSize: 15 },
  userLogin: { color: colors.grayText, fontSize: 13, marginTop: 4 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  userSubtitle: { color: colors.grayText, fontSize: 12 },
  miniAvatars: { width: 40, height: 20, marginLeft: 8, position: 'relative' },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, position: 'absolute', borderWidth: 2, borderColor: colors.background },

  userRight: { flexDirection: 'row', alignItems: 'center' },
  followButton: { backgroundColor: colors.red, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  followText: { color: colors.white, fontWeight: '700' },
  closeTouch: { marginLeft: 10, padding: 6 },
});
