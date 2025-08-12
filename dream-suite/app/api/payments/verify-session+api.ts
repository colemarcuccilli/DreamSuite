import { ExpoRequest, ExpoResponse } from 'expo-router/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const body = await request.json()
    const { sessionId, bookingId } = body

    if (!sessionId || !bookingId) {
      return Response.json(
        { error: 'Session ID and Booking ID are required' },
        { status: 400 }
      )
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return Response.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if the session is completed and payment was successful
    const isPaymentSuccessful = session.payment_status === 'paid'
    const sessionBookingId = session.metadata?.booking_id

    // Verify that the session belongs to the correct booking
    if (sessionBookingId !== bookingId) {
      return Response.json(
        { error: 'Session does not match booking' },
        { status: 400 }
      )
    }

    // Update booking status if payment was successful and not already updated
    if (isPaymentSuccessful) {
      const isDeposit = session.metadata?.is_deposit === 'true'
      const newPaymentStatus = isDeposit ? 'deposit_paid' : 'paid'
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: newPaymentStatus,
          stripe_session_id: sessionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (updateError) {
        console.error('Error updating booking:', updateError)
        return Response.json(
          { error: 'Failed to update booking' },
          { status: 500 }
        )
      }
    }

    return Response.json({
      success: isPaymentSuccessful,
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
      amountTotal: session.amount_total,
      currency: session.currency,
      isDeposit: session.metadata?.is_deposit === 'true',
    })

  } catch (error: any) {
    console.error('Error verifying payment session:', error)
    return Response.json(
      { error: 'Failed to verify payment session', details: error.message },
      { status: 500 }
    )
  }
}