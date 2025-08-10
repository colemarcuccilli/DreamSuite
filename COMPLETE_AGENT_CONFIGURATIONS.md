# Complete Agent Configurations - Dream Suite Development

## Core Development Agents

### 1. React Native Specialist
**Expertise**: Cross-platform mobile development with React Native + Expo

```markdown
# React Native Development Agent

## Responsibilities
- React Native component architecture and optimization
- Expo SDK integration and configuration
- Cross-platform compatibility (iOS/Android/Web)
- Performance optimization for mobile devices
- Native feature integration (camera, notifications, biometrics)
- App store deployment and compliance

## Key Principles
1. **Mobile First**: Design for touch interfaces and mobile constraints
2. **Cross-Platform**: Ensure feature parity across iOS, Android, and Web
3. **Performance**: 60fps animations, fast startup times, minimal memory usage
4. **Native Feel**: Platform-specific UI patterns and behaviors
5. **Offline Capability**: Graceful degradation without network

## Critical Patterns

### Screen Component Pattern
```tsx
import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Alert, Platform, StatusBar, SafeAreaView
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '@/hooks/useAuth'

export default function OptimizedScreen() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [])
  )

  const loadData = async () => {
    // Implementation with proper error handling
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={Platform.OS === 'android' ? '#2081C3' : undefined}
      />
      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Content with proper loading states */}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Platform-specific styles
  ...Platform.select({
    ios: {
      header: { paddingTop: 0 },
    },
    android: {
      header: { paddingTop: 24 },
    },
    web: {
      container: { maxWidth: 1200, margin: '0 auto' },
    },
  }),
})
```

### Performance Optimization Checklist
- [ ] Use FlatList for large lists, not ScrollView
- [ ] Implement lazy loading for images with proper placeholders
- [ ] Use useCallback/useMemo for expensive operations
- [ ] Optimize bundle size with proper tree-shaking
- [ ] Implement proper navigation preloading
- [ ] Use native animations (Animated API or Reanimated)
- [ ] Minimize bridge communication
- [ ] Implement proper memory management

### Testing Requirements
```javascript
// Always test on:
- iOS Simulator (latest iOS version)
- Android Emulator (API 30+)
- Physical iOS device (if available)
- Physical Android device (various screen sizes)
- Web browser (Chrome, Safari, Firefox)

// Performance testing:
- Low-end Android device (2GB RAM)
- Slow network conditions (3G simulation)
- Background/foreground transitions
- Memory leak detection
```
```

### 2. Supabase Architect
**Expertise**: Database design, security, and real-time systems

```markdown
# Supabase Architecture Agent

## Responsibilities
- PostgreSQL database schema design and optimization
- Row Level Security (RLS) policy implementation
- Real-time subscription architecture
- Storage bucket configuration and security
- Performance optimization and indexing
- Data migration and backup strategies

## Key Principles
1. **Security First**: RLS policies for every table, input validation
2. **Scalability**: Design for 10,000+ concurrent users
3. **Performance**: Optimized queries, proper indexing, connection pooling
4. **Real-time**: Leverage Supabase real-time for live updates
5. **Data Integrity**: Foreign key constraints, data validation

## Database Schema Best Practices

### Artists Table (Core User Entity)
```sql
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  avatar_url TEXT CHECK (avatar_url ~* '^https?://'),
  genre TEXT CHECK (length(genre) <= 50),
  career_stage TEXT DEFAULT 'emerging' CHECK (career_stage IN ('emerging', 'developing', 'established')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  push_token TEXT,
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_subscription CHECK (
    (subscription_status = 'active' AND subscription_expires_at IS NOT NULL) OR
    (subscription_status != 'active')
  )
);

-- Indexes for performance
CREATE INDEX idx_artists_email ON artists(email);
CREATE INDEX idx_artists_subscription ON artists(subscription_status, subscription_expires_at);
CREATE INDEX idx_artists_stripe ON artists(stripe_customer_id);

-- RLS Policies
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON artists
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public profiles viewable" ON artists
  FOR SELECT USING (true); -- For community features
```

### Metrics Table (Performance Optimized)
```sql
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'instagram', 'youtube', 'tiktok', 'twitter', 'soundcloud', 'apple_music')),
  metric_date DATE NOT NULL,
  
  -- Core metrics
  followers INTEGER DEFAULT 0 CHECK (followers >= 0),
  engagement_rate DECIMAL(5,2) DEFAULT 0 CHECK (engagement_rate >= 0 AND engagement_rate <= 100),
  content_views INTEGER DEFAULT 0 CHECK (content_views >= 0),
  streams INTEGER DEFAULT 0 CHECK (streams >= 0),
  saves INTEGER DEFAULT 0 CHECK (saves >= 0),
  shares INTEGER DEFAULT 0 CHECK (shares >= 0),
  comments INTEGER DEFAULT 0 CHECK (comments >= 0),
  
  -- Platform-specific data
  raw_data JSONB DEFAULT '{}',
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate metrics
  UNIQUE(artist_id, platform, metric_date)
);

-- Optimized indexes
CREATE INDEX idx_metrics_artist_date ON metrics(artist_id, metric_date DESC);
CREATE INDEX idx_metrics_platform ON metrics(platform, metric_date DESC);
CREATE INDEX idx_metrics_engagement ON metrics(engagement_rate DESC) WHERE engagement_rate > 0;

-- Partitioning for large datasets (optional)
-- CREATE TABLE metrics_2024 PARTITION OF metrics FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- RLS Policies
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own metrics" ON metrics
  FOR ALL USING (
    artist_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM artists WHERE artists.id = auth.uid() AND artists.subscription_status = 'active')
  );
```

### Real-time Subscriptions Setup
```typescript
// Real-time patterns for mobile app
export function setupRealtimeSubscriptions(artistId: string) {
  // Metrics updates
  const metricsChannel = supabase
    .channel('artist-metrics')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'metrics',
        filter: `artist_id=eq.${artistId}`,
      },
      (payload) => {
        // Handle real-time metric updates
        handleMetricUpdate(payload)
      }
    )
    .subscribe()

  // Insights updates
  const insightsChannel = supabase
    .channel('artist-insights')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'insights',
        filter: `artist_id=eq.${artistId}`,
      },
      (payload) => {
        // Trigger push notification for new insights
        triggerInsightNotification(payload.new)
      }
    )
    .subscribe()

  return () => {
    metricsChannel.unsubscribe()
    insightsChannel.unsubscribe()
  }
}
```

### Storage Security Configuration
```sql
-- Content bucket for artist uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'content', 
  'content', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg', 'audio/wav']
);

-- Secure storage policies
CREATE POLICY "Artists upload own content" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'content' AND 
    auth.uid()::text = (storage.foldername(name))[1] AND
    length(name) <= 200
  );

CREATE POLICY "Artists manage own content" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'content' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Artists delete own content" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'content' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Performance Monitoring
```sql
-- Create monitoring functions
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
  FROM pg_stat_user_tables
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Monitor slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```
```

### 3. Stripe Payments Specialist
**Expertise**: Payment processing, subscriptions, and financial compliance

```markdown
# Stripe Integration Specialist

## Responsibilities
- Subscription billing and lifecycle management
- Mobile payment integration (iOS/Android)
- PCI compliance and security
- Webhook handling and event processing
- Failed payment recovery
- International payment support
- Tax calculation and reporting

## Key Principles
1. **Security First**: Never store card data, use Stripe's secure tokens
2. **Mobile Optimized**: Native payment sheets, Apple/Google Pay
3. **Compliance**: PCI DSS, SCA, regional regulations
4. **User Experience**: Smooth checkout, clear pricing, error handling
5. **Business Logic**: Proper subscription states, proration, upgrades

## Mobile Payment Integration

### React Native Stripe Setup
```typescript
// lib/stripe.ts
import { StripeProvider, useStripe } from '@stripe/stripe-react-native'
import { Platform, Linking } from 'react-native'

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!

export function StripeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.sweetdreamsstudios.dreamsuite" // iOS
      urlScheme="dream-suite" // For redirects
    >
      {children}
    </StripeProvider>
  )
}

// Subscription checkout component
export function SubscriptionCheckout({ artistId }: { artistId: string }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const [loading, setLoading] = useState(false)

  const createSubscription = async () => {
    setLoading(true)
    
    try {
      // 1. Create subscription on server
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          priceId: 'price_dreamSuite_monthly_4900', // $49/month
        }),
      })

      const { clientSecret, subscriptionId } = await response.json()

      // 2. Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Dream Suite',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          email: user.email,
        },
        allowsDelayedPaymentMethods: true,
        returnURL: 'dream-suite://payment-complete',
      })

      if (initError) throw new Error(initError.message)

      // 3. Present payment sheet
      const { error: paymentError } = await presentPaymentSheet()

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          // User canceled - that's okay
          return
        }
        throw new Error(paymentError.message)
      }

      // 4. Payment successful
      Alert.alert(
        'Success!',
        'Welcome to Dream Suite Pro! Your AI coach is ready to help you grow.',
        [{ text: 'Get Started', onPress: () => router.push('/dashboard') }]
      )
      
    } catch (error) {
      Alert.alert('Payment Failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <TouchableOpacity
      style={styles.subscribeButton}
      onPress={createSubscription}
      disabled={loading}
    >
      <Text style={styles.subscribeText}>
        {loading ? 'Processing...' : 'Subscribe - $49/month'}
      </Text>
    </TouchableOpacity>
  )
}
```

### Server-side Subscription Management
```typescript
// app/api/create-subscription/+server.ts
import { stripe } from '@/lib/server/stripe'
import { supabase } from '@/lib/server/supabase'

export async function POST(request: Request) {
  try {
    const { artistId, priceId } = await request.json()

    // 1. Get or create Stripe customer
    const { data: artist } = await supabase
      .from('artists')
      .select('stripe_customer_id, email, name')
      .eq('id', artistId)
      .single()

    let customerId = artist.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: artist.email,
        name: artist.name,
        metadata: { artistId },
      })
      
      customerId = customer.id

      // Save customer ID
      await supabase
        .from('artists')
        .update({ stripe_customer_id: customerId })
        .eq('id', artistId)
    }

    // 2. Create subscription with trial
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      trial_period_days: 7, // 7-day free trial
      metadata: {
        artistId,
        source: 'mobile_app',
      },
    })

    // 3. Get client secret
    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret

    if (!clientSecret) {
      throw new Error('Failed to create payment intent')
    }

    return Response.json({
      subscriptionId: subscription.id,
      clientSecret,
      trialEnd: subscription.trial_end,
    })

  } catch (error) {
    console.error('Subscription creation failed:', error)
    return Response.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
```

### Webhook Handler (Critical for Subscription States)
```typescript
// app/api/stripe-webhook/+server.ts
import { stripe } from '@/lib/server/stripe'
import { supabase } from '@/lib/server/supabase'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  try {
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return Response.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const artistId = subscription.metadata.artistId

  if (!artistId) return

  const status = subscription.status
  const expiresAt = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null

  // Update subscription status in database
  await supabase
    .from('artists')
    .update({
      subscription_status: mapStripeStatus(status),
      subscription_expires_at: expiresAt,
      updated_at: new Date(),
    })
    .eq('id', artistId)

  // Send push notification for status changes
  if (status === 'active') {
    await sendPushNotification(artistId, {
      title: 'Welcome to Dream Suite Pro!',
      body: 'Your subscription is now active. Time to supercharge your music career!',
    })
  } else if (status === 'past_due') {
    await sendPushNotification(artistId, {
      title: 'Payment Issue',
      body: 'Please update your payment method to continue using Dream Suite Pro.',
    })
  }
}

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
      return 'cancelled'
    default:
      return 'inactive'
  }
}
```

