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
    const { bookingId, successUrl, cancelUrl } = req.body

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' })
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        studio:studios(*)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: booking.service.name,
              description: `Studio session at ${booking.studio.name}`,
            },
            unit_amount: booking.total_price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin}/booking/success/${bookingId}`,
      cancel_url: cancelUrl || `${req.headers.origin}/booking/cancel/${bookingId}`,
      metadata: {
        booking_id: bookingId,
      },
      customer_email: booking.client_email,
    })

    // Update booking with Stripe session ID
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        stripe_session_id: session.id,
        payment_status: 'pending'
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking with session ID:', updateError)
      return res.status(500).json({ error: 'Failed to update booking' })
    }

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
}