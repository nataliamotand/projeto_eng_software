export const muscleOptions = [
  'Cardio',
  'abdominais',
  'adutores',
  'antebraços',
  'armadilhas',
  'bezerros',
  'bíceps',
  'dorso',
  'glúteos',
  'isquiotibiais',
  'meio das costas',
  'ombros',
  'parte inferior das costas',
  'peito',
  'pescoço',
  'quadríceps',
  'sequestradores',
  'tríceps',
];

export const muscleDisplayMap: Record<string, string> = {
  cardio: 'Cardio',
  abdominais: 'Abdominais',
  adutores: 'Adutores',
  'antebraços': 'Antebraços',
  armadilhas: 'Armadilhas',
  bezerros: 'Bezerros',
  'bíceps': 'Bíceps',
  dorso: 'Dorso',
  'glúteos': 'Glúteos',
  isquiotibiais: 'Isquiotibiais',
  'meio das costas': 'Meio das Costas',
  ombros: 'Ombros',
  'parte inferior das costas': 'Parte Inferior das Costas',
  peito: 'Peito',
  pescoço: 'Pescoço',
  quadríceps: 'Quadríceps',
  sequestradores: 'Sequestradores',
  'tríceps': 'Tríceps',
};

export function displayMuscleLabel(key: string){
  if(!key) return '';
  const k = String(key).toLowerCase();
  return muscleDisplayMap[k] || (key.charAt(0).toUpperCase() + key.slice(1));
}
