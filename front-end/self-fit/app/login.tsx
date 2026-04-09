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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { height, width } = Dimensions.get('window');

const colors = {
  background: '#000000',
  red: '#CC0000',
  redBright: '#FF0000',
  inputBg: '#E5E5E5',
  white: '#FFFFFF',
  grayText: '#CFCFCF',
};

export default function Login(): JSX.Element {
  const router = useRouter();
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
              accessibilityLabel="Voltar"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={26} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.top}>
            <Image source={require('../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>

          <View style={styles.center}>
            <Text style={styles.title}>LOGIN</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputRow}>
                <Ionicons name="person" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Login"
                  placeholderTextColor="#666"
                  value={login}
                  onChangeText={setLogin}
                  keyboardType="default"
                  returnKeyType="next"
                />
              </View>

              <View style={[styles.inputRow, { marginTop: 16 }]}>
                <MaterialIcons name="lock-outline" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#666"
                  secureTextEntry={!visible}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setVisible((v) => !v)}
                  accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
                  style={styles.rightIconTouch}
                >
                  <Ionicons name={visible ? 'eye' : 'eye-off'} size={20} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.85}
              accessibilityRole="button"
              onPress={() => {
                // mocked credentials: login 'gabi' and password '123'
                if (login === 'gabi' && password === '123') {
                  setError(null);
                  router.replace('/home');
                } else {
                  setError('Login ou senha inválidos (use gabi / 123)');
                }
              }}
            >
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            {error ? <Text style={{ color: '#FF6666', marginTop: 8 }}>{error}</Text> : null}

            <TouchableOpacity style={styles.linkTouch} accessibilityRole="link">
              <Text style={styles.linkText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© Self-fit</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  logo: {
    color: colors.white,
    fontSize: Math.max(20, height * 0.035),
    fontWeight: '700',
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
  linkTouch: {
    marginTop: 12,
  },
  linkText: {
    color: colors.grayText,
    fontSize: 13,
    textDecorationLine: 'underline',
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
