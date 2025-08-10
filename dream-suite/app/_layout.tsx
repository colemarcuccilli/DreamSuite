import React, { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Platform } from 'react-native'
import { AuthProvider, useAuth } from '../hooks/useAuth'
import * as Notifications from 'expo-notifications'

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

function AuthNavigator() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/tabs')
      } else {
        router.replace('/auth/login')
      }
    }
  }, [user, loading])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="tabs" />
      <Stack.Screen 
        name="modals" 
        options={{ presentation: 'modal' }}
      />
    </Stack>
  )
}

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions on app start
    if (Platform.OS !== 'web') {
      Notifications.requestPermissionsAsync()
    }
  }, [])

  return (
    <AuthProvider>
      <AuthNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  )
}