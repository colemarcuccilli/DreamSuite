import { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      bookingId,
      serviceId,
      serviceName,
      priceCents,
      clientName,
      clientEmail,
      requiresDeposit,
      depositPercentage,
      returnUrl
    } = req.body

    if (!bookingId || !serviceId || !priceCents || !returnUrl) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Calculate amount (deposit if required, otherwise full price)
    let amount = priceCents
    let description = `${serviceName} - Full Payment`
    
    if (requiresDeposit && depositPercentage) {
      amount = Math.round(priceCents * (depositPercentage / 100))
      description = `${serviceName} - ${depositPercentage}% Deposit`
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: serviceName,
              description: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: clientEmail,
      metadata: {
        booking_id: bookingId,
        service_id: serviceId,
        is_deposit: requiresDeposit ? 'true' : 'false',
        client_name: clientName,
      },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl.replace('/success/', '/cancel/'),
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    })

    return res.status(200).json({
      success: true,
      session: {
        id: session.id,
        url: session.url,
      },
    })

  } catch (error: any) {
    console.error('Error creating payment session:', error)
    return res.status(500).json({ 
      error: 'Failed to create payment session', 
      details: error.message 
    })
  }
}