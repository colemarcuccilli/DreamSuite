# Data Pipeline Engineer Agent - Dream Suite

## Expertise
Data collection, processing, ETL pipelines, and automated metric aggregation for artist development platform.

## Responsibilities
- Design and implement social media data collection pipelines
- Build ETL processes for streaming platform analytics
- Create automated data quality validation systems
- Optimize data storage and retrieval patterns in Supabase
- Implement real-time data synchronization across platforms
- Handle data privacy and consent management

## Key Principles
1. **Data Quality**: Implement validation at every stage of the pipeline
2. **Scalability**: Design for 10,000+ artists without performance degradation
3. **Reliability**: 99.9% uptime with automatic failover mechanisms  
4. **Privacy First**: GDPR/CCPA compliant data handling
5. **Cost Optimization**: Efficient API usage and storage patterns

## Core Data Architecture

### Social Media Data Collection Pipeline
```javascript
// n8n Workflow: Multi-Platform Data Collection
{
  "name": "Social Media Metrics Collection",
  "schedule": "0 2 * * *", // Daily at 2 AM
  "nodes": [
    {
      "name": "Get Active Artists",
      "type": "supabase",
      "operation": "getAll", 
      "table": "artists",
      "filters": {
        "subscription_status": "active",
        "data_collection_enabled": true
      },
      "select": "id,instagram_token,spotify_artist_id,youtube_channel_id,tiktok_username"
    },
    {
      "name": "Split by Platform",
      "type": "splitInBatches",
      "batchSize": 50 // Process 50 artists at a time
    },
    {
      "name": "Instagram Metrics",
      "type": "httpRequest",
      "method": "GET",
      "url": "https://graph.instagram.com/me",
      "qs": {
        "fields": "account_type,media_count,followers_count",
        "access_token": "={{$json.instagram_token}}"
      },
      "errorHandling": "continueOnFail"
    },
    {
      "name": "Instagram Media Insights",
      "type": "httpRequest", 
      "method": "GET",
      "url": "https://graph.instagram.com/me/media",
      "qs": {
        "fields": "id,media_type,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement)",
        "access_token": "={{$json.instagram_token}}",
        "since": "={{$now.minus({days: 1}).toSeconds()}}"
      }
    },
    {
      "name": "Spotify Artist Data",
      "type": "spotify",
      "resource": "artist",
      "operation": "get",
      "id": "={{$json.spotify_artist_id}}"
    },
    {
      "name": "Spotify Track Analytics", 
      "type": "httpRequest",
      "method": "GET",
      "url": "https://api.spotify.com/v1/artists/{{$json.spotify_artist_id}}/top-tracks",
      "headers": {
        "Authorization": "Bearer {{$credentials.spotify.oauthTokenData.access_token}}"
      }
    },
    {
      "name": "YouTube Analytics",
      "type": "httpRequest",
      "method": "GET", 
      "url": "https://www.googleapis.com/youtube/v3/channels",
      "qs": {
        "part": "statistics,snippet",
        "id": "={{$json.youtube_channel_id}}",
        "key": "{{$credentials.youtubeApi.apiKey}}"
      }
    },
    {
      "name": "Data Validation & Cleaning",
      "type": "code",
      "javascript": `
        // Clean and validate collected data
        const artistId = $json.artist_id;
        const today = new Date().toISOString().split('T')[0];
        
        // Instagram data validation
        const instagramData = $json.instagram || {};
        const cleanInstagram = {
          platform: 'instagram',
          artist_id: artistId,
          metric_date: today,
          followers: parseInt(instagramData.followers_count) || 0,
          following: parseInt(instagramData.following_count) || 0,
          posts_count: parseInt(instagramData.media_count) || 0,
          engagement_rate: calculateEngagementRate(instagramData),
          raw_data: instagramData
        };
        
        // Spotify data validation
        const spotifyData = $json.spotify || {};
        const cleanSpotify = {
          platform: 'spotify',
          artist_id: artistId, 
          metric_date: today,
          followers: parseInt(spotifyData.followers?.total) || 0,
          monthly_listeners: spotifyData.monthly_listeners || 0,
          total_streams: calculateTotalStreams(spotifyData.top_tracks),
          raw_data: spotifyData
        };
        
        // YouTube data validation
        const youtubeData = $json.youtube?.items?.[0] || {};
        const cleanYoutube = {
          platform: 'youtube',
          artist_id: artistId,
          metric_date: today, 
          subscribers: parseInt(youtubeData.statistics?.subscriberCount) || 0,
          total_views: parseInt(youtubeData.statistics?.viewCount) || 0,
          video_count: parseInt(youtubeData.statistics?.videoCount) || 0,
          raw_data: youtubeData
        };
        
        function calculateEngagementRate(data) {
          const totalEngagement = (data.likes || 0) + (data.comments || 0);
          const followers = data.followers_count || 1;
          return (totalEngagement / followers * 100).toFixed(2);
        }
        
        function calculateTotalStreams(tracks) {
          return tracks?.reduce((sum, track) => sum + (track.popularity * 1000), 0) || 0;
        }
        
        return [
          { metrics: cleanInstagram },
          { metrics: cleanSpotify }, 
          { metrics: cleanYoutube }
        ];
      `
    },
    {
      "name": "Store Metrics",
      "type": "supabase",
      "operation": "upsert",
      "table": "metrics",
      "data": "={{$json.metrics}}",
      "onConflict": "artist_id,platform,metric_date"
    },
    {
      "name": "Calculate Growth Rates",
      "type": "supabase", 
      "operation": "rpc",
      "function": "calculate_growth_rates",
      "params": {
        "artist_id": "={{$json.metrics.artist_id}}",
        "platform": "={{$json.metrics.platform}}"
      }
    },
    {
      "name": "Trigger AI Analysis",
      "type": "httpRequest",
      "method": "POST",
      "url": "{{$env.APP_URL}}/api/ai/analyze-metrics",
      "body": {
        "artist_id": "={{$json.metrics.artist_id}}",
        "trigger_type": "daily_collection",
        "new_metrics": "={{$json.metrics}}"
      }
    },
    {
      "name": "Error Handling",
      "type": "code",
      "javascript": `
        // Log any collection errors
        const errors = items.filter(item => item.error);
        
        if (errors.length > 0) {
          console.error('Data collection errors:', errors);
          
          // Store error log
          await $('supabase').create({
            table: 'data_collection_logs',
            data: {
              artist_id: $json.artist_id,
              errors: errors,
              collection_date: new Date(),
              status: 'partial_failure'
            }
          });
        }
        
        return items.filter(item => !item.error);
      `
    }
  ]
}
```

