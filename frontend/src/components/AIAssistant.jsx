import React, { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';

const SYSTEM_PROMPT = "You are a professional traffic management assistant. Help traffic officers with: incident response protocols, emergency procedures, traffic diversion strategies, and system usage guidance. Be concise and practical.";

const AIAssistant = () => {
  const { token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your AI Traffic Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Hide component if user is not logged in
  if (!token) return null;

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Exclude the initial welcome message from the actual API payload if it doesn't match a strict prompt structure,
      // but it's fine to just include all messages. Groq handles it well.
      const history = messages.filter(m => m.content !== "Hello! I'm your AI Traffic Assistant. How can I help you today?");
      
      const payloadMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        userMsg
      ];

      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('Missing Groq API Key in frontend .env');
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: payloadMessages,
          max_tokens: 800,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMsg = data.choices[0].message;
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the AI. Please verify your VITE_GROQ_API_KEY is set in the frontend .env file.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    "Critical accident protocol",
    "Road diversion strategy",
    "Reporting steps",
    "Congestion tips"
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>

      {/* Chat Panel */}
      <div className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[9998] flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 h-[600px] max-h-[70vh]' : 'scale-0 opacity-0 h-0 overflow-hidden'}`}>
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800 border-b border-slate-700 rounded-t-2xl flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-500/30">
            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-base">AI Traffic Assistant</h3>
            <p className="text-xs text-green-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>
              Online
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-br-sm shadow-orange-500/20' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm shadow-lg'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm flex items-center gap-1.5 w-fit h-[44px]">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions & Input Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-2xl shrink-0">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickActions.map((action, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(action)}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-full transition-colors whitespace-nowrap"
              >
                {action}
              </button>
            ))}
          </div>
          
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for guidance..."
              className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 transition-colors placeholder:text-slate-500"
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={isTyping || !input.trim()}
              className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
          <div className="mt-3 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">
              AI assistant — always verify with official protocols.
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
