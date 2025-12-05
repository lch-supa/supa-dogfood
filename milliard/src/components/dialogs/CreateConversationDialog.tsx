import { useState } from "react";
import { useCreateConversation } from "@/hooks/use-conversations";
import { useFriends } from "@/hooks/use-friends";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Users, Loader2 } from "lucide-react";

interface CreateConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function CreateConversationDialog({
  open,
  onOpenChange,
  onConversationCreated,
}: CreateConversationDialogProps) {
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const createConversation = useCreateConversation();

  const [conversationType, setConversationType] = useState<"direct" | "group">(
    "direct"
  );
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const handleCreateConversation = async () => {
    if (conversationType === "direct") {
      if (selectedFriends.length !== 1) return;

      const result = await createConversation.mutateAsync({
        type: "direct",
        participantUserIds: selectedFriends,
      });

      onOpenChange(false);
      if (onConversationCreated) {
        onConversationCreated(result.conversationId);
      }
      resetForm();
    } else {
      if (selectedFriends.length < 1 || !groupName.trim()) return;

      const result = await createConversation.mutateAsync({
        type: "group",
        name: groupName.trim(),
        participantUserIds: selectedFriends,
      });

      onOpenChange(false);
      if (onConversationCreated) {
        onConversationCreated(result.conversationId);
      }
      resetForm();
    }
  };

  const resetForm = () => {
    setConversationType("direct");
    setGroupName("");
    setSelectedFriends([]);
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) => {
      if (conversationType === "direct") {
        // For direct messages, only allow one friend to be selected
        return prev.includes(friendId) ? [] : [friendId];
      } else {
        // For groups, allow multiple friends
        return prev.includes(friendId)
          ? prev.filter((id) => id !== friendId)
          : [...prev, friendId];
      }
    });
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

  const isValid =
    conversationType === "direct"
      ? selectedFriends.length === 1
      : selectedFriends.length >= 1 && groupName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a direct message or create a group chat
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={conversationType}
          onValueChange={(value) =>
            setConversationType(value as "direct" | "group")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Direct Message
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Group Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <div>
              <Label>Select a friend to message</Label>
              {friendsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !friends || friends.length === 0 ? (
                <Card className="p-8 text-center mt-4">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No friends yet. Add friends to start chatting!
                  </p>
                </Card>
              ) : (
                <div className="space-y-2 mt-4">
                  {friends.map((friend) => (
                    <Card
                      key={friend.friend_id}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedFriends.includes(friend.friend_id)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => toggleFriendSelection(friend.friend_id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(
                              friend.friend_profile?.display_name || friend.friend_profile?.email
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {friend.friend_profile?.display_name || friend.friend_profile?.email}
                          </p>
                          {friend.friend_profile?.display_name && (
                            <p className="text-sm text-muted-foreground">
                              {friend.friend_profile?.email}
                            </p>
                          )}
                        </div>
                        <Checkbox
                          checked={selectedFriends.includes(friend.friend_id)}
                          onCheckedChange={() =>
                            toggleFriendSelection(friend.friend_id)
                          }
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="mt-2"
              />
            </div>

            <div>
              <Label>Select friends to add to the group</Label>
              {friendsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !friends || friends.length === 0 ? (
                <Card className="p-8 text-center mt-4">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No friends yet. Add friends to create a group!
                  </p>
                </Card>
              ) : (
                <div className="space-y-2 mt-4">
                  {friends.map((friend) => (
                    <Card
                      key={friend.friend_id}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedFriends.includes(friend.friend_id)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => toggleFriendSelection(friend.friend_id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(
                              friend.friend_profile?.display_name || friend.friend_profile?.email
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {friend.friend_profile?.display_name || friend.friend_profile?.email}
                          </p>
                          {friend.friend_profile?.display_name && (
                            <p className="text-sm text-muted-foreground">
                              {friend.friend_profile?.email}
                            </p>
                          )}
                        </div>
                        <Checkbox
                          checked={selectedFriends.includes(friend.friend_id)}
                          onCheckedChange={() =>
                            toggleFriendSelection(friend.friend_id)
                          }
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={!isValid || createConversation.isPending}
          >
            {createConversation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Conversation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
