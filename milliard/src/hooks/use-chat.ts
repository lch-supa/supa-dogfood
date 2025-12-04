import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export interface Message {
  id: string;
  poem_set_id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface MessageWithProfile extends Message {
  user_profile: {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Get messages for a poem set
export function useMessages(poemSetId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages', poemSetId],
    queryFn: async () => {
      if (!poemSetId) return [];

      console.log('Fetching messages for poem set:', poemSetId);

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('poem_set_id', poemSetId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      console.log('Fetched messages:', messagesData?.length || 0);
      if (!messagesData || messagesData.length === 0) return [];

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .in('id', userIds);

      console.log('Fetched profiles:', profiles?.length || 0);

      // Combine messages with profiles
      const data = messagesData.map(msg => ({
        ...msg,
        user_profile: profiles?.find(p => p.id === msg.user_id) || {
          id: msg.user_id,
          email: null,
          display_name: null,
          avatar_url: null,
        },
      }));

      console.log('Combined messages with profiles:', data.length);
      return data as MessageWithProfile[];
    },
    enabled: !!poemSetId && !!user,
  });
}

// Send a message
export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poemSetId,
      message,
    }: {
      poemSetId: string;
      message: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      console.log('Sending message:', { poemSetId, userId: user.id, message: message.trim() });

      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          poem_set_id: poemSetId,
          user_id: user.id,
          message: message.trim(),
        })
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error sending message:', error);
        throw error;
      }

      // Fetch the user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .eq('id', user.id)
        .single();

      const data = {
        ...messageData,
        user_profile: profile || {
          id: user.id,
          email: user.email || null,
          display_name: null,
          avatar_url: null,
        },
      };

      console.log('Message sent successfully:', data);
      return data as MessageWithProfile;
    },
    // Optimistically update the UI for the sender
    onSuccess: (newMessage, variables) => {
      queryClient.setQueryData<MessageWithProfile[]>(
        ['messages', variables.poemSetId],
        (old) => {
          if (!old) return [newMessage];
          // Check if message already exists (might have been added by subscription)
          const exists = old.some((msg) => msg.id === newMessage.id);
          if (exists) return old;
          return [...old, newMessage];
        }
      );
    },
  });
}

// Update a message
export function useUpdateMessage() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      messageId,
      message,
    }: {
      messageId: string;
      message: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: messageData, error } = await supabase
        .from('messages')
        .update({
          message: message.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      // Fetch the user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .eq('id', user.id)
        .single();

      const data = {
        ...messageData,
        user_profile: profile || {
          id: user.id,
          email: user.email || null,
          display_name: null,
          avatar_url: null,
        },
      };

      return data as MessageWithProfile;
    },
    // No need to invalidate - real-time subscription handles updates
  });
}

// Delete a message
export function useDeleteMessage() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      messageId,
      poemSetId,
    }: {
      messageId: string;
      poemSetId: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { messageId, poemSetId };
    },
    // No need to invalidate - real-time subscription handles updates
  });
}

// Subscribe to real-time messages for a poem set
export function useMessageSubscription(poemSetId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!poemSetId || !user) {
      console.log('[Realtime] Skipping subscription setup - missing poemSetId or user');
      return;
    }

    console.log('[Realtime] Setting up subscription for poem set:', poemSetId);
    console.log('[Realtime] Current user:', user.id);

    // Create a unique channel for this poem set
    const channelName = `messages-${poemSetId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });

    // Subscribe to all message events for this poem set
    channel
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: `poem_set_id=eq.${poemSetId}`,
        },
        (payload) => {
          console.log('[Realtime] 📨 Received event:', {
            type: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old,
          });

          // Refetch messages whenever any change happens
          console.log('[Realtime] Invalidating queries and refetching messages...');
          queryClient.invalidateQueries({ queryKey: ['messages', poemSetId] });
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] Subscription status changed:', status);

        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ Successfully subscribed to real-time messages');
          console.log('[Realtime] Channel:', channelName);
          console.log('[Realtime] Filter: poem_set_id=eq.' + poemSetId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] ❌ Failed to subscribe:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('[Realtime] ⏱️ Subscription timed out');
        } else if (status === 'CLOSED') {
          console.log('[Realtime] 🔌 Subscription closed');
        }
      });

    // Cleanup function
    return () => {
      console.log('[Realtime] Cleaning up subscription for:', poemSetId);
      supabase.removeChannel(channel);
    };
  }, [poemSetId, user, queryClient]);
}

// Clear all messages for a poem set
export function useClearMessages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poemSetId: string) => {
      const { error } = await supabase.rpc('clear_poem_set_messages', {
        set_id: poemSetId,
      });

      if (error) throw error;
      return { poemSetId };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['messages', data.poemSetId], []);
    },
  });
}

// Delete old messages (older than 24 hours)
export function useDeleteOldMessages() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('delete_old_messages');
      if (error) throw error;
    },
  });
}

// Typing indicator hook
export function useTypingIndicator(poemSetId: string | undefined) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<Map<string, { displayName: string; email: string }>>(new Map());
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!poemSetId || !user) {
      console.log('[Typing] Skipping typing indicator setup');
      return;
    }

    console.log('[Typing] Setting up typing indicator subscription');

    const channelName = `typing-${poemSetId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }, // Don't receive our own typing events
        presence: { key: user.id },
      },
    });

    // Store channel reference for sending events
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('[Typing] Received typing event:', payload);

        const { userId, displayName, email, isTyping } = payload.payload;

        // Don't show our own typing indicator
        if (userId === user.id) return;

        setTypingUsers((prev) => {
          const next = new Map(prev);
          if (isTyping) {
            next.set(userId, { displayName, email });
          } else {
            next.delete(userId);
          }
          return next;
        });

        // Auto-remove typing indicator after 3 seconds
        if (isTyping) {
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Map(prev);
              next.delete(userId);
              return next;
            });
          }, 3000);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Typing] ✅ Subscribed to typing indicators');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Typing] ❌ Failed to subscribe');
        }
      });

    return () => {
      console.log('[Typing] Cleaning up typing indicator subscription');
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [poemSetId, user]);

  const sendTypingEvent = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !user) {
      console.log('[Typing] Channel not ready, skipping send');
      return;
    }

    console.log('[Typing] Sending typing event:', isTyping);

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user.id,
        displayName: user.user_metadata?.display_name || null,
        email: user.email,
        isTyping,
      },
    });
  }, [user]);

  return {
    typingUsers: Array.from(typingUsers.entries()).map(([userId, info]) => ({
      userId,
      ...info,
    })),
    sendTypingEvent,
  };
}
