import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { bookingService } from '../../lib/supabase-booking'
import { Studio, Booking, Service } from '../../types/booking'

interface CalendarDay {
  date: Date
  bookings: Booking[]
  isToday: boolean
  isCurrentMonth: boolean
}

interface CalendarWeek {
  days: CalendarDay[]
}

export default function AdminCalendarScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [studio, setStudio] = useState<Studio | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarWeeks, setCalendarWeeks] = useState<CalendarWeek[]>([])

  useEffect(() => {
    if (user) {
      loadCalendarData()
    }
  }, [user, currentDate])

  useEffect(() => {
    if (bookings.length > 0) {
      generateCalendar()
    }
  }, [bookings, currentDate])

  const loadCalendarData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const studioData = await bookingService.getStudioByOwner(user.id)
      if (!studioData) {
        Alert.alert('Error', 'Studio not found')
        return
      }
      
      setStudio(studioData)

      // Load bookings for the current month and surrounding dates
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      // Extend range to cover full calendar view (6 weeks)
      const calendarStart = new Date(startOfMonth)
      calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay())
      
      const calendarEnd = new Date(endOfMonth)
      calendarEnd.setDate(calendarEnd.getDate() + (6 - endOfMonth.getDay()))

      const bookingsData = await bookingService.getStudioBookings(
        studioData.id,
        calendarStart.toISOString(),
        calendarEnd.toISOString()
      )
      setBookings(bookingsData)

      // Load services for reference
      const servicesData = await bookingService.getStudioServices(studioData.id, false)
      setServices(servicesData)

    } catch (error: any) {
      console.error('Error loading calendar:', error)
      Alert.alert('Error', 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadCalendarData()
    setRefreshing(false)
  }

  const generateCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Get first day of month and how many days in month
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    
    // Calculate calendar start (Sunday of first week)
    const calendarStart = new Date(firstDayOfMonth)
    calendarStart.setDate(calendarStart.getDate() - firstDayOfMonth.getDay())
    
    const weeks: CalendarWeek[] = []
    const today = new Date()
    
    for (let weekNum = 0; weekNum < 6; weekNum++) {
      const days: CalendarDay[] = []
      
      for (let dayNum = 0; dayNum < 7; dayNum++) {
        const date = new Date(calendarStart)
        date.setDate(calendarStart.getDate() + (weekNum * 7) + dayNum)
        
        const dayBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.start_time)
          return bookingDate.toDateString() === date.toDateString()
        })
        
        days.push({
          date: new Date(date),
          bookings: dayBookings,
          isToday: date.toDateString() === today.toDateString(),
          isCurrentMonth: date.getMonth() === month,
        })
      }
      
      weeks.push({ days })
    }
    
    setCalendarWeeks(weeks)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const getServiceName = (serviceId: string): string => {
    const service = services.find(s => s.id === serviceId)
    return service?.name || 'Unknown'
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading calendar...</Text>
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
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day Names Header */}
        <View style={styles.dayNamesRow}>
          {dayNames.map((day) => (
            <View key={day} style={styles.dayNameCell}>
              <Text style={styles.dayNameText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarWeeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeek}>
              {week.days.map((day, dayIndex) => (
                <TouchableOpacity
                  key={`${weekIndex}-${dayIndex}`}
                  style={[
                    styles.calendarDay,
                    day.isToday && styles.todayDay,
                    !day.isCurrentMonth && styles.otherMonthDay,
                  ]}
                  onPress={() => {
                    if (day.bookings.length === 1) {
                      router.push(`/admin/bookings/${day.bookings[0].id}`)
                    } else if (day.bookings.length > 1) {
                      // Show list of bookings for this day
                      Alert.alert(
                        `${day.bookings.length} Bookings`,
                        day.bookings.map(b => 
                          `${formatTime(b.start_time)} - ${b.client_name} (${getServiceName(b.service_id)})`
                        ).join('\n')
                      )
                    }
                  }}
                >
                  <Text style={[
                    styles.dayNumber,
                    day.isToday && styles.todayText,
                    !day.isCurrentMonth && styles.otherMonthText,
                  ]}>
                    {day.date.getDate()}
                  </Text>
                  
                  {/* Booking Indicators */}
                  <View style={styles.bookingIndicators}>
                    {day.bookings.slice(0, 3).map((booking, index) => (
                      <View
                        key={booking.id}
                        style={[
                          styles.bookingDot,
                          { backgroundColor: getStatusColor(booking.status) }
                        ]}
                      />
                    ))}
                    {day.bookings.length > 3 && (
                      <Text style={styles.moreIndicator}>+{day.bookings.length - 3}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={styles.todaySection}>
          <Text style={styles.todayTitle}>Today's Schedule</Text>
          {bookings
            .filter(booking => {
              const bookingDate = new Date(booking.start_time)
              const today = new Date()
              return bookingDate.toDateString() === today.toDateString()
            })
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.todayBookingCard}
                onPress={() => router.push(`/admin/bookings/${booking.id}`)}
              >
                <View style={styles.todayBookingHeader}>
                  <Text style={styles.todayBookingTime}>
                    {formatTime(booking.start_time)}
                  </Text>
                  <View style={[
                    styles.todayStatusBadge,
                    { backgroundColor: getStatusColor(booking.status) }
                  ]}>
                    <Text style={styles.todayStatusText}>
                      {booking.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.todayBookingClient}>{booking.client_name}</Text>
                <Text style={styles.todayBookingService}>
                  {getServiceName(booking.service_id)}
                </Text>
              </TouchableOpacity>
            ))}
          
          {bookings.filter(booking => {
            const bookingDate = new Date(booking.start_time)
            const today = new Date()
            return bookingDate.toDateString() === today.toDateString()
          }).length === 0 && (
            <View style={styles.noBookingsToday}>
              <Text style={styles.noBookingsTodayText}>No bookings scheduled for today</Text>
            </View>
          )}
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  navButtonText: {
    fontSize: 24,
    color: '#2081C3',
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  dayNamesRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  dayNameCell: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  calendarGrid: {
    backgroundColor: 'white',
  },
  calendarWeek: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  calendarDay: {
    flex: 1,
    minHeight: 80,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  todayDay: {
    backgroundColor: '#eff6ff',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  todayText: {
    color: '#2081C3',
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: '#9ca3af',
  },
  bookingIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  bookingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreIndicator: {
    fontSize: 8,
    color: '#666',
    marginLeft: 2,
  },
  todaySection: {
    padding: 20,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  todayBookingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayBookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayBookingTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2081C3',
  },
  todayStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  todayBookingClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  todayBookingService: {
    fontSize: 14,
    color: '#666',
  },
  noBookingsToday: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  noBookingsTodayText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
})