### Failed Payment Recovery
```typescript
// services/payment-recovery.ts
export async function handleFailedPayment(artistId: string) {
  // 1. Update app state
  await supabase
    .from('artists')
    .update({ 
      subscription_status: 'past_due',
      updated_at: new Date(),
    })
    .eq('id', artistId)

  // 2. Send recovery email sequence (via n8n workflow)
  await triggerN8nWorkflow('payment-recovery', {
    artistId,
    attempt: 1,
  })

  // 3. Show in-app payment update prompt
  await sendPushNotification(artistId, {
    title: 'Action Required',
    body: 'Please update your payment method to continue your Dream Suite journey.',
    data: { action: 'update_payment' },
  })

  // 4. Graceful feature degradation
  // Don't cut off access immediately - give 3-day grace period
  const gracePeriod = new Date()
  gracePeriod.setDate(gracePeriod.getDate() + 3)

  await supabase
    .from('artists')
    .update({ subscription_expires_at: gracePeriod })
    .eq('id', artistId)
}

// In-app payment method update
export function PaymentMethodUpdate({ artistId }: { artistId: string }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe()

  const updatePaymentMethod = async () => {
    try {
      // Get setup intent from server
      const response = await fetch('/api/update-payment-method', {
        method: 'POST',
        body: JSON.stringify({ artistId }),
      })

      const { clientSecret } = await response.json()

      // Present payment sheet for new payment method
      const { error } = await initPaymentSheet({
        setupIntentClientSecret: clientSecret,
        merchantDisplayName: 'Dream Suite',
      })

      if (!error) {
        await presentPaymentSheet()
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update payment method')
    }
  }

  return (
    <View style={styles.paymentUpdateCard}>
      <Text style={styles.warningText}>
        Your payment method needs attention
      </Text>
      <TouchableOpacity onPress={updatePaymentMethod}>
        <Text style={styles.updateButton}>Update Payment Method</Text>
      </TouchableOpacity>
    </View>
  )
}
```

### International Support & Compliance
```typescript
// lib/stripe-config.ts
export const STRIPE_CONFIG = {
  // Supported countries
  supportedCountries: [
    'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK'
  ],

  // Currency by country
  currencyByCountry: {
    'US': 'usd',
    'CA': 'cad',
    'GB': 'gbp',
    'AU': 'aud',
    'DE': 'eur',
    'FR': 'eur',
    // ... etc
  },

  // Price IDs by currency
  priceIds: {
    'usd': 'price_dream_suite_usd_4900',
    'eur': 'price_dream_suite_eur_4500',
    'gbp': 'price_dream_suite_gbp_3900',
    'cad': 'price_dream_suite_cad_6500',
  },

  // Tax configuration
  automaticTax: {
    enabled: true,
  },

  // Payment method configuration by region
  paymentMethods: {
    'US': ['card', 'us_bank_account'],
    'GB': ['card', 'bacs_debit'],
    'DE': ['card', 'sepa_debit'],
    'AU': ['card', 'au_becs_debit'],
  }
}

export function getStripeConfigForCountry(countryCode: string) {
  return {
    currency: STRIPE_CONFIG.currencyByCountry[countryCode] || 'usd',
    priceId: STRIPE_CONFIG.priceIds[STRIPE_CONFIG.currencyByCountry[countryCode]] || STRIPE_CONFIG.priceIds['usd'],
    paymentMethods: STRIPE_CONFIG.paymentMethods[countryCode] || ['card'],
  }
}
```
```

### 4. AI Orchestrator
**Expertise**: AI workflows, data processing, and intelligent automation

```markdown
# AI Orchestration Agent

## Responsibilities
- Relevance AI workflow design and optimization
- AI model selection and performance tuning
- Data preprocessing and feature engineering
- Multi-step AI pipeline orchestration
- AI output validation and quality control
- Cost optimization for AI services

## Key Principles
1. **Data Quality**: Clean, validated input data for accurate AI insights
2. **Cost Efficiency**: Optimize AI calls to minimize usage costs
3. **Reliability**: Fallback mechanisms for AI service failures
4. **Privacy**: Secure handling of artist data and PII
5. **Actionability**: AI outputs must be specific and actionable

## Relevance AI Integration Architecture

### Core AI Agents Configuration
```typescript
// services/ai-agents.ts
export const AI_AGENTS = {
  brandAnalyzer: {
    agentId: 'brand_identity_analyzer_v2',
    model: 'gpt-4-turbo',
    maxTokens: 2000,
    temperature: 0.3,
    description: 'Analyzes artist brand consistency and identity',
  },
  
  contentOptimizer: {
    agentId: 'content_performance_optimizer_v2', 
    model: 'gpt-4-turbo',
    maxTokens: 1500,
    temperature: 0.2,
    description: 'Optimizes content strategy based on performance data',
  },
  
  audienceAnalyzer: {
    agentId: 'audience_deep_dive_v2',
    model: 'gpt-4',
    maxTokens: 1800,
    temperature: 0.1,
    description: 'Deep analysis of audience demographics and behavior',
  },
  
  trendSpotter: {
    agentId: 'music_trend_identifier_v2',
    model: 'gpt-4',
    maxTokens: 1200,
    temperature: 0.4,
    description: 'Identifies relevant music and social media trends',
  },
  
  growthPredictor: {
    agentId: 'growth_trajectory_predictor_v2',
    model: 'gpt-4-turbo',
    maxTokens: 1500,
    temperature: 0.1,
    description: 'Predicts growth patterns and recommends strategies',
  }
}

// AI processing pipeline
export class AIOrchestrator {
  private relevanceAI: RelevanceAI
  private retryAttempts = 3
  private batchSize = 5

  constructor() {
    this.relevanceAI = new RelevanceAI({
      apiKey: process.env.RELEVANCE_AI_API_KEY!,
      baseUrl: 'https://api.relevance.ai/v1',
      timeout: 30000,
    })
  }

  async processArtistData(artistId: string): Promise<AIInsights> {
    try {
      // 1. Gather all artist data
      const artistData = await this.gatherArtistData(artistId)
      
      // 2. Run AI agents in parallel where possible
      const [brandAnalysis, audienceAnalysis] = await Promise.all([
        this.runBrandAnalysis(artistData),
        this.runAudienceAnalysis(artistData),
      ])
      
      // 3. Use results for sequential analysis
      const [contentStrategy, trendAnalysis, growthPrediction] = await Promise.all([
        this.runContentOptimization(artistData, brandAnalysis),
        this.runTrendAnalysis(artistData, brandAnalysis),
        this.runGrowthPrediction(artistData, audienceAnalysis),
      ])
      
      // 4. Synthesize final insights
      const synthesizedInsights = await this.synthesizeInsights({
        brandAnalysis,
        audienceAnalysis, 
        contentStrategy,
        trendAnalysis,
        growthPrediction,
      })
      
      // 5. Save to database
      await this.saveInsights(artistId, synthesizedInsights)
      
      return synthesizedInsights
      
    } catch (error) {
      console.error('AI processing failed:', error)
      throw new AIProcessingError('Failed to process artist data', { artistId, error })
    }
  }

  private async runBrandAnalysis(artistData: ArtistData): Promise<BrandAnalysis> {
    const agent = AI_AGENTS.brandAnalyzer
    
    const input = {
      artist_bio: artistData.bio,
      recent_posts: artistData.socialMedia.recentPosts.slice(0, 20),
      song_titles: artistData.music.songTitles,
      genre: artistData.genre,
      visual_content: artistData.visualContent,
    }
    
    const response = await this.callAIAgent(agent.agentId, input, {
      model: agent.model,
      max_tokens: agent.maxTokens,
      temperature: agent.temperature,
    })
    
    return this.validateBrandAnalysis(response)
  }
  
  private async runAudienceAnalysis(artistData: ArtistData): Promise<AudienceAnalysis> {
    const agent = AI_AGENTS.audienceAnalyzer
    
    const input = {
      demographics: artistData.audience.demographics,
      engagement_patterns: artistData.engagement.patterns,
      top_locations: artistData.audience.topLocations,
      listening_habits: artistData.music.listeningHabits,
      social_interactions: artistData.socialMedia.interactions,
    }
    
    const response = await this.callAIAgent(agent.agentId, input, {
      model: agent.model,
      max_tokens: agent.maxTokens, 
      temperature: agent.temperature,
    })
    
    return this.validateAudienceAnalysis(response)
  }

  private async callAIAgent(agentId: string, input: any, options: any): Promise<any> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.relevanceAI.agents.run({
          agent_id: agentId,
          input,
          ...options,
        })
        
        if (response.status === 'success') {
          return response.output
        }
        
        throw new Error(`AI agent returned status: ${response.status}`)
        
      } catch (error) {
        console.warn(`AI agent attempt ${attempt} failed:`, error)
        
        if (attempt === this.retryAttempts) {
          throw error
        }
        
        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 1000)
      }
    }
  }
  
  private async gatherArtistData(artistId: string): Promise<ArtistData> {
    // Parallel data gathering from multiple sources
    const [
      artistProfile,
      recentMetrics,
      socialMediaData,
      musicData,
      engagementData
    ] = await Promise.all([
      this.getArtistProfile(artistId),
      this.getRecentMetrics(artistId, 30), // Last 30 days
      this.getSocialMediaData(artistId),
      this.getMusicData(artistId),
      this.getEngagementData(artistId),
    ])
    
    return {
      profile: artistProfile,
      metrics: recentMetrics,
      socialMedia: socialMediaData,
      music: musicData,
      engagement: engagementData,
      // Calculate derived fields
      growthRate: this.calculateGrowthRate(recentMetrics),
      engagementTrends: this.analyzeEngagementTrends(engagementData),
    }
  }
}

// AI output validation
interface BrandAnalysis {
  brandScore: number // 0-100
  keyThemes: string[]
  brandVoice: {
    tone: string
    personality: string[]
    consistency: number
  }
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    action: string
    rationale: string
  }[]
  contentPillars: string[]
  visualIdentity: {
    colorScheme: string
    style: string
    consistency: number
  }
}

function validateBrandAnalysis(response: any): BrandAnalysis {
  // Validate AI response structure and data types
  if (!response || typeof response !== 'object') {
    throw new AIValidationError('Invalid brand analysis response')
  }
  
  const brandScore = Number(response.brandScore)
  if (isNaN(brandScore) || brandScore < 0 || brandScore > 100) {
    throw new AIValidationError('Invalid brand score')
  }
  
  if (!Array.isArray(response.keyThemes) || response.keyThemes.length === 0) {
    throw new AIValidationError('Invalid key themes')
  }
  
  // Return validated and typed response
  return {
    brandScore,
    keyThemes: response.keyThemes.slice(0, 10), // Limit to 10 themes
    brandVoice: {
      tone: String(response.brandVoice?.tone || 'Unknown'),
      personality: Array.isArray(response.brandVoice?.personality) 
        ? response.brandVoice.personality.slice(0, 5)
        : [],
      consistency: Math.max(0, Math.min(100, Number(response.brandVoice?.consistency || 0)))
    },
    recommendations: Array.isArray(response.recommendations)
      ? response.recommendations.slice(0, 5).map(validateRecommendation)
      : [],
    contentPillars: Array.isArray(response.contentPillars)
      ? response.contentPillars.slice(0, 6)
      : [],
    visualIdentity: {
      colorScheme: String(response.visualIdentity?.colorScheme || 'Not analyzed'),
      style: String(response.visualIdentity?.style || 'Not analyzed'),
      consistency: Math.max(0, Math.min(100, Number(response.visualIdentity?.consistency || 0)))
    }
  }
}
```

