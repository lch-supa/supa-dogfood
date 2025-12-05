import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus, Users, User } from "lucide-react";
import { CreateConversationDialog } from "@/components/dialogs/CreateConversationDialog";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
            <p className="text-muted-foreground">
              Please sign in to view your messages.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const getConversationTitle = (conversation: any) => {
    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }

    // For direct messages, show the other user's name
    const otherParticipant = conversation.participants?.find(
      (p: any) => p.user_id !== user.id
    );

    return (
      otherParticipant?.profile?.display_name ||
      otherParticipant?.profile?.email ||
      "Unknown User"
    );
  };

  const getConversationAvatar = (conversation: any) => {
    if (conversation.type === "group") {
      return <Users className="h-6 w-6" />;
    }
    return <User className="h-6 w-6" />;
  };

  const getUnreadCount = (conversation: any) => {
    const myParticipation = conversation.participants?.find(
      (p: any) => p.user_id === user.id
    );

    if (!myParticipation || !conversation.last_message) return 0;

    const lastReadAt = myParticipation.last_read_at
      ? new Date(myParticipation.last_read_at)
      : new Date(0);
    const lastMessageAt = new Date(conversation.last_message.created_at);

    // If last message is from current user, no unread
    if (conversation.last_message.user_id === user.id) return 0;

    return lastMessageAt > lastReadAt ? 1 : 0;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">
              Chat with friends and groups
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            New Conversation
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquarePlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">No conversations yet</h2>
            <p className="text-muted-foreground mb-4">
              Start a new conversation to begin chatting
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Start Conversation
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation);
              const title = getConversationTitle(conversation);
              const lastMessage = conversation.last_message;

              return (
                <Card
                  key={conversation.id}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/messages/${conversation.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {getConversationAvatar(conversation)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate flex items-center gap-2">
                          {title}
                          {conversation.type === "group" && (
                            <Badge variant="secondary" className="text-xs">
                              {conversation.participants?.length || 0} members
                            </Badge>
                          )}
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
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage
                            ? lastMessage.message
                            : "No messages yet"}
                        </p>
                        {unreadCount > 0 && (
                          <Badge
                            variant="default"
                            className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                          >
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <CreateConversationDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    </div>
  );
}
