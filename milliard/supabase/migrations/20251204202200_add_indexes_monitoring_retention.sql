-- ============================================================================
-- Optimize Messages Table with Indexes, Monitoring, and Retention Policies
-- ============================================================================

-- ============================================================================
-- 1. OPTIMIZED INDEXES FOR MESSAGES TABLE
-- ============================================================================

-- Drop existing basic indexes if they exist (we'll replace with optimized versions)
DROP INDEX IF EXISTS idx_messages_poem_set_id;
DROP INDEX IF EXISTS idx_messages_user_id;
DROP INDEX IF EXISTS idx_messages_created_at;

-- Primary composite index for fetching chat history (most common query pattern)
-- Optimizes: SELECT * FROM messages WHERE poem_set_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_messages_poem_set_created_desc
ON messages(poem_set_id, created_at DESC);

-- Index for user's message history across all chats
-- Optimizes: SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_messages_user_created_desc
ON messages(user_id, created_at DESC);

-- Index for deletion operations (used by retention policy)
-- Optimizes: DELETE FROM messages WHERE created_at < ?
CREATE INDEX IF NOT EXISTS idx_messages_created_at_only
ON messages(created_at);

-- ============================================================================
-- 2. MONITORING VIEWS
-- ============================================================================

-- Overall chat metrics view
CREATE OR REPLACE VIEW chat_metrics AS
SELECT
  COUNT(*) as total_messages,
  COUNT(DISTINCT poem_set_id) as total_chats,
  COUNT(DISTINCT user_id) as total_users,
  MAX(created_at) as last_message_at,
  MIN(created_at) as first_message_at,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as messages_last_hour,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as messages_last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as messages_last_7d,
  COUNT(DISTINCT poem_set_id) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as active_chats_24h,
  COUNT(DISTINCT user_id) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as active_users_24h,
  pg_size_pretty(pg_total_relation_size('messages')) as table_size,
  pg_size_pretty(pg_relation_size('messages')) as data_size,
  pg_size_pretty(pg_total_relation_size('messages') - pg_relation_size('messages')) as index_size
FROM messages;

-- Per-chat activity metrics
CREATE OR REPLACE VIEW chat_activity AS
SELECT
  m.poem_set_id,
  ps.title as poem_set_title,
  COUNT(*) as message_count,
  COUNT(DISTINCT m.user_id) as participant_count,
  MAX(m.created_at) as last_message_at,
  MIN(m.created_at) as first_message_at,
  COUNT(*) FILTER (WHERE m.created_at > NOW() - INTERVAL '24 hours') as messages_24h,
  COUNT(*) FILTER (WHERE m.created_at > NOW() - INTERVAL '7 days') as messages_7d,
  ROUND(
    COUNT(*)::NUMERIC /
    GREATEST(1, EXTRACT(EPOCH FROM (MAX(m.created_at) - MIN(m.created_at))) / 86400),
    2
  ) as avg_messages_per_day
FROM messages m
LEFT JOIN poem_sets ps ON ps.id = m.poem_set_id
GROUP BY m.poem_set_id, ps.title
ORDER BY last_message_at DESC;

-- Per-user activity metrics
CREATE OR REPLACE VIEW user_chat_activity AS
SELECT
  m.user_id,
  p.email,
  p.display_name,
  COUNT(*) as total_messages,
  COUNT(DISTINCT m.poem_set_id) as chats_participated,
  MAX(m.created_at) as last_message_at,
  MIN(m.created_at) as first_message_at,
  COUNT(*) FILTER (WHERE m.created_at > NOW() - INTERVAL '24 hours') as messages_24h,
  COUNT(*) FILTER (WHERE m.created_at > NOW() - INTERVAL '7 days') as messages_7d
FROM messages m
LEFT JOIN profiles p ON p.id = m.user_id
GROUP BY m.user_id, p.email, p.display_name
ORDER BY total_messages DESC;

-- Chat health metrics (for identifying issues)
CREATE OR REPLACE VIEW chat_health AS
SELECT
  'Message Table Size' as metric,
  pg_size_pretty(pg_total_relation_size('messages')) as value,
  CASE
    WHEN pg_total_relation_size('messages') > 10737418240 THEN 'warning'  -- > 10GB
    WHEN pg_total_relation_size('messages') > 1073741824 THEN 'info'       -- > 1GB
    ELSE 'ok'
  END as status
UNION ALL
SELECT
  'Total Messages',
  COUNT(*)::TEXT,
  CASE
    WHEN COUNT(*) > 10000000 THEN 'warning'  -- > 10M
    WHEN COUNT(*) > 1000000 THEN 'info'      -- > 1M
    ELSE 'ok'
  END
FROM messages
UNION ALL
SELECT
  'Oldest Message Age',
  EXTRACT(EPOCH FROM (NOW() - MIN(created_at)))::INTEGER / 86400 || ' days',
  CASE
    WHEN MIN(created_at) < NOW() - INTERVAL '7 days' THEN 'warning'  -- Retention not working
    ELSE 'ok'
  END
FROM messages
UNION ALL
SELECT
  'Messages Per Second (24h avg)',
  ROUND(
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::NUMERIC / 86400,
    4
  )::TEXT,
  CASE
    WHEN COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') / 86400 > 100 THEN 'warning'
    ELSE 'ok'
  END
FROM messages;

-- ============================================================================
-- 3. MESSAGE RETENTION POLICIES (7-DAY RETENTION)
-- ============================================================================

-- Function to delete messages older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS TABLE(deleted_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count BIGINT;
BEGIN
  -- Delete messages older than 7 days
  DELETE FROM messages
  WHERE created_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log the cleanup operation
  RAISE NOTICE 'Deleted % old messages', v_deleted_count;

  RETURN QUERY SELECT v_deleted_count;
END;
$$;

-- Function to get retention policy status
CREATE OR REPLACE FUNCTION retention_policy_status()
RETURNS TABLE(
  total_messages BIGINT,
  messages_to_delete BIGINT,
  oldest_message_age INTERVAL,
  retention_period INTERVAL,
  last_cleanup_needed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_messages,
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '7 days')::BIGINT as messages_to_delete,
    NOW() - MIN(created_at) as oldest_message_age,
    INTERVAL '7 days' as retention_period,
    EXISTS(SELECT 1 FROM messages WHERE created_at < NOW() - INTERVAL '7 days') as last_cleanup_needed
  FROM messages;
END;
$$;

-- ============================================================================
-- 4. SCHEDULED RETENTION JOB (using pg_cron if available)
-- ============================================================================

-- Note: pg_cron extension needs to be enabled in Supabase dashboard
-- This will attempt to create the scheduled job, but won't fail if pg_cron isn't available

DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule cleanup to run daily at 2 AM UTC
    PERFORM cron.schedule(
      'cleanup-old-messages',           -- job name
      '0 2 * * *',                      -- cron schedule (2 AM daily)
      'SELECT cleanup_old_messages()'   -- SQL command
    );
    RAISE NOTICE 'Scheduled daily cleanup job at 2 AM UTC';
  ELSE
    RAISE NOTICE 'pg_cron extension not available - manual cleanup required';
    RAISE NOTICE 'Run SELECT cleanup_old_messages() periodically or enable pg_cron';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
    RAISE NOTICE 'You can manually run: SELECT cleanup_old_messages()';
END $$;

-- ============================================================================
-- 5. GRANT PERMISSIONS FOR MONITORING VIEWS
-- ============================================================================

-- Allow authenticated users to view monitoring data
GRANT SELECT ON chat_metrics TO authenticated;
GRANT SELECT ON chat_activity TO authenticated;
GRANT SELECT ON user_chat_activity TO authenticated;
GRANT SELECT ON chat_health TO authenticated;

-- Allow service role to execute cleanup functions
GRANT EXECUTE ON FUNCTION cleanup_old_messages() TO service_role;
GRANT EXECUTE ON FUNCTION retention_policy_status() TO service_role;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- View overall chat metrics:
-- SELECT * FROM chat_metrics;

-- View per-chat activity:
-- SELECT * FROM chat_activity WHERE messages_24h > 0;

-- View per-user activity:
-- SELECT * FROM user_chat_activity WHERE messages_24h > 0;

-- Check system health:
-- SELECT * FROM chat_health;

-- Check retention policy status:
-- SELECT * FROM retention_policy_status();

-- Manually trigger cleanup (if needed):
-- SELECT cleanup_old_messages();

-- View index usage statistics:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'messages'
-- ORDER BY idx_scan DESC;
