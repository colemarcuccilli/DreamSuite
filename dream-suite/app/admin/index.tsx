import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { bookingService } from '../../lib/supabase-booking'
import { Studio, Booking, StudioAnalytics } from '../../types/booking'

const { width } = Dimensions.get('window')

export default function AdminDashboardScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [studio, setStudio] = useState<Studio | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [analytics, setAnalytics] = useState<StudioAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Load studio data
      const studioData = await bookingService.getStudioByOwner(user.id)
      if (!studioData) {
        // No studio found - redirect to setup
        Alert.alert(
          'Studio Setup Required',
          'You need to set up your studio profile first.',
          [{ text: 'Setup Now', onPress: () => router.push('/admin/setup') }]
        )
        return
      }

      setStudio(studioData)

      // Load recent bookings
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const bookings = await bookingService.getStudioBookings(
        studioData.id,
        startOfMonth.toISOString()
      )
      setRecentBookings(bookings.slice(0, 10)) // Show last 10

      // Load analytics
      const analyticsData = await bookingService.getStudioAnalytics(
        studioData.id,
        startOfMonth.toISOString()
      )
      setAnalytics(analyticsData)

    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      Alert.alert('Error', 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return '#10b981'
      case 'pending_payment': return '#f59e0b'
      case 'completed': return '#6b7280'
      case 'cancelled': return '#ef4444'
      case 'in_progress': return '#2081C3'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!studio) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>Welcome to Dream Suite Studio!</Text>
          <Text style={styles.setupSubtitle}>
            Let's get your studio set up to start accepting bookings.
          </Text>
          <TouchableOpacity 
            style={styles.setupButton}
            onPress={() => router.push('/admin/setup')}
          >
            <Text style={styles.setupButtonText}>Setup My Studio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.studioName}>{studio.name}</Text>
        </View>

        {/* Analytics Cards */}
        {analytics && (
          <View style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsNumber}>
                  {analytics.bookings_this_month}
                </Text>
                <Text style={styles.analyticsLabel}>Bookings</Text>
              </View>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsNumber}>
                  {formatCurrency(analytics.revenue_this_month_cents)}
                </Text>
                <Text style={styles.analyticsLabel}>Revenue</Text>
              </View>
            </View>
            
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsNumber}>
                  {analytics.total_bookings}
                </Text>
                <Text style={styles.analyticsLabel}>Total Bookings</Text>
              </View>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsNumber}>
                  {formatCurrency(analytics.total_revenue_cents)}
                </Text>
                <Text style={styles.analyticsLabel}>All Time Revenue</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/admin/bookings')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentBookings.length > 0 ? (
            <View style={styles.bookingsList}>
              {recentBookings.map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => router.push(`/admin/bookings/${booking.id}`)}
                >
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingClient}>{booking.client_name}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(booking.status) }
                    ]}>
                      <Text style={styles.statusText}>
                        {booking.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.bookingService}>{booking.service?.name}</Text>
                  <Text style={styles.bookingTime}>
                    {formatDate(booking.start_time)}
                  </Text>
                  <Text style={styles.bookingPrice}>
                    {formatCurrency(booking.total_price_cents)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No bookings yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Share your booking link to get started!
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/bookings/new')}
            >
              <Text style={styles.actionEmoji}>➕</Text>
              <Text style={styles.actionText}>New Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/services')}
            >
              <Text style={styles.actionEmoji}>🎵</Text>
              <Text style={styles.actionText}>Manage Services</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/calendar')}
            >
              <Text style={styles.actionEmoji}>📅</Text>
              <Text style={styles.actionText}>View Calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/settings')}
            >
              <Text style={styles.actionEmoji}>⚙️</Text>
              <Text style={styles.actionText}>Studio Settings</Text>
            </TouchableOpacity>
          </View>
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
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  setupSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  setupButton: {
    backgroundColor: '#2081C3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  setupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  studioName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2081C3',
    fontWeight: '600',
  },
  analyticsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2081C3',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  bookingsList: {
    gap: 12,
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  bookingService: {
    fontSize: 14,
    color: '#2081C3',
    fontWeight: '500',
    marginBottom: 4,
  },
  bookingTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
})