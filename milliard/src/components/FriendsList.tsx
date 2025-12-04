import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useFriends,
  useFriendRequests,
  useSentFriendRequests,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useRemoveFriend,
} from '@/hooks/use-friends';
import { UserPlus, Users, Mail, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function FriendsList() {
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  const { data: friends = [], isLoading: friendsLoading } = useFriends();
  const { data: requests = [], isLoading: requestsLoading } = useFriendRequests();
  const { data: sentRequests = [], isLoading: sentRequestsLoading } = useSentFriendRequests();

  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();

  const handleSendRequest = async () => {
    if (!friendEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await sendRequest.mutateAsync({ email: friendEmail });
      toast.success('Friend request sent!');
      setFriendEmail('');
      setAddFriendOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptRequest.mutateAsync(requestId);
      toast.success('Friend request accepted!');
    } catch (error) {
      toast.error('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectRequest.mutateAsync(requestId);
      toast.success('Friend request rejected');
    } catch (error) {
      toast.error('Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend.mutateAsync(friendId);
      toast.success('Friend removed');
    } catch (error) {
      toast.error('Failed to remove friend');
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Friends
            </CardTitle>
            <CardDescription>Manage your friends and collaborators</CardDescription>
          </div>
          <Dialog open={addFriendOpen} onOpenChange={setAddFriendOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Friend Request</DialogTitle>
                <DialogDescription>
                  Enter the email address of the person you'd like to add as a friend
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="friend@example.com"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendRequest();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSendRequest}
                  disabled={sendRequest.isPending}
                >
                  {sendRequest.isPending ? 'Sending...' : 'Send Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              Friends
              {friends.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {friends.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {requests.length > 0 && (
                <Badge variant="default" className="ml-2">
                  {requests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent
              {sentRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {sentRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4">
            {friendsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading friends...
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No friends yet</p>
                <p className="text-sm">Send a friend request to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(
                            friend.friend_profile.display_name,
                            friend.friend_profile.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {friend.friend_profile.display_name ||
                            friend.friend_profile.email}
                        </p>
                        {friend.friend_profile.display_name && (
                          <p className="text-sm text-muted-foreground">
                            {friend.friend_profile.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFriend(friend.friend_id)}
                      disabled={removeFriend.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            {requestsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(
                            request.requester_profile.display_name,
                            request.requester_profile.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {request.requester_profile.display_name ||
                            request.requester_profile.email}
                        </p>
                        {request.requester_profile.display_name && (
                          <p className="text-sm text-muted-foreground">
                            {request.requester_profile.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={acceptRequest.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={rejectRequest.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            {sentRequestsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading sent requests...
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No pending sent requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(
                            request.friend_profile.display_name,
                            request.friend_profile.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {request.friend_profile.display_name ||
                            request.friend_profile.email}
                        </p>
                        {request.friend_profile.display_name && (
                          <p className="text-sm text-muted-foreground">
                            {request.friend_profile.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
