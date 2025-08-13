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

  const body = req.body
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        console.log('Payment succeeded for session:', session.id)
        
        // Update booking status
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed',
            payment_status: 'paid',
            stripe_session_id: session.id
          })
          .eq('stripe_session_id', session.id)

        if (updateError) {
          console.error('Error updating booking:', updateError)
        }
        break

      case 'checkout.session.expired':
        const expiredSession = event.data.object
        console.log('Payment session expired:', expiredSession.id)
        
        // Update booking status to cancelled
        const { error: expiredError } = await supabase
          .from('bookings')
          .update({ 
            status: 'cancelled',
            payment_status: 'expired'
          })
          .eq('stripe_session_id', expiredSession.id)

        if (expiredError) {
          console.error('Error updating expired booking:', expiredError)
        }
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('Payment intent succeeded:', paymentIntent.id)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        console.log('Payment intent failed:', failedPayment.id)
        
        // Update booking status to payment failed
        const { error: failedError } = await supabase
          .from('bookings')
          .update({ 
            status: 'pending_payment',
            payment_status: 'failed'
          })
          .eq('stripe_payment_intent_id', failedPayment.id)

        if (failedError) {
          console.error('Error updating failed payment:', failedError)
        }
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}