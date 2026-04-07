// Use fetch instead of axios to avoid adding an extra dependency.
export interface Exercise {
  id: string;
  name: string;
  bodyPart?: string;
  equipment?: string;
  target?: string;
  images?: string[];
  gifUrl?: string;
  secondaryMuscles?: string[];
  instructions?: string[];
  raw?: any;
  [key: string]: any;
}

// Use only the bundled fallback JSON. Build full image URLs from filenames in `images`.
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// dynamic import so bundlers include the JSON
async function loadFallback(): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const mod = await import('./exercises.json');
  const arr = mod?.default || mod || [];
  return Array.isArray(arr) ? arr : [];
}

function normalizeExercise(raw: any): Exercise {
  const id = raw.id || raw._id || raw.exerciseId || raw.name || Math.random().toString(36).slice(2);
  const name = raw.name || raw.title || '';
  // raw may contain `images` array with filenames — build full URLs
  const imagesRaw = Array.isArray(raw.images) ? raw.images : raw.images ? [raw.images] : [];
  const images = imagesRaw.map((f: string) => (typeof f === 'string' ? `${IMAGE_BASE}${f}` : '')).filter(Boolean);
  const gifUrl = images[0] || raw.gifUrl || raw.gif || raw.image || '';
  const targetCandidates = [] as string[];
  if (Array.isArray(raw.primaryMuscles)) targetCandidates.push(...raw.primaryMuscles);
  if (Array.isArray(raw.primary_muscles)) targetCandidates.push(...raw.primary_muscles);
  if (Array.isArray(raw.targetMuscles)) targetCandidates.push(...raw.targetMuscles);
  if (raw.target) targetCandidates.push(raw.target);
  if (raw.muscle) targetCandidates.push(raw.muscle);
  const target = String((targetCandidates.find(Boolean) || '')).trim();
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
    images,
    gifUrl: String(gifUrl),
    secondaryMuscles,
    instructions,
    raw,
  };
}

export async function getAllExercises(limit?: number, offset?: number): Promise<Exercise[]> {
  try {
    const all = await loadFallback();
    const items = all.slice(offset || 0, limit ? (offset || 0) + limit : undefined);
    return items.map(normalizeExercise);
  } catch (err) {
    console.error('exerciseApi.getAllExercises error', err);
    return [];
  }
}

export async function searchExercisesByName(name: string, limit?: number): Promise<Exercise[]> {
  try {
    if (!name || name.trim() === '') return [];
    const all = await loadFallback();
    const q = name.trim().toLowerCase();
    const filtered = all.filter((it: any) => String(it.name || it.title || '').toLowerCase().includes(q));
    const items = filtered.slice(0, limit || filtered.length);
    return items.map(normalizeExercise);
  } catch (err) {
    console.error('exerciseApi.searchExercisesByName error', err);
    return [];
  }
}

export async function getExercisesByTarget(muscle: string): Promise<Exercise[]> {
  try {
    if (!muscle || muscle.trim() === '') return [];
    const all = await loadFallback();
    const q = muscle.trim().toLowerCase();
    const filtered = all.filter((it: any) => {
      const targets: string[] = [];
      if (Array.isArray(it.primaryMuscles)) targets.push(...it.primaryMuscles);
      if (Array.isArray(it.primary_muscles)) targets.push(...it.primary_muscles);
      if (Array.isArray(it.targetMuscles)) targets.push(...it.targetMuscles);
      if (it.target) targets.push(it.target);
      if (it.muscle) targets.push(it.muscle);
      return targets.map((t: any) => String(t).toLowerCase()).includes(q) || String((targets[0]) || '').toLowerCase() === q;
    });
    return filtered.map(normalizeExercise);
  } catch (err) {
    console.error('exerciseApi.getExercisesByTarget error', err);
    return [];
  }
}

export async function getAllTargetMuscles(): Promise<string[]> {
  try {
    const all = await loadFallback();
    const set = new Set<string>();
    for (const it of all) {
      if (it.target) set.add(String(it.target));
      if (it.muscle) set.add(String(it.muscle));
      if (Array.isArray(it.primaryMuscles)) for (const tt of it.primaryMuscles) if (tt) set.add(String(tt));
      if (Array.isArray(it.primary_muscles)) for (const tt of it.primary_muscles) if (tt) set.add(String(tt));
      if (Array.isArray(it.targetMuscles)) for (const tt of it.targetMuscles) if (tt) set.add(String(tt));
    }
    return Array.from(set).filter(Boolean).sort();
  } catch (err) {
    console.error('exerciseApi.getAllTargetMuscles error', err);
    return [];
  }
}
