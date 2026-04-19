import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const { height, width } = Dimensions.get('window');

export default function Register(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams ? useLocalSearchParams() : {};
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [login, setLogin] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [dobError, setDobError] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [cref, setCref] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [crefError, setCrefError] = useState<string>('');

  useEffect(() => {
    const role = (params as any).role;
    if (role === 'TEACHER') setIsPro(true);
  }, [params]);

  async function handleRegister() {
    // 1. Início do teste
    console.log("--- INICIANDO PROCESSO DE CADASTRO ---");
    
    const ok = validateAll();
    if (!ok) {
      console.log("Falha na validação dos campos locais.");
      return;
    }

    try {
      // 2. Formatação da Data (Ajuste para o Pydantic do Python)
      const [day, month, year] = dob.split('/');
      const dateFormatted = `${year}-${month}-${day}`;
      console.log("Data formatada para o Backend:", dateFormatted);

      // 3. PASSO A: Criar Usuário Base
      console.log("Tentando POST /usuarios...");
      const userPayload = {
        nome: name,
        email: email,
        senha: password,
        data_nascimento: dateFormatted,
        tipo_perfil: isPro ? 'TEACHER' : 'STUDENT',
      };
      
      await api.post('/usuarios', userPayload);
      console.log("Passo A concluído: Usuário criado.");

      // 4. PASSO B: Login Automático (Necessário para pegar o Token)
      console.log("Tentando POST /login...");
      const loginData = new FormData();
      loginData.append('username', email);
      loginData.append('password', password);

      const loginRes = await api.post('/login', loginData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { access_token } = loginRes.data;
      await AsyncStorage.setItem('token', access_token);
      console.log("Passo B concluído: Token armazenado.");

      // 5. PASSO C: Criar Perfil Específico
      console.log(isPro ? "Criando Perfil Professor..." : "Criando Perfil Aluno...");
      if (isPro) {
        await api.post('/professores', { cref: cref });
      } else {
        await api.post('/alunos', { objetivo: "Meu primeiro acesso via App" });
      }
      console.log("Passo C concluído: Perfil vinculado.");

      // 6. Sucesso Final
      Alert.alert("Sucesso!", "Conta e perfil criados com sucesso.");
      router.replace('/home');

    } catch (error: any) {
      // --- BLOCO DE DIAGNÓSTICO DE ERROS ---
      console.log("--- ERRO NO CADASTRO ---");
      
      if (!error.response) {
        // Erro de Rede (O App não achou o servidor)
        console.error("Erro de conexão (Network Error). Verifique o IP no api.ts");
        Alert.alert(
          "Erro de Conexão", 
          "O App não conseguiu falar com o servidor. Verifique se o IP no api.ts é o IP atual da sua máquina (ipconfig)."
        );
      } else {
        // Erro vindo do Backend (400, 422, 500)
        const status = error.response.status;
        const detail = error.response.data?.detail || "Erro desconhecido";
        
        console.error(`Backend retornou Erro ${status}:`, detail);
        
        if (status === 422) {
          Alert.alert("Erro de Validação (422)", "O backend não aceitou os dados. Verifique se a data está no formato YYYY-MM-DD.");
        } else if (status === 400) {
          Alert.alert("Usuário já existe", "Este e-mail já está cadastrado no sistema.");
        } else {
          Alert.alert(`Erro ${status}`, detail);
        }
      }
    }
  }

  function validateDobFormat(dobStr: string) {
    if (!dobStr || dobStr.trim() === '') return 'Data de nascimento é obrigatória.';
    const re = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const m = dobStr.match(re);
    if (!m) return 'Formato inválido. Use DD/MM/AAAA.';
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return 'Data inválida.';
    const now = new Date();
    if (d > now) return 'Data de nascimento não pode ser no futuro.';
    const age = now.getFullYear() - year - (now.getMonth() < (month - 1) || (now.getMonth() === (month - 1) && now.getDate() < day) ? 1 : 0);
    if (age < 10) return 'Idade mínima: 10 anos.';
    if (age > 120) return 'Idade inválida.';
    return '';
  }


  function validateEmailFormat(e: string) {
    if (!e || e.trim() === '') return 'E-mail é obrigatório.';
    // simple email regex
    // eslint-disable-next-line no-useless-escape
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
    return re.test(e) ? '' : 'E-mail inválido.';
  }

  function validateAll() {
    let ok = true;

    const n = name.trim();
    if (!n) {
      setNameError('Nome obrigatório.');
      ok = false;
    } else if (n.length < 2) {
      setNameError('Nome muito curto.');
      ok = false;
    } else setNameError('');

    const em = validateEmailFormat(email.trim());
    if (em) {
      setEmailError(em);
      ok = false;
    } else setEmailError('');

    const lg = login.trim();
    if (!lg) {
      setLoginError('Login obrigatório.');
      ok = false;
    } else if (lg.length < 3) {
      setLoginError('Login muito curto.');
      ok = false;
    } else setLoginError('');

    if (!password || password.length < 6) {
      setPasswordError('Senha mínima de 6 caracteres.');
      ok = false;
    } else setPasswordError('');

    if (isPro) {
      if (!cref || cref.trim() === '') {
        setCrefError('CREF obrigatório para professores.');
        ok = false;
      } else setCrefError('');
    } else setCrefError('');

    const dErr = validateDobFormat(dob);
    if (dErr) {
      setDobError(dErr);
      ok = false;
    } else setDobError('');

    return ok;
  }

  function formatDobInput(input: string) {
    // remove non-digits
    const digits = input.replace(/\D/g, '').slice(0, 8); // DDMMYYYY
    const parts = [];
    if (digits.length >= 2) {
      parts.push(digits.slice(0, 2));
      if (digits.length >= 4) {
        parts.push(digits.slice(2, 4));
        if (digits.length > 4) parts.push(digits.slice(4));
      } else if (digits.length > 2) {
        parts.push(digits.slice(2));
      }
    } else if (digits.length > 0) {
      parts.push(digits);
    }
    return parts.join('/');
  }

  function handleDobChange(text: string) {
    const masked = formatDobInput(text);
    setDob(masked);

    // if full date, validate not future immediately
    if (masked.length === 10) {
      const err = validateDobFormat(masked);
      if (err) setDobError(err);
      else setDobError('');
    } else {
      setDobError('');
    }
  }
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
              <View style={[styles.inputRow, { borderColor: nameError ? colors.red : 'transparent', borderWidth: nameError ? 1 : 0 }]}>
                <Ionicons name="person" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={(t) => { setName(t); if (nameError) setNameError(''); }}
                />
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

              <View style={[styles.inputRow, { marginTop: 12, borderColor: emailError ? colors.red : 'transparent', borderWidth: emailError ? 1 : 0 }]}>
                <Ionicons name="mail" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
                  keyboardType="email-address"
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              <View style={[styles.inputRow, { marginTop: 12, borderColor: dobError ? colors.red : 'transparent', borderWidth: dobError ? 1 : 0 }]}>
                <Ionicons name="calendar" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Data de Nascimento (DD/MM/AAAA)"
                  placeholderTextColor="#666"
                  value={dob}
                  onChangeText={handleDobChange}
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                />
              </View>
              {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}

              <View style={[styles.inputRow, { marginTop: 12, borderColor: loginError ? colors.red : 'transparent', borderWidth: loginError ? 1 : 0 }]}>
                <Ionicons name="person" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Login"
                  placeholderTextColor="#666"
                  value={login}
                  onChangeText={(t) => { setLogin(t); if (loginError) setLoginError(''); }}
                />
              </View>
              {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

              <View style={[styles.inputRow, { marginTop: 12, borderColor: passwordError ? colors.red : 'transparent', borderWidth: passwordError ? 1 : 0 }]}>
                <MaterialIcons name="lock-outline" size={20} color="#333" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#666"
                  secureTextEntry={!visible}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }}
                />
                <TouchableOpacity
                  onPress={() => setVisible((v) => !v)}
                  accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
                  style={styles.rightIconTouch}
                >
                  <Ionicons name={visible ? 'eye' : 'eye-off'} size={20} color="#333" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

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
                <View style={[styles.inputRow, { marginTop: 12, borderColor: crefError ? colors.red : 'transparent', borderWidth: crefError ? 1 : 0 }]}>
                  <MaterialIcons name="badge" size={20} color="#333" style={styles.leftIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="CREF"
                    placeholderTextColor="#666"
                    value={cref}
                    onChangeText={(t) => { setCref(t); if (crefError) setCrefError(''); }}
                  />
                </View>
              )}
              {crefError ? <Text style={styles.errorText}>{crefError}</Text> : null}
            </View>

            <TouchableOpacity
  style={styles.button}
  activeOpacity={0.85}
  accessibilityRole="button"
  onPress={handleRegister} // <--- Agora o botão chama a função correta que faz o POST
>
  <Text style={styles.buttonText}>Registrar</Text> 
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

  errorText: {
    color: colors.red,
    marginTop: 6,
    alignSelf: 'flex-start',
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

