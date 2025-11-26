
import { BossZone } from './types';

export const US_TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

export const BOSS_ZONES: BossZone[] = [
  {
    id: 0,
    name: "Zona Neutral",
    bossName: "La Resistencia",
    color: "#3b82f6", // Azul Héroe
    description: "Base de operaciones aliada. El Nido. Territorio libre."
  },
  {
    id: 1,
    name: "El Nuevo Edén (Oeste)",
    bossName: "Magneto",
    color: "#dc2626", // Rojo (Red-600)
    description: "Santuario natural y autarquía mutante protegida por montañas. Capital: San Francisco."
  },
  {
    id: 2,
    name: "Tierra de Nadie (Centro-Norte)",
    bossName: "Hulk",
    color: "#84cc16", // Verde Clarito (Lime-500)
    description: "The Wasteland. Zona de amortiguación destruida. Hordas nómadas y radiación. Capital: Ruinas de Chicago."
  },
  {
    id: 3,
    name: "El Imperio de la Carne (Noreste)",
    bossName: "Kingpin",
    color: "#9333ea", // Morado (Purple-600)
    description: "Mercado negro, industria pesada y mafias. Moneda: comida. Capital: Manhattan."
  },
  {
    id: 4,
    name: "Doomsberg (Sur)",
    bossName: "Dr. Doom",
    color: "#166534", // Verde Oscuro (Green-800)
    description: "Orden, tecnología y energía. Dictadura estricta opuesta al caos. Capital: Doomstadt (Dallas)."
  }
];

export const STATE_ZONE_MAPPING: Record<string, number> = {
  // ZONA 1: MAGNETO (El Nuevo Edén - Oeste)
  "Washington": 1, "Oregon": 1, "California": 1, "Nevada": 1, "Idaho": 1, 
  "Utah": 1, "Arizona": 1, "Montana": 1, "Wyoming": 1, "Colorado": 1,
  "Alaska": 1, "Hawaii": 1,

  // ZONA 2: HULK (Tierra de Nadie - Centro/Norte + Expansión Sur)
  "North Dakota": 2, "South Dakota": 2, "Nebraska": 2, "Kansas": 2, 
  "Minnesota": 2, "Iowa": 2, "Missouri": 2, "Wisconsin": 2, 
  "Illinois": 2, "Indiana": 2, "Michigan": 2, "Ohio": 2,
  "New Mexico": 2, "Oklahoma": 2, // Movidos a territorio de Hulk

  // ZONA 3: KINGPIN (El Imperio de la Carne - Noreste)
  "Maine": 3, "New Hampshire": 3, "Vermont": 3, "Massachusetts": 3, 
  "Rhode Island": 3, "Connecticut": 3, "New York": 3, "New Jersey": 3, 
  "Pennsylvania": 3, "Delaware": 3, "Maryland": 3, 
  "West Virginia": 3, "Virginia": 3, "District of Columbia": 3,

  // ZONA 4: DR. DOOM (Latveria Americana - Sur)
  "Texas": 4, "Arkansas": 4, 
  "Louisiana": 4, "Mississippi": 4, "Alabama": 4, "Tennessee": 4, 
  "Kentucky": 4, "North Carolina": 4, "South Carolina": 4, 
  "Georgia": 4, "Florida": 4
};

// Coordenadas aproximadas [Longitud, Latitud] para etiquetas de fondo
export const ZONE_LABELS = [
  { id: 1, text: "NUEVO EDÉN", coordinates: [-113, 39] },
  { id: 2, text: "TIERRA\nDE NADIE", coordinates: [-96, 42] },
  { id: 3, text: "IMPERIO\nDE LA CARNE", coordinates: [-76, 42] },
  { id: 4, text: "DOOMSBERG", coordinates: [-95, 30] } 
];