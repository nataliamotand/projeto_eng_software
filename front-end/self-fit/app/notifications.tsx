import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/components/ui/theme';

const { width } = Dimensions.get('window');

export enum NotificationType {
  FOLLOW_REQUEST = 'FOLLOW_REQUEST',
  LINK_REQUEST = 'LINK_REQUEST',
  ROUTINE_REQUEST = 'ROUTINE_REQUEST',
  ROUTINE_REVIEW = 'ROUTINE_REVIEW',
  ROUTINE_FEEDBACK = 'ROUTINE_FEEDBACK',
  UNLINK_NOTICE = 'UNLINK_NOTICE',
}

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  avatar?: string | null;
  isRead: boolean;
};

// mocked notifications - at least one of each type
const mockedNotifications: Notification[] = [
  {
    id: '1',
    type: NotificationType.FOLLOW_REQUEST,
    title: 'Novo pedido de amizade',
    message: 'João quer te seguir',
    timestamp: 'Há 2 horas',
    avatar: 'https://i.pravatar.cc/150?img=3',
    isRead: false,
  },
  {
    id: '2',
    type: NotificationType.LINK_REQUEST,
    title: 'Conexão solicitada',
    message: 'Mariana quer se conectar com você',
    timestamp: 'Há 5 horas',
    avatar: 'https://i.pravatar.cc/150?img=5',
    isRead: false,
  },
  {
    id: '3',
    type: NotificationType.ROUTINE_REQUEST,
    title: 'Pedido de rotina',
    message: 'Carlos enviou uma rotina para sua aprovação',
    timestamp: 'Ontem',
    avatar: null,
    isRead: true,
  },
  {
    id: '4',
    type: NotificationType.ROUTINE_REVIEW,
    title: 'Avaliação de rotina',
    message: 'A rotina do Alex recebeu uma avaliação',
    timestamp: '2 dias atrás',
    avatar: 'https://i.pravatar.cc/150?img=47',
    isRead: true,
  },
  {
    id: '5',
    type: NotificationType.ROUTINE_FEEDBACK,
    title: 'Feedback na rotina',
    message: 'Luiza deixou um feedback na sua rotina',
    timestamp: '3 dias atrás',
    avatar: null,
    isRead: false,
  },
  {
    id: '6',
    type: NotificationType.UNLINK_NOTICE,
    title: 'Desconexão',
    message: 'Pedro removeu a conexão com você',
    timestamp: 'Semana passada',
    avatar: 'https://i.pravatar.cc/150?img=12',
    isRead: true,
  },
];

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(mockedNotifications);

  function handleBack() {
    router.back();
  }

  // NOTE: `markAllRead` removed per request

  function handleAccept(id: string) {
    // TODO: Integrar API para aceitar pedido (follow/link)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  function handleReject(id: string) {
    // TODO: Integrar API para recusar pedido (follow/link)
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleView(id: string) {
    // TODO: Navegar para a rota/visualização relacionada à notificação
    // exemplo: router.push(`/routine/${id}`)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  function renderActions(item: Notification) {
    if (item.type === NotificationType.FOLLOW_REQUEST || item.type === NotificationType.LINK_REQUEST) {
      return (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.buttonGray} onPress={() => handleReject(item.id)}>
            <Text style={styles.buttonText}>Recusar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buttonRed, { marginLeft: 10 }]} onPress={() => handleAccept(item.id)}>
            <Text style={styles.buttonText}>Aceitar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Simple action types
    return (
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.buttonGray} onPress={() => handleView(item.id)}>
          <Text style={styles.buttonText}>Ok</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderItem({ item }: { item: Notification }) {
    return (
      <View style={[styles.card, { backgroundColor: item.isRead ? 'transparent' : colors.darkGray }]}>
        <View style={styles.leftCol}>
          <View style={styles.avatarWrapper}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <FontAwesome name="user" size={20} color={colors.lightGray} />
              </View>
            )}
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
          <Text style={styles.message}>{item.message}</Text>
          {renderActions(item)}
        </View>
      </View>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificações</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.emptyContainer}>
          <FontAwesome name="bell" size={48} color={colors.lightGray} />
          <Text style={styles.emptyText}>Nenhuma notificação no momento</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#070707',
  },
  headerLeft: { width: 40 },
  headerRight: { width: 40, alignItems: 'flex-end' },
  headerRightText: { color: colors.lightGray },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 18 },

  listContent: { paddingBottom: 40 },
  separator: { height: 1, backgroundColor: '#070707' },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#080808',
  },
  leftCol: { width: 56, alignItems: 'center' },
  rightCol: { flex: 1, paddingLeft: 8 },

  avatarWrapper: { width: 48, height: 48 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#111' },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.red,
    borderWidth: 2,
    borderColor: colors.background,
  },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.white, fontWeight: '700', fontSize: 15, flex: 1 },
  timestamp: { color: colors.lightGray, fontSize: 12, marginLeft: 8 },
  message: { color: colors.grayText, marginTop: 6 },

  actionsRow: { flexDirection: 'row', marginTop: 10 },
  buttonGray: {
    backgroundColor: colors.darkGray,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonRed: {
    backgroundColor: colors.red,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonText: { color: colors.white, fontWeight: '600' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { color: colors.lightGray, marginTop: 12 },
});
