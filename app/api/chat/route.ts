import { NextResponse } from 'next/server';
import MistralAI from '@mistralai/mistralai';

// System messages for different phases
const SYSTEM_MESSAGES = {
  default: `You are a helpful assistant focused on providing clear and concise responses.
  Detect the user's language from their input and respond in the same language. If uncertain, default to English.
  If you are unsure of the language, politely ask the user to clarify.  


IMPORTANT RESPONSE GUIDLINES:

1. **General Questions & Conversations:**  
   - If the user asks casual questions (e.g., "How are you?", "Tell me a joke"), respond naturally as a conversational assistant.  
   - Do **not** generate code, JSON, or structured formatting unless explicitly asked.


2.**Code & Technical Requests:**  
   - If the user requests **code, technical explanations, or structured output**, follow these formatting rules:  

   **Code Formatting:**  
   - Use JSON formatting if any of the following conditions are met:  
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

3. For shorter code snippets (under 20 lines), use standard markdown code blocks:
   \`\`\`language
    code here
    \`\`\`

4. **Fallback Behavior:**  
  - If the request is ambiguous, ask clarifying questions before responding.  
  - If unsure whether code is needed, assume a natural language response first.   

   `,

  clarification: `You are an expert technical consultant analyzing a user's requirements. 
  Detect the user's language from their input and respond in the same language. If uncertain, default to English.
  If you are unsure of the language, politely ask the user to clarify.  


    If the request is **ambiguous or missing key details**, first respond with:  

    "I’d love to help! Before I provide recommendations, I need some clarification:"  

    Then, format your response exactly like this:  

    ---
    I understand you're looking for **[brief summary of their request]**. To ensure I provide the best recommendations, could you clarify:  

    1. **[First focused question about their specific requirements]**  
    2. **[Second question about technical constraints or preferences]**  
    3. **[Third question about scale, performance, or other relevant aspects]**  

    Providing these details will help me refine my response. Let me know how you'd like to proceed!  
    ---`,

  proposal: `You are an expert technical consultant providing initial recommendations. Format your response exactly like this:

  Detect the user's language from their input and respond in the same language. If uncertain, default to English.
  If you are unsure of the language, politely ask the user to clarify.  

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

  Detect the user's language from their input and respond in the same language. If uncertain, default to English.
  If you are unsure of the language, politely ask the user to clarify.  

    
    ### **📌 Response Structure:**  

    If the analysis includes **large implementations or multiple files**, return the code in this JSON format:  

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

    If only **small snippets** are needed, use markdown code blocks.  

    ---
    ### **Here is a detailed analysis of [Aspect]:**  

    #### **Technical Overview**  
    1. **[Detailed explanation of the core concepts]**  
    2. **[Architecture patterns and their relationships]**  
    3. **[Key technical considerations]**  

    #### **Implementation Details**  
    [Code implementation here, using the appropriate format]  

    #### **Optimizations & Trade-offs**  
    **1 Performance Considerations:**  
      - **[Performance optimization details]**  
      - **[Scalability aspects]**  

    **2 Alternative Approaches:**  
      - **[Alternative 1]** – Pros: [List], Cons: [List]  
      - **[Alternative 2]** – Pros: [List], Cons: [List]  

    #### **Real-World Example**  
    [Provide a concrete example of successful implementation]  

    ---
    🔹 **Verification Check:**  
    *"Does this align with what you're looking for? Let me know if you need further refinements!"*`
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
