"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Send, Bot, PlusCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Function to format numbered lists in the text
const formatMessage = (text: string) => {
  // Split the text into lines
  const lines = text.split('\n');
  
  // Process each line
  return lines.map((line, i) => {
    // Check if line starts with a number followed by a dot
    const numberMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numberMatch) {
      return (
        <div key={i} className="flex items-start space-x-2 mt-1">
          <span className="text-blue-400">{numberMatch[1]}.</span>
          <span>{numberMatch[2]}</span>
        </div>
      );
    }
    // Check if line starts with a dash or asterisk (bullet points)
    if (line.trim().match(/^[-*]\s+/)) {
      return (
        <div key={i} className="flex items-start space-x-2 mt-1 ml-2">
          <span className="text-blue-400">•</span>
          <span>{line.trim().replace(/^[-*]\s+/, '')}</span>
        </div>
      );
    }
    // Regular text
    return line.trim() && <p key={i} className="mt-1">{line}</p>;
  });
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

interface ConsultantState {
  phase: 'clarification' | 'proposal' | 'detailed' | null;
  lastProposal: string | null;
}

export default function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConsultantMode, setIsConsultantMode] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consultantState, setConsultantState] = useState<ConsultantState>({
    phase: null,
    lastProposal: null
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setError(null);
    setConsultantState({
      phase: isConsultantMode ? 'clarification' : null,
      lastProposal: null
    });
  };

  // Reset consultant state when toggling mode
  const handleConsultantModeChange = (checked: boolean) => {
    setIsConsultantMode(checked);
    if (checked) {
      setConsultantState({ phase: 'clarification', lastProposal: null });
    } else {
      setConsultantState({ phase: null, lastProposal: null });
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = { 
      role: 'user', 
      content: input,
      id: Date.now().toString()
    };
    const updatedMessages = [...messages, newMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          isConsultantMode,
          projectId: isConsultantMode ? projectId : null,
          consultantState
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.choices?.[0]?.message?.content) {
        const assistantMessage = data.choices[0].message.content;
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: assistantMessage,
          id: Date.now().toString()
        }]);

        if (isConsultantMode) {
          // Update consultant state based on message content
          // Transition to proposal phase when AI provides recommendations
          if (assistantMessage.toLowerCase().includes('would you like a more detailed explanation') ||
              (consultantState.phase === 'clarification' && 
               !assistantMessage.toLowerCase().includes('please clarify') &&
               !assistantMessage.toLowerCase().includes('could you provide more details'))) {
            setConsultantState(prev => ({
              ...prev,
              phase: 'proposal',
              lastProposal: assistantMessage
            }));
          } else if (assistantMessage.toLowerCase().includes('could you please clarify') ||
                    assistantMessage.toLowerCase().includes('could you provide more details')) {
            setConsultantState(prev => ({
              ...prev,
              phase: 'clarification'
            }));
          } else if (consultantState.phase === 'proposal' && 
                    (input.toLowerCase().includes('yes') || input.toLowerCase().includes('please explain'))) {
            setConsultantState(prev => ({
              ...prev,
              phase: 'detailed'
            }));
          }
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isConsultantMode, projectId, consultantState]);

  return (
    <div className="flex flex-col h-[80vh] w-full max-w-4xl relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gray-900 z-0">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent"></div>
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
        <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-indigo-500 to-transparent opacity-50"></div>
        <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent opacity-50"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              background: i % 3 === 0 ? '#6366f1' : i % 3 === 1 ? '#3b82f6' : '#8b5cf6',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 20}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Chat container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col h-full bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-2xl z-10 relative overflow-hidden"
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 border-b border-gray-700/50 backdrop-blur-sm bg-gradient-to-r from-gray-800/90 via-gray-800/95 to-gray-800/90"
        >
          <div className="flex items-center justify-between mb-2">
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <div className="relative">
                <Bot className="w-6 h-6 text-blue-500" />
                <motion.div 
                  className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <span className="text-blue-500 font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Chat Assistant</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleNewChat}
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-gray-700/70 transition-all duration-300 ease-out"
                size="sm"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </motion.div>
          </div>
          <div className="flex items-center justify-end space-x-4">
            {isConsultantMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  type="text"
                  placeholder="Project ID"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-32 bg-gray-700/70 text-white border-gray-600/50 focus:border-indigo-500/70 transition-all duration-300"
                />
              </motion.div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                checked={isConsultantMode}
                className="data-[state=checked]:bg-indigo-500"
                onCheckedChange={handleConsultantModeChange}
              />
              <span className="text-blue-500 font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Consultant Mode</span>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ 
                  opacity: 0, 
                  y: 20,
                  x: message.role === 'user' ? 20 : -20
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  x: 0
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.1 > 0.5 ? 0.5 : index * 0.1
                }}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-3 shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
                      : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-100'
                  } border ${
                    message.role === 'user'
                      ? 'border-indigo-500/30'
                      : 'border-gray-600/30'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <div className="relative">
                        <Bot className="w-5 h-5 mt-1 text-blue-400 flex-shrink-0" />
                        <motion.div 
                          className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"
                          animate={{ 
                            scale: [1, 1.5, 1],
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        />
                      </div>
                    )}
                    <div className="prose prose-invert prose-slate max-w-none 
                      prose-headings:text-gray-100 
                      prose-p:text-gray-100 
                      prose-strong:text-gray-100
                      prose-ul:text-gray-100 prose-ol:text-gray-100
                      prose-li:marker:text-blue-400
                      [&>ul]:pl-4 [&>ol]:pl-4
                      [&>ul>li]:pl-2 [&>ol>li]:pl-2
                      [&>ul>li]:mt-2 [&>ol>li]:mt-2">
                      {formatMessage(message.content)}
                    </div>
                    {message.role === 'user' && (
                      <div className="relative">
                        <MessageSquare className="w-5 h-5 mt-1 text-indigo-300 flex-shrink-0" />
                        <motion.div 
                          className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-indigo-400 rounded-full"
                          animate={{ 
                            scale: [1, 1.5, 1],
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-start"
              >
                <div className="bg-gray-700/80 backdrop-blur-sm text-gray-100 rounded-2xl p-3 border border-gray-600/30 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Bot className="w-5 h-5 text-blue-400" />
                      <motion.div 
                        className="absolute inset-0 rounded-full border-2 border-blue-400/30"
                        animate={{ 
                          scale: [1, 1.3, 1],
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                        }}
                      />
                    </div>
                    <div className="flex space-x-1">
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-blue-500"
                        animate={{ 
                          y: [0, -5, 0],
                        }}
                        transition={{ 
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0
                        }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-indigo-500"
                        animate={{ 
                          y: [0, -5, 0],
                        }}
                        transition={{ 
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.2
                        }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-violet-500"
                        animate={{ 
                          y: [0, -5, 0],
                        }}
                        transition={{ 
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.4
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex justify-center"
              >
                <div className="bg-red-500/10 text-red-500 rounded-lg p-3 border border-red-500/20 backdrop-blur-sm">
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          onSubmit={handleSubmit} 
          className="p-4 border-t border-gray-700/50 backdrop-blur-sm bg-gradient-to-r from-gray-800/90 via-gray-800/95 to-gray-800/90"
        >
          <div className="flex space-x-2 relative">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-700/70 text-white border-gray-600/50 focus:border-indigo-500/70 transition-all duration-300 pr-10 backdrop-blur-sm"
              />
              <motion.div 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                animate={{ 
                  opacity: input.length > 0 ? 0 : [0.5, 0.8, 0.5],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Sparkles size={16} />
              </motion.div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-500/20"
              >
                <motion.div
                  animate={isLoading ? { rotate: 360 } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Send className="w-5 h-5" />
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}