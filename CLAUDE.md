# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dream Suite is an AI-powered artist development platform built with React Native + Expo that transforms how music artists understand, grow, and monetize their careers. The platform provides unified analytics, AI-powered growth insights, and smart task management across iOS, Android, and web from a single codebase.

## Development Commands

### Setup and Installation
```bash
# Create new Expo project
npx create-expo-app dream-suite --template
cd dream-suite

# Install core dependencies
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npm install @supabase/supabase-js react-native-url-polyfill
npx expo install @react-native-async-storage/async-storage expo-secure-store
```

### Development
```bash
# Run on web
npx expo start --web

# Run on iOS/Android (via Expo Go)
npx expo start

# Build and test
npm run build
npm run test
npm run lint
```

### Deployment
```bash
# EAS Build for mobile
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android

# Web deployment
npx expo export --platform web
vercel --prod
```

## Architecture

### Tech Stack
- **Frontend**: React Native + Expo (iOS, Android, Web)
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Payments**: Stripe / RevenueCat
- **AI**: Relevance AI for insights and coaching
- **Automation**: n8n for workflow automation
- **Deployment**: EAS Build (mobile), Vercel (web)

### Project Structure
```
dream-suite/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app with tab navigation
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── lib/                   # Core utilities (Supabase, Stripe)
├── hooks/                 # Custom React hooks
├── stores/                # State management (Zustand)
├── services/              # API and external services
└── constants/             # App configuration
```

## Development Protocol

### Git Workflow
Always work on feature branches and follow proper git hygiene:
```bash
git checkout -b feature/[description]
git add .
git commit -m "Descriptive message"
git push origin feature/[description]
```

### Error Handling
When encountering errors:
1. Capture the exact error message
2. Include full context (directory, package versions, environment)
3. Check external services (Stripe Dashboard, Supabase Console)
4. Verify environment variables match requirements

### Testing Requirements
Test on all platforms before committing:
- Web browser (Chrome, Safari, Firefox)
- iOS Simulator (latest iOS)
- Android Emulator (API 30+)
- Physical devices when available

## Key Implementation Patterns

### Supabase Client (Cross-Platform)
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      return Promise.resolve(localStorage.getItem(key))
    }
    return SecureStore.getItemAsync(key)
  },
  // ... setItem, removeItem
}

export const supabase = createClient(url, key, {
  auth: { storage: ExpoSecureStoreAdapter }
})
```

### Authentication Flow
- Email/password authentication
- Social login (Google, Apple)
- Biometric authentication on mobile
- Secure token storage across platforms

### Real-time Updates
- WebSocket subscriptions for live data
- Optimistic UI updates
- Offline queue for sync when reconnected

## External Services Configuration

### Supabase
- Database with Row Level Security policies
- Real-time subscriptions for live updates
- Storage buckets for media files
- Edge functions for server-side logic

### Stripe
- Webhook endpoints must be configured
- Test mode for development
- Mobile checkout via in-app browser
- Web checkout via redirect

### Push Notifications
- Expo Push Notifications for mobile
- Request permissions appropriately
- Store push tokens in database
- Handle foreground/background notifications

## Performance Optimization

- Use FlatList for large lists
- Implement lazy loading for images
- Use React.memo and useMemo appropriately
- Minimize bridge communication on mobile
- Implement proper loading and error states
- 60fps animations using native drivers

## Current Focus Areas

The project is in initial setup phase. Priority areas:
1. Core React Native + Expo setup
2. Authentication with Supabase
3. Basic dashboard with real-time metrics
4. Payment integration with Stripe
5. AI insights integration

## Next Steps

Refer to `IMPLEMENTATION_ROADMAP.md` for the detailed development timeline:
- Week 1: Core mobile app (auth, dashboard)
- Week 2: Payments + AI integration
- Week 3: Advanced features (tasks, gamification)
- Week 4: Polish + deployment

## Important Notes

- Always prefer editing existing files over creating new ones
- Test on all platforms (iOS, Android, Web) before committing
- Follow the established patterns in agent configuration files
- Update this file when significant architectural changes are made
- Refer to `COLE_DEVELOPMENT_PROTOCOL.md` for session management guidelines