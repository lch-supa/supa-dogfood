import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  owner?: {
    display_name: string | null;
    email: string;
  };
  member_count?: number;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  avatar_url?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  avatar_url?: string;
}

// Fetch all groups the user is a member of
export function useUserGroups() {
  return useQuery({
    queryKey: ["user-groups"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("group_members")
        .select(`
          group_id,
          role,
          joined_at,
          groups:group_id (
            id,
            name,
            description,
            owner_id,
            avatar_url,
            created_at,
            updated_at,
            owner:owner_id (
              display_name,
              email
            )
          )
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

      if (error) throw error;

      // Flatten the structure and add member count
      const groups = await Promise.all(
        data.map(async (item: any) => {
          const group = item.groups;

          // Get member count
          const { count } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id);

          return {
            ...group,
            member_count: count || 0,
            user_role: item.role,
          };
        })
      );

      return groups;
    },
  });
}

// Fetch all groups (for discovery/exploration)
export function useAllGroups() {
  return useQuery({
    queryKey: ["all-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          owner:owner_id (
            display_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Add member count for each group
      const groupsWithCount = await Promise.all(
        data.map(async (group) => {
          const { count } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id);

          return {
            ...group,
            member_count: count || 0,
          };
        })
      );

      return groupsWithCount as Group[];
    },
  });
}

// Fetch a single group by ID
export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");

      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          owner:owner_id (
            display_name,
            email
          )
        `)
        .eq("id", groupId)
        .single();

      if (error) throw error;

      // Get member count
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId);

      return {
        ...data,
        member_count: count || 0,
      } as Group;
    },
    enabled: !!groupId,
  });
}

// Create a new group
export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: input.name,
          description: input.description,
          avatar_url: input.avatar_url,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      queryClient.invalidateQueries({ queryKey: ["all-groups"] });
      toast({
        title: "Group created",
        description: "Your group has been created successfully.",
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

// Update a group
export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateGroupInput) => {
      const { data, error } = await supabase
        .from("groups")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", groupId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      queryClient.invalidateQueries({ queryKey: ["all-groups"] });
      toast({
        title: "Group updated",
        description: "The group has been updated successfully.",
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

// Delete a group
export function useDeleteGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      queryClient.invalidateQueries({ queryKey: ["all-groups"] });
      toast({
        title: "Group deleted",
        description: "The group has been deleted successfully.",
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
