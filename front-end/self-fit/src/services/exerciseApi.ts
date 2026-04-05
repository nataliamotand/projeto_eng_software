// Use fetch instead of axios to avoid adding an extra dependency.
export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  gifUrl: string;
  secondaryMuscles?: string[];
  instructions?: string[];
  [key: string]: any;
}

const BASE = 'https://exercisedb.dev/api/v1';

// TODO: If an API key is required in the future, provide it via .env and include in headers here.
const defaultHeaders: Record<string, string> = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  // 'Authorization': `Bearer ${process.env.EXERCISEDB_KEY}` // example
};

async function fetchJson(path: string): Promise<any> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { headers: defaultHeaders });

  // If the API requires payment (402), fall back to a bundled local dataset
  if (res.status === 402) {
    console.warn(`exerciseApi: remote API returned 402 Payment Required, using local fallback for ${path}`);
    try {
      // dynamic import ensures bundlers include the JSON
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const mod = await import('./exerciseFallback.json');
      const fallback = mod?.default || mod;
      return fallback;
    } catch (e) {
      console.error('Failed to load local exercise fallback', e);
      const text = await res.text().catch(() => '');
      const msg = `Fetch error ${res.status} ${res.statusText} - ${text}`;
      throw new Error(msg);
    }
  }

  // Surface HTTP errors so callers can handle them instead of silently returning Response objects
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const msg = `Fetch error ${res.status} ${res.statusText} - ${text}`;
    throw new Error(msg);
  }

  // Prefer using res.json() which will parse JSON or throw if invalid
  try {
    return await res.json();
  } catch (err) {
    // fallback: try text then parse
    const text = await res.text().catch(() => '');
    try {
      return JSON.parse(text);
    } catch (e) {
      throw err;
    }
  }
}

function normalizeExercise(raw: any): Exercise {
  // The API may return different property names; map to our interface
  const id = raw.exerciseId || raw.id || raw._id || String(raw.id || raw.exerciseId || raw._id || raw.name || '');
  const name = raw.name || raw.title || '';
  const gifUrl = raw.gifUrl || raw.gif || raw.image || '';
  const target = Array.isArray(raw.targetMuscles) ? (raw.targetMuscles[0] || '') : raw.target || '';
  const bodyPart = Array.isArray(raw.bodyParts) ? (raw.bodyParts[0] || '') : raw.bodyPart || '';
  const equipment = Array.isArray(raw.equipments) ? (raw.equipments[0] || '') : raw.equipment || '';
  const secondaryMuscles = raw.secondaryMuscles || raw.secondary_muscles || [];
  const instructions = raw.instructions || [];

  return {
    id: String(id),
    name: String(name),
    bodyPart: String(bodyPart),
    equipment: String(equipment),
    target: String(target),
    gifUrl: String(gifUrl),
    secondaryMuscles,
    instructions,
    raw,
  };
}

export async function getAllExercises(limit?: number, offset?: number): Promise<Exercise[]> {
  try {
    const params: string[] = [];
    if (limit) params.push(`limit=${encodeURIComponent(String(limit))}`);
    if (offset) params.push(`offset=${encodeURIComponent(String(offset))}`);
    const query = params.length ? `?${params.join('&')}` : '';
    const json = await fetchJson(`/exercises${query}`);
    // API may return { success, data: [...] } or an array
    const items = Array.isArray(json) ? json : json?.data || json?.results || [];
    if (!Array.isArray(items)) return [];
    return items.map(normalizeExercise);
  } catch (err) {
    console.error('exerciseApi.getAllExercises error', err);
    return [];
  }
}

export async function searchExercisesByName(name: string, limit?: number): Promise<Exercise[]> {
  try {
    if (!name || name.trim() === '') return [];
    const q = encodeURIComponent(name.trim());
    const params = limit ? `?q=${q}&limit=${limit}` : `?q=${q}`;
    const json = await fetchJson(`/exercises/search${params}`);
    const items = Array.isArray(json) ? json : json?.data || json?.results || [];
    if (!Array.isArray(items)) return [];
    return items.map(normalizeExercise);
  } catch (err) {
    console.error('exerciseApi.searchExercisesByName error', err);
    return [];
  }
}

export async function getExercisesByTarget(muscle: string): Promise<Exercise[]> {
  try {
    if (!muscle || muscle.trim() === '') return [];
    const json = await fetchJson(`/muscles/${encodeURIComponent(muscle.trim())}/exercises`);
    const items = Array.isArray(json) ? json : json?.data || json?.results || [];
    if (!Array.isArray(items)) return [];
    return items.map(normalizeExercise);
  } catch (err) {
    console.error('exerciseApi.getExercisesByTarget error', err);
    return [];
  }
}

export async function getAllTargetMuscles(): Promise<string[]> {
  try {
    const json = await fetchJson('/muscles');
    const items = Array.isArray(json) ? json : json?.data || json?.results || [];
    if (!Array.isArray(items)) return [];
    // items may be strings or objects with a name property
    const muscles = items.map((it: any) => (typeof it === 'string' ? it : it.name || it.muscle || ''))
      .filter(Boolean);
    return Array.from(new Set(muscles)).sort();
  } catch (err) {
    console.error('exerciseApi.getAllTargetMuscles error', err);
    // fallback: try derive from exercises
    try {
      const all = await getAllExercises(1000);
      const set = new Set<string>();
      for (const ex of all) if (ex && ex.target) set.add(String(ex.target));
      return Array.from(set).sort();
    } catch (e) {
      return [];
    }
  }
}
