// Booking System Types for Dream Suite Studio Platform

export interface Studio {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  description?: string
  website?: string
  instagram?: string
  owner_id: string
  stripe_account_id?: string
  subscription_status: 'active' | 'inactive' | 'trial' | 'past_due'
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  studio_id: string
  name: string
  description?: string
  duration_minutes: number
  price_cents: number
  category: 'recording' | 'mixing' | 'mastering' | 'consultation' | 'other'
  requires_deposit: boolean
  deposit_percentage?: number
  max_advance_booking_days?: number
  min_advance_booking_hours?: number
  active: boolean
  stripe_price_id?: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  studio_id: string
  service_id: string
  client_name: string
  client_email: string
  client_phone?: string
  start_time: string
  end_time: string
  status: 'pending_payment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  payment_status: 'pending' | 'paid' | 'deposit_paid' | 'partially_paid' | 'failed' | 'expired' | 'refunded'
  total_price_cents: number
  deposit_paid_cents?: number
  final_payment_cents?: number
  stripe_session_id?: string
  stripe_payment_intent_id?: string
  notes?: string
  internal_notes?: string
  created_at: string
  updated_at: string
  
  // Relations
  studio?: Studio
  service?: Service
}

export interface StudioAvailability {
  id: string
  studio_id: string
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday
  start_time: string // "09:00"
  end_time: string // "17:00"
  active: boolean
}

export interface StudioBlockedTime {
  id: string
  studio_id: string
  start_time: string
  end_time: string
  reason?: string
  recurring?: boolean
  created_at: string
}

// Form Types
export interface CreateServiceForm {
  name: string
  description?: string
  duration_minutes: number
  price: number // in dollars, will convert to cents
  category: Service['category']
  requires_deposit: boolean
  deposit_percentage?: number
  max_advance_booking_days?: number
  min_advance_booking_hours?: number
}

export interface CreateBookingForm {
  service_id: string
  client_name: string
  client_email: string
  client_phone?: string
  start_time: string
  notes?: string
}

export interface StudioSettingsForm {
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  description?: string
  website?: string
  instagram?: string
}

// Stripe Payment Types
export interface PaymentSession {
  id: string
  url: string
  expires_at?: string
}

export interface PaymentResult {
  success: boolean
  session?: PaymentSession
  error?: string
}

// Time Slot Types
export interface TimeSlot {
  start: string
  end: string
  available: boolean
  booking?: Booking
}

export interface DaySchedule {
  date: string
  slots: TimeSlot[]
}

// Analytics Types
export interface StudioAnalytics {
  total_bookings: number
  total_revenue_cents: number
  bookings_this_month: number
  revenue_this_month_cents: number
  popular_services: Array<{
    service_name: string
    booking_count: number
    revenue_cents: number
  }>
  booking_status_breakdown: Record<Booking['status'], number>
}

// Webhook Types
export interface StripeWebhookEvent {
  type: string
  data: {
    object: any
  }
  created: number
}