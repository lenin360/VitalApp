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
    '7X6V_LwG1kY', // Breathing Exercises - Verified
    '8BcPHWG6X64', // 10 Min Chair - Verified
    'vBXWOUXb_5g', // Relajación
    'F28MGLlpP90', // Relajación guiada
  ],
  hombros: [
    'D3Wly_9yOic', // Zumba Gold 7 min (Hombros/Brazos)
    'W2yTzYtS5m0', // Alivio dolor
    '7B86uG1S_0E', // Ejercicios hombro
  ],
  estiramiento: [
    'sT6N3_0mK8A', // Tai Chi / Estiramiento - Verified
    'j6wR51X3YCo', // Estiramientos en silla
    'msPWv7YCcMQ', // Silla con estiramientos
  ],
  caminata: [
    'cEitXw_2h-0', // Senior Exercise - Verified
    'XyGvG60TcL8', // Caminar en casa
    'bmI2EQZ7bTI', // Marcha en el lugar
  ],
  equilibrio: [
    'SEDvS8E06A4', // Balance Exercises - Verified
    'Cx1xXGGNFlg', // Equilibrio
    'QPjBD7gCYHU', // Sentadillas
  ],
  yoga: [
    '8r52D59JmEw', // Chair Yoga - Verified
    'iN25Z0j8w7E', // Yoga adultos mayores
  ],
  zumba: [
    'D3Wly_9yOic', // Zumba Gold 1 - Verified
    'lA_fOni6F4U', // Zumba Gold 2 - Verified
    'X0XJ3E9iC80', // Zumba Gold 3 - Verified
    '3F-hBw2L77I', // Zumba Gold 4 - Verified
    't2p6AisqRIs', // Zumba Party - Verified
  ],
  pilates: [
    '8r52D59JmEw', // Chair Pilates/Yoga - Verified
    'msPWv7YCcMQ', // Pilates suave
  ],
  core: [
    'M_XG_Z_J_78', // Rutina completa
    'msPWv7YCcMQ', // Core en silla
    'iqddEZo6Uf4', // Better than Walking (Cardio + Abs)
    'X0x5u6u-7cI', // Ejercicios fáciles y seguros
    'yjJjUJlBF_0', // Fortalecimiento abdominal
    'SG_IuD0g2yo', // Estabilidad central
    '14xKzYj83cE', // Abdominales sentados
    '7VvW6N8N-vM', // Control de tronco
    'A6E1E4v67tQ', // Core y espalda sana
  ],
  brazos: [
    'HGMLmYFYv7I', // Ganar músculo - Mariana Quevedo
    'eK1YgC5Sw-k', // Fuerza y Músculo (Mariana Quevedo)
    'p6yS09_o_1w', // Fortalecimiento piernas y brazos
    '5GCkAWIe6uU', // Brazos con pesas
    'DsriajXRFJ4', // Fuerza de brazos
    'K_V-UjO2PTE', // Brazos sin dolor
    '7B86uG1S_0E', // Brazos y hombros fuerza
    'iGfHl_uL1-I', // Bíceps y Tríceps suave
    '6T7Wn6v0nBw', // Empuje y tracción
    'mC_Wdu6d-rM', // Mariana Quevedo - Ejercicios fuerza
    'W2yTzYtS5m0', // Hombros y brazos
    'j6wR51X3YCo', // Movilidad brazos
  ],
  silla: [
    'msPWv7YCcMQ', // 6 ejercicios en silla
    'j6wR51X3YCo', // Silla fácil y seguro
    'M_XG_Z_J_78', // Rutina 15 min en silla
    'X0x5u6u-7cI', // Fácil y seguro en silla
    'bmI2EQZ7bTI', // Ejercicios sentados
    'R8b1vK49oX8', // Circuito activo
    'N2s45hK1m3A', // Ejercicios medios silla
    'VpW_e-5L-v0', // Movilidad total silla
    'S6oZ38_F5vI', // Baile sentado
    'N8uH9V6qF-U', // Cardio silla
    'otru9zXCeGM', // Mariana Quevedo - Cardio Baile en Silla
  ],
  piernas: [
    'p6yS09_o_1w', // Fortalecimiento de piernas
    'QPjBD7gCYHU', // Sentadillas
    'mC_Wdu6d-rM', // Equilibrio y piernas
    'XyGvG60TcL8', // Caminata y piernas
    'GfQbq8_cwls', // Mariana Quevedo - Muscle in Legs
    '_HCnd3AGM3I', // Ejercicios piernas adulto mayor
    'Cj2hY-fQkE4', // Fuerza glúteos piernas
    'Z3w1w1fR2c8', // Mejora marcha
    '7VvW6N8N-vM', // Sentadillas seguras silla
    'A6E1E4v67tQ', // Rodillas fuertes
    'G46R1b6V7eM', // Piernas fuertes 2 - Verified Mariana Quevedo
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
