'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import '../app/globals.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/prism";
import { MessageSquare, Send, Bot, PlusCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CollapsibleEditor from './CollapsibleEditor';
import FileButton from './FileButton';

/* test prompt: 
Give me three tsx files using tailwind for a login page, a register page and a profile page
*/

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  type?: 'collapsible';
  files?: {
    name: string;
    content: string;
    language: string;
  }[];
}

interface ConsultantState {
  phase: 'clarification' | 'proposal' | 'detailed' | null;
  lastProposal: string | null;
}

interface ProcessedContent {
  type: 'text' | 'code';
  content: string;
  language?: string;
  id?: string;
}

interface ChatInterfaceProps {
  isEditorOpen: boolean;
  setIsEditorOpen: (value: boolean) => void;
}

export default function ChatInterface({ isEditorOpen, setIsEditorOpen }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConsultantMode, setIsConsultantMode] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFiles, setActiveFiles] = useState<Message['files']>([]);
  const [consultantState, setConsultantState] = useState<ConsultantState>({
    phase: null,
    lastProposal: null
  });

  const openEditor = () => setIsEditorOpen(true);
  const closeEditor = () => setIsEditorOpen(false);


  // Handle opening/closing the editor with file content
  const handleOpenEditor = (files: Message['files']) => {
    if (files && files.length > 0) {
      if (isEditorOpen && JSON.stringify(activeFiles) === JSON.stringify(files)) {
        // Close if clicking same files
        closeEditor();
        setActiveFiles([]);
      } else {
        // Open with new files
        setActiveFiles(files);
        openEditor();
      }
    }
  };

  // Process message content to separate code blocks and text
  const processContent = (text: string): ProcessedContent[] => {
    const lines = text.split('\n');
    const processed: ProcessedContent[] = [];
    let currentBlock: ProcessedContent = { type: 'text', content: '' };
    
    lines.forEach((line, index) => {
      const codeBlockMatch = line.trim().match(/^```(\w*)$/);
      
      if (codeBlockMatch) {
        if (currentBlock.type === 'code') {
          // End of code block
          if (currentBlock.content.trim()) {
            processed.push(currentBlock);
          }
          currentBlock = { type: 'text', content: '' };
        } else {
          // Start of code block
          if (currentBlock.content.trim()) {
            processed.push(currentBlock);
          }
          currentBlock = {
            type: 'code',
            language: codeBlockMatch[1] || 'plaintext',
            content: '',
            id: `code-${Date.now()}-${index}`
          };
        }
      } else {
        currentBlock.content += line + '\n';
      }
    });

    if (currentBlock && currentBlock.content.trim()) {
      processed.push(currentBlock);
    }

    return processed;
  };

  // Copy code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  // Function to format Code block, numbered lists...
  const formatTextContent = (text: string) => {
    const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
    const textWithoutCodeBlocks = text.replace(codeBlockRegex, '');

    const lines = textWithoutCodeBlocks.split('\n');
    return lines.map((line, i) => {
      const numberMatch = line.match(/^(\d+)\.\s+(.+)/);
      if (numberMatch) {
        return (
          <div key={i} className="flex items-start space-x-2 mt-1">
            <span className="text-blue-400">{numberMatch[1]}.</span>
            <span className='text-white'>{numberMatch[2]}</span>
          </div>
        );
      }
      if (line.trim().match(/^[-*]\s+/)) {
        return (
          <div key={i} className="flex items-start space-x-2 mt-1 ml-2">
            <span className="text-blue-200">•</span>
            <span>{line.trim().replace(/^[-*]\s+/, '')}</span>
          </div>
        );
      }
      return line.trim() && <p key={i} className="mt-1 text-white">{line}</p>;
    });
  };

  // Format the entire message content
  const formatMessage = (message: Message) => {
    console.log("message", message);
    if (message.type === 'collapsible' && message.files) {
      console.log("Found collapsible message:", message);
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mt-2">
            {message.files.map((file) => (
              <FileButton
                key={file.name}
                fileName={file.name}
                language={file.language}
                onClick={() => handleOpenEditor(message.files)}
              />
            ))}
          </div>
          {formatTextContent(message.content)}
        </div>
      );
    }

    const processed = processContent(message.content);
    return processed.map((block, index) => {
      if (block.type === 'text') {
        return <div key={index}>{formatTextContent(block.content)}</div>;
      } else {
        return (
          <div key={block.id} className="relative max-w-full w-full overflow-x-auto my-2 rounded-lg border border-gray-600/30 shadow-lg scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <button
              onClick={() => copyToClipboard(block.content)}
              className="absolute right-2 top-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm transition-colors"
            >
              📋 Copy
            </button>
            <SyntaxHighlighter
              language={block.language}
              style={nightOwl}
              className="!mt-0 !mb-0 rounded-lg text-xs scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
              {block.content.trim()}
            </SyntaxHighlighter>
          </div>
        );
      }
    });
  };

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
    setIsEditorOpen(false);
    setActiveFiles([]);
    setConsultantState({
      phase: isConsultantMode ? 'clarification' : null,
      lastProposal: null
    });
  };

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

      if (data.choices?.[0]?.message) {
        const assistantMessage = data.choices[0].message;
        console.log("Received assistant message:", assistantMessage);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: assistantMessage.content,
          id: Date.now().toString(),
          type: assistantMessage.type,
          files: assistantMessage.files
        }]);

        if (isConsultantMode) {
          if (assistantMessage.content.toLowerCase().includes('would you like a more detailed explanation') ||
              (consultantState.phase === 'clarification' && 
               !assistantMessage.content.toLowerCase().includes('please clarify') &&
               !assistantMessage.content.toLowerCase().includes('could you provide more details'))) {
            setConsultantState(prev => ({
              ...prev,
              phase: 'proposal',
              lastProposal: assistantMessage.content
            }));
          } else if (assistantMessage.content.toLowerCase().includes('could you please clarify') ||
                    assistantMessage.content.toLowerCase().includes('could you provide more details')) {
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
    <div className="flex h-[90vh] w-full relative overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      {/* Chat Area */}
      <motion.div 
        style={{ width: '50vw' }}
        initial={{ left: '50vw' }} 
        animate={isEditorOpen ? { left: '10px', width: '40vw' } : { left: '23vw' }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="flex flex-col ml-10 top-0 w-full h-full bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-2xl absolute overflow-hidden"
      > 
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border-b border-gray-700/50 backdrop-blur-sm bg-gradient-to-r from-gray-800/90 via-gray-800/95 to-gray-800/90"
        >
          <div className="px-4 py-4">
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
                <span className="text-blue-500 font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">AI Consultant Chat</span>
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
          </div>
        </motion.div>

        {/* Messages Container */}
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
                  className={`max-w-[80%] rounded-2xl p-3 shadow-lg ${
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
                    <div className="prose prose-invert prose-slate max-w-none w-full overflow-hidden">
                      {formatMessage(message)}
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
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <motion.div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i === 0
                              ? "bg-blue-500"
                              : i === 1
                              ? "bg-indigo-500"
                              : "bg-violet-500"
                          }`}
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: delay,
                          }}
                        />
                      ))}
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
                <motion.div>
                  <Send className="w-5 h-5" />
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </motion.form>
      </motion.div>

      {/* Collapsible Editor */}
      <AnimatePresence>
        {isEditorOpen && activeFiles && (
          <CollapsibleEditor
            files={activeFiles}
            onClose={() => {
              setIsEditorOpen(false);
              setActiveFiles([]);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}