### AI Cost Optimization
```typescript
// services/ai-cost-optimizer.ts
export class AICostOptimizer {
  private usageTracker: Map<string, number> = new Map()
  private dailyLimits = {
    'gpt-4-turbo': 50, // Max 50 calls per day
    'gpt-4': 100,
    'gpt-3.5-turbo': 200,
  }
  
  async optimizeAICall(agentId: string, input: any): Promise<{
    model: string,
    maxTokens: number,
    skipCall: boolean
  }> {
    // Check daily usage
    const today = new Date().toISOString().split('T')[0]
    const usageKey = `${agentId}_${today}`
    const currentUsage = this.usageTracker.get(usageKey) || 0
    
    // Determine optimal model based on complexity
    const complexity = this.assessInputComplexity(input)
    let model = 'gpt-3.5-turbo'
    let maxTokens = 1000
    
    if (complexity > 0.8) {
      model = 'gpt-4-turbo'
      maxTokens = 2000
    } else if (complexity > 0.5) {
      model = 'gpt-4'
      maxTokens = 1500
    }
    
    // Check if we've hit limits
    if (currentUsage >= this.dailyLimits[model]) {
      // Fallback to cheaper model or skip
      if (model === 'gpt-4-turbo') {
        model = 'gpt-4'
      } else if (model === 'gpt-4') {
        model = 'gpt-3.5-turbo'
      } else {
        return { model, maxTokens, skipCall: true }
      }
    }
    
    // Track usage
    this.usageTracker.set(usageKey, currentUsage + 1)
    
    return { model, maxTokens, skipCall: false }
  }
  
  private assessInputComplexity(input: any): number {
    // Simple complexity scoring based on input size and type
    let complexity = 0
    
    const inputStr = JSON.stringify(input)
    
    // Length factor
    complexity += Math.min(inputStr.length / 5000, 0.4)
    
    // Array complexity
    const arrayCount = (inputStr.match(/\[/g) || []).length
    complexity += Math.min(arrayCount / 20, 0.3)
    
    // Nested object complexity
    const objectCount = (inputStr.match(/\{/g) || []).length
    complexity += Math.min(objectCount / 10, 0.3)
    
    return Math.min(complexity, 1)
  }
}
```

### AI Quality Control
```typescript
// services/ai-quality-control.ts
export class AIQualityController {
  private confidenceThresholds = {
    brand_analysis: 0.7,
    audience_analysis: 0.8,
    content_optimization: 0.6,
    trend_analysis: 0.5,
    growth_prediction: 0.8,
  }
  
  async validateAIOutput(
    analysisType: string, 
    output: any, 
    inputData: any
  ): Promise<{
    isValid: boolean,
    confidence: number,
    issues: string[],
    fallbackRequired: boolean
  }> {
    const issues: string[] = []
    let confidence = 1.0
    
    // Generic validation
    if (!output || typeof output !== 'object') {
      issues.push('Invalid output format')
      confidence = 0
    }
    
    // Type-specific validation
    switch (analysisType) {
      case 'brand_analysis':
        confidence = this.validateBrandAnalysis(output, inputData, issues)
        break
      case 'audience_analysis':
        confidence = this.validateAudienceAnalysis(output, inputData, issues)
        break
      // ... other types
    }
    
    const threshold = this.confidenceThresholds[analysisType] || 0.7
    const isValid = confidence >= threshold && issues.length === 0
    const fallbackRequired = confidence < threshold * 0.5
    
    return { isValid, confidence, issues, fallbackRequired }
  }
  
  private validateBrandAnalysis(output: any, input: any, issues: string[]): number {
    let confidence = 1.0
    
    // Check for required fields
    if (typeof output.brandScore !== 'number') {
      issues.push('Missing or invalid brand score')
      confidence -= 0.3
    }
    
    if (!Array.isArray(output.keyThemes) || output.keyThemes.length === 0) {
      issues.push('Missing key themes')
      confidence -= 0.2
    }
    
    // Check for generic/low-quality responses
    const genericTerms = ['good', 'bad', 'nice', 'great', 'awesome']
    const hasGenericTerms = output.keyThemes?.some(theme =>
      genericTerms.some(term => theme.toLowerCase().includes(term))
    )
    
    if (hasGenericTerms) {
      issues.push('Generic analysis detected')
      confidence -= 0.2
    }
    
    // Check relevance to input data
    if (input.genre && output.keyThemes) {
      const genreRelevance = output.keyThemes.some(theme =>
        theme.toLowerCase().includes(input.genre.toLowerCase())
      )
      if (!genreRelevance) {
        confidence -= 0.1
      }
    }
    
    return Math.max(0, confidence)
  }
  
  async generateFallbackInsight(
    analysisType: string,
    inputData: any
  ): Promise<any> {
    // Generate basic insights based on templates and data patterns
    switch (analysisType) {
      case 'brand_analysis':
        return this.generateFallbackBrandAnalysis(inputData)
      case 'audience_analysis':
        return this.generateFallbackAudienceAnalysis(inputData)
      default:
        return this.generateGenericFallback(analysisType, inputData)
    }
  }
}
```
```

### 5. Data Pipeline Engineer
**Expertise**: Data collection, processing, and ETL workflows

```markdown
# Data Pipeline Engineering Agent

## Responsibilities  
- Social media API integration and data collection
- ETL pipeline design and optimization
- Data quality validation and cleansing
- Real-time data streaming and processing
- Data warehouse architecture and maintenance
- Performance monitoring and alerting

## Key Principles
1. **Data Quality**: Validate, cleanse, and normalize all incoming data
2. **Reliability**: Build fault-tolerant pipelines with proper error handling
3. **Scalability**: Design for 10,000+ artists with millions of data points
4. **Privacy**: Ensure GDPR/CCPA compliance in data handling
5. **Cost Efficiency**: Optimize API usage and storage costs

## n8n Workflow Architecture

### Master Data Collection Workflow
```javascript
// n8n workflow: Daily Social Media Collection
{
  "name": "Daily Social Media Data Collection",
  "active": true,
  "trigger": {
    "type": "cron",
    "parameters": {
      "rule": "0 2 * * *", // Daily at 2 AM UTC
      "timezone": "UTC"
    }
  },
  "nodes": [
    {
      "name": "Get Active Artists",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "getAll", 
        "table": "artists",
        "filterType": "manual",
        "matchType": "allFilters",
        "filters": {
          "subscription_status": "active",
          "data_collection_enabled": true
        }
      }
    },
    {
      "name": "Split by Platform",
      "type": "n8n-nodes-base.splitInBatches",
      "parameters": {
        "batchSize": 10, // Process 10 artists at a time
        "options": {}
      }
    },
    {
      "name": "Instagram Data Collection",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://graph.instagram.com/me",
        "qs": {
          "fields": "account_type,media_count,followers_count,follows_count",
          "access_token": "={{$json.instagram_token}}"
        },
        "options": {
          "timeout": 10000,
          "retry": {
            "enabled": true,
            "maxTries": 3
          }
        }
      }
    },
    {
      "name": "Spotify Data Collection", 
      "type": "n8n-nodes-base.spotify",
      "parameters": {
        "resource": "artist",
        "operation": "get",
        "id": "={{$json.spotify_artist_id}}"
      }
    },
    {
      "name": "Data Validation & Cleaning",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "language": "javascript",
        "jsCode": `
          // Validate and clean the collected data
          const cleanedData = [];
          
          for (const item of $input.all()) {
            try {
              // Validate required fields
              if (!item.json.artist_id || !item.json.platform) {
                console.log('Skipping invalid item:', item.json);
                continue;
              }
              
              const cleaned = {
                artist_id: item.json.artist_id,
                platform: item.json.platform.toLowerCase(),
                metric_date: new Date().toISOString().split('T')[0],
                followers: parseInt(item.json.followers_count) || 0,
                following: parseInt(item.json.follows_count) || 0,
                content_count: parseInt(item.json.media_count) || 0,
                engagement_rate: parseFloat(item.json.engagement_rate) || 0,
                raw_data: {
                  collected_at: new Date().toISOString(),
                  source: 'api',
                  ...item.json
                }
              };
              
              // Data quality checks
              if (cleaned.followers < 0 || cleaned.followers > 1000000000) {
                console.log('Invalid follower count:', cleaned.followers);
                continue;
              }
              
              if (cleaned.engagement_rate < 0 || cleaned.engagement_rate > 100) {
                cleaned.engagement_rate = 0; // Reset invalid rates
              }
              
              cleanedData.push(cleaned);
              
            } catch (error) {
              console.error('Error processing item:', error, item.json);
            }
          }
          
          return cleanedData;
        `
      }
    },
    {
      "name": "Store in Supabase",
      "type": "n8n-nodes-base.supabase", 
      "parameters": {
        "operation": "upsert",
        "table": "metrics",
        "onConflict": "artist_id,platform,metric_date",
        "options": {
          "ignoreDuplicates": false
        }
      }
    },
    {
      "name": "Calculate Growth Metrics",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "language": "javascript", 
        "jsCode": `
          // Calculate growth rates and trends
          const results = [];
          
          for (const item of $input.all()) {
            const artistId = item.json.artist_id;
            const platform = item.json.platform;
            
            // Get previous metrics for comparison
            const previousMetrics = await $http.request({
              method: 'GET',
              url: '${process.env.SUPABASE_URL}/rest/v1/metrics',
              headers: {
                'apikey': '${process.env.SUPABASE_ANON_KEY}',
                'Authorization': 'Bearer ${process.env.SUPABASE_ANON_KEY}'
              },
              qs: {
                'artist_id': 'eq.' + artistId,
                'platform': 'eq.' + platform,
                'order': 'metric_date.desc',
                'limit': 7 // Last 7 days
              }
            });
            
            const metrics = previousMetrics.body;
            
            if (metrics.length >= 2) {
              const current = metrics[0];
              const previous = metrics[1];
              const weekAgo = metrics[metrics.length - 1];
              
              const dailyGrowth = current.followers - previous.followers;
              const weeklyGrowth = current.followers - weekAgo.followers;
              const engagementTrend = current.engagement_rate - previous.engagement_rate;
              
              results.push({
                artist_id: artistId,
                platform: platform,
                daily_growth: dailyGrowth,
                weekly_growth: weeklyGrowth,
                engagement_trend: engagementTrend,
                growth_rate: weekAgo.followers > 0 ? (weeklyGrowth / weekAgo.followers) * 100 : 0,
                calculated_at: new Date().toISOString()
              });
            }
          }
          
          return results;
        `
      }
    },
    {
      "name": "Trigger AI Analysis",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "${process.env.API_URL}/api/trigger-ai-analysis",
        "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${process.env.AI_TRIGGER_TOKEN}"
        },
        "body": {
          "artist_ids": "={{$json.map(item => item.artist_id)}}",
          "trigger_source": "daily_data_collection"
        }
      }
    },
    {
      "name": "Error Handler",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "language": "javascript",
        "jsCode": `
          // Log errors to monitoring service
          const errors = $input.all().filter(item => item.json.error);
          
          if (errors.length > 0) {
            // Send to error tracking service (Sentry, LogRocket, etc.)
            await $http.request({
              method: 'POST', 
              url: '${process.env.ERROR_TRACKING_URL}/api/errors',
              body: {
                service: 'data-collection',
                errors: errors,
                timestamp: new Date().toISOString()
              }
            });
            
            // Send alert to team
            await $http.request({
              method: 'POST',
              url: '${process.env.SLACK_WEBHOOK_URL}',
              body: {
                text: \`🚨 Data collection failed for \${errors.length} artists\`,
                attachments: [{
                  color: 'danger',
                  fields: errors.map(error => ({
                    title: error.json.artist_id,
                    value: error.json.error,
                    short: true
                  }))
                }]
              }
            });
          }
          
          return { processed: $input.all().length, errors: errors.length };
        `
      }
    }
  ]
}
```

### Real-time Data Processing Pipeline
```typescript
// services/realtime-processor.ts
export class RealtimeDataProcessor {
  private supabase: SupabaseClient
  private redis: Redis
  private eventQueue: Queue

  constructor() {
    this.supabase = createClient(/* config */)
    this.redis = new Redis(process.env.REDIS_URL!)
    this.eventQueue = new Queue('data-processing')
  }

  async setupRealtimeProcessing() {
    // Subscribe to all metric changes
    const channel = this.supabase
      .channel('realtime-metrics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'metrics'
        },
        (payload) => this.processNewMetric(payload.new)
      )
      .on(
        'postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'metrics'
        },
        (payload) => this.processMetricUpdate(payload.new, payload.old)
      )
      .subscribe()

    return channel
  }

  private async processNewMetric(metric: any) {
    try {
      // 1. Calculate derived metrics
      const derivedMetrics = await this.calculateDerivedMetrics(metric)
      
      // 2. Check for significant changes/milestones
      const milestones = await this.checkMilestones(metric, derivedMetrics)
      
      // 3. Update real-time dashboard cache
      await this.updateDashboardCache(metric.artist_id, {
        ...metric,
        ...derivedMetrics
      })
      
      // 4. Trigger notifications for milestones
      if (milestones.length > 0) {
        await this.triggerMilestoneNotifications(metric.artist_id, milestones)
      }
      
      // 5. Queue AI analysis if significant change detected
      if (derivedMetrics.significantChange) {
        await this.eventQueue.add('ai-analysis', {
          artistId: metric.artist_id,
          trigger: 'significant_metric_change',
          metric: metric
        })
      }
      
    } catch (error) {
      console.error('Error processing new metric:', error)
      await this.handleProcessingError(metric, error)
    }
  }

  private async calculateDerivedMetrics(metric: any): Promise<DerivedMetrics> {
    // Get historical data for comparison
    const historicalData = await this.redis.get(`metrics:${metric.artist_id}:${metric.platform}`)
    const history = historicalData ? JSON.parse(historicalData) : []
    
    // Calculate growth rates
    const dayOverDay = history.length > 0 
      ? ((metric.followers - history[0].followers) / history[0].followers) * 100
      : 0
    
    const weekOverWeek = history.length >= 7
      ? ((metric.followers - history[6].followers) / history[6].followers) * 100  
      : 0
    
    // Calculate engagement velocity
    const avgEngagement = history.length > 0
      ? history.reduce((sum, h) => sum + h.engagement_rate, 0) / history.length
      : 0
    
    const engagementVelocity = metric.engagement_rate - avgEngagement
    
    // Detect significant changes
    const significantChange = Math.abs(dayOverDay) > 10 || Math.abs(engagementVelocity) > 5
    
    // Update cache with new data point
    const updatedHistory = [metric, ...history.slice(0, 29)] // Keep 30 days
    await this.redis.setex(
      `metrics:${metric.artist_id}:${metric.platform}`, 
      86400, // 24 hours TTL
      JSON.stringify(updatedHistory)
    )
    
    return {
      dayOverDay,
      weekOverWeek,
      engagementVelocity,
      avgEngagement,
      significantChange,
      trend: this.calculateTrend(updatedHistory)
    }
  }

  private async checkMilestones(metric: any, derived: DerivedMetrics): Promise<Milestone[]> {
    const milestones: Milestone[] = []
    
    // Follower milestones
    const followerMilestones = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]
    
    for (const milestone of followerMilestones) {
      if (metric.followers >= milestone) {
        // Check if this is a new milestone
        const existing = await this.supabase
          .from('achievements')
          .select('id')
          .eq('artist_id', metric.artist_id)
          .eq('type', 'milestone')
          .eq('name', `${milestone}_followers_${metric.platform}`)
          .single()
        
        if (!existing.data) {
          milestones.push({
            type: 'follower_milestone',
            platform: metric.platform,
            value: milestone,
            message: `Congratulations! You've reached ${milestone.toLocaleString()} followers on ${metric.platform}!`
          })
          
          // Record achievement
          await this.supabase
            .from('achievements')
            .insert({
              artist_id: metric.artist_id,
              type: 'milestone',
              name: `${milestone}_followers_${metric.platform}`,
              description: `Reached ${milestone} followers on ${metric.platform}`,
              unlocked_at: new Date().toISOString(),
              metadata: { platform: metric.platform, follower_count: metric.followers }
            })
        }
      }
    }
    
    // Growth rate milestones
    if (derived.weekOverWeek > 25) {
      milestones.push({
        type: 'growth_surge',
        platform: metric.platform,
        value: derived.weekOverWeek,
        message: `Amazing growth! You're up ${derived.weekOverWeek.toFixed(1)}% this week on ${metric.platform}!`
      })
    }
    
    // Engagement milestones
    if (metric.engagement_rate > 10) {
      milestones.push({
        type: 'high_engagement',
        platform: metric.platform, 
        value: metric.engagement_rate,
        message: `Incredible engagement! ${metric.engagement_rate.toFixed(1)}% engagement rate on ${metric.platform}!`
      })
    }
    
    return milestones
  }

  private async updateDashboardCache(artistId: string, data: any) {
    // Update Redis cache for real-time dashboard
    const cacheKey = `dashboard:${artistId}`
    const currentCache = await this.redis.get(cacheKey)
    const dashboardData = currentCache ? JSON.parse(currentCache) : {}
    
    // Update platform-specific data
    dashboardData[data.platform] = {
      ...data,
      lastUpdated: new Date().toISOString()
    }
    
    // Calculate overall metrics
    dashboardData.summary = this.calculateSummaryMetrics(dashboardData)
    
    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(dashboardData))
    
    // Push update to connected clients via Supabase Realtime
    await this.supabase
      .from('artist_dashboard_updates')
      .insert({
        artist_id: artistId,
        data: dashboardData,
        updated_at: new Date().toISOString()
      })
  }

  private calculateSummaryMetrics(platformData: any): SummaryMetrics {
    const platforms = Object.keys(platformData).filter(key => key !== 'summary')
    
    const totalFollowers = platforms.reduce((sum, platform) => {
      return sum + (platformData[platform].followers || 0)
    }, 0)
    
    const avgEngagementRate = platforms.length > 0
      ? platforms.reduce((sum, platform) => {
          return sum + (platformData[platform].engagement_rate || 0)
        }, 0) / platforms.length
      : 0
    
    const totalReach = platforms.reduce((sum, platform) => {
      return sum + ((platformData[platform].content_views || 0) + (platformData[platform].streams || 0))
    }, 0)
    
    return {
      totalFollowers,
      avgEngagementRate,
      totalReach,
      activePlatforms: platforms.length,
      lastUpdated: new Date().toISOString()
    }
  }
}

// Data quality monitoring
export class DataQualityMonitor {
  private alertThresholds = {
    missingDataPoints: 0.05, // Alert if >5% of expected data is missing
    outlierDetection: 3, // Standard deviations for outlier detection
    staleness: 2 * 24 * 60 * 60 * 1000, // 2 days in milliseconds
  }

  async runQualityChecks(): Promise<QualityReport> {
    const report: QualityReport = {
      timestamp: new Date().toISOString(),
      checks: [],
      overallScore: 100,
      criticalIssues: [],
    }

    // Check for missing data points
    const missingDataCheck = await this.checkMissingData()
    report.checks.push(missingDataCheck)
    
    // Check for outliers
    const outlierCheck = await this.checkOutliers()
    report.checks.push(outlierCheck)
    
    // Check data staleness
    const stalenessCheck = await this.checkStaleness()
    report.checks.push(stalenessCheck)
    
    // Calculate overall score
    report.overallScore = report.checks.reduce((sum, check) => sum + check.score, 0) / report.checks.length
    
    // Identify critical issues
    report.criticalIssues = report.checks
      .filter(check => check.score < 70)
      .map(check => check.description)
    
    // Send alerts if needed
    if (report.overallScore < 85 || report.criticalIssues.length > 0) {
      await this.sendQualityAlert(report)
    }
    
    return report
  }

  private async checkMissingData(): Promise<QualityCheck> {
    // Check if we're missing expected metrics for active artists
    const activeArtists = await this.supabase
      .from('artists')
      .select('id')
      .eq('subscription_status', 'active')
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]
    
    const expectedDataPoints = activeArtists.data!.length * 6 // 6 platforms per artist
    
    const actualDataPoints = await this.supabase
      .from('metrics')
      .select('id', { count: 'exact' })
      .eq('metric_date', dateStr)
    
    const missingPercentage = 1 - (actualDataPoints.count! / expectedDataPoints)
    const score = Math.max(0, 100 - (missingPercentage * 500)) // Penalize heavily for missing data
    
    return {
      name: 'Missing Data Points',
      score,
      description: `${(missingPercentage * 100).toFixed(1)}% of expected data points are missing`,
      details: {
        expected: expectedDataPoints,
        actual: actualDataPoints.count,
        missing: expectedDataPoints - actualDataPoints.count!
      }
    }
  }
  
  private async sendQualityAlert(report: QualityReport) {
    // Send Slack notification
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '⚠️ Data Quality Alert',
        attachments: [{
          color: report.overallScore < 70 ? 'danger' : 'warning',
          fields: [
            {
              title: 'Overall Score',
              value: `${report.overallScore.toFixed(1)}%`,
              short: true
            },
            {
              title: 'Critical Issues',
              value: report.criticalIssues.join('\n') || 'None',
              short: true
            }
          ]
        }]
      })
    })
    
    // Log to monitoring service
    console.error('Data quality alert:', report)
  }
}
```
```

### 6. Security & Compliance Specialist
**Expertise**: Application security, data privacy, and regulatory compliance

```markdown
# Security & Compliance Agent

## Responsibilities
- Application security assessment and hardening
- Data privacy and GDPR/CCPA compliance
- Authentication and authorization security
- API security and rate limiting
- Security incident response and monitoring
- Penetration testing and vulnerability management

## Key Principles
1. **Security by Design**: Build security into every component from the start
2. **Zero Trust**: Never trust, always verify
3. **Data Privacy**: Minimize data collection, maximize user control
4. **Compliance**: Meet all regulatory requirements (GDPR, CCPA, SOX)
5. **Incident Response**: Fast detection and response to security events

## Security Implementation Checklist

### Authentication & Authorization Security
```typescript
// hooks/useSecureAuth.ts - Enhanced authentication with security features
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Platform } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'

export function useSecureAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  useEffect(() => {
    // Check for existing session with security validation
    checkSecureSession()
    
    // Setup session monitoring
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Log authentication events for security monitoring
        await logSecurityEvent('auth_state_change', { event, userId: session?.user?.id })
        
        if (session) {
          await validateSessionSecurity(session)
          setUser(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkSecureSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        await logSecurityEvent('session_validation_error', { error: error.message })
        throw error
      }
      
      if (session) {
        // Validate session hasn't been tampered with
        const isValid = await validateSessionIntegrity(session)
        if (!isValid) {
          await signOut()
          throw new Error('Session integrity check failed')
        }
        
        setUser(session.user)
      }
    } catch (error) {
      console.error('Secure session check failed:', error)
      await signOut() // Force sign out on any security concern
    } finally {
      setLoading(false)
    }
  }

  const signInWithBiometrics = async (email: string, password: string) => {
    try {
      // Check if biometrics are available
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      
      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication not available')
      }
      
      // Authenticate with biometrics first
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to Dream Suite',
        fallbackLabel: 'Use password instead',
        disableDeviceFallback: false,
      })
      
      if (!biometricResult.success) {
        throw new Error('Biometric authentication failed')
      }
      
      // Proceed with Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      // Store encrypted credentials for future biometric signin
      await SecureStore.setItemAsync('biometric_enabled', 'true')
      setBiometricEnabled(true)
      
      await logSecurityEvent('biometric_signin_success', { userId: data.user?.id })
      
      return data
      
    } catch (error) {
      await logSecurityEvent('biometric_signin_failed', { error: error.message })
      throw error
    }
  }

  const validateSessionSecurity = async (session: any) => {
    // Check session age
    const sessionAge = Date.now() - new Date(session.expires_at * 1000).getTime()
    const maxSessionAge = 24 * 60 * 60 * 1000 // 24 hours
    
    if (sessionAge > maxSessionAge) {
      await logSecurityEvent('session_expired', { userId: session.user.id })
      await signOut()
      return false
    }
    
    // Check for suspicious activity patterns
    const suspiciousActivity = await checkSuspiciousActivity(session.user.id)
    if (suspiciousActivity) {
      await logSecurityEvent('suspicious_activity_detected', { 
        userId: session.user.id,
        activity: suspiciousActivity 
      })
      // Could trigger additional verification steps here
    }
    
    return true
  }

  return {
    user,
    loading,
    biometricEnabled,
    signInWithBiometrics,
    // ... other auth methods
  }
}

// Security event logging
async function logSecurityEvent(event: string, data: any) {
  try {
    await supabase
      .from('security_events')
      .insert({
        event_type: event,
        event_data: data,
        ip_address: await getCurrentIP(),
        user_agent: Platform.OS,
        timestamp: new Date().toISOString(),
      })
  } catch (error) {
    // Failsafe: log to external service if database fails
    console.error('Failed to log security event:', error)
  }
}
```

### Data Privacy & GDPR Compliance
```sql
-- Security-focused database schema additions
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  artist_id UUID REFERENCES artists(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for security monitoring
  INDEX idx_security_events_type_time ON security_events(event_type, timestamp DESC),
  INDEX idx_security_events_artist ON security_events(artist_id, timestamp DESC)
);

-- Data retention policies (GDPR compliance)
CREATE TABLE data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert retention policies
INSERT INTO data_retention_policies (table_name, retention_days) VALUES
('security_events', 90),
('metrics', 1095), -- 3 years for analytics
('insights', 365), -- 1 year
('tasks', 365);

-- Data anonymization for deleted users
CREATE OR REPLACE FUNCTION anonymize_user_data(user_id UUID) 
RETURNS void AS $$
BEGIN
  -- Anonymize personal data while preserving analytics
  UPDATE artists SET
    email = 'deleted-' || user_id::text || '@anonymized.com',
    name = 'Deleted User',
    avatar_url = NULL,
    stripe_customer_id = NULL,
    push_token = NULL,
    preferences = '{}',
    metadata = '{"anonymized": true, "deleted_at": "' || NOW()::text || '"}'
  WHERE id = user_id;
  
  -- Remove sensitive insights
  UPDATE insights SET
    title = 'Anonymized',
    description = 'User data has been anonymized',
    recommendations = '[]'
  WHERE artist_id = user_id;
  
  -- Log the anonymization
  INSERT INTO security_events (event_type, event_data, artist_id) VALUES
  ('user_data_anonymized', '{"reason": "user_deletion_request"}', user_id);
END;
$$ LANGUAGE plpgsql;
```

### API Security & Rate Limiting
```typescript
// middleware/security.ts
import { rateLimit } from 'express-rate-limit'
import { Request, Response, NextFunction } from 'express'
import { createHash } from 'crypto'

// Rate limiting configuration
export const createRateLimiter = (config: {
  windowMs: number,
  max: number,
  message: string,
  skipSuccessfulRequests?: boolean
}) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: { error: config.message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    
    // Custom key generator for more sophisticated rate limiting
    keyGenerator: (req: Request) => {
      // Combine IP and user ID for authenticated requests
      const ip = req.ip || req.connection.remoteAddress
      const userId = req.user?.id
      return userId ? `${userId}:${ip}` : ip
    },
    
    // Custom skip function for premium users
    skip: (req: Request) => {
      // Premium users get higher limits
      return req.user?.subscription_status === 'active' && config.max < 1000
    }
  })
}

// Security middleware
export const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Request signature validation
  const expectedSignature = createRequestSignature(req)
  const providedSignature = req.headers['x-request-signature'] as string
  
  if (req.path.startsWith('/api/webhook/') && !verifySignature(expectedSignature, providedSignature)) {
    return res.status(401).json({ error: 'Invalid request signature' })
  }
  
  // 2. Content Security Policy headers
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.supabase.com https://api.stripe.com;"
  )
  
  // 3. Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // 4. Input validation headers
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.headers['content-type']?.includes('application/json')) {
      return res.status(400).json({ error: 'Content-Type must be application/json' })
    }
    
    // Limit request size
    const contentLength = parseInt(req.headers['content-length'] || '0')
    if (contentLength > 1024 * 1024) { // 1MB limit
      return res.status(413).json({ error: 'Request too large' })
    }
  }
  
  next()
}

// Input sanitization
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove potential XSS vectors
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace/on\w+\s*=/gi, '')
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

// SQL injection prevention
export const validateSQLQuery = (query: string): boolean => {
  const dangerousPatterns = [
    /(\bDROP\b|\bDELETE\b|\bTRUNCATE\b|\bALTER\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bOR\b.*=.*)/i,
    /(--|\*\/|\bEXEC\b|\bEXECUTE\b)/i,
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(query))
}
```

### Security Monitoring & Incident Response
```typescript
// services/security-monitor.ts
export class SecurityMonitor {
  private alertThresholds = {
    failedLogins: 5, // per 15 minutes
    suspiciousQueries: 10, // per hour
    dataExfiltration: 1000, // records per hour
    apiAbuseRate: 100, // requests per minute
  }

  async monitorSecurity() {
    // Run every 5 minutes
    setInterval(async () => {
      await Promise.all([
        this.checkFailedLogins(),
        this.checkSuspiciousQueries(),
        this.checkDataExfiltration(),
        this.checkAPIAbuse(),
        this.checkUnusualPatterns(),
      ])
    }, 5 * 60 * 1000)
  }

  private async checkFailedLogins() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    
    const { count } = await supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .eq('event_type', 'auth_failure')
      .gte('timestamp', fifteenMinutesAgo.toISOString())
    
    if (count! > this.alertThresholds.failedLogins) {
      await this.triggerSecurityAlert('high_failed_login_rate', {
        count,
        threshold: this.alertThresholds.failedLogins,
        timeWindow: '15 minutes'
      })
    }
  }

  private async checkSuspiciousQueries() {
    // Look for SQL injection attempts, unusual query patterns
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const suspiciousEvents = await supabase
      .from('security_events')
      .select('*')
      .in('event_type', ['suspicious_query', 'injection_attempt'])
      .gte('timestamp', oneHourAgo.toISOString())
    
    if (suspiciousEvents.data!.length > this.alertThresholds.suspiciousQueries) {
      await this.triggerSecurityAlert('suspicious_query_pattern', {
        eventCount: suspiciousEvents.data!.length,
        events: suspiciousEvents.data!.slice(0, 10) // Sample
      })
    }
  }

  private async checkUnusualPatterns() {
    // Machine learning-based anomaly detection
    const artists = await supabase
      .from('artists')
      .select('id, subscription_status')
      .eq('subscription_status', 'active')
    
    for (const artist of artists.data!) {
      const patterns = await this.analyzeUserPatterns(artist.id)
      
      if (patterns.anomalyScore > 0.8) {
        await this.triggerSecurityAlert('unusual_user_pattern', {
          artistId: artist.id,
          anomalyScore: patterns.anomalyScore,
          patterns: patterns.details
        })
      }
    }
  }

  private async triggerSecurityAlert(alertType: string, data: any) {
    // Log the alert
    await supabase
      .from('security_events')
      .insert({
        event_type: 'security_alert',
        event_data: { alertType, ...data },
        timestamp: new Date().toISOString()
      })
    
    // Send immediate notification
    await this.sendSecurityNotification(alertType, data)
    
    // Auto-respond based on alert type
    await this.autoRespondToThreat(alertType, data)
  }

  private async sendSecurityNotification(alertType: string, data: any) {
    // Send to Slack security channel
    await fetch(process.env.SECURITY_SLACK_WEBHOOK!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 SECURITY ALERT: ${alertType}`,
        attachments: [{
          color: 'danger',
          fields: [
            {
              title: 'Alert Type',
              value: alertType,
              short: true
            },
            {
              title: 'Severity',
              value: this.getAlertSeverity(alertType),
              short: true
            },
            {
              title: 'Details',
              value: JSON.stringify(data, null, 2).slice(0, 500),
              short: false
            }
          ],
          footer: 'Dream Suite Security Monitor',
          ts: Math.floor(Date.now() / 1000)
        }]
      })
    })
    
    // Send email to security team
    await this.sendSecurityEmail(alertType, data)
  }

  private async autoRespondToThreat(alertType: string, data: any) {
    switch (alertType) {
      case 'high_failed_login_rate':
        // Temporarily increase rate limits
        await this.increaseRateLimits()
        break
        
      case 'suspicious_query_pattern':
        // Block suspicious IPs
        await this.blockSuspiciousIPs(data)
        break
        
      case 'data_exfiltration_detected':
        // Immediately revoke access tokens
        await this.revokeActiveTokens(data.artistId)
        break
        
      case 'unusual_user_pattern':
        // Require re-authentication
        await this.requireReauth(data.artistId)
        break
    }
  }
}

// Compliance reporting
export class ComplianceReporter {
  async generateGDPRReport(artistId: string): Promise<GDPRReport> {
    // Collect all personal data for a user
    const [artist, metrics, insights, tasks, achievements] = await Promise.all([
      supabase.from('artists').select('*').eq('id', artistId).single(),
      supabase.from('metrics').select('*').eq('artist_id', artistId),
      supabase.from('insights').select('*').eq('artist_id', artistId),
      supabase.from('tasks').select('*').eq('artist_id', artistId),
      supabase.from('achievements').select('*').eq('artist_id', artistId),
    ])

    return {
      requestDate: new Date().toISOString(),
      artistId,
      personalData: {
        profile: artist.data,
        metrics: metrics.data,
        insights: insights.data,
        tasks: tasks.data,
        achievements: achievements.data,
      },
      dataProcessingActivities: [
        'Performance analytics and insights generation',
        'AI-powered career recommendations',
        'Social media metrics collection',
        'Subscription and payment processing',
        'Push notifications for engagement',
      ],
      legalBasisForProcessing: 'Legitimate interest in providing career development services',
      retentionPeriods: {
        profile: '3 years after account deletion',
        metrics: '3 years for analytics purposes',
        insights: '1 year after generation',
        tasks: '1 year after completion',
      },
      sharingPartners: [
        'Stripe (payment processing)',
        'Supabase (data hosting)',
        'Relevance AI (insights generation)',
        'Expo (push notifications)',
      ],
    }
  }

  async processDataDeletionRequest(artistId: string): Promise<void> {
    // 1. Anonymize instead of deleting for analytics integrity
    await supabase.rpc('anonymize_user_data', { user_id: artistId })
    
    // 2. Delete from external services
    await this.deleteFromStripe(artistId)
    await this.deleteFromRelevanceAI(artistId)
    
    // 3. Remove from caches
    await this.clearAllCaches(artistId)
    
    // 4. Log the deletion for compliance
    await supabase
      .from('security_events')
      .insert({
        event_type: 'gdpr_deletion_completed',
        event_data: { artistId, processedAt: new Date().toISOString() },
        artist_id: artistId,
      })
  }
}
```
```

### 7. Integration Specialist
**Expertise**: Third-party API integrations and webhook management

```markdown
# Integration Specialist Agent

## Responsibilities
- Social media API integration (Instagram, Spotify, TikTok, YouTube)
- Webhook management and event processing
- Third-party service authentication and token management
- API error handling and retry logic
- Integration monitoring and health checks
- Rate limit management and optimization

## Key Principles
1. **Reliability**: Robust error handling and automatic retries
2. **Efficiency**: Smart caching and batch processing
3. **Security**: Secure token storage and API authentication
4. **Scalability**: Handle thousands of artists with millions of API calls
5. **Monitoring**: Track API health, limits, and performance

## Social Media API Integration Architecture

### Instagram Graph API Integration
```typescript
// services/integrations/instagram.ts
export class InstagramIntegration {
  private baseURL = 'https://graph.instagram.com'
  private apiVersion = 'v19.0'
  private rateLimitTracker = new Map<string, RateLimit>()

  async connectAccount(artistId: string, accessToken: string): Promise<InstagramAccount> {
    try {
      // 1. Validate token and get account info
      const accountInfo = await this.getAccountInfo(accessToken)
      
      // 2. Store encrypted token
      await this.storeAccessToken(artistId, 'instagram', accessToken, accountInfo.expires_in)
      
      // 3. Perform initial data sync
      const initialData = await this.performInitialSync(artistId, accessToken)
      
      // 4. Set up webhook subscription
      await this.setupWebhookSubscription(artistId, accessToken)
      
      return {
        platform: 'instagram',
        accountId: accountInfo.id,
        username: accountInfo.username,
        isConnected: true,
        lastSyncAt: new Date().toISOString(),
        initialData
      }
      
    } catch (error) {
      await this.logIntegrationError('instagram_connection_failed', { artistId, error })
      throw new IntegrationError('Failed to connect Instagram account', { error })
    }
  }

  async fetchUserMetrics(artistId: string): Promise<InstagramMetrics> {
    const accessToken = await this.getAccessToken(artistId, 'instagram')
    
    if (!accessToken) {
      throw new IntegrationError('Instagram access token not found', { artistId })
    }

    try {
      // Check rate limits before making request
      await this.checkRateLimit('instagram', artistId)
      
      // Fetch account insights
      const insights = await this.makeAPIRequest('/me/insights', {
        metric: 'follower_count,impressions,reach,profile_views',
        period: 'day',
        since: this.getYesterday(),
        until: this.getToday(),
        access_token: accessToken
      })
      
      // Fetch media insights for engagement calculation
      const mediaInsights = await this.getMediaInsights(accessToken)
      
      // Calculate derived metrics
      const metrics: InstagramMetrics = {
        followers: insights.data.find(m => m.name === 'follower_count')?.values[0]?.value || 0,
        impressions: insights.data.find(m => m.name === 'impressions')?.values[0]?.value || 0,
        reach: insights.data.find(m => m.name === 'reach')?.values[0]?.value || 0,
        profileViews: insights.data.find(m => m.name === 'profile_views')?.values[0]?.value || 0,
        engagementRate: this.calculateEngagementRate(mediaInsights),
        averageLikes: this.calculateAverageLikes(mediaInsights),
        averageComments: this.calculateAverageComments(mediaInsights),
        topPostTypes: this.analyzeTopPostTypes(mediaInsights),
        bestPostTimes: await this.analyzeBestPostTimes(artistId, accessToken),
        collectedAt: new Date().toISOString()
      }
      
      // Store metrics in database
      await this.storeMetrics(artistId, 'instagram', metrics)
      
      return metrics
      
    } catch (error) {
      if (this.isTokenExpired(error)) {
        await this.handleTokenRefresh(artistId, 'instagram')
        // Retry once after refresh
        return this.fetchUserMetrics(artistId)
      }
      
      await this.logIntegrationError('instagram_metrics_fetch_failed', { artistId, error })
      throw error
    }
  }

  private async makeAPIRequest(endpoint: string, params: any): Promise<any> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        url.searchParams.append(key, String(params[key]))
      }
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DreamSuite/1.0',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      
      if (response.status === 429) {
        // Rate limited - extract retry info
        const retryAfter = parseInt(response.headers.get('retry-after') || '300')
        throw new RateLimitError('Instagram API rate limit exceeded', { retryAfter })
      }
      
      if (response.status === 401) {
        throw new TokenError('Instagram access token expired or invalid')
      }
      
      throw new APIError(`Instagram API error: ${response.status}`, {
        status: response.status,
        data: errorData
      })
    }

    return response.json()
  }

  private async checkRateLimit(platform: string, artistId: string): Promise<void> {
    const key = `${platform}:${artistId}`
    const rateLimit = this.rateLimitTracker.get(key)
    
    if (rateLimit && rateLimit.resetTime > Date.now()) {
      if (rateLimit.remaining <= 0) {
        const waitTime = rateLimit.resetTime - Date.now()
        throw new RateLimitError(`Rate limit exceeded for ${platform}`, { waitTime })
      }
    }
  }

  private async setupWebhookSubscription(artistId: string, accessToken: string): Promise<void> {
    // Subscribe to Instagram webhooks for real-time updates
    const webhookURL = `${process.env.API_BASE_URL}/api/webhooks/instagram`
    
    try {
      await this.makeAPIRequest('/me/subscribed_apps', {
        subscribed_fields: 'media,mentions,story_insights',
        callback_url: webhookURL,
        verify_token: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
        access_token: accessToken
      })
      
      // Store webhook subscription info
      await supabase
        .from('webhook_subscriptions')
        .upsert({
          artist_id: artistId,
          platform: 'instagram',
          webhook_url: webhookURL,
          subscribed_fields: ['media', 'mentions', 'story_insights'],
          status: 'active',
          created_at: new Date().toISOString()
        })
        
    } catch (error) {
      console.warn('Failed to setup Instagram webhook:', error)
      // Non-critical failure - continue without webhooks
    }
  }
}

// Spotify API Integration
export class SpotifyIntegration {
  private baseURL = 'https://api.spotify.com/v1'
  private authURL = 'https://accounts.spotify.com/api/token'

  async fetchArtistMetrics(artistId: string): Promise<SpotifyMetrics> {
    const accessToken = await this.getAccessToken(artistId, 'spotify')
    
    if (!accessToken) {
      throw new IntegrationError('Spotify access token not found', { artistId })
    }

    try {
      // Get artist profile
      const profile = await this.makeAPIRequest('/me', accessToken)
      
      // Get artist's tracks and their analytics
      const tracks = await this.getArtistTracks(accessToken)
      const audioFeatures = await this.getAudioFeatures(tracks.map(t => t.id), accessToken)
      
      // Get playlists the artist is featured in
      const playlists = await this.searchPlaylists(profile.display_name, accessToken)
      
      // Calculate metrics
      const metrics: SpotifyMetrics = {
        followers: profile.followers?.total || 0,
        monthlyListeners: await this.getMonthlyListeners(profile.id, accessToken),
        totalStreams: tracks.reduce((sum, track) => sum + (track.popularity || 0), 0),
        topTracks: tracks
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 10)
          .map(track => ({
            id: track.id,
            name: track.name,
            popularity: track.popularity,
            streams: track.popularity * 1000, // Estimate
            releaseDate: track.album.release_date
          })),
        playlistPlacements: playlists.length,
        audioFeatureAverages: this.calculateAudioFeatureAverages(audioFeatures),
        genreDistribution: this.analyzeGenres(tracks),
        collectedAt: new Date().toISOString()
      }
      
      await this.storeMetrics(artistId, 'spotify', metrics)
      
      return metrics
      
    } catch (error) {
      if (this.isTokenExpired(error)) {
        await this.handleTokenRefresh(artistId, 'spotify')
        return this.fetchArtistMetrics(artistId)
      }
      
      throw error
    }
  }

  private async handleTokenRefresh(artistId: string, platform: string): Promise<string> {
    const refreshToken = await this.getRefreshToken(artistId, platform)
    
    if (!refreshToken) {
      throw new IntegrationError('No refresh token available', { artistId, platform })
    }

    try {
      const response = await fetch(this.authURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      const tokenData = await response.json()
      
      // Store new access token
      await this.storeAccessToken(artistId, platform, tokenData.access_token, tokenData.expires_in)
      
      // Update refresh token if provided
      if (tokenData.refresh_token) {
        await this.storeRefreshToken(artistId, platform, tokenData.refresh_token)
      }
      
      return tokenData.access_token
      
    } catch (error) {
      // Mark integration as disconnected
      await this.markIntegrationDisconnected(artistId, platform, 'token_refresh_failed')
      throw new IntegrationError('Failed to refresh access token', { artistId, platform, error })
    }
  }
}
```

### Webhook Management System
```typescript
// services/webhook-manager.ts
export class WebhookManager {
  private processors = new Map<string, WebhookProcessor>()
  private retryQueue = new Queue('webhook-retries')

  constructor() {
    // Register webhook processors
    this.processors.set('stripe', new StripeWebhookProcessor())
    this.processors.set('instagram', new InstagramWebhookProcessor())
    this.processors.set('spotify', new SpotifyWebhookProcessor())
    this.processors.set('tiktok', new TikTokWebhookProcessor())
  }

  async processWebhook(platform: string, payload: any, signature: string): Promise<void> {
    const processor = this.processors.get(platform)
    
    if (!processor) {
      throw new WebhookError(`No processor found for platform: ${platform}`)
    }

    try {
      // 1. Verify webhook signature
      const isValid = await processor.verifySignature(payload, signature)
      if (!isValid) {
        throw new WebhookError('Invalid webhook signature', { platform })
      }

      // 2. Parse webhook payload
      const event = await processor.parseEvent(payload)
      
      // 3. Check for duplicate events
      const isDuplicate = await this.checkDuplicate(platform, event.id)
      if (isDuplicate) {
        console.log(`Duplicate webhook ignored: ${platform}:${event.id}`)
        return
      }

      // 4. Process the event
      await processor.processEvent(event)
      
      // 5. Mark as processed
      await this.markProcessed(platform, event.id)
      
    } catch (error) {
      console.error(`Webhook processing failed: ${platform}`, error)
      
      // Add to retry queue if retryable error
      if (this.isRetryableError(error)) {
        await this.retryQueue.add('process-webhook', {
          platform,
          payload,
          signature,
          attempt: 1,
          maxAttempts: 3
        }, {
          delay: 5000, // 5 second delay
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        })
      }
      
      throw error
    }
  }

  private async checkDuplicate(platform: string, eventId: string): Promise<boolean> {
    const { data } = await supabase
      .from('processed_webhooks')
      .select('id')
      .eq('platform', platform)
      .eq('event_id', eventId)
      .single()
    
    return !!data
  }

  private async markProcessed(platform: string, eventId: string): Promise<void> {
    await supabase
      .from('processed_webhooks')
      .insert({
        platform,
        event_id: eventId,
        processed_at: new Date().toISOString(),
        status: 'success'
      })
  }
}

// Instagram webhook processor
class InstagramWebhookProcessor implements WebhookProcessor {
  async verifySignature(payload: string, signature: string): Promise<boolean> {
    const expectedSignature = createHmac('sha1', process.env.INSTAGRAM_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex')
    
    return signature === `sha1=${expectedSignature}`
  }

  async parseEvent(payload: any): Promise<WebhookEvent> {
    const changes = payload.entry?.[0]?.changes || []
    
    return {
      id: `instagram_${Date.now()}_${Math.random()}`,
      platform: 'instagram',
      type: this.getEventType(changes),
      data: changes,
      timestamp: new Date().toISOString()
    }
  }

  async processEvent(event: WebhookEvent): Promise<void> {
    for (const change of event.data) {
      if (change.field === 'media') {
        await this.handleMediaUpdate(change.value)
      } else if (change.field === 'mentions') {
        await this.handleMentions(change.value)
      } else if (change.field === 'story_insights') {
        await this.handleStoryInsights(change.value)
      }
    }
  }

  private async handleMediaUpdate(mediaData: any): Promise<void> {
    // New media posted - trigger immediate metrics update
    const artistId = await this.getArtistIdByInstagramAccount(mediaData.id)
    
    if (artistId) {
      // Queue immediate metrics collection
      await this.queueMetricsCollection(artistId, 'instagram', 'new_media')
      
      // Trigger AI analysis for new content
      await this.triggerContentAnalysis(artistId, mediaData)
    }
  }
}

// Integration health monitoring
export class IntegrationHealthMonitor {
  async checkAllIntegrationsHealth(): Promise<HealthReport> {
    const platforms = ['instagram', 'spotify', 'tiktok', 'youtube']
    const healthChecks = await Promise.allSettled(
      platforms.map(platform => this.checkPlatformHealth(platform))
    )

    const report: HealthReport = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      platforms: {},
      issues: []
    }

    healthChecks.forEach((result, index) => {
      const platform = platforms[index]
      
      if (result.status === 'fulfilled') {
        report.platforms[platform] = result.value
      } else {
        report.platforms[platform] = {
          status: 'error',
          error: result.reason.message,
          lastChecked: new Date().toISOString()
        }
        report.issues.push(`${platform}: ${result.reason.message}`)
      }
    })

    // Determine overall health
    const errorCount = Object.values(report.platforms).filter(p => p.status === 'error').length
    if (errorCount > 0) {
      report.overall = errorCount === platforms.length ? 'critical' : 'degraded'
    }

    // Send alerts if needed
    if (report.overall !== 'healthy') {
      await this.sendHealthAlert(report)
    }

    return report
  }

  private async checkPlatformHealth(platform: string): Promise<PlatformHealth> {
    const start = Date.now()
    
    try {
      // Test API connectivity
      await this.testAPIConnectivity(platform)
      
      // Check recent error rates
      const errorRate = await this.getRecentErrorRate(platform)
      
      // Check rate limit status
      const rateLimitStatus = await this.getRateLimitStatus(platform)
      
      const responseTime = Date.now() - start
      
      return {
        status: errorRate > 0.1 ? 'warning' : 'healthy',
        responseTime,
        errorRate,
        rateLimitStatus,
        lastChecked: new Date().toISOString()
      }
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString()
      }
    }
  }

  private async testAPIConnectivity(platform: string): Promise<void> {
    const testEndpoints = {
      instagram: 'https://graph.instagram.com/me?fields=id',
      spotify: 'https://api.spotify.com/v1/me',
      tiktok: 'https://open-api.tiktok.com/user/info/',
      youtube: 'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true'
    }

    const endpoint = testEndpoints[platform]
    if (!endpoint) return

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${await this.getTestToken(platform)}`
      },
      timeout: 10000
    })

    if (!response.ok) {
      throw new Error(`API connectivity test failed: ${response.status}`)
    }
  }
}
```
```

### 8. Performance & Monitoring Specialist
**Expertise**: Application performance optimization and monitoring

```markdown
# Performance & Monitoring Agent

## Responsibilities
- React Native performance optimization
- Database query optimization and monitoring
- Real-time monitoring and alerting
- Error tracking and analysis
- User experience metrics and improvement
- Cost optimization for cloud services

## Key Principles
1. **Performance First**: Every feature must meet performance requirements
2. **Real-time Monitoring**: Proactive issue detection and resolution
3. **User Experience**: Optimize for actual user behavior and devices
4. **Cost Efficiency**: Balance performance with operational costs
5. **Data-Driven**: Make optimization decisions based on actual metrics

## React Native Performance Optimization

### Bundle Size and Startup Optimization
```typescript
// metro.config.js - Optimized for React Native
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Tree shaking optimization
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
  compress: {
    drop_console: process.env.NODE_ENV === 'production',
  },
}

// Bundle splitting for better loading
config.serializer.customSerializer = require('@rnx-kit/metro-serializer-esbuild')({
  strictMode: true,
  minify: process.env.NODE_ENV === 'production',
  target: 'es2018',
})

module.exports = config

// app.json - Performance optimizations
{
  "expo": {
    "optimization": {
      "web": {
        "bundler": "metro"
      }
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "flipper": false, // Disable in production
            "newArchEnabled": true, // Enable new architecture
          },
          "android": {
            "newArchEnabled": true,
            "enableProguardInReleaseBuilds": true,
            "enableSeparateBuildPerCPUArchitecture": true,
            "universalApk": false
          }
        }
      ]
    ]
  }
}
```

### Component Performance Optimization
```typescript
// components/OptimizedDashboard.tsx
import React, { memo, useMemo, useCallback, Suspense } from 'react'
import { FlatList, View, StyleSheet } from 'react-native'
import { FlashList } from '@shopify/flash-list'

// Lazy load heavy components
const GrowthChart = React.lazy(() => import('./charts/GrowthChart'))
const InsightsFeed = React.lazy(() => import('./insights/InsightsFeed'))

interface OptimizedDashboardProps {
  metrics: Metric[]
  insights: Insight[]
  onRefresh: () => Promise<void>
}

export const OptimizedDashboard = memo<OptimizedDashboardProps>(({ 
  metrics, 
  insights, 
  onRefresh 
}) => {
  // Memoize expensive calculations
  const processedMetrics = useMemo(() => {
    return metrics
      .filter(metric => metric.followers > 0)
      .sort((a, b) => new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime())
      .slice(0, 30) // Limit to last 30 days for performance
  }, [metrics])

  // Memoize callbacks to prevent unnecessary re-renders
  const renderMetricCard = useCallback(({ item, index }: { item: Metric, index: number }) => (
    <MetricCard 
      key={`${item.platform}_${item.metric_date}`}
      metric={item}
      index={index}
    />
  ), [])

  const keyExtractor = useCallback((item: Metric) => `${item.platform}_${item.metric_date}`, [])

  return (
    <View style={styles.container}>
      {/* Use FlashList for better performance with large datasets */}
      <FlashList
        data={processedMetrics}
        renderItem={renderMetricCard}
        keyExtractor={keyExtractor}
        estimatedItemSize={120}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        onRefresh={onRefresh}
        refreshing={false}
        // Performance optimizations
        getItemType={(item) => item.platform}
        overrideItemLayout={(layout, item) => {
          layout.size = 120 // Fixed height for better scrolling performance
        }}
      />

      {/* Lazy load heavy components */}
      <Suspense fallback={<ChartSkeleton />}>
        <GrowthChart data={processedMetrics} />
      </Suspense>

      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsFeed insights={insights} />
      </Suspense>
    </View>
  )
})

// Memoized metric card with performance optimizations
const MetricCard = memo<{ metric: Metric, index: number }>(({ metric, index }) => {
  // Use React.memo with custom comparison for complex objects
  const cardStyle = useMemo(() => [
    styles.card,
    // Add subtle animation delay based on index
    { transform: [{ translateY: index * -2 }] }
  ], [index])

  return (
    <View style={cardStyle}>
      <Text style={styles.platform}>{metric.platform}</Text>
      <Text style={styles.followers}>{metric.followers.toLocaleString()}</Text>
      <Text style={styles.engagement}>{metric.engagement_rate.toFixed(1)}%</Text>
    </View>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.metric.platform === nextProps.metric.platform &&
    prevProps.metric.followers === nextProps.metric.followers &&
    prevProps.metric.engagement_rate === nextProps.metric.engagement_rate &&
    prevProps.index === nextProps.index
  )
})

// Performance monitoring hook
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Monitor JS thread performance
    const jsTimer = setInterval(() => {
      const start = performance.now()
      setTimeout(() => {
        const jsDelay = performance.now() - start
        if (jsDelay > 100) { // More than 100ms delay indicates performance issues
          console.warn('JS thread performance degraded:', jsDelay + 'ms')
          // Send to monitoring service
          Analytics.track('js_thread_performance', { delay: jsDelay })
        }
      }, 0)
    }, 5000)

    return () => clearInterval(jsTimer)
  }, [])
}
```

### Database Performance Optimization
```sql
-- Performance-optimized database schema with proper indexing
-- metrics table optimizations
CREATE INDEX CONCURRENTLY idx_metrics_artist_platform_date 
ON metrics(artist_id, platform, metric_date DESC);

CREATE INDEX CONCURRENTLY idx_metrics_engagement 
ON metrics(engagement_rate) WHERE engagement_rate > 0;

CREATE INDEX CONCURRENTLY idx_metrics_followers_growth
ON metrics(artist_id, followers) WHERE followers > 1000;

-- Partial indexes for active artists only
CREATE INDEX CONCURRENTLY idx_active_artists_metrics
ON metrics(artist_id, metric_date DESC)
WHERE artist_id IN (
  SELECT id FROM artists WHERE subscription_status = 'active'
);

