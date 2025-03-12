import { NextResponse } from 'next/server';
import MistralAI from '@mistralai/mistralai';

// System messages for different phases
const SYSTEM_MESSAGES = {
  default: "You are a helpful assistant focused on providing clear and concise responses.",
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

  detailed: `You are an expert technical consultant providing in-depth analysis. Format your response like this:

    Here is a detailed Analysis of [Aspect]:

    Technical Overview:
    1. [Detailed explanation of the core concepts]
    2. [Architecture patterns and their relationships]
    3. [Key technical considerations]

    Implementation Considerations:
    - [Specific implementation detail]
    - [Best practices to follow]
    - [Potential pitfalls to avoid]

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

interface ConsultantState {
  phase: 'clarification' | 'proposal' | 'detailed' | null;
  lastProposal: string | null;
}

// Initialize MistralClient
if (!process.env.MISTRAL_API_KEY) {
  throw new Error('MISTRAL_API_KEY environment variable is required');
}
const client = new MistralAI(process.env.MISTRAL_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, isConsultantMode, projectId, consultantState } = body;
    
    // Handle system message based on mode and phase
    let systemMessage;
    if (!isConsultantMode) {
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

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during chat processing' },
      { status: 500 }
    );
  }
}
