import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Clock, FileText, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Settings, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { aiChatService, ChatMessage, ChatSession } from '@/services/ai-chat-service';

interface ChatInterfaceProps {
  className?: string;
  onSendMessage?: (message: string) => void;
  context?: {
    vectorResults?: any[];
    expenseData?: any[];
  };
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  className = '',
  onSendMessage,
  context
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const sendMessageWithRetry = async (sessionId: string, message: string, context: ChatInterfaceProps['context']) => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= Math.min(retryCount, 2); attempt++) {
      try {
        setIsRetrying(true);
        const response = await aiChatService.sendMessage(sessionId, message, context);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);
        
        if (attempt < Math.min(retryCount, 2)) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } finally {
        setIsRetrying(false);
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  };

  const handleRetry = async (message: string) => {
    if (!session) return;
    
    // Remove the error message and retry the original message
    setMessages(prev => prev.filter(msg => msg.content !== `I apologize, but I encountered an error processing your request: ${error}. Please try again or rephrase your question.`));
    
    // Simulate form submission with the original message
    const event = new Event('submit') as any;
    event.preventDefault = () => {};
    
    setInputValue(message);
    await handleSubmit(event);
  };

  const handleClearChat = async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      setError(null);
      setRetryCount(0); // Reset retry count when clearing chat
      
      await aiChatService.clearSession(session.id);
      setMessages([]);
      
      toast({
        title: 'Chat cleared',
        description: 'All messages have been cleared from this session'
      });
    } catch (error) {
      console.error('Failed to clear chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear chat session';
      
      toast({
        title: 'Clear failed',
        description: errorMessage,
        variant: 'destructive',
        action: (
          <Button variant="outline" size="sm" onClick={handleClearChat}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )
      });
    } finally {
      setIsLoading(false);
    }
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newSession = await aiChatService.createSession('Document Intelligence Chat');
      setSession(newSession);
      setRetryCount(0); // Reset retry count on successful initialization
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: 'Hello! I\'m FlowFi AI Assistant. I can help you analyze your financial documents, answer questions about your expenses, and provide insights from your data. What would you like to know?',
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
      
      toast({
        title: 'Chat initialized',
        description: 'Ready to help with your financial questions',
      });
      
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize chat session';
      setError(errorMessage);
      
      toast({
        title: 'Initialization failed',
        description: errorMessage,
        variant: 'destructive',
        action: (
          <Button variant="outline" size="sm" onClick={initializeChat}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )
      });
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading || !session) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);
    setIsRetrying(false);

    // Add user message to UI immediately
    const userChatMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userChatMessage]);
    setIsLoading(true);

    try {
      // Send message to AI service with retry logic
      const response = await sendMessageWithRetry(session.id, userMessage, context);

      // Add AI response to UI
      setMessages(prev => [...prev, response.message]);
      
      // Update session
      const updatedSession = await aiChatService.getSession(session.id);
      if (updatedSession) {
        setSession(updatedSession);
      }

      // Reset retry count on success
      setRetryCount(0);

      // Call callback if provided
      onSendMessage?.(userMessage);

      // Show success toast with processing details
      toast({
        title: 'Response received',
        description: `AI processed your query in ${response.processingTime}ms with ${(response.confidence * 100).toFixed(0)}% confidence`,
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // Add error message to UI with retry option
      const errorChatMessage: ChatMessage = {
        role: 'assistant',
        content: `I apologize, but I encountered an error processing your request: ${errorMessage}. Please try again or rephrase your question.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
      
      // Show error toast with retry action
      toast({
        title: 'Message failed',
        description: errorMessage,
        variant: 'destructive',
        action: retryCount < 3 ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleRetry(userMessage)}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Retry
          </Button>
        ) : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    
    return (
      <div
        key={index}
        className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {isSystem ? (
              <FileText className="w-4 h-4 text-primary" />
            ) : (
              <Bot className="w-4 h-4 text-primary" />
            )}
          </div>
        )}
        
        <div className={`max-w-[70%] ${isUser ? 'order-1' : ''}`}>
          <div
            className={`rounded-lg px-4 py-3 ${
              isUser
                ? 'bg-primary text-primary-foreground'
                : isSystem
                ? 'bg-muted border'
                : 'bg-background border'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            
            {message.metadata?.sources && message.metadata.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3 h-3" />
                  <span className="text-xs font-medium">Sources:</span>
                  <Badge variant="outline" className="text-xs">
                    {message.metadata.sources.length} documents
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  {message.metadata.sources.slice(0, showContext ? undefined : 2).map((source, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground">
                      <span className="font-medium">{source.fileName}</span>
                      <span className="mx-1">•</span>
                      <span>Similarity: {(source.similarity * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                
                {message.metadata.sources.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowContext(!showContext)}
                    className="h-6 px-2 mt-2 text-xs"
                  >
                    {showContext ? (
                      <>
                        Show less <ChevronUp className="w-3 h-3 ml-1" />
                      </>
                    ) : (
                      <>
                        Show {message.metadata.sources.length - 2} more <ChevronDown className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {message.metadata?.confidence && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Confidence: {(message.metadata.confidence * 100).toFixed(0)}%
                </Badge>
                {message.metadata.processingTime && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-2 h-2 mr-1" />
                    {message.metadata.processingTime}ms
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${isUser ? 'justify-end' : ''}`}>
            <span>{formatMessageTime(message.timestamp)}</span>
          </div>
        </div>
        
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">FlowFi AI Assistant</h3>
            {retryCount > 0 && (
              <Badge variant="outline" className="text-xs">
                Retries: {retryCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              GPT-5 Powered
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              disabled={isLoading || !session}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Ask me anything about your financial documents and expenses
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertCircle className="h-4 w-4" />
          <div className="flex items-center justify-between">
            <AlertDescription>{error}</AlertDescription>
            {retryCount < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRetry(messages[messages.length - 2]?.content || '')}
                disabled={isRetrying}
                className="ml-2"
              >
                {isRetrying ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Retry
              </Button>
            )}
          </div>
          {retryCount >= 3 && (
            <div className="mt-2 text-xs text-destructive">
              Maximum retry attempts reached. Please refresh the page or contact support.
            </div>
          )}
        </Alert>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => renderMessage(message, index))}
          
          {isLoading && (
            <div className="flex gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-background border rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {!session && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Initializing chat session...</p>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={session ? "Ask about your documents, expenses, or financial data..." : "Initializing chat..."}
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading || !session}
              rows={2}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading || !session}
              className="px-3"
              title={!session ? "Chat session not initialized" : isLoading ? "Processing your message" : "Send message"}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Assistant Help</DialogTitle>
            <DialogDescription>
              Get the most out of your FlowFi AI Assistant
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-medium mb-2">What can I ask?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• "Show me my expenses for last month"</li>
                <li>• "What are my top spending categories?"</li>
                <li>• "Find invoices from vendor X"</li>
                <li>• "Compare spending this month vs last month"</li>
                <li>• "Show me receipts for travel expenses"</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Tips for better results</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Be specific about time periods (dates, months, years)</li>
                <li>• Mention specific vendors or categories when relevant</li>
                <li>• Ask for comparisons or trends over time</li>
                <li>• Use natural language - no special syntax needed</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Error handling</h4>
              <p className="text-sm text-muted-foreground">
                If you encounter errors, try:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                <li>• Clicking the Retry button</li>
                <li>• Rephrasing your question</li>
                <li>• Checking your internet connection</li>
                <li>• Clearing the chat and starting fresh</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHelp(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ChatInterface;