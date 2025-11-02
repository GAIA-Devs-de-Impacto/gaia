/**
 * @authors
 * Vitoriano Martin - https://github.com/VitorianoFM/
 * Felipe Fuhrmann - https://github.com/FelipeFuhrmann/
 * Lilian Ferreira - https://github.com/LilianFerreira/
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: The LiveSession type is not exported from `@google/genai`.
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audio';
import { PlayIcon, StopIcon } from './Icons';
import { getRankedCollectorsPromptContext } from '../services/geminiService';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

const LiveAgent: React.FC = () => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [userTranscription, setUserTranscription] = useState<string>('');
    const [agentTranscription, setAgentTranscription] = useState<string>('');
    const [history, setHistory] = useState<{user: string, agent: string}[]>([]);
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [locationError, setLocationError] = useState<string>('');
    
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const currentUserTranscription = useRef('');
    const currentAgentTranscription = useRef('');
    
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation(position.coords);
                setLocationError('');
            },
            (error) => {
                setLocationError('Não foi possível obter a localização. As sugestões baseadas na localização podem ser limitadas.');
                console.warn(`Geolocation error: ${error.message}`);
            }
        );
    }, []);

    const cleanup = useCallback(() => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        sessionPromiseRef.current = null;
    }, []);

    const startConversation = async () => {
        if (connectionState !== 'idle' && connectionState !== 'closed' && connectionState !== 'error') return;

        setConnectionState('connecting');
        setHistory([]);
        setUserTranscription('');
        setAgentTranscription('');
        currentUserTranscription.current = '';
        currentAgentTranscription.current = '';

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API_KEY not found");
            const ai = new GoogleGenAI({ apiKey });
            
            // @ts-ignore
            outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            
            const collectorsContext = getRankedCollectorsPromptContext(location);
            const systemInstruction = `Você é um agente de IA prestativo e amigável para o descarte de lixo eletrônico. Seja conciso. Quando questionado sobre descarte, pontos de coleta ou logística, você DEVE usar os dados dos parceiros fornecidos. Os dados estão ordenados por proximidade ao usuário. Sua tarefa principal é recomendar pelo menos os 3 parceiros mais próximos da lista antes de dar qualquer outro conselho.

${collectorsContext}

A localização do usuário é ${location ? `Latitude: ${location.latitude}, Longitude: ${location.longitude}` : 'desconhecida'}.`;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: systemInstruction,
                },
                callbacks: {
                    onopen: async () => {
                        setConnectionState('connected');
                        // @ts-ignore
                        inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
                        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentUserTranscription.current += text;
                            setUserTranscription(prev => prev + text);
                        }
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentAgentTranscription.current += text;
                            setAgentTranscription(prev => prev + text);
                        }
                        if (message.serverContent?.turnComplete) {
                            setHistory(prev => [...prev, {user: currentUserTranscription.current, agent: currentAgentTranscription.current}]);
                            setUserTranscription('');
                            setAgentTranscription('');
                            currentUserTranscription.current = '';
                            currentAgentTranscription.current = '';
                        }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            const outputContext = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputContext, 24000, 1);
                            const source = outputContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputContext.destination);
                            source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onclose: () => {
                        setConnectionState('closed');
                        cleanup();
                    },
                    onerror: (e) => {
                        console.error(e);
                        setConnectionState('error');
                        cleanup();
                    },
                },
            });

        } catch (error) {
            console.error("Failed to start conversation:", error);
            setConnectionState('error');
            cleanup();
        }
    };

    const endConversation = async () => {
        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
        }
        cleanup();
        setConnectionState('closed');
    };
    
    useEffect(() => {
        return () => {
            endConversation();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ConnectionStatus = () => {
        const statusMap = {
            idle: { text: "Inativo", color: "text-gray-400" },
            connecting: { text: "Conectando...", color: "text-yellow-400" },
            connected: { text: "Ao Vivo", color: "text-green-400" },
            closed: { text: "Desconectado", color: "text-blue-400" },
            error: { text: "Erro", color: "text-red-400" },
        };
        const { text, color } = statusMap[connectionState];
        return <span className={`font-mono text-sm ${color}`}>{text}</span>;
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between p-2 bg-gray-900 rounded-md border border-gray-700">
                <div className='flex flex-col'>
                    <ConnectionStatus />
                     {locationError && <p className="text-xs text-yellow-500">{locationError}</p>}
                </div>
                <div>
                    {connectionState !== 'connected' && connectionState !== 'connecting' ? (
                        <button onClick={startConversation} className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                            <PlayIcon /> Iniciar Conversa
                        </button>
                    ) : (
                        <button onClick={endConversation} className="flex items-center gap-2 bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors">
                            <StopIcon /> Encerrar Conversa
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-grow bg-gray-900 rounded-lg p-4 overflow-y-auto border border-gray-700 space-y-4">
                {history.map((turn, index) => (
                    <div key={index} className="space-y-2">
                        <p><strong className="text-green-400">Você:</strong> {turn.user}</p>
                        <p><strong className="text-blue-400">Agente:</strong> {turn.agent}</p>
                    </div>
                ))}
                {connectionState === 'connected' && (
                    <div className="space-y-2 pt-4 border-t border-gray-700">
                        {userTranscription && <p className="min-h-[1.5rem]"><strong className="text-green-400">Você:</strong> {userTranscription}</p>}
                        {agentTranscription && <p className="min-h-[1.5rem]"><strong className="text-blue-400">Agente:</strong> {agentTranscription}</p>}
                    </div>
                )}
                 {history.length === 0 && connectionState !== 'connected' && (
                    <p className="text-gray-500 text-center pt-8">Pressione "Iniciar Conversa" para falar com o agente de IA.</p>
                )}
            </div>
        </div>
    );
};

export default LiveAgent;