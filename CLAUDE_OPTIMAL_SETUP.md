# Claude Optimal Development Environment Setup - React Native + Expo

## Project Structure for Maximum Claude Efficiency

### 1. Core Project Files (React Native + Expo)

```
dream-suite/
├── .claude/
│   ├── claude_project.json      # Project configuration
│   ├── context/
│   │   ├── project-overview.md  # High-level vision and goals
│   │   ├── tech-stack.md        # React Native + Expo decisions
│   │   ├── api-docs.md          # Supabase, Stripe, AI integrations
│   │   └── decisions.md         # Architecture decisions record
│   └── agents/
│       ├── mobile-specialist.md  # React Native expert
│       ├── backend-specialist.md # Supabase expert
│       └── ui-ux-specialist.md   # Mobile UI/UX expert
├── app/                         # Expo Router file-based routing
│   ├── (auth)/                  # Authentication screens
│   ├── (tabs)/                  # Main app tab screens
│   ├── (modals)/                # Modal screens
│   └── api/                     # API routes (for web)
├── components/                  # Reusable React Native components
├── hooks/                       # Custom React hooks
├── lib/                         # Core utilities (Supabase, etc.)
├── stores/                      # State management (Zustand)
├── types/                       # TypeScript definitions
├── CLAUDE.md                    # Session history and current state
├── README.md                    # Project setup and overview
├── TROUBLESHOOTING.md          # React Native specific issues
└── TODO.md                     # Current tasks and priorities
```

### 2. Essential CLAUDE.md Template (React Native)

```markdown
# Claude Code Session History - Dream Suite Mobile App

## Project Overview
Dream Suite is an AI-powered mobile-first artist development platform built with React Native + Expo. One codebase deploys to iOS, Android, and Web simultaneously.

## Tech Stack
- **Frontend**: React Native + Expo (iOS, Android, Web)
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Payments**: Stripe + RevenueCat (mobile subscriptions)
- **AI Integration**: Relevance AI + n8n workflows
- **Deployment**: EAS Build + Vercel (web)

## Current Development Phase
- [ ] Phase 1: Authentication & Core UI
- [ ] Phase 2: Dashboard & Metrics Display
- [ ] Phase 3: AI Insights Integration
- [ ] Phase 4: Push Notifications & Background Sync
- [ ] Phase 5: App Store Deployment

## Critical Rules
1. **DO NOT BREAK**: Authentication flow, Supabase connection
2. **ALWAYS TEST**: On iOS, Android, AND Web before committing
3. **NEVER CHANGE**: Expo app.json config without testing all platforms
4. **MOBILE FIRST**: Design for mobile, adapt for web (not vice versa)

## Known Issues
- [Issue 1]: [Description and workaround]
- [Issue 2]: [Description and status]

## Environment Setup
\`\`\`bash
# Required versions
node --version  # Must be v20+
expo --version  # Latest
eas --version   # Latest

# Environment variables needed (.env.local)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
RELEVANCE_AI_API_KEY=

# Testing commands
npx expo start --web    # Test web version
npx expo start --ios    # Test iOS simulator
npx expo start --android # Test Android emulator
\`\`\`

## Mobile Development Checklist
- [ ] Test on iOS simulator
- [ ] Test on Android emulator  
- [ ] Test on physical device (via Expo Go)
- [ ] Test web version in browser
- [ ] Verify push notifications work
- [ ] Test offline functionality
- [ ] Verify camera/media upload works

## Session Log
### Session [N] - [Date]
- **Goal**: [What we're trying to accomplish]
- **Platforms Tested**: [iOS/Android/Web status]
- **Completed**: [What was done]
- **Next Steps**: [What needs to be done next]
```

### 3. Context Files for Claude

#### context/project-overview.md
```markdown
# Project Overview

## Vision
[1 paragraph describing the ultimate goal]

## Core Features
1. **Feature 1**: [Description]
2. **Feature 2**: [Description]
3. **Feature 3**: [Description]

## User Journey
1. [Step 1 in typical user flow]
2. [Step 2 in typical user flow]
3. [Step 3 in typical user flow]

## Success Metrics
- Metric 1: [Target]
- Metric 2: [Target]
- Metric 3: [Target]
```

