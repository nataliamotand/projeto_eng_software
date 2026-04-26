import { Redirect } from 'expo-router';

/**
 * Ponto de entrada do App.
 * O Redirect aciona o RootLayout, que por sua vez decide se
 * o usuário vai para /welcome ou /home baseado no token.
 */
export default function Index() {
  return <Redirect href="/welcome" />;
}