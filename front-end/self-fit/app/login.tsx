import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importações de infraestrutura
import api from '../src/services/api';
import { colors } from '../src/components/ui/theme';

const { height, width } = Dimensions.get('window');

export default function Login(){
  const router = useRouter();

  // Estados de controle (Lógica)
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // --- LÓGICA DE GOVERNANÇA: A PONTE COM O BACKEND ---
  const handleLogin = async () => {
    if (!login.trim()) {
      setFeedback({ type: 'error', message: 'Informe seu e-mail para continuar.' });
      return;
    }
    if (!password) {
      setFeedback({ type: 'error', message: 'Informe sua senha para continuar.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const params = new URLSearchParams();
      params.append('username', login.trim());
      params.append('password', password);

      const response = await api.post('/login', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const token = response.data.access_token;
      await AsyncStorage.setItem('token', token);

      setFeedback({ type: 'success', message: 'Login realizado! Redirecionando...' });
      setTimeout(() => router.replace('/home'), 1200);

    } catch (err: any) {
      if (err.response?.status === 401) {
        setFeedback({ type: 'error', message: 'E-mail ou senha incorretos. Verifique e tente novamente.' });
      } else if (err.response?.status === 404) {
        setFeedback({ type: 'error', message: 'E-mail não encontrado. Verifique ou crie uma conta.' });
      } else if (!err.response) {
        setFeedback({ type: 'error', message: 'Sem conexão com o servidor. Verifique sua internet.' });
      } else {
        setFeedback({ type: 'error', message: 'Ocorreu um erro inesperado. Tente novamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* TOPO: Botão Voltar (Layout Gabi) */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backTouch}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={26} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* LOGO: Centralizada e Dimensionada (Layout Gabi) */}
          <View style={styles.top}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>

          {/* CENTRO: Formulário (Visual Gabi + Lógica Natalia) */}
          <View style={styles.center}>
            <Text style={styles.title}>LOGIN</Text>

            <View style={styles.inputWrapper}>
              {/* Campo E-mail */}
              <View style={styles.inputRow}>
                <Ionicons name="mail" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#666"
                  value={login}
                  onChangeText={setLogin}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              {/* Campo Senha */}
              <View style={[styles.inputRow, { marginTop: 16 }]}>
                <MaterialIcons name="lock-outline" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#666"
                  secureTextEntry={!visible}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setVisible((v) => !v)}
                  style={styles.rightIconTouch}
                >
                  <Ionicons name={visible ? 'eye' : 'eye-off'} size={20} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Banner de Feedback */}
            {feedback && (
              <View style={[styles.feedbackBanner, feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
                <Ionicons
                  name={feedback.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.feedbackText}>{feedback.message}</Text>
              </View>
            )}

            {/* Botão Entrar com Feedback de Carregamento */}
            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* RODAPÉ: Copyright (Layout Gabi) */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© Self-fit</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- ESTILOS ORIGINAIS DA GABI (PRESERVADOS) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: '6%',
    justifyContent: 'space-evenly',
  },
  top: {
    alignItems: 'center',
    marginTop: height * 0.08,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backTouch: {
    padding: 8,
    marginTop: 6,
  },
  logoImage: {
    width: Math.min(520, width * 0.95),
    height: Math.max(180, height * 0.2),
  },
  center: {
    alignItems: 'center',
  },
  title: {
    color: colors.redBright,
    fontFamily: 'AntonSC',
    fontSize: 28,
    marginTop: 18,
    marginBottom: 18,
  },
  inputWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  inputRow: {
    width: '100%',
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#000',
    fontSize: 16,
  },
  rightIconTouch: {
    marginLeft: 8,
    padding: 6,
  },
  button: {
    marginTop: 20,
    width: '100%',
    height: 52,
    backgroundColor: colors.red,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontFamily: 'Anton',
    fontSize: 16,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  feedbackError: {
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderLeftColor: '#dc2626',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(22,163,74,0.15)',
    borderLeftColor: '#16a34a',
  },
  feedbackText: {
    flex: 1,
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Math.max(12, height * 0.05),
  },
  footerText: {
    color: colors.grayText,
    fontSize: 12,
  },
});