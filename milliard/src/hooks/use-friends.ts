import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  requested_at: string;
  responded_at: string | null;
}

export interface FriendWithProfile extends Friend {
  friend_profile: {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface FriendRequestWithProfile extends Friend {
  requester_profile: {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Get list of friends for current user
export function useFriends() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          friend_profile:friend_id (
            id,
            email,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as FriendWithProfile[];
    },
    enabled: !!user,
  });
}

// Get pending friend requests sent to current user
export function useFriendRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friend-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          requester_profile:user_id (
            id,
            email,
            display_name,
            avatar_url
          )
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as FriendRequestWithProfile[];
    },
    enabled: !!user,
  });
}

// Get pending friend requests sent by current user
export function useSentFriendRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sent-friend-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          friend_profile:friend_id (
            id,
            email,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as FriendWithProfile[];
    },
    enabled: !!user,
  });
}

// Send friend request to a user (by email or user_id)
export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ email, userId }: { email?: string; userId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      let friendId = userId;

      // If email provided, look up user by email
      if (email && !userId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (profileError) throw new Error('User not found');
        friendId = profile.id;
      }

      if (!friendId) throw new Error('Must provide email or userId');

      // Check if friend request already exists (in either direction)
      const { data: existing } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .single();

      if (existing) {
        if (existing.status === 'pending') {
          throw new Error('Friend request already pending');
        } else if (existing.status === 'accepted') {
          throw new Error('Already friends');
        }
      }

      const { data, error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['sent-friend-requests'] });
    },
  });
}

// Accept friend request
export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('friends')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('friend_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Create reciprocal friendship
      const { data: reciprocal, error: reciprocalError } = await supabase
        .from('friends')
        .insert({
          user_id: data.friend_id,
          friend_id: data.user_id,
          status: 'accepted',
          requested_at: data.requested_at,
          responded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (reciprocalError) throw reciprocalError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

// Reject friend request
export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('friends')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('friend_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

// Remove friend (unfriend)
export function useRemoveFriend() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (friendId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Delete both directions of the friendship
      const { error: error1 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', friendId);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', user.id);

      if (error2) throw error2;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

// Check if two users are friends
export function useIsFriend(userId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-friend', user?.id, userId],
    queryFn: async () => {
      if (!user || !userId) return false;

      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('friend_id', userId)
        .eq('status', 'accepted')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return !!data;
    },
    enabled: !!user && !!userId,
  });
}
