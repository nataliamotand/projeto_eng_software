import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../src/components/ui/theme';

const { width, height } = Dimensions.get('window');

const BENEFITS = [
  {
    id: 1,
    title: "Sua melhor versão começa aqui",
    description: "Monitore sua evolução com dados precisos e alcance seus objetivos mais rápido.",
    image: require('../assets/images/banner1.jpg'), 
  },
  {
    id: 2,
    title: "Performance sob controle",
    description: "Visualize seus recordes pessoais e domine sua performance com métricas de elite.",
    image: require('../assets/images/banner2.jpg'),
  },
  {
    id: 3,
    title: "Conexão total com seu treino",
    description: "Integre-se ao seu personal e receba prescrições dinâmicas direto no seu app.",
    image: require('../assets/images/banner3.jpg'), 
  },
];

export default function Welcome(): JSX.Element {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setActiveIndex((prev) => (prev + 1) % BENEFITS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      });
    }, 5000); 

    return () => clearInterval(interval);
  }, [activeIndex]);

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* BANNER CARROSSEL COM PADDING E ESTRUTURA INTEGRADA */}
      <View style={styles.carouselWrapper}>
        <Animated.View style={[styles.bannerCard, { opacity: fadeAnim }]}>
          <Image 
            source={BENEFITS[activeIndex].image} 
            style={styles.bannerImage} 
            resizeMode="cover" 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
            style={styles.bannerGradient}
          />
          <View style={styles.bannerTextOverlay}>
            <Text style={styles.bannerTitle}>{BENEFITS[activeIndex].title}</Text>
            <Text style={styles.bannerDescription}>{BENEFITS[activeIndex].description}</Text>
          </View>
        </Animated.View>
        
        <View style={styles.dotsRow}>
          {BENEFITS.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex ? styles.activeDot : null]} />
          ))}
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.brandSection}>
          <Image source={require('../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.brandTitle}>SELF-FIT</Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.primaryButtonContainer}
            onPress={() => router.push('/register')}
          >
            <LinearGradient
              colors={[colors.red, '#800000']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.primaryButtonText}>CRIAR MINHA CONTA</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.secondaryButtonText}>JÁ TENHO UMA CONTA</Text>
          </TouchableOpacity>

          <Text style={styles.footerVersion}>Self-Fit</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  
  // Ajuste do Carrossel (Padding e Estrutura)
  carouselWrapper: {
    height: height * 0.38,
    paddingHorizontal: 20, // Respiro lateral para o card não bater na tela
    marginTop: 20,
  },
  bannerCard: {
    flex: 1,
    borderRadius: 32, // Bordas arredondadas premium
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  bannerImage: { 
    width: '100%', 
    height: '100%', 
    opacity: 0.6 
  },
  bannerGradient: { ...StyleSheet.absoluteFillObject },
  bannerTextOverlay: {
    position: 'absolute',
    bottom: 25,
    paddingHorizontal: 20,
  },
  bannerTitle: { 
    color: '#FFF', 
    fontSize: 26, 
    fontWeight: '900', 
    fontFamily: 'Anton', // Referenciada no RootLayout
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bannerDescription: { 
    color: colors.lightGray, 
    fontSize: 14, 
    marginTop: 6, 
    lineHeight: 20,
    fontWeight: '500',
    maxWidth: '90%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 15,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#333' },
  activeDot: { width: 18, backgroundColor: colors.red },

  // Conteúdo Principal
  mainContent: { flex: 1, justifyContent: 'space-around', paddingVertical: 20 },
  brandSection: { alignItems: 'center' },
  logoImage: { width: 70, height: 70 },
  brandTitle: { fontFamily: 'Anton', color: colors.white, fontSize: 36, letterSpacing: 6, marginTop: 5 },
  
  actionSection: { paddingHorizontal: 25, gap: 12 },
  primaryButtonContainer: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  gradientButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.white, fontWeight: '900', fontSize: 16, letterSpacing: 2 },
  secondaryButton: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: '#666', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  footerVersion: { textAlign: 'center', color: '#1A1A1A', fontSize: 10, fontWeight: 'bold', marginTop: 10, letterSpacing: 2 },
});