#### context/tech-stack.md
```markdown
# Technology Stack Decisions

## Current Stack
- **Database**: Supabase (PostgreSQL)
  - Why: Built-in auth, real-time, row-level security
  - Alternative considered: Firebase (rejected due to complexity)

- **Payments**: Stripe Checkout
  - Why: Hosted solution, no PCI compliance needed
  - Alternative considered: Custom PaymentIntents (too complex)

- **Frontend**: Next.js 14 App Router
  - Why: Server components, built-in optimizations
  - Alternative considered: Remix (less familiar)

## Integration Points
- Supabase ↔ Next.js: Using @supabase/ssr
- Stripe ↔ Next.js: Webhook handlers in API routes
- n8n ↔ Supabase: Direct database connection

## Authentication Flow
1. User signs up via Supabase Auth
2. Trigger creates user profile
3. Email verification sent
4. User redirected to dashboard
```

### 4. Claude Commands Structure

#### .claude/commands.md
```markdown
# Claude Custom Commands

## Project-Specific Commands

### @test-payment
Run complete payment flow test:
\`\`\`bash
npm run test:payment
\`\`\`

### @check-setup
Verify environment setup:
\`\`\`bash
node scripts/check-setup.js
\`\`\`

### @deploy-preview
Deploy to preview environment:
\`\`\`bash
npm run deploy:preview
\`\`\`

### @db-migrate
Run database migrations:
\`\`\`bash
npm run db:migrate
\`\`\`

## Development Workflow Commands

### @start-dev
Start all development services:
\`\`\`bash
npm run dev          # Start Next.js
npm run stripe:listen # Start Stripe webhook listener
npm run db:local     # Start local Supabase (if using)
\`\`\`

### @test-all
Run all tests:
\`\`\`bash
npm run test
npm run test:e2e
npm run lint
npm run type-check
\`\`\`
```

### 5. Comprehensive Agent Configurations

Dream Suite uses a specialized agent system to provide expert guidance across all development areas. Each agent is a domain specialist with detailed implementation patterns and best practices.

#### Core Development Agents

**React Native Specialist** (`agents-react-native-specialist.md`)
- Cross-platform mobile development with React Native + Expo
- iOS, Android, and Web compatibility patterns
- Mobile-specific features (camera, notifications, biometrics)
- Performance optimization and native feel implementation

**Supabase Architect** (`agents-supabase-architect.md`)  
- Database design and Row Level Security implementation
- Real-time subscriptions and performance optimization
- Mobile-optimized query patterns and schema design
- Storage management and backup strategies

**AI Orchestrator** (`agents-ai-orchestrator.md`)
- AI workflow design with Relevance AI and n8n
- Insight generation and recommendation systems
- ML pipeline management and cost optimization
- AI-powered content analysis and growth predictions

**Data Pipeline Engineer** (`agents-data-pipeline-engineer.md`)
- Social media API integration and data collection
- ETL processes for streaming platforms (Spotify, YouTube, etc.)
- Data quality validation and real-time synchronization
- Automated metrics aggregation and storage optimization

#### Specialized Service Agents

**Stripe Payments Specialist** (`agents-stripe-specialist.md`)
- Mobile-first subscription management with RevenueCat
- Global payment optimization and currency handling
- Webhook processing and subscription lifecycle management
- Fraud prevention and chargeback handling

**Integration Specialist** (`agents-integration-specialist.md`)
- Third-party API connections (Instagram, TikTok, Spotify)
- OAuth flow implementation and token management
- Unified data models from diverse API responses
- Rate limit optimization and fallback mechanisms

**Security & Compliance Specialist** (`agents-security-compliance.md`)
- GDPR/CCPA compliance and data subject rights
- Mobile app security with biometric authentication
- API security with rate limiting and input sanitization
- Privacy-by-design implementation and audit procedures

#### Infrastructure & Operations Agents

**Vercel Deployment Specialist** (`agents-vercel-deployment.md`)
- React Native web build optimization for Vercel
- Edge Functions for global performance
- CI/CD pipeline configuration with preview deployments
- Environment management and security headers

**Performance & Monitoring Specialist** (`agents-performance-monitoring.md`)
- Mobile and web performance tracking
- Error tracking and crash reporting systems
- API performance monitoring and alerting
- User engagement analytics and optimization insights

#### Agent Usage Patterns

Each agent provides:
- **Implementation Patterns**: Ready-to-use code examples and configurations
- **Best Practices**: Industry-standard approaches and optimization techniques  
- **Error Handling**: Comprehensive error scenarios and recovery mechanisms
- **Success Metrics**: KPIs and benchmarks for measuring implementation quality
- **Checklists**: Step-by-step implementation and testing procedures

