import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';

import { aiAssistantMenuContext, aiAssistantInitialMessage } from '../../mocks/aiAssistant';

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';

function getApiKey(): string | null {
  const key = process.env.DEEPSEEK_API_KEY;
  return key && key !== '' ? key : null;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    aiAssistantInitialMessage,
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    const apiKey = getApiKey();
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'ai', text: '请先在 screen 目录下配置 .env 中的 DEEPSEEK_API_KEY 后重启开发服务器。' }]);
      setIsLoading(false);
      return;
    }

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));
      const systemPrompt = `你是一个大学食堂的AI助手，负责给学生推荐菜品、回答关于食堂的问题。请保持热情、友好、活泼的语气。

以下是今日的菜单信息：
${aiAssistantMenuContext}

请根据以上信息给出回答。如果学生问的问题与食堂无关，请委婉地引导回食堂的话题。`;

      const res = await fetch(DEEPSEEK_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      setMessages(prev => [...prev, { role: 'ai', text: content || '抱歉，我暂时无法回答这个问题。' }]);
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
                    {msg.text}
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
