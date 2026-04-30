import 'react-native-reanimated';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments } from 'expo-router'; 
import { StatusBar } from 'expo-status-bar';
import '../globals.css';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import Animated, { FadeInDown } from 'react-native-reanimated'; 

export default function RootLayout() {
  const segments = useSegments(); 
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Anton: require('../assets/fonts/Anton-Regular.ttf'),
    AntonSC: require('../assets/fonts/AntonSC-Regular.ttf'),
  });

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#000', 
    },
  };

  useEffect(() => {
    if (!fontsLoaded) return;

    const checkAuth = async () => {
      try {
        // --- DICA: Se o app travar na Home, descomente a linha abaixo uma vez, salve e rode ---
        // await AsyncStorage.removeItem('token'); 

        const token = await AsyncStorage.getItem('token');
        const publicRoutes = ['welcome', 'login', 'register', 'presentation'];
        
        // Verifica se a rota atual está na lista de rotas públicas
        const isPublicRoute = publicRoutes.includes(segments[0] as string);

        if (!token && !isPublicRoute) {
          // 1. Não tem token e tentou entrar em rota privada -> Welcome
          router.replace('/welcome');
        } 
        else if (token && segments[0] === 'welcome') {
          // 2. Tem token e está no Welcome -> Home (Auto-login)
          // Mudamos aqui para SÓ redirecionar se estiver no 'welcome',
          // permitindo que você entre em /login ou /register se quiser.
          router.replace('/home');
        }
        
        setIsReady(true);
      } catch (e) {
        console.error("Erro no checkAuth:", e);
        setIsReady(true);
      }
    };

    checkAuth();
  }, [fontsLoaded]);

  if (!fontsLoaded || !isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  return (
    <ThemeProvider value={CustomDarkTheme}>
      <View style={{ flex: 1, backgroundColor: '#000' }}> 
        <Animated.View 
          entering={FadeInDown.duration(200)} 
          style={{ flex: 1 }}
        >
          <Slot />
        </Animated.View>
      </View>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}