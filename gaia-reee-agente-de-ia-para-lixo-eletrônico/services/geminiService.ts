import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';
import { collectors } from '../data/collectors';

const getGenAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey });
}

// Internal helper for distance calculation (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

/**
 * Creates a context string with collectors ranked by distance from the user.
 * @param location The user's current geolocation.
 * @returns A formatted string for use in AI prompts.
 */
export function getRankedCollectorsPromptContext(location: GeolocationCoordinates | null): string {
    let collectorsData;
    let contextHeader;

    if (location) {
        const collectorsWithDistance = collectors.map(collector => {
            const distance = calculateDistance(
                location.latitude,
                location.longitude,
                collector.latitude,
                collector.longitude
            );
            return { ...collector, distanceKm: parseFloat(distance.toFixed(2)) };
        });

        collectorsWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
        collectorsData = JSON.stringify(collectorsWithDistance, null, 2);
        contextHeader = "Banco de Dados de Coletores Parceiros (ordenado por distância do usuário, mais próximo primeiro):";
    } else {
        collectorsData = JSON.stringify(collectors, null, 2);
        contextHeader = "Banco de Dados de Coletores Parceiros:";
    }
    return `${contextHeader}\n${collectorsData}`;
}


export async function analyzeImage(imageDataBase64: string, mimeType: string, prompt: string): Promise<string> {
    const ai = getGenAI();
    const imagePart = {
      inlineData: {
        mimeType,
        data: imageDataBase64,
      },
    };
    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text;
}

export async function generateGroundedResponse(prompt: string, location: GeolocationCoordinates | null): Promise<GenerateContentResponse> {
    const ai = getGenAI();
    
    let finalPrompt = prompt;
    const logisticsKeywords = ['logística', 'coletor', 'descartar', 'onde', 'encontrar', 'reciclar', 'ponto de coleta'];
    const isLogisticsQuery = logisticsKeywords.some(keyword => prompt.toLowerCase().includes(keyword));

    if (isLogisticsQuery) {
        const collectorsContext = getRankedCollectorsPromptContext(location);
        finalPrompt = `
Você é um especialista em logística de descarte de lixo eletrônico.
Um usuário está pedindo ajuda. Sua tarefa principal é usar o banco de dados de parceiros fornecido para sugerir os pontos de coleta mais apropriados.
A lista de parceiros já está ordenada por distância do usuário (mais próximo primeiro).
Você DEVE recomendar pelo menos os 3 parceiros mais próximos desta lista antes de fornecer qualquer outro conselho geral sobre descarte. Indique claramente seus nomes e endereços.

${collectorsContext}

Localização atual do usuário (se disponível): ${location ? `Latitude: ${location.latitude}, Longitude: ${location.longitude}` : 'Não fornecida.'}

Solicitação do Usuário: "${prompt}"

Com base nisso, forneça sua recomendação.
`;
    }

    const useMaps = location && (
        prompt.toLowerCase().includes('perto') ||
        prompt.toLowerCase().includes('onde fica') ||
        prompt.toLowerCase().includes('encontrar')
    );

    const tools: any[] = useMaps ? [{ googleMaps: {} }] : [{ googleSearch: {} }];
    const toolConfig: any = useMaps ? {
        retrievalConfig: {
            latLng: {
                latitude: location.latitude,
                longitude: location.longitude,
            }
        }
    } : {};
    
    return ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: finalPrompt,
        config: {
            tools,
        },
        ...(Object.keys(toolConfig).length > 0 && { toolConfig }),
    });
}


export async function textToSpeech(text: string): Promise<string> {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Diga: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from TTS API.");
    }
    return base64Audio;
}