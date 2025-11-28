
import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';

interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
    maps?: {
        uri: string;
        title: string;
    };
}

interface GeminiResponse {
    text: string;
    sources?: { uri: string; title: string }[];
}

let ai: GoogleGenAI | null = null;
const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("La variable de entorno API_KEY no está configurada");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};


const extractSources = (response: GenerateContentResponse): { uri: string; title: string }[] => {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    // Cast chunks to GroundingChunk[] to correctly access web/maps properties.
    return (chunks as GroundingChunk[]).map(chunk => {
        if (chunk.web) return { uri: chunk.web.uri, title: chunk.web.title };
        if (chunk.maps) return { uri: chunk.maps.uri, title: chunk.maps.title };
        return { uri: '', title: '' };
    }).filter(source => source.uri);
};

// Audio decoding utilities
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


export const GeminiService = {
    chat: async (prompt: string): Promise<GeminiResponse> => {
        const response: GenerateContentResponse = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return { text: response.text };
    },

    fastResponse: async (prompt: string): Promise<GeminiResponse> => {
        const response: GenerateContentResponse = await getAi().models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
        });
        return { text: response.text };
    },

    groundedSearch: async (prompt: string): Promise<GeminiResponse> => {
        const response: GenerateContentResponse = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        return { text: response.text, sources: extractSources(response) };
    },

    groundedMaps: async (prompt: string): Promise<GeminiResponse> => {
        // Mocked location for demo purposes. A real app would get this from navigator.geolocation
        const userLocation = { latitude: 37.78193, longitude: -122.40476 };

        const response: GenerateContentResponse = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: userLocation
                    }
                }
            },
        });
        return { text: response.text, sources: extractSources(response) };
    },

    complexReasoning: async (prompt: string): Promise<GeminiResponse> => {
        const response: GenerateContentResponse = await getAi().models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return { text: response.text };
    },
    
    textToSpeech: async (text: string): Promise<AudioBufferSourceNode> => {
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const outputAudioContext = new (window.AudioContext)({ sampleRate: 24000 });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No se recibieron datos de audio");
        
        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.destination);
        source.start();
        return source;
    }
};