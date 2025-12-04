# Supabase Edge Functions Setup Guide

This guide will help you set up the AI poem generation feature using Supabase Edge Functions and Claude.

## Prerequisites

- Supabase account with a project created
- Anthropic API key ([get one here](https://console.anthropic.com/))
- Supabase CLI installed (`npm install -g supabase`)

## Step 1: Link Your Supabase Project

```bash
# Login to Supabase
supabase login

# Link your project (get your project ref from Supabase dashboard URL)
supabase link --project-ref your-project-ref
```

## Step 2: Set Up Database Schema

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/schema.sql`
4. Paste and run the SQL

This will create:
- `poem_sets` table for storing AI-generated poem collections
- Proper indexes and RLS policies
- Update to `saved_poems` table to link to poem sets

## Step 3: Configure Edge Function Secrets

Set the required environment variables for the edge function:

```bash
# Set your Anthropic API key
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key_here

# The following are automatically available in edge functions:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
```

## Step 4: Deploy the Edge Function

```bash
# Deploy the generate-poems function
supabase functions deploy generate-poems
```

## Step 5: Test the Function

You can test the function from the Supabase dashboard or using curl:

```bash
curl -L -X POST 'https://your-project-ref.supabase.co/functions/v1/generate-poems' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{"theme":"Love and Nature","description":"Focus on spring imagery"}'
```

## Step 6: Verify Environment Variables

Make sure your `.env.local` file has:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## How It Works

1. **User Clicks "Generate New Poems"** → Opens dialog to enter theme and description
2. **Frontend calls Edge Function** → Sends request to `/functions/v1/generate-poems`
3. **Edge Function calls Claude API** → Generates 10 sonnets (14 lines each)
4. **Poems stored in Supabase** → Saved to `poem_sets` table
5. **User can browse and select** → Switch between different poem sets

## Troubleshooting

### Edge Function Errors

Check logs:
```bash
supabase functions serve generate-poems
```

### Database Issues

Verify the schema was created:
```sql
SELECT * FROM poem_sets LIMIT 1;
```

### API Key Issues

Verify secrets are set:
```bash
supabase secrets list
```

### Generation Takes Too Long

- Normal generation time: 30-60 seconds
- Claude needs to generate 10 sonnets (140 lines total)
- If it fails, check the edge function logs

## Cost Estimates

- **Claude API**: ~$0.20-0.40 per poem set generation
- **Supabase**: Free tier includes:
  - 500MB database
  - 2GB bandwidth
  - 500,000 Edge Function invocations/month

## Model Information

The function uses `claude-sonnet-4-20250514` which:
- Excellent at creative writing
- Maintains consistency across poems
- Understands the combinatorial structure needed
- Cost-effective for this use case
