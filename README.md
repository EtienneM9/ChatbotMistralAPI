# Technical AI Consultant Chat

A specialized chat interface powered by Mistral AI that provides expert technical consulting through an intelligent conversation flow. This chatbot is part of a larger personal project focused on creating AI-powered development tools and assistants.

✨ Try it live: [Demo Link] (coming soon)

### Base application
![Chat Interface Preview](public/images/baseapp.png)

### Chat preview
![Chat Interface Preview](public/images/chat.png)

### AI thinking
![Chat Interface Preview](public/images/thinking.png)

## Quick Start 🚀

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Mistral AI API key

### Installation

1. Clone and install dependencies:
```bash
git clone [repository-url]
cd project
npm install
```

2. Set up environment variables:
```bash
# Copy the example environment file and add your Mistral AI key
cp .env.example .env
# Edit .env and replace 'your_api_key_here' with your actual Mistral AI key
```

> **Note:** You can get a Mistral AI API key by signing up at [Mistral AI Platform](https://mistral.ai)

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide 📘

### Basic Chat Mode
- Start typing to interact with the AI assistant
- Click "New Chat" to clear the conversation and start fresh
- Messages are automatically formatted for readability
- Code blocks and technical content are properly highlighted

### Consultant Mode
1. Enable Consultant Mode using the toggle switch
2. (Optional) Add a Project ID for context-specific recommendations
3. Experience a structured conversation flow:

   **Phase 1: Clarification**
   - AI asks focused questions about your requirements
   - Helps understand technical constraints and goals
   - Ensures accurate recommendations

   **Phase 2: Recommendations**
   - Receives concise technical proposals
   - Lists key benefits and considerations
   - Option to request detailed explanations

   **Phase 3: Detailed Analysis**
   - In-depth technical explanations
   - Implementation considerations
   - Best practices and optimization suggestions

## Technical Implementation 🛠️

### Frontend Architecture

The chat interface is built with:
- Next.js 13+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- framer-animation, lucid-react, radix-ui for UI components

Key features:
- Real-time message formatting
- Auto-scrolling message container
- Responsive design
- Dark mode optimized
- Animated user experience
- Simple and intuitive

### API Integration

The backend seamlessly integrates with Mistral AI:

```typescript
// Example API call structure
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    messages: messageHistory,
    isConsultantMode: true,
    projectId: "optional-project-id",
    consultantState: {
      phase: "clarification" | "proposal" | "detailed"
    }
  })
});
```

### Message Processing

Messages are processed and formatted for optimal readability:
- Numbered lists are properly indented and styled
- Bullet points use consistent formatting
- Code blocks are syntax highlighted
- Technical diagrams (when included) are properly rendered

### State Management

The chat maintains several state elements:
- Message history
- Consultant mode status
- Current conversation phase
- Project context
- Loading states
- Error handling

## Features Overview 🌟

### Core Features
- Real-time chat interface
- Message history management
- New chat functionality
- Error handling and recovery

### Consultant Mode Capabilities
- Three-phase conversation flow
- Context-aware responses
- Project-specific recommendations
- Technical expertise in:
  - Architecture design
  - Technology selection
  - Best practices
  - Performance optimization
  - Implementation strategies

### UI/UX Features
- Clean, intuitive interface
- Responsive design
- Progress indicators
- Error notifications
- Message formatting
- Auto-scrolling

## Contributing 🤝

This project is part of a larger personal initiative, but contributions are welcome! Please feel free to submit issues and pull requests.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

---

*Note: This chat interface is part of a broader project focused on developing AI-powered development tools and assistants. The consultant mode showcases how AI can provide structured, technical guidance while maintaining context and following a clear conversation flow.*
