import { Redirect } from 'expo-router';

/**
 * Este é o ponto de entrada (rota "/") da sua aplicação.
 * Como o fluxo do Self-Fit deve começar sempre pelo Welcome, 
 * usamos o Redirect para encaminhar o usuário automaticamente.
 */
export default function Index() {
  return <Redirect href="/welcome" />;
}