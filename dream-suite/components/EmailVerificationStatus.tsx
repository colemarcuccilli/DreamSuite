import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'
import {
  getResponsiveFontSize,
} from '../utils/responsive'

interface Props {
  user: any
  userEmail: string
  onResendSuccess?: () => void
}

export default function EmailVerificationStatus({ user, userEmail, onResendSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [lastSent, setLastSent] = useState<Date | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    // Start cooldown timer if we just sent an email
    if (lastSent) {
      const interval = setInterval(() => {
        const secondsElapsed = Math.floor((Date.now() - lastSent.getTime()) / 1000)
        const remaining = Math.max(0, 60 - secondsElapsed)
        setCooldown(remaining)
        
        if (remaining === 0) {
          clearInterval(interval)
        }
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [lastSent])

  const resendVerificationEmail = async () => {
    if (cooldown > 0) return
    
    setLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })
      
      if (error) throw error
      
      setMessage('Verification email sent! Please check your inbox and spam folder.')
      setLastSent(new Date())
      setCooldown(60)
      
      if (onResendSuccess) {
        onResendSuccess()
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to send verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Don't show if user is already verified
  if (user?.email_confirmed_at) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>📧</Text>
        <Text style={styles.title}>Email Verification Required</Text>
      </View>
      
      <Text style={styles.description}>
        Please check your email ({userEmail}) and click the verification link to complete your account setup.
      </Text>
      
      {message ? (
        <View style={[styles.messageContainer, message.includes('sent') ? styles.successMessage : styles.errorMessage]}>
          <Text style={[styles.messageText, message.includes('sent') ? styles.successText : styles.errorText]}>
            {message}
          </Text>
        </View>
      ) : null}
      
      <TouchableOpacity
        style={[styles.resendButton, (loading || cooldown > 0) && styles.resendButtonDisabled]}
        onPress={resendVerificationEmail}
        disabled={loading || cooldown > 0}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#2081C3" />
        ) : (
          <Text style={[styles.resendButtonText, (cooldown > 0) && styles.resendButtonTextDisabled]}>
            {cooldown > 0 
              ? `Resend in ${cooldown}s` 
              : 'Resend verification email'
            }
          </Text>
        )}
      </TouchableOpacity>
      
      <Text style={styles.helpText}>
        Can't find the email? Check your spam folder or contact support if you continue having issues.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
  },
  description: {
    fontSize: getResponsiveFontSize(14),
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  successMessage: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
  },
  errorMessage: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  messageText: {
    fontSize: getResponsiveFontSize(14),
    textAlign: 'center',
    lineHeight: 18,
  },
  successText: {
    color: '#15803d',
  },
  errorText: {
    color: '#dc2626',
  },
  resendButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2081C3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    minWidth: 180,
    alignItems: 'center',
  },
  resendButtonDisabled: {
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  resendButtonText: {
    color: '#2081C3',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#9ca3af',
  },
  helpText: {
    fontSize: getResponsiveFontSize(12),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
})