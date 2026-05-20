export interface Exercise {
  name: string;
  duration: string;
  icon: string;
  color: string;
  url?: string;
}

export interface Routine {
  title: string;
  time: string;
  exercises: Exercise[];
}

export const VIDEO_LIBRARY: Record<string, string[]> = {
  respiracion: [
    'v_5jP2PRTV4', // Ejercicios respiración adultos mayores
    'POGexZe7Bxw', // Respiración y relajación guiada
    'wEIK-2LaRwY', // Técnicas de respiración
  ],
  hombros: [
    'ZvfDryEt5bw', // Stretching seniors (hombros incluidos)
    'KcdkySvCRCc', // Estiramientos superiores
    'YaM1_I8omDw', // Chair exercises arms/shoulders
  ],
  estiramiento: [
    'ZvfDryEt5bw', // Stretching exercises seniors
    'KcdkySvCRCc', // Full body stretching seniors
    'o50BQDwaDcI', // Chair yoga stretching
  ],
  caminata: [
    'Z26PWsBsSFY', // Walking exercise seniors at home
    'y8IaBla_tQ4', // Indoor walking workout
    'uJZk7jafw-o', // Balance & walking exercises
  ],
  equilibrio: [
    'uJZk7jafw-o', // Senior balance exercises
    'MJLHMUa7WYs', // Balance training seniors
    'b2gF0nTAY0o', // Chair yoga balance
  ],
  yoga: [
    '1DYH5ud3zHo', // Chair yoga seniors
    'G8BsLlPE1m4', // Gentle chair yoga
    'b2gF0nTAY0o', // Yoga for seniors
  ],
  zumba: [
    '0KJaefStf5s', // Zumba Gold seniors
    '8o9JJ17JrTw', // Zumba Gold low impact
    'Yge5lZJC41Q', // Zumba Gold dance workout
  ],
  pilates: [
    'jsFzFiyDqBs', // Pilates seniors chair
    'AxlIrQpzmqM', // Chair Pilates gentle
  ],
  core: [
    '6Ts-deSDnRM', // Core exercises seniors seated
    'n3z6GVr6WL4', // Seated core workout
    'jsFzFiyDqBs', // Pilates core seniors
  ],
  brazos: [
    'YaM1_I8omDw', // Chair exercises seniors arms
    'z-_lgQe9NJs', // Arm exercises seated seniors
    'ZvfDryEt5bw', // Upper body stretching
  ],
  silla: [
    '1DYH5ud3zHo', // Chair yoga seniors
    'G8BsLlPE1m4', // Gentle chair exercises
    'o50BQDwaDcI', // 20 min chair yoga walk better
    'jsFzFiyDqBs', // Chair Pilates
    'YaM1_I8omDw', // Chair arm exercises
  ],
  piernas: [
    '60fBjmYOGgw', // Senior leg exercises
    '8BcPHWGQO44', // Leg strength seniors
    'Z26PWsBsSFY', // Walking & legs workout
    'MJLHMUa7WYs', // Balance & leg training
  ],
};

export const pickVideo = (categoria: string, nombre: string): string => {
  const lista = VIDEO_LIBRARY[categoria] || VIDEO_LIBRARY['caminata'];
  const hash = (nombre || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return lista[hash % lista.length];
};

export const getVideoIdForExercise = (nombre: string): string => {
  const n = (nombre || '').toLowerCase();
  
  if (n.includes('respiraci') || n.includes('diafragm') || n.includes('meditaci') || n.includes('calma') || n.includes('profunda'))
    return pickVideo('respiracion', nombre);

  if (n.includes('hombro') || n.includes('cuello') || n.includes('cervical') || n.includes('muñeca') || n.includes('articulaci') || n.includes('círculo') || n.includes('circulo'))
    return pickVideo('hombros', nombre);

  if (n.includes('estiramiento') || n.includes('espalda') || n.includes('lateral') || n.includes('post-ejer') || n.includes('relajaci'))
    return pickVideo('estiramiento', nombre);

  if (n.includes('caminata') || n.includes('marcha') || n.includes('paso') || n.includes('tobillo') || n.includes('pierna') || n.includes('rodillas'))
    return pickVideo('caminata', nombre);

  if (n.includes('equilibrio') || n.includes('sentadilla') || n.includes('caída') || n.includes('caida') || n.includes('estabilidad'))
    return pickVideo('equilibrio', nombre);

  if (n.includes('yoga'))
    return pickVideo('yoga', nombre);

  if (n.includes('pilates'))
    return pickVideo('pilates', nombre);

  if (n.includes('core') || n.includes('abdominal'))
    return pickVideo('core', nombre);

  if (n.includes('brazo') || n.includes('bíceps') || n.includes('biceps') || 
      n.includes('elevaci') || n.includes('curl') || n.includes('press') || 
      n.includes('pesas') || n.includes('mancuerna') || n.includes('fuerza'))
    return pickVideo('brazos', nombre);

  if (n.includes('zumba') || n.includes('baile') || n.includes('danza') || n.includes('ritmo') || n.includes('música') || n.includes('musica'))
    return pickVideo('zumba', nombre);

  if (n.includes('silla') || n.includes('sentado'))
    return pickVideo('silla', nombre);

  return pickVideo('caminata', nombre);
};

export const DAILY_TIPS = [
  "Beber agua ayuda a mantener tus articulaciones lubricadas.",
  "Un paseo de 10 minutos después de comer mejora la digestión.",
  "Respira profundo 5 veces cuando te sientas cansado para renovar energía.",
  "El equilibrio se entrena: intenta pararte sobre un solo pie mientras te cepillas los dientes.",
  "Comer colores variados en tus platos asegura mejores vitaminas.",
  "Dormir 7 u 8 horas es fundamental para la recuperación muscular.",
  "Estirar suavemente al despertar prepara tu cuerpo para el día.",
  "La constancia es más importante que la intensidad.",
  "Sonreír reduce el cortisol y mejora tu estado de ánimo.",
  "Mantén tu espalda recta al sentarte para evitar dolores lumbares.",
  "Evita el azúcar refinado para mantener tus niveles de energía estables.",
  "Socializar con amigos es tan importante para la salud como el ejercicio.",
  "Escuchar música relajante antes de dormir ayuda a conciliar el sueño.",
  "Usa calzado cómodo y seguro para evitar caídas innecesarias.",
  "Mantén tu mente activa leyendo o haciendo pasatiempos diariamente.",
  "La hidratación constante mejora la elasticidad de tu piel y músculos.",
  "Realiza ejercicios de movilidad articular todas las mañanas.",
  "Un poco de sol (con protección) ayuda a sintetizar vitamina D.",
  "Aprender algo nuevo cada día mantiene joven tu cerebro.",
  "La gratitud diaria mejora notablemente tu bienestar emocional."
];
