# Architecture Decisions Record

## Decision Log

### 1. React Native + Expo Over Web-Only (2025-01-08)
**Decision**: Build with React Native + Expo for cross-platform deployment
**Rationale**:
- One codebase for iOS, Android, and Web (95% code sharing)
- Native mobile features critical for artist engagement (push notifications, camera, offline)
- App store presence provides credibility and discoverability
- Mobile-first aligns with how artists actually work
**Trade-offs**:
- Slightly more complex initial setup
- Need to test on multiple platforms
- Some web-specific optimizations may be limited

### 2. Supabase Over Firebase (2025-01-08)
**Decision**: Use Supabase for backend services
**Rationale**:
- PostgreSQL provides better relational data modeling
- Row-level security is more intuitive than Firestore rules
- Open source with no vendor lock-in
- Built-in real-time subscriptions
- Better pricing model for our use case
**Trade-offs**:
- Less mature than Firebase
- Smaller community
- Fewer third-party integrations

### 3. Stripe Checkout Over Custom Payment Flow (2025-01-08)
**Decision**: Use hosted Stripe Checkout for payments
**Rationale**:
- Learned from previous project failures with custom PaymentIntents
- No PCI compliance burden
- Handles all edge cases and payment methods
- Better conversion rates with trusted Stripe UI
**Trade-offs**:
- Less customization of payment UI
- Redirect flow may feel less native
- Dependent on Stripe's uptime

### 4. RevenueCat for Mobile Subscriptions (2025-01-08)
**Decision**: Use RevenueCat to manage App Store/Play Store subscriptions
**Rationale**:
- Unified subscription management across platforms
- Handles receipt validation automatically
- Simplifies complex store policies
- Good React Native SDK
**Trade-offs**:
- Additional service dependency
- Extra cost (1% of revenue after $10k)
- Another API to integrate

### 5. n8n Over Zapier/Make (2025-01-08)
**Decision**: Use n8n for workflow automation
**Rationale**:
- Can self-host to reduce costs
- Open source with no vendor lock-in
- More flexible and powerful than alternatives
- Fair pricing if using cloud version
**Trade-offs**:
- Requires more technical setup
- Smaller community than Zapier
- Self-hosting requires maintenance

### 6. Relevance AI for AI Features (2025-01-08)
**Decision**: Use Relevance AI for insights generation
**Rationale**:
- No-code AI workflow builder
- Good balance of power and ease of use
- Reasonable pricing for our scale
- Can migrate to custom models later
**Trade-offs**:
- Another external dependency
- Less control over AI models
- Potential for vendor lock-in

### 7. Expo Managed Workflow (2025-01-08)
**Decision**: Use Expo managed workflow instead of bare workflow
**Rationale**:
- Simpler development and maintenance
- Over-the-air updates without app store review
- Most features we need are supported
- Can eject later if needed
**Trade-offs**:
- Some native modules not available
- Larger app bundle size
- Dependent on Expo's infrastructure

### 8. TypeScript Throughout (2025-01-08)
**Decision**: Use TypeScript for all code
**Rationale**:
- Better IDE support and autocomplete
- Catches errors at compile time
- Self-documenting code
- Industry standard for modern React Native
**Trade-offs**:
- Slightly slower initial development
- Learning curve for TypeScript features
- Need to maintain type definitions

### 9. Zustand for State Management (2025-01-08)
**Decision**: Use Zustand instead of Redux/MobX
**Rationale**:
- Much simpler than Redux
- Better TypeScript support
- Smaller bundle size
- Easier to learn and maintain
**Trade-offs**:
- Smaller ecosystem
- Less battle-tested at scale
- Fewer debugging tools

### 10. Mobile-First Development (2025-01-08)
**Decision**: Design and develop for mobile first, adapt for web
**Rationale**:
- 70%+ of users expected to be on mobile
- Ensures best experience on most constrained platform
- Easier to scale up than scale down
- Aligns with artist behavior patterns
**Trade-offs**:
- Web experience may feel less optimized
- Some web-specific features harder to implement
- Desktop users may have unused screen space

## Future Decisions to Make

### Phase 2 Decisions
- [ ] Analytics platform (Mixpanel vs Amplitude vs PostHog)
- [ ] Error tracking (Sentry vs Bugsnag vs Rollbar)
- [ ] Customer support (Intercom vs Crisp vs Discord)
- [ ] Email service (SendGrid vs Postmark vs Resend)

### Phase 3 Decisions
- [ ] Video hosting (Cloudflare Stream vs Mux vs self-hosted)
- [ ] CDN provider (Cloudflare vs Fastly vs CloudFront)
- [ ] Search infrastructure (Algolia vs Elasticsearch vs Postgres FTS)
- [ ] Background job processing (Bull vs Agenda vs n8n)

### Phase 4 Decisions
- [ ] Community platform (Discord vs Circle vs custom)
- [ ] Learning management system (Teachable vs custom)
- [ ] Marketplace infrastructure (Stripe Connect vs custom)
- [ ] Advanced analytics (Segment vs custom data pipeline)

## Reversed Decisions

### Firebase to Supabase (2025-01-08)
**Original**: Firebase for all backend services
**Changed to**: Supabase
**Reason**: Firebase Cloud Functions Node.js compatibility issues, Firestore limitations for relational data, vendor lock-in concerns
**Lesson**: Evaluate Node.js version compatibility before choosing serverless platforms

### Custom Payments to Stripe Checkout (2025-01-08)
**Original**: Custom PaymentIntent implementation
**Changed to**: Hosted Stripe Checkout
**Reason**: Configuration complexity, edge case handling, PCI compliance burden
**Lesson**: Use hosted solutions for critical business functions like payments

## Architectural Principles

1. **Simplicity First**: Choose boring technology that works
2. **Mobile-First**: Every decision should prioritize mobile experience
3. **Real-time by Default**: Users expect instant updates
4. **Offline Capable**: Network isn't always available
5. **Progressive Enhancement**: Start simple, add complexity as needed
6. **Data-Driven**: Every feature should be measurable
7. **Security by Design**: Never compromise on security for convenience
8. **Developer Experience**: Good DX leads to better product velocity