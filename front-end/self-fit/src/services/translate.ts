// Simple translation helper with in-memory cache.
// Uses LibreTranslate public instance as a fallback. For production, provide
// an API key and/or private instance and set the URL in an env var.

const CACHE = new Map<string, string>();

export async function translateText(text: string, target = 'pt'): Promise<string> {
  if (!text) return text;
  const key = `${text}::${target}`;
  if (CACHE.has(key)) return CACHE.get(key) as string;

  // Try multiple public translation endpoints (best-effort). For production,
  // replace with a paid provider and inject API keys via .env.
  const endpoints = [
    'https://libretranslate.de/translate',
    'https://libretranslate.com/translate',
    'https://translate.argosopentech.com/translate',
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'en', target, format: 'text' }),
      });

      const raw = await res.text();
      if (!raw || raw.trim().startsWith('<')) {
        console.warn(`translateText: non-JSON response from ${url}`);
        continue;
      }

      let json: any = null;
      try {
        json = JSON.parse(raw);
      } catch (parseErr) {
        console.warn(`translateText: JSON parse failed from ${url}`, parseErr);
        continue;
      }

      const translated = (json?.translatedText || json?.translated || json?.result || json?.data || '').toString();
      if (translated && translated.length > 0) {
        CACHE.set(key, translated);
        return translated;
      }
    } catch (err) {
      console.warn('translateText: request failed', err);
      continue;
    }
  }

  // Fallback: local dictionary mapping for common exercise terms
  const local = localTranslate(text);
  CACHE.set(key, local);
  return local;
}

function localTranslate(input: string): string {
  const dict: Record<string, string> = {
    squat: 'Agachamento',
    squatting: 'Agachamento',
    'barbell squat': 'Agachamento com Barra',
    'smith squat': 'Agachamento no Smith',
    bench: 'Supino',
    'bench press': 'Supino',
    deadlift: 'Levantamento Terra',
    lunge: 'Avanço',
    'shoulder press': 'Desenvolvimento de Ombro',
    'overhead press': 'Desenvolvimento',
    row: 'Remada',
    'pull-up': 'Barra Fixa',
    'pull up': 'Barra Fixa',
    'chin-up': 'Barra (Pegada Supinada)',
    'push-up': 'Flexão',
    'bicep curl': 'Rosca Bíceps',
    'tricep extension': 'Extensão de Tríceps',
    'leg press': 'Leg Press',
    'leg curl': 'Flexora',
    'leg extension': 'Extensora',
    'calf raise': 'Elevação de Gémeos',
    'hip thrust': 'Elevação de Quadril',
    'glute bridge': 'Ponte para Glúteos',
    'shoulder': 'Ombro',
    'chest': 'Peito',
    'back': 'Costas',
    'core': 'Core',
    'abs': 'Abdominais',
    'hamstring': 'Posterior de Coxa',
    'quad': 'Quadríceps',
    'glutes': 'Glúteos',
    machine: 'Máquina',
    smith: 'Smith',
    dumbbell: 'Halteres',
    barbell: 'Barra',
  };

  const lower = input.toLowerCase().trim();
  if (dict[lower]) return dict[lower];

  const tokens = lower.split(/[^a-z0-9]+/i).filter(Boolean);
  const mapped: string[] = [];
  for (const t of tokens) {
    if (dict[t]) mapped.push(dict[t]);
    else mapped.push(t.charAt(0).toUpperCase() + t.slice(1));
  }
  return mapped.join(' ');
}
