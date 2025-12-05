import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useConversation, useUpdateLastRead } from "@/hooks/use-conversations";
import { useDirectMessages, useSendDirectMessage } from "@/hooks/use-direct-messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ArrowLeft, X, Minus, Send, Users, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatBubbleProps {
  conversationId: string;
  onClose: () => void;
  onMinimize: () => void;
  onBack: () => void;
}

export function ChatBubble({
  conversationId,
  onClose,
  onMinimize,
  onBack,
}: ChatBubbleProps) {
  const { user } = useAuth();
  const { data: conversation } = useConversation(conversationId);
  const { data: messages } = useDirectMessages(conversationId);
  const sendMessage = useSendDirectMessage();
  const updateLastRead = useUpdateLastRead();

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Update last read when viewing
  useEffect(() => {
    if (conversationId) {
      updateLastRead.mutate({ conversationId });
    }
  }, [conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    await sendMessage.mutateAsync({
      conversationId,
      message: messageText.trim(),
    });

    setMessageText("");
  };

  const getConversationTitle = () => {
    if (!conversation) return "Loading...";

    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }

    const otherParticipant = conversation.participants?.find(
      (p) => p.user_id !== user?.id
    );

    return (
      otherParticipant?.profile?.display_name ||
      otherParticipant?.profile?.email ||
      "Unknown User"
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = (userId: string) => {
    if (userId === user?.id) return "You";

    const participant = conversation?.participants?.find(
      (p) => p.user_id === userId
    );

    return (
      participant?.profile?.display_name ||
      participant?.profile?.email ||
      "Unknown"
    );
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-[500px] flex flex-col shadow-xl z-50 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            {conversation?.type === "group" ? (
              <Users className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">
              {getConversationTitle()}
            </h3>
            {conversation?.type === "group" && (
              <p className="text-xs text-muted-foreground">
                {conversation.participants?.length || 0} members
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onMinimize}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
            {!messages || messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Send className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No messages yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isOwnMessage = message.user_id === user?.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        isOwnMessage ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(
                            message.profile?.display_name ||
                              message.profile?.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`flex flex-col gap-0.5 max-w-[70%] ${
                          isOwnMessage ? "items-end" : ""
                        }`}
                      >
                        <span className="text-xs font-medium px-1">
                          {getUserDisplayName(message.user_id)}
                        </span>
                        <div
                          className={`rounded-lg p-2 ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground px-1">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-2">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="min-h-[40px] max-h-[80px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageText.trim() || sendMessage.isPending}
                className="h-[40px] w-[40px] flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
    </Card>
  );
}