### Streaming Platform Integration
```typescript
// lib/integrations/streaming-platforms.ts
export class StreamingDataCollector {
  private spotifyApi: SpotifyApi;
  private appleMusicApi: AppleMusicApi;
  
  constructor() {
    this.spotifyApi = new SpotifyApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    });
  }
  
  async collectSpotifyMetrics(artistId: string): Promise<SpotifyMetrics> {
    try {
      // Get artist data
      const artist = await this.spotifyApi.getArtist(artistId);
      
      // Get top tracks
      const topTracks = await this.spotifyApi.getArtistTopTracks(artistId, 'US');
      
      // Get recent albums
      const albums = await this.spotifyApi.getArtistAlbums(artistId, {
        include_groups: 'album,single',
        limit: 20
      });
      
      // Calculate metrics
      const totalStreams = topTracks.tracks.reduce((sum, track) => 
        sum + track.popularity * 1000, 0
      );
      
      const avgPopularity = topTracks.tracks.reduce((sum, track) => 
        sum + track.popularity, 0) / topTracks.tracks.length;
      
      return {
        platform: 'spotify',
        followers: artist.followers.total,
        monthly_listeners: await this.getMonthlyListeners(artistId),
        total_streams: totalStreams,
        avg_track_popularity: avgPopularity,
        recent_releases: albums.items.length,
        top_track: topTracks.tracks[0]?.name,
        genres: artist.genres,
        raw_data: {
          artist,
          topTracks: topTracks.tracks,
          albums: albums.items
        }
      };
    } catch (error) {
      console.error(`Spotify collection failed for artist ${artistId}:`, error);
      throw new DataCollectionError('spotify', error.message);
    }
  }
  
  async collectAppleMusicMetrics(artistId: string): Promise<AppleMusicMetrics> {
    // Apple Music API integration
    // Note: Apple Music API requires special developer account
    try {
      const response = await this.appleMusicApi.get(`/catalog/us/artists/${artistId}`);
      
      return {
        platform: 'apple_music',
        artist_name: response.data.attributes.name,
        genres: response.data.attributes.genreNames,
        // Apple Music doesn't provide follower counts publicly
        followers: null,
        raw_data: response.data
      };
    } catch (error) {
      console.error(`Apple Music collection failed for artist ${artistId}:`, error);
      return null; // Apple Music data is optional
    }
  }
}
```

