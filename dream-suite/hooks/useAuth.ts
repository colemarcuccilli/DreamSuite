import { useState, useEffect, createContext, useContext } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, Artist } from '../lib/supabase'
import { Alert } from 'react-native'

interface AuthContextType {
  user: User | null
  artist: Artist | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [artist, setArtist] = useState<Artist | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadArtistProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadArtistProfile(session.user.id)
      } else {
        setArtist(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadArtistProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setArtist(data)
    } catch (error: any) {
      console.error('Error loading artist profile:', error.message)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true)
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) throw error

      // Create artist profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('artists')
          .insert({
            id: data.user.id,
            email,
            name,
            subscription_status: 'inactive',
          })

        if (profileError) throw profileError
      }

      Alert.alert(
        'Success!', 
        'Please check your email to verify your account.',
        [{ text: 'OK' }]
      )
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      Alert.alert('Sign Out Error', error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadArtistProfile(user.id)
    }
  }

  const value = {
    user,
    artist,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}