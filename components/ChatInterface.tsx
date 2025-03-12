"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Send, Bot, PlusCircle } from 'lucide-react';

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

    const newMessage: Message = { role: 'user', content: input };
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
          messages: updatedMessages,
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
          content: assistantMessage
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
    <div className="flex flex-col h-[80vh] bg-gray-800 rounded-lg shadow-xl">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-blue-500" />
            <span className="text-blue-500 font-semibold">Chat Assistant</span>
          </div>
          <Button
            onClick={handleNewChat}
            variant="ghost"
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            size="sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        <div className="flex items-center justify-end space-x-4">
          {isConsultantMode && (
            <Input
              type="text"
              placeholder="Project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-32 bg-gray-700 text-white border-gray-600"
            />
          )}
          <div className="flex items-center space-x-2">
            <Switch
              checked={isConsultantMode}
              className="data-[state=checked]:bg-indigo-500"
              onCheckedChange={handleConsultantModeChange}
            />
            <span className="text-sm text-gray-300">Consultant Mode</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="w-5 h-5 mt-1 text-blue-400 flex-shrink-0" />
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
                  <MessageSquare className="w-5 h-5 mt-1 text-indigo-300 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-400 animate-pulse" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 text-red-500 rounded-lg p-3">
              <p>{error}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-700 text-white border-gray-600"
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
