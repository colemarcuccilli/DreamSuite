import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../../hooks/useAuth'
import { bookingService } from '../../../lib/supabase-booking'
import { Studio, Booking, Service } from '../../../types/booking'

type FilterStatus = 'all' | 'pending_payment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export default function AdminBookingsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [studio, setStudio] = useState<Studio | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      loadBookingsData()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [bookings, filterStatus, searchQuery])

  const loadBookingsData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const studioData = await bookingService.getStudioByOwner(user.id)
      if (!studioData) {
        Alert.alert('Error', 'Studio not found')
        return
      }
      
      setStudio(studioData)

      // Load all bookings for the studio
      const bookingsData = await bookingService.getStudioBookings(studioData.id)
      setBookings(bookingsData)

      // Load services for reference
      const servicesData = await bookingService.getStudioServices(studioData.id, false)
      setServices(servicesData)

    } catch (error: any) {
      console.error('Error loading bookings:', error)
      Alert.alert('Error', 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadBookingsData()
    setRefreshing(false)
  }

  const applyFilters = () => {
    let filtered = bookings

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === filterStatus)
    }

    // Filter by search query (client name or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.client_name.toLowerCase().includes(query) ||
        booking.client_email.toLowerCase().includes(query)
      )
    }

    // Sort by start time (upcoming first)
    filtered = filtered.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

    setFilteredBookings(filtered)
  }

  const getServiceName = (serviceId: string): string => {
    const service = services.find(s => s.id === serviceId)
    return service?.name || 'Unknown Service'
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
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

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      await bookingService.updateBooking(bookingId, { status: newStatus })
      await loadBookingsData()
      Alert.alert('Success', 'Booking status updated')
    } catch (error: any) {
      console.error('Error updating booking:', error)
      Alert.alert('Error', 'Failed to update booking status')
    }
  }

  const showStatusUpdateOptions = (booking: Booking) => {
    const options = [
      { text: 'Cancel', style: 'cancel' as const },
    ]

    if (booking.status === 'confirmed') {
      options.unshift(
        { text: 'Mark In Progress', onPress: () => handleUpdateBookingStatus(booking.id, 'in_progress') },
        { text: 'Mark No Show', onPress: () => handleUpdateBookingStatus(booking.id, 'no_show') }
      )
    }

    if (booking.status === 'in_progress') {
      options.unshift(
        { text: 'Mark Completed', onPress: () => handleUpdateBookingStatus(booking.id, 'completed') }
      )
    }

    if (booking.status === 'pending_payment') {
      options.unshift(
        { text: 'Mark Cancelled', onPress: () => handleUpdateBookingStatus(booking.id, 'cancelled') }
      )
    }

    Alert.alert('Update Booking Status', 'Choose an action:', options)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by client name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
          {(['all', 'pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled'] as FilterStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[
                styles.filterButtonText,
                filterStatus === status && styles.filterButtonTextActive
              ]}>
                {status === 'all' ? 'All' : getStatusText(status as Booking['status'])}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredBookings.length > 0 ? (
          <View style={styles.bookingsList}>
            {filteredBookings.map((booking) => {
              const dateTime = formatDateTime(booking.start_time)
              const endDateTime = formatDateTime(booking.end_time)
              
              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => router.push(`/admin/bookings/${booking.id}`)}
                  onLongPress={() => showStatusUpdateOptions(booking)}
                >
                  {/* Status Badge */}
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {getStatusText(booking.status)}
                    </Text>
                  </View>

                  {/* Booking Header */}
                  <View style={styles.bookingHeader}>
                    <Text style={styles.clientName}>{booking.client_name}</Text>
                    <Text style={styles.bookingPrice}>
                      {formatCurrency(booking.total_price_cents)}
                    </Text>
                  </View>

                  {/* Service and Time */}
                  <Text style={styles.serviceName}>
                    {getServiceName(booking.service_id)}
                  </Text>
                  
                  <View style={styles.timeContainer}>
                    <Text style={styles.dateText}>{dateTime.date}</Text>
                    <Text style={styles.timeText}>
                      {dateTime.time} - {endDateTime.time}
                    </Text>
                  </View>

                  {/* Contact Info */}
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactText}>📧 {booking.client_email}</Text>
                    {booking.client_phone && (
                      <Text style={styles.contactText}>📱 {booking.client_phone}</Text>
                    )}
                  </View>

                  {/* Notes */}
                  {booking.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesLabel}>Notes:</Text>
                      <Text style={styles.notesText}>{booking.notes}</Text>
                    </View>
                  )}

                  {/* Payment Status */}
                  {booking.payment_status && (
                    <View style={styles.paymentStatus}>
                      <Text style={styles.paymentStatusText}>
                        Payment: {booking.payment_status.replace('_', ' ')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              {bookings.length === 0 ? 'No Bookings Yet' : 'No Matching Bookings'}
            </Text>
            <Text style={styles.emptyStateText}>
              {bookings.length === 0 
                ? 'Bookings will appear here when clients book your services.'
                : 'Try adjusting your search or filter criteria.'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredBookings.length}</Text>
          <Text style={styles.statLabel}>
            {filterStatus === 'all' ? 'Total' : getStatusText(filterStatus as Booking['status'])}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {formatCurrency(
              filteredBookings.reduce((sum, booking) => sum + booking.total_price_cents, 0)
            )}
          </Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  filtersContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  statusFilters: {
    flexGrow: 0,
  },
  filterButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2081C3',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  bookingsList: {
    padding: 20,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 80, // Make room for status badge
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  serviceName: {
    fontSize: 14,
    color: '#2081C3',
    fontWeight: '500',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  paymentStatus: {
    marginTop: 8,
  },
  paymentStatusText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  statItem: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2081C3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
})