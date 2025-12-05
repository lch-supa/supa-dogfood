import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface DirectMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// Get all messages for a conversation
export function useDirectMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["direct-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error("No conversation ID provided");

      const { data, error } = await supabase
        .from("direct_messages")
        .select(`
          *,
          profile:profiles(
            id,
            email,
            display_name,
            avatar_url
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as DirectMessage[];
    },
    enabled: !!conversationId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`direct-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the profile for the new message
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, email, display_name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            profile: profileData,
          } as DirectMessage;

          queryClient.setQueryData(
            ["direct-messages", conversationId],
            (old: DirectMessage[] | undefined) => {
              if (!old) return [newMessage];
              // Check if message already exists (prevent duplicates)
              if (old.some((m) => m.id === newMessage.id)) return old;
              return [...old, newMessage];
            }
          );

          // Update the conversation's updated_at timestamp
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the profile for the updated message
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, email, display_name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          const updatedMessage = {
            ...payload.new,
            profile: profileData,
          } as DirectMessage;

          queryClient.setQueryData(
            ["direct-messages", conversationId],
            (old: DirectMessage[] | undefined) => {
              if (!old) return [updatedMessage];
              return old.map((m) =>
                m.id === updatedMessage.id ? updatedMessage : m
              );
            }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          queryClient.setQueryData(
            ["direct-messages", conversationId],
            (old: DirectMessage[] | undefined) => {
              if (!old) return [];
              return old.filter((m) => m.id !== payload.old.id);
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
}

// Send a message
export function useSendDirectMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert the message
      const { error: msgError } = await supabase
        .from("direct_messages")
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          message,
        });

      if (msgError) throw msgError;

      // Update the conversation's updated_at timestamp
      const { error: convError } = await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      if (convError) throw convError;
    },
    onSuccess: (_, variables) => {
      // The realtime subscription will handle updating the messages list
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update a message
export function useUpdateDirectMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      messageId,
      message,
    }: {
      messageId: string;
      message: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("direct_messages")
        .update({ message, updated_at: new Date().toISOString() })
        .eq("id", messageId)
        .eq("user_id", user.id); // Ensure user owns the message

      if (error) throw error;
    },
    onSuccess: () => {
      // The realtime subscription will handle updating the message
      toast({
        title: "Message updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete a message
export function useDeleteDirectMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("direct_messages")
        .delete()
        .eq("id", messageId)
        .eq("user_id", user.id); // Ensure user owns the message

      if (error) throw error;
    },
    onSuccess: () => {
      // The realtime subscription will handle removing the message
      toast({
        title: "Message deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Get unread message count for all conversations
export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ["unread-message-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all conversations where user is a participant
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", user.id);

      if (partError) throw partError;
      if (!participations || participations.length === 0) return 0;

      let totalUnread = 0;

      // For each conversation, count messages after last_read_at
      for (const participation of participations) {
        const { count, error } = await supabase
          .from("direct_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", participation.conversation_id)
          .neq("user_id", user.id) // Don't count own messages
          .gt(
            "created_at",
            participation.last_read_at || new Date(0).toISOString()
          );

        if (!error && count) {
          totalUnread += count;
        }
      }

      return totalUnread;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
