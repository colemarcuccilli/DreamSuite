# Dream Suite - AI-Powered Artist Development Platform

Dream Suite is a mobile-first platform built with React Native + Expo that transforms how music artists understand, grow, and monetize their careers through intelligent data analysis and AI-powered insights.

## 🚀 Features

- **Unified Analytics Dashboard**: Connects to Instagram, TikTok, YouTube, Spotify, Apple Music, and SoundCloud
- **AI-Powered Growth Insights**: Personalized recommendations based on data analysis
- **Smart Task Management**: Gamified progress tracking and achievement system
- **Real-time Synchronization**: Live updates across all platforms
- **Cross-Platform**: Single codebase for iOS, Android, and Web

## 🛠 Tech Stack

- **Frontend**: React Native + Expo (iOS, Android, Web)
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Payments**: Stripe + RevenueCat
- **AI**: Relevance AI + n8n workflows
- **State Management**: Zustand
- **Navigation**: Expo Router
- **Forms**: React Hook Form + Zod
- **Charts**: Victory Native

## 📦 Prerequisites

- Node.js v20+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

## 🚦 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/colemarcuccilli/DreamSuite.git
   cd DreamSuite/dream-suite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase and Stripe keys
   ```

4. **Start the development server**
   ```bash
   # For web
   npx expo start --web
   
   # For iOS (requires Mac)
   npx expo start --ios
   
   # For Android
   npx expo start --android
   ```

## 🔧 Environment Setup

Create a `.env.local` file with the following variables:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# AI Services
RELEVANCE_AI_API_KEY=your-relevance-ai-key
```

## 📱 Testing

Always test on all platforms before committing:

```bash
# Test on web
npx expo start --web

# Test on mobile (via Expo Go app)
npx expo start

# Test specific platforms
npx expo start --ios
npx expo start --android
```

## 🏗 Project Structure

```
dream-suite/
├── app/                    # Expo Router pages
│   ├── auth/              # Authentication screens
│   ├── tabs/              # Main tab screens
│   └── modals/            # Modal screens
├── components/            # Reusable components
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities (Supabase, etc.)
├── stores/                # Zustand stores
└── types/                 # TypeScript definitions
```

## 🚀 Deployment

### Mobile Apps

```bash
# Build for app stores
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Web App

```bash
# Export for web
npx expo export --platform web

# Deploy to Vercel
vercel --prod
```

## 📋 Development Workflow

1. Always work on feature branches
2. Test on iOS, Android, AND Web before committing
3. Follow mobile-first design principles
4. Use TypeScript for all new code
5. Follow the existing code patterns

## 🔒 Security

- All sensitive data is stored securely using Expo SecureStore
- Row-level security is enabled on all database tables
- Environment variables are never committed to the repository
- API keys are properly scoped and rotated regularly

## 📄 License

This project is proprietary and confidential.

## 🤝 Contributing

This is a private project. For questions or access, contact Cole Marcuccilli.

---

**Dream Suite** - Empowering artists through AI-powered insights and growth strategies.