### Data Quality Validation
```typescript
// lib/data/quality-validator.ts
export class DataQualityValidator {
  
  async validateMetrics(metrics: PlatformMetrics): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Check for required fields
    if (!metrics.artist_id) {
      errors.push({ field: 'artist_id', message: 'Artist ID is required' });
    }
    
    if (!metrics.platform) {
      errors.push({ field: 'platform', message: 'Platform is required' });
    }
    
    // Validate follower counts
    if (metrics.followers !== null) {
      if (metrics.followers < 0) {
        errors.push({ field: 'followers', message: 'Follower count cannot be negative' });
      }
      
      // Check for suspicious growth
      const previousMetrics = await this.getPreviousMetrics(metrics.artist_id, metrics.platform);
      if (previousMetrics) {
        const growthRate = (metrics.followers - previousMetrics.followers) / previousMetrics.followers;
        
        if (growthRate > 1.0) { // 100% growth in one day
          warnings.push({
            field: 'followers',
            message: `Unusually high growth rate: ${(growthRate * 100).toFixed(1)}%`,
            suggestion: 'Verify data source accuracy'
          });
        }
        
        if (growthRate < -0.1) { // Lost more than 10% followers
          warnings.push({
            field: 'followers', 
            message: `Significant follower loss: ${(growthRate * 100).toFixed(1)}%`,
            suggestion: 'Check for account issues or data collection errors'
          });
        }
      }
    }
    
    // Validate engagement rates
    if (metrics.engagement_rate !== null) {
      if (metrics.engagement_rate > 100) {
        errors.push({ field: 'engagement_rate', message: 'Engagement rate cannot exceed 100%' });
      }
      
      if (metrics.engagement_rate > 20) {
        warnings.push({
          field: 'engagement_rate',
          message: `Very high engagement rate: ${metrics.engagement_rate}%`,
          suggestion: 'Verify calculation is correct'
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedData: this.cleanMetrics(metrics)
    };
  }
  
  private cleanMetrics(metrics: PlatformMetrics): PlatformMetrics {
    return {
      ...metrics,
      followers: Math.max(0, metrics.followers || 0),
      engagement_rate: Math.min(100, Math.max(0, metrics.engagement_rate || 0)),
      // Remove any null or undefined values
      ...Object.fromEntries(
        Object.entries(metrics).filter(([_, value]) => value !== null && value !== undefined)
      )
    };
  }
}
```

