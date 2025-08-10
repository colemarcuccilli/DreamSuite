# Dream Suite React Native + Expo - Complete Setup Guide

## Prerequisites Setup (30 minutes)

### Step 1: Install Required Software
```bash
# Install Node.js (v20+)
# Download from https://nodejs.org or use:
winget install OpenJS.NodeJS

# Verify installation
node --version  # Should be v20.0.0 or higher
npm --version   # Should be v9.0.0 or higher

# Install Git (if not installed)
winget install Git.Git

# Install VS Code (recommended)
winget install Microsoft.VisualStudioCode
```

### Step 2: Mobile Development Setup

#### For iOS Development (Mac only)
```bash
# Install Xcode from Mac App Store
# Install Xcode Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods
```

#### For Android Development (Windows/Mac/Linux)
```bash
# Download Android Studio from https://developer.android.com/studio
# During setup, install:
# - Android SDK
# - Android SDK Platform-Tools
# - Android Emulator

# Add to environment variables:
# ANDROID_HOME = C:\Users\[username]\AppData\Local\Android\Sdk
# PATH += %ANDROID_HOME%\platform-tools
```

### Step 3: Expo CLI
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Install EAS CLI for building and deployment
npm install -g eas-cli

# Verify installation
expo --version
eas --version
```

## Project Creation (15 minutes)

### Step 1: Create New Project
```bash
# Create Dream Suite project
npx create-expo-app dream-suite --template

# When prompted, choose:
# ✓ What would you like to name your app? › Dream Suite
# ✓ Choose a template › Blank (TypeScript)

cd dream-suite
```

### Step 2: Install Core Dependencies
```bash
# Navigation (essential for multi-screen apps)
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# Supabase for backend
npm install @supabase/supabase-js
npx expo install react-native-url-polyfill
npx expo install @react-native-async-storage/async-storage
npx expo install expo-secure-store

# Authentication
npx expo install expo-auth-session expo-crypto
npx expo install expo-apple-authentication
npx expo install expo-local-authentication

# UI Components
npm install react-native-elements react-native-vector-icons
npx expo install expo-font

# Forms and Validation
npm install react-hook-form zod @hookform/resolvers

# Charts and Visualizations
npm install react-native-chart-kit react-native-svg
npm install victory-native

# Payments
npm install @stripe/stripe-react-native
# Alternative: npm install react-native-purchases

# Media and Files
npx expo install expo-image-picker expo-document-picker
npx expo install expo-media-library expo-av

# Notifications
npx expo install expo-notifications

# Utilities
npm install date-fns
npx expo install expo-linking expo-sharing
npx expo install @react-native-community/netinfo

# Development Tools
npm install -D @types/react @types/react-native
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier
```

### Step 3: Project Configuration
```javascript
// app.json
{
  "expo": {
    "name": "Dream Suite",
    "slug": "dream-suite",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "dream-suite",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.sweetdreamsstudios.dreamsuite",
      "infoPlist": {
        "NSCameraUsageDescription": "Dream Suite needs camera access to let you upload content",
        "NSMicrophoneUsageDescription": "Dream Suite needs microphone access for audio recording",
        "NSPhotoLibraryUsageDescription": "Dream Suite needs photo library access to upload your content"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.sweetdreamsstudios.dreamsuite",
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Dream Suite needs access to your photos to upload content"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## Environment Setup (10 minutes)

### Step 1: Create Environment File
```bash
# Create .env.local file
touch .env.local

# Add to .gitignore
echo ".env.local" >> .gitignore
```

### Step 2: Environment Variables
```bash
# .env.local
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_key

RELEVANCE_AI_API_KEY=your_relevance_ai_key

# Google OAuth (optional)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Apple OAuth (iOS only)
EXPO_PUBLIC_APPLE_CLIENT_ID=your_apple_client_id

# Development URLs
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_WEB_URL=http://localhost:3000
```

## Project Structure Setup (20 minutes)

### Step 1: Create Directory Structure
```bash
# Create the complete folder structure
mkdir -p app/{auth,tabs,api}
mkdir -p components/{ui,dashboard,charts,forms}
mkdir -p hooks
mkdir -p lib/{server}
mkdir -p services
mkdir -p stores
mkdir -p types
mkdir -p constants
mkdir -p utils
```

### Step 2: Core Configuration Files

#### Supabase Client Setup
```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Custom storage adapter for cross-platform compatibility
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') {
        return Promise.resolve(null)
      }
      return Promise.resolve(localStorage.getItem(key))
    }
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value)
      }
      return Promise.resolve()
    }
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key)
      }
      return Promise.resolve()
    }
    return SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

#### Type Definitions
```typescript
// types/index.ts
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  subscription_status: 'active' | 'inactive' | 'cancelled'
  created_at: string
}

export interface Metric {
  id: string
  artist_id: string
  platform: string
  metric_date: string
  followers: number
  engagement_rate: number
  content_views: number
  raw_data: Record<string, any>
}

export interface Insight {
  id: string
  artist_id: string
  type: 'brand' | 'content' | 'audience' | 'growth'
  title: string
  description: string
  recommendations: string[]
  priority: 'high' | 'medium' | 'low'
  status: 'unread' | 'read' | 'actioned'
  created_by: 'ai' | 'manual' | 'system'
  created_at: string
}

export interface Task {
  id: string
  artist_id: string
  title: string
  description: string
  category: string
  due_date?: string
  completed: boolean
  impact_score: number
  created_at: string
}
```

#### Authentication Hook
```typescript
// hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### Step 3: Root Layout Setup
```typescript
// app/_layout.tsx
import { Slot } from 'expo-router'
import { AuthProvider } from '@/hooks/useAuth'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Slot />
    </AuthProvider>
  )
}
```

## Development Setup (15 minutes)

### Step 1: Development Scripts
```json
// package.json scripts section
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "build:web": "npx expo export --platform web",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android",
    "update": "eas update",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

### Step 2: ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'expo',
    '@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
```

### Step 3: TypeScript Configuration
```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["./app/*"],
      "@/components/*": ["./components/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/lib/*": ["./lib/*"],
      "@/types/*": ["./types/*"],
      "@/utils/*": ["./utils/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx"
  ]
}
```

## Database Setup (Supabase)

### Step 1: Create Supabase Project
```bash
# Go to https://supabase.com
# Create new project
# Choose organization
# Set project name: dream-suite
# Generate strong password
# Choose region closest to users
```

### Step 2: Database Schema
```sql
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Artists table
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  genre TEXT,
  career_stage TEXT CHECK (career_stage IN ('emerging', 'developing', 'established')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  stripe_customer_id TEXT,
  push_token TEXT,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics table
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'instagram', 'youtube', 'tiktok', 'twitter', 'soundcloud')),
  metric_date DATE NOT NULL,
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  content_views INTEGER DEFAULT 0,
  streams INTEGER DEFAULT 0,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, platform, metric_date)
);

-- Insights table
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('brand', 'content', 'audience', 'growth', 'monetization')),
  title TEXT NOT NULL,
  description TEXT,
  recommendations JSONB DEFAULT '[]',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'actioned')),
  created_by TEXT DEFAULT 'ai' CHECK (created_by IN ('ai', 'manual', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('content', 'engagement', 'branding', 'business', 'general')),
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  impact_score INTEGER DEFAULT 5 CHECK (impact_score >= 1 AND impact_score <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('milestone', 'streak', 'level', 'badge')),
  name TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_metrics_artist_date ON metrics(artist_id, metric_date DESC);
CREATE INDEX idx_insights_artist_status ON insights(artist_id, status);
CREATE INDEX idx_tasks_artist_completed ON tasks(artist_id, completed);

-- Row Level Security
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own data" ON artists
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view their own metrics" ON metrics
  FOR ALL USING (auth.uid() = artist_id);

CREATE POLICY "Users can view their own insights" ON insights
  FOR ALL USING (auth.uid() = artist_id);

CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = artist_id);

CREATE POLICY "Users can view their own achievements" ON achievements
  FOR ALL USING (auth.uid() = artist_id);
```

### Step 3: Storage Setup
```sql
-- Create storage bucket for user content
INSERT INTO storage.buckets (id, name, public) VALUES ('content', 'content', true);

-- Storage policy
CREATE POLICY "Users can upload their own content" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'content' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own content" ON storage.objects
  FOR SELECT USING (bucket_id = 'content' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## First App Screen (30 minutes)

### Step 1: Create Login Screen
```typescript
// app/(auth)/login.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      router.replace('/(tabs)/')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Dream Suite</Text>
        <Text style={styles.subtitle}>Your AI-Powered Music Career Coach</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.linkText}>
            Don't have an account? Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  form: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2081C3',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2081C3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    color: '#2081C3',
    fontSize: 16,
  },
})
```

### Step 2: Create Dashboard Screen
```typescript
// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function DashboardScreen() {
  const { user, signOut } = useAuth()
  const [metrics, setMetrics] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setMetrics(data || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Your Metrics</Text>
        {metrics.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No metrics yet. Connect your social media accounts to get started!
            </Text>
          </View>
        ) : (
          metrics.map((metric: any) => (
            <View key={metric.id} style={styles.metricCard}>
              <Text style={styles.metricPlatform}>{metric.platform}</Text>
              <Text style={styles.metricValue}>
                {metric.followers} followers
              </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  metricsContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 10,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  metricCard: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  metricPlatform: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metricValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  signOutButton: {
    backgroundColor: '#dc3545',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})
```

## Testing Your Setup

### Step 1: Start Development Server
```bash
# In your dream-suite directory
npx expo start

# This will show QR codes for:
# - iOS (scan with Camera app)
# - Android (scan with Expo Go app)
# - Web (press 'w' or visit localhost:19006)
```

### Step 2: Test on Different Platforms

#### Web Testing
```bash
# Press 'w' in terminal or visit:
http://localhost:19006

# Should see your login screen in browser
```

#### Mobile Testing
```bash
# Install Expo Go from App Store/Play Store
# Scan QR code with camera (iOS) or Expo Go (Android)
# Should see your app running on device
```

### Step 3: Verify Features Work
- [ ] Login screen displays correctly
- [ ] Can navigate between screens
- [ ] Database connection works (check Supabase dashboard)
- [ ] Authentication flow works
- [ ] Dashboard loads without errors

## Next Steps Checklist

### Week 1 Goals
- [ ] Complete basic authentication flow
- [ ] Add signup functionality
- [ ] Create tab navigation
- [ ] Integrate Stripe payments
- [ ] Build metrics display

### Week 2 Goals
- [ ] Add AI insights integration
- [ ] Implement push notifications
- [ ] Create file upload functionality
- [ ] Build task management
- [ ] Add real-time updates

### Week 3 Goals
- [ ] Polish UI/UX
- [ ] Add advanced features (camera, sharing)
- [ ] Implement offline support
- [ ] Create app store assets
- [ ] Prepare for deployment

## Troubleshooting Common Issues

### Node.js Version Error
```bash
# If you get Node version errors:
nvm install 20
nvm use 20
# Or download latest LTS from nodejs.org
```

### Metro Bundler Issues
```bash
# Clear cache and restart:
npx expo start -c
```

### iOS Simulator Not Opening
```bash
# Ensure Xcode is installed and updated
# Run from Xcode: Xcode → Open Developer Tool → Simulator
```

### Android Emulator Issues
```bash
# Ensure Android Studio is installed
# Create AVD: Tools → AVD Manager → Create Virtual Device
```

### Supabase Connection Issues
```bash
# Check environment variables are set
# Verify .env.local is not in .gitignore if sharing
# Check Supabase project URL and keys in dashboard
```

This setup guide will get you from zero to a working React Native + Expo app with authentication and database integration in about 2 hours!