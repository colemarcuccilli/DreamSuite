import { supabase } from './supabase'
import { Studio, Service, Booking, StudioAvailability, StudioBlockedTime } from '../types/booking'

export class BookingService {
  // Studio Management
  async createStudio(studioData: Partial<Studio>): Promise<Studio> {
    const { data, error } = await supabase
      .from('studios')
      .insert(studioData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getStudio(studioId: string): Promise<Studio | null> {
    const { data, error } = await supabase
      .from('studios')
      .select('*')
      .eq('id', studioId)
      .single()

    if (error) return null
    return data
  }

  async getStudioByOwner(ownerId: string): Promise<Studio | null> {
    const { data, error } = await supabase
      .from('studios')
      .select('*')
      .eq('owner_id', ownerId)
      .single()

    if (error) return null
    return data
  }

  async updateStudio(studioId: string, updates: Partial<Studio>): Promise<Studio> {
    const { data, error } = await supabase
      .from('studios')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', studioId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Service Management
  async createService(serviceData: Partial<Service>): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getStudioServices(studioId: string, activeOnly = true): Promise<Service[]> {
    let query = supabase
      .from('services')
      .select('*')
      .eq('studio_id', studioId)
      .order('name')

    if (activeOnly) {
      query = query.eq('active', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async updateService(serviceId: string, updates: Partial<Service>): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', serviceId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteService(serviceId: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)

    if (error) throw error
  }

  // Booking Management
  async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select(`
        *,
        studio:studios(*),
        service:services(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  async getBooking(bookingId: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        studio:studios(*),
        service:services(*)
      `)
      .eq('id', bookingId)
      .single()

    if (error) return null
    return data
  }

  async getStudioBookings(
    studioId: string, 
    startDate?: string, 
    endDate?: string,
    status?: Booking['status']
  ): Promise<Booking[]> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        studio:studios(*),
        service:services(*)
      `)
      .eq('studio_id', studioId)
      .order('start_time')

    if (startDate) {
      query = query.gte('start_time', startDate)
    }

    if (endDate) {
      query = query.lte('start_time', endDate)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select(`
        *,
        studio:studios(*),
        service:services(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    const updates: Partial<Booking> = {
      status: 'cancelled',
      internal_notes: reason || 'Cancelled by studio'
    }

    return this.updateBooking(bookingId, updates)
  }

  // Availability Management
  async getStudioAvailability(studioId: string): Promise<StudioAvailability[]> {
    const { data, error } = await supabase
      .from('studio_availability')
      .select('*')
      .eq('studio_id', studioId)
      .eq('active', true)
      .order('day_of_week')

    if (error) throw error
    return data || []
  }

  async updateStudioAvailability(
    studioId: string, 
    availability: Omit<StudioAvailability, 'id' | 'studio_id'>[]
  ): Promise<void> {
    // Delete existing availability
    await supabase
      .from('studio_availability')
      .delete()
      .eq('studio_id', studioId)

    // Insert new availability
    if (availability.length > 0) {
      const { error } = await supabase
        .from('studio_availability')
        .insert(
          availability.map(avail => ({
            ...avail,
            studio_id: studioId
          }))
        )

      if (error) throw error
    }
  }

  // Time slot calculations
  async getAvailableTimeSlots(
    studioId: string, 
    serviceId: string, 
    date: string
  ): Promise<string[]> {
    // Get service duration
    const service = await this.getService(serviceId)
    if (!service) throw new Error('Service not found')

    // Get studio availability for this day of week
    const dayOfWeek = new Date(date).getDay()
    const { data: availability } = await supabase
      .from('studio_availability')
      .select('*')
      .eq('studio_id', studioId)
      .eq('day_of_week', dayOfWeek)
      .eq('active', true)
      .single()

    if (!availability) return []

    // Get existing bookings for this date
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`
    
    const existingBookings = await this.getStudioBookings(
      studioId, 
      startOfDay, 
      endOfDay
    )

    // Calculate available slots
    return this.calculateAvailableSlots(
      availability.start_time,
      availability.end_time,
      service.duration_minutes,
      existingBookings,
      date
    )
  }

  private async getService(serviceId: string): Promise<Service | null> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single()

    if (error) return null
    return data
  }

  private calculateAvailableSlots(
    studioOpenTime: string,
    studioCloseTime: string,
    serviceDurationMinutes: number,
    existingBookings: Booking[],
    date: string
  ): string[] {
    const slots: string[] = []
    const slotDuration = serviceDurationMinutes
    const buffer = 15 // 15 minute buffer between bookings

    // Parse studio hours
    const [openHour, openMinute] = studioOpenTime.split(':').map(Number)
    const [closeHour, closeMinute] = studioCloseTime.split(':').map(Number)

    // Create datetime objects for the specific date
    const studioOpen = new Date(date)
    studioOpen.setHours(openHour, openMinute, 0, 0)

    const studioClose = new Date(date)
    studioClose.setHours(closeHour, closeMinute, 0, 0)

    // Generate potential slots
    const current = new Date(studioOpen)
    while (current.getTime() + (slotDuration * 60 * 1000) <= studioClose.getTime()) {
      const slotStart = new Date(current)
      const slotEnd = new Date(current.getTime() + (slotDuration * 60 * 1000))

      // Check if this slot conflicts with existing bookings
      const hasConflict = existingBookings.some(booking => {
        if (booking.status === 'cancelled') return false
        
        const bookingStart = new Date(booking.start_time)
        const bookingEnd = new Date(booking.end_time)

        return (slotStart < bookingEnd && slotEnd > bookingStart)
      })

      if (!hasConflict) {
        slots.push(slotStart.toISOString())
      }

      // Move to next potential slot (with buffer)
      current.setMinutes(current.getMinutes() + slotDuration + buffer)
    }

    return slots
  }

  // Analytics
  async getStudioAnalytics(studioId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        service:services(name)
      `)
      .eq('studio_id', studioId)
      .neq('status', 'cancelled')

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: bookings, error } = await query

    if (error) throw error

    // Calculate analytics
    const totalBookings = bookings?.length || 0
    const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.total_price_cents, 0) || 0

    // Get current month data
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthBookings = bookings?.filter(booking => 
      booking.created_at >= startOfMonth
    ) || []

    const thisMonthRevenue = thisMonthBookings.reduce((sum, booking) => 
      sum + booking.total_price_cents, 0
    )

    // Service popularity
    const serviceStats = bookings?.reduce((acc, booking) => {
      const serviceName = booking.service?.name || 'Unknown'
      if (!acc[serviceName]) {
        acc[serviceName] = { booking_count: 0, revenue_cents: 0 }
      }
      acc[serviceName].booking_count++
      acc[serviceName].revenue_cents += booking.total_price_cents
      return acc
    }, {} as Record<string, { booking_count: number; revenue_cents: number }>) || {}

    const popularServices = Object.entries(serviceStats)
      .map(([service_name, stats]) => ({
        service_name,
        ...stats
      }))
      .sort((a, b) => b.booking_count - a.booking_count)

    // Status breakdown
    const statusBreakdown = bookings?.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {} as Record<Booking['status'], number>) || {}

    return {
      total_bookings: totalBookings,
      total_revenue_cents: totalRevenue,
      bookings_this_month: thisMonthBookings.length,
      revenue_this_month_cents: thisMonthRevenue,
      popular_services: popularServices,
      booking_status_breakdown: statusBreakdown
    }
  }
}

export const bookingService = new BookingService()