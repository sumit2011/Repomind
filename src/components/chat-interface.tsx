'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
}

interface ChatInterfaceProps {
  repositoryId?: string;
}

export function ChatInterface({ repositoryId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryId,
          conversationId,
          query: input
        })
      });

      const data = await response.json();

      if (response.ok) {
        setConversationId(data.conversationId);
        setMessages(prev => [...prev, data.message]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${data.error}`
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Failed to send message. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation by asking a question about the repository.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card'
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: ({ node, inline, className, children, ...props }: any) => (
                          <code
                            className={`${
                              inline
                                ? 'bg-muted px-1 py-0.5 rounded text-sm'
                                : 'block bg-muted p-3 rounded-lg text-sm overflow-x-auto'
                            }`}
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                        a: ({ node, children, ...props }: any) => (
                          <a
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                          >
                            {children}
                          </a>
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.citations.map((citation, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            {citation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <Card className="p-4 bg-card">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question about the repository..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading || !repositoryId}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim() || !repositoryId}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        {!repositoryId && (
          <p className="text-xs text-muted-foreground mt-2">
            Connect a repository to start chatting
          </p>
        )}
      </div>
    </div>
  );
}
