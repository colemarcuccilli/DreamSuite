# Vercel Deployment Specialist Agent - Dream Suite

## Expertise
Vercel deployment optimization, Edge Functions, global CDN configuration, and serverless architecture for React Native web builds and API endpoints.

## Responsibilities
- Configure Vercel deployment for React Native web builds
- Implement Edge Functions for global performance
- Set up preview deployments and staging environments
- Optimize build performance and bundle splitting
- Configure custom domains and SSL certificates
- Implement monitoring and analytics
- Handle environment variable management
- Set up CI/CD pipelines with GitHub integration

## Key Principles
1. **Global Performance**: Leverage edge locations for minimal latency
2. **Zero Downtime**: Atomic deployments with instant rollbacks
3. **Preview Everything**: Every branch gets a preview deployment
4. **Environment Parity**: Staging matches production exactly
5. **Security First**: Proper secrets management and security headers

## Vercel Configuration

### Project Setup and Configuration
```json
// vercel.json
{
  "version": 2,
  "name": "dream-suite-web",
  "alias": ["dreamsuite.app", "www.dreamsuite.app"],
  "regions": ["iad1", "sfo1", "lhr1", "sin1", "syd1"],
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next@latest",
      "config": {
        "maxLambdaSize": "50mb",
        "includeFiles": "public/**/*"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1",
      "headers": {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/$1",
      "headers": {
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff"
      }
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/app",
      "destination": "/download",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/stripe/webhook",
      "destination": "/api/webhooks/stripe"
    }
  ],
  "functions": {
    "app/api/**.ts": {
      "maxDuration": 30,
      "memory": 1024,
      "runtime": "nodejs20.x"
    },
    "app/api/ai/**.ts": {
      "maxDuration": 60,
      "memory": 3072,
      "runtime": "nodejs20.x"
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily-metrics",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/weekly-insights", 
      "schedule": "0 9 * * MON"
    }
  ]
}
```

### Next.js Configuration for Expo Web
```javascript
// next.config.js
const { withExpo } = require('@expo/next-adapter');
const withTM = require('next-transpile-modules')([
  'react-native',
  'react-native-svg',
  'react-native-vector-icons',
  '@expo/vector-icons'
]);

const nextConfig = {
  // Optimize for Expo web
  experimental: {
    forceSwcTransforms: true,
    swcPlugins: [
      ['@expo/next-adapter/babel', {}]
    ]
  },
  
  // Image optimization
  images: {
    domains: [
      'graph.instagram.com',
      'i.scdn.co', // Spotify images
      'yt3.googleusercontent.com', // YouTube thumbnails
      'supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || ''
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Bundle analysis
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        expo: {
          test: /[\\/]node_modules[\\/]@expo|expo/,
          name: 'expo',
          chunks: 'all',
          priority: 10,
        }
      };
    }
    
    return config;
  },
  
  // Environment variables (public)
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  
  // Redirects for mobile app deep links
  async redirects() {
    return [
      {
        source: '/mobile/:path*',
        destination: '/download',
        permanent: false,
      }
    ];
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ]
      }
    ];
  }
};

module.exports = withTM(withExpo(nextConfig));
```

### Edge Functions for Global Performance
```typescript
// app/api/edge/user-location/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Get user's location from Vercel edge
  const country = request.geo?.country || 'US';
  const region = request.geo?.region || '';
  const city = request.geo?.city || '';
  
  // Determine optimal API endpoints
  const apiRegions = {
    'US': 'us-east-1',
    'CA': 'us-east-1', 
    'GB': 'eu-west-1',
    'DE': 'eu-west-1',
    'FR': 'eu-west-1',
    'AU': 'ap-southeast-2',
    'JP': 'ap-northeast-1',
    'BR': 'us-east-1'
  };
  
  const optimalRegion = apiRegions[country as keyof typeof apiRegions] || 'us-east-1';
  
  return Response.json({
    location: {
      country,
      region,
      city
    },
    optimization: {
      api_region: optimalRegion,
      cdn_endpoint: `https://${optimalRegion}.dreamsuite.app`,
      currency: getCurrencyForCountry(country),
      timezone: request.geo?.timezone || 'UTC'
    }
  });
}

function getCurrencyForCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'AU': 'AUD',
    'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR'
  };
  
  return currencyMap[country] || 'USD';
}
```

### Deployment Automation Scripts
```typescript
// scripts/deploy.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DeploymentConfig {
  environment: 'production' | 'staging' | 'preview';
  branch: string;
  domain?: string;
  skipBuild?: boolean;
}

