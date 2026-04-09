import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const colors = {
  background: '#000000',
  red: '#CC0000',
  darkGray: '#1A1A1A',
  white: '#FFFFFF',
  lightGray: '#CFCFCF',
};

export default function Welcome(): JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.top}>
        <Image source={require('../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
      </View>

      <View style={styles.middle}>
        <Text style={styles.title}>Transforme seu treino.</Text>
        <Text style={styles.subtitle}>
          Acompanhe sua evolução ou a de seus alunos de forma simples e eficiente.
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            // navigate to register with role=STUDENT
            router.push('/register?role=STUDENT');
          }}
        >
          <View style={styles.buttonInner}>
            <MaterialCommunityIcons name="dumbbell" size={18} color={colors.white} />
            <Text style={styles.primaryButtonText}>Começar como Aluno</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            // navigate to register with role=TEACHER
            router.push('/register?role=TEACHER');
          }}
        >
          <View style={styles.buttonInner}>
            <FontAwesome name="users" size={16} color={colors.white} />
            <Text style={styles.secondaryButtonText}>Começar como Personal / Professor</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    marginTop: 8,
  },
  logoImage: {
    width: Math.min(420, width * 0.7),
    height: Math.max(120, height * 0.15),
  },
  middle: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.lightGray,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: Math.max(32, height * 0.05),
  },
  primaryButton: {
    backgroundColor: colors.red,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '800',
    marginLeft: 10,
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: colors.darkGray,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.white,
    marginLeft: 10,
    fontSize: 15,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: { color: colors.lightGray },
  loginLink: { color: colors.red, fontWeight: '700', textDecorationLine: 'underline' },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: Math.max(8, height * 0.02),
  },
  footerText: { color: colors.lightGray, fontSize: 12 },
});
