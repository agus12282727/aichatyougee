'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Menu, 
  X, 
  Plus, 
  Trash2, 
  Copy, 
  Download,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [userId] = useState(() => crypto.randomUUID());
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load chats from localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem('aichat-chats');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })));
      } catch (error) {
        console.error('Failed to load chats:', error);
      }
    }
  }, []);

  // Save chats to localStorage
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('aichat-chats', JSON.stringify(chats));
    }
  }, [chats]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
    setCurrentResponse('');
    setSidebarOpen(false);
  };

  const loadChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      setCurrentResponse('');
      setSidebarOpen(false);
    }
  };

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) {
      createNewChat();
    }
  };

  const updateChatTitle = (chatId: string, title: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, title } : chat
    ));
  };

  const saveMessageToChat = (message: Message) => {
    if (!currentChatId) return;
    
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const updatedMessages = [...chat.messages, message];
        const title = chat.messages.length === 0 && message.role === 'user' 
          ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
          : chat.title;
        return { ...chat, messages: updatedMessages, title };
      }
      return chat;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    saveMessageToChat(userMessage);
    setInput('');
    setIsLoading(true);
    setCurrentResponse('');

    // Create new chat if this is the first message
    if (!currentChatId && chats.length === 0) {
      createNewChat();
    }

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/ai-z5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: userId
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                if (data.content) {
                  setCurrentResponse(prev => prev + data.content);
                  fullResponse += data.content;
                }
                
                if (data.done) {
                  const assistantMessage: Message = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, assistantMessage]);
                  saveMessageToChat(assistantMessage);
                  setCurrentResponse('');
                }
              } catch (e) {
                // Skip invalid JSON
                continue;
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: "Request cancelled",
          description: "The request was cancelled",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const regenerateResponse = async () => {
    if (messages.length === 0) return;
    
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return;

    // Remove the last assistant message
    setMessages(prev => prev.slice(0, -1));
    
    // Resend the last user message
    setInput(lastUserMessage.content);
    setTimeout(() => {
      const form = document.getElementById('chat-form') as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  const resetSession = async () => {
    try {
      await fetch('/api/ai-z5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          resetSession: true
        })
      });
      
      createNewChat();
      toast({
        title: "Session reset",
        description: "Chat session has been reset",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset session",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4">
            <Button onClick={createNewChat} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentChatId === chat.id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => loadChat(chat.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {chat.messages.length} messages
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <Button variant="outline" onClick={resetSession} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Session
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Z-5 X AI Chat</h1>
              </div>
            </div>
            <Badge variant="secondary">Online</Badge>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && !currentResponse && (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Hi! What's Going On?</h2>
                <p className="text-muted-foreground">Ask me anything, I'm here to help!</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`flex gap-3 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <Card className={`flex-1 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <CardContent className="p-3">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content)}
                          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {message.role === 'assistant' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={regenerateResponse}
                            className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
            
            {currentResponse && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <Card className="flex-1 bg-muted">
                    <CardContent className="p-3">
                      <p className="text-sm whitespace-pre-wrap">{currentResponse}</p>
                      {isLoading && (
                        <div className="flex items-center gap-1 mt-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 p-4">
          <form id="chat-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Z-5 X..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}