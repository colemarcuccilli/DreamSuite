import { Platform } from 'react-native'
import { Booking, Service, PaymentResult, PaymentSession } from '../types/booking'

const API_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000')

export class StripeBookingService {
  private static instance: StripeBookingService
  
  static getInstance(): StripeBookingService {
    if (!this.instance) {
      this.instance = new StripeBookingService()
    }
    return this.instance
  }

  /**
   * Create a Stripe Checkout session for a booking
   */
  async createBookingPayment(
    booking: Booking,
    service: Service,
    returnUrl: string
  ): Promise<PaymentResult> {
    try {
      const response = await fetch(`${API_URL}/api/payments/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          serviceId: service.id,
          serviceName: service.name,
          priceCents: service.price_cents,
          clientName: booking.client_name,
          clientEmail: booking.client_email,
          requiresDeposit: service.requires_deposit,
          depositPercentage: service.deposit_percentage,
          returnUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Payment session creation failed')
      }

      const result = await response.json()
      
      return {
        success: true,
        session: {
          id: result.session.id,
          url: result.session.url,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }
      }
    } catch (error: any) {
      console.error('Stripe booking payment error:', error)
      return {
        success: false,
        error: error.message || 'Failed to create payment session'
      }
    }
  }

  /**
   * Handle payment completion - redirect user to appropriate flow
   */
  async handlePaymentSuccess(sessionId: string, bookingId: string): Promise<void> {
    try {
      // Verify the payment with our backend
      const response = await fetch(`${API_URL}/api/stripe/verify-booking-payment`, {
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
      
      if (!result.success) {
        throw new Error(result.error || 'Payment verification failed')
      }

      // Payment successful - booking should be confirmed via webhook
      console.log('Payment verified successfully')
      
    } catch (error: any) {
      console.error('Payment verification error:', error)
      throw error
    }
  }

  /**
   * Create deposit payment (for services requiring deposits)
   */
  async createDepositPayment(
    booking: Booking,
    service: Service,
    depositAmount: number,
    returnUrl: string
  ): Promise<PaymentResult> {
    try {
      const response = await fetch(`${API_URL}/api/stripe/create-deposit-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          serviceId: service.id,
          studioId: booking.studio_id,
          clientEmail: booking.client_email,
          clientName: booking.client_name,
          depositAmount: depositAmount,
          totalAmount: booking.total_price_cents,
          serviceName: service.name,
          startTime: booking.start_time,
          returnUrl,
          metadata: {
            booking_id: booking.id,
            service_id: service.id,
            studio_id: booking.studio_id,
            payment_type: 'deposit'
          }
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Deposit payment session creation failed: ${error}`)
      }

      const session = await response.json()
      
      return {
        success: true,
        session: {
          session_id: session.id,
          url: session.url,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }
      }
    } catch (error: any) {
      console.error('Stripe deposit payment error:', error)
      return {
        success: false,
        error: error.message || 'Failed to create deposit payment session'
      }
    }
  }

  /**
   * Create final payment (remaining balance after deposit)
   */
  async createFinalPayment(
    bookingId: string,
    remainingAmount: number,
    returnUrl: string
  ): Promise<PaymentResult> {
    try {
      const response = await fetch(`${API_URL}/api/stripe/create-final-payment-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount: remainingAmount,
          returnUrl,
          metadata: {
            booking_id: bookingId,
            payment_type: 'final'
          }
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Final payment session creation failed: ${error}`)
      }

      const session = await response.json()
      
      return {
        success: true,
        session: {
          session_id: session.id,
          url: session.url,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }
      }
    } catch (error: any) {
      console.error('Stripe final payment error:', error)
      return {
        success: false,
        error: error.message || 'Failed to create final payment session'
      }
    }
  }

  /**
   * Open payment URL - handles cross-platform differences
   */
  async openPaymentUrl(paymentUrl: string): Promise<void> {
    if (Platform.OS === 'web') {
      // On web, redirect to Stripe Checkout
      window.location.href = paymentUrl
    } else {
      // On mobile, open in-app browser
      try {
        const { default: InAppBrowser } = await import('react-native-inappbrowser-reborn')
        
        if (await InAppBrowser.isAvailable()) {
          await InAppBrowser.open(paymentUrl, {
            // iOS options
            dismissButtonStyle: 'close',
            preferredBarTintColor: '#2081C3',
            preferredControlTintColor: 'white',
            readerMode: false,
            animated: true,
            modalEnabled: true,
            modalPresentationStyle: 'fullScreen',
            modalTransitionStyle: 'crossDissolve',
            // Android options
            showTitle: true,
            showInRecents: false,
            toolbarColor: '#2081C3',
            secondaryToolbarColor: 'black',
            enableUrlBarHiding: true,
            enableDefaultShare: true,
            forceCloseOnRedirection: false,
            animations: {
              startEnter: 'slide_in_right',
              startExit: 'slide_out_left',
              endEnter: 'slide_in_left',
              endExit: 'slide_out_right'
            }
          })
        } else {
          // Fallback to Linking if InAppBrowser not available
          const { Linking } = await import('react-native')
          await Linking.openURL(paymentUrl)
        }
      } catch (error) {
        console.error('Failed to open payment URL:', error)
        // Final fallback
        const { Linking } = await import('react-native')
        await Linking.openURL(paymentUrl)
      }
    }
  }

  /**
   * Get payment status for a booking
   */
  async getPaymentStatus(bookingId: string): Promise<{
    paid: boolean
    amount_paid: number
    payment_intent_id?: string
    status: string
  }> {
    try {
      const response = await fetch(`${API_URL}/api/stripe/booking-payment-status/${bookingId}`)
      
      if (!response.ok) {
        throw new Error('Failed to get payment status')
      }

      return await response.json()
    } catch (error: any) {
      console.error('Error getting payment status:', error)
      throw error
    }
  }

  /**
   * Process refund for cancelled booking
   */
  async processRefund(
    bookingId: string, 
    amount?: number, 
    reason?: string
  ): Promise<{ success: boolean; refund_id?: string; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/api/stripe/refund-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount, // If not provided, refunds full amount
          reason: reason || 'Booking cancelled'
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Refund failed: ${error}`)
      }

      return await response.json()
    } catch (error: any) {
      console.error('Refund error:', error)
      return {
        success: false,
        error: error.message || 'Failed to process refund'
      }
    }
  }
}

export const stripeBookingService = StripeBookingService.getInstance()