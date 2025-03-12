"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const switch_1 = require("@/components/ui/switch");
const lucide_react_1 = require("lucide-react");
function ChatInterface() {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [input, setInput] = (0, react_1.useState)('');
    const [isConsultantMode, setIsConsultantMode] = (0, react_1.useState)(false);
    const [projectId, setProjectId] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const handleSubmit = (0, react_1.useCallback)(async (e) => {
        e.preventDefault();
        if (!input.trim())
            return;
        const newMessage = { role: 'user', content: input };
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
                    projectId: isConsultantMode ? projectId : null
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
                setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: data.choices[0].message.content
                    }]);
            }
            else {
                throw new Error('Invalid response format');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
            console.error(errorMessage);
            setError(errorMessage);
        }
        finally {
            setIsLoading(false);
        }
    }, [input, messages, isConsultantMode, projectId]);
    return (<div className="flex flex-col h-[80vh] bg-gray-800 rounded-lg shadow-xl">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <lucide_react_1.Bot className="w-6 h-6 text-blue-500"/>
          <span className="text-blue-500 font-semibold">Chat Assistant</span>
        </div>
        <div className="flex items-center space-x-4">
          {isConsultantMode && (<input_1.Input type="text" placeholder="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-32 bg-gray-700 text-white border-gray-600"/>)}
          <div className="flex items-center space-x-2">
            <switch_1.Switch checked={isConsultantMode} onCheckedChange={setIsConsultantMode} className="data-[state=checked]:bg-indigo-500"/>
            <span className="text-sm text-gray-300">Consultant Mode</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (<div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-lg p-3 ${message.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-100'}`}>
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (<lucide_react_1.Bot className="w-5 h-5 mt-1 text-blue-400"/>)}
                <div>{message.content}</div>
                {message.role === 'user' && (<lucide_react_1.MessageSquare className="w-5 h-5 mt-1 text-indigo-300"/>)}
              </div>
            </div>
          </div>))}
        {isLoading && (<div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <lucide_react_1.Bot className="w-5 h-5 text-blue-400 animate-pulse"/>
                <span>Thinking...</span>
              </div>
            </div>
          </div>)}
        {error && (<div className="flex justify-center">
            <div className="bg-red-500/10 text-red-500 rounded-lg p-3">
              <p>{error}</p>
            </div>
          </div>)}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input_1.Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." className="flex-1 bg-gray-700 text-white border-gray-600"/>
          <button_1.Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            <lucide_react_1.Send className="w-5 h-5"/>
          </button_1.Button>
        </div>
      </form>
    </div>);
}
exports.default = ChatInterface;
