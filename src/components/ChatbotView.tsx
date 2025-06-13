
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppView } from '@/types.ts';
import Icon from './Icon.tsx';
import { GoogleGenAI, Chat } from "@google/genai";

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const ChatbotView: React.FC = () => {
  const { translate, dispatch } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiKey = process.env.API_KEY;

  useEffect(() => {
    if (!apiKey) {
        setError(translate('chatbotErrorApiKeyMissing'));
        console.error("API_KEY environment variable not set for Gemini API.");
        return;
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash-preview-04-17' });
    } catch (e: any) {
        console.error("Error initializing Gemini AI:", e);
        setError(translate('chatbotErrorApi'));
    }
  }, [apiKey, translate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading || !chatRef.current) return;

    const userMessage: ChatMessage = { id: generateId(), text: inputValue.trim(), sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const stream = await chatRef.current.sendMessageStream({ message: userMessage.text });
      let botResponseText = '';
      let currentBotMessageId: string | null = null;

      for await (const chunk of stream) { // Type of chunk is GenerateContentResponse
        const chunkText = chunk.text;
        botResponseText += chunkText;
        
        if (!currentBotMessageId) {
            currentBotMessageId = generateId();
            setMessages(prev => [...prev, { id: currentBotMessageId!, text: botResponseText, sender: 'bot' }]);
        } else {
            setMessages(prev => prev.map(msg => 
                msg.id === currentBotMessageId ? { ...msg, text: botResponseText } : msg
            ));
        }
      }
    } catch (err: any) {
      console.error("Error sending message to Gemini:", err);
      setError(translate('chatbotErrorApi'));
      // Optionally add an error message to the chat
      setMessages(prev => [...prev, {id: generateId(), text: translate('chatbotErrorApi'), sender: 'bot'}]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    // Re-initialize chat session if needed, or rely on Gemini's context window.
    // For a simple clear, just clearing local messages might be enough.
    // If we want to truly reset context with API:
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash-preview-04-17' });
            setError(null);
        } catch (e) {
             console.error("Error re-initializing Gemini AI:", e);
             setError(translate('chatbotErrorApi'));
        }
    }
    
  };


  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden">
      <header className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">{translate('chatbotViewTitle')}</h1>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.HOME } })}
          className="py-1.5 px-3 text-xs rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1"
          aria-label={translate('navBackToHome')}
        >
          <Icon name="arrow-left" size="0.9em" />
          <span className="hidden sm:inline">{translate('navBackToHome')}</span>
        </button>
      </header>

      <div className="flex-grow p-3 sm:p-4 space-y-3 overflow-y-auto custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[70%] sm:max-w-[65%] p-2.5 sm:p-3 rounded-xl shadow-sm break-words text-sm sm:text-base
                         ${msg.sender === 'user' 
                           ? 'bg-indigo-500 dark:bg-indigo-600 text-white rounded-br-none' 
                           : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none'
                         }`}
            >
              {/* Basic markdown-like newlines */}
              {msg.text.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < msg.text.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Scroll anchor */}
      </div>

      {isLoading && (
        <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 italic text-center">
          {translate('chatbotIsTyping')}
        </div>
      )}
      {error && (
        <div className="px-4 py-2 text-xs text-red-600 dark:text-red-400 italic text-center">
          {error}
        </div>
      )}

      <footer className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleClearChat}
            title={translate('chatbotClearChat')}
            className="p-2 sm:p-2.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={translate('chatbotClearChat')}
            disabled={isLoading || !apiKey}
          >
            <Icon name="trash-2" size="1.2em" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={translate('chatbotPlaceholder')}
            className="flex-grow p-2.5 sm:p-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-sm sm:text-base bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 disabled:opacity-70"
            disabled={isLoading || !apiKey}
            aria-label={translate('chatbotPlaceholder')}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || !apiKey}
            className="p-2.5 sm:p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors shadow-sm disabled:opacity-60"
            aria-label={translate('chatbotSend')}
          >
            <Icon name="send" size="1.2em" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatbotView;
