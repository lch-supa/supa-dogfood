import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useMessageSubscription,
  useClearMessages,
  useTypingIndicator,
} from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { MessageSquare, Send, Trash2, Trash } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PoemSetChatProps {
  poemSetId: string;
}

export function PoemSetChat({ poemSetId }: PoemSetChatProps) {
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  const { data: messages = [], isLoading } = useMessages(poemSetId);
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const clearMessages = useClearMessages();
  const { typingUsers, sendTypingEvent } = useTypingIndicator(poemSetId);

  // Subscribe to real-time messages
  useMessageSubscription(poemSetId);

  // Auto-scroll to bottom when new messages arrive or typing users change
  useEffect(() => {
    if (scrollRef.current) {
      // Use scrollIntoView with block: 'nearest' to prevent scrolling the main page
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [messages, typingUsers]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    // Send typing event
    sendTypingEvent(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingEvent(false);
    }, 2000);
  }, [sendTypingEvent]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTypingEvent(false);

      await sendMessage.mutateAsync({
        poemSetId,
        message: message.trim(),
      });
      setMessage('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage.mutateAsync({
        messageId,
        poemSetId,
      });
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleClearChat = async () => {
    try {
      await clearMessages.mutateAsync(poemSetId);
      toast.success('Chat cleared');
    } catch (error) {
      toast.error('Failed to clear chat');
    }
  };

  const getInitials = (displayName: string | null, email: string | null) => {
    if (displayName) {
      return displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      if (minutes > 0) {
        return `${minutes}m ago`;
      } else {
        return 'just now';
      }
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Chat
            </CardTitle>
            <CardDescription>
              Chat with collaborators in real-time
            </CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear chat?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all messages in this chat. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearChat}>
                  Clear Chat
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation with your collaborators!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.user_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(
                          msg.user_profile.display_name,
                          msg.user_profile.email
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex-1 space-y-1 ${
                        isOwnMessage ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 text-xs text-muted-foreground ${
                          isOwnMessage ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <span className="font-medium">
                          {isOwnMessage
                            ? 'You'
                            : msg.user_profile.display_name ||
                              msg.user_profile.email}
                        </span>
                        <span>{formatTime(msg.created_at)}</span>
                      </div>
                      <div
                        className={`group relative inline-block max-w-[80%] rounded-lg px-3 py-2 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                        {isOwnMessage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => handleDeleteMessage(msg.id)}
                            disabled={deleteMessage.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>
                    {typingUsers.length === 1
                      ? `${typingUsers[0].displayName || typingUsers[0].email} is typing...`
                      : `${typingUsers.length} people are typing...`}
                  </span>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>
        <Separator />
        <form onSubmit={handleSendMessage} className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              disabled={sendMessage.isPending}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sendMessage.isPending || !message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
