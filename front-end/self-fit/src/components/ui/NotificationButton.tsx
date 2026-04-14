import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { colors } from './theme';

export default function NotificationButton() {
  const [hasUnread, setHasUnread] = useState(false);
  const router = useRouter();

  const checkNotifications = async () => {
    try {
      const response = await api.get('/notificacoes');
      console.log("Notificações pendentes encontradas:", response.data.length); // <--- ADICIONE ISSO
      setHasUnread(response.data.length > 0);
    } catch (error) {
      console.log("Erro na API de notificações:", error);
    }
  };

  // Isso faz a bolinha atualizar toda vez que você volta para a Home
  useFocusEffect(
    useCallback(() => {
      checkNotifications();
    }, [])
  );

  return (
    <TouchableOpacity 
      onPress={() => router.push('/notifications')} 
      style={styles.container}
    >
      <Ionicons name="notifications-outline" size={26} color={colors.white} />
      {hasUnread && <View style={styles.badge} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FFF', // Branco para dar contraste no seu header vermelho
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#000', // Borda preta fina para destacar
  },
});