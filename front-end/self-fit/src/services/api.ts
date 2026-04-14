import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  // Se estiver testando no emulador Android, use 'http://10.0.2.2:8000'
  // Se estiver no navegador/iOS, 'http://127.0.0.1:8000' está correto
  baseURL: 'http://127.0.0.1:8000', 
});

// O Interceptor: Ele garante que toda requisição saia com o crachá (Token)
api.interceptors.request.use(
  async (config) => {
    try {
      // BUSCA: A chave deve ser exatamente 'token' (conforme o novo login.tsx)
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Erro ao buscar token no AsyncStorage", error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;