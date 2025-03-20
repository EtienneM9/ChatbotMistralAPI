import { NextResponse } from 'next/server';
import MistralAI from '@mistralai/mistralai';

export const config = {
  runtime: "nodejs", // This ensures it runs as a serverless function
};

// System messages for different phases
const SYSTEM_MESSAGES = {
  default: `You are a helpful assistant focused on providing clear and concise responses.

IMPORTANT FORMATTING INSTRUCTIONS:

1. When ANY of these conditions are met:
   - User requests multiple files (e.g. "Give me X files..." where X > 1)
   - User asks for "multiple examples"
   - You need to generate code longer than 20 lines
   - User needs implementations across different files
   
   You MUST format your response using this exact JSON structure:

   {
     "type": "collapsible",
     "files": [
       {
         "name": "filename.ext",
         "content": "full implementation content",
         "language": "language"
       }
     ]
   }

   CRITICAL: Do not introduce this JSON with phrases like "Here's the JSON:" or "In collapsible format:". 
   CRITICAL:Simply write a brief introduction sentence followed directly by the JSON object.

2. For shorter code snippets (under 20 lines), use standard markdown code blocks:
   \`\`\`language
    code here
    \`\`\`
   `,

  clarification: `You are an expert technical consultant analyzing a user's requirements. 
    If anything is unclear or you need more context, format your response exactly like this (keep the questions simple and short):
    
    I understand you're looking for [brief summary of their request]. To provide the best recommendations, I need some clarification:

    1. [First focused question about their specific requirements]
    2. [Second question about technical constraints or preferences]
    3. [Third question about scale, performance, or other relevant aspects]

    Please provide any details you can. This will help me give you more targeted recommendations.`,

  proposal: `You are an expert technical consultant providing initial recommendations. Format your response exactly like this:

    Based on your requirements, here are my recommendations:

    1. [First key recommendation with brief and short explanation]
    2. [Second key recommendation with brief and short explanation]
    3. [Third key recommendation with brief and short explanation]

    Key benefits of this approach:
    - [First benefit]
    - [Second benefit]
    - [Third benefit]

    Would you like me to provide a more detailed explanation of any specific aspect?`,

  detailed: `You are an expert technical consultant providing in-depth analysis. 
    
For large implementations or multiple files, use this JSON format for the code sections:
{
  "type": "collapsible",
  "files": [
    {
      "name": "filename.ext",
      "content": "code content",
      "language": "language"
    }
  ]
}

For simple code snippets within your explanation, use standard markdown code blocks.

Structure your response like this:

Here is a detailed Analysis of [Aspect]:

Technical Overview:
1. [Detailed explanation of the core concepts]
2. [Architecture patterns and their relationships]
3. [Key technical considerations]

Implementation Details:
[Code implementation here, using either format as appropriate]

Optimizations & Trade-offs:
1. Performance Considerations:
   - [Performance optimization details]
   - [Scalability aspects]

2. Alternative Approaches:
   - [Alternative 1 with pros/cons]
   - [Alternative 2 with pros/cons]

Real-world Example:
[Provide a concrete example of successful implementation]`
};

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

interface ConsultantState {
  phase: 'clarification' | 'proposal' | 'detailed' | null;
  lastProposal: string | null;
}

// Initialize MistralClient
if (!process.env.MISTRAL_API_KEY) {
  throw new Error('MISTRAL_API_KEY environment variable is required');
}
const client = new MistralAI(process.env.MISTRAL_API_KEY);

function tryParseJSON(text: string): any {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    if (start === -1 || end === 0) return null;
    
    const jsonPart = text.slice(start, end);
    return JSON.parse(jsonPart);
  } catch (error) {
    console.log('Not a valid JSON:', error);
    return null;
  }
}

function parseAssistantResponse(content: string): Message {
  console.log('Parsing response:', content);
  
  // Try to find and parse JSON in the response
  const jsonContent = tryParseJSON(content);
  
  if (jsonContent && jsonContent.type === 'collapsible' && Array.isArray(jsonContent.files)) {
    console.log('Found collapsible format:', jsonContent);
    
    // Extract the files
    const files = jsonContent.files.map((file: {
      name: string;
      content: string;
      language: string;
    }) => ({
      name: file.name,
      content: file.content,
      language: file.language
    }));
    
    // Get the text content excluding the JSON part
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}') + 1;
    const cleanContent = content.slice(0, start) + content.slice(end);
    
    return {
      role: 'assistant',
      content: cleanContent.trim(),
      type: 'collapsible',
      files
    };
  }
  
  // Return normal message if no special format or invalid JSON
  return {
    role: 'assistant',
    content
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, isConsultantMode, projectId, consultantState } = body;
    
    // Handle system message based on mode and phase
    let systemMessage;
    if (!isConsultantMode) {
      console.log("default prompt");
      systemMessage = {
        role: "system" as const,
        content: SYSTEM_MESSAGES.default  
      };
    } else {
      // Determine the appropriate phase if not set
      const phase = consultantState?.phase || 'clarification';
      
      // If user's message indicates they want more details and we're in proposal phase
      const lastMessage = messages[messages.length - 1];
      const shouldTransitionToDetailed = 
        phase === 'proposal' && 
        lastMessage?.role === 'user' && 
        (lastMessage.content.toLowerCase().includes('yes') || 
         lastMessage.content.toLowerCase().includes('please explain'));

      const currentPhase = shouldTransitionToDetailed ? 'detailed' : phase;
      const phaseMessage = SYSTEM_MESSAGES[currentPhase as keyof typeof SYSTEM_MESSAGES];

      systemMessage = {
        role: "system" as const,
        content: `${phaseMessage}${projectId ? ` For project: ${projectId}.` : ''}`
      };
    }

    // Include context from previous proposals if we're in detailed phase
    const messageHistory = [systemMessage];
    if (isConsultantMode && consultantState?.phase === 'detailed' && consultantState?.lastProposal) {
      messageHistory.push({
        role: "system" as const,
        content: `Context from previous discussion: ${consultantState.lastProposal}`
      });
    }
    messageHistory.push(...messages);

    const chatResponse = await client.chat({
      model: "mistral-medium",
      messages: messageHistory,
    });

    // Parse response for collapsible format
    const parsedMessage = parseAssistantResponse(chatResponse.choices[0].message.content);
    
    return NextResponse.json({
      choices: [{
        message: parsedMessage,
        index: 0,
        finish_reason: chatResponse.choices[0].finish_reason
      }]
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during chat processing' },
      { status: 500 }
    );
  }
}
