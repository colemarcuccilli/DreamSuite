# Stripe Payment Integration Testing Guide

## Overview
This guide outlines how to test the complete Stripe payment integration for the Dream Suite booking platform.

## Prerequisites
- Stripe Test API keys configured in environment variables
- Test webhook endpoint configured in Stripe Dashboard
- Email service configured for booking confirmations

## Test Scenarios

### 1. Complete Booking Flow (Web)
**Test Steps:**
1. Navigate to booking page
2. Select a service 
3. Choose date and time
4. Fill in client details
5. Click "Create Booking"
6. Verify redirect to Stripe Checkout
7. Complete payment with test card: `4242424242424242`
8. Verify redirect to success page with booking details
9. Check booking status in database is "confirmed"
10. Check payment_status is "paid"

**Expected Results:**
- Booking created with status "pending_payment"
- Stripe session created successfully 
- Payment completed successfully
- Booking status updated to "confirmed"
- Payment status updated to "paid"
- Confirmation emails sent

### 2. Deposit-Only Payment Flow
**Test Steps:**
1. Configure a service with `requires_deposit: true` and `deposit_percentage: 50`
2. Complete booking flow
3. Verify Stripe session amount is 50% of total price
4. Complete payment
5. Check booking payment_status is "deposit_paid"

**Expected Results:**
- Checkout session shows deposit amount only
- Booking marked as deposit_paid
- Success page shows remaining balance due

### 3. Payment Cancellation Flow
**Test Steps:**
1. Start booking flow and reach Stripe Checkout
2. Click browser back button or close window
3. Verify redirect to cancel page
4. Check booking status remains "pending_payment"

**Expected Results:**
- Cancel page displays with retry option
- Booking remains in pending state
- Time-limited reservation message shown

### 4. Payment Failure Handling
**Test Steps:**
1. Use declined test card: `4000000000000002`
2. Complete booking flow
3. Verify payment failure handling
4. Check webhook processes payment_intent.payment_failed

**Expected Results:**
- Payment fails at Stripe
- Webhook updates booking to cancelled/failed
- User notified of failure

### 5. Webhook Processing
**Test Webhook Events:**
- `checkout.session.completed` - Updates booking to confirmed
- `checkout.session.expired` - Cancels pending booking
- `payment_intent.succeeded` - Confirms payment
- `payment_intent.payment_failed` - Marks payment as failed

**Testing Webhooks:**
1. Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhook`
2. Trigger events through Stripe Dashboard or test payments
3. Verify database updates occur correctly

### 6. Cross-Platform Testing
**Web Testing:**
- Chrome, Safari, Firefox
- Mobile responsive design
- Payment redirect handling

**React Native Testing:**
- iOS Simulator payment flow
- Android Emulator payment flow
- In-app browser behavior

## API Endpoint Testing

### Create Payment Session
```bash
POST /api/payments/create-session
{
  "bookingId": "booking-id",
  "serviceId": "service-id", 
  "serviceName": "Recording Session",
  "priceCents": 10000,
  "clientName": "Test Client",
  "clientEmail": "test@example.com",
  "requiresDeposit": false,
  "returnUrl": "http://localhost:3000/booking/success/booking-id"
}
```

### Verify Payment Session
```bash
POST /api/payments/verify-session
{
  "sessionId": "cs_test_...",
  "bookingId": "booking-id"
}
```

### Webhook Endpoint
```bash
POST /api/payments/webhook
# Stripe webhook payload with proper signature
```

## Database Schema Validation

Ensure these fields exist in bookings table:
```sql
-- Required fields for payment integration
payment_status VARCHAR CHECK (payment_status IN ('pending', 'paid', 'deposit_paid', 'partially_paid', 'failed', 'expired', 'refunded'))
stripe_session_id VARCHAR
stripe_payment_intent_id VARCHAR
deposit_paid_cents INTEGER
final_payment_cents INTEGER
```

## Environment Variables Checklist

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Configuration  
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Success Criteria

✅ **Booking Creation**: Bookings created with pending_payment status
✅ **Payment Processing**: Stripe Checkout sessions created successfully  
✅ **Payment Completion**: Successful payments update booking to confirmed
✅ **Webhook Handling**: All relevant Stripe events processed correctly
✅ **Status Tracking**: Payment status accurately tracked through lifecycle
✅ **Error Handling**: Payment failures and cancellations handled gracefully
✅ **Email Notifications**: Confirmation emails sent on successful payment
✅ **Cross-Platform**: Works on both web and React Native
✅ **Deposit Handling**: Partial payments for deposit-required services
✅ **Security**: Webhook signatures validated, sensitive data protected

## Common Issues & Solutions

**Issue**: Webhook signature verification fails
**Solution**: Check STRIPE_WEBHOOK_SECRET matches Stripe Dashboard endpoint

**Issue**: Payment session creation fails
**Solution**: Verify Stripe API keys and network connectivity  

**Issue**: Booking not updating after payment
**Solution**: Check webhook URL is accessible and processing events

**Issue**: Cross-origin issues on web
**Solution**: Configure CORS headers for API endpoints

**Issue**: React Native payment redirect fails  
**Solution**: Test Linking.canOpenURL and InAppBrowser availability

## Performance Monitoring

Monitor these metrics:
- Payment session creation time
- Webhook processing latency  
- Database update performance
- Email delivery success rate
- Payment success/failure rates

## Security Checklist

- [ ] Webhook signatures validated
- [ ] API keys secured in environment variables
- [ ] Payment amounts verified server-side
- [ ] User input sanitized 
- [ ] HTTPS enforced for production
- [ ] Booking ownership validated
- [ ] Rate limiting implemented