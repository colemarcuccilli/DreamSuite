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
import { supabase } from '../../lib/supabase'
import ResponsiveContainer from '../../components/ui/ResponsiveContainer'
import {
  getResponsiveFontSize,
  getResponsivePadding,
  responsive,
  isDesktop,
  isWeb,
  getComponentMaxWidth
} from '../../utils/responsive'

interface Props {
  navigation: any
}

export default function ResetPasswordScreen({ navigation }: Props) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [validToken, setValidToken] = useState(false)

  useEffect(() => {
    // Check if we have a valid recovery token
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash.includes('type=recovery') && hash.includes('access_token=')) {
        setValidToken(true)
      } else {
        setError('Invalid or expired password reset link. Please request a new one.')
      }
    }
  }, [])

  const validatePasswords = () => {
    if (!password) {
      setError('Please enter a new password')
      return false
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    
    if (!confirmPassword) {
      setError('Please confirm your password')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    return true
  }

  const handleResetPassword = async () => {
    setError('')
    setSuccess('')
    
    if (!validatePasswords()) return
    
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) throw error
      
      setSuccess('Password updated successfully! You can now sign in with your new password.')
      
      // Redirect to sign in after a delay
      setTimeout(() => {
        navigation.navigate('Auth')
      }, 2000)
      
    } catch (error: any) {
      setError(error.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!validToken) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={[styles.content, isWeb && styles.webContent]}>
          <ResponsiveContainer centerContent={true} maxWidth={getComponentMaxWidth()}>
            <View style={styles.header}>
              <Text style={styles.title}>Invalid Reset Link</Text>
              <Text style={styles.subtitle}>
                This password reset link is invalid or has expired.
              </Text>
            </View>

            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {error || 'Please request a new password reset link from the sign-in page.'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.primaryButtonText}>Go to Sign In</Text>
            </TouchableOpacity>
          </ResponsiveContainer>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, isWeb && styles.webContent]}>
        <ResponsiveContainer centerContent={true} maxWidth={getComponentMaxWidth()}>
          <View style={styles.header}>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>
              Please enter your new password below.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text)
                    setError('')
                  }}
                  placeholder="Enter your new password (min 6 characters)"
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <Text style={styles.passwordToggleText}>
                    {passwordVisible ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password *</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text)
                  setError('')
                }}
                placeholder="Confirm your new password"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.backButtonText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ResponsiveContainer>
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
    minHeight: isWeb ? '100vh' : 'auto',
    justifyContent: isDesktop() ? 'center' : 'flex-start',
  },
  webContent: {
    paddingVertical: responsive({ mobile: 20, desktop: 40 }),
  },
  header: {
    alignItems: 'center',
    marginBottom: responsive({ mobile: 40, desktop: 50 }),
    paddingTop: responsive({ mobile: 20, desktop: 0 }),
  },
  title: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: 'bold',
    color: '#2081C3',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    textAlign: 'center',
    lineHeight: responsive({ mobile: 24, desktop: 28 }),
  },
  form: {
    backgroundColor: 'white',
    padding: getResponsivePadding(),
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    maxWidth: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: responsive({ mobile: 16, desktop: 20 }),
    paddingVertical: responsive({ mobile: 12, desktop: 16 }),
    fontSize: getResponsiveFontSize(16),
    backgroundColor: '#fafafa',
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  passwordToggleText: {
    fontSize: 18,
  },
  primaryButton: {
    backgroundColor: '#2081C3',
    paddingVertical: responsive({ mobile: 16, desktop: 18 }),
    paddingHorizontal: responsive({ mobile: 24, desktop: 32 }),
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButtonText: {
    color: '#2081C3',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: getResponsiveFontSize(14),
    textAlign: 'center',
    lineHeight: 20,
  },
  successContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  successText: {
    color: '#15803d',
    fontSize: getResponsiveFontSize(14),
    textAlign: 'center',
    lineHeight: 20,
  },
})