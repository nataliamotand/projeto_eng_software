import React, { useState } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importações do seu projeto
import api from '../src/services/api';
import { colors } from '../src/components/ui/theme';

const { height, width } = Dimensions.get('window');

export default function Login(){
  const router = useRouter();
  
  // Estados para controlar o formulário e a interface
  const [login, setLogin] = useState<string>(''); 
  const [password, setPassword] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Função que faz a ponte com o Back-end
  const handleLogin = async () => {
    if (!login || !password) {
      setError('Por favor, preencha email e senha.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // O FastAPI espera os dados em formato de formulário (OAuth2)
      const params = new URLSearchParams();
      params.append('username', login);
      params.append('password', password);

      const response = await api.post('/login', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Se chegamos aqui, o login deu 200 OK
      const token = response.data.access_token;
      
      /**
       * CORREÇÃO CRUCIAL: 
       * Usamos a chave 'token' para bater com o que o interceptor no api.ts busca.
       */
      await AsyncStorage.setItem('token', token); 
      
      console.log('Login OK! Navegando para a Home...');
      router.push('/home');

    } catch (err: any) {
      // Tratamento de erros amigável
      if (err.response && err.response.status === 401) {
        setError('Email ou senha incorretos.');
      } else {
        setError('Não foi possível conectar ao servidor.');
        console.error("Erro de conexão:", err);
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
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backTouch}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={26} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.center}>
            <Text style={styles.title}>LOGIN</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputRow}>
                <Ionicons name="mail" size={20} color={colors.grayText} style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.grayText}
                  value={login}
                  onChangeText={setLogin}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <View style={[styles.inputRow, { marginTop: 16 }]}>
                <Ionicons name="lock-closed" size={20} color={colors.grayText} style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor={colors.grayText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!visible}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.rightIconTouch}
                  onPress={() => setVisible(!visible)}
                >
                  <MaterialIcons
                    name={visible ? "visibility" : "visibility-off"}
                    size={22}
                    color={colors.grayText}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotText}>ESQUECEU A SENHA?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.loginText}>ENTRAR</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/register')}
              disabled={loading}
            >
              <Text style={styles.registerText}>CADASTRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 20 },
  backTouch: { padding: 8, marginTop: 6 },
  header: { alignItems: 'center', marginTop: -20 },
  logoImage: { width: Math.min(520, width * 0.95), height: Math.max(180, height * 0.2) },
  center: { alignItems: 'center' },
  title: { color: colors.redBright, fontFamily: 'AntonSC', fontSize: 28, marginTop: 18, marginBottom: 18 },
  inputWrapper: { width: '100%', alignItems: 'center' },
  inputRow: { 
    width: '100%', 
    backgroundColor: colors.inputBg, 
    borderRadius: 12, 
    height: 52, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12 
  },
  leftIcon: { marginRight: 8 },
  input: { flex: 1, color: colors.white, fontSize: 16 },
  rightIconTouch: { marginLeft: 8, padding: 4 },
  errorText: { color: '#FF4444', marginTop: 12, fontSize: 14, fontWeight: 'bold' },
  forgotPassword: { marginTop: 12, alignSelf: 'flex-end', paddingVertical: 8 },
  forgotText: { color: colors.grayText, fontSize: 13, fontWeight: '600' },
  loginButton: { 
    marginTop: 24, 
    width: '100%', 
    height: 52, 
    backgroundColor: colors.red, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loginText: { color: colors.white, fontFamily: 'Anton', fontSize: 18, letterSpacing: 1 },
  registerButton: { 
    marginTop: 16, 
    width: '100%', 
    height: 52, 
    borderWidth: 2, 
    borderColor: '#333', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  registerText: { color: colors.white, fontFamily: 'Anton', fontSize: 16, letterSpacing: 1 },
});