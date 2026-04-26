import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import "../globals.css";

const isWeb = Platform.OS === 'web';

export default function Presentation() {
  const [mode, setMode] = useState<'GERAL' | 'MONITOR'>('GERAL');
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Slides para Apresentação Geral (Foco em IA e Experiência)
  const slidesGeral = [
    { id: 0, tag: "PITCH INICIAL", title: "SELF-FIT", content: "Demonstração do sistema e visão geral do projeto." },
    { id: 1, tag: "USO DE IA", title: "EXPERIÊNCIA", content: "Pontos positivos: Agilidade no boilerplate. Negativos: Alucinações em queries SQL complexas." },
    { id: 2, tag: "PROMPTS", title: "ENGENHARIA", content: "Uso de Few-Shot e Chain-of-Thought. +200 prompts estruturados para lógica de PRs." },
    { id: 3, tag: "DESAFIOS", title: "OBSTÁCULOS", content: "Sincronização de tipos entre FastAPI e TS. Sucesso: Dashboard reativo em tempo recorde." },
    { id: 4, tag: "MÉTRICAS", title: "IA & EQUIPE", content: "Cerca de 60% do código gerado ou refinado por agentes de IA. Trabalho híbrido homem-máquina." },
    { id: 5, tag: "ENCERRAMENTO", title: "PARECER FINAL", content: "A IA não substitui a engenharia, mas eleva o teto do que um desenvolvedor solo pode entregar." },
  ];

  // Slides para o Monitor (Foco em Implementação e Arquitetura)
  const slidesMonitor = [
    { id: 0, tag: "TECH STACK", title: "ARQUITETURA", content: "FastAPI (Uvicorn), PostgreSQL (Neon) e Interface em Expo/NativeWind." },
    { id: 1, tag: "BACK-END", title: "ENDPOINTS & API", content: "Explicação dos modelos Pydantic e lógica de Upsert para biometria." },
    { id: 2, tag: "DATABASE", title: "TABELAS & SQL", content: "Normalização das tabelas de Evolução e Recordes Pessoais (PRs)." },
    { id: 3, tag: "FRONT-END", title: "COMPONENTES", content: "Estrutura de hooks customizados para consumo da API e gestão de estado global." },
    { id: 4, tag: "BUSINESS LOGIC", title: "REGRAS DE NEGÓCIO", content: "Cálculo de volume de treino e validação de timestamps no banco de dados." },
  ];

  const currentSlides = mode === 'GERAL' ? slidesGeral : slidesMonitor;

  const animateTo = (index: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setCurrentSlide(index);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const next = () => currentSlide < currentSlides.length - 1 && animateTo(currentSlide + 1);
  const prev = () => currentSlide > 0 && animateTo(currentSlide - 1);

  const switchMode = (newMode: 'GERAL' | 'MONITOR') => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setMode(newMode);
      setCurrentSlide(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    if (isWeb) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === ' ') next();
        if (e.key === 'ArrowLeft') prev();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [currentSlide, mode]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      {/* SELETOR CLEAN NO TOPO */}
      <View className="flex-row justify-center pt-10 gap-6 z-50">
        <TouchableOpacity onPress={() => switchMode('GERAL')} className={`pb-2 border-b-2 ${mode === 'GERAL' ? 'border-red-600' : 'border-transparent'}`}>
          <Text className={`font-bold tracking-widest text-[10px] ${mode === 'GERAL' ? 'text-white' : 'text-zinc-600'}`}>APRESENTAÇÃO GERAL</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => switchMode('MONITOR')} className={`pb-2 border-b-2 ${mode === 'MONITOR' ? 'border-red-600' : 'border-transparent'}`}>
          <Text className={`font-bold tracking-widest text-[10px] ${mode === 'MONITOR' ? 'text-white' : 'text-zinc-600'}`}>ARQUITETURA & MONITOR</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-between py-12 px-6">
        <View className="flex-row gap-3">
          {currentSlides.map((_, i) => (
            <View key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-16 bg-red-600' : 'w-6 bg-zinc-900'}`} />
          ))}
        </View>

        <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          {currentSlide === 0 && mode === 'GERAL' && (
            <View className="mb-10">
              <Image source={require('../assets/images/logo.png')} style={{ width: 160, height: 70 }} resizeMode="contain" />
            </View>
          )}

          <LinearGradient colors={['#0f0f0f', '#000']} className="w-full max-w-4xl p-10 md:p-16 rounded-[40px] border border-zinc-900 items-center">
            <Text className="text-zinc-600 font-bold tracking-[6px] text-[10px] uppercase mb-4">{currentSlides[currentSlide].tag}</Text>
            <Text className="text-red-600 font-black text-6xl md:text-8xl tracking-tighter text-center italic">{currentSlides[currentSlide].title}</Text>
            <View className="h-1.5 w-20 bg-red-600 my-10 rounded-full shadow-lg shadow-red-900" />
            <Text className="text-zinc-400 text-lg md:text-xl text-center leading-relaxed font-medium max-w-2xl">{currentSlides[currentSlide].content}</Text>
          </LinearGradient>
        </Animated.View>

        <View className="w-full max-w-5xl flex-row justify-between items-center px-6">
          <TouchableOpacity onPress={prev} className={`p-6 rounded-full border border-zinc-900 ${currentSlide === 0 ? 'opacity-0' : 'bg-zinc-950 shadow-xl'}`}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-zinc-800 font-black text-xl italic">{currentSlide + 1} / {currentSlides.length}</Text>
            <Text className="text-zinc-900 text-[10px] font-bold mt-1 tracking-[4px] uppercase">{mode}</Text>
          </View>
          <TouchableOpacity onPress={next} className={`p-6 rounded-full border border-zinc-900 ${currentSlide === currentSlides.length - 1 ? 'opacity-0' : 'bg-zinc-950 shadow-xl'}`}>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}