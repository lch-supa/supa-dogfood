import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PoemSet {
  id: string;
  title: string;
  tags: string[];
  poems: Array<{ lines: string[] }>;
  created_at: string;
  updated_at: string;
  user_id?: string;
  is_public: boolean;
  status: 'draft' | 'published';
  allow_collaboration?: boolean;
  group_id?: string | null;
}

export interface GeneratePoemsRequest {
  tags: string[];
  description?: string;
}

export interface ManualPoemSetInput {
  title: string;
  tags: string[];
  poems: Array<{ lines: string[] }>;
}

// Fetch all published public poem sets
export function usePoemSets() {
  return useQuery({
    queryKey: ['poem-sets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poem_sets')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PoemSet[];
    },
  });
}

// Fetch user's draft poem sets
export function useDraftPoemSets() {
  return useQuery({
    queryKey: ['draft-poem-sets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('poem_sets')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as PoemSet[];
    },
  });
}

// Fetch all user's poem sets (both owned and collaborated)
export function useUserPoemSets() {
  return useQuery({
    queryKey: ['user-poem-sets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch poem sets where user is the owner
      const { data: ownedSets, error: ownedError } = await supabase
        .from('poem_sets')
        .select('*')
        .eq('user_id', user.id);

      if (ownedError) throw ownedError;

      // Fetch poem sets where user is a collaborator
      const { data: collabData, error: collabError } = await supabase
        .from('poem_set_collaborators')
        .select('poem_set_id')
        .eq('user_id', user.id);

      if (collabError) throw collabError;

      let collaboratedSets: PoemSet[] = [];
      if (collabData && collabData.length > 0) {
        const collabSetIds = collabData.map(c => c.poem_set_id);
        const { data: sets, error: setsError } = await supabase
          .from('poem_sets')
          .select('*')
          .in('id', collabSetIds);

        if (setsError) throw setsError;
        collaboratedSets = sets || [];
      }

      // Merge and deduplicate (in case user owns and is listed as collaborator)
      const allSets = [...(ownedSets || []), ...collaboratedSets];
      const uniqueSets = Array.from(
        new Map(allSets.map(set => [set.id, set])).values()
      );

      // Sort by updated_at
      uniqueSets.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      return uniqueSets as PoemSet[];
    },
  });
}

// Fetch a specific poem set (with privacy checks)
export function usePoemSet(id: string | null) {
  return useQuery({
    queryKey: ['poem-set', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: { user } } = await supabase.auth.getUser();

      // First, try to fetch the poem set
      const { data, error } = await supabase
        .from('poem_sets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // Return null if not found
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // Check access permissions
      const isPublic = data.is_public && data.status === 'published';
      const isOwner = user && data.user_id === user.id;

      // If public or owner, allow access
      if (isPublic || isOwner) {
        return data as PoemSet;
      }

      // Check if user is a collaborator
      if (user) {
        const { data: collabData } = await supabase
          .from('poem_set_collaborators')
          .select('id')
          .eq('poem_set_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (collabData) {
          return data as PoemSet;
        }
      }

      // No access - return null (don't expose existence)
      return null;
    },
    enabled: !!id,
  });
}

// Generate new poem set using Claude
export function useGeneratePoems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: GeneratePoemsRequest) => {
      // Get Supabase URL for the edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Get the current session to send the access token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-poems`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate poems');
      }

      return response.json() as Promise<PoemSet>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poem-sets'] });
    },
  });
}

