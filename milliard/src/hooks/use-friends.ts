import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

// ============================================
// TYPES
// ============================================

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface FriendRequestWithProfile extends FriendRequest {
  sender_profile: {
    id: string;
    handle: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  receiver_profile: {
    id: string;
    handle: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface FriendshipWithProfile extends Friendship {
  friend_profile: {
    id: string;
    handle: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Get list of accepted friendships for current user
 * Returns profiles of all friends
 */
export function useFriends() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friendships', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Query friendships where current user is either user1 or user2
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Now fetch the friend profiles
      // For each friendship, determine which user is the friend
      const friendIds = data.map((friendship) =>
        friendship.user1_id === user.id ? friendship.user2_id : friendship.user1_id
      );

      if (friendIds.length === 0) return [];

      // Fetch all friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, handle, display_name, avatar_url')
        .in('id', friendIds);

      if (profilesError) throw profilesError;

      // Combine friendships with profiles
      return data.map((friendship) => {
        const friendId = friendship.user1_id === user.id
          ? friendship.user2_id
          : friendship.user1_id;

        const friendProfile = profiles.find(p => p.id === friendId);

        return {
          ...friendship,
          friend_id: friendId,
          friend_profile: friendProfile || {
            id: friendId,
            handle: null,
            display_name: null,
            avatar_url: null
          }
        };
      }) as FriendshipWithProfile[];
    },
    enabled: !!user,
  });
}

/**
 * Get pending friend requests sent TO current user
 */
export function useFriendRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friend-requests-received', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender_profile:profiles!friend_requests_sender_id_fkey (
            id,
            handle,
            display_name,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion to match expected structure
      return data.map(req => ({
        ...req,
        requester_profile: req.sender_profile
      })) as any;
    },
    enabled: !!user,
  });
}

/**
 * Get pending friend requests sent BY current user
 */
export function useSentFriendRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friend-requests-sent', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          receiver_profile:profiles!friend_requests_receiver_id_fkey (
            id,
            handle,
            display_name,
            avatar_url
          )
        `)
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion to match expected structure
      return data.map(req => ({
        ...req,
        friend_profile: req.receiver_profile
      })) as any;
    },
    enabled: !!user,
  });
}

/**
 * Check if current user is friends with another user
 */
export function useIsFriend(userId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-friend', user?.id, userId],
    queryFn: async () => {
      if (!user || !userId) return false;

      const { data, error } = await supabase.rpc('are_friends', {
        user_a: user.id,
        user_b: userId
      });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user && !!userId,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Send a friend request to a user (by handle or user_id)
 */
export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ handle, userId }: { handle?: string; userId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      let targetUserId = userId;

      // If handle provided, look up user by handle
      if (handle && !userId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('handle', handle)
          .single();

        if (profileError) throw new Error('User not found');
        targetUserId = profile.id;
      }

      if (!targetUserId) throw new Error('Must provide handle or userId');

      // Use the RPC function to send the request with validation
      const { data, error } = await supabase.rpc('send_friend_request', {
        target_user_id: targetUserId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] });
    },
  });
}

/**
 * Accept a friend request
 */
export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Use the RPC function which handles creating the friendship and deleting the request
      const { error } = await supabase.rpc('accept_friend_request', {
        request_id: requestId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests-received'] });
    },
  });
}

/**
 * Reject a friend request
 */
export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Use the RPC function
      const { error } = await supabase.rpc('reject_friend_request', {
        request_id: requestId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests-received'] });
    },
  });
}

/**
 * Remove a friendship (unfriend)
 */
export function useRemoveFriend() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (friendId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Delete the friendship row (UUID ordering is handled by the check constraint)
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user1_id', user.id < friendId ? user.id : friendId)
        .eq('user2_id', user.id < friendId ? friendId : user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
    },
  });
}

/**
 * Cancel a sent friend request
 */
export function useCancelFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('sender_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] });
    },
  });
}
