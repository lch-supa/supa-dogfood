import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface GroupInvite {
  id: string;
  group_id: string;
  user_id: string;
  invited_by: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
  group?: {
    name: string;
    description: string | null;
  };
  inviter?: {
    display_name: string | null;
    email: string;
  };
  invitee?: {
    display_name: string | null;
    email: string;
  };
}

// Fetch pending invites for the current user
export function useMyGroupInvites() {
  return useQuery({
    queryKey: ["my-group-invites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("group_invites")
        .select(`
          *,
          group:group_id (
            name,
            description
          ),
          inviter:invited_by (
            display_name,
            email
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GroupInvite[];
    },
  });
}

// Fetch all invites for a specific group (for group admins/owner)
export function useGroupInvites(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-invites", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");

      const { data, error } = await supabase
        .from("group_invites")
        .select(`
          *,
          invitee:user_id (
            display_name,
            email
          ),
          inviter:invited_by (
            display_name,
            email
          )
        `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GroupInvite[];
    },
    enabled: !!groupId,
  });
}

// Invite a user to a group
export function useInviteToGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, email }: { groupId: string; email: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find the user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        throw new Error("User not found with that email address");
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existingMember) {
        throw new Error("User is already a member of this group");
      }

      // Check if there's already a pending invite
      const { data: existingInvite } = await supabase
        .from("group_invites")
        .select("id, status")
        .eq("group_id", groupId)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existingInvite && existingInvite.status === "pending") {
        throw new Error("User already has a pending invite to this group");
      }

      // Create the invite
      const { data, error } = await supabase
        .from("group_invites")
        .insert({
          group_id: groupId,
          user_id: profile.id,
          invited_by: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-invites", variables.groupId] });
      toast({
        title: "Invite sent",
        description: "The invitation has been sent successfully.",
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

// Accept a group invite
export function useAcceptGroupInvite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.rpc("accept_group_invite", {
        invite_id: inviteId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-group-invites"] });
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      toast({
        title: "Invite accepted",
        description: "You have joined the group successfully.",
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

// Decline a group invite
export function useDeclineGroupInvite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("group_invites")
        .update({
          status: "declined",
          updated_at: new Date().toISOString(),
        })
        .eq("id", inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-group-invites"] });
      toast({
        title: "Invite declined",
        description: "You have declined the group invitation.",
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

// Cancel/revoke an invite (for group admins/owner)
export function useCancelGroupInvite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ inviteId, groupId }: { inviteId: string; groupId: string }) => {
      const { error } = await supabase
        .from("group_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ["group-invites", groupId] });
      toast({
        title: "Invite cancelled",
        description: "The invitation has been cancelled.",
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
