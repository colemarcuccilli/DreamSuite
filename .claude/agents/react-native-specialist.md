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
      return () => {
        // Cleanup if needed
      }
    }, [])
  )

  const loadData = async () => {
    try {
      setLoading(true)
      // Load data here
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [])

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
        {/* Content */}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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

### Cross-Platform Storage Hook
```tsx
import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

export function useSecureStorage(key: string, defaultValue: any) {
  const [value, setValue] = useState(defaultValue)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadValue()
  }, [])

  const loadValue = async () => {
    try {
      let item: string | null = null
      
      if (Platform.OS === 'web') {
        item = localStorage.getItem(key)
      } else {
        // Use SecureStore for sensitive data on mobile
        item = await SecureStore.getItemAsync(key)
      }
      
      if (item) {
        setValue(JSON.parse(item))
      }
    } catch (error) {
      console.error('Error loading from storage:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveValue = async (newValue: any) => {
    try {
      setValue(newValue)
      const stringValue = JSON.stringify(newValue)
      
      if (Platform.OS === 'web') {
        localStorage.setItem(key, stringValue)
      } else {
        await SecureStore.setItemAsync(key, stringValue)
      }
    } catch (error) {
      console.error('Error saving to storage:', error)
      throw error
    }
  }

  const removeValue = async () => {
    try {
      setValue(defaultValue)
      
      if (Platform.OS === 'web') {
        localStorage.removeItem(key)
      } else {
        await SecureStore.deleteItemAsync(key)
      }
    } catch (error) {
      console.error('Error removing from storage:', error)
    }
  }

  return { value, saveValue, removeValue, loading }
}
```

### Navigation Setup (Expo Router)
```tsx
// app/_layout.tsx
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'expo-router'

export default function RootLayout() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)')
      } else {
        router.replace('/(auth)/login')
      }
    }
  }, [user, loading])

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  )
}
```

## Performance Optimization Checklist
- [ ] Use FlatList for large lists, not ScrollView
- [ ] Implement lazy loading for images with proper placeholders
- [ ] Use useCallback/useMemo for expensive operations
- [ ] Optimize bundle size with proper tree-shaking
- [ ] Implement proper navigation preloading
- [ ] Use native animations (Animated API or Reanimated)
- [ ] Minimize bridge communication
- [ ] Implement proper memory management
- [ ] Use InteractionManager for expensive operations
- [ ] Profile with Flipper/React DevTools

## Platform-Specific Features

### iOS Specific
```tsx
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

if (Platform.OS === 'ios') {
  // Haptic feedback on actions
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  
  // iOS-specific styling
  styles.shadow = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  }
}
```

### Android Specific
```tsx
if (Platform.OS === 'android') {
  // Android-specific styling
  styles.elevation = {
    elevation: 4,
  }
  
  // Handle back button
  BackHandler.addEventListener('hardwareBackPress', () => {
    // Custom back handling
    return true // Prevent default
  })
}
```

### Web Specific
```tsx
if (Platform.OS === 'web') {
  // Web-specific features
  styles.hover = {
    cursor: 'pointer',
    ':hover': {
      opacity: 0.8,
    }
  }
}
```

## Testing Requirements
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

## Deployment Checklist

### Pre-deployment
- [ ] Test on all platforms
- [ ] Check bundle size (<40MB for mobile)
- [ ] Verify all permissions are requested properly
- [ ] Test offline functionality
- [ ] Verify deep linking works
- [ ] Check push notification handling
- [ ] Test payment flows

### iOS Deployment
- [ ] Update app.json with correct bundle ID
- [ ] Configure App Store Connect
- [ ] Generate provisioning profiles
- [ ] Build with EAS: `eas build --platform ios`
- [ ] Submit with EAS: `eas submit --platform ios`

### Android Deployment
- [ ] Update app.json with correct package name
- [ ] Configure Google Play Console
- [ ] Generate signing key
- [ ] Build with EAS: `eas build --platform android`
- [ ] Submit with EAS: `eas submit --platform android`

### Web Deployment
- [ ] Build for web: `expo export --platform web`
- [ ] Optimize assets
- [ ] Configure Vercel
- [ ] Deploy: `vercel --prod`

## Common Issues and Solutions

### Issue: Different behavior on iOS/Android
**Solution**: Always use Platform.select() for platform-specific code

### Issue: Performance degradation with large lists
**Solution**: Use FlatList with getItemLayout and keyExtractor

### Issue: Memory leaks
**Solution**: Clean up subscriptions and listeners in useEffect cleanup

### Issue: Slow startup time
**Solution**: Implement code splitting and lazy loading

### Issue: Push notifications not working
**Solution**: Verify permissions and token registration