import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-blue-500 text-center mb-8">AI Consultant Chat</h1>
        <ChatInterface />
      </div>
    </div>
  );
}
