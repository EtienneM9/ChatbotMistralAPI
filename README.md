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

### Built With

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![Tailwindcss][Tailwindcss]][Tailwindcss-url]
* [![Framer-motion][Framer-motion]][framer-url]
* [![MistralAI][MistralAI]][MistralAI-url]

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
   - Interactive code examples with collapsible editor

### Collapsible Editor Feature ✨
The chat interface now includes a powerful collapsible editor that provides:
- Side-by-side view of chat and code
- Multi-file support with tabs
- Syntax highlighting for various languages
- Copy-to-clipboard functionality
- Smooth animations and transitions
- File-specific language indicators

When the AI provides multiple code files, they appear as clickable buttons in the chat. Clicking a file button opens the collapsible editor with:
- Full-screen code view
- Easy navigation between files
- Code highlighting and formatting
- Ability to copy entire files
- Seamless integration with the chat flow

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
- Collapsible code editor with multi-file support

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

### Message Types and Processing

Messages can now be of two types:
1. Regular messages with inline code blocks
2. Collapsible messages containing multiple files:
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'collapsible';
  files?: {
    name: string;
    content: string;
    language: string;
  }[];
}
```

Messages are processed and formatted for optimal readability:
- Numbered lists are properly indented and styled
- Bullet points use consistent formatting
- Code blocks are syntax highlighted
- Technical diagrams (when included) are properly rendered
- Multiple files are organized into an interactive UI

### State Management

The chat maintains several state elements:
- Message history
- Consultant mode status
- Current conversation phase
- Project context
- Loading states
- Error handling
- Editor state (open/closed)
- Active files management

## Features Overview 🌟

### Core Features
- Real-time chat interface
- Message history management
- New chat functionality
- Error handling and recovery
- Collapsible code editor

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
- Smooth transitions
- Interactive code display
- Multi-file management

## Contributing 🤝

This project is part of a larger personal initiative, but contributions are welcome! Please feel free to submit issues and pull requests.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Tailwindcss]: https://img.shields.io/badge/tailwindcss-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white
[Tailwindcss-url]: https://tailwindcss.com/
[Framer-motion]: https://img.shields.io/badge/framer--motion-0055FF?style=for-the-badge&logo=framer&logoColor=white
[framer-url]: https://motion.dev/docs/framer
[MistralAI]: [https://img.shields.io/badge/MistralAI-000000?style=for-the-badge&logo=mistral&logoColor=white](https://img.shields.io/badge/Mistral%20AI-9763F6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzA5IiBoZWlnaHQ9IjE0NCIgdmlld0JveD0iMCAwIDMwOSAxNDQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMTcuNjUgMjQuMTExQzEyMi44MTYgMTcuMTMxNyAxMzIuNzEyIDAgMTQ5LjYwMiAwQzE4NC4zMiAwIDIyMC42NzggMzMuMDY3NyAyNDQuNjggNzMuMjgxMkgyOTMuNjg1QzI5OC4zMDUgNzMuMjgxMiAzMDkgNjcuMDE4NiAzMDkgNjAuNzU1MUMzMDkgNTQuNDkyNSAyOTguMzA1IDQ4LjIzMTkgMjkzLjY4NSA0OC4yMzE5SDI2NC42MDJDMjQxLjM2MSA5LjAwNzQ0IDIwNC41NjUgMCAxNDkuNjAyIDBDOTIuOTI2OCAwIDUzLjEzMjQgMTMuMTM0OCAzMy4wMDI3IDM3LjA3NzZDMTYuMjUwNyA1Ny42NjE2IDkuMzMwMTkgNzMuMjgxMiAwIDczLjI4MTJIMjQuNzkzNkMyNy4zMTAxIDY5LjU1NzUgMzAuNzQ3NSA2NS4wMjA2IDM1LjE5MiA2MC43NTUxQzU3LjE0NDkgNDAuMzMxNyA5NC4yMTMzIDI0LjExMSAxMTcuNjUgMjQuMTExWiIvPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNMTM1LjYgMTAxLjI1NEMxMzIuNjQxIDk3Ljg4MTMgMTI2LjM2OSA5Ny4yODExIDEyMi4wMjIgMTAwLjk5NzRMMTE4LjgxNyAxMDMuODc3QzExNi4xNjQgMTA2LjI2MyAxMTEuNTA1IDEwNi4yNjMgMTA4Ljg1MiAxMDMuODc3TDk2LjA5NTEgOTAuNzQyNUM5Mi4xMjgyIDg2LjU5OTUgODYuMTUyIDg1Ljg0MDMgODEuMzQ2MSA4OS4zNTUzTDcwLjMwMzYgOTcuNzQzMkw1OS4yNjQxIDg5LjM1NTNDNTQuNDU2OSA4NS44NDAzIDQ4LjQ3ODIgODYuNTk5NSA0NC41MTExIDkwLjc0MjVMMzMuNDY5MSAxMDMuODc3QzMwLjgxNDQgMTA2LjI2MyAyNi4xNTYxIDEwNi4yNjMgMjMuNTAxNCAxMDMuODc3TDE3Ljk2NzYgMTAwLjYwMkMxNC42MDEzIDk4LjI0MTggMTQuMTQyOSA5My4xNjc4IDE3LjE0NTMgOTAuMjE2OUw0MC45Mzc2IDY1LjI2NzZDMzQuNzQ4MyA2MC40MDY1IDI4LjMwNzQgNTQuNDkxMyAyMy41MDA4IDQ4LjIzMTRIMTQ4Ljc3OUMxNjEuMjg3IDYzLjk0OCAxNjYuMzc1IDcwLjA5ODggMTc5LjA5OCA4NS4xNjI2TDE5NC4zNDggNzAuNzQ1OEMxOTcuMzg3IDY3LjcyODggMjAzLjcxMSA2Ny4yNzUzIDIwNy40NzUgNzAuNzQ1OEwyMzEuMjc0IDk1LjU1NDZDMTg5LjI3MSAxMzYuOTI4IDE2Ni42MjQgMTM2LjkzOSAxMzUuNjAgMTAxLjI1NFoiLz48L3N2Zz4=
)
[MistralAI-url]: https://docs.mistral.ai/api/
---

*Note: This chat interface is part of a broader project focused on developing AI-powered development tools and assistants. The consultant mode showcases how AI can provide structured, technical guidance while maintaining context and following a clear conversation flow.*
