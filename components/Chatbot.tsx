
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, User, BrainCircuit, Search, Map, Mic, Volume2, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

type Message = {
  sender: 'user' | 'bot';
  text: string;
  sources?: { uri: string; title: string }[];
};

type AiMode = 'chat' | 'search' | 'maps' | 'complex' | 'lite';

const modeLabels: Record<AiMode, string> = {
    chat: 'Chat',
    search: 'Búsqueda',
    maps: 'Mapas',
    complex: 'Complejo',
    lite: 'Rápido'
};

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response;
      switch (aiMode) {
        case 'search':
          response = await GeminiService.groundedSearch(input);
          break;
        case 'maps':
          response = await GeminiService.groundedMaps(input);
          break;
        case 'complex':
          response = await GeminiService.complexReasoning(input);
          break;
        case 'lite':
          response = await GeminiService.fastResponse(input);
          break;
        default:
          response = await GeminiService.chat(input);
      }

      const botMessage: Message = {
        sender: 'bot',
        text: response.text,
        sources: response.sources,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Gemini API error:', error);
      const errorMessage: Message = {
        sender: 'bot',
        text: 'Lo siento, encontré un error. Por favor, inténtalo de nuevo.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, aiMode]);

  const handleTts = useCallback(async (text: string) => {
    if (isTtsPlaying) {
      audioSource?.stop();
      setIsTtsPlaying(false);
      setAudioSource(null);
      return;
    }
    setIsLoading(true);
    try {
        const sourceNode = await GeminiService.textToSpeech(text);
        setAudioSource(sourceNode);
        sourceNode.onended = () => setIsTtsPlaying(false);
        setIsTtsPlaying(true);
    } catch (error) {
        console.error("TTS Error:", error);
    } finally {
        setIsLoading(false);
    }
  }, [isTtsPlaying, audioSource]);
  
  const ModeButton: React.FC<{mode: AiMode; label: string; icon: React.ReactNode}> = ({mode, label, icon}) => (
      <button onClick={() => setAiMode(mode)} className={`flex-1 p-2 text-xs rounded-md flex flex-col items-center gap-1 transition-colors ${aiMode === mode ? 'bg-sky-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>
          {icon} {label}
      </button>
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-sky-600 text-white p-4 rounded-full shadow-lg hover:bg-sky-700 transition-transform hover:scale-110"
        aria-label="Abrir Chat"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-sm h-[70vh] max-h-[600px] bg-white rounded-xl shadow-2xl flex flex-col z-20">
      <header className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
        <h3 className="font-bold text-lg flex items-center gap-2"><Bot className="text-sky-600"/> Asistente Gemini</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-800">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
             {msg.sender === 'bot' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center"><Bot className="text-sky-600" size={18}/></div>}
            <div className={`p-3 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'bg-sky-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
              <p className="text-sm">{msg.text}</p>
              {msg.sources && (
                  <div className="mt-2 border-t border-slate-200 pt-2">
                      <h4 className="text-xs font-bold mb-1">Fuentes:</h4>
                      <ul className="space-y-1">
                          {msg.sources.map((source, i) => (
                              <li key={i}>
                                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:underline break-all">
                                      {source.title || source.uri}
                                  </a>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
               {msg.sender === 'bot' && <button onClick={() => handleTts(msg.text)} className="mt-2 text-sky-500 hover:text-sky-700"><Volume2 size={14}/></button>}
            </div>
             {msg.sender === 'user' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center"><User className="text-slate-600" size={18}/></div>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-slate-50 rounded-b-xl">
        <div className="flex items-center justify-around gap-1 mb-2 text-slate-600">
           <ModeButton mode="chat" label="Chat" icon={<MessageSquare size={16}/>}/>
           <ModeButton mode="search" label="Buscar" icon={<Search size={16}/>}/>
           <ModeButton mode="maps" label="Mapas" icon={<Map size={16}/>}/>
           <ModeButton mode="complex" label="Complejo" icon={<BrainCircuit size={16}/>}/>
           <ModeButton mode="lite" label="Rápido" icon={<Bot size={16}/>}/>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder={`Pregunta en modo ${modeLabels[aiMode].toLowerCase()}...`}
            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            disabled={isLoading}
          />
           <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-sky-600 text-white p-2.5 rounded-md hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
          </button>
        </div>
      </div>
    </div>
  );
};