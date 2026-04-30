import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router'; // Import necessário para o redirecionamento

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// 1. Interceptor de REQUISIÇÃO (Já implementado)
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Erro ao buscar token no AsyncStorage", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. O NOVO Interceptor de RESPOSTA (Tratamento de erro 401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Se o servidor responder 401, o token é inválido ou expirou
    if (error.response && error.response.status === 401) {
      // Não redireciona se o 401 veio da própria tela de login (senha errada)
      const isLoginRequest = error.config?.url?.includes('/login');
      if (!isLoginRequest) {
        try {
          await AsyncStorage.removeItem('token');
          router.replace('/welcome');
        } catch (e) {
          console.error("Erro ao limpar sessão expirada", e);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;