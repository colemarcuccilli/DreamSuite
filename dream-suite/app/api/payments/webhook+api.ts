import { ExpoRequest, ExpoResponse } from 'expo-router/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { emailService } from '../../../lib/email-service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: ExpoRequest): Promise<Response> {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    console.error('Missing Stripe signature')
    return Response.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
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
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'invoice.payment_succeeded':
        console.log('Invoice payment succeeded:', event.data.object.id)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        console.log(`Subscription event: ${event.type}`, event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return Response.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return Response.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    )
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
    // Update booking status based on whether this was a deposit or full payment
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

    // Send confirmation and notification emails
    await sendBookingEmails(bookingId, isDeposit)
    
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

async function sendBookingEmails(bookingId: string, isDeposit: boolean) {
  try {
    // Get booking details with related data
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        services (
          id,
          name,
          description,
          duration_minutes,
          price_cents,
          category
        ),
        studios (
          id,
          name,
          email,
          phone,
          address,
          city,
          state
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !bookingData) {
      console.error('Error fetching booking for email:', bookingError)
      return
    }

    const booking = bookingData
    const service = bookingData.services
    const studio = bookingData.studios

    if (!service || !studio) {
      console.error('Missing service or studio data for booking email')
      return
    }

    const emailData = {
      booking,
      service,
      studio,
      clientName: booking.client_name,
      clientEmail: booking.client_email,
    }

    // Send confirmation email to client
    console.log('Sending booking confirmation email...')
    const confirmationSent = await emailService.sendBookingConfirmation(emailData)
    if (!confirmationSent) {
      console.error('Failed to send booking confirmation email')
    }

    // Send notification email to studio
    console.log('Sending studio notification email...')
    const notificationSent = await emailService.sendStudioNotification(emailData)
    if (!notificationSent) {
      console.error('Failed to send studio notification email')
    }

    console.log('Booking emails sent successfully')
    
  } catch (error: any) {
    console.error('Error sending booking emails:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment Intent succeeded:', paymentIntent.id)
  
  // Find booking by payment intent ID
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()

    if (error || !booking) {
      console.log('No booking found for payment intent:', paymentIntent.id)
      return
    }

    // Update payment status
    await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    console.log(`Booking ${booking.id} payment confirmed via payment intent`)
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment Intent failed:', paymentIntent.id)
  
  // Find booking by payment intent ID
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()

    if (error || !booking) {
      console.log('No booking found for failed payment intent:', paymentIntent.id)
      return
    }

    // Update payment status to failed
    await supabase
      .from('bookings')
      .update({
        payment_status: 'failed',
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    console.log(`Booking ${booking.id} payment failed - booking cancelled`)
    
    // TODO: Send payment failed notification email to client
  } catch (error) {
    console.error('Error handling payment intent failed:', error)
  }
}