import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserGroups } from "@/hooks/use-groups";
import { useAssignPoemSetToGroup } from "@/hooks/use-poem-sets";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";

interface AssignToGroupDialogProps {
  poemSetId: string;
  currentGroupId?: string | null;
  onSuccess?: () => void;
}

export function AssignToGroupDialog({ poemSetId, currentGroupId, onSuccess }: AssignToGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(currentGroupId || null);
  const { data: groups, isLoading: groupsLoading } = useUserGroups();
  const assignToGroup = useAssignPoemSetToGroup();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    assignToGroup.mutate(
      {
        poemSetId,
        groupId: selectedGroupId,
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: selectedGroupId
              ? "Poem set assigned to group successfully"
              : "Poem set removed from group successfully",
          });
          setOpen(false);
          onSuccess?.();
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to assign poem set to group",
            variant: "destructive",
          });
        },
      }
    );
  };

  const userOwnedGroups = groups?.filter((group: any) => group.user_role === "owner") || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" />
          {currentGroupId ? "Change Group" : "Add to Group"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign to Group</DialogTitle>
          <DialogDescription>
            Add this poem set to a group to allow all group members to collaborate on it.
            Only groups you own are shown.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group">Group</Label>
            {groupsLoading ? (
              <p className="text-sm text-muted-foreground">Loading groups...</p>
            ) : userOwnedGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You don't own any groups yet. Create a group first to assign this poem set.
              </p>
            ) : (
              <Select
                value={selectedGroupId || "none"}
                onValueChange={(value) => setSelectedGroupId(value === "none" ? null : value)}
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No group (remove from group)</SelectItem>
                  {userOwnedGroups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="bg-muted/50 p-3 rounded-md text-sm">
            <p className="font-medium mb-1">What happens when you add to a group:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>All group members become collaborators</li>
              <li>They can view and edit this poem set</li>
              <li>The set appears in the group's poem sets</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={assignToGroup.isPending || userOwnedGroups.length === 0}
            >
              {assignToGroup.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
