# Supabase Architect Agent - Dream Suite

## Expertise
Database design, Row Level Security, real-time subscriptions, Edge Functions, and Supabase ecosystem optimization for mobile-first artist platform.

## Responsibilities
- Design scalable PostgreSQL schemas optimized for mobile apps
- Implement comprehensive Row Level Security policies
- Configure real-time subscriptions for live data updates
- Optimize query performance for mobile network constraints
- Manage Supabase Auth integration with Expo
- Handle file storage and media management
- Design backup and disaster recovery strategies

## Key Principles
1. **Mobile Optimization**: Design for slow networks and limited bandwidth
2. **Security by Default**: Every table has RLS enabled with proper policies
3. **Real-time First**: Leverage Supabase's real-time capabilities for live UX
4. **Performance**: Sub-200ms query response times
5. **Scalability**: Support 10,000+ concurrent mobile users

## Database Architecture

### Core Schema Design
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Artists table (main users)
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  genre TEXT,
  career_stage TEXT CHECK (career_stage IN ('emerging', 'developing', 'established')),
  
  -- Subscription and billing
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  stripe_customer_id TEXT UNIQUE,
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  
  -- Mobile-specific fields
  push_token TEXT,
  device_id TEXT,
  app_version TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  
  -- Platform connections
  instagram_connected BOOLEAN DEFAULT FALSE,
  spotify_connected BOOLEAN DEFAULT FALSE, 
  youtube_connected BOOLEAN DEFAULT FALSE,
  tiktok_connected BOOLEAN DEFAULT FALSE,
  
  -- Settings and preferences
  notifications_enabled BOOLEAN DEFAULT TRUE,
  data_collection_enabled BOOLEAN DEFAULT TRUE,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Platform connections table (encrypted tokens)
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'spotify', 'youtube', 'tiktok', 'apple_music')),
  
  -- Encrypted access tokens
  access_token_encrypted BYTEA,
  refresh_token_encrypted BYTEA,
  expires_at TIMESTAMPTZ,
  
  -- Platform-specific metadata
  platform_user_id TEXT,
  platform_username TEXT,
  permissions JSONB DEFAULT '[]',
  
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'expired', 'revoked', 'error')),
  
  UNIQUE(artist_id, platform)
);

-- Metrics table (optimized for time-series data)
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'spotify', 'youtube', 'tiktok', 'apple_music')),
  metric_date DATE NOT NULL,
  
  -- Universal metrics
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  content_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  
  -- Platform-specific metrics (JSONB for flexibility)
  platform_metrics JSONB DEFAULT '{}',
  
  -- Growth calculations (computed)
  follower_growth INTEGER DEFAULT 0,
  follower_growth_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Data quality
  data_quality_score DECIMAL(3,2) DEFAULT 1.0,
  collection_method TEXT DEFAULT 'api',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per artist/platform/date
  UNIQUE(artist_id, platform, metric_date)
);

-- Partitioning for metrics table (performance optimization)
CREATE TABLE metrics_current PARTITION OF metrics
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE metrics_2025 PARTITION OF metrics  
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Insights table (AI-generated recommendations)
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('brand', 'content', 'audience', 'growth', 'monetization')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Actionable recommendations
  recommendations JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'actioned', 'dismissed')),
  
  -- AI metadata
  ai_model TEXT,
  confidence_score DECIMAL(3,2),
  created_by TEXT DEFAULT 'ai',
  
  -- Mobile optimization
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table (gamified todo system)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('content', 'engagement', 'branding', 'business', 'learning', 'networking', 'general')),
  
  -- Task properties
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  estimated_time INTEGER, -- minutes
  impact_score INTEGER DEFAULT 5 CHECK (impact_score >= 1 AND impact_score <= 10),
  
  -- Scheduling
  due_date DATE,
  scheduled_for TIMESTAMPTZ,
  
  -- Completion tracking
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  
  -- Gamification
  points_reward INTEGER DEFAULT 10,
  streak_applicable BOOLEAN DEFAULT TRUE,
  
  -- AI generation
  ai_generated BOOLEAN DEFAULT FALSE,
  parent_insight_id UUID REFERENCES insights(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table (gamification system)
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('milestone', 'streak', 'level', 'badge', 'challenge')),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon identifier for mobile app
  
  -- Achievement properties
  points_awarded INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  
  -- Unlock conditions (for reusable achievements)
  unlock_condition JSONB,
  
  -- Tracking
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress JSONB DEFAULT '{}',
  
  -- Social sharing
  shared BOOLEAN DEFAULT FALSE,
  share_count INTEGER DEFAULT 0
);

