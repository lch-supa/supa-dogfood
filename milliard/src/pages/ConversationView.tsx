import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useConversation, useUpdateLastRead } from "@/hooks/use-conversations";
import {
  useDirectMessages,
  useSendDirectMessage,
} from "@/hooks/use-direct-messages";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Users, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ConversationView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: conversation, isLoading: conversationLoading } =
    useConversation(id);
  const { data: messages, isLoading: messagesLoading } = useDirectMessages(id);
  const sendMessage = useSendDirectMessage();
  const updateLastRead = useUpdateLastRead();

  const [messageText, setMessageText] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Update last read timestamp when viewing conversation
  useEffect(() => {
    if (id && user) {
      updateLastRead.mutate({ conversationId: id });
    }
  }, [id, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !id) return;

    await sendMessage.mutateAsync({
      conversationId: id,
      message: messageText.trim(),
    });

    setMessageText("");
  };

  const getConversationTitle = () => {
    if (!conversation) return "Loading...";

    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }

    // For direct messages, show the other user's name
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
      "Unknown User"
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
            <p className="text-muted-foreground">
              Please sign in to view messages.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (conversationLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-full mb-4" />
          <Card className="h-[600px] p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-16 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/messages")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {conversation?.type === "group" ? (
                <Users className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{getConversationTitle()}</h1>
              {conversation?.type === "group" && (
                <p className="text-sm text-muted-foreground">
                  {conversation.participants?.length || 0} members
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <Card className="flex flex-col h-[calc(100vh-200px)]">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {messagesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-16 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Send className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No messages yet
                </h3>
                <p className="text-muted-foreground">
                  Start the conversation by sending a message
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.user_id === user.id;
                  const displayName = getUserDisplayName(message.user_id);

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        isOwnMessage ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(
                            message.profile?.display_name ||
                              message.profile?.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`flex flex-col gap-1 max-w-[70%] ${
                          isOwnMessage ? "items-end" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div
                          className={`rounded-lg p-3 ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="min-h-[60px] resize-none"
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
                className="h-[60px] w-[60px]"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
