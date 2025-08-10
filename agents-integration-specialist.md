# Integration Specialist Agent - Dream Suite

## Expertise
Third-party API integration, social media platform connections, streaming service APIs, and seamless data synchronization for artist development platform.

## Responsibilities
- Design and implement social media API integrations (Instagram, TikTok, YouTube, Twitter)
- Connect streaming platform APIs (Spotify, Apple Music, SoundCloud)
- Handle OAuth flows and token management across platforms
- Implement webhook systems for real-time data updates
- Design fallback mechanisms for API failures
- Optimize API usage to minimize costs and rate limits
- Create unified data models from diverse API responses

## Key Principles
1. **Reliability First**: Handle API failures gracefully with fallbacks
2. **Rate Limit Optimization**: Maximize data collection within API constraints
3. **Data Consistency**: Normalize diverse API responses into unified format
4. **Security**: Secure storage and handling of API credentials
5. **Scalability**: Design for thousands of connected accounts

## Social Media Integrations

### Instagram Business API Integration
```typescript
// lib/integrations/instagram.ts
export class InstagramIntegration {
  private baseURL = 'https://graph.instagram.com';
  private version = 'v18.0';
  
  async connectAccount(accessToken: string, artistId: string): Promise<ConnectionResult> {
    try {
      // Verify token and get user info
      const userInfo = await this.getUserInfo(accessToken);
      
      // Check if it's a business/creator account
      if (!['BUSINESS', 'CREATOR'].includes(userInfo.account_type)) {
        throw new IntegrationError(
          'Instagram Business or Creator account required',
          'ACCOUNT_TYPE_INVALID'
        );
      }
      
      // Store encrypted token
      const encryptedToken = await this.encryptToken(accessToken);
      
      await supabase
        .from('platform_connections')
        .upsert({
          artist_id: artistId,
          platform: 'instagram',
          access_token_encrypted: encryptedToken,
          platform_user_id: userInfo.id,
          platform_username: userInfo.username,
          permissions: userInfo.permissions,
          connected_at: new Date().toISOString(),
          sync_status: 'active'
        });
      
      return {
        success: true,
        platform_username: userInfo.username,
        account_type: userInfo.account_type,
        permissions: userInfo.permissions
      };
      
    } catch (error) {
      console.error('Instagram connection failed:', error);
      throw new IntegrationError(`Instagram connection failed: ${error.message}`);
    }
  }
  
  async fetchAccountMetrics(artistId: string): Promise<InstagramMetrics> {
    const connection = await this.getConnection(artistId, 'instagram');
    if (!connection) {
      throw new IntegrationError('Instagram not connected');
    }
    
    const accessToken = await this.decryptToken(connection.access_token_encrypted);
    
    try {
      // Get basic insights
      const insights = await this.makeAPICall(`/${connection.platform_user_id}/insights`, {
        metric: 'follower_count,impressions,reach,profile_views',
        period: 'day',
        since: this.getDateDaysAgo(7),
        until: this.getDateDaysAgo(1)
      }, accessToken);
      
      // Get media insights for engagement calculation
      const media = await this.getRecentMedia(connection.platform_user_id, accessToken);
      const mediaInsights = await this.getMediaInsights(media, accessToken);
      
      // Calculate engagement rate
      const totalEngagement = mediaInsights.reduce((sum, media) => 
        sum + (media.like_count || 0) + (media.comments_count || 0), 0
      );
      
      const followerCount = insights.data.find(d => d.name === 'follower_count')?.values[0]?.value || 0;
      const engagementRate = followerCount > 0 
        ? (totalEngagement / mediaInsights.length / followerCount * 100) 
        : 0;
      
      return {
        platform: 'instagram',
        followers: followerCount,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        impressions: insights.data.find(d => d.name === 'impressions')?.values[0]?.value || 0,
        reach: insights.data.find(d => d.name === 'reach')?.values[0]?.value || 0,
        profile_views: insights.data.find(d => d.name === 'profile_views')?.values[0]?.value || 0,
        recent_posts: mediaInsights.length,
        avg_likes: Math.round(mediaInsights.reduce((sum, m) => sum + (m.like_count || 0), 0) / mediaInsights.length),
        avg_comments: Math.round(mediaInsights.reduce((sum, m) => sum + (m.comments_count || 0), 0) / mediaInsights.length),
        last_updated: new Date().toISOString()
      };
      
    } catch (error) {
      await this.handleAPIError(error, artistId, 'instagram');
      throw error;
    }
  }
  
  private async getRecentMedia(userId: string, accessToken: string): Promise<any[]> {
    const response = await this.makeAPICall(`/${userId}/media`, {
      fields: 'id,media_type,timestamp,like_count,comments_count,insights',
      limit: 10
    }, accessToken);
    
    return response.data || [];
  }
  
  private async getMediaInsights(media: any[], accessToken: string): Promise<any[]> {
    const insights = [];
    
    for (const item of media) {
      if (item.media_type !== 'VIDEO') { // Video insights require different metrics
        try {
          const mediaInsights = await this.makeAPICall(`/${item.id}/insights`, {
            metric: 'impressions,reach,engagement'
          }, accessToken);
          
          insights.push({
            ...item,
            insights: mediaInsights.data
          });
        } catch (error) {
          console.warn(`Failed to get insights for media ${item.id}:`, error);
          insights.push(item); // Include without insights
        }
      }
    }
    
    return insights;
  }
  
  async handleWebhook(payload: any): Promise<void> {
    // Instagram webhook for real-time updates
    if (payload.object === 'instagram') {
      for (const entry of payload.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            await this.processInstagramChange(entry.id, change);
          }
        }
      }
    }
  }
  
  private async processInstagramChange(userId: string, change: any): Promise<void> {
    const connection = await this.getConnectionByPlatformUserId(userId, 'instagram');
    if (!connection) return;
    
    switch (change.field) {
      case 'media':
        // New post published
        await this.triggerMetricsUpdate(connection.artist_id, 'instagram');
        break;
        
      case 'mentions':
        // Artist was mentioned
        await this.handleMention(connection.artist_id, change.value);
        break;
        
      default:
        console.log(`Unhandled Instagram webhook field: ${change.field}`);
    }
  }
}
```

