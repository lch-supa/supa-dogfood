import { useState } from "react";
import { UserPlus, X, Mail, Shield, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCollaborators,
  useInviteCollaborator,
  useRemoveCollaborator,
  useUpdateCollaboratorRole,
} from "@/hooks/use-collaborators";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface InviteCollaboratorDialogProps {
  poemSetId: string;
  poemSetTitle: string;
}

export function InviteCollaboratorDialog({
  poemSetId,
  poemSetTitle,
}: InviteCollaboratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');

  const { user } = useAuth();
  const { toast } = useToast();
  const { data: collaborators, isLoading } = useCollaborators(poemSetId);
  const inviteCollaborator = useInviteCollaborator();
  const removeCollaborator = useRemoveCollaborator();
  const updateRole = useUpdateCollaboratorRole();

  const handleInvite = async () => {
    if (!handle.trim()) {
      toast({
        title: "Handle required",
        description: "Please enter a handle",
        variant: "destructive",
      });
      return;
    }

    try {
      await inviteCollaborator.mutateAsync({
        poemSetId,
        userHandle: handle.trim(),
        role,
      });

      toast({
        title: "Collaborator invited",
        description: `@${handle} has been added as ${role === 'editor' ? 'an editor' : 'a viewer'}`,
      });

      setHandle("");
    } catch (error: any) {
      toast({
        title: "Error inviting collaborator",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (collaboratorId: string, userName: string) => {
    try {
      await removeCollaborator.mutateAsync({
        poemSetId,
        collaboratorId,
      });

      toast({
        title: "Collaborator removed",
        description: `${userName} has been removed from this poem set`,
      });
    } catch (error: any) {
      toast({
        title: "Error removing collaborator",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (
    collaboratorId: string,
    newRole: 'editor' | 'viewer',
    userName: string
  ) => {
    try {
      await updateRole.mutateAsync({
        poemSetId,
        collaboratorId,
        role: newRole,
      });

      toast({
        title: "Role updated",
        description: `${userName} is now ${newRole === 'editor' ? 'an editor' : 'a viewer'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const currentUserIsOwner = collaborators?.some(
    c => c.user_id === user?.id && c.role === 'owner'
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Manage Collaborators
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Collaborators</DialogTitle>
          <DialogDescription>
            Invite others to collaborate on "{poemSetTitle}"
          </DialogDescription>
        </DialogHeader>

        {/* Invite Form */}
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="handle">Invite by Handle</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  id="handle"
                  type="text"
                  placeholder="username"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInvite();
                    }
                  }}
                  className="pl-7"
                />
              </div>
              <Select value={role} onValueChange={(v) => setRole(v as 'editor' | 'viewer')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      Editor
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      Viewer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleInvite}
                disabled={inviteCollaborator.isPending || !handle.trim()}
              >
                Invite
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Editors can edit the poem set. Viewers can only view it.
            </p>
          </div>

          {/* Current Collaborators */}
          <div className="space-y-2">
            <Label>Current Collaborators ({collaborators?.length || 0})</Label>

            {isLoading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading collaborators...
              </div>
            ) : !collaborators || collaborators.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No collaborators yet. Invite someone to get started!
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collaborator) => {
                  const isCurrentUser = collaborator.user_id === user?.id;
                  const isOwner = collaborator.role === 'owner';
                  const userName = collaborator.user?.display_name || `@${collaborator.user?.handle}` || 'Unknown';

                  return (
                    <div
                      key={collaborator.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={collaborator.user?.avatar_url} />
                        <AvatarFallback>
                          {userName[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {userName}
                            {isCurrentUser && (
                              <span className="text-muted-foreground ml-1">(you)</span>
                            )}
                          </p>
                        </div>
                        {collaborator.user?.display_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{collaborator.user?.handle}
                          </p>
                        )}
                      </div>

                      {isOwner ? (
                        <Badge>Owner</Badge>
                      ) : (
                        <>
                          {currentUserIsOwner && !isCurrentUser ? (
                            <Select
                              value={collaborator.role}
                              onValueChange={(value) =>
                                handleRoleChange(
                                  collaborator.id,
                                  value as 'editor' | 'viewer',
                                  userName
                                )
                              }
                              disabled={updateRole.isPending}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary">
                              {collaborator.role}
                            </Badge>
                          )}
                        </>
                      )}

                      {currentUserIsOwner && !isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(collaborator.id, userName)}
                          disabled={removeCollaborator.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
