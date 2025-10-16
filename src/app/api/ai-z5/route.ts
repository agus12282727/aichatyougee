import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Session management
const sessions = new Map<string, { chat_id: string; history: any[] }>();

function getUserSession(userId: string) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      chat_id: crypto.randomUUID(),
      history: []
    });
  }
  return sessions.get(userId)!;
}

function resetUserSession(userId: string) {
  sessions.set(userId, {
    chat_id: crypto.randomUUID(),
    history: []
  });
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, resetSession } = await request.json();

    if (resetSession) {
      resetUserSession(userId);
      return NextResponse.json({ success: true, message: 'Session reset' });
    }

    const session = getUserSession(userId);
    const system_prompt = "Kamu adalah AI z-5s buatan Zenno orang Indonesia. Jawab jelas, singkat, ramah, dan profesional. Bisa bantu menjelaskan, memberi saran, menjawab pertanyaan umum, atau membantu berpikir.";

    // Prepare messages for API
    const messagesForApi = [
      { role: 'system', content: system_prompt },
      ...session.history,
      { role: 'user', content: message }
    ];

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const zai = await ZAI.create();
          
          // Get auth token
          const authResponse = await fetch('https://chat.z.ai/api/v1/auths/', {
            headers: {
              'user-agent': 'Mozilla/5.0 (Android 15; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0'
            }
          });
          
          const authData = await authResponse.json();
          const cookies = authResponse.headers.get('set-cookie') || '';

          // Send chat completion request
          const response = await fetch('https://chat.z.ai/api/chat/completions', {
            method: 'POST',
            headers: {
              'authorization': `Bearer ${authData.token}`,
              'cookie': cookies,
              'x-fe-version': 'prod-fe-1.0.52',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              messages: messagesForApi,
              model: '0727-360B-API',
              chat_id: session.chat_id,
              id: crypto.randomUUID(),
              stream: true
            })
          });

          if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          let fullAnswer = '';
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              
              try {
                const jsonStr = line.substring(6);
                if (!jsonStr) continue;
                
                const data = JSON.parse(jsonStr);
                if (data?.data?.delta_content) {
                  const deltaContent = data.data.delta_content;
                  fullAnswer += deltaContent;
                  
                  // Send the chunk to the client
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: deltaContent, fullContent: fullAnswer })}\n\n`)
                  );
                }
              } catch (e) {
                // Skip invalid JSON
                continue;
              }
            }
          }

          // Save to session history
          session.history.push({ role: 'user', content: message });
          session.history.push({ role: 'assistant', content: fullAnswer });

          // Send completion signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, fullContent: fullAnswer })}\n\n`)
          );
          
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'AI API is running' });
}