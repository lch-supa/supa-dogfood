import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string | null;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    user,
    loading,
    isAuthenticated: !!user,
  };
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      handle,
      displayName,
    }: {
      email: string;
      password: string;
      handle: string;
      displayName?: string;
    }) => {
      // First, check if handle is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('handle')
        .eq('handle', handle)
        .single();

      if (existingProfile) {
        throw new Error('Handle is already taken');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            handle,
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      // Update profile with handle (in case trigger doesn't set it)
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            handle,
            display_name: displayName
          })
          .eq('id', data.user.id);

        if (profileError) throw profileError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useOAuthSignIn() {
  return useMutation({
    mutationFn: async ({
      provider,
    }: {
      provider: 'google' | 'github' | 'gitlab' | 'discord' | 'twitter';
    }) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');

      // If updating handle, check if it's available
      if (updates.handle) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('handle', updates.handle)
          .neq('id', user.id)
          .single();

        if (existingProfile) {
          throw new Error('Handle is already taken');
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useCheckHandleAvailability() {
  return useMutation({
    mutationFn: async (handle: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('handle')
        .eq('handle', handle)
        .single();

      return !data; // true if available, false if taken
    },
  });
}
