import { NextResponse } from 'next/server'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
})

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
}

const TIMEOUT_DURATION = 60000; // 60 seconds in milliseconds

// Add timeout wrapper function
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    )
  ]);
};

async function askGemini(prompt: string) {
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  })
  
  try {
    const result = await withTimeout(
      chatSession.sendMessage(prompt),
      TIMEOUT_DURATION
    );
    return result.response.text();
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timed out') {
      throw new Error('Generation request timed out after 60 seconds');
    }
    throw error;
  }
}

function formatFlowchart(flowchart: string): string {
  const cleaned = flowchart
    .trim()
    .replace(/```mermaid\n?|```/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')

  const lines = cleaned.split('\n').map(line => {
    line = line.trim()

    if (line.startsWith('graph')) {
      return 'graph TD'
    }

    // Handle connections and labels
    return line
      // Fix node definitions
      .replace(/([A-Za-z0-9_]+)\s*\[(.*?)\]/g, '$1["$2"]')
      // Fix arrow labels
      .replace(/-->\s*\|(.*?)\|/g, '-->|$1|')
      .replace(/\s*-->\s*/g, ' --> ')
      .replace(/;/g, '')
      .trim()
  })
  .filter(line => line.length > 0)

  return lines.join('\n')
}

export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })  
    }

    const contentPrompt = `
      Analyze this code and provide a technical documentation in HTML format:
      ${code}
      Format your response as valid HTML with these sections:
      - Overview
      - Components/Functions 
      - Implementation Details
      - Best Practices
      Use <h2>, <p>, <ul>, and <li> tags for structure.
    `

    const flowchartPrompt = `
      Create a Mermaid diagram that accurately represents the structure and flow of this specific code:
      ${code}

      Rules:
      1. For code with classes/interfaces use:
         Example:
         classDiagram
         class ClassName {
           +property: type
           -privateMethod()
           +publicMethod()
         }
         ClassName <|-- ChildClass

      2. For procedural/functional code use:
         Example:
         graph TD
         A[Function Start] --> B[Process Step]
         B --> C{Decision}
         C -->|Yes| D[Action]
         C -->|No| E[Other Action]

      3. Focus only on the main components and flow in the provided code
      4. Use clear, descriptive node labels instead of generic A, B, C
      5. Include error handling flows if present
      6. Don't include implementation details that aren't in the code

      Return ONLY valid Mermaid diagram syntax without any explanation or markdown formatting.
    `

    try {
      const [contentResponse, flowchartResponse] = await withTimeout(
        Promise.all([
          askGemini(contentPrompt),
          askGemini(flowchartPrompt)
        ]),
        TIMEOUT_DURATION
      );

      let sanitizedContent = contentResponse
        .trim()
        .replace(/^```html\s*|\s*```$/g, '') // Remove ```html and ``` markers
      if (!sanitizedContent.startsWith('<')) {
        sanitizedContent = `<div>${sanitizedContent}</div>`
      }

      let sanitizedFlowchart = formatFlowchart(flowchartResponse)

      // Basic syntax validation
      if (!sanitizedFlowchart.startsWith('graph TD') || 
          !sanitizedFlowchart.includes('-->') ||
          sanitizedFlowchart.length < 10) {
        return NextResponse.json(
          { error: 'Invalid flowchart syntax generated' }, 
          { status: 422 }
        )
      }

      return NextResponse.json({
        content: sanitizedContent,
        flowchart: sanitizedFlowchart,
      })

    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        return NextResponse.json(
          { error: 'Generation request timed out. Please try with a smaller code sample.' },
          { status: 408 }
        );
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in generate route:', error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    return NextResponse.json(
      {
        error: 'Failed to generate documentation. Please try again.',
        details: errorMessage
      },
      { status: error instanceof Error && error.message.includes('timed out') ? 408 : 500 }
    )
  }
}