### Spotify Integration
```typescript
// lib/integrations/spotify.ts
export class SpotifyIntegration {
  private baseURL = 'https://api.spotify.com/v1';
  private authURL = 'https://accounts.spotify.com';
  
  async connectAccount(authCode: string, artistId: string): Promise<ConnectionResult> {
    try {
      // Exchange auth code for tokens
      const tokenResponse = await fetch(`${this.authURL}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: `${process.env.APP_URL}/auth/spotify/callback`
        })
      });
      
      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new Error('Failed to get access token');
      }
      
      // Get user profile
      const profile = await this.makeAPICall('/me', {}, tokens.access_token);
      
      // Check if user is an artist (has artist profile)
      const artistProfile = await this.findArtistProfile(profile.id, tokens.access_token);
      
      // Store encrypted tokens
      const encryptedAccessToken = await this.encryptToken(tokens.access_token);
      const encryptedRefreshToken = await this.encryptToken(tokens.refresh_token);
      
      await supabase
        .from('platform_connections')
        .upsert({
          artist_id: artistId,
          platform: 'spotify',
          access_token_encrypted: encryptedAccessToken,
          refresh_token_encrypted: encryptedRefreshToken,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          platform_user_id: profile.id,
          platform_username: profile.display_name,
          permissions: tokens.scope?.split(' ') || [],
          connected_at: new Date().toISOString(),
          sync_status: 'active'
        });
      
      return {
        success: true,
        platform_username: profile.display_name,
        has_artist_profile: !!artistProfile,
        artist_id: artistProfile?.id
      };
      
    } catch (error) {
      console.error('Spotify connection failed:', error);
      throw new IntegrationError(`Spotify connection failed: ${error.message}`);
    }
  }
  
  async fetchArtistMetrics(artistId: string): Promise<SpotifyMetrics> {
    const connection = await this.getConnection(artistId, 'spotify');
    if (!connection) {
      throw new IntegrationError('Spotify not connected');
    }
    
    const accessToken = await this.getValidAccessToken(connection);
    
    try {
      // Find artist profile
      const artistProfile = await this.findArtistProfile(
        connection.platform_user_id, 
        accessToken
      );
      
      if (!artistProfile) {
        throw new IntegrationError('No artist profile found');
      }
      
      // Get artist data
      const artist = await this.makeAPICall(`/artists/${artistProfile.id}`, {}, accessToken);
      
      // Get top tracks
      const topTracks = await this.makeAPICall(
        `/artists/${artistProfile.id}/top-tracks`,
        { market: 'US' },
        accessToken
      );
      
      // Get albums for recent activity
      const albums = await this.makeAPICall(
        `/artists/${artistProfile.id}/albums`,
        { include_groups: 'album,single', limit: 20, market: 'US' },
        accessToken
      );
      
      // Calculate metrics
      const totalStreams = topTracks.tracks.reduce((sum: number, track: any) => 
        sum + (track.popularity * 1000), 0 // Popularity is 0-100, estimate streams
      );
      
      const avgPopularity = topTracks.tracks.reduce((sum: number, track: any) => 
        sum + track.popularity, 0) / topTracks.tracks.length;
      
      // Get monthly listeners (requires Spotify for Artists API - approximation)
      const monthlyListeners = Math.round(artist.followers.total * 0.3); // Rough estimate
      
      return {
        platform: 'spotify',
        followers: artist.followers.total,
        monthly_listeners: monthlyListeners,
        total_streams: totalStreams,
        avg_track_popularity: Math.round(avgPopularity),
        top_track: topTracks.tracks[0]?.name,
        recent_releases: albums.items.filter(album => 
          new Date(album.release_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        ).length,
        genres: artist.genres,
        last_updated: new Date().toISOString()
      };
      
    } catch (error) {
      await this.handleAPIError(error, artistId, 'spotify');
      throw error;
    }
  }
  
  private async findArtistProfile(userId: string, accessToken: string): Promise<any> {
    try {
      // Search for artist by the user's display name
      const profile = await this.makeAPICall('/me', {}, accessToken);
      
      if (profile.display_name) {
        const searchResults = await this.makeAPICall('/search', {
          q: profile.display_name,
          type: 'artist',
          limit: 10
        }, accessToken);
        
        // Try to match by name (fuzzy matching)
        const possibleMatches = searchResults.artists.items.filter((artist: any) =>
          artist.name.toLowerCase().includes(profile.display_name.toLowerCase()) ||
          profile.display_name.toLowerCase().includes(artist.name.toLowerCase())
        );
        
        return possibleMatches[0] || null;
      }
      
      return null;
    } catch (error) {
      console.warn('Could not find artist profile:', error);
      return null;
    }
  }
  
  async refreshAccessToken(connection: any): Promise<string> {
    try {
      const refreshToken = await this.decryptToken(connection.refresh_token_encrypted);
      
      const response = await fetch(`${this.authURL}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });
      
      const tokens = await response.json();
      
      if (!tokens.access_token) {
        throw new Error('Failed to refresh token');
      }
      
      // Update stored tokens
      const encryptedAccessToken = await this.encryptToken(tokens.access_token);
      const encryptedRefreshToken = tokens.refresh_token 
        ? await this.encryptToken(tokens.refresh_token)
        : connection.refresh_token_encrypted; // Keep existing if not provided
      
      await supabase
        .from('platform_connections')
        .update({
          access_token_encrypted: encryptedAccessToken,
          refresh_token_encrypted: encryptedRefreshToken,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          sync_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', connection.id);
      
      return tokens.access_token;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Mark connection as expired
      await supabase
        .from('platform_connections')
        .update({
          sync_status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', connection.id);
      
      throw new IntegrationError('Token refresh failed - reconnection required');
    }
  }
}
```

### Universal Integration Manager
```typescript
// lib/integrations/integration-manager.ts
export class IntegrationManager {
  private integrations = {
    instagram: new InstagramIntegration(),
    spotify: new SpotifyIntegration(),
    youtube: new YouTubeIntegration(),
    tiktok: new TikTokIntegration()
  };
  
  async syncAllPlatforms(artistId: string): Promise<SyncResult[]> {
    const connections = await this.getActiveConnections(artistId);
    const results: SyncResult[] = [];
    
    // Process platforms in parallel with rate limiting
    const batchSize = 2; // Process 2 platforms at once to avoid hitting rate limits
    
    for (let i = 0; i < connections.length; i += batchSize) {
      const batch = connections.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (connection) => {
        try {
          const integration = this.integrations[connection.platform as keyof typeof this.integrations];
          if (!integration) {
            throw new Error(`No integration available for ${connection.platform}`);
          }
          
          const metrics = await integration.fetchAccountMetrics(artistId);
          
          // Store metrics
          await supabase
            .from('metrics')
            .upsert({
              artist_id: artistId,
              platform: connection.platform,
              metric_date: new Date().toISOString().split('T')[0],
              ...this.normalizeMetrics(metrics)
            });
          
          return {
            platform: connection.platform,
            success: true,
            metrics_updated: true,
            last_sync: new Date().toISOString()
          };
          
        } catch (error) {
          console.error(`Sync failed for ${connection.platform}:`, error);
          
          return {
            platform: connection.platform,
            success: false,
            error: error.message,
            requires_reconnection: error.code === 'TOKEN_EXPIRED'
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Wait between batches to respect rate limits
      if (i + batchSize < connections.length) {
        await this.delay(2000); // 2 second delay between batches
      }
    }
    
    // Update sync status
    await this.updateSyncStatus(artistId, results);
    
    return results;
  }
  
  private normalizeMetrics(metrics: any): any {
    // Convert platform-specific metrics to universal format
    return {
      followers: metrics.followers || 0,
      engagement_rate: metrics.engagement_rate || 0,
      content_views: metrics.impressions || metrics.views || 0,
      streams: metrics.streams || metrics.monthly_listeners || 0,
      platform_metrics: {
        // Store platform-specific data
        ...metrics
      }
    };
  }
  
  async handleConnectionError(
    artistId: string, 
    platform: string, 
    error: IntegrationError
  ): Promise<void> {
    // Update connection status
    await supabase
      .from('platform_connections')
      .update({
        sync_status: error.code === 'TOKEN_EXPIRED' ? 'expired' : 'error',
        last_error: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('artist_id', artistId)
      .eq('platform', platform);
    
    // Create task for user to fix connection
    if (error.code === 'TOKEN_EXPIRED') {
      await supabase
        .from('tasks')
        .insert({
          artist_id: artistId,
          title: `Reconnect ${platform}`,
          description: `Your ${platform} connection has expired. Please reconnect to continue receiving insights.`,
          category: 'business',
          priority: 'high',
          impact_score: 8,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
    }
    
    // Send notification to mobile app
    await this.sendConnectionErrorNotification(artistId, platform, error);
  }
  
  async validateAllConnections(artistId: string): Promise<ConnectionValidation[]> {
    const connections = await this.getActiveConnections(artistId);
    const validations: ConnectionValidation[] = [];
    
    for (const connection of connections) {
      try {
        const integration = this.integrations[connection.platform as keyof typeof this.integrations];
        
        // Test connection with a lightweight API call
        await integration.testConnection(connection);
        
        validations.push({
          platform: connection.platform,
          is_valid: true,
          expires_at: connection.expires_at,
          last_checked: new Date().toISOString()
        });
        
      } catch (error) {
        validations.push({
          platform: connection.platform,
          is_valid: false,
          error: error.message,
          requires_action: true,
          last_checked: new Date().toISOString()
        });
      }
    }
    
    return validations;
  }
}
```

## Success Metrics

### Integration Performance KPIs
- **API Uptime**: >99% successful API calls across all platforms
- **Data Freshness**: <24 hours lag from platform to database
- **Connection Reliability**: <5% of connections require manual reconnection per month
- **Rate Limit Optimization**: <10% of available rate limit used per platform
- **Error Recovery**: 90% of failed connections auto-recover within 24 hours

### Platform Coverage KPIs
- **Platform Support**: 5+ major platforms integrated
- **Artist Coverage**: 80% of artists have at least 2 platforms connected
- **Data Completeness**: 95% of available metrics successfully collected
- **Sync Frequency**: Daily updates for all connected platforms
- **Real-time Updates**: <5 minutes for webhook-supported platforms

### Implementation Checklist
- [ ] Implement OAuth flows for all major social media platforms
- [ ] Set up secure token storage and encryption
- [ ] Create unified data models for diverse API responses
- [ ] Implement rate limiting and quota management
- [ ] Set up webhook endpoints for real-time updates
- [ ] Create error handling and retry mechanisms
- [ ] Build connection health monitoring
- [ ] Implement graceful degradation for API failures
- [ ] Set up automated token refresh processes
- [ ] Create user-friendly connection management UI