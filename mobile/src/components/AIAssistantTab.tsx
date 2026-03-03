import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Utensils,
  Clock,
  Flame,
  Menu,
  Plus,
  X,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { THEME } from "../config/theme";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

const INITIAL_SUGGESTIONS = [
  "推荐低脂减脂餐",
  "现在哪个档口排队最少？",
  "想吃点辣的，有什么推荐？",
  "今天有什么特价菜？",
];

export function AIAssistantTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "你好！我是你的食堂AI点餐助手 🤖\n\n不知道吃什么？时间太紧？或者想找点特定口味的菜品？随时问我！",
      suggestions: INITIAL_SUGGESTIONS,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const historyChats = [
    { id: 1, title: "推荐低脂减脂餐", time: "今天 12:30" },
    { id: 2, title: "想吃点辣的", time: "昨天 18:15" },
    { id: 3, title: "现在哪个档口排队最少？", time: "周二 11:45" },
  ];

  const startNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "你好！我是你的食堂AI点餐助手 🤖\n\n不知道吃什么？时间太紧？或者想找点特定口味的菜品？随时问我！",
        suggestions: INITIAL_SUGGESTIONS,
      },
    ]);
  };

  const loadHistoryChat = (chatId: number) => {
    // Mock loading history
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `这是历史对话记录 #${chatId} 的内容。`,
      }
    ]);
    setIsDrawerOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      if (!API_BASE_URL) {
        console.warn("VITE_API_BASE_URL 为空，请检查 .env 并重启前端 dev (npm run dev)");
        throw new Error("未配置 VITE_API_BASE_URL，请在 .env 中设置后端地址");
      }

      const url = `${API_BASE_URL}/api/ai/chat`;
      console.log("AI 请求:", "POST", url);

      const systemContent = `你是一个大学食堂的智能点餐助手。你的语气应该活泼、友好、像个懂吃的朋友。
食堂目前有以下档口：
1. 川香麻辣烫（排队较长，口味重，人均18元）
2. 健康轻食沙拉（出餐快，低脂，人均25元）
3. 老北京炸酱面（排队中等，碳水满足，人均15元）
4. 日式咖喱屋（出餐较快，口味浓郁，人均20元）

请给出简短、有建设性的建议。如果用户赶时间，推荐出餐快的。如果用户不知道吃什么，可以随机推荐并给出理由。`;

      const apiMessages: { role: string; content: string }[] = [
        { role: "system", content: systemContent },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text },
      ];

      // 请求走 Spring Boot，由后端转调 FastAPI ai-service（DeepSeek）
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const raw = await res.text();
      let data: { code?: number; data?: { content?: string }; message?: string; content?: string };
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`响应不是 JSON，状态 ${res.status}，内容: ${raw.slice(0, 200)}`);
      }
      const content =
        (data?.data?.content ?? data?.content ?? "").trim() ||
        "前端取到了空值";

      if (!res.ok) {
        throw new Error(data?.message ?? data?.content ?? `请求失败 ${res.status}`);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const message = error instanceof Error ? error.message : "未知错误";
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: message.includes("未配置") ? message : "哎呀，网络好像有点小问题，请稍后再试哦 🥲",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col relative">
      {/* Header */}
      <div 
        className="px-6 pt-6 pb-3 sticky top-0 z-20 shadow-sm text-white"
        style={{ backgroundColor: THEME.colors.primary }}
      >
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2">
            <Sparkles size={20} />
          </div>

          <button 
            onClick={startNewChat}
            className="p-2 -mr-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* History Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/50 z-30"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-72 bg-white z-40 shadow-2xl flex flex-col"
            >
              <div 
                className="px-6 pt-6 pb-4 flex justify-between items-center text-white"
                style={{ backgroundColor: THEME.colors.primary }}
              >
                <h2 className="font-bold text-lg">历史对话</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {historyChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => loadHistoryChat(chat.id)}
                    className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-start gap-3 group"
                  >
                    <MessageSquare size={18} className="text-gray-400 mt-0.5 group-hover:text-[#FF6B6B] transition-colors" />
                    <div>
                      <div className="font-medium text-gray-800 text-sm line-clamp-1">{chat.title}</div>
                      <div className="text-xs text-gray-400 mt-1">{chat.time}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-32 no-scrollbar w-full max-w-4xl mx-auto">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "",
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                  msg.role === "user"
                    ? "bg-gray-200"
                    : "bg-gradient-to-br from-[#FF6B6B] to-orange-400",
                )}
              >
                {msg.role === "user" ? (
                  <User size={16} className="text-gray-600" />
                ) : (
                  <Bot size={16} className="text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-2">
                <div
                  className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === "user"
                      ? "bg-[#FF6B6B] text-white rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-tl-sm border border-gray-100",
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="markdown-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="my-1.5 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          ul: ({ children }) => <ul className="my-1.5 list-disc pl-4 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="my-1.5 list-decimal pl-4 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          code: ({ children }) => <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>

                {/* Suggestions */}
                {msg.suggestions && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {msg.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(suggestion)}
                        className="text-xs bg-white border border-[#FF6B6B]/30 text-[#FF6B6B] px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors shadow-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 max-w-[85%]"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B6B] to-orange-400 flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="text-[#FF6B6B] animate-spin" />
                <span className="text-sm text-gray-500">正在思考...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 pb-safe z-20">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1.5 pr-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="告诉助手你的口味或需求..."
              className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none text-gray-800 placeholder-gray-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-[#FF6B6B] rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FF8E8E] transition-colors shadow-sm"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
