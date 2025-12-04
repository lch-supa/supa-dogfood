import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SavedPoemLine {
  id: string;
  saved_poem_id: string;
  line_number: number;
  line_text: string;
  poem_position: number;
  created_at: string;
}

export interface SavedPoem {
  id: string;
  title: string;
  user_id: string;
  poem_set_id: string;
  created_at: string;
  lines?: SavedPoemLine[];
}

export interface SavePoemInput {
  title: string;
  poem_set_id: string;
  lines: Array<{
    line_number: number;
    line_text: string;
    poem_position: number;
  }>;
}

export function useSavedPoems() {
  return useQuery({
    queryKey: ['saved-poems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_poems')
        .select(`
          *,
          lines:saved_poem_lines(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Sort lines by line_number for each poem
      return (data as SavedPoem[]).map(poem => ({
        ...poem,
        lines: poem.lines?.sort((a, b) => a.line_number - b.line_number) || [],
      }));
    },
  });
}

export function useSavePoem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SavePoemInput) => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      console.log('Save poem - Current user:', user);
      console.log('Save poem - User error:', userError);

      if (!user) throw new Error('You must be signed in to save poems');

      // Insert the poem
      console.log('Inserting poem with data:', {
        title: input.title,
        user_id: user.id,
        poem_set_id: input.poem_set_id,
      });

      const { data: poem, error: poemError } = await supabase
        .from('saved_poems')
        .insert({
          title: input.title,
          user_id: user.id,
          poem_set_id: input.poem_set_id,
        })
        .select()
        .single();

      console.log('Poem insert result:', { poem, poemError });

      if (poemError) {
        console.error('Error inserting poem:', poemError);
        throw new Error(`Failed to save poem: ${poemError.message}`);
      }

      // Insert all lines
      const linesToInsert = input.lines.map(line => ({
        saved_poem_id: poem.id,
        line_number: line.line_number,
        line_text: line.line_text,
        poem_position: line.poem_position,
      }));

      console.log('Inserting lines:', linesToInsert);

      const { error: linesError } = await supabase
        .from('saved_poem_lines')
        .insert(linesToInsert);

      if (linesError) {
        console.error('Error inserting lines:', linesError);
        throw new Error(`Failed to save poem lines: ${linesError.message}`);
      }

      console.log('Poem saved successfully:', poem);
      return poem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-poems'] });
    },
  });
}

export function useDeletePoem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Deleting the poem will cascade delete the lines due to foreign key
      const { error } = await supabase
        .from('saved_poems')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-poems'] });
    },
  });
}
