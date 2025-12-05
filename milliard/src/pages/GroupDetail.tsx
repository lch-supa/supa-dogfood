import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGroup, useDeleteGroup } from "@/hooks/use-groups";
import { useGroupMembers, useIsGroupMember, useRemoveGroupMember, useLeaveGroup } from "@/hooks/use-group-members";
import { useAuth } from "@/hooks/use-auth";
import { useGroupPoemSets } from "@/hooks/use-poem-sets";
import { InviteToGroupDialog } from "@/components/dialogs/InviteToGroupDialog";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Users, Calendar, Trash2, LogOut, Edit, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: group, isLoading: groupLoading } = useGroup(id);
  const { data: members, isLoading: membersLoading } = useGroupMembers(id);
  const { data: membershipStatus } = useIsGroupMember(id);
  const { data: groupPoemSets, isLoading: poemSetsLoading } = useGroupPoemSets(id);

  const removeMember = useRemoveGroupMember();
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOwner = user && group && group.owner_id === user.id;

  const handleRemoveMember = (userId: string, userName: string) => {
    setMemberToRemove({ id: userId, name: userName });
    setRemoveDialogOpen(true);
  };

  const confirmRemoveMember = () => {
    if (!id || !memberToRemove) return;

    removeMember.mutate(
      { groupId: id, userId: memberToRemove.id },
      {
        onSuccess: () => {
          setRemoveDialogOpen(false);
          setMemberToRemove(null);
        },
      }
    );
  };

  const handleLeaveGroup = () => {
    setLeaveDialogOpen(true);
  };

  const confirmLeaveGroup = () => {
    if (!id) return;

    leaveGroup.mutate(id, {
      onSuccess: () => {
        navigate("/groups");
      },
    });
  };

  const handleDeleteGroup = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteGroup = () => {
    if (!id) return;

    deleteGroup.mutate(id, {
      onSuccess: () => {
        navigate("/groups");
      },
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Card>
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to view group details.</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (groupLoading || membersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Skeleton className="h-64 mb-8" />
          <div className="grid gap-8 md:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Card>
            <CardHeader>
              <CardTitle>Group Not Found</CardTitle>
              <CardDescription>This group does not exist or you don't have access to it.</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Group Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{group.name}</CardTitle>
                <CardDescription className="text-base">
                  {group.description || "No description provided"}
                </CardDescription>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{group.member_count || 0} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {isOwner ? (
                  <Button variant="destructive" size="sm" onClick={handleDeleteGroup}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Group
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleLeaveGroup}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Group
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Members Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Members</CardTitle>
                {membershipStatus?.isMember && <InviteToGroupDialog groupId={id!} />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(member.user?.display_name?.[0] || member.user?.email[0])?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.user?.display_name || member.user?.email}
                        </p>
                        {member.user?.display_name && (
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                        {member.role}
                      </Badge>
                      {isOwner && member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveMember(
                              member.user_id,
                              member.user?.display_name || member.user?.email || "User"
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Collaborative Poem Sets Section */}
          <Card>
            <CardHeader>
              <CardTitle>Group Poem Sets</CardTitle>
              <CardDescription>
                Poem sets being worked on by group members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {poemSetsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : groupPoemSets && groupPoemSets.length > 0 ? (
                <div className="space-y-3">
                  {groupPoemSets.map((set) => (
                    <Link key={set.id} to={`/my-sets/${set.id}/edit`}>
                      <div className="p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{set.title}</h3>
                            {set.tags && set.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {set.tags.slice(0, 3).map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Badge variant={set.status === "published" ? "default" : "secondary"}>
                            {set.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {set.poems.length} sonnets
                          </p>
                          <Button variant="ghost" size="sm" asChild>
                            <span>
                              <Edit className="h-4 w-4" />
                            </span>
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No collaborative poem sets yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />

      {/* Remove Member Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.name} from this group?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You'll need to be invited again to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeaveGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group? This will remove all members and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
