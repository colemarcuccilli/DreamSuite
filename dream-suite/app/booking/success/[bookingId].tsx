import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { bookingService } from '../../../lib/supabase-booking'
import { Booking, Service, Studio } from '../../../types/booking'

export default function BookingSuccessScreen() {
  const { bookingId, session_id } = useLocalSearchParams<{ bookingId: string; session_id?: string }>()
  const router = useRouter()
  
  const [booking, setBooking] = useState<Booking | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [studio, setStudio] = useState<Studio | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentVerified, setPaymentVerified] = useState(false)

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails()
      if (session_id) {
        verifyPayment()
      }
    }
  }, [bookingId, session_id])

  const verifyPayment = async () => {
    try {
      // If we have a session_id, verify the payment was successful
      const response = await fetch('/api/payments/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session_id,
          bookingId: bookingId,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setPaymentVerified(result.success)
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
    }
  }

  const loadBookingDetails = async () => {
    try {
      setLoading(true)

      // Get booking details
      const bookingData = await bookingService.getBooking(bookingId!)
      if (!bookingData) {
        Alert.alert('Error', 'Booking not found')
        return
      }

      setBooking(bookingData)

      // Get service details
      const serviceData = await bookingService.getService(bookingData.service_id)
      if (serviceData) {
        setService(serviceData)
      }

      // Get studio details
      const studioData = await bookingService.getStudio(bookingData.studio_id)
      if (studioData) {
        setStudio(studioData)
      }

    } catch (error: any) {
      console.error('Error loading booking details:', error)
      Alert.alert('Error', 'Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
    }
    return `${mins}m`
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2081C3" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
          {session_id && (
            <Text style={styles.verifyingText}>Verifying payment...</Text>
          )}
        </View>
      </SafeAreaView>
    )
  }

  if (!booking || !studio) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <Text style={styles.errorText}>
            We couldn't find the details for this booking. Please contact the studio directly.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Thank you for your booking. We've sent a confirmation email with all the details.
          </Text>
        </View>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID:</Text>
            <Text style={styles.detailValue}>#{booking.id.slice(-8)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Studio:</Text>
            <Text style={styles.detailValue}>{studio.name}</Text>
          </View>

          {service && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service:</Text>
              <Text style={styles.detailValue}>{service.name}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(booking.start_time)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>
              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
            </Text>
          </View>

          {service && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{formatDuration(service.duration_minutes)}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Client:</Text>
            <Text style={styles.detailValue}>{booking.client_name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{booking.client_email}</Text>
          </View>

          {booking.client_phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{booking.client_phone}</Text>
            </View>
          )}

          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>
              {booking.payment_status === 'deposit_paid' ? 'Deposit Paid:' : 'Total Paid:'}
            </Text>
            <Text style={styles.totalValue}>
              {booking.payment_status === 'deposit_paid' && service?.requires_deposit && service?.deposit_percentage
                ? formatCurrency(Math.round(booking.total_price_cents * (service.deposit_percentage / 100)))
                : formatCurrency(booking.total_price_cents)
              }
            </Text>
          </View>

          {/* Payment Status Indicator */}
          <View style={[
            styles.paymentStatusBadge,
            booking.payment_status === 'paid' ? styles.paidBadge :
            booking.payment_status === 'deposit_paid' ? styles.depositBadge :
            booking.payment_status === 'pending' ? styles.pendingBadge :
            styles.failedBadge
          ]}>
            <Text style={styles.paymentStatusText}>
              {booking.payment_status === 'paid' ? '✅ Payment Complete' :
               booking.payment_status === 'deposit_paid' ? '⚠️ Deposit Paid' :
               booking.payment_status === 'pending' ? '⏳ Payment Pending' :
               '❌ Payment Failed'}
            </Text>
          </View>

          {booking.payment_status === 'deposit_paid' && service?.requires_deposit && service?.deposit_percentage && (
            <View style={styles.remainingBalanceNotice}>
              <Text style={styles.remainingBalanceText}>
                Remaining balance: {formatCurrency(
                  booking.total_price_cents - Math.round(booking.total_price_cents * (service.deposit_percentage / 100))
                )}
              </Text>
              <Text style={styles.remainingBalanceSubtext}>
                Due at time of service
              </Text>
            </View>
          )}
        </View>

        {/* Studio Contact Info */}
        {(studio.phone || studio.email) && (
          <View style={styles.contactCard}>
            <Text style={styles.cardTitle}>Studio Contact</Text>
            
            {studio.phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{studio.phone}</Text>
              </View>
            )}

            {studio.email && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{studio.email}</Text>
              </View>
            )}

            {studio.address && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{studio.address}</Text>
              </View>
            )}
          </View>
        )}

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.cardTitle}>Important Notes</Text>
          <Text style={styles.noteText}>
            • Please arrive 10-15 minutes before your scheduled time
          </Text>
          <Text style={styles.noteText}>
            • Bring any instruments, equipment, or materials you'll need
          </Text>
          <Text style={styles.noteText}>
            • Contact the studio directly if you need to reschedule or have questions
          </Text>
          {booking.payment_status === 'deposit_paid' && service?.requires_deposit && service?.deposit_percentage && (
            <Text style={styles.noteText}>
              • Remaining balance of {formatCurrency(
                booking.total_price_cents - Math.round(booking.total_price_cents * (service.deposit_percentage / 100))
              )} is due at the time of your session
            </Text>
          )}
          {booking.payment_status === 'pending' && (
            <Text style={[styles.noteText, styles.warningText]}>
              • ⚠️ Payment is still pending. Please ensure payment is completed to secure your booking.
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  verifyingText: {
    fontSize: 14,
    color: '#2081C3',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  successHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesCard: {
    backgroundColor: '#fef9e7',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  depositNotice: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  depositText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },
  noteText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  doneButton: {
    backgroundColor: '#2081C3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentStatusBadge: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  paidBadge: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  depositBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  failedBadge: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  remainingBalanceNotice: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  remainingBalanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c2410c',
    textAlign: 'center',
  },
  remainingBalanceSubtext: {
    fontSize: 12,
    color: '#9a3412',
    textAlign: 'center',
    marginTop: 4,
  },
  warningText: {
    color: '#dc2626',
    fontWeight: '600',
  },
})