-- Content table (artist uploads and tracking)
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  
  -- Content metadata
  title TEXT,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'audio', 'post', 'story')),
  platform TEXT CHECK (platform IN ('instagram', 'youtube', 'tiktok', 'spotify')),
  
  -- File storage
  file_url TEXT,
  file_size INTEGER,
  file_format TEXT,
  thumbnail_url TEXT,
  
  -- Performance metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Publishing
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  
  -- AI analysis
  ai_tags JSONB DEFAULT '[]',
  performance_prediction DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table (mobile push notifications)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('insight', 'achievement', 'task_reminder', 'milestone', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Mobile-specific
  push_sent BOOLEAN DEFAULT FALSE,
  push_sent_at TIMESTAMPTZ,
  push_token_used TEXT,
  
  -- Interaction tracking
  opened BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMPTZ,
  action_taken TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Related entities
  related_entity_type TEXT,
  related_entity_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security Policies
```sql
-- Enable RLS on all tables
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Artists table policies
CREATE POLICY "Artists can view own profile" ON artists
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Artists can update own profile" ON artists  
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can create artist profile" ON artists
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Platform connections policies (most sensitive data)
CREATE POLICY "Artists manage own connections" ON platform_connections
  FOR ALL USING (artist_id = auth.uid());

-- Metrics policies
CREATE POLICY "Artists see own metrics" ON metrics
  FOR SELECT USING (artist_id = auth.uid());

CREATE POLICY "System can insert metrics" ON metrics
  FOR INSERT WITH CHECK (true); -- Service key inserts

-- Insights policies  
CREATE POLICY "Artists manage own insights" ON insights
  FOR ALL USING (artist_id = auth.uid());

-- Tasks policies
CREATE POLICY "Artists manage own tasks" ON tasks
  FOR ALL USING (artist_id = auth.uid());

-- Achievements policies
CREATE POLICY "Artists see own achievements" ON achievements
  FOR SELECT USING (artist_id = auth.uid());

CREATE POLICY "System can award achievements" ON achievements
  FOR INSERT WITH CHECK (true);

-- Content policies
CREATE POLICY "Artists manage own content" ON content
  FOR ALL USING (artist_id = auth.uid());

-- Notifications policies
CREATE POLICY "Artists see own notifications" ON notifications
  FOR SELECT USING (artist_id = auth.uid());

CREATE POLICY "Artists can mark notifications read" ON notifications
  FOR UPDATE USING (artist_id = auth.uid());

-- Admin policies (for service account operations)
CREATE POLICY "Service account full access" ON artists
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Apply service account policy to all tables
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE '%_backup'
    LOOP
        EXECUTE format('CREATE POLICY "Service account access" ON %I FOR ALL USING (auth.jwt() ->> ''role'' = ''service_role'')', table_name);
    END LOOP;
END $$;
```

### Performance Optimization
```sql
-- Strategic indexes for mobile app queries

-- Artists table indexes
CREATE INDEX idx_artists_subscription_status ON artists(subscription_status) WHERE subscription_status = 'active';
CREATE INDEX idx_artists_last_active ON artists(last_active) WHERE last_active > NOW() - INTERVAL '30 days';
CREATE INDEX idx_artists_username ON artists(username) WHERE username IS NOT NULL;

-- Metrics table indexes (critical for dashboard performance)
CREATE INDEX idx_metrics_artist_date ON metrics(artist_id, metric_date DESC);
CREATE INDEX idx_metrics_platform_date ON metrics(platform, metric_date DESC);
CREATE INDEX idx_metrics_recent ON metrics(metric_date) WHERE metric_date >= CURRENT_DATE - INTERVAL '7 days';
CREATE INDEX idx_metrics_growth ON metrics(follower_growth_rate) WHERE follower_growth_rate != 0;

-- Insights table indexes
CREATE INDEX idx_insights_unread ON insights(artist_id, created_at DESC) WHERE status = 'unread';
CREATE INDEX idx_insights_priority ON insights(artist_id, priority, created_at DESC);

-- Tasks table indexes
CREATE INDEX idx_tasks_pending ON tasks(artist_id, due_date) WHERE completed = false;
CREATE INDEX idx_tasks_completed_recent ON tasks(artist_id, completed_at DESC) WHERE completed = true AND completed_at > NOW() - INTERVAL '7 days';

-- Notifications table indexes
CREATE INDEX idx_notifications_unread ON notifications(artist_id, scheduled_for DESC) WHERE opened = false;
CREATE INDEX idx_notifications_pending_push ON notifications(scheduled_for) WHERE push_sent = false AND scheduled_for <= NOW();

-- Composite indexes for common mobile app queries
CREATE INDEX idx_artist_dashboard ON metrics(artist_id, platform, metric_date DESC);
CREATE INDEX idx_recent_activity ON insights(artist_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '7 days';
```

### Real-time Subscriptions Setup
```typescript
// lib/supabase/realtime.ts
export class SupabaseRealtimeManager {
  private supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  setupArtistSubscriptions(artistId: string) {
    const channels: { [key: string]: any } = {};
    
    // Subscribe to new insights
    channels.insights = this.supabase
      .channel(`insights:${artistId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'insights',
        filter: `artist_id=eq.${artistId}`
      }, (payload) => {
        this.handleNewInsight(payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE', 
        schema: 'public',
        table: 'insights',
        filter: `artist_id=eq.${artistId}`
      }, (payload) => {
        this.handleInsightUpdate(payload.new);
      });
    
    // Subscribe to metrics updates
    channels.metrics = this.supabase
      .channel(`metrics:${artistId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public', 
        table: 'metrics',
        filter: `artist_id=eq.${artistId}`
      }, (payload) => {
        this.handleNewMetrics(payload.new);
      });
    
    // Subscribe to achievements
    channels.achievements = this.supabase
      .channel(`achievements:${artistId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'achievements', 
        filter: `artist_id=eq.${artistId}`
      }, (payload) => {
        this.handleNewAchievement(payload.new);
      });
    
    // Subscribe to task updates
    channels.tasks = this.supabase
      .channel(`tasks:${artistId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `artist_id=eq.${artistId}`
      }, (payload) => {
        this.handleTaskChange(payload);
      });
    
    // Subscribe all channels
    Object.values(channels).forEach(channel => channel.subscribe());
    
    return channels;
  }
  
  private handleNewInsight(insight: any) {
    // Trigger push notification
    this.sendPushNotification(insight.artist_id, {
      title: 'New AI Insight Available',
      body: insight.title,
      data: { type: 'insight', id: insight.id }
    });
    
    // Update mobile app state
    this.updateAppState('insights', insight);
  }
  
  private handleNewMetrics(metrics: any) {
    // Check for significant changes
    if (metrics.follower_growth_rate > 5) {
      this.sendPushNotification(metrics.artist_id, {
        title: 'Great Growth!',
        body: `You gained ${metrics.follower_growth} followers on ${metrics.platform}`,
        data: { type: 'metrics', platform: metrics.platform }
      });
    }
  }
  
  private handleNewAchievement(achievement: any) {
    // Always celebrate achievements
    this.sendPushNotification(achievement.artist_id, {
      title: '🎉 Achievement Unlocked!',
      body: achievement.name,
      data: { type: 'achievement', id: achievement.id }
    });
    
    // Trigger confetti animation in app
    this.updateAppState('celebration', achievement);
  }
}
```

### Database Functions for Mobile Performance
```sql
-- Function: Get dashboard summary (single query for mobile)
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_artist_id UUID)
RETURNS JSON AS $$
DECLARE
  summary JSON;
BEGIN
  SELECT json_build_object(
    'metrics', (
      SELECT json_agg(
        json_build_object(
          'platform', platform,
          'followers', followers,
          'growth_rate', follower_growth_rate,
          'last_updated', metric_date
        )
      )
      FROM metrics 
      WHERE artist_id = p_artist_id 
        AND metric_date >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'recent_insights', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'type', type,
          'title', title,
          'priority', priority,
          'created_at', created_at
        )
      )
      FROM insights 
      WHERE artist_id = p_artist_id 
        AND status = 'unread'
      ORDER BY created_at DESC 
      LIMIT 5
    ),
    'pending_tasks', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'title', title,
          'due_date', due_date,
          'impact_score', impact_score
        )
      )
      FROM tasks 
      WHERE artist_id = p_artist_id 
        AND completed = false
        AND (due_date IS NULL OR due_date >= CURRENT_DATE)
      ORDER BY impact_score DESC, due_date ASC 
      LIMIT 10
    ),
    'recent_achievements', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'name', name,
          'type', type,
          'points_awarded', points_awarded,
          'unlocked_at', unlocked_at
        )
      )
      FROM achievements 
      WHERE artist_id = p_artist_id 
        AND unlocked_at >= NOW() - INTERVAL '30 days'
      ORDER BY unlocked_at DESC 
      LIMIT 5
    ),
    'total_points', (
      SELECT COALESCE(SUM(points_awarded), 0)
      FROM achievements 
      WHERE artist_id = p_artist_id
    ),
    'streak_count', (
      SELECT COUNT(*)
      FROM tasks 
      WHERE artist_id = p_artist_id 
        AND completed = true
        AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
    )
  ) INTO summary;
  
  RETURN summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update artist activity (for engagement tracking)
CREATE OR REPLACE FUNCTION update_artist_activity(p_artist_id UUID, p_activity_type TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE artists 
  SET 
    last_active = NOW(),
    updated_at = NOW()
  WHERE id = p_artist_id;
  
  -- Log activity for analytics
  INSERT INTO artist_activity_log (artist_id, activity_type, timestamp)
  VALUES (p_artist_id, p_activity_type, NOW())
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate growth streaks
CREATE OR REPLACE FUNCTION calculate_growth_streak(p_artist_id UUID, p_platform TEXT)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  daily_record RECORD;
BEGIN
  -- Count consecutive days of positive growth
  FOR daily_record IN
    SELECT metric_date, follower_growth_rate
    FROM metrics 
    WHERE artist_id = p_artist_id 
      AND platform = p_platform
      AND metric_date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY metric_date DESC
  LOOP
    IF daily_record.follower_growth_rate > 0 THEN
      streak_count := streak_count + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql;
```

### Storage and Media Management
```typescript
// lib/supabase/storage.ts
export class SupabaseStorageManager {
  private supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Use service key for admin operations
  );
  
  async setupStorageBuckets() {
    // Create buckets with proper policies
    const buckets = [
      {
        name: 'avatars',
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      },
      {
        name: 'content-uploads',
        public: false, // Artist's private uploads
        fileSizeLimit: 100 * 1024 * 1024, // 100MB
        allowedMimeTypes: ['image/*', 'video/*', 'audio/*']
      },
      {
        name: 'thumbnails',
        public: true,
        fileSizeLimit: 1 * 1024 * 1024, // 1MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    ];
    
    for (const bucket of buckets) {
      await this.supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      });
    }
  }
  
  async uploadArtistContent(
    artistId: string,
    file: File,
    contentType: 'avatar' | 'content' | 'thumbnail'
  ): Promise<string> {
    const bucket = this.getBucketForContentType(contentType);
    const filename = this.generateFilename(artistId, file.name, contentType);
    
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: contentType === 'avatar' // Allow avatar updates
      });
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filename);
    
    return publicUrl;
  }
  
  private getBucketForContentType(contentType: string): string {
    const bucketMap = {
      'avatar': 'avatars',
      'content': 'content-uploads', 
      'thumbnail': 'thumbnails'
    };
    
    return bucketMap[contentType] || 'content-uploads';
  }
  
  private generateFilename(artistId: string, originalName: string, contentType: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    
    return `${artistId}/${contentType}/${timestamp}.${extension}`;
  }
}
```

## Success Metrics

### Database Performance KPIs
- **Query Response Time**: <200ms for 95% of mobile app queries
- **Real-time Latency**: <500ms for subscription updates
- **Database Availability**: 99.95% uptime
- **Storage Efficiency**: <$50/month for 1000+ artists
- **Connection Pool Utilization**: <80% during peak hours

### Mobile Optimization KPIs  
- **Offline Capability**: 95% of core features work offline
- **Sync Reliability**: 99% of offline changes successfully sync
- **Data Usage**: <10MB per month per active user
- **Battery Impact**: <2% battery drain per hour of use

### Implementation Checklist
- [ ] Design and create complete PostgreSQL schema
- [ ] Implement Row Level Security policies for all tables
- [ ] Set up performance indexes for mobile queries
- [ ] Configure real-time subscriptions for live updates
- [ ] Create database functions for complex mobile queries
- [ ] Set up file storage buckets with proper policies
- [ ] Implement backup and disaster recovery procedures
- [ ] Create database monitoring and alerting system
- [ ] Test RLS policies with multiple user scenarios
- [ ] Optimize queries for mobile network conditions