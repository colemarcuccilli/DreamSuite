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
import { supabase } from '../lib/supabase'
import ResponsiveContainer from './ui/ResponsiveContainer'
import {
  getResponsiveFontSize,
  getResponsivePadding,
  responsive,
  isDesktop,
  isWeb,
  getComponentMaxWidth
} from '../utils/responsive'

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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [sessionExpired, setSessionExpired] = useState(false)

  // Check if user is already logged in and handle URL tokens
  useEffect(() => {
    checkUser()
    handleUrlTokens()
    checkSessionExpiry()
  }, [])

  const handleUrlTokens = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      
      // Check for email confirmation
      if (hash.includes('type=signup') || hash.includes('type=email_change')) {
        setSuccess('Email confirmed successfully! You can now sign in.')
        setEmailVerificationSent(false)
      }
      
      // Check for password recovery
      if (hash.includes('type=recovery')) {
        setSuccess('Password reset link confirmed! Please enter your new password.')
        setShowForgotPassword(false)
        setIsLogin(true)
      }
      
      // Check for expired token
      if (hash.includes('error=access_denied') || hash.includes('error=token_expired')) {
        setError('Authentication link has expired. Please try again.')
        setSessionExpired(true)
      }
    }
  }

  const checkSessionExpiry = () => {
    // Check if user session is expired
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        setSessionExpired(false)
      } else if (event === 'SIGNED_OUT') {
        setSessionExpired(true)
        setError('Your session has expired. Please sign in again.')
      }
    })
  }

  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!password && !showForgotPassword) {
      errors.password = 'Password is required'
    } else if (password.length < 6 && !showForgotPassword) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    if (!isLogin && !showForgotPassword) {
      if (!fullName.trim()) {
        errors.fullName = 'Full name is required'
      }
      
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
    setFormErrors({})
  }

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

  const handleForgotPassword = async () => {
    clearMessages()
    
    if (!email) {
      setError('Please enter your email address to reset your password')
      return
    }

    if (!validateForm()) return

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      setResetEmailSent(true)
      setSuccess(`Password reset instructions have been sent to ${email}. Please check your inbox and spam folder.`)
      setShowForgotPassword(false)
    } catch (error: any) {
      setError(error.message || 'Failed to send password reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async () => {
    clearMessages()
    
    if (!validateForm()) {
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

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.')
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please confirm your email address before signing in. Check your inbox for a confirmation link.')
            setEmailVerificationSent(true)
          } else {
            setError(error.message)
          }
          return
        }

        if (data.user) {
          setSuccess('Welcome back!')
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

        if (error) {
          if (error.message.includes('User already registered')) {
            setError('An account with this email already exists. Please sign in instead.')
            setIsLogin(true)
          } else {
            setError(error.message)
          }
          return
        }

        if (data.user) {
          if (data.user.email_confirmed_at) {
            setSuccess('Account created successfully!')
            onAuthSuccess(data.user)
          } else {
            setEmailVerificationSent(true)
            setSuccess(`Account created! Please check your email (${email}) and click the confirmation link to complete your registration.`)
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setError(error.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase()
      })
      
      if (error) throw error
      
      setSuccess('Verification email resent! Please check your inbox.')
    } catch (error: any) {
      setError(error.message || 'Failed to resend verification email')
    } finally {
      setLoading(false)
    }
  }

  // Show forgot password screen
  if (showForgotPassword) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={[styles.content, isWeb && styles.webContent]}>
          <ResponsiveContainer centerContent={true} maxWidth={getComponentMaxWidth()}>
            <View style={styles.header}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you a link to reset your password.
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
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={[styles.input, formErrors.email && styles.inputError]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text)
                    clearMessages()
                  }}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {formErrors.email ? (
                  <Text style={styles.fieldError}>{formErrors.email}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.authButton, loading && styles.authButtonDisabled]}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.authButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowForgotPassword(false)}
              >
                <Text style={styles.toggleButtonText}>← Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.content, isWeb && styles.webContent]}
        showsVerticalScrollBar={isDesktop()}
      >
        <ResponsiveContainer centerContent={true} maxWidth={getComponentMaxWidth()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isLogin ? 'Sign In to Dream Suite' : 'Join Dream Suite'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin 
                ? 'Welcome back! Sign in to access your account.' 
                : 'Create an account to start booking studio sessions.'
              }
            </Text>
          </View>

          {/* Session Expired Warning */}
          {sessionExpired && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                ⚠️ Your session has expired. Please sign in again.
              </Text>
            </View>
          )}

          {/* Error Messages */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Success Messages */}
          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {/* Email Verification Reminder */}
          {emailVerificationSent && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                📧 Check your email for a verification link.
              </Text>
              <TouchableOpacity style={styles.linkButton} onPress={resendVerificationEmail}>
                <Text style={styles.linkButtonText}>Resend verification email</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Password Reset Confirmation */}
          {resetEmailSent && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                ✅ Password reset email sent! Check your inbox and spam folder.
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={[styles.input, formErrors.fullName && styles.inputError]}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text)
                    clearMessages()
                  }}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {formErrors.fullName ? (
                  <Text style={styles.fieldError}>{formErrors.fullName}</Text>
                ) : null}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, formErrors.email && styles.inputError]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  clearMessages()
                }}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {formErrors.email ? (
                <Text style={styles.fieldError}>{formErrors.email}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, formErrors.password && styles.inputError]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text)
                    clearMessages()
                  }}
                  placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
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
              {formErrors.password ? (
                <Text style={styles.fieldError}>{formErrors.password}</Text>
              ) : null}
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={[styles.input, formErrors.confirmPassword && styles.inputError]}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text)
                    clearMessages()
                  }}
                  placeholder="Confirm your password"
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {formErrors.confirmPassword ? (
                  <Text style={styles.fieldError}>{formErrors.confirmPassword}</Text>
                ) : null}
              </View>
            )}

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
                onPress={() => setShowForgotPassword(true)}
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
                onPress={() => {
                  setIsLogin(!isLogin)
                  clearMessages()
                }}
              >
                <Text style={styles.toggleButtonText}>
                  {isLogin ? 'Create Account' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Special Admin Note */}
            {email.toLowerCase() === 'jayvalleo@sweetdreamsmusic.com' && (
              <View style={styles.superAdminBadge}>
                <Text style={styles.superAdminBadgeText}>
                  🎵 Sweet Dreams Music Super Admin Account
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
  authButton: {
    backgroundColor: '#2081C3',
    paddingVertical: responsive({ mobile: 16, desktop: 18 }),
    paddingHorizontal: responsive({ mobile: 24, desktop: 32 }),
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  authButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  authButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(18),
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
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toggleButtonText: {
    color: '#2081C3',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
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
  superAdminBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  superAdminBadgeText: {
    color: '#92400e',
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
    textAlign: 'center',
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
  warningContainer: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  warningText: {
    color: '#d97706',
    fontSize: getResponsiveFontSize(14),
    textAlign: 'center',
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    color: '#2563eb',
    fontSize: getResponsiveFontSize(14),
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  linkButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  linkButtonText: {
    color: '#2081C3',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  fieldError: {
    color: '#dc2626',
    fontSize: getResponsiveFontSize(12),
    marginTop: 4,
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
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
})