#### Quick Agent Reference
```markdown
# Mobile Development Agent (React Native + Expo)

## Responsibilities
- React Native component development
- Cross-platform compatibility (iOS/Android/Web)
- Mobile-specific features (camera, push notifications, etc.)
- Performance optimization for mobile
- App store deployment preparation

## Key Principles
1. **Mobile First**: Design for mobile, adapt for web
2. **Platform Testing**: Test on iOS, Android, AND Web
3. **Performance**: Optimize for slower mobile networks/devices
4. **User Experience**: Native feel with smooth animations

## Common Patterns

### Screen Component Pattern
\`\`\`tsx
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function DashboardScreen() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .eq('artist_id', user?.id)
      
      if (error) throw error
      setData(data || [])
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Content */}
    </ScrollView>
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
      header: { paddingTop: 44 },
    },
    android: {
      header: { paddingTop: 24 },
    },
    web: {
      header: { paddingTop: 0 },
    },
  }),
})
\`\`\`

### Cross-Platform Hook Pattern
\`\`\`tsx
import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function useLocalStorage(key: string, defaultValue: any) {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    loadValue()
  }, [])

  const loadValue = async () => {
    try {
      if (Platform.OS === 'web') {
        const item = localStorage.getItem(key)
        setValue(item ? JSON.parse(item) : defaultValue)
      } else {
        const item = await AsyncStorage.getItem(key)
        setValue(item ? JSON.parse(item) : defaultValue)
      }
    } catch (error) {
      console.error('Error loading from storage:', error)
    }
  }

  const saveValue = async (newValue: any) => {
    try {
      setValue(newValue)
      if (Platform.OS === 'web') {
        localStorage.setItem(key, JSON.stringify(newValue))
      } else {
        await AsyncStorage.setItem(key, JSON.stringify(newValue))
      }
    } catch (error) {
      console.error('Error saving to storage:', error)
    }
  }

  return [value, saveValue]
}
\`\`\`
```

#### .claude/agents/backend-specialist.md
```markdown
# Backend Development Agent (Supabase Focus)

## Responsibilities
- Supabase database schema design
- Row Level Security policies
- Real-time subscription setup
- Storage bucket management
- Cloud function integration (if needed)

## Key Principles
1. **Security First**: Use RLS policies, validate all inputs
2. **Real-time**: Leverage Supabase real-time for live updates
3. **Scalability**: Design for mobile app scale (thousands of users)
4. **Performance**: Optimize queries for mobile networks

## Common Patterns

### Supabase Query Pattern
\`\`\`typescript
// hooks/useMetrics.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function useMetrics() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    loadMetrics()
    setupRealtime()
  }, [user])

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMetrics(data || [])
    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtime = () => {
    const channel = supabase
      .channel('metrics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'metrics',
          filter: \`artist_id=eq.\${user.id}\`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMetrics(prev => [payload.new, ...prev])
          }
        }
      )
      .subscribe()

    return () => channel.unsubscribe()
  }

  return { metrics, loading, refresh: loadMetrics }
}
\`\`\`

### RLS Policy Pattern
\`\`\`sql
-- Enable RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users manage own data" ON artists
  FOR ALL 
  USING (auth.uid() = id);

-- Insert policy for new users
CREATE POLICY "Users can insert own profile" ON artists
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
\`\`\`
```

### 6. Testing & Validation Setup

#### scripts/check-setup.js
```javascript
#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Checking development environment...\n');

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 20) {
  console.error(`❌ Node.js version ${nodeVersion} is too old. Need v20+`);
  process.exit(1);
}
console.log(`✅ Node.js ${nodeVersion}`);

// Check for required files
const requiredFiles = [
  '.env.local',
  'package.json',
  'tsconfig.json',
  'next.config.js'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ ${file} is missing`);
    process.exit(1);
  }
});

// Check environment variables
require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

let envVarsOk = true;
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName} is set`);
  } else {
    console.error(`❌ ${varName} is missing`);
    envVarsOk = false;
  }
});

if (!envVarsOk) {
  console.error('\n❌ Some environment variables are missing');
  process.exit(1);
}

// Check database connection
console.log('\n🔍 Checking database connection...');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

supabase
  .from('_test_connection')
  .select('count')
  .then(() => {
    console.log('✅ Database connection successful');
    console.log('\n✨ Environment setup is complete!');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
```

### 7. Git Hooks for Quality

#### .husky/pre-commit
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run tests
npm run test

# Check types
npm run type-check

# Lint code
npm run lint

