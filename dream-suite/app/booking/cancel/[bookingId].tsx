import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { bookingService } from '../../../lib/supabase-booking'
import { stripeBookingService } from '../../../lib/stripe-booking'
import { Booking, Service, Studio } from '../../../types/booking'

export default function BookingCancelScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const router = useRouter()
  
  const [booking, setBooking] = useState<Booking | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [studio, setStudio] = useState<Studio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails()
    }
  }, [bookingId])

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

  const handleRetryPayment = async () => {
    if (!booking || !service) return

    try {
      setLoading(true)

      // Create new payment session
      const returnUrl = `dreamsuite://booking/success/${booking.id}`
      const paymentResult = await stripeBookingService.createBookingPayment(
        booking,
        service,
        returnUrl
      )

      if (paymentResult.success && paymentResult.session) {
        // Open payment URL
        await stripeBookingService.openPaymentUrl(paymentResult.session.url)
      } else {
        Alert.alert('Payment Error', paymentResult.error || 'Failed to create payment')
      }

    } catch (error: any) {
      console.error('Error retrying payment:', error)
      Alert.alert('Error', 'Failed to retry payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!booking) return

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This cannot be undone.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.updateBooking(booking.id, {
                status: 'cancelled'
              })
              router.push('/')
            } catch (error: any) {
              console.error('Error canceling booking:', error)
              Alert.alert('Error', 'Failed to cancel booking')
            }
          }
        }
      ]
    )
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!booking || !studio || !service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <Text style={styles.errorText}>
            We couldn't find the details for this booking.
          </Text>
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.homeButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Cancel Header */}
        <View style={styles.cancelHeader}>
          <Text style={styles.cancelEmoji}>⚠️</Text>
          <Text style={styles.cancelTitle}>Payment Cancelled</Text>
          <Text style={styles.cancelSubtitle}>
            Your payment was cancelled, but your booking time slot is still reserved for a limited time.
          </Text>
        </View>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Studio:</Text>
            <Text style={styles.detailValue}>{studio.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service:</Text>
            <Text style={styles.detailValue}>{service.name}</Text>
          </View>

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

          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Amount Due:</Text>
            <Text style={styles.totalValue}>{formatCurrency(booking.total_price_cents)}</Text>
          </View>
        </View>

        {/* Time Warning */}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⏰ Time Limited Reservation</Text>
          <Text style={styles.warningText}>
            Your booking time slot will be automatically released if payment is not completed within 30 minutes.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetryPayment}
            disabled={loading}
          >
            <Text style={styles.retryButtonText}>
              {loading ? 'Processing...' : 'Complete Payment'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelBooking}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.homeButtonText}>Go Home</Text>
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
    marginBottom: 32,
  },
  cancelHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  cancelEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  cancelTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 12,
    textAlign: 'center',
  },
  cancelSubtitle: {
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
  warningCard: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
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
    color: '#f59e0b',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  homeButtonText: {
    color: '#2081C3',
    fontSize: 16,
    fontWeight: '600',
  },
})