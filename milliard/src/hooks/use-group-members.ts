import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  user?: {
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

// Fetch all members of a group
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");

      const { data, error } = await supabase
        .from("group_members")
        .select(`
          *,
          user:user_id (
            display_name,
            email,
            avatar_url
          )
        `)
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return data as GroupMember[];
    },
    enabled: !!groupId,
  });
}

// Check if current user is a member of a group
export function useIsGroupMember(groupId: string | undefined) {
  return useQuery({
    queryKey: ["is-group-member", groupId],
    queryFn: async () => {
      if (!groupId) return false;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("group_members")
        .select("id, role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data ? { isMember: true, role: data.role } : { isMember: false, role: null };
    },
    enabled: !!groupId,
  });
}

// Remove a member from a group
export function useRemoveGroupMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-members", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      toast({
        title: "Member removed",
        description: "The member has been removed from the group.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Leave a group (remove self)
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is the owner
      const { data: group } = await supabase
        .from("groups")
        .select("owner_id")
        .eq("id", groupId)
        .single();

      if (group?.owner_id === user.id) {
        throw new Error("Group owner cannot leave the group. Delete the group instead.");
      }

      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      toast({
        title: "Left group",
        description: "You have left the group successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update member role
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
      role
    }: {
      groupId: string;
      userId: string;
      role: "admin" | "member"
    }) => {
      const { error } = await supabase
        .from("group_members")
        .update({ role })
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-members", variables.groupId] });
      toast({
        title: "Role updated",
        description: "The member's role has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
