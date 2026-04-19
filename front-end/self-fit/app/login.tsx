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

export default function Login(): JSX.Element {
  const router = useRouter();

  // Estados de controle (Lógica)
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // --- LÓGICA DE GOVERNANÇA: A PONTE COM O BACKEND ---
  const handleLogin = async () => {
    if (!login || !password) {
      setError('Por favor, preencha login e senha.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // O FastAPI exige os dados em formato de formulário (x-www-form-urlencoded)
      const params = new URLSearchParams();
      params.append('username', login);
      params.append('password', password);

      const response = await api.post('/login', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Sucesso: Guardamos o crachá (token)
      const token = response.data.access_token;
      await AsyncStorage.setItem('token', token);

      console.log('Login realizado com sucesso!');
      router.replace('/home'); // Navega para a Home real

    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('Login ou senha inválidos.');
      } else {
        setError('Erro de conexão com o servidor.');
        console.error("Erro de login:", err);
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
              {/* Campo Login/Email */}
              <View style={styles.inputRow}>
                <Ionicons name="person" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Login"
                  placeholderTextColor="#666"
                  value={login}
                  onChangeText={setLogin}
                  autoCapitalize="none"
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

            {/* Mensagem de Erro (Estilizada) */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
  errorText: { 
    color: '#FF6666', 
    marginTop: 12, 
    fontSize: 14, 
    fontWeight: 'bold' 
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