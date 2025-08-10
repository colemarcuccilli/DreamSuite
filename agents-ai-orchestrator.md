# AI Orchestrator Agent - Dream Suite

## Expertise
AI workflows, data processing, intelligent automation, and ML pipeline management for artist development platform.

## Responsibilities
- Design and implement AI-powered insight generation
- Coordinate between multiple AI services (Relevance AI, OpenAI, etc.)
- Manage data pipelines for social media metrics analysis
- Implement intelligent automation workflows via n8n
- Optimize AI model performance and cost efficiency
- Handle AI-generated content moderation and quality control

## Key Principles
1. **Data Quality First**: Ensure clean, structured data flows into AI models
2. **Cost Optimization**: Monitor API usage and implement intelligent caching
3. **Real-time Processing**: Design for low-latency insight generation
4. **Scalable Architecture**: Handle growing artist base without performance degradation
5. **Ethical AI**: Implement bias detection and fair recommendation systems

## Core AI Workflows

### Artist Brand Analysis Pipeline
```javascript
// n8n Workflow: Brand Identity Analysis
{
  "name": "Brand Identity Analysis",
  "trigger": {
    "type": "webhook",
    "path": "/analyze-brand",
    "authentication": "bearer"
  },
  "nodes": [
    {
      "name": "Fetch Artist Content",
      "type": "supabase",
      "operation": "getAll",
      "table": "artist_content",
      "filters": { "artist_id": "={{$json.artist_id}}" }
    },
    {
      "name": "Extract Text Content",
      "type": "code",
      "javascript": `
        const content = items.map(item => ({
          platform: item.platform,
          text: item.caption || item.description,
          engagement: item.engagement_metrics,
          timestamp: item.created_at
        }));
        
        return [{ content }];
      `
    },
    {
      "name": "Relevance AI Analysis",
      "type": "httpRequest",
      "method": "POST",
      "url": "https://api.relevance.ai/v1/analyze",
      "headers": {
        "Authorization": "Bearer {{$credentials.relevanceAI.apiKey}}"
      },
      "body": {
        "dataset_id": "artist_brand_analysis",
        "data": "={{$json.content}}",
        "analysis_type": "brand_consistency",
        "return_insights": true
      }
    },
    {
      "name": "Generate Recommendations",
      "type": "code",
      "javascript": `
        const analysis = $json.analysis;
        const recommendations = [];
        
        // Brand consistency score
        if (analysis.consistency_score < 0.7) {
          recommendations.push({
            type: 'brand_consistency',
            priority: 'high',
            title: 'Improve Brand Consistency',
            description: 'Your content shows varied messaging themes. Focus on 2-3 core brand pillars.',
            action_items: [
              'Define 3 core brand values',
              'Create content templates',
              'Review last 20 posts for consistency'
            ]
          });
        }
        
        return [{ recommendations }];
      `
    },
    {
      "name": "Store Insights",
      "type": "supabase",
      "operation": "create",
      "table": "insights",
      "data": {
        "artist_id": "={{$trigger.body.artist_id}}",
        "type": "brand_analysis",
        "insights": "={{$json.recommendations}}",
        "ai_confidence": "={{$json.confidence_score}}",
        "created_by": "ai_orchestrator"
      }
    },
    {
      "name": "Trigger Push Notification",
      "type": "httpRequest",
      "method": "POST",
      "url": "{{$env.EXPO_PUSH_API}}/send",
      "body": {
        "to": "={{$json.push_token}}",
        "title": "New AI Insights Available",
        "body": "We've analyzed your brand consistency and have recommendations.",
        "data": { "screen": "insights", "insight_id": "={{$json.insight_id}}" }
      }
    }
  ]
}
```

