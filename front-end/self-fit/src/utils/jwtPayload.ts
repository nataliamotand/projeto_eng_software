/**
 * Lê o payload do JWT (sem validar assinatura) — apenas para UI após login.
 */
export type SelfFitJwtPayload = {
  sub?: string;
  perfil?: string;
  exp?: number;
};

export function parseJwtPayload(token: string): SelfFitJwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) base64 += '='.repeat(4 - pad);
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as SelfFitJwtPayload;
  } catch {
    return null;
  }
}
