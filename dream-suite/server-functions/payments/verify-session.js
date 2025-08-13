import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { sessionId, bookingId } = req.body

    if (!sessionId || !bookingId) {
      return res.status(400).json({ error: 'Session ID and Booking ID are required' })
    }

    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Verify this session belongs to the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('stripe_session_id', sessionId)
      .single()

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found or session mismatch' })
    }

    let status = 'pending_payment'
    let paymentStatus = 'pending'

    if (session.payment_status === 'paid') {
      status = 'confirmed'
      paymentStatus = 'paid'
    } else if (session.payment_status === 'unpaid') {
      status = 'pending_payment'
      paymentStatus = 'pending'
    }

    // Update booking status based on payment
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking status:', updateError)
      return res.status(500).json({ error: 'Failed to update booking' })
    }

    res.status(200).json({ 
      sessionStatus: session.payment_status,
      bookingStatus: status,
      paymentStatus,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        customer_email: session.customer_email
      }
    })
  } catch (error) {
    console.error('Error verifying session:', error)
    res.status(500).json({ error: 'Failed to verify session' })
  }
}