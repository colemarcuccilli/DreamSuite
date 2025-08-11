import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { createClient } from '@supabase/supabase-js'
import ResponsiveContainer from './ui/ResponsiveContainer'
import ResponsiveGrid from './ui/ResponsiveGrid'
import {
  getResponsiveFontSize,
  getResponsivePadding,
  responsive,
  isDesktop,
  isWeb
} from '../utils/responsive'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)

interface Studio {
  id: string
  name: string
  address: string
  phone: string
  email: string
  active: boolean
  is_super_admin: boolean
  owner_id: string | null
  services_count?: number
  bookings_count?: number
  total_revenue?: number
}

interface Booking {
  id: string
  studio_id: string
  studio_name: string
  service_name: string
  client_name: string
  client_email: string
  start_time: string
  end_time: string
  status: string
  total_price_cents: number
  created_at: string
}

interface DashboardStats {
  total_studios: number
  total_bookings: number
  pending_bookings: number
  total_revenue: number
  today_bookings: number
}

interface Props {
  navigation: any
  user: any
  userProfile: any
  onSignOut: () => void
}

export default function AdminDashboard({ navigation, user, userProfile, onSignOut }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'studios' | 'bookings' | 'settings'>('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [studios, setStudios] = useState<Studio[]>([])
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])

  useEffect(() => {
    if (userProfile && userProfile.is_super_admin) {
      loadDashboardData()
    }
  }, [userProfile])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadStats(),
        loadStudios(),
        loadRecentBookings()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Get total studios
      const { count: totalStudios } = await supabase
        .from('studios')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      // Get total bookings
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })

      // Get pending bookings
      const { count: pendingBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending_payment', 'confirmed'])

      // Get today's bookings
      const today = new Date().toISOString().split('T')[0]
      const { count: todayBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', `${today}T00:00:00`)
        .lt('start_time', `${today}T23:59:59`)

      // Get total revenue (completed bookings only)
      const { data: revenueData } = await supabase
        .from('bookings')
        .select('total_price_cents')
        .eq('status', 'completed')

      const totalRevenue = revenueData?.reduce((sum, booking) => sum + booking.total_price_cents, 0) || 0

      setStats({
        total_studios: totalStudios || 0,
        total_bookings: totalBookings || 0,
        pending_bookings: pendingBookings || 0,
        total_revenue: totalRevenue,
        today_bookings: todayBookings || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadStudios = async () => {
    try {
      const { data, error } = await supabase
        .from('studios')
        .select(`
          *,
          services:services(count),
          bookings:bookings(count, total_price_cents)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const studiosWithStats = data?.map(studio => ({
        ...studio,
        services_count: studio.services?.[0]?.count || 0,
        bookings_count: studio.bookings?.[0]?.count || 0,
        total_revenue: studio.bookings?.reduce((sum: number, booking: any) => 
          booking.status === 'completed' ? sum + booking.total_price_cents : sum, 0) || 0
      })) || []

      setStudios(studiosWithStats)
    } catch (error) {
      console.error('Error loading studios:', error)
    }
  }

  const loadRecentBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          studio:studios(name),
          service:services(name)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const bookingsWithDetails = data?.map(booking => ({
        ...booking,
        studio_name: booking.studio?.name || 'Unknown Studio',
        service_name: booking.service?.name || 'Unknown Service'
      })) || []

      setRecentBookings(bookingsWithDetails)
    } catch (error) {
      console.error('Error loading recent bookings:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const formatPrice = (cents: number) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981'
      case 'completed': return '#3b82f6'
      case 'pending_payment': return '#f59e0b'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const handleStudioToggle = async (studioId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('studios')
        .update({ active: !currentActive })
        .eq('id', studioId)

      if (error) throw error

      Alert.alert('Success', `Studio ${!currentActive ? 'activated' : 'deactivated'} successfully`)
      loadStudios()
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  // Check if user is super admin
  if (!userProfile?.is_super_admin) {
    return (
      <SafeAreaView style={styles.container}>
        <ResponsiveContainer>
          <View style={styles.unauthorizedContainer}>
            <Text style={styles.unauthorizedTitle}>Access Denied</Text>
            <Text style={styles.unauthorizedText}>
              You don't have admin privileges. Only super administrators can access this dashboard.
            </Text>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.backButtonText}>← Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ResponsiveContainer>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ResponsiveContainer>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2081C3" />
            <Text style={styles.loadingText}>Loading admin dashboard...</Text>
          </View>
        </ResponsiveContainer>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ResponsiveContainer>
        {/* Header */}
        <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backButtonText}>← Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Dream Suite Admin</Text>
        <Text style={styles.headerSubtitle}>
          Welcome back, {userProfile?.full_name || user?.email} 🎵
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'studios', label: 'Studios' },
          { key: 'bookings', label: 'Bookings' },
          { key: 'settings', label: 'Settings' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Platform Overview</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.total_studios}</Text>
                <Text style={styles.statLabel}>Active Studios</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.total_bookings}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.pending_bookings}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{formatPrice(stats.total_revenue)}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            {recentBookings.slice(0, 10).map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingClient}>{booking.client_name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                    <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.bookingDetails}>
                  {booking.studio_name} • {booking.service_name}
                </Text>
                <Text style={styles.bookingTime}>
                  {formatDate(booking.start_time)} • {formatPrice(booking.total_price_cents)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Studios Tab */}
        {activeTab === 'studios' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>All Studios ({studios.length})</Text>
            
            {studios.map((studio) => (
              <View key={studio.id} style={styles.studioCard}>
                <View style={styles.studioHeader}>
                  <View style={styles.studioInfo}>
                    <Text style={styles.studioName}>{studio.name}</Text>
                    {studio.is_super_admin && (
                      <View style={styles.superAdminBadge}>
                        <Text style={styles.superAdminText}>SUPER ADMIN</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleButton, studio.active ? styles.toggleActive : styles.toggleInactive]}
                    onPress={() => handleStudioToggle(studio.id, studio.active)}
                  >
                    <Text style={[styles.toggleText, studio.active ? styles.toggleTextActive : styles.toggleTextInactive]}>
                      {studio.active ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.studioDetails}>{studio.address}</Text>
                <Text style={styles.studioDetails}>{studio.email} • {studio.phone}</Text>
                
                <View style={styles.studioStats}>
                  <Text style={styles.studioStat}>{studio.services_count || 0} Services</Text>
                  <Text style={styles.studioStat}>{studio.bookings_count || 0} Bookings</Text>
                  <Text style={styles.studioStat}>{formatPrice(studio.total_revenue || 0)} Revenue</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>All Bookings ({recentBookings.length})</Text>
            
            {recentBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingClient}>{booking.client_name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                    <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.bookingDetails}>
                  {booking.studio_name} • {booking.service_name}
                </Text>
                <Text style={styles.bookingTime}>
                  {formatDate(booking.start_time)} • {formatPrice(booking.total_price_cents)}
                </Text>
                <Text style={styles.bookingEmail}>{booking.client_email}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Super Admin Settings</Text>
            
            <View style={styles.settingCard}>
              <Text style={styles.settingTitle}>Account Information</Text>
              <Text style={styles.settingDetail}>Email: {user?.email}</Text>
              <Text style={styles.settingDetail}>Name: {userProfile?.full_name}</Text>
              <Text style={styles.settingDetail}>Role: Super Administrator</Text>
              <Text style={styles.settingDetail}>Studio: Sweet Dreams Music</Text>
            </View>

            <View style={styles.settingCard}>
              <Text style={styles.settingTitle}>Platform Status</Text>
              <Text style={styles.settingDetail}>Version: 1.0.0</Text>
              <Text style={styles.settingDetail}>Environment: Production</Text>
              <Text style={styles.settingDetail}>Database: Connected</Text>
              <Text style={styles.settingDetail}>Payments: Stripe (Live)</Text>
            </View>

            <TouchableOpacity style={styles.dangerButton} onPress={onSignOut}>
              <Text style={styles.dangerButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </ResponsiveContainer>
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
    marginTop: 16,
    fontSize: getResponsiveFontSize(16),
    color: '#666',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsivePadding(),
  },
  unauthorizedTitle: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 16,
  },
  unauthorizedText: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    textAlign: 'center',
    lineHeight: responsive({ mobile: 24, desktop: 28 }),
    marginBottom: 32,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: responsive({ mobile: 24, desktop: 32 }),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#2081C3',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2081C3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#2081C3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2081C3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingClient: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookingDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingTime: {
    fontSize: 14,
    color: '#2081C3',
    fontWeight: '500',
    marginBottom: 4,
  },
  bookingEmail: {
    fontSize: 12,
    color: '#999',
  },
  studioCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studioInfo: {
    flex: 1,
  },
  studioName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  superAdminBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  superAdminText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  toggleActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#10b981',
  },
  toggleInactive: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#10b981',
  },
  toggleTextInactive: {
    color: '#ef4444',
  },
  studioDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  studioStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  studioStat: {
    fontSize: 12,
    color: '#2081C3',
    fontWeight: '500',
  },
  settingCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  settingDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})