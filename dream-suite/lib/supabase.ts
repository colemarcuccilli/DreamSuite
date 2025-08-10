import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Environment variables (will be set in .env.local)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

// Custom storage adapter that works on both web and mobile
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        const item = localStorage.getItem(key)
        return item
      } catch {
        return null
      }
    }
    try {
      const item = await SecureStore.getItemAsync(key)
      return item
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value)
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    } else {
      try {
        await SecureStore.setItemAsync(key, value)
      } catch (error) {
        console.error('Error saving to SecureStore:', error)
      }
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error('Error removing from localStorage:', error)
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(key)
      } catch (error) {
        console.error('Error removing from SecureStore:', error)
      }
    }
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

// Type definitions for database tables
export interface Artist {
  id: string
  email: string
  name: string
  avatar_url?: string
  genre?: string
  career_stage?: 'emerging' | 'developing' | 'established'
  subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
  stripe_customer_id?: string
  push_token?: string
  onboarded_at?: string
  created_at: string
  updated_at: string
}

export interface Metric {
  id: string
  artist_id: string
  platform: 'spotify' | 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'soundcloud'
  metric_date: string
  followers: number
  engagement_rate: number
  content_views: number
  streams?: number
  raw_data?: any
  created_at: string
}

export interface Insight {
  id: string
  artist_id: string
  type: 'brand' | 'content' | 'audience' | 'growth' | 'monetization'
  title: string
  description?: string
  recommendations?: string[]
  priority: 'high' | 'medium' | 'low'
  status: 'unread' | 'read' | 'actioned'
  created_by: 'ai' | 'manual' | 'system'
  created_at: string
}

export interface Task {
  id: string
  artist_id: string
  title: string
  description?: string
  category?: 'content' | 'engagement' | 'branding' | 'business' | 'general'
  due_date?: string
  completed: boolean
  completed_at?: string
  impact_score?: number
  created_at: string
}

export interface Achievement {
  id: string
  artist_id: string
  type: 'milestone' | 'streak' | 'level' | 'badge'
  name: string
  description?: string
  unlocked_at: string
  metadata?: any
}