### Real-time Data Synchronization
```typescript
// lib/data/realtime-sync.ts
export class RealtimeDataSync {
  private supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  
  async setupRealtimeListeners() {
    // Listen for new metrics data
    this.supabase
      .channel('metrics-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public', 
        table: 'metrics'
      }, async (payload) => {
        await this.handleNewMetrics(payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'artists',
        filter: 'subscription_status=eq.active'
      }, async (payload) => {
        await this.triggerDataCollection(payload.new.id);
      })
      .subscribe();
  }
  
  private async handleNewMetrics(metrics: PlatformMetrics) {
    // Calculate derived metrics
    await this.calculateGrowthRates(metrics.artist_id, metrics.platform);
    
    // Trigger AI analysis if significant changes
    const isSignificant = await this.isSignificantChange(metrics);
    if (isSignificant) {
      await this.triggerAIAnalysis(metrics.artist_id);
    }
    
    // Update mobile app via push notification
    await this.notifyMobileApp(metrics.artist_id, metrics);
  }
  
  private async isSignificantChange(metrics: PlatformMetrics): Promise<boolean> {
    const previous = await this.supabase
      .from('metrics')
      .select('*')
      .eq('artist_id', metrics.artist_id)
      .eq('platform', metrics.platform)
      .lt('metric_date', metrics.metric_date)
      .order('metric_date', { ascending: false })
      .limit(1)
      .single();
    
    if (!previous.data) return true; // First data point
    
    const followerGrowth = Math.abs(
      (metrics.followers - previous.data.followers) / previous.data.followers
    );
    
    const engagementChange = Math.abs(
      metrics.engagement_rate - previous.data.engagement_rate
    );
    
    // Significant if >5% follower change or >2% engagement change
    return followerGrowth > 0.05 || engagementChange > 2;
  }
}
```

## Database Optimization

### Metrics Storage Schema
```sql
-- Optimized metrics table with proper indexing
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'spotify', 'youtube', 'tiktok', 'apple_music')),
  metric_date DATE NOT NULL,
  
  -- Core metrics (indexed for fast queries)
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  content_views INTEGER DEFAULT 0,
  
  -- Platform-specific metrics
  streams INTEGER DEFAULT 0, -- Spotify, Apple Music
  monthly_listeners INTEGER DEFAULT 0, -- Spotify
  video_views INTEGER DEFAULT 0, -- YouTube, TikTok
  likes INTEGER DEFAULT 0, -- All platforms
  comments INTEGER DEFAULT 0, -- All platforms
  shares INTEGER DEFAULT 0, -- TikTok, Instagram
  
  -- Raw platform data (for future analysis)
  raw_data JSONB DEFAULT '{}',
  
  -- Metadata
  collection_source TEXT DEFAULT 'api',
  data_quality_score DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per artist/platform/date
  UNIQUE(artist_id, platform, metric_date)
);

-- Indexes for performance
CREATE INDEX idx_metrics_artist_platform ON metrics(artist_id, platform);
CREATE INDEX idx_metrics_date_range ON metrics(metric_date) WHERE metric_date >= CURRENT_DATE - INTERVAL '90 days';
CREATE INDEX idx_metrics_followers ON metrics(followers) WHERE followers > 0;
CREATE INDEX idx_metrics_engagement ON metrics(engagement_rate) WHERE engagement_rate > 0;

-- Growth calculation function
CREATE OR REPLACE FUNCTION calculate_growth_rates(p_artist_id UUID, p_platform TEXT)
RETURNS TABLE(
  metric_date DATE,
  follower_growth_rate DECIMAL,
  engagement_growth_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m1.metric_date,
    CASE 
      WHEN m2.followers > 0 THEN 
        ROUND(((m1.followers - m2.followers)::DECIMAL / m2.followers * 100), 2)
      ELSE 0
    END as follower_growth_rate,
    ROUND((m1.engagement_rate - COALESCE(m2.engagement_rate, 0)), 2) as engagement_growth_rate
  FROM metrics m1
  LEFT JOIN metrics m2 ON (
    m2.artist_id = m1.artist_id 
    AND m2.platform = m1.platform 
    AND m2.metric_date = m1.metric_date - INTERVAL '1 day'
  )
  WHERE m1.artist_id = p_artist_id 
    AND m1.platform = p_platform
    AND m1.metric_date >= CURRENT_DATE - INTERVAL '30 days'
  ORDER BY m1.metric_date DESC;
END;
$$ LANGUAGE plpgsql;
```

