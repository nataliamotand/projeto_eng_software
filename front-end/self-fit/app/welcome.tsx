import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient'; // Adiciona profundidade
import { colors } from '../src/components/ui/theme'; // Mantém consistência com o perfil

const { width, height } = Dimensions.get('window');

export default function Welcome(): JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* CAMADA 1: LOGO CENTRALIZADA */}
      <View style={styles.top}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />
      </View>

      {/* CAMADA 2: TYPOGRAPHY (ESTILO CANVA) */}
      <View style={styles.middle}>
        <Text style={styles.brandTitle}>SELF-FIT</Text>
        <Text style={styles.title}>Transforme seu treino.</Text>
        <Text style={styles.subtitle}>
          Acompanhe sua evolução ou a de seus alunos de forma simples e eficiente.
        </Text>
      </View>

      {/* CAMADA 3: BOTÕES DE AÇÃO UNIFICADOS */}
      <View style={styles.bottom}>
        
        {/* AÇÃO PRIMÁRIA: CADASTRO UNIFICADO */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.primaryButtonContainer}
          onPress={() => router.push('/register')}
        >
          <LinearGradient
            colors={[colors.red, '#990000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.primaryButtonText}>CRIAR MINHA CONTA</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* AÇÃO SECUNDÁRIA: LOGIN EM DESTAQUE */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.secondaryButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.secondaryButtonText}>JÁ TENHO UMA CONTA</Text>
        </TouchableOpacity>

        <Text style={styles.footerVersion}>Self-Fit</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000', // Força o Dark Mode
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
    marginTop: height * 0.08,
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  middle: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  brandTitle: {
    fontFamily: 'Anton', // Fonte carregada no RootLayout
    color: colors.white,
    fontSize: 64,
    letterSpacing: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.lightGray,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
    maxWidth: '85%',
  },
  bottom: {
    paddingHorizontal: 25,
    paddingBottom: height * 0.08,
    alignItems: 'center',
    gap: 16,
  },
  primaryButtonContainer: {
    width: '100%',
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    // Sombra premium para elevar a camada
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  gradientButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.5,
  },
  secondaryButton: {
    width: '100%',
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1A1A1A', // Bordas sutis para acabamento premium
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  footerVersion: {
    color: '#222',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 20,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});