# Check for console.logs in production code
if grep -r "console.log" --include="*.ts" --include="*.tsx" src/; then
  echo "❌ Remove console.log statements before committing"
  exit 1
fi
```

### 8. Debugging & Troubleshooting

#### TROUBLESHOOTING.md
```markdown
# Troubleshooting Guide

## Common Issues and Solutions

### Issue: "PERMISSION_DENIED" errors with Firebase
**Symptoms**: Cloud Functions fail with permission errors
**Root Cause**: Node.js version incompatibility
**Solution**:
\`\`\`bash
# Check Node version
node --version  # Must be v20+

# Reinstall Firebase CLI
npm uninstall -g firebase-tools
npm install -g firebase-tools@latest
\`\`\`

### Issue: Stripe webhook not receiving events
**Symptoms**: Payments succeed but database not updated
**Root Cause**: Webhook secret mismatch or wrong endpoint
**Solution**:
\`\`\`bash
# For local development
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook secret shown and update .env.local
STRIPE_WEBHOOK_SECRET=whsec_...
\`\`\`

### Issue: Environment variables not loading
**Symptoms**: undefined values, authentication failures
**Root Cause**: File encoding or naming issues
**Solution**:
\`\`\`bash
# Check file encoding
file .env.local  # Should show "ASCII text" or "UTF-8"

# If UTF-16, recreate the file
mv .env.local .env.local.backup
# Create new file and copy values manually
\`\`\`

### Issue: Database migrations failing
**Symptoms**: "relation does not exist" errors
**Root Cause**: Migrations not run or out of order
**Solution**:
\`\`\`bash
# Reset and rerun migrations
npm run db:reset  # WARNING: Deletes all data
npm run db:migrate
npm run db:seed  # If you have seed data
\`\`\`
```

### 9. Performance Monitoring

#### monitoring/setup.md
```markdown
# Performance Monitoring Setup

## Key Metrics to Track

### API Performance
- Response time (p50, p95, p99)
- Error rate
- Database query time
- External API call time

### Frontend Performance
- Core Web Vitals (LCP, FID, CLS)
- Time to Interactive (TTI)
- Bundle size
- API call waterfall

## Implementation

### Backend Monitoring
\`\`\`typescript
// middleware/monitoring.ts
export function withMonitoring(handler: Handler) {
  return async (req: Request) => {
    const start = Date.now();
    
    try {
      const response = await handler(req);
      
      // Log success metrics
      logger.info({
        method: req.method,
        path: req.url,
        status: response.status,
        duration: Date.now() - start
      });
      
      return response;
    } catch (error) {
      // Log error metrics
      logger.error({
        method: req.method,
        path: req.url,
        error: error.message,
        duration: Date.now() - start
      });
      
      throw error;
    }
  };
}
\`\`\`
```

### 10. Deployment Checklist

#### deploy-checklist.md
```markdown
# Deployment Checklist

## Pre-Deployment
- [ ] All tests passing
- [ ] No console.log statements
- [ ] Environment variables set in production
- [ ] Database migrations ready
- [ ] Stripe webhook configured for production URL

## Deployment Steps
1. \`git checkout main && git pull\`
2. \`npm run test:all\`
3. \`npm run build\`
4. \`git tag -a v1.0.0 -m "Release version 1.0.0"\`
5. \`git push origin v1.0.0\`
6. Deploy via platform (Vercel/Netlify/etc)

## Post-Deployment
- [ ] Verify homepage loads
- [ ] Test authentication flow
- [ ] Test payment flow with test card
- [ ] Check error tracking dashboard
- [ ] Monitor logs for 30 minutes

## Rollback Plan
\`\`\`bash
# If issues found
git revert HEAD
git push origin main
# Redeploy previous version
\`\`\`
```

## Summary: Claude Best Practices

### 1. **Clear Context Files**
- Keep CLAUDE.md updated after each session
- Document decisions and rationale
- List what's working and what's not

### 2. **Specific Agent Roles**
- Define clear responsibilities for each agent
- Provide code patterns and examples
- Include error handling templates

### 3. **Automation Scripts**
- Environment setup verification
- Common task automation
- Testing and deployment scripts

### 4. **Error Prevention**
- Pre-commit hooks
- Type checking
- Comprehensive error handling patterns

### 5. **Performance Focus**
- Monitor from day one
- Track key metrics
- Optimize based on data

This setup ensures Claude has all the context needed to be maximally effective while avoiding the pitfalls we encountered in the previous project.