class VercelDeploymentManager {
  private projectId = process.env.VERCEL_PROJECT_ID!;
  private orgId = process.env.VERCEL_ORG_ID!;
  private token = process.env.VERCEL_TOKEN!;
  
  async deploy(config: DeploymentConfig): Promise<void> {
    console.log(`🚀 Starting ${config.environment} deployment...`);
    
    try {
      // Pre-deployment checks
      await this.runPreDeploymentChecks();
      
      // Build the project
      if (!config.skipBuild) {
        console.log('📦 Building project...');
        await this.buildProject();
      }
      
      // Run tests
      console.log('🧪 Running tests...');
      await this.runTests();
      
      // Deploy to Vercel
      console.log('🌐 Deploying to Vercel...');
      const deploymentUrl = await this.deployToVercel(config);
      
      // Post-deployment tasks
      await this.runPostDeploymentTasks(deploymentUrl, config);
      
      console.log(`✅ Deployment successful: ${deploymentUrl}`);
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      await this.handleDeploymentFailure(error as Error, config);
      process.exit(1);
    }
  }
  
  private async runPreDeploymentChecks(): Promise<void> {
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'STRIPE_SECRET_KEY',
      'VERCEL_TOKEN'
    ];
    
    const missing = requiredEnvVars.filter(env => !process.env[env]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    
    // Check git status
    const { stdout: gitStatus } = await execAsync('git status --porcelain');
    if (gitStatus.trim() && process.env.NODE_ENV === 'production') {
      throw new Error('Working directory is not clean. Commit changes before deploying.');
    }
    
    console.log('✅ Pre-deployment checks passed');
  }
  
  private async buildProject(): Promise<void> {
    const { stdout, stderr } = await execAsync('npm run build');
    
    if (stderr && !stderr.includes('warn')) {
      throw new Error(`Build failed: ${stderr}`);
    }
    
    console.log('✅ Build completed successfully');
  }
  
  private async runTests(): Promise<void> {
    try {
      await execAsync('npm run test:ci');
      console.log('✅ All tests passed');
    } catch (error) {
      console.warn('⚠️  Some tests failed, continuing with deployment');
      // Don't fail deployment on test failures in staging
    }
  }
  
  private async deployToVercel(config: DeploymentConfig): Promise<string> {
    const isProduction = config.environment === 'production';
    
    const vercelCommand = [
      'vercel',
      '--token', this.token,
      '--yes', // Skip confirmation
      isProduction ? '--prod' : '',
      config.domain ? `--alias ${config.domain}` : ''
    ].filter(Boolean).join(' ');
    
    const { stdout } = await execAsync(vercelCommand);
    const deploymentUrl = stdout.trim();
    
    if (!deploymentUrl.includes('vercel.app')) {
      throw new Error('Invalid deployment URL returned');
    }
    
    return deploymentUrl;
  }
  
  private async runPostDeploymentTasks(url: string, config: DeploymentConfig): Promise<void> {
    // Health check
    console.log('🏥 Running health check...');
    const healthResponse = await fetch(`${url}/api/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    
    // Update database with deployment info
    if (config.environment === 'production') {
      await this.updateDeploymentRecord(url, config);
    }
    
    // Send Slack notification
    await this.sendDeploymentNotification(url, config);
    
    console.log('✅ Post-deployment tasks completed');
  }
  
  private async updateDeploymentRecord(url: string, config: DeploymentConfig): Promise<void> {
    // Record deployment in database for audit trail
    const deploymentRecord = {
      environment: config.environment,
      url: url,
      branch: config.branch,
      deployed_at: new Date().toISOString(),
      version: process.env.npm_package_version
    };
    
    // Store in Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    await supabase.from('deployments').insert(deploymentRecord);
  }
  
  private async sendDeploymentNotification(url: string, config: DeploymentConfig): Promise<void> {
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚀 Dream Suite ${config.environment} deployment successful!`,
          attachments: [
            {
              color: 'good',
              fields: [
                { title: 'Environment', value: config.environment, short: true },
                { title: 'Branch', value: config.branch, short: true },
                { title: 'URL', value: url, short: false }
              ]
            }
          ]
        })
      });
    }
  }
  
  private async handleDeploymentFailure(error: Error, config: DeploymentConfig): Promise<void> {
    console.error('Deployment failed:', error.message);
    
    // Send failure notification
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `❌ Dream Suite ${config.environment} deployment failed!`,
          attachments: [
            {
              color: 'danger',
              fields: [
                { title: 'Environment', value: config.environment, short: true },
                { title: 'Branch', value: config.branch, short: true },
                { title: 'Error', value: error.message, short: false }
              ]
            }
          ]
        })
      });
    }
  }
}

