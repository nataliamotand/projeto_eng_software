import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import "../globals.css";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slides = [
    {
      id: 0,
      tag: "BIOMETRICS & PERFORMANCE",
      title: "SELF-FIT",
      content: "Engenharia de Dados aplicada à performance humana de alto nível.",
      showLogo: true,
    },
    {
      id: 1,
      tag: "O GAP DA PERFORMANCE",
      title: "O PROBLEMA",
      content: "A desconexão entre prescrição e evolução real gera estagnação.",
    },
    {
      id: 2,
      tag: "ARQUITETURA REATIVA",
      title: "A ENGENHARIA",
      content: "FastAPI, Neon PostgreSQL e React Native: um ecossistema integrado.",
    },
    {
      id: 3,
      tag: "INSIGHTS",
      title: "O DASHBOARD",
      content: "Visualização reativa de PRs e composição corporal em tempo real.",
    },
  ];

  const animateTo = (index: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentSlide(index);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const next = () => currentSlide < slides.length - 1 && animateTo(currentSlide + 1);
  const prev = () => currentSlide > 0 && animateTo(currentSlide - 1);

  useEffect(() => {
    if (isWeb) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === ' ') next();
        if (e.key === 'ArrowLeft') prev();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [currentSlide]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View className="flex-1 items-center justify-between py-12 px-6">
        
        {/* PROGRESSO (TOP) */}
        <View className="flex-row gap-3">
          {slides.map((_, i) => (
            <View 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-20 bg-red-600' : 'w-8 bg-zinc-800'}`} 
            />
          ))}
        </View>

        {/* CONTAINER CENTRAL (FIXO) */}
        <Animated.View 
          style={{ opacity: fadeAnim, width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' }}
        >
          {/* LOGO AJUSTADA */}
          {slides[currentSlide].showLogo && (
            <View className="mb-8 items-center">
              <Image 
                source={require('../assets/images/logo.png')} 
                style={{ width: 180, height: 80 }}
                resizeMode="contain" 
              />
            </View>
          )}

          {/* CARD PREMIUM (CAMADAS) */}
          <LinearGradient
            colors={['#0f0f0f', '#000']}
            className="w-full max-w-3xl p-10 md:p-14 rounded-[40px] border border-zinc-900 shadow-2xl items-center"
            style={{ 
              shadowColor: '#CC0000',
              shadowOffset: { width: 0, height: 10 },
              shadowRadius: 30,
              shadowOpacity: 0.15 
            }}
          >
            <Text className="text-zinc-500 font-bold tracking-[6px] text-[10px] uppercase mb-4">
              {slides[currentSlide].tag}
            </Text>
            
            <Text className="text-red-600 font-black text-6xl md:text-8xl tracking-tighter text-center">
              {slides[currentSlide].title}
            </Text>

            <View className="h-1.5 w-20 bg-red-600 my-10 rounded-full shadow-lg shadow-red-900" />
            
            <Text className="text-zinc-400 text-lg md:text-xl text-center leading-relaxed font-medium max-w-xl">
              {slides[currentSlide].content}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* CONTROLES (FIXOS NO RODAPÉ) */}
        <View className="w-full max-w-5xl flex-row justify-between items-center px-6">
          <TouchableOpacity 
            onPress={prev} 
            className={`p-6 rounded-full border border-zinc-900 ${currentSlide === 0 ? 'opacity-0' : 'bg-zinc-950 shadow-xl'}`}
          >
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          
          <View className="items-center">
            <Text className="text-zinc-800 font-black text-xl italic tracking-tighter">
              {currentSlide + 1} / {slides.length}
            </Text>
            <Text className="text-zinc-900 text-[10px] font-bold mt-1 tracking-[4px] uppercase">Self-Fit Engine</Text>
          </View>

          <TouchableOpacity 
            onPress={next} 
            className={`p-6 rounded-full border border-zinc-900 ${currentSlide === slides.length - 1 ? 'opacity-0' : 'bg-zinc-950 shadow-xl'}`}
          >
            <Ionicons name="chevron-forward" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}