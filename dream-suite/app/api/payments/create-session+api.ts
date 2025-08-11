import { ExpoRequest, ExpoResponse } from 'expo-router/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    const body = await request.json()
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
    } = body

    if (!bookingId || !serviceId || !priceCents || !returnUrl) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
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

    return Response.json({
      success: true,
      session: {
        id: session.id,
        url: session.url,
      },
    })

  } catch (error: any) {
    console.error('Error creating payment session:', error)
    return Response.json(
      { error: 'Failed to create payment session', details: error.message },
      { status: 500 }
    )
  }
}