// Manually create or update a poem set
export function useSaveManualPoemSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ input, status, id }: { input: ManualPoemSetInput; status: 'draft' | 'published'; id?: string }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to create poem sets');

      // Validate the input if publishing
      if (status === 'published') {
        if (input.poems.length !== 10) {
          throw new Error('Poem set must contain exactly 10 sonnets');
        }

        for (let i = 0; i < input.poems.length; i++) {
          if (input.poems[i].lines.length !== 14) {
            throw new Error(`Sonnet ${i + 1} must have exactly 14 lines`);
          }
        }
      }

      const poemSetData = {
        title: input.title,
        tags: input.tags,
        poems: input.poems,
        user_id: user.id,
        is_public: status === 'published',
        status,
        updated_at: new Date().toISOString(),
      };

      let data, error;

      if (id) {
        // Update existing draft
        ({ data, error } = await supabase
          .from('poem_sets')
          .update(poemSetData)
          .eq('id', id)
          .select()
          .single());
      } else {
        // Insert new poem set
        ({ data, error } = await supabase
          .from('poem_sets')
          .insert(poemSetData)
          .select()
          .single());
      }

      if (error) throw error;
      return data as PoemSet;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['draft-poem-sets'] });
    },
  });
}

// Publish a poem set
export function usePublishPoemSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to publish poem sets');

      // Fetch the set to validate it
      const { data: existingSet, error: fetchError } = await supabase
        .from('poem_sets')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw new Error('Poem set not found or you do not have permission');

      // Validate: must have 10 poems with 14 lines each
      if (existingSet.poems.length !== 10) {
        throw new Error('Poem set must contain exactly 10 sonnets');
      }
      for (let i = 0; i < existingSet.poems.length; i++) {
        if (existingSet.poems[i].lines.length !== 14) {
          throw new Error(`Sonnet ${i + 1} must have exactly 14 lines`);
        }
      }

      // Update to published
      const { data, error } = await supabase
        .from('poem_sets')
        .update({
          status: 'published',
          is_public: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PoemSet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['user-poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['draft-poem-sets'] });
    },
  });
}

// Unpublish a poem set (convert back to draft)
export function useUnpublishPoemSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in');

      const { data, error } = await supabase
        .from('poem_sets')
        .update({
          status: 'draft',
          is_public: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as PoemSet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['user-poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['draft-poem-sets'] });
    },
  });
}

// Delete a poem set
export function useDeletePoemSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('poem_sets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['user-poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['draft-poem-sets'] });
    },
  });
}

// Update an existing poem set (for editing)
export function useUpdatePoemSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      tags,
      poems,
      allowCollaboration
    }: {
      id: string;
      title?: string;
      tags?: string[];
      poems?: Array<{ lines: string[] }>;
      allowCollaboration?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to update poem sets');

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (title !== undefined) updateData.title = title;
      if (tags !== undefined) updateData.tags = tags;
      if (poems !== undefined) updateData.poems = poems;
      if (allowCollaboration !== undefined) updateData.allow_collaboration = allowCollaboration;

      const { data, error } = await supabase
        .from('poem_sets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PoemSet;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['user-poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['draft-poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['poem-set', data.id] });
    },
  });
}

// Assign a poem set to a group
export function useAssignPoemSetToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poemSetId, groupId }: { poemSetId: string; groupId: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in');

      const { data, error } = await supabase
        .from('poem_sets')
        .update({
          group_id: groupId,
          allow_collaboration: groupId !== null,  // Enable collaboration when adding to group, disable when removing
          updated_at: new Date().toISOString(),
        })
        .eq('id', poemSetId)
        .eq('user_id', user.id)  // Only owner can assign to group
        .select()
        .single();

      if (error) throw error;
      return data as PoemSet;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['user-poem-sets'] });
      queryClient.invalidateQueries({ queryKey: ['poem-set', data.id] });
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      if (data.group_id) {
        queryClient.invalidateQueries({ queryKey: ['group', data.group_id] });
      }
    },
  });
}

// Fetch poem sets for a specific group
export function useGroupPoemSets(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-poem-sets', groupId],
    queryFn: async () => {
      if (!groupId) throw new Error('Group ID is required');

      const { data, error } = await supabase
        .from('poem_sets')
        .select('*')
        .eq('group_id', groupId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as PoemSet[];
    },
    enabled: !!groupId,
  });
}
