import 'react-native-reanimated';
import { DarkTheme, ThemeProvider } from '@react-navigation/native'; // Usaremos apenas o DarkTheme
import { Slot, useRouter, useSegments } from 'expo-router'; 
import { StatusBar } from 'expo-status-bar';
import '../globals.css';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import Animated, { FadeIn, SlideInRight, SlideInDown, ZoomIn, FadeInDown } from 'react-native-reanimated'; 

export default function RootLayout() {
  const segments = useSegments(); 
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Anton: require('../assets/fonts/Anton-Regular.ttf'),
    AntonSC: require('../assets/fonts/AntonSC-Regular.ttf'),
  });

  // Criamos um tema customizado para garantir fundo preto total
  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#000', // Mata o branco na raiz do navegação
    },
  };

  useEffect(() => {
    if (!fontsLoaded) return;
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const publicRoutes = ['welcome', 'login', 'register', 'presentation'];
        const isPublicRoute = publicRoutes.includes(segments[0] as string);

        if (!token && !isPublicRoute) {
          router.replace('/welcome');
        } else if (token && isPublicRoute && segments[0] !== 'presentation') {
          router.replace('/home');
        }
        setIsReady(true);
      } catch (e) {
        setIsReady(true);
      }
    };
    checkAuth();
  }, [segments, fontsLoaded]);

  if (!fontsLoaded || !isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  return (
    <ThemeProvider value={CustomDarkTheme}>
      {/* View preta fixa por trás de tudo para evitar o flash */}
      <View style={{ flex: 1, backgroundColor: '#000' }}> 
        <Animated.View 
          key={segments.join('-')} 
          entering={FadeInDown.duration(200)} // Reduzi para 400ms para ser mais rápido e menos perceptível
          style={{ flex: 1 }}
        >
          <Slot />
        </Animated.View>
      </View>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}