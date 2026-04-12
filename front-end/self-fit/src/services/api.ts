import axios from 'axios';

// emulador Android (Android Studio), o localhost do PC é 'http://10.0.2.2:8000'
// emulador iOS ou na Web, é 'http://127.0.0.1:8000'
// Expo Go, têm de colocar o IP da máquina onde o Back-end está a correr (ex: 'http://192.168.1.100:8000')

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 10000,
});

export default api;