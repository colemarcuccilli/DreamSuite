import { supabase } from '../lib/supabase'
import { Alert } from 'react-native'

export interface AuthResult {
  success: boolean
  user?: any
  error?: string
}

export const signInUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    })

    if (error) {
      let errorMessage = error.message
      
      // Provide more user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before signing in. Check your inbox for a confirmation link.'
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.'
      }
      
      return { success: false, error: errorMessage }
    }

    if (data.user) {
      return { success: true, user: data.user }
    }

    return { success: false, error: 'Sign in failed. Please try again.' }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}

export const signUpUser = async (
  email: string, 
  password: string, 
  fullName: string
): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        }
      }
    })

    if (error) {
      let errorMessage = error.message
      
      if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long.'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.'
      }
      
      return { success: false, error: errorMessage }
    }

    if (data.user) {
      return { 
        success: true, 
        user: data.user,
        error: data.user.email_confirmed_at ? undefined : 'Please check your email for a verification link.'
      }
    }

    return { success: false, error: 'Sign up failed. Please try again.' }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}

export const resetPassword = async (email: string): Promise<AuthResult> => {
  try {
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/reset-password`
      : 'https://dream-suite.vercel.app/auth/reset-password'

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      { redirectTo: redirectUrl }
    )

    if (error) {
      let errorMessage = error.message
      
      if (error.message.includes('Unable to validate email address')) {
        errorMessage = 'No account found with this email address.'
      } else if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = 'Too many password reset requests. Please wait before requesting another.'
      }
      
      return { success: false, error: errorMessage }
    }

    return { 
      success: true, 
      error: `Password reset instructions have been sent to ${email}. Please check your inbox and spam folder.`
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send password reset email.' }
  }
}

export const updatePassword = async (newPassword: string): Promise<AuthResult> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      let errorMessage = error.message
      
      if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long.'
      } else if (error.message.includes('New password should be different')) {
        errorMessage = 'New password must be different from your current password.'
      }
      
      return { success: false, error: errorMessage }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update password.' }
  }
}

export const resendVerificationEmail = async (email: string): Promise<AuthResult> => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase().trim()
    })

    if (error) {
      let errorMessage = error.message
      
      if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = 'Too many verification emails sent. Please wait before requesting another.'
      }
      
      return { success: false, error: errorMessage }
    }

    return { 
      success: true, 
      error: `Verification email sent to ${email}. Please check your inbox and spam folder.`
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send verification email.' }
  }
}

export const signOut = async (): Promise<AuthResult> => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to sign out.' }
  }
}

export const checkAuthStatus = async (): Promise<{ user: any | null; session: any | null }> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error checking auth status:', error)
      return { user: null, session: null }
    }
    
    const { data: { session } } = await supabase.auth.getSession()
    
    return { user, session }
  } catch (error) {
    console.error('Error checking auth status:', error)
    return { user: null, session: null }
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password) {
    return { isValid: false, message: 'Password is required' }
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' }
  }
  
  if (password.length > 72) {
    return { isValid: false, message: 'Password must be less than 72 characters' }
  }
  
  return { isValid: true }
}

export const getPasswordStrength = (password: string): {
  score: number
  label: string
  color: string
} => {
  if (!password) {
    return { score: 0, label: 'Enter a password', color: '#9ca3af' }
  }
  
  let score = 0
  
  // Length check
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  
  if (score <= 2) {
    return { score, label: 'Weak', color: '#ef4444' }
  } else if (score <= 4) {
    return { score, label: 'Medium', color: '#f59e0b' }
  } else {
    return { score, label: 'Strong', color: '#10b981' }
  }
}