"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatInterface_1 = __importDefault(require("@/components/ChatInterface"));
function Home() {
    return (<div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-blue-500 text-center mb-8">AI Consultant Chat</h1>
        <ChatInterface_1.default />
      </div>
    </div>);
}
exports.default = Home;
