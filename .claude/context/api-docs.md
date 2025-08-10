# API Documentation

## Supabase API Endpoints

### Authentication
```typescript
// Sign up
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      name: 'Artist Name',
      genre: 'Hip Hop'
    }
  }
})

// Sign in
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Social login
await supabase.auth.signInWithOAuth({
  provider: 'google' | 'apple' | 'spotify'
})

// Sign out
await supabase.auth.signOut()
```

### Database Operations
```typescript
// Get artist profile
const { data, error } = await supabase
  .from('artists')
  .select('*')
  .eq('id', userId)
  .single()

// Get metrics with real-time subscription
const channel = supabase
  .channel('metrics-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'metrics',
    filter: `artist_id=eq.${userId}`
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Create task
await supabase
  .from('tasks')
  .insert({
    artist_id: userId,
    title: 'Post on Instagram',
    category: 'content',
    due_date: '2024-12-31'
  })

// Update task completion
await supabase
  .from('tasks')
  .update({ completed: true, completed_at: new Date() })
  .eq('id', taskId)
```

### Storage Operations
```typescript
// Upload image
const { data, error } = await supabase.storage
  .from('content')
  .upload(`${userId}/${fileName}`, file)

// Get public URL
const { data } = supabase.storage
  .from('content')
  .getPublicUrl(`${userId}/${fileName}`)

// Delete file
await supabase.storage
  .from('content')
  .remove([`${userId}/${fileName}`])
```

## Stripe API Integration

### Create Checkout Session
```typescript
// POST /api/stripe/create-checkout
{
  "priceId": "price_dreamSuite_monthly",
  "userId": "user_uuid",
  "successUrl": "app://success",
  "cancelUrl": "app://cancel"
}

// Response
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### Webhook Events
```typescript
// POST /api/stripe/webhook
// Handles:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

## Social Media APIs (via n8n)

### Instagram Basic Display API
```yaml
Endpoints:
  - /me: User profile and follower count
  - /me/media: Recent posts and engagement
  - /{media-id}/insights: Post performance metrics

Rate Limits:
  - 200 calls per hour per user
  - Cached for 1 hour minimum
```

### Spotify Web API
```yaml
Endpoints:
  - /artists/{id}: Artist profile and followers
  - /artists/{id}/top-tracks: Popular songs
  - /artists/{id}/related-artists: Similar artists

Rate Limits:
  - Rolling 30-second window
  - Cached for 24 hours
```

### TikTok API
```yaml
Endpoints:
  - /user/info: Profile and statistics
  - /user/videos: Recent content
  - /video/info: Individual video metrics

Rate Limits:
  - 100 requests per day
  - Cached for 6 hours
```

### YouTube Data API
```yaml
Endpoints:
  - /channels: Channel statistics
  - /videos: Video performance
  - /search: Content discovery

Rate Limits:
  - 10,000 units per day
  - Cached for 12 hours
```

## Relevance AI Integration

### Analyze Artist Data
```typescript
// POST https://api.relevance.ai/v1/analyze
{
  "workflow_id": "artist_insights_v2",
  "params": {
    "artist_id": "uuid",
    "metrics": {
      "instagram": { /* metrics */ },
      "spotify": { /* metrics */ },
      "tiktok": { /* metrics */ }
    },
    "timeframe": "last_30_days"
  }
}

// Response
{
  "insights": [
    {
      "type": "content",
      "title": "Video content performing 3x better",
      "description": "Your video posts get 300% more engagement",
      "recommendations": [
        "Post 2-3 videos per week",
        "Keep videos under 30 seconds",
        "Use trending audio"
      ],
      "priority": "high"
    }
  ],
  "tasks": [
    {
      "title": "Create Instagram Reel",
      "category": "content",
      "impact_score": 8
    }
  ]
}
```

### Generate Content Ideas
```typescript
// POST https://api.relevance.ai/v1/generate
{
  "workflow_id": "content_generator_v1",
  "params": {
    "artist_genre": "hip_hop",
    "recent_trends": ["trending_sounds", "challenges"],
    "audience_demographics": { /* data */ }
  }
}
```

## n8n Webhook Triggers

### Metric Collection Trigger
```typescript
// POST https://n8n.domain.com/webhook/collect-metrics
{
  "artist_id": "uuid",
  "platforms": ["instagram", "spotify", "tiktok"],
  "sync_type": "manual" | "scheduled"
}
```

### AI Analysis Trigger
```typescript
// POST https://n8n.domain.com/webhook/analyze-artist
{
  "artist_id": "uuid",
  "analysis_type": "weekly" | "monthly" | "on_demand"
}
```

## Error Codes

### Supabase Errors
- `PGRST301`: JWT expired - refresh token
- `PGRST204`: No rows found
- `23505`: Unique constraint violation
- `23503`: Foreign key violation

### Stripe Errors
- `card_declined`: Payment method declined
- `subscription_payment_failed`: Recurring payment failed
- `customer_not_found`: Invalid customer ID

### API Rate Limit Errors
- `429`: Too many requests - implement backoff
- `503`: Service unavailable - retry later

## Rate Limiting Strategy

### Client-Side
- Debounce user inputs (300ms)
- Cache API responses (5-60 minutes based on endpoint)
- Implement exponential backoff for retries

### Server-Side
- Rate limit by IP and user ID
- Queue background jobs for batch processing
- Use webhooks instead of polling where possible