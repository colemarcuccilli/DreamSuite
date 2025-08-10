# Technology Stack Decisions

## Current Stack

### Frontend: React Native + Expo
- **Why**: Write once, deploy to iOS, Android, and Web
- **Benefits**: 
  - 95% code sharing across platforms
  - Native performance and feel
  - Huge ecosystem and community
  - Over-the-air updates with EAS
- **Alternative considered**: Flutter (less mature ecosystem), Native development (3x the work)

### Backend: Supabase (PostgreSQL)
- **Why**: Built-in auth, real-time subscriptions, row-level security, storage
- **Benefits**:
  - Open source, no vendor lock-in
  - Scales from MVP to enterprise
  - Excellent developer experience
  - Built-in real-time capabilities
- **Alternative considered**: Firebase (document DB limitations, vendor lock-in)

### Payments: Stripe Checkout + RevenueCat
- **Why**: Hosted solution for web, RevenueCat for mobile subscriptions
- **Benefits**:
  - No PCI compliance needed
  - Handles all edge cases
  - RevenueCat manages App Store/Play Store subscriptions
  - Unified subscription management
- **Alternative considered**: Custom PaymentIntents (too complex, error-prone)

### AI Platform: Relevance AI
- **Why**: No-code AI workflows, easy integration
- **Benefits**:
  - Visual workflow builder
  - Pre-built AI models
  - Scales with usage
  - Good documentation
- **Alternative considered**: OpenAI API (requires more custom code)

### Automation: n8n
- **Why**: Open source, self-hostable, extensive integrations
- **Benefits**:
  - Visual workflow automation
  - 280+ built-in integrations
  - Can self-host or use cloud
  - Fair pricing model
- **Alternative considered**: Zapier (expensive at scale), Make (less flexible)

### Push Notifications: Expo Notifications
- **Why**: Built into Expo, works across platforms
- **Benefits**:
  - Unified API for iOS/Android
  - No additional services needed
  - Free tier generous
  - Easy implementation
- **Alternative considered**: OneSignal (unnecessary complexity)

### Deployment
- **Mobile**: EAS Build (Expo Application Services)
  - Automated builds for iOS/Android
  - Over-the-air updates
  - App store submission tools
- **Web**: Vercel
  - Optimized for React applications
  - Edge functions support
  - Excellent performance
  - Great developer experience

## Integration Points

### Supabase ↔ React Native
- Using `@supabase/supabase-js` with custom secure storage adapter
- Real-time subscriptions via WebSocket
- Row-level security for data protection
- Direct database queries from client (secured by RLS)

### Stripe ↔ React Native
- Web: Redirect to Stripe Checkout
- Mobile: In-app browser or RevenueCat SDK
- Webhooks to Supabase Edge Functions
- Subscription status synced to database

### n8n ↔ Supabase
- Direct database connection for data operations
- Webhook triggers for real-time events
- Scheduled workflows for batch processing
- API endpoints for on-demand operations

### Relevance AI ↔ n8n
- n8n triggers AI workflows
- Results stored in Supabase
- Async processing for better performance
- Error handling and retries built-in

## Authentication Flow

1. **User signs up** via Supabase Auth (email/social)
2. **Email verification** sent automatically
3. **Profile created** via database trigger
4. **OAuth tokens** stored securely for API access
5. **Session management** handled by Supabase
6. **Biometric auth** optional on mobile devices

## Data Flow

1. **Collection**: n8n workflows fetch data from APIs
2. **Storage**: Raw data stored in Supabase
3. **Processing**: AI analysis via Relevance AI
4. **Insights**: Generated insights saved to database
5. **Delivery**: Real-time updates to React Native app
6. **Notifications**: Push notifications for important events

## Security Considerations

- **Row-level security** on all database tables
- **API rate limiting** to prevent abuse
- **Input validation** on all user inputs
- **Secure token storage** using platform-specific solutions
- **HTTPS everywhere** (enforced by platforms)
- **Regular security audits** planned quarterly

## Performance Optimizations

- **Lazy loading** for better initial load times
- **Image optimization** with multiple resolutions
- **Query optimization** with proper indexes
- **Caching strategy** using React Query
- **Bundle splitting** for web deployment
- **Background sync** for offline capability