# Dream Suite - React Native + Expo (Web & Mobile) Complete Implementation

## Why React Native + Expo is THE PERFECT Choice

### One Codebase = Everything
```yaml
What You Write Once → What You Get:
- iOS App ✅
- Android App ✅ 
- Web App ✅
- Desktop App (via Electron) ✅
- Progressive Web App ✅

The Dream: Write once, deploy everywhere - IT'S REAL!
```

## Expo Can Do EVERYTHING Dream Suite Needs

### ✅ YES, React Native/Expo Can Handle:
```yaml
Authentication: Expo Auth Session + Supabase
Payments: Stripe SDK (expo-stripe-checkout or RevenueCat)
Real-time Updates: Supabase Realtime WebSockets
Push Notifications: Expo Notifications (built-in!)
File Uploads: Expo Image/Document Picker + Supabase Storage
Camera/Video: Expo Camera/Media Library
Background Tasks: Expo Background Fetch
Offline Support: AsyncStorage + NetInfo
Analytics: Expo Analytics + Segment
Deep Linking: Expo Linking
In-App Purchases: RevenueCat or expo-in-app-purchases
Social Login: Apple/Google/Facebook via Expo Auth
Biometric Auth: Expo Local Authentication
Maps: Expo Maps (if needed for venues)
Audio Recording: Expo AV (for artist demos)
Calendar Integration: Expo Calendar
Contacts Access: Expo Contacts
Share Features: Expo Sharing
```

## Project Setup - Zero to Full App

### Step 1: Initialize Expo Project
```bash
# Create new Expo project with TypeScript
npx create-expo-app dream-suite --template

# Choose: Blank (TypeScript)

cd dream-suite

# Install navigation (critical for multi-screen apps)
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# Install essential packages
npx expo install @supabase/supabase-js
npx expo install react-native-url-polyfill
npx expo install react-native-async-storage/async-storage
npx expo install expo-secure-store
npx expo install expo-auth-session expo-crypto

# UI Components (NativeBase or Tamagui for cross-platform)
npm install tamagui @tamagui/config @tamagui/animations-react-native

# Development tools
npx expo install expo-dev-client

# Run on web
npx expo start --web

# Run on iOS/Android
npx expo start
```

### Step 2: Project Structure (Web + Mobile)
```
dream-suite/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth layout
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                  # Main app with tab navigation
│   │   ├── _layout.tsx          # Tab layout
│   │   ├── index.tsx            # Dashboard
│   │   ├── insights.tsx         # AI Insights
│   │   ├── tasks.tsx           # Tasks
│   │   ├── metrics.tsx         # Analytics
│   │   └── profile.tsx         # Settings/Profile
│   ├── _layout.tsx              # Root layout
│   └── +not-found.tsx          # 404 page
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── dashboard/
│   │   ├── MetricsCard.tsx
│   │   ├── InsightsFeed.tsx
│   │   ├── TaskList.tsx
│   │   └── GrowthChart.tsx
│   └── charts/
│       └── LineChart.tsx       # Using victory-native
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── stripe.ts               # Stripe integration
│   ├── notifications.ts        # Push notifications
│   └── storage.ts              # Async storage helpers
├── hooks/
│   ├── useAuth.ts
│   ├── useMetrics.ts
│   └── useRealtime.ts
├── stores/                      # Zustand for state management
│   ├── authStore.ts
│   ├── metricsStore.ts
│   └── notificationStore.ts
├── services/
│   ├── api.ts
│   ├── ai.ts
│   └── analytics.ts
├── constants/
│   └── Colors.ts
├── app.json                     # Expo configuration
├── babel.config.js
├── tsconfig.json
└── eas.json                     # EAS Build configuration
```

## Core Implementation

### 1. Supabase Setup (Works on Web + Mobile)
```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Custom storage that works on both web and mobile
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      return Promise.resolve(localStorage.getItem(key))
    }
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value)
      return Promise.resolve()
    }
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key)
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

### 2. Authentication (Works Everywhere)
```typescript
// app/(auth)/login.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Google from 'expo-auth-session/providers/google'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Google Sign In (works on all platforms)
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  })

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response
      signInWithGoogle(authentication!.accessToken)
    }
  }, [response])

  async function signInWithEmail() {
    setLoading(true)
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      router.replace('/(tabs)/')
    }
    setLoading(false)
  }

  async function signInWithGoogle(token: string) {
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token,
    })

    if (!error) {
      router.replace('/(tabs)/')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Welcome to Dream Suite</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity
          style={styles.button}
          onPress={signInWithEmail}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Platform-specific auth buttons */}
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={5}
            style={styles.appleButton}
            onPress={async () => {
              try {
                const credential = await AppleAuthentication.signInAsync({
                  requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                  ],
                })
                // Handle Apple sign in
              } catch (e) {
                console.error(e)
              }
            }}
          />
        )}

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync()}
        >
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
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
  },
  form: {
    gap: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2081C3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})
```

### 3. Dashboard with Real-time Updates
```typescript
// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import MetricsCard from '@/components/dashboard/MetricsCard'
import InsightsFeed from '@/components/dashboard/InsightsFeed'
import TaskList from '@/components/dashboard/TaskList'
import GrowthChart from '@/components/charts/GrowthChart'
import * as Notifications from 'expo-notifications'

export default function DashboardScreen() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState([])
  const [insights, setInsights] = useState([])
  const [tasks, setTasks] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
    setupRealtimeSubscriptions()
    setupPushNotifications()
  }, [])

  async function loadDashboardData() {
    const [metricsData, insightsData, tasksData] = await Promise.all([
      supabase
        .from('metrics')
        .select('*')
        .eq('artist_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('insights')
        .select('*')
        .eq('artist_id', user?.id)
        .eq('status', 'unread')
        .limit(10),
      supabase
        .from('tasks')
        .select('*')
        .eq('artist_id', user?.id)
        .eq('completed', false)
        .order('due_date'),
    ])

    if (metricsData.data) setMetrics(metricsData.data)
    if (insightsData.data) setInsights(insightsData.data)
    if (tasksData.data) setTasks(tasksData.data)
  }

  function setupRealtimeSubscriptions() {
    // Real-time metrics updates
    const metricsChannel = supabase
      .channel('metrics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'metrics',
          filter: `artist_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMetrics((prev) => [payload.new, ...prev])
            
            // Show push notification on mobile
            if (Platform.OS !== 'web') {
              Notifications.scheduleNotificationAsync({
                content: {
                  title: 'New Metrics Available!',
                  body: 'Check your dashboard for updates',
                },
                trigger: null,
              })
            }
          }
        }
      )
      .subscribe()

    // Real-time insights
    const insightsChannel = supabase
      .channel('insights-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'insights',
          filter: `artist_id=eq.${user?.id}`,
        },
        (payload) => {
          setInsights((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      metricsChannel.unsubscribe()
      insightsChannel.unsubscribe()
    }
  }

  async function setupPushNotifications() {
    if (Platform.OS === 'web') return

    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return

    const token = await Notifications.getExpoPushTokenAsync()
    
    // Save token to database
    await supabase
      .from('artists')
      .update({ push_token: token.data })
      .eq('id', user?.id)
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
        <Text style={styles.greeting}>Welcome back, {user?.name}!</Text>
        <Text style={styles.subtitle}>Your career is on track</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricsCard
          title="Total Reach"
          value={metrics.reduce((sum, m) => sum + m.followers, 0)}
          trend="up"
        />
        <MetricsCard
          title="Engagement"
          value={calculateEngagement(metrics)}
          format="percentage"
        />
        <MetricsCard
          title="Tasks"
          value={tasks.filter((t) => !t.completed).length}
          subtitle="pending"
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Growth Trajectory</Text>
        <GrowthChart data={metrics} />
      </View>

      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>AI Insights</Text>
        <InsightsFeed insights={insights} />
      </View>

      <View style={styles.tasksContainer}>
        <Text style={styles.sectionTitle}>Your Tasks</Text>
        <TaskList
          tasks={tasks}
          onComplete={async (taskId) => {
            await supabase
              .from('tasks')
              .update({ completed: true })
              .eq('id', taskId)
            
            setTasks(tasks.filter((t) => t.id !== taskId))
          }}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  insightsContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 12,
  },
  tasksContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 12,
  },
})
```

### 4. Stripe Payments (Mobile + Web)
```typescript
// lib/stripe.ts
import { Platform } from 'react-native'
import { STRIPE_PUBLISHABLE_KEY } from '@env'

// For mobile payments, we'll use a different approach
export async function createCheckoutSession(userId: string) {
  const response = await fetch(`${API_URL}/api/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      priceId: 'price_dreamSuite_monthly',
    }),
  })

  const { url, sessionId } = await response.json()

  if (Platform.OS === 'web') {
    // Redirect to Stripe Checkout
    window.location.href = url
  } else {
    // On mobile, use in-app browser or WebView
    const { default: InAppBrowser } = await import(
      'react-native-inappbrowser-reborn'
    )
    
    if (await InAppBrowser.isAvailable()) {
      await InAppBrowser.open(url, {
        dismissButtonStyle: 'close',
        preferredBarTintColor: '#2081C3',
        preferredControlTintColor: 'white',
      })
    }
  }
}

// Alternative: Use RevenueCat for easier mobile payments
import Purchases from 'react-native-purchases'

export async function setupRevenueCat(userId: string) {
  if (Platform.OS !== 'web') {
    await Purchases.configure({
      apiKey: Platform.OS === 'ios' 
        ? 'appl_YOUR_KEY' 
        : 'goog_YOUR_KEY',
      appUserID: userId,
    })
  }
}
```

### 5. File Uploads (Camera/Gallery)
```typescript
// components/ContentUploader.tsx
import React from 'react'
import { View, Button, Image, Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { supabase } from '@/lib/supabase'

export default function ContentUploader({ onUpload }) {
  const [image, setImage] = useState(null)

  const pickImage = async () => {
    // Request permissions
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions!')
        return
      }
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      uploadToSupabase(result.assets[0])
    }
  }

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      alert('Camera not available on web')
      return
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions!')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      uploadToSupabase(result.assets[0])
    }
  }

  const uploadToSupabase = async (asset) => {
    const fileName = `${Date.now()}-${asset.fileName || 'upload.jpg'}`
    
    // Convert to blob for upload
    const response = await fetch(asset.uri)
    const blob = await response.blob()

    const { data, error } = await supabase.storage
      .from('content')
      .upload(`${user.id}/${fileName}`, blob)

    if (data) {
      onUpload(data.path)
    }
  }

  return (
    <View>
      <Button title="Pick from Gallery" onPress={pickImage} />
      {Platform.OS !== 'web' && (
        <Button title="Take Photo" onPress={takePhoto} />
      )}
      {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
    </View>
  )
}
```

### 6. Push Notifications
```typescript
// services/notifications.ts
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Configure how notifications are displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications() {
  if (Platform.OS === 'web') return null

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return null
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-project-id',
  })

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  return token.data
}

export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'local' },
    },
    trigger: null, // Immediately
  })
}
```

### 7. Background Tasks (Sync Data)
```typescript
// services/backgroundTasks.ts
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'

const BACKGROUND_FETCH_TASK = 'background-fetch-metrics'

// Define the task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Fetch latest metrics from APIs
    const metrics = await fetchLatestMetrics()
    
    // Store in Supabase
    await supabase.from('metrics').insert(metrics)
    
    // Send notification if significant change
    if (metrics.followersChange > 100) {
      await sendLocalNotification(
        'Growing Fast!',
        `You gained ${metrics.followersChange} followers today!`
      )
    }
    
    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

// Register the task
export async function registerBackgroundFetch() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  })
}
```

### 8. Charts that Work Everywhere
```typescript
// components/charts/GrowthChart.tsx
import React from 'react'
import { View, Dimensions, Platform } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { VictoryLine, VictoryChart } from 'victory-native'

const screenWidth = Dimensions.get('window').width

export default function GrowthChart({ data }) {
  // Use different charting libraries based on platform
  if (Platform.OS === 'web') {
    // Use recharts for web
    const Recharts = require('recharts')
    return (
      <Recharts.LineChart width={screenWidth - 40} height={200} data={data}>
        <Recharts.Line type="monotone" dataKey="followers" stroke="#2081C3" />
      </Recharts.LineChart>
    )
  }

  // Use react-native-chart-kit for mobile
  return (
    <LineChart
      data={{
        labels: data.map(d => d.date),
        datasets: [{
          data: data.map(d => d.followers)
        }]
      }}
      width={screenWidth - 40}
      height={220}
      chartConfig={{
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(32, 129, 195, ${opacity})`,
      }}
      bezier
      style={{
        marginVertical: 8,
        borderRadius: 16
      }}
    />
  )
}
```

## Deployment

### Mobile App Deployment
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

### Web Deployment (Vercel)
```bash
# Build for web
npx expo export --platform web

# Deploy to Vercel
vercel --prod
```

### EAS Update (Over-the-Air Updates)
```bash
# Push updates without app store review
eas update --branch production --message "Fixed dashboard bug"
```

## Advanced Features

### 1. AI Chat Assistant (Mobile + Web)
```typescript
// components/AIChat.tsx
import React, { useState } from 'react'
import { View, TextInput, FlatList, KeyboardAvoidingView } from 'react-native'

export default function AIChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const sendMessage = async () => {
    const userMessage = { text: input, sender: 'user' }
    setMessages([...messages, userMessage])
    
    // Call AI API
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: input })
    })
    
    const aiResponse = await response.json()
    setMessages(prev => [...prev, { text: aiResponse.text, sender: 'ai' }])
    setInput('')
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={{
            padding: 10,
            backgroundColor: item.sender === 'user' ? '#e3f2fd' : '#f5f5f5'
          }}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
      <TextInput
        value={input}
        onChangeText={setInput}
        onSubmitEditing={sendMessage}
        placeholder="Ask your AI coach..."
      />
    </KeyboardAvoidingView>
  )
}
```

### 2. Offline Support
```typescript
// hooks/useOffline.ts
import NetInfo from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected)
      
      if (state.isConnected) {
        // Sync offline data when back online
        syncOfflineData()
      }
    })

    return unsubscribe
  }, [])

  const syncOfflineData = async () => {
    const offlineData = await AsyncStorage.getItem('offlineQueue')
    if (offlineData) {
      const queue = JSON.parse(offlineData)
      for (const action of queue) {
        await processOfflineAction(action)
      }
      await AsyncStorage.removeItem('offlineQueue')
    }
  }

  return { isOffline }
}
```

## Why This Stack is PERFECT for Dream Suite

### 1. **True Cross-Platform**
- One codebase for iOS, Android, and Web
- 95% code sharing
- Native performance

### 2. **Mobile-First Features**
- Push notifications built-in
- Camera/gallery access
- Biometric authentication
- Background sync
- Offline support

### 3. **Cost Effective**
- One team instead of three (iOS, Android, Web)
- Faster development
- Easier maintenance

### 4. **User Experience**
- Native feel on mobile
- Responsive on web
- Consistent across platforms

### 5. **Future Proof**
- Can add desktop app later (Electron)
- Progressive Web App support
- Over-the-air updates

## You Can Build EVERYTHING with React Native + Expo

- ✅ **Mobile App** - iOS & Android native apps
- ✅ **Web App** - Full responsive web application
- ✅ **Authentication** - Social login, biometric, magic links
- ✅ **Payments** - Stripe, In-app purchases, subscriptions
- ✅ **Real-time** - WebSockets work everywhere
- ✅ **Push Notifications** - Native push + web push
- ✅ **File Uploads** - Camera, gallery, documents
- ✅ **Background Tasks** - Sync data, fetch updates
- ✅ **Offline Support** - AsyncStorage + sync queue
- ✅ **AI Integration** - API calls work everywhere
- ✅ **Analytics** - Segment, Mixpanel, custom
- ✅ **Deep Linking** - Universal links support
- ✅ **Social Sharing** - Native share sheets
- ✅ **Maps** - If needed for venue features
- ✅ **Audio/Video** - Recording and playback

This is literally EVERYTHING Dream Suite needs, and you write it ONCE!