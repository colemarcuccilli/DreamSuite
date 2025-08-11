import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '../../../hooks/useAuth'
import { useBookingManagement } from '../../../hooks/useBookingManagement'
import { bookingService } from '../../../lib/supabase-booking'
import { Booking, Service, Studio } from '../../../types/booking'

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const { loading: managementLoading, updateBookingStatus, cancelBookingWithRefund, sendBookingReminder } = useBookingManagement()
  
  const [booking, setBooking] = useState<Booking | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [studio, setStudio] = useState<Studio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && bookingId) {
      loadBookingDetails()
    }
  }, [user, bookingId])

  const loadBookingDetails = async () => {
    if (!user || !bookingId) return

    try {
      setLoading(true)

      // Get booking details
      const bookingData = await bookingService.getBooking(bookingId)
      if (!bookingData) {
        Alert.alert('Error', 'Booking not found')
        router.back()
        return
      }

      // Verify this booking belongs to the user's studio
      const studioData = await bookingService.getStudioByOwner(user.id)
      if (!studioData || studioData.id !== bookingData.studio_id) {
        Alert.alert('Error', 'You do not have access to this booking')
        router.back()
        return
      }

      setBooking(bookingData)
      setStudio(studioData)

      // Get service details
      const serviceData = await bookingService.getService(bookingData.service_id)
      if (serviceData) {
        setService(serviceData)
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

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return '#10b981'
      case 'pending_payment': return '#f59e0b'
      case 'completed': return '#6b7280'
      case 'cancelled': return '#ef4444'
      case 'in_progress': return '#2081C3'
      case 'no_show': return '#9333ea'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'pending_payment': return 'Pending Payment'
      case 'no_show': return 'No Show'
      default: return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const handleStatusUpdate = async (newStatus: Booking['status']) => {
    if (!booking) return

    const success = await updateBookingStatus(booking.id, newStatus)
    if (success) {
      setBooking({ ...booking, status: newStatus, updated_at: new Date().toISOString() })
      await loadBookingDetails() // Reload to get fresh data
    }
  }

  const showStatusUpdateMenu = () => {
    if (!booking) return

    const options: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }> = [
      { text: 'Cancel', style: 'cancel' }
    ]

    if (booking.status === 'pending_payment') {
      options.unshift(
        { text: 'Mark as Confirmed', onPress: () => handleStatusUpdate('confirmed') },
        { text: 'Cancel Booking', onPress: () => handleStatusUpdate('cancelled') }
      )
    }

    if (booking.status === 'confirmed') {
      options.unshift(
        { text: 'Start Session', onPress: () => handleStatusUpdate('in_progress') },
        { text: 'Mark No Show', onPress: () => handleStatusUpdate('no_show') }
      )
    }

    if (booking.status === 'in_progress') {
      options.unshift(
        { text: 'Complete Session', onPress: () => handleStatusUpdate('completed') }
      )
    }

    Alert.alert('Update Booking Status', 'Choose an action:', options)
  }

  const handleCallClient = () => {
    if (booking?.client_phone) {
      Linking.openURL(`tel:${booking.client_phone}`)
    }
  }

  const handleEmailClient = () => {
    if (booking?.client_email) {
      const subject = encodeURIComponent(`Regarding your booking at ${studio?.name}`)
      const body = encodeURIComponent(`Hi ${booking.client_name},\n\nRegarding your upcoming booking:\n\nService: ${service?.name}\nDate: ${formatDate(booking.start_time)}\nTime: ${formatTime(booking.start_time)}\n\nBest regards,\n${studio?.name}`)
      Linking.openURL(`mailto:${booking.client_email}?subject=${subject}&body=${body}`)
    }
  }

  const handleRefund = async () => {
    if (!booking || booking.payment_status !== 'paid') return

    Alert.alert(
      'Process Refund',
      'Are you sure you want to refund this booking? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refund',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelBookingWithRefund(booking.id, 'Booking cancelled by studio')
            if (success) {
              await loadBookingDetails() // Reload to get updated data
            }
          }
        }
      ]
    )
  }

  const handleSendReminder = (reminderType: '24h' | '1h') => {
    if (!booking) return

    Alert.alert(
      'Send Reminder',
      `Send a ${reminderType} reminder to ${booking.client_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            await sendBookingReminder(booking.id, reminderType)
          }
        }
      ]
    )
  }

  const getUpcomingTimeStatus = () => {
    if (!booking) return null
    
    const now = new Date()
    const startTime = new Date(booking.start_time)
    const diffMs = startTime.getTime() - now.getTime()
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

    if (diffMs < 0) {
      return { text: 'Session has started', color: '#2081C3', urgent: true }
    } else if (diffHours <= 2) {
      return { text: `Starting in ${diffHours}h`, color: '#f59e0b', urgent: true }
    } else if (diffHours <= 24) {
      return { text: `Starting in ${diffHours}h`, color: '#10b981', urgent: false }
    } else {
      const diffDays = Math.ceil(diffHours / 24)
      return { text: `In ${diffDays} days`, color: '#6b7280', urgent: false }
    }
  }

  const timeStatus = getUpcomingTimeStatus()

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!booking || !studio) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(booking.status) }
          ]}>
            <Text style={styles.statusText}>
              {getStatusText(booking.status)}
            </Text>
          </View>
          
          {timeStatus && (
            <View style={[
              styles.timeBadge,
              { backgroundColor: timeStatus.color },
              timeStatus.urgent && styles.timeBadgeUrgent
            ]}>
              <Text style={styles.timeText}>{timeStatus.text}</Text>
            </View>
          )}
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.clientName}>{booking.client_name}</Text>
            
            <TouchableOpacity 
              style={styles.contactRow}
              onPress={handleEmailClient}
            >
              <Text style={styles.contactLabel}>📧</Text>
              <Text style={styles.contactValue}>{booking.client_email}</Text>
            </TouchableOpacity>

            {booking.client_phone && (
              <TouchableOpacity 
                style={styles.contactRow}
                onPress={handleCallClient}
              >
                <Text style={styles.contactLabel}>📱</Text>
                <Text style={styles.contactValue}>{booking.client_phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service:</Text>
              <Text style={styles.detailValue}>{service?.name || 'Unknown Service'}</Text>
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

            {service && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{formatDuration(service.duration_minutes)}</Text>
              </View>
            )}

            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatCurrency(booking.total_price_cents)}</Text>
            </View>

            {booking.payment_status && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment:</Text>
                <Text style={styles.detailValue}>
                  {booking.payment_status.replace('_', ' ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {booking.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          </View>
        )}

        {/* Booking ID and Timestamps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking ID:</Text>
              <Text style={styles.detailValue}>#{booking.id.slice(-8)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created:</Text>
              <Text style={styles.detailValue}>
                {new Date(booking.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Updated:</Text>
              <Text style={styles.detailValue}>
                {new Date(booking.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={showStatusUpdateMenu}
          disabled={managementLoading}
        >
          <Text style={styles.statusButtonText}>
            {managementLoading ? 'Processing...' : 'Update Status'}
          </Text>
        </TouchableOpacity>

        {booking.status === 'confirmed' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.reminderButton, { flex: 1, marginRight: 6 }]}
              onPress={() => handleSendReminder('24h')}
              disabled={managementLoading}
            >
              <Text style={styles.reminderButtonText}>📧 24h Reminder</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.reminderButton, { flex: 1, marginLeft: 6 }]}
              onPress={() => handleSendReminder('1h')}
              disabled={managementLoading}
            >
              <Text style={styles.reminderButtonText}>⚡ 1h Reminder</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking.status === 'confirmed' && booking.client_phone && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCallClient}
          >
            <Text style={styles.callButtonText}>📞 Call Client</Text>
          </TouchableOpacity>
        )}

        {booking.payment_status === 'paid' && booking.status !== 'completed' && (
          <TouchableOpacity
            style={styles.refundButton}
            onPress={handleRefund}
            disabled={managementLoading}
          >
            <Text style={styles.refundButtonText}>
              {managementLoading ? 'Processing...' : 'Process Refund'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#2081C3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeBadgeUrgent: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
  },
  contactValue: {
    fontSize: 16,
    color: '#2081C3',
    textDecorationLine: 'underline',
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
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
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
  notesCard: {
    backgroundColor: '#fef9e7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  notesText: {
    fontSize: 16,
    color: '#92400e',
    lineHeight: 24,
  },
  actionsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    gap: 12,
  },
  statusButton: {
    backgroundColor: '#2081C3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refundButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  refundButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reminderButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reminderButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
})