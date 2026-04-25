import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments } from 'expo-router'; // Hooks para navegação e rotas
import { StatusBar } from 'expo-status-bar';
import '../globals.css';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import para checar o token 

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'app',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments(); // Identifica em qual página o usuário está 
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // 1. Carregamento de Fontes 
  const [fontsLoaded] = useFonts({
    Anton: require('../assets/fonts/Anton-Regular.ttf'),
    AntonSC: require('../assets/fonts/AntonSC-Regular.ttf'),
  });

  // 2. Lógica de Proteção de Rotas
  useEffect(() => {
    if (!fontsLoaded) return;

    const checkAuth = async () => {
      try {
        // Busca o token que definimos no logout e login 
        const token = await AsyncStorage.getItem('token');
        
        // Define quais rotas são PÚBLICAS (usuário deslogado pode ver)
        const publicRoutes = ['welcome', 'login', 'register', 'presentation'];
        
        // Verifica se a rota atual é pública baseada nos segmentos da URL [cite: 676, 679, 680]
        const isPublicRoute = publicRoutes.includes(segments[0] as string);

        if (!token && !isPublicRoute) {
          // Se não tem token e tentou acessar algo privado (ex: /home), manda para Welcome
          router.replace('/welcome');
        } else if (token && isPublicRoute && segments[0] !== 'presentation') {
          // Opcional: Se já está logado e tentou ir para o Login, manda para a Home
          // Mantemos 'presentation' livre para você poder apresentar o projeto logada
          router.replace('/home');
        }
        
        setIsReady(true);
      } catch (e) {
        console.error("Erro na proteção de rotas", e);
        setIsReady(true);
      }
    };

    checkAuth();
  }, [segments, fontsLoaded]); // Executa sempre que o usuário mudar de página

  // Enquanto as fontes carregam ou a auth é checada, mostra o Loading 
  if (!fontsLoaded || !isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}