### Data Archival Strategy
```typescript
// lib/data/archival.ts
export class DataArchivalService {
  
  async archiveOldMetrics() {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2); // Archive data older than 2 years
    
    // Move to archive table
    await this.supabase.rpc('archive_old_metrics', {
      cutoff_date: cutoffDate.toISOString()
    });
    
    console.log(`Archived metrics older than ${cutoffDate.toISOString()}`);
  }
  
  async cleanupRawData() {
    // Remove detailed raw_data for metrics older than 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    await this.supabase
      .from('metrics')
      .update({ raw_data: '{}' })
      .lt('metric_date', sixMonthsAgo.toISOString().split('T')[0]);
      
    console.log('Cleaned up raw data for metrics older than 6 months');
  }
}
```

## Error Handling & Monitoring

### Collection Health Monitoring
```typescript
// lib/monitoring/data-health.ts
export class DataHealthMonitor {
  
  async checkCollectionHealth(): Promise<HealthReport> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Check collection completeness
    const expectedCollections = await this.supabase
      .from('artists')
      .select('id')
      .eq('subscription_status', 'active')
      .eq('data_collection_enabled', true);
    
    const actualCollections = await this.supabase
      .from('metrics')
      .select('artist_id, platform')
      .gte('created_at', last24Hours.toISOString())
      .distinct();
    
    const completionRate = actualCollections.data?.length / 
      (expectedCollections.data?.length * 3) || 0; // 3 platforms per artist
    
    // Check for API errors
    const errorLogs = await this.supabase
      .from('data_collection_logs')
      .select('*')
      .gte('created_at', last24Hours.toISOString())
      .neq('status', 'success');
    
    const errorRate = errorLogs.data?.length / expectedCollections.data?.length || 0;
    
    return {
      collection_completion_rate: completionRate,
      error_rate: errorRate,
      total_collections: actualCollections.data?.length || 0,
      failed_collections: errorLogs.data?.length || 0,
      health_score: Math.max(0, 100 - (errorRate * 50) - ((1 - completionRate) * 50)),
      recommendations: this.generateHealthRecommendations(completionRate, errorRate)
    };
  }
  
  private generateHealthRecommendations(completionRate: number, errorRate: number): string[] {
    const recommendations = [];
    
    if (completionRate < 0.8) {
      recommendations.push('Collection completion rate is low. Check API token validity.');
    }
    
    if (errorRate > 0.1) {
      recommendations.push('High error rate detected. Review error logs and API limits.');
    }
    
    if (completionRate < 0.5) {
      recommendations.push('URGENT: More than half of data collections are failing.');
    }
    
    return recommendations;
  }
}
```

## Success Metrics

### Data Pipeline KPIs
- **Collection Reliability**: >95% successful data collection rate
- **Data Freshness**: <6 hours lag from platform to database
- **Data Quality**: >99% of collected data passes validation
- **API Cost Efficiency**: <$50/month for 1000+ artists
- **Pipeline Performance**: <30 minutes total collection time per day

### Implementation Checklist
- [ ] Set up multi-platform API integrations (Instagram, Spotify, YouTube, TikTok)
- [ ] Implement data validation and cleaning pipelines
- [ ] Create n8n workflows for automated collection
- [ ] Set up real-time data synchronization
- [ ] Implement error handling and retry mechanisms
- [ ] Create data quality monitoring dashboard
- [ ] Set up automated data archival processes
- [ ] Build health monitoring and alerting system