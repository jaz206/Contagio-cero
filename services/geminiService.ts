import { GoogleGenAI, Type } from "@google/genai";
import { BossZone, Objective } from '../types';

// Access the API key exclusively from process.env.API_KEY.
// This variable is assumed to be pre-configured and valid in the execution context.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateMissionDetails = async (zone: BossZone, existingCount: number): Promise<{ title: string; description: string; objectives: Objective[] }> => {
  // Default fallback content used if AI fails
  const defaultTitle = `Operación ${zone.bossName} #${existingCount + 1}`;
  const defaultObjectivesStrings = ["Asegurar perímetro", "Recuperar datos", "Extracción táctica"];
  
  const mapToObjectives = (strs: string[]): Objective[] => {
      return strs.map(s => ({
          id: generateId(),
          text: s,
          completed: false
      }));
  };

  try {
    // Sanitized prompt to avoid safety filters blocking "Violence/Zombies"
    // We frame it strictly as a sci-fi board game logic.
    const prompt = `CONTEXT: You are a Game Master for a fictional sci-fi board game called 'Contagio Cero'.
    GENRE: Sci-Fi Strategy / Dystopian.
    TONE: Tactical, terse, military briefing style.
    LANGUAGE: Spanish (Español).

    TASK: Generate a mission card for the faction "${zone.bossName}" in the region "${zone.name}".
    Region Description: ${zone.description}.

    CONSTRAINTS:
    - DO NOT generate realistic violence or gore.
    - Use abstract sci-fi terms: "Bio-threats", "Anomalies", "Hostile Units", "Resource Nodes".
    - The output must be purely functional text for a game card.

    OUTPUT JSON FORMAT:
    {
      "title": "Mission Name (e.g., 'Protocolo: Sombra')",
      "description": "Brief briefing (max 20 words).",
      "objectives": ["Short objective 1", "Short objective 2"]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 500,
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                objectives: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
            },
            required: ["title", "description", "objectives"]
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
        ]
      }
    });

    const text = response.text;
    
    if (!text) {
        // If text is null, it might be blocked.
        console.warn("AI Response empty. Candidates:", response.candidates);
        throw new Error("Respuesta bloqueada por filtros de contenido.");
    }
    
    const json = JSON.parse(text);
    
    return {
        title: json.title,
        description: json.description,
        objectives: mapToObjectives(json.objectives || defaultObjectivesStrings)
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: `${defaultTitle}`,
      description: `(Fallo de IA: ${(error as Error).message}). Edite manualmente los detalles de la misión.`,
      objectives: mapToObjectives(defaultObjectivesStrings)
    };
  }
};