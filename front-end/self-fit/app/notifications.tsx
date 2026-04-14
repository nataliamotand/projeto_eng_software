import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  status: string;
  data_criacao: string;
  remetente_id?: number;
  referencia_id?: number;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Buscar notificações reais do banco
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/notificacoes');
      setNotifications(response.data);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 2. Lógica para Responder (Aceitar/Recusar/Ok)
  const handleResponse = async (notificacaoId: number, acao: 'ACEITAR' | 'RECUSAR' | 'LIDO') => {
    try {
      if (acao === 'LIDO') {
        // Para tipos informativos, apenas marcamos como lido (se você tiver essa rota ou apenas remover da lista)
        setNotifications(prev => prev.filter(n => n.id !== notificacaoId));
        return;
      }

      // Chama a rota PUT que a Natália criou e nós unificamos
      await api.put(`/notificacoes/${notificacaoId}/responder`, { acao });
      
      Alert.alert("Sucesso", `Solicitação ${acao.toLowerCase()}a!`);
      
      // Remove da lista local após responder
      setNotifications(prev => prev.filter(n => n.id !== notificacaoId));
    } catch (error) {
      Alert.alert("Erro", "Não foi possível processar a resposta.");
    }
  };

  const renderItem = ({ item }: { item: Notificacao }) => {
    const isInvite = item.tipo === 'SOLICITACAO_SEGUIR';

    return (
      <View style={styles.notifCard}>
        <View style={styles.row}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('../assets/images/logo.png')} // Aqui você pode usar o avatar do remetente depois
              style={styles.avatar} 
            />
            {item.status === 'PENDENTE' && <View style={styles.dot} />}
          </View>

          <View style={styles.content}>
            <Text style={styles.notifTitle}>{item.titulo}</Text>
            <Text style={styles.notifMsg}>{item.mensagem}</Text>

            <View style={styles.buttonRow}>
              {isInvite ? (
                <>
                  <TouchableOpacity 
                    onPress={() => handleResponse(item.id, 'RECUSAR')}
                    style={styles.btnRecusar}
                  >
                    <Text style={styles.txtRecusar}>Recusar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => handleResponse(item.id, 'ACEITAR')}
                    style={styles.btnAceitar}
                  >
                    <Text style={styles.txtAceitar}>Aceitar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  onPress={() => handleResponse(item.id, 'LIDO')}
                  style={styles.btnOk}
                >
                  <Text style={styles.txtAceitar}>Ok</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma notificação por aqui.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  notifCard: { padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  row: { flexDirection: 'row' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#333' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.red, position: 'absolute', right: 0, bottom: 0, borderWidth: 2, borderColor: colors.background },
  content: { flex: 1, marginLeft: 15 },
  notifTitle: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  notifMsg: { color: colors.grayText, marginTop: 4, fontSize: 14 },
  buttonRow: { flexDirection: 'row', marginTop: 12 },
  btnAceitar: { backgroundColor: colors.red, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, marginLeft: 10 },
  btnRecusar: { paddingHorizontal: 20, paddingVertical: 8 },
  btnOk: { backgroundColor: '#111', paddingHorizontal: 25, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  txtAceitar: { color: colors.white, fontWeight: 'bold' },
  txtRecusar: { color: colors.white, fontWeight: '500' },
  emptyText: { color: colors.grayText, textAlign: 'center', marginTop: 50 }
});