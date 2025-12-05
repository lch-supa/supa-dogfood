import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInviteToGroup } from "@/hooks/use-group-invites";
import { UserPlus } from "lucide-react";

interface InviteToGroupDialogProps {
  groupId: string;
}

export function InviteToGroupDialog({ groupId }: InviteToGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const inviteToGroup = useInviteToGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    inviteToGroup.mutate(
      {
        groupId,
        email: email.trim(),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setEmail("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite User to Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter the email address of the user you want to invite to this group.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteToGroup.isPending || !email.trim()}>
              {inviteToGroup.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
