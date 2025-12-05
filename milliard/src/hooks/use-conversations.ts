import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  last_message?: {
    message: string;
    created_at: string;
    user_id: string;
  };
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string;
  profile?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// Get all conversations for the current user
export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all conversation IDs where user is a participant
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (partError) throw partError;
      if (!participations || participations.length === 0) return [];

      const conversationIds = participations.map((p) => p.conversation_id);

      // Get all conversations with participants
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select(`
          *,
          participants:conversation_participants(
            id,
            user_id,
            joined_at,
            last_read_at,
            profile:profiles(
              id,
              email,
              display_name,
              avatar_url
            )
          )
        `)
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convError) throw convError;

      // Get the last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        (conversations || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from("direct_messages")
            .select("message, created_at, user_id")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            last_message: lastMessage || undefined,
          };
        })
      );

      return conversationsWithLastMessage as Conversation[];
    },
  });
}

// Get a single conversation by ID
export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error("No conversation ID provided");

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          participants:conversation_participants(
            id,
            user_id,
            joined_at,
            last_read_at,
            profile:profiles(
              id,
              email,
              display_name,
              avatar_url
            )
          )
        `)
        .eq("id", conversationId)
        .single();

      if (error) throw error;
      return data as Conversation;
    },
    enabled: !!conversationId,
  });
}

// Create a new conversation (direct or group)
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      type,
      name,
      participantUserIds,
    }: {
      type: "direct" | "group";
      name?: string;
      participantUserIds: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // For direct conversations, check if one already exists between these two users
      if (type === "direct" && participantUserIds.length === 1) {
        const otherUserId = participantUserIds[0];

        // Get all conversations the current user is in
        const { data: myParticipations } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);

        if (myParticipations && myParticipations.length > 0) {
          const myConvIds = myParticipations.map((p) => p.conversation_id);

          // Check if other user is in any of these conversations
          const { data: sharedConvs } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", otherUserId)
            .in("conversation_id", myConvIds);

          if (sharedConvs && sharedConvs.length > 0) {
            // Check if any of these are direct conversations
            const { data: existingDirect } = await supabase
              .from("conversations")
              .select("id")
              .eq("type", "direct")
              .in("id", sharedConvs.map((c) => c.conversation_id))
              .single();

            if (existingDirect) {
              // Return existing conversation
              return { conversationId: existingDirect.id };
            }
          }
        }
      }

      // Create the conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          type,
          name: type === "group" ? name : null,
          created_by: user.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add the creator as a participant
      const participants = [
        { conversation_id: conversation.id, user_id: user.id },
        ...participantUserIds.map((userId) => ({
          conversation_id: conversation.id,
          user_id: userId,
        })),
      ];

      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(participants);

      if (partError) throw partError;

      return { conversationId: conversation.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({
        title: "Conversation created",
        description: "Your conversation has been created successfully.",
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

// Add participant to a conversation (for group chats)
export function useAddParticipant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("conversation_participants")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({
        title: "Participant added",
        description: "The user has been added to the conversation.",
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

// Update last read timestamp
export function useUpdateLastRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// Get or create a direct conversation with a specific user
export function useGetOrCreateDirectConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all conversations the current user is in
      const { data: myParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myParticipations && myParticipations.length > 0) {
        const myConvIds = myParticipations.map((p) => p.conversation_id);

        // Check if other user is in any of these conversations
        const { data: sharedConvs } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", userId)
          .in("conversation_id", myConvIds);

        if (sharedConvs && sharedConvs.length > 0) {
          // Check if any of these are direct conversations
          const { data: existingDirect } = await supabase
            .from("conversations")
            .select("id")
            .eq("type", "direct")
            .in("id", sharedConvs.map((c) => c.conversation_id))
            .single();

          if (existingDirect) {
            return { conversationId: existingDirect.id, isNew: false };
          }
        }
      }

      // Create new direct conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          type: "direct",
          created_by: user.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add both users as participants
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: userId },
        ]);

      if (partError) throw partError;

      return { conversationId: conversation.id, isNew: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
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
