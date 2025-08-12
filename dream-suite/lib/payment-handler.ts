import { Platform, Alert, Linking } from 'react-native'
import { router } from 'expo-router'

interface PaymentSessionData {
  id: string
  url: string
}

interface PaymentOptions {
  successUrl?: string
  cancelUrl?: string
  onSuccess?: () => void
  onCancel?: () => void
  onError?: (error: string) => void
}

export class PaymentHandler {
  static async handlePaymentRedirect(
    session: PaymentSessionData, 
    options: PaymentOptions = {}
  ): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // On web, redirect to Stripe Checkout
        window.location.href = session.url
      } else {
        // On React Native, show alert with options
        Alert.alert(
          'Complete Payment',
          'You will be redirected to Stripe to complete your payment securely.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: options.onCancel
            },
            {
              text: 'Continue to Payment',
              onPress: async () => {
                try {
                  await this.openPaymentInBrowser(session.url)
                } catch (error: any) {
                  options.onError?.(error.message)
                  Alert.alert('Error', 'Failed to open payment page: ' + error.message)
                }
              }
            }
          ]
        )
      }
    } catch (error: any) {
      console.error('Payment redirect error:', error)
      options.onError?.(error.message)
      Alert.alert('Payment Error', error.message)
    }
  }

  private static async openPaymentInBrowser(url: string): Promise<void> {
    try {
      // Try to use InAppBrowser if available
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      } else {
        throw new Error('Cannot open payment URL')
      }
    } catch (error) {
      console.error('Error opening payment URL:', error)
      throw error
    }
  }

  /**
   * Handle successful payment return from Stripe
   */
  static handlePaymentSuccess(sessionId: string, bookingId: string): void {
    if (Platform.OS === 'web') {
      router.push(`/booking/success/${bookingId}?session_id=${sessionId}`)
    } else {
      // For React Native, navigate to success screen
      router.push({
        pathname: '/booking/success/[bookingId]',
        params: { bookingId, session_id: sessionId }
      })
    }
  }

  /**
   * Handle cancelled payment return from Stripe
   */
  static handlePaymentCancel(bookingId: string): void {
    if (Platform.OS === 'web') {
      router.push(`/booking/cancel/${bookingId}`)
    } else {
      // For React Native, navigate to cancel screen
      router.push({
        pathname: '/booking/cancel/[bookingId]',
        params: { bookingId }
      })
    }
  }

  /**
   * Validate payment completion and update booking status
   */
  static async validatePayment(sessionId: string, bookingId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/payments/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          bookingId,
        }),
      })

      if (!response.ok) {
        throw new Error('Payment verification failed')
      }

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Payment validation error:', error)
      return false
    }
  }
}

export default PaymentHandler