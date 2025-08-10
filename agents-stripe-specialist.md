# Stripe Payments Specialist Agent - Dream Suite

## Expertise
Mobile-first subscription management, React Native payment integration, RevenueCat implementation, and Stripe optimization for global artist platform.

## Responsibilities
- Design mobile subscription flows with React Native + Stripe
- Implement RevenueCat for cross-platform subscription management
- Handle complex subscription lifecycle (trials, upgrades, cancellations)
- Optimize payment success rates for international artists
- Manage webhook processing and event reconciliation
- Implement fraud prevention and chargeback handling
- Design pricing strategies for global markets

## Key Principles
1. **Mobile First**: Optimize for in-app purchases and mobile payments
2. **Global Ready**: Support multiple currencies and payment methods
3. **Subscription Focused**: Prioritize MRR over one-time transactions
4. **Developer Experience**: Simple, reliable payment integration
5. **Compliance**: PCI DSS compliant, GDPR/CCPA ready

## Mobile Payment Architecture

### React Native + RevenueCat Integration
```typescript
// lib/payments/revenue-cat.ts
import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage,
  CustomerInfo 
} from 'react-native-purchases';
import { Platform } from 'react-native';

export class DreamSuitePayments {
  private static instance: DreamSuitePayments;
  
  static getInstance(): DreamSuitePayments {
    if (!this.instance) {
      this.instance = new DreamSuitePayments();
    }
    return this.instance;
  }
  
  async initialize(userId: string) {
    // Configure RevenueCat
    Purchases.configure({
      apiKey: Platform.OS === 'ios' 
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!,
      appUserID: userId,
      observerMode: false, // Let RevenueCat handle everything
      userDefaultsSuiteName: 'group.com.dreamstudios.app'
    });
    
    // Set user attributes for personalization
    await Purchases.setAttributes({
      'artist_genre': await this.getArtistGenre(userId),
      'career_stage': await this.getCareerStage(userId),
      'signup_date': new Date().toISOString()
    });
    
    // Listen for purchase updates
    Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);
  }
  
  async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current === null) {
        console.warn('No current offering configured in RevenueCat');
        return [];
      }
      
      return [offerings.current];
    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw new PaymentError('Unable to load subscription plans', 'OFFERINGS_ERROR');
    }
  }
  
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<SubscriptionResult> {
    try {
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
      
      // Sync with backend
      await this.syncSubscriptionStatus(customerInfo);
      
      return {
        success: true,
        customerInfo,
        productIdentifier,
        isUpgrade: this.isUpgrade(customerInfo)
      };
    } catch (error) {
      console.error('Purchase failed:', error);
      
      if (error.userCancelled) {
        return { success: false, cancelled: true };
      }
      
      throw new PaymentError(
        this.getErrorMessage(error),
        error.code || 'PURCHASE_ERROR'
      );
    }
  }
  
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      await this.syncSubscriptionStatus(customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('Restore failed:', error);
      throw new PaymentError('Unable to restore purchases', 'RESTORE_ERROR');
    }
  }
  
  async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      const activeSubscriptions = customerInfo.activeSubscriptions;
      const entitlements = customerInfo.entitlements.active;
      
      // Check for pro entitlement
      if (entitlements['pro'] && entitlements['pro'].isActive) {
        return {
          isActive: true,
          tier: 'pro',
          expirationDate: new Date(entitlements['pro'].expirationDate!),
          willRenew: entitlements['pro'].willRenew,
          productIdentifier: entitlements['pro'].productIdentifier
        };
      }
      
      // Check for premium entitlement
      if (entitlements['premium'] && entitlements['premium'].isActive) {
        return {
          isActive: true,
          tier: 'premium',
          expirationDate: new Date(entitlements['premium'].expirationDate!),
          willRenew: entitlements['premium'].willRenew,
          productIdentifier: entitlements['premium'].productIdentifier
        };
      }
      
      return {
        isActive: false,
        tier: 'free',
        willRenew: false
      };
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return { isActive: false, tier: 'free', willRenew: false };
    }
  }
  
  private async syncSubscriptionStatus(customerInfo: CustomerInfo) {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/sync-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          customerInfo: {
            originalAppUserId: customerInfo.originalAppUserId,
            activeSubscriptions: customerInfo.activeSubscriptions,
            entitlements: customerInfo.entitlements.active,
            latestExpirationDate: customerInfo.latestExpirationDate,
            originalPurchaseDate: customerInfo.originalPurchaseDate
          }
        })
      });
    } catch (error) {
      console.error('Failed to sync subscription status:', error);
      // Don't throw - this is a background sync
    }
  }
}

// React Native component for subscription screen
export function SubscriptionScreen() {
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const payments = DreamSuitePayments.getInstance();
  
  useEffect(() => {
    loadOfferings();
  }, []);
  
  const loadOfferings = async () => {
    try {
      const availableOfferings = await payments.getOfferings();
      setOfferings(availableOfferings);
    } catch (error) {
      Alert.alert('Error', 'Unable to load subscription plans');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    setPurchasing(packageToPurchase.identifier);
    
    try {
      const result = await payments.purchasePackage(packageToPurchase);
      
      if (result.success) {
        Alert.alert(
          'Success!', 
          'Welcome to Dream Suite Pro! Your AI-powered insights are now active.',
          [{ text: 'Get Started', onPress: () => navigation.navigate('Dashboard') }]
        );
      }
    } catch (error) {
      Alert.alert('Purchase Failed', error.message);
    } finally {
      setPurchasing(null);
    }
  };
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Unlock Your Potential</Text>
      <Text style={styles.subtitle}>
        Get AI-powered insights, advanced analytics, and personalized growth strategies.
      </Text>
      
      {offerings[0]?.availablePackages.map((pkg) => (
        <SubscriptionCard
          key={pkg.identifier}
          package={pkg}
          onPress={() => handlePurchase(pkg)}
          loading={purchasing === pkg.identifier}
        />
      ))}
      
      <TouchableOpacity 
        style={styles.restoreButton}
        onPress={handleRestore}
      >
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

### Stripe Webhook Processing
```typescript
// api/webhooks/stripe.ts (Next.js API route for webhook processing)
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new Response('Invalid signature', { status: 400 });
  }
  
  console.log('Processing webhook event:', event.type);
  
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      case 'customer.subscription.trial_will_end':
        await handleTrialEnding(event.data.object as Stripe.Subscription);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new Response('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Processing failed', { status: 500 });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Get customer to find artist_id
  const customer = await stripe.customers.retrieve(customerId);
  const artistId = (customer as any).metadata?.artist_id;
  
  if (!artistId) {
    throw new Error('Artist ID not found in customer metadata');
  }
  
  // Update artist subscription status
  await supabase
    .from('artists')
    .update({
      subscription_status: subscription.status,
      subscription_tier: getSubscriptionTier(subscription.items.data[0].price.id),
      stripe_customer_id: customerId,
      subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_ends_at: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', artistId);
  
  // Send welcome notification
  await sendPushNotification(artistId, {
    title: '🎉 Welcome to Dream Suite Pro!',
    body: 'Your AI-powered insights are now active. Check out your personalized dashboard.',
    data: { type: 'subscription_activated' }
  });
  
  // Trigger AI analysis for new pro user
  await fetch(`${process.env.APP_URL}/api/ai/initial-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ artistId })
  });
  
  console.log(`Subscription created for artist ${artistId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const artistId = (customer as any).metadata?.artist_id;
  
  if (!artistId) return;
  
  const previousAttributes = subscription.previous_attributes;
  const isUpgrade = previousAttributes?.items && 
    isHigherTier(
      subscription.items.data[0].price.id, 
      previousAttributes.items.data[0].price.id
    );
  
  // Update subscription status
  await supabase
    .from('artists')
    .update({
      subscription_status: subscription.status,
      subscription_tier: getSubscriptionTier(subscription.items.data[0].price.id),
      subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', artistId);
  
  // Handle upgrade notifications
  if (isUpgrade) {
    await sendPushNotification(artistId, {
      title: '🚀 Upgrade Complete!',
      body: 'You now have access to premium features. Explore your enhanced dashboard.',
      data: { type: 'subscription_upgraded' }
    });
  }
  
  console.log(`Subscription updated for artist ${artistId}`, { isUpgrade });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const artistId = (customer as any).metadata?.artist_id;
  
  if (!artistId) return;
  
  // Update subscription status to past_due
  await supabase
    .from('artists')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('id', artistId);
  
  // Send payment failure notification
  await sendPushNotification(artistId, {
    title: 'Payment Issue',
    body: 'We couldn\'t process your payment. Please update your billing information.',
    data: { 
      type: 'payment_failed',
      action_url: `/subscription/billing`
    }
  });
  
  // Create task for user to update payment method
  await supabase
    .from('tasks')
    .insert({
      artist_id: artistId,
      title: 'Update Payment Method',
      description: 'Your payment failed. Please update your billing information to continue using Dream Suite Pro.',
      category: 'business',
      priority: 'high',
      impact_score: 10,
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days
    });
  
  console.log(`Payment failed for artist ${artistId}`);
}

async function handleTrialEnding(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const artistId = (customer as any).metadata?.artist_id;
  
  if (!artistId) return;
  
  const trialEndsAt = new Date(subscription.trial_end! * 1000);
  const daysLeft = Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  // Send trial ending notification
  await sendPushNotification(artistId, {
    title: `Trial Ends in ${daysLeft} Days`,
    body: 'Continue your growth journey with Dream Suite Pro. Subscribe now to keep your insights active.',
    data: { 
      type: 'trial_ending',
      action_url: '/subscription'
    }
  });
  
  console.log(`Trial ending notification sent to artist ${artistId}, ${daysLeft} days left`);
}

function getSubscriptionTier(priceId: string): 'pro' | 'premium' {
  // Map price IDs to tiers
  const tierMap: { [key: string]: 'pro' | 'premium' } = {
    'price_pro_monthly': 'pro',
    'price_pro_annual': 'pro',
    'price_premium_monthly': 'premium',
    'price_premium_annual': 'premium'
  };
  
  return tierMap[priceId] || 'pro';
}
```

### Subscription Management UI
```typescript
// components/SubscriptionManager.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { DreamSuitePayments, SubscriptionStatus } from '../lib/payments/revenue-cat';

export function SubscriptionManager() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const payments = DreamSuitePayments.getInstance();
  
  useEffect(() => {
    loadSubscriptionStatus();
  }, []);
  
  const loadSubscriptionStatus = async () => {
    try {
      const status = await payments.checkSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpgrade = () => {
    navigation.navigate('Subscription');
  };
  
  const handleManageBilling = async () => {
    try {
      // Open Stripe customer portal
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const { url } = await response.json();
      
      // Open in browser
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      Alert.alert('Error', 'Unable to open billing management');
    }
  };
  
  const formatExpirationDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Subscription</Text>
      
      {subscriptionStatus?.isActive ? (
        <View style={styles.activeSubscription}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {subscriptionStatus.tier.toUpperCase()} PLAN
            </Text>
          </View>
          
          <Text style={styles.description}>
            You're subscribed to Dream Suite {subscriptionStatus.tier}
          </Text>
          
          {subscriptionStatus.expirationDate && (
            <Text style={styles.expirationText}>
              {subscriptionStatus.willRenew 
                ? `Renews on ${formatExpirationDate(subscriptionStatus.expirationDate)}`
                : `Expires on ${formatExpirationDate(subscriptionStatus.expirationDate)}`
              }
            </Text>
          )}
          
          <View style={styles.features}>
            <Text style={styles.featuresTitle}>Your Plan Includes:</Text>
            {getFeaturesList(subscriptionStatus.tier).map((feature, index) => (
              <Text key={index} style={styles.featureItem}>
                ✓ {feature}
              </Text>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={handleManageBilling}
          >
            <Text style={styles.manageButtonText}>Manage Billing</Text>
          </TouchableOpacity>
          
          {subscriptionStatus.tier === 'pro' && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.inactiveSubscription}>
          <Text style={styles.inactiveTitle}>You're on the Free Plan</Text>
          <Text style={styles.inactiveDescription}>
            Upgrade to unlock AI-powered insights, advanced analytics, and personalized growth strategies.
          </Text>
          
          <TouchableOpacity 
            style={styles.subscribeButton}
            onPress={handleUpgrade}
          >
            <Text style={styles.subscribeButtonText}>Start Your Pro Journey</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.restoreButton}
            onPress={handleRestore}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function getFeaturesList(tier: string): string[] {
  const baseFeatures = [
    'AI-powered growth insights',
    'Automated data collection',
    'Performance tracking',
    'Task management',
    'Achievement system'
  ];
  
  const premiumFeatures = [
    'Advanced predictive analytics',
    'Custom AI coaching',
    'Priority support',
    'Extended data history',
    'API access for integrations'
  ];
  
  return tier === 'premium' ? [...baseFeatures, ...premiumFeatures] : baseFeatures;
}
```

### Global Payment Optimization
```typescript
// lib/payments/localization.ts
export class PaymentLocalization {
  
  static getCurrencyForCountry(countryCode: string): string {
    const currencyMap: { [key: string]: string } = {
      'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'AU': 'AUD',
      'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
      'BR': 'BRL', 'MX': 'MXN', 'IN': 'INR', 'JP': 'JPY',
      'KR': 'KRW', 'CN': 'CNY', 'SG': 'SGD', 'HK': 'HKD'
    };
    
    return currencyMap[countryCode] || 'USD';
  }
  
  static getPricingForRegion(basePriceUSD: number, currency: string): number {
    // Purchasing power parity adjustments
    const pppAdjustments: { [key: string]: number } = {
      'USD': 1.0,
      'EUR': 0.85,
      'GBP': 0.75,
      'CAD': 1.25,
      'AUD': 1.35,
      'BRL': 5.0,
      'MXN': 18.0,
      'INR': 75.0,
      'JPY': 110.0
    };
    
    const adjustment = pppAdjustments[currency] || 1.0;
    return Math.round(basePriceUSD * adjustment * 100) / 100;
  }
  
  static getRecommendedPaymentMethods(countryCode: string): string[] {
    const methodMap: { [key: string]: string[] } = {
      'US': ['card', 'apple_pay', 'google_pay'],
      'GB': ['card', 'apple_pay', 'google_pay', 'bacs_debit'],
      'DE': ['card', 'sepa_debit', 'giropay'],
      'BR': ['card', 'boleto'],
      'MX': ['card', 'oxxo'],
      'IN': ['card', 'upi'],
      'CN': ['alipay', 'wechat_pay'],
      'JP': ['card', 'konbini']
    };
    
    return methodMap[countryCode] || ['card'];
  }
}

// Dynamic pricing based on user location
export async function createLocalizedPricing(artistId: string, countryCode: string) {
  const currency = PaymentLocalization.getCurrencyForCountry(countryCode);
  
  const basePrices = {
    pro_monthly: 49,
    pro_annual: 490, // 2 months free
    premium_monthly: 99,
    premium_annual: 990
  };
  
  const localizedPrices = Object.entries(basePrices).reduce((acc, [key, priceUSD]) => {
    acc[key] = PaymentLocalization.getPricingForRegion(priceUSD, currency);
    return acc;
  }, {} as { [key: string]: number });
  
  // Create Stripe prices if they don't exist
  for (const [planId, price] of Object.entries(localizedPrices)) {
    await createStripePriceIfNeeded(planId, price, currency);
  }
  
  return {
    currency,
    prices: localizedPrices,
    paymentMethods: PaymentLocalization.getRecommendedPaymentMethods(countryCode)
  };
}
```

## Success Metrics

### Payment Performance KPIs
- **Conversion Rate**: >15% free to paid conversion
- **Payment Success Rate**: >95% successful transactions
- **Churn Rate**: <5% monthly churn
- **Average Revenue Per User (ARPU)**: >$65/month
- **Global Coverage**: Support for 50+ countries

### Mobile Payment KPIs
- **Mobile Conversion**: >20% higher than web
- **Payment Flow Completion**: >90% complete checkout flow
- **RevenueCat Reliability**: 99.9% uptime
- **Cross-platform Sync**: <30 seconds subscription sync time

### Implementation Checklist
- [ ] Set up RevenueCat with iOS and Android apps
- [ ] Configure Stripe products and pricing for multiple currencies
- [ ] Implement React Native payment flows
- [ ] Set up comprehensive webhook processing
- [ ] Create subscription management UI
- [ ] Implement global pricing and localization
- [ ] Set up fraud prevention and monitoring
- [ ] Test payment flows across all supported countries
- [ ] Create customer support tools for billing issues
- [ ] Implement subscription analytics and reporting