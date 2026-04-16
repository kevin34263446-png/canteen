'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是美食星云的AI推荐官，你的懂吃又懂健康的学长！有什么关于食堂、菜品或健康饮食的问题吗？'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，我暂时无法回应。请检查DeepSeek API配置或稍后重试。'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed right-4 bottom-4 z-[70] w-[90vw] md:w-[420px] h-[70vh] md:h-[600px]"
          >
            <div className="w-full h-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">美食星云 AI 助手</h3>
                    <p className="text-xs text-gray-400">懂吃又懂健康的学长</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                      <div className={`px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-tr-sm'
                          : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/5 px-4 py-3 rounded-2xl border border-white/10 rounded-tl-sm">
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="问我关于美食的问题..."
                    className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white flex items-center justify-center hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
