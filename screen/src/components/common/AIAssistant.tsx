import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, Loader2, Plus } from 'lucide-react';

import { getApiBaseUrl } from '../../api/client';
import { aiAssistantInitialMessage } from '../../mocks/aiAssistant';

const SCREEN_CLIENT_ID = 'screen';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    aiAssistantInitialMessage,
  ]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const screenHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    'X-Client-Id': SCREEN_CLIENT_ID,
  });

  const startNewChat = () => {
    setConversationId(null);
    setMessages([aiAssistantInitialMessage]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: '请配置 .env 中的 VITE_API_BASE_URL（Spring Boot 地址）后重启开发服务器。' },
      ]);
      setIsLoading(false);
      return;
    }

    // 对话由后端 Agent 处理（clientType=screen，可查 vendors 等），不再带前端假数据
    const apiMessages: { role: string; content: string }[] = [
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: userMessage },
    ];

    const body: { messages: typeof apiMessages; conversationId?: number | null; clientType?: string } = {
      messages: apiMessages,
      clientType: 'screen',
    };
    if (conversationId != null) body.conversationId = conversationId;

    try {
      const res = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: screenHeaders(),
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      let data: { code?: number; data?: { content?: string; conversationId?: number }; message?: string; content?: string };
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      const content =
        (data?.data?.content ?? data?.content ?? '').trim() || '抱歉，我暂时无法回答这个问题。';
      const newConvId = data?.data?.conversationId;
      const isError = !res.ok || (data?.code !== undefined && data?.code !== 0);

      if (isError) {
        setMessages(prev => [
          ...prev,
          { role: 'ai', text: data?.message || '网络似乎有点问题，请稍后再试哦~' },
        ]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: content }]);
        if (newConvId != null) setConversationId(newConvId);
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: '网络似乎有点问题，请稍后再试哦~' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed z-50 bottom-6 right-6 pointer-events-none flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="pointer-events-auto w-[350px] h-[500px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden mb-4 mr-2"
          >
            {/* Header */}
            <div className="h-16 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={startNewChat}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="新对话"
                >
                  <Plus size={16} />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] keep-colors">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">食探 AI 助手</h3>
                  <p className="text-cyan-400 text-xs flex items-center gap-1 keep-colors">
                    <Sparkles size={10} /> 智能推荐中
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-tr-sm shadow-[0_5px_15px_rgba(6,182,212,0.3)] keep-colors' 
                      : 'bg-white/10 text-slate-200 rounded-tl-sm border border-white/5'
                  }`}>
                    {msg.role === 'ai' ? (
                      <div className="ai-markdown [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_code]:bg-white/15 [&_code]:px-1.5 [&_code]:rounded [&_code]:text-xs [&_a]:text-cyan-400 [&_a]:underline hover:[&_a]:text-cyan-300 [&_strong]:font-semibold [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-slate-200 rounded-2xl rounded-tl-sm border border-white/5 px-4 py-2.5 text-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-cyan-400 keep-colors" />
                    思考中...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-black/20 border-t border-white/10 shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="问问今天吃什么..."
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 flex items-center justify-center text-white transition-colors keep-colors"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        drag
        dragConstraints={{ left: -1000, right: 0, top: -800, bottom: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(6,182,212,0.6)] border border-white/20 relative group z-50 keep-colors"
      >
        <Bot size={24} />
        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        {/* Ping animation */}
        {!isOpen && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white/50"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
}
