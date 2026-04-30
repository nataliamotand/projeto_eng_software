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
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Infraestrutura
import api from '../src/services/api';
import { colors } from '../src/components/ui/theme';

const { height, width } = Dimensions.get('window');

export default function Register(){
  const router = useRouter();
  const params = useLocalSearchParams ? useLocalSearchParams() : {};

  // --- ESTADOS DE DADOS ---
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [cref, setCref] = useState<string>('');

  // --- ESTADOS DE ERRO ---
  const [nameError, setNameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [crefError, setCrefError] = useState<string>('');
  const [dobError, setDobError] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const role = (params as any).role;
    if (role === 'TEACHER') setIsPro(true);
  }, [params]);

  // --- FUNÇÕES DE VALIDAÇÃO (DO NOVO) ---
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
    return '';
  }

  function validateEmailFormat(e: string) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
    return re.test(e) ? '' : 'E-mail inválido.';
  }

  function validateAll() {
    let ok = true;
    if (!name.trim() || name.length < 2) { setNameError('Nome inválido.'); ok = false; } else setNameError('');
    if (validateEmailFormat(email.trim())) { setEmailError('E-mail inválido.'); ok = false; } else setEmailError('');
    if (!password || password.length < 6) { setPasswordError('Senha mínima de 6 caracteres.'); ok = false; } else setPasswordError('');
    if (isPro && (!cref || cref.trim() === '')) { setCrefError('CREF obrigatório.'); ok = false; } else setCrefError('');
    const dErr = validateDobFormat(dob);
    if (dErr) { setDobError(dErr); ok = false; } else setDobError('');
    return ok;
  }

  // --- MÁSCARA DE DATA (DO ANTIGO) ---
  function handleDobChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    const parts = [];
    if (digits.length >= 2) {
      parts.push(digits.slice(0, 2));
      if (digits.length >= 4) {
        parts.push(digits.slice(2, 4));
        if (digits.length > 4) parts.push(digits.slice(4));
      } else if (digits.length > 2) parts.push(digits.slice(2));
    } else if (digits.length > 0) parts.push(digits);
    
    const masked = parts.join('/');
    setDob(masked);
    if (masked.length === 10) setDobError(validateDobFormat(masked));
    else setDobError('');
  }

  // --- FUNÇÃO DE REGISTRO LINKADA ---
  async function handleRegister() {
    setFeedback(null);
    if (!validateAll()) return;
    setSubmitting(true);
    try {
      const [day, month, year] = dob.split('/');
      const dateFormatted = `${year}-${month}-${day}`;

      // A. Criar Usuário
      await api.post('/usuarios', {
        nome: name, email, senha: password,
        data_nascimento: dateFormatted,
        tipo_perfil: isPro ? 'TEACHER' : 'STUDENT',
      });

      // B. Login
      const loginData = new FormData();
      loginData.append('username', email);
      loginData.append('password', password);
      const loginRes = await api.post('/login', loginData);
      await AsyncStorage.setItem('token', loginRes.data.access_token);

      // C. Criar Perfil
      if (isPro) await api.post('/professores', { cref });
      else await api.post('/alunos', { objetivo: 'Primeiro acesso App' });

      setFeedback({ type: 'success', message: 'Conta criada com sucesso! Redirecionando...' });
      setTimeout(() => router.replace('/home'), 1500);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string' && detail.toLowerCase().includes('email')) {
        setFeedback({ type: 'error', message: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' });
      } else if (typeof detail === 'string' && detail.toLowerCase().includes('username')) {
        setFeedback({ type: 'error', message: 'Este login já está em uso. Escolha outro nome de usuário.' });
      } else if (!error.response) {
        setFeedback({ type: 'error', message: 'Sem conexão com o servidor. Verifique sua internet.' });
      } else {
        setFeedback({ type: 'error', message: detail || 'Ocorreu um erro. Tente novamente.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* BOTÃO VOLTAR */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backTouch} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={26} color={colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scroll} 
            contentContainerStyle={styles.centerContent} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.center}>
              <Image source={require('../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
              <Text style={styles.title}>REGISTRE-SE</Text>

              <View style={styles.inputWrapper}>
                {/* NOME */}
                <View style={[styles.inputRow, nameError && styles.inputError]}>
                  <Ionicons name="person" size={20} color="#333" style={styles.leftIcon} />
                  <TextInput style={styles.input} placeholder="Nome Completo" placeholderTextColor="#666" value={name} onChangeText={(t) => {setName(t); setNameError('');}} />
                </View>
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

                {/* E-MAIL */}
                <View style={[styles.inputRow, { marginTop: 12 }, emailError && styles.inputError]}>
                  <Ionicons name="mail" size={20} color="#333" style={styles.leftIcon} />
                  <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#666" value={email} onChangeText={(t) => {setEmail(t); setEmailError('');}} keyboardType="email-address" autoCapitalize="none" />
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                {/* DATA NASCIMENTO */}
                <View style={[styles.inputRow, { marginTop: 12 }, dobError && styles.inputError]}>
                  <Ionicons name="calendar" size={20} color="#333" style={styles.leftIcon} />
                  <TextInput style={styles.input} placeholder="Data de Nascimento (DD/MM/AAAA)" placeholderTextColor="#666" value={dob} onChangeText={handleDobChange} keyboardType="numeric" />
                </View>
                {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}

                {/* SENHA */}
                <View style={[styles.inputRow, { marginTop: 12 }, passwordError && styles.inputError]}>
                  <MaterialIcons name="lock-outline" size={20} color="#333" style={styles.leftIcon} />
                  <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#666" secureTextEntry={!visible} value={password} onChangeText={(t) => {setPassword(t); setPasswordError('');}} />
                  <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.rightIconTouch}>
                    <Ionicons name={visible ? 'eye' : 'eye-off'} size={20} color="#333" />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                {/* CHECKBOX PROFESSOR */}
                <View style={[styles.checkboxRow, { marginTop: 12 }]}>
                  <TouchableOpacity style={styles.checkboxTouch} onPress={() => setIsPro(!isPro)}>
                    <View style={[styles.checkbox, isPro && styles.checkboxChecked]}>
                      {isPro && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Sou Professor/Personal</Text>
                </View>

                {isPro && (
                  <View style={[styles.inputRow, { marginTop: 12 }, crefError && styles.inputError]}>
                    <MaterialIcons name="badge" size={20} color="#333" style={styles.leftIcon} />
                    <TextInput style={styles.input} placeholder="CREF" placeholderTextColor="#666" value={cref} onChangeText={(t) => {setCref(t); setCrefError('');}} />
                  </View>
                )}
                {crefError ? <Text style={styles.errorText}>{crefError}</Text> : null}
              </View>

              {/* Banner de Feedback do Servidor */}
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

              <TouchableOpacity
                style={[styles.button, submitting && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={handleRegister}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.buttonText}>Registrar</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- ESTILOS RESTAURADOS DO ANTIGO ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: '6%', paddingVertical: 12 },
  topRow: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  backTouch: { padding: 8, marginTop: 6 },
  logoImage: { width: Math.min(320, width * 0.7), height: Math.min(140, height * 0.18) },
  centerContent: { alignItems: 'center', paddingBottom: 40, flexGrow: 1 },
  center: { alignItems: 'center', width: '100%' },
  title: { color: colors.redBright, fontFamily: 'AntonSC', fontSize: 28, marginTop: 8, marginBottom: 12 },
  inputWrapper: { width: '100%', alignItems: 'center' },
  inputRow: { 
    width: '100%', backgroundColor: colors.inputBg, borderRadius: 12, 
    height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 
  },
  inputError: { borderColor: colors.red, borderWidth: 1 },
  leftIcon: { marginRight: 8 },
  input: { flex: 1, color: '#000', fontSize: 16 },
  rightIconTouch: { marginLeft: 8, padding: 6 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  checkboxTouch: { padding: 6 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: '#999', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: colors.red, borderColor: colors.red },
  checkboxLabel: { marginLeft: 8, color: colors.white },
  button: { marginTop: 20, width: '100%', alignSelf: 'stretch', height: 52, backgroundColor: colors.red, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontFamily: 'Anton', fontSize: 16 },
  errorText: { color: colors.red, marginTop: 4, alignSelf: 'flex-start', fontSize: 12 },
  scroll: { flex: 1, width: '100%' },
  feedbackBanner: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 14, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderLeftWidth: 4 },
  feedbackError: { backgroundColor: 'rgba(220,38,38,0.15)', borderLeftColor: '#dc2626' },
  feedbackSuccess: { backgroundColor: 'rgba(22,163,74,0.15)', borderLeftColor: '#16a34a' },
  feedbackText: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '600', lineHeight: 18 },
});