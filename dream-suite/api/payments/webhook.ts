import { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { buffer } from 'micro'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil' as any,
})

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Disable body parsing, we need raw body for webhook signature
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  if (!sig) {
    console.error('Missing Stripe signature')
    return res.status(400).json({ error: 'Missing signature' })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id
  const isDeposit = session.metadata?.is_deposit === 'true'

  if (!bookingId) {
    console.error('No booking ID in session metadata')
    return
  }

  try {
    // Update booking status
    const newStatus = isDeposit ? 'confirmed' : 'confirmed'
    
    const { error } = await supabase
      .from('bookings')
      .update({
        status: newStatus,
        payment_status: isDeposit ? 'deposit_paid' : 'paid',
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Error updating booking:', error)
      return
    }

    console.log(`Booking ${bookingId} updated to status: ${newStatus}`)

    // TODO: Send confirmation emails
    
  } catch (error: any) {
    console.error('Error in handleCheckoutCompleted:', error)
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id

  if (!bookingId) {
    console.error('No booking ID in session metadata')
    return
  }

  try {
    // Mark booking as cancelled due to payment timeout
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        payment_status: 'expired',
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Error updating expired booking:', error)
      return
    }

    console.log(`Booking ${bookingId} cancelled due to payment timeout`)
    
  } catch (error: any) {
    console.error('Error in handleCheckoutExpired:', error)
  }
}