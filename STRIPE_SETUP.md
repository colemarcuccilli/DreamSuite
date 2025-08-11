# Stripe Payment Integration Setup

This document outlines the setup process for Stripe payment integration in Dream Suite booking platform.

## Overview

The booking platform now includes:
- Complete Stripe Checkout integration
- Webhook handling for payment status updates
- Support for deposits and full payments
- Success and cancellation flows
- Cross-platform payment URL handling

## Stripe Configuration Required

### 1. Environment Variables

Copy `.env.example` to `.env` and set these values:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key (server-side only)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key (client-side)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret from Stripe Dashboard
```

### 2. Stripe Dashboard Setup

1. **Create Stripe Account**: Sign up at https://stripe.com if you don't have an account
2. **Get API Keys**: Go to Developers > API Keys and copy your keys
3. **Create Webhook Endpoint**: 
   - Go to Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/payments/webhook`
   - Select events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`
   - Copy the webhook secret

### 3. Test the Integration

1. Start the development server: `npm start`
2. Navigate to a studio's booking page
3. Complete the booking flow
4. Test with Stripe's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Declined: `4000 0000 0000 0002`

## API Endpoints Created

### `/api/payments/create-session`
- **Method**: POST
- **Purpose**: Create Stripe Checkout session for booking payment
- **Body**: `bookingId`, `serviceId`, `serviceName`, `priceCents`, `clientName`, `clientEmail`, `requiresDeposit`, `depositPercentage`, `returnUrl`

### `/api/payments/webhook`
- **Method**: POST
- **Purpose**: Handle Stripe webhook events (payment completed/expired)
- **Automatically updates booking status in database**

## Payment Flow

1. **Client selects service and time slot**
2. **Client enters contact details**
3. **System creates pending booking in database**
4. **Stripe Checkout session created**
5. **Client redirected to Stripe payment**
6. **Payment completed/cancelled**
7. **Webhook updates booking status**
8. **Client redirected to success/cancel page**

## File Structure

```
app/
├── api/
│   └── payments/
│       ├── create-session+api.ts    # Payment session creation
│       └── webhook+api.ts           # Stripe webhook handler
├── booking/
│   ├── [studioId].tsx              # Main booking interface
│   ├── success/[bookingId].tsx     # Payment success page  
│   └── cancel/[bookingId].tsx      # Payment cancellation page
└── lib/
    └── stripe-booking.ts           # Stripe service integration
```

## Features Implemented

### ✅ Payment Processing
- Stripe Checkout session creation
- Automatic redirect handling
- Cross-platform URL opening (web/mobile)

### ✅ Booking Status Management
- Real-time status updates via webhooks
- Support for deposit vs full payments
- Automatic booking expiration

### ✅ User Experience
- Multi-step booking form with progress indicator
- Payment success confirmation with booking details
- Payment cancellation with retry option
- Booking details display

### ✅ Error Handling
- Payment session creation failures
- Webhook verification errors
- Network connectivity issues
- Invalid booking states

## Next Steps

1. **Setup Supabase Database** - Create tables and RLS policies
2. **Deploy API Endpoints** - Ensure webhook URL is accessible
3. **Configure Production Stripe** - Switch to live keys for production
4. **Add Email Notifications** - Booking confirmations and reminders
5. **Implement Calendar View** - Admin booking management interface

## Security Considerations

- Stripe webhook signatures are verified
- Sensitive keys are server-side only
- Client data validation before payment
- Booking expiration prevents slot squatting