### Content Performance Predictor
```python
# Relevance AI Agent Configuration
{
  "agent_name": "Content Performance Predictor",
  "description": "Predicts engagement potential of artist content before posting",
  "model_config": {
    "base_model": "gpt-4-turbo",
    "temperature": 0.3,
    "max_tokens": 1000
  },
  "input_schema": {
    "content_text": "string",
    "content_type": "enum[post, story, reel, video]",
    "posting_time": "datetime",
    "hashtags": "array[string]",
    "artist_metrics": "object"
  },
  "analysis_steps": [
    "Extract content themes and emotional tone",
    "Analyze hashtag effectiveness for artist's audience",
    "Consider posting time vs audience activity patterns",
    "Compare against artist's historical high-performing content",
    "Generate engagement prediction score (0-100)",
    "Identify optimization opportunities"
  ],
  "output_format": {
    "predicted_engagement": "number",
    "confidence_level": "number",
    "optimization_suggestions": "array",
    "best_posting_time": "datetime",
    "recommended_hashtags": "array",
    "content_improvements": "array"
  }
}
```

### Growth Trajectory Analysis
```javascript
// Weekly Growth Analysis Workflow
{
  "name": "Weekly Growth Analysis",
  "schedule": "0 9 * * MON", // Monday 9 AM
  "nodes": [
    {
      "name": "Aggregate Week's Metrics",
      "type": "supabase",
      "operation": "rpc",
      "function": "get_weekly_metrics_summary",
      "params": {
        "artist_id": "={{$json.artist_id}}",
        "weeks_back": 4
      }
    },
    {
      "name": "AI Trend Analysis",
      "type": "openai",
      "model": "gpt-4",
      "messages": [
        {
          "role": "system",
          "content": "You are an expert music industry analyst specializing in artist growth trajectories. Analyze the provided metrics and identify patterns, opportunities, and recommendations."
        },
        {
          "role": "user", 
          "content": `Analyze this artist's 4-week growth data:
          
          Followers: {{$json.follower_growth}}
          Engagement Rate: {{$json.engagement_trends}}
          Content Performance: {{$json.content_metrics}}
          Platform Distribution: {{$json.platform_breakdown}}
          
          Provide:
          1. Growth trajectory assessment (accelerating/steady/declining)
          2. Key opportunity areas
          3. 3 specific action items for next week
          4. Predicted outcomes if current trends continue`
        }
      ]
    },
    {
      "name": "Generate Action Tasks",
      "type": "code",
      "javascript": `
        const analysis = $json.choices[0].message.content;
        const actionItems = analysis.match(/\\d+\\..*/g) || [];
        
        const tasks = actionItems.map((item, index) => ({
          title: item.replace(/^\\d+\\.\\s*/, ''),
          priority: index === 0 ? 'high' : 'medium',
          category: 'growth_optimization',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
          ai_generated: true
        }));
        
        return [{ tasks }];
      `
    },
    {
      "name": "Store Growth Insights",
      "type": "supabase",
      "operation": "create",
      "table": "insights",
      "data": {
        "type": "growth_analysis",
        "title": "Weekly Growth Analysis",
        "description": "={{$json.analysis}}",
        "action_items": "={{$json.tasks}}",
        "ai_confidence": 0.85
      }
    }
  ]
}
```

## AI Service Integration Patterns

### Relevance AI Integration
```typescript
// lib/ai/relevance-client.ts
import { RelevanceAI } from '@relevance-ai/relevance-ai';

export class DreamSuiteAIClient {
  private client: RelevanceAI;
  
  constructor() {
    this.client = new RelevanceAI({
      apiKey: process.env.RELEVANCE_AI_KEY,
      region: 'us-east-1'
    });
  }
  
  async analyzeBrandConsistency(artistId: string) {
    const contentData = await this.fetchArtistContent(artistId);
    
    const analysis = await this.client.runAgent({
      agent_id: 'brand_consistency_analyzer',
      input: {
        content_samples: contentData.posts.slice(-20),
        artist_bio: contentData.bio,
        genre: contentData.genre
      }
    });
    
    return {
      consistency_score: analysis.outputs.brand_score,
      key_themes: analysis.outputs.themes,
      recommendations: analysis.outputs.suggestions,
      confidence: analysis.confidence
    };
  }
  
  async predictContentPerformance(content: ContentInput) {
    const prediction = await this.client.runAgent({
      agent_id: 'content_performance_predictor',
      input: {
        content_text: content.caption,
        content_type: content.type,
        hashtags: content.hashtags,
        posting_time: content.scheduledTime,
        artist_context: await this.getArtistContext(content.artistId)
      }
    });
    
    return prediction.outputs;
  }
}
```

