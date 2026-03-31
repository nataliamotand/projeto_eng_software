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
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
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

export default function Register(): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [cref, setCref] = useState<string>('');

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

          {/* top spacer kept for back button row; app logo moved into scrollable content */}

          <ScrollView style={styles.scroll} contentContainerStyle={styles.centerContent} keyboardShouldPersistTaps="handled">
            <View style={styles.center}>
            <Image source={require('../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.title}>REGISTRE-SE</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputRow}>
                <Ionicons name="person" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={[styles.inputRow, { marginTop: 12 }]}>
                <Ionicons name="mail" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>

              <View style={[styles.inputRow, { marginTop: 12 }]}>
                <Ionicons name="person" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Login"
                  placeholderTextColor="#666"
                  value={login}
                  onChangeText={setLogin}
                />
              </View>

              <View style={[styles.inputRow, { marginTop: 12 }]}>
                <MaterialIcons name="lock-outline" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#666"
                  secureTextEntry={!visible}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setVisible((v) => !v)}
                  accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
                  style={styles.rightIconTouch}
                >
                  <Ionicons name={visible ? 'eye' : 'eye-off'} size={20} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={[styles.checkboxRow, { marginTop: 12 }]}>
                <TouchableOpacity
                  style={styles.checkboxTouch}
                  onPress={() => setIsPro((s) => !s)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isPro }}
                >
                  <View style={[styles.checkbox, isPro && styles.checkboxChecked]}>
                    {isPro && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Sou Professor/Personal</Text>
              </View>

              {isPro && (
                <View style={[styles.inputRow, { marginTop: 12 }]}>
                  <MaterialIcons name="badge" size={20} color="#333" style={styles.leftIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="CREF"
                    placeholderTextColor="#666"
                    value={cref}
                    onChangeText={setCref}
                  />
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.button} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton} activeOpacity={0.85} accessibilityRole="button">
              <Image source={require('../assets/images/logo_google.png')} style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Entrar com o Google</Text>
            </TouchableOpacity>
            </View>
          </ScrollView>

          {/* footer removed (logo moved into scrollable content) */}
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
    justifyContent: 'flex-start',
    paddingVertical: 12,
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
  top: {
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  logoImage: {
    width: Math.min(320, width * 0.7),
    height: Math.min(140, height * 0.18),
  },
  centerContent: {
    alignItems: 'center',
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  center: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    color: colors.redBright,
    fontFamily: 'AntonSC',
    fontSize: 28,
    marginTop: 8,
    marginBottom: 12,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  checkboxTouch: {
    padding: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: colors.white,
  },
  button: {
    marginTop: 20,
    width: '100%',
    alignSelf: 'stretch',
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    marginHorizontal: 12,
    color: colors.grayText,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
    height: 52,
    paddingHorizontal: 16,
    position: 'relative',
    paddingLeft: 44,
    borderRadius: 8,
    width: '100%',
    alignSelf: 'stretch',
  },
  googleIcon: {
    width: 24,
    height: 24,
    resizeMode: 'cover',
    position: 'absolute',
    left: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  googleButtonText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Anton',
  },

  scroll: {
    flex: 1,
    width: '100%',
  },
  bottomRow: {
    alignItems: 'center',
  },
  footerText: {
    color: colors.grayText,
    fontSize: 12,
    marginTop: 8,
  },
});

