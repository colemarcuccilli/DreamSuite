import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  navigation: any
  onAuthSuccess: (user: any) => void
}

export default function AuthScreen({ navigation, onAuthSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  // Check if user is already logged in
  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        onAuthSuccess(user)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    if (!isLogin && !fullName) {
      Alert.alert('Error', 'Please enter your full name')
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password
        })

        if (error) throw error

        if (data.user) {
          Alert.alert('Success', 'Welcome back!')
          onAuthSuccess(data.user)
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        })

        if (error) throw error

        if (data.user) {
          if (data.user.email_confirmed_at) {
            Alert.alert('Success', 'Account created successfully!')
            onAuthSuccess(data.user)
          } else {
            Alert.alert(
              'Check your email', 
              'Please check your email and click the confirmation link to complete your registration.'
            )
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      Alert.alert('Error', error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase())
      if (error) throw error
      
      Alert.alert('Success', 'Password reset email sent! Check your inbox.')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isLogin ? 'Studio Owner Login' : 'Register Your Studio'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Welcome back! Sign in to manage your studio.' 
              : 'Join the Dream Suite platform and start taking bookings.'
            }
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Auth Button */}
          <TouchableOpacity
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.authButtonText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password */}
          {isLogin && (
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotButtonText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Toggle Form */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.toggleButtonText}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Special Admin Note */}
          {email.toLowerCase() === 'jayvalleo@sweetdreamsmusic.com' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>
                🎵 Sweet Dreams Music Super Admin
              </Text>
            </View>
          )}
        </View>

        {/* Back to Home */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2081C3',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  authButton: {
    backgroundColor: '#2081C3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  authButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotButtonText: {
    color: '#2081C3',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  toggleText: {
    color: '#666',
    fontSize: 14,
    marginRight: 8,
  },
  toggleButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleButtonText: {
    color: '#2081C3',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  adminBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  adminBadgeText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  backButtonText: {
    color: '#2081C3',
    fontSize: 16,
    fontWeight: '600',
  },
})