## Performance Optimization

### Caching Strategy
```typescript
// lib/ai/cache-manager.ts
export class AIInsightCache {
  private redis = new Redis(process.env.REDIS_URL);
  
  async getCachedInsight(key: string): Promise<any> {
    const cached = await this.redis.get(`ai_insight:${key}`);
    return cached ? JSON.parse(cached) : null;
  }
  
  async cacheInsight(key: string, data: any, ttl: number = 3600) {
    await this.redis.setex(`ai_insight:${key}`, ttl, JSON.stringify(data));
  }
  
  generateCacheKey(artistId: string, analysisType: string, dataHash: string): string {
    return `${artistId}:${analysisType}:${dataHash}`;
  }
}
```

### Cost Management
```typescript
// lib/ai/cost-tracker.ts
export class AICostTracker {
  async trackAPICall(service: string, tokens: number, cost: number) {
    await supabase.from('ai_usage_logs').insert({
      service,
      tokens_used: tokens,
      cost_usd: cost,
      timestamp: new Date()
    });
  }
  
  async getDailySpend(): Promise<number> {
    const { data } = await supabase
      .from('ai_usage_logs')
      .select('cost_usd')
      .gte('timestamp', new Date().toISOString().split('T')[0]);
      
    return data?.reduce((sum, log) => sum + log.cost_usd, 0) || 0;
  }
  
  async shouldThrottleRequests(): Promise<boolean> {
    const dailySpend = await this.getDailySpend();
    return dailySpend > parseFloat(process.env.AI_DAILY_BUDGET || '100');
  }
}
```

## Error Handling & Monitoring

### AI Pipeline Health Checks
```typescript
// lib/ai/health-monitor.ts
export class AIHealthMonitor {
  async checkServiceHealth() {
    const services = ['relevance_ai', 'openai', 'n8n_workflows'];
    const healthStatus = {};
    
    for (const service of services) {
      try {
        const startTime = Date.now();
        await this.pingService(service);
        const responseTime = Date.now() - startTime;
        
        healthStatus[service] = {
          status: 'healthy',
          response_time: responseTime,
          last_check: new Date()
        };
      } catch (error) {
        healthStatus[service] = {
          status: 'unhealthy',
          error: error.message,
          last_check: new Date()
        };
      }
    }
    
    return healthStatus;
  }
  
  async handleFailedInsight(artistId: string, error: Error) {
    // Log the failure
    console.error(`AI insight generation failed for artist ${artistId}:`, error);
    
    // Store fallback insight
    await supabase.from('insights').insert({
      artist_id: artistId,
      type: 'system_message',
      title: 'Insight Generation Temporarily Unavailable',
      description: 'Our AI analysis is currently unavailable. Check back in a few hours for fresh insights.',
      priority: 'low',
      created_by: 'system'
    });
    
    // Alert admin if error rate is high
    const errorRate = await this.getRecentErrorRate();
    if (errorRate > 0.1) {
      await this.alertAdmin('High AI failure rate detected', { errorRate });
    }
  }
}
```

## Success Metrics

### AI Performance KPIs
- **Insight Accuracy**: >85% of AI recommendations marked helpful by users
- **Response Time**: <30 seconds for real-time insights, <5 minutes for deep analysis
- **Cost Efficiency**: <$2 per artist per month for AI processing
- **User Engagement**: >70% of AI-generated tasks completed by artists
- **Prediction Accuracy**: Content performance predictions within 20% of actual results

### Implementation Checklist
- [ ] Set up Relevance AI workspace with custom agents
- [ ] Configure n8n instance with AI workflow templates
- [ ] Implement caching layer for expensive AI operations
- [ ] Set up cost tracking and budget alerts
- [ ] Create fallback mechanisms for AI service failures
- [ ] Build admin dashboard for AI pipeline monitoring
- [ ] Implement A/B testing for AI recommendation effectiveness