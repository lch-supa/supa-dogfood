import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus, Users, User, X, Minus } from "lucide-react";
import { CreateConversationDialog } from "@/components/dialogs/CreateConversationDialog";
import { formatDistanceToNow } from "date-fns";

interface ConversationsListProps {
  onSelectConversation: (conversationId: string) => void;
  onClose: () => void;
  onMinimize: () => void;
}

export function ConversationsList({
  onSelectConversation,
  onClose,
  onMinimize,
}: ConversationsListProps) {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getConversationTitle = (conversation: any) => {
    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }

    const otherParticipant = conversation.participants?.find(
      (p: any) => p.user_id !== user?.id
    );

    return (
      otherParticipant?.profile?.display_name ||
      otherParticipant?.profile?.email ||
      "Unknown User"
    );
  };

  const getConversationAvatar = (conversation: any) => {
    if (conversation.type === "group") {
      return <Users className="h-5 w-5" />;
    }
    return <User className="h-5 w-5" />;
  };

  const getUnreadCount = (conversation: any) => {
    const myParticipation = conversation.participants?.find(
      (p: any) => p.user_id === user?.id
    );

    if (!myParticipation || !conversation.last_message) return 0;

    const lastReadAt = myParticipation.last_read_at
      ? new Date(myParticipation.last_read_at)
      : new Date(0);
    const lastMessageAt = new Date(conversation.last_message.created_at);

    if (conversation.last_message.user_id === user?.id) return 0;

    return lastMessageAt > lastReadAt ? 1 : 0;
  };

  return (
    <>
      <Card className="fixed bottom-4 right-4 w-80 h-[500px] flex flex-col shadow-xl z-50 animate-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <h2 className="font-semibold">Messages</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowCreateDialog(true)}
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
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

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquarePlus className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">No conversations yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Start chatting with your friends
              </p>
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
              >
                Start Conversation
              </Button>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => {
                const unreadCount = getUnreadCount(conversation);
                const title = getConversationTitle(conversation);
                const lastMessage = conversation.last_message;

                return (
                  <button
                    key={conversation.id}
                    className="w-full p-2 rounded-lg hover:bg-accent transition-colors text-left"
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        {getConversationAvatar(conversation)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm truncate">
                            {title}
                          </h3>
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {formatDistanceToNow(
                                new Date(lastMessage.created_at),
                                { addSuffix: true }
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground truncate">
                            {lastMessage
                              ? lastMessage.message
                              : "No messages yet"}
                          </p>
                          {unreadCount > 0 && (
                            <Badge
                              variant="default"
                              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs flex-shrink-0"
                            >
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </Card>

      <CreateConversationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onConversationCreated={(conversationId) => {
          setShowCreateDialog(false);
          onSelectConversation(conversationId);
        }}
      />
    </>
  );
}
