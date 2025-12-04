import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GeneratePoemsRequest {
  theme: string;
  description?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { theme, description } = await req.json() as GeneratePoemsRequest;

    if (!theme) {
      return new Response(
        JSON.stringify({ error: "Theme is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Anthropic API key from environment
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    // Create prompt for Claude
    const prompt = `You are a skilled poet. Generate exactly 10 sonnets (14-line poems) on the theme: "${theme}"${
      description ? `\n\nAdditional context: ${description}` : ""
    }

CRITICAL REQUIREMENTS:
1. Each sonnet must have EXACTLY 14 lines
2. All sonnets must follow the same structural pattern - each line at position N should be grammatically compatible with line N in other sonnets
3. Lines should be designed so they can be mixed and matched while maintaining poetic coherence
4. Use consistent meter and rhyme scheme across all sonnets (ABAB CDCD EFEF GG)
5. Lines at the same position should have similar syllable counts and rhythm

RHYME REQUIREMENTS (VERY IMPORTANT):
6. All line 1s across the 10 sonnets must end with DIFFERENT words that share the same rhyme sound (e.g., "day", "way", "stay", "gray", "play", "say", "bay", "ray", "may", "stray")
7. All line 2s must end with DIFFERENT words sharing a different rhyme sound (e.g., "bright", "night", "sight", "light", "flight", "might", "height", "right", "tight", "slight")
8. Continue this pattern for all 14 line positions
9. NEVER repeat the exact same ending word across different sonnets at the same line position
10. Maximize lexical variety - use diverse vocabulary while maintaining the rhyme scheme

EXAMPLE of what to do:
- Sonnet 1, Line 1: "Upon the hill at break of day"
- Sonnet 2, Line 1: "The poet finds a winding way"
- Sonnet 3, Line 1: "Where shadows long refuse to stay"
(Notice: "day", "way", "stay" are all DIFFERENT words that RHYME)

EXAMPLE of what NOT to do:
- Sonnet 1, Line 1: "Upon the hill at break of day"
- Sonnet 2, Line 1: "The morning light reveals the day"
- Sonnet 3, Line 1: "A new beginning comes each day"
(This is WRONG - the word "day" is repeated)

Format your response as a valid JSON object with this exact structure:
{
  "title": "A brief title for this set (3-5 words)",
  "theme": "${theme}",
  "poems": [
    {
      "lines": ["line 1", "line 2", ... "line 14"]
    },
    ... (repeat for all 10 sonnets)
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no additional text
- Each poem must have exactly 14 lines
- Make each line position interchangeable with the same position in other poems
- Remember: DIFFERENT words, SAME rhyme sound for each line position`;

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    let content = data.content[0].text;

    // Strip markdown code fences if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Parse the JSON response from Claude
    let poemSet;
    try {
      poemSet = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse JSON. Raw content:', content);
      throw new Error(`Failed to parse Claude response as JSON: ${e.message}\n\nFirst 500 chars of response: ${content.substring(0, 500)}`);
    }

    // Validate the structure
    if (
      !poemSet.title ||
      !poemSet.theme ||
      !Array.isArray(poemSet.poems) ||
      poemSet.poems.length !== 10
    ) {
      throw new Error("Invalid poem set structure from Claude");
    }

    // Validate each poem has 14 lines
    for (const poem of poemSet.poems) {
      if (!Array.isArray(poem.lines) || poem.lines.length !== 14) {
        throw new Error("Each poem must have exactly 14 lines");
      }
    }

    // Get authenticated user from request
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with the user's token to get auth context
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader || '' },
      },
    });

    // Get the authenticated user
    const { data: { user } } = await supabaseClient.auth.getUser();

    // Store in Supabase using service role for the insert
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: savedSet, error: dbError } = await supabase
      .from("poem_sets")
      .insert({
        title: poemSet.title,
        theme: poemSet.theme,
        poems: poemSet.poems,
        user_id: user?.id || null,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    return new Response(JSON.stringify(savedSet), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating poems:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
