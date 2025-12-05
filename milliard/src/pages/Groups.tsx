import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useUserGroups } from "@/hooks/use-groups";
import { useMyGroupInvites, useAcceptGroupInvite, useDeclineGroupInvite } from "@/hooks/use-group-invites";
import { useAuth } from "@/hooks/use-auth";
import { CreateGroupDialog } from "@/components/dialogs/CreateGroupDialog";
import { Users, Calendar, Check, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: groups, isLoading: groupsLoading } = useUserGroups();
  const { data: invites, isLoading: invitesLoading } = useMyGroupInvites();
  const acceptInvite = useAcceptGroupInvite();
  const declineInvite = useDeclineGroupInvite();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Card>
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to view and manage your groups.
              </CardDescription>
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Groups</h1>
            <p className="text-muted-foreground">
              Collaborate with others on poetry collections
            </p>
          </div>
          <CreateGroupDialog />
        </div>

        {/* Pending Invites Section */}
        {invitesLoading ? (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Pending Invites</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          </div>
        ) : invites && invites.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Pending Invites</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {invites.map((invite) => (
                <Card key={invite.id} className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{invite.group?.name}</CardTitle>
                    <CardDescription>
                      {invite.group?.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Invited by {invite.inviter?.display_name || invite.inviter?.email}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptInvite.mutate(invite.id)}
                        disabled={acceptInvite.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => declineInvite.mutate(invite.id)}
                        disabled={declineInvite.isPending}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {/* Groups List Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Groups</h2>
          {groupsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group: any) => (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.user_role === "owner" && (
                        <Badge variant="secondary">Owner</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {group.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{group.member_count || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(group.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Groups Yet</CardTitle>
                <CardDescription>
                  Create a group to start collaborating with others on poetry collections.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