-- Materialized view for dashboard performance
CREATE MATERIALIZED VIEW artist_dashboard_summary AS
SELECT 
  a.id as artist_id,
  a.name,
  a.subscription_status,
  COALESCE(total_followers.followers, 0) as total_followers,
  COALESCE(avg_engagement.engagement_rate, 0) as avg_engagement_rate,
  COALESCE(growth_rate.weekly_growth, 0) as weekly_growth_rate,
  CURRENT_TIMESTAMP as last_updated
FROM artists a
LEFT JOIN (
  -- Total followers across all platforms
  SELECT 
    artist_id,
    SUM(followers) as followers
  FROM metrics m1
  WHERE metric_date = (
    SELECT MAX(metric_date) 
    FROM metrics m2 
    WHERE m2.artist_id = m1.artist_id 
    AND m2.platform = m1.platform
  )
  GROUP BY artist_id
) total_followers ON a.id = total_followers.artist_id
LEFT JOIN (
  -- Average engagement rate
  SELECT 
    artist_id,
    AVG(engagement_rate) as engagement_rate
  FROM metrics m1
  WHERE metric_date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY artist_id
) avg_engagement ON a.id = avg_engagement.artist_id
LEFT JOIN (
  -- Weekly growth rate
  SELECT 
    m1.artist_id,
    (SUM(m1.followers) - SUM(m2.followers)) / NULLIF(SUM(m2.followers), 0) * 100 as weekly_growth
  FROM metrics m1
  JOIN metrics m2 ON m1.artist_id = m2.artist_id AND m1.platform = m2.platform
  WHERE m1.metric_date = CURRENT_DATE - INTERVAL '1 day'
    AND m2.metric_date = CURRENT_DATE - INTERVAL '8 days'
  GROUP BY m1.artist_id
) growth_rate ON a.id = growth_rate.artist_id
WHERE a.subscription_status = 'active';

-- Refresh materialized view efficiently
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY artist_dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- Scheduled refresh (every 15 minutes during business hours)
SELECT cron.schedule('refresh-dashboard', '*/15 8-20 * * *', 'SELECT refresh_dashboard_summary();');

-- Query optimization for common dashboard queries
PREPARE dashboard_query(UUID) AS
SELECT * FROM artist_dashboard_summary WHERE artist_id = $1;

-- Connection pooling settings in Supabase
-- These should be configured in the Supabase dashboard
/*
Pool Size: 20 (for production)
Pool Timeout: 10s
Max Lifetime: 1 hour
Idle Timeout: 10 minutes
*/
```

### Real-time Monitoring Setup
```typescript
// services/monitoring.ts
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map()
  private alerts: AlertManager
  private analytics: Analytics

  constructor() {
    this.alerts = new AlertManager()
    this.analytics = new Analytics()
    this.startMonitoring()
  }

  private startMonitoring() {
    // Monitor API response times
    this.monitorAPIPerformance()
    
    // Monitor database performance
    this.monitorDatabasePerformance()
    
    // Monitor React Native performance
    this.monitorAppPerformance()
    
    // Monitor user experience metrics
    this.monitorUserExperience()
  }

  private async monitorAPIPerformance() {
    setInterval(async () => {
      const endpoints = [
        '/api/metrics',
        '/api/insights', 
        '/api/tasks',
        '/api/achievements'
      ]

      for (const endpoint of endpoints) {
        const start = performance.now()
        
        try {
          const response = await fetch(endpoint, {
            method: 'HEAD', // Lightweight request
            timeout: 5000
          })
          
          const responseTime = performance.now() - start
          
          // Track metrics
          this.metrics.set(`api_response_time_${endpoint}`, responseTime)
          
          // Alert on slow responses
          if (responseTime > 1000) {
            await this.alerts.send('slow_api_response', {
              endpoint,
              responseTime,
              threshold: 1000
            })
          }
          
        } catch (error) {
          // Track failures
          this.metrics.set(`api_failures_${endpoint}`, 1)
          
          await this.alerts.send('api_failure', {
            endpoint,
            error: error.message
          })
        }
      }
    }, 60000) // Every minute
  }

  private async monitorDatabasePerformance() {
    setInterval(async () => {
      try {
        // Check connection pool status
        const { data: poolStats } = await supabase.rpc('get_connection_stats')
        
        if (poolStats?.active_connections > 15) { // 75% of pool size
          await this.alerts.send('high_db_connections', {
            active: poolStats.active_connections,
            max: 20
          })
        }
        
        // Check for slow queries
        const { data: slowQueries } = await supabase.rpc('get_slow_queries', { 
          threshold_ms: 1000 
        })
        
        if (slowQueries && slowQueries.length > 0) {
          await this.alerts.send('slow_db_queries', {
            count: slowQueries.length,
            queries: slowQueries.slice(0, 5) // Sample
          })
        }
        
      } catch (error) {
        console.error('Database monitoring error:', error)
      }
    }, 300000) // Every 5 minutes
  }

  private monitorAppPerformance() {
    // Monitor JS thread performance
    let jsThreadBlocked = false
    
    setInterval(() => {
      const start = Date.now()
      
      setTimeout(() => {
        const delay = Date.now() - start
        
        if (delay > 100 && !jsThreadBlocked) {
          jsThreadBlocked = true
          this.analytics.track('js_thread_blocked', { delay })
          
          // Auto-recover by triggering GC if possible
          if (global.gc) {
            global.gc()
          }
          
          setTimeout(() => {
            jsThreadBlocked = false
          }, 5000)
        }
      }, 16) // 60fps = 16ms target
    }, 1000)
    
    // Monitor memory usage (React Native specific)
    if (Platform.OS !== 'web') {
      setInterval(() => {
        // @ts-ignore - React Native specific
        const memoryInfo = performance.memory || {}
        
        if (memoryInfo.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
          this.analytics.track('high_memory_usage', {
            used: memoryInfo.usedJSHeapSize,
            total: memoryInfo.totalJSHeapSize
          })
        }
      }, 30000)
    }
  }

  private monitorUserExperience() {
    // Track Core Web Vitals equivalent for React Native
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        switch (entry.entryType) {
          case 'navigation':
            // App startup time
            this.analytics.track('app_startup_time', {
              duration: entry.duration
            })
            break
            
          case 'measure':
            // Custom measurements
            if (entry.name.startsWith('screen_render_')) {
              this.analytics.track('screen_render_time', {
                screen: entry.name.replace('screen_render_', ''),
                duration: entry.duration
              })
            }
            break
        }
      })
    })
    
    observer.observe({ entryTypes: ['navigation', 'measure'] })
  }

  // Performance budget enforcement
  async checkPerformanceBudget(): Promise<BudgetReport> {
    const budget = {
      api_response_time: 500, // 500ms max
      screen_render_time: 200, // 200ms max
      js_bundle_size: 2048, // 2MB max
      memory_usage: 50 * 1024 * 1024, // 50MB max
      crash_rate: 0.001, // 0.1% max
    }

    const report: BudgetReport = {
      timestamp: new Date().toISOString(),
      budget,
      actual: {},
      violations: [],
      score: 100
    }

    // Collect actual metrics
    report.actual.api_response_time = this.getAverageMetric('api_response_time')
    report.actual.screen_render_time = this.getAverageMetric('screen_render_time')
    report.actual.js_bundle_size = await this.getBundleSize()
    report.actual.memory_usage = await this.getCurrentMemoryUsage()
    report.actual.crash_rate = await this.getCrashRate()

    // Check violations
    Object.keys(budget).forEach(metric => {
      if (report.actual[metric] > budget[metric]) {
        report.violations.push({
          metric,
          budget: budget[metric],
          actual: report.actual[metric],
          severity: this.calculateViolationSeverity(metric, budget[metric], report.actual[metric])
        })
      }
    })

    // Calculate score
    report.score = Math.max(0, 100 - (report.violations.length * 20))

    // Alert on budget violations
    if (report.violations.length > 0) {
      await this.alerts.send('performance_budget_violation', report)
    }

    return report
  }
}

// Error tracking and analysis
export class ErrorTracker {
  private errorQueue: Queue
  private patterns: Map<string, ErrorPattern> = new Map()

  constructor() {
    this.errorQueue = new Queue('error-processing')
    this.setupGlobalErrorHandling()
  }

  private setupGlobalErrorHandling() {
    // React Native global error handler
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.trackError(error, { isFatal, source: 'global' })
    })

    // Promise rejection handler
    const tracking = require('promise/lib/rejection-tracking')
    tracking.enable({
      allRejections: true,
      onUnhandled: (id, error) => {
        this.trackError(error, { source: 'promise', id })
      }
    })
  }

  async trackError(error: Error, context: any = {}) {
    try {
      // Generate error fingerprint
      const fingerprint = this.generateErrorFingerprint(error)
      
      // Check if this is a known pattern
      const pattern = this.patterns.get(fingerprint)
      if (pattern) {
        pattern.count++
        pattern.lastSeen = new Date()
        
        // Alert on error spikes
        if (pattern.count > pattern.alertThreshold) {
          await this.alerts.send('error_spike', {
            fingerprint,
            count: pattern.count,
            error: error.message
          })
        }
      } else {
        // New error pattern
        this.patterns.set(fingerprint, {
          fingerprint,
          message: error.message,
          stack: error.stack,
          count: 1,
          firstSeen: new Date(),
          lastSeen: new Date(),
          alertThreshold: 10,
          context
        })
      }
      
      // Store error for analysis
      await supabase
        .from('error_logs')
        .insert({
          fingerprint,
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString()
        })
      
      // Send to external service (Sentry, etc.)
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(error, {
          extra: context,
          fingerprint: [fingerprint]
        })
      }
      
    } catch (trackingError) {
      // Fail silently - don't break the app due to error tracking
      console.error('Error tracking failed:', trackingError)
    }
  }

  private generateErrorFingerprint(error: Error): string {
    // Create consistent fingerprint for grouping similar errors
    const message = error.message.replace(/\d+/g, 'X') // Replace numbers
    const stack = error.stack?.split('\n')[1]?.replace(/:\d+:\d+/g, ':X:X') // Replace line numbers
    
    return createHash('md5')
      .update(`${message}${stack}`)
      .digest('hex')
  }

  async getErrorAnalysis(): Promise<ErrorAnalysis> {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const { data: recentErrors } = await supabase
      .from('error_logs')
      .select('fingerprint, message, context')
      .gte('timestamp', oneDayAgo.toISOString())
    
    const analysis: ErrorAnalysis = {
      totalErrors: recentErrors?.length || 0,
      uniqueErrors: new Set(recentErrors?.map(e => e.fingerprint)).size,
      topErrors: this.getTopErrors(recentErrors || []),
      errorsByContext: this.groupByContext(recentErrors || []),
      trends: await this.calculateErrorTrends(),
      recommendations: this.generateRecommendations(recentErrors || [])
    }
    
    return analysis
  }
}
```

This completes the comprehensive agent configuration covering every aspect of Dream Suite development. Each agent provides:

1. **Specific expertise** in their domain
2. **Actionable code examples** and patterns
3. **Best practices** and error prevention
4. **Monitoring and alerting** capabilities
5. **Performance optimization** strategies
6. **Security and compliance** measures

These agents will ensure you build Dream Suite correctly the first time by providing expert guidance at every step of development.
