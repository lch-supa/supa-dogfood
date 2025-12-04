import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Collaborator {
  id: string;
  poem_set_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_by?: string;
  created_at: string;
  user?: {
    id: string;
    email?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// Fetch collaborators for a poem set
export function useCollaborators(poemSetId: string | null) {
  return useQuery({
    queryKey: ['collaborators', poemSetId],
    queryFn: async () => {
      if (!poemSetId) return [];

      // Fetch collaborators
      const { data: collabData, error: collabError } = await supabase
        .from('poem_set_collaborators')
        .select('*')
        .eq('poem_set_id', poemSetId)
        .order('created_at', { ascending: true });

      if (collabError) throw collabError;
      if (!collabData || collabData.length === 0) return [];

      // Fetch user profiles for all collaborators
      const userIds = collabData.map(c => c.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Merge the data
      const collaborators = collabData.map(collab => ({
        ...collab,
        user: profileData?.find(p => p.id === collab.user_id)
      }));

      return collaborators as Collaborator[];
    },
    enabled: !!poemSetId,
  });
}

// Invite a collaborator to a poem set
export function useInviteCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poemSetId,
      userEmail,
      role = 'editor',
    }: {
      poemSetId: string;
      userEmail: string;
      role?: 'editor' | 'viewer';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to invite collaborators');

      // Look up the user by email
      const { data: invitedUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (userError || !invitedUser) {
        throw new Error('User not found. They must have an account first.');
      }

      // Add the collaborator
      const { data: collabData, error } = await supabase
        .from('poem_set_collaborators')
        .insert({
          poem_set_id: poemSetId,
          user_id: invitedUser.id,
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This user is already a collaborator');
        }
        throw error;
      }

      // Fetch the user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .eq('id', invitedUser.id)
        .single();

      return {
        ...collabData,
        user: profileData
      } as Collaborator;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', variables.poemSetId] });
    },
  });
}

// Remove a collaborator from a poem set
export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poemSetId,
      collaboratorId,
    }: {
      poemSetId: string;
      collaboratorId: string;
    }) => {
      const { error } = await supabase
        .from('poem_set_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', variables.poemSetId] });
    },
  });
}

// Update a collaborator's role
export function useUpdateCollaboratorRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poemSetId,
      collaboratorId,
      role,
    }: {
      poemSetId: string;
      collaboratorId: string;
      role: 'editor' | 'viewer';
    }) => {
      const { data: collabData, error } = await supabase
        .from('poem_set_collaborators')
        .update({ role })
        .eq('id', collaboratorId)
        .select()
        .single();

      if (error) throw error;

      // Fetch the user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .eq('id', collabData.user_id)
        .single();

      return {
        ...collabData,
        user: profileData
      } as Collaborator;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', variables.poemSetId] });
    },
  });
}

// Check if current user is a collaborator with edit permissions
export function useCanEdit(poemSetId: string | null) {
  const { data: collaborators } = useCollaborators(poemSetId);

  return useQuery({
    queryKey: ['can-edit', poemSetId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !collaborators) return false;

      const userCollab = collaborators.find(c => c.user_id === user.id);
      return userCollab?.role === 'owner' || userCollab?.role === 'editor';
    },
    enabled: !!poemSetId && !!collaborators,
  });
}