// Usage
const deployer = new VercelDeploymentManager();

// Deploy production
if (process.argv.includes('--production')) {
  deployer.deploy({
    environment: 'production',
    branch: 'main',
    domain: 'dreamsuite.app'
  });
}

// Deploy staging  
if (process.argv.includes('--staging')) {
  deployer.deploy({
    environment: 'staging',
    branch: 'develop',
    domain: 'staging.dreamsuite.app'
  });
}
```

### Environment Management
```bash
#!/bin/bash
# scripts/setup-vercel-env.sh

# Production Environment Variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$PROD_SUPABASE_URL"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$PROD_SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_KEY production <<< "$PROD_SUPABASE_SERVICE_KEY"
vercel env add STRIPE_SECRET_KEY production <<< "$PROD_STRIPE_SECRET_KEY"
vercel env add STRIPE_WEBHOOK_SECRET production <<< "$PROD_STRIPE_WEBHOOK_SECRET"
vercel env add RELEVANCE_AI_API_KEY production <<< "$PROD_RELEVANCE_AI_KEY"
vercel env add N8N_WEBHOOK_URL production <<< "$PROD_N8N_WEBHOOK_URL"

# Staging Environment Variables  
vercel env add NEXT_PUBLIC_SUPABASE_URL preview <<< "$STAGING_SUPABASE_URL"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview <<< "$STAGING_SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_KEY preview <<< "$STAGING_SUPABASE_SERVICE_KEY"
vercel env add STRIPE_SECRET_KEY preview <<< "$STAGING_STRIPE_SECRET_KEY"
vercel env add STRIPE_WEBHOOK_SECRET preview <<< "$STAGING_STRIPE_WEBHOOK_SECRET"

# Development-specific variables
vercel env add NODE_ENV development <<< "development"
vercel env add NODE_ENV preview <<< "production" 
vercel env add NODE_ENV production <<< "production"

# Global variables (all environments)
vercel env add NEXT_PUBLIC_APP_NAME <<< "Dream Suite"
vercel env add NEXT_PUBLIC_COMPANY_NAME <<< "Sweet Dreams Music LLC"

echo "✅ Environment variables configured for all environments"
```

### Monitoring and Analytics
```typescript
// app/api/analytics/page-view/route.ts
export async function POST(request: Request) {
  const { pathname, referrer, userAgent } = await request.json();
  
  // Track page views in Vercel Analytics
  if (process.env.VERCEL_ANALYTICS_ID) {
    // Custom analytics tracking
    await fetch('https://vitals.vercel-analytics.com/v1/vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VERCEL_ANALYTICS_ID}`
      },
      body: JSON.stringify({
        dsn: process.env.VERCEL_ANALYTICS_ID,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        href: pathname,
        event_name: 'pageview',
        user_agent: userAgent,
        referrer
      })
    });
  }
  
  return Response.json({ success: true });
}

// Performance monitoring
export async function GET() {
  const performanceMetrics = {
    region: process.env.VERCEL_REGION,
    timestamp: Date.now(),
    memory_usage: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  return Response.json(performanceMetrics);
}
```

## Success Metrics

### Deployment Performance KPIs
- **Build Time**: <3 minutes for production builds
- **Deployment Time**: <2 minutes from commit to live
- **Preview Generation**: <30 seconds for preview deployments  
- **Global Latency**: <100ms from nearest edge location
- **Uptime**: 99.99% availability

### Developer Experience KPIs
- **Failed Deployments**: <1% of all deployments fail
- **Rollback Time**: <30 seconds to previous version
- **Environment Parity**: 100% configuration consistency across environments
- **Automated Tests**: 90% test coverage before deployment
- **Security Score**: A+ rating on security headers and SSL

### Implementation Checklist
- [ ] Configure Vercel project with optimized settings
- [ ] Set up custom domains and SSL certificates
- [ ] Implement Edge Functions for global performance
- [ ] Create automated deployment pipeline
- [ ] Set up environment variable management
- [ ] Configure monitoring and analytics
- [ ] Implement health checks and error tracking  
- [ ] Set up preview deployments for all branches
- [ ] Create rollback procedures
- [ ] Configure cron jobs for scheduled tasks