import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

// Import screens
import HomeScreen from './app/index'
import CompleteBookingFlow from './components/CompleteBookingFlow'
import AuthScreen from './components/AuthScreen'
import AdminDashboard from './components/AdminDashboard'

const Stack = createNativeStackNavigator()

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already signed in
    checkUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        loadUserProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadUserProfile(user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error loading user profile:', error)
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleAuthSuccess = (authUser: any) => {
    setUser(authUser)
    loadUserProfile(authUser.id)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return <StatusBar style="auto" />
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="Home">
            {(props) => (
              <HomeScreen 
                {...props} 
                user={user} 
                userProfile={userProfile}
                onSignOut={handleSignOut}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Booking">
            {(props) => (
              <CompleteBookingFlow 
                {...props} 
                user={user}
                userProfile={userProfile}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Auth">
            {(props) => (
              <AuthScreen 
                {...props} 
                onAuthSuccess={handleAuthSuccess}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Admin">
            {(props) => (
              <AdminDashboard 
                {...props} 
                user={user}
                userProfile={userProfile}
                onSignOut={handleSignOut}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </>
  )
}