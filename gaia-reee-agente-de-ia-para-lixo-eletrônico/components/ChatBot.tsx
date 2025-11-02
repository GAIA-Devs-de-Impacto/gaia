/**
 * @authors
 * Vitoriano Martin - https://github.com/VitorianoFM/
 * Felipe Fuhrmann - https://github.com/FelipeFuhrmann/
 * Lilian Ferreira - https://github.com/LilianFerreira/
 */
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { generateGroundedResponse, textToSpeech } from '../services/geminiService';
import { SpeakerIcon } from './Icons';
import { decode, decodeAudioData } from '../utils/audio';

// Define MessageBubble outside the main component to prevent re-creation
const MessageBubble: React.FC<{ message: ChatMessage; onSpeak: (text: string) => void }> = ({ message, onSpeak }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow ${isUser ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                <p className="text-sm">{message.text}</p>
                {message.groundingChunks && message.groundingChunks.length > 0 && (
                    <div className="mt-2 text-xs border-t border-gray-500 pt-2">
                        <h4 className="font-bold mb-1">Fontes:</h4>
                        <ul className="list-disc list-inside">
                        {message.groundingChunks.map((chunk, index) => (
                            (chunk.web || chunk.maps) && <li key={index}><a href={(chunk.web || chunk.maps).uri} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">{(chunk.web || chunk.maps).title || 'Fonte'}</a></li>
                        ))}
                        </ul>
                    </div>
                )}
            </div>
             {!isUser && (
                <button onClick={() => onSpeak(message.text)} className="p-1 mt-1 text-gray-400 hover:text-green-400 transition-colors">
                    <SpeakerIcon />
                </button>
            )}
        </div>
    );
};


const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [locationError, setLocationError] = useState<string>('');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation(position.coords);
                setLocationError('');
            },
            (error) => {
                setLocationError('Não foi possível obter a localização. A busca baseada na localização será desativada.');
                console.warn(`Geolocation error: ${error.message}`);
            }
        );
         // @ts-ignore
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });

        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSpeak = async (text: string) => {
        if (!audioContextRef.current) return;
        try {
            const base64Audio = await textToSpeech(text);
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
        } catch (error) {
            console.error("TTS failed:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await generateGroundedResponse(input, location);
            const modelMessage: ChatMessage = {
                role: 'model',
                text: response.text,
                groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
            };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: ChatMessage = { role: 'model', text: 'Desculpe, encontrei um erro. Por favor, tente novamente.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {locationError && <p className="text-xs text-yellow-500 text-center mb-2">{locationError}</p>}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-900 rounded-t-lg border-x border-t border-gray-700">
                {messages.map((msg, index) => (
                    <MessageBubble key={index} message={msg} onSpeak={handleSpeak} />
                ))}
                {isLoading && <div className="flex justify-start"><div className="px-4 py-2 rounded-lg shadow bg-gray-700 text-gray-200"><span className="animate-pulse">...</span></div></div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-4 bg-gray-800 rounded-b-lg border border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pergunte sobre lixo eletrônico ou encontre locais de descarte..."
                        className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-500 transition-colors"
                    >
                        Enviar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatBot;