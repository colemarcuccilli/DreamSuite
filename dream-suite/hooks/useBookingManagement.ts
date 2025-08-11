import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { bookingService } from '../lib/supabase-booking'
import { emailService } from '../lib/email-service'
import { stripeBookingService } from '../lib/stripe-booking'
import { Booking, Service, Studio } from '../types/booking'

export interface BookingManagementState {
  loading: boolean
  updateBookingStatus: (
    bookingId: string, 
    newStatus: Booking['status'], 
    reason?: string
  ) => Promise<boolean>
  cancelBookingWithRefund: (
    bookingId: string, 
    reason?: string
  ) => Promise<boolean>
  sendBookingReminder: (
    bookingId: string, 
    reminderType: '24h' | '1h'
  ) => Promise<boolean>
  rescheduleBooking: (
    bookingId: string, 
    newStartTime: string, 
    newEndTime: string
  ) => Promise<boolean>
}

export function useBookingManagement(): BookingManagementState {
  const [loading, setLoading] = useState(false)

  const updateBookingStatus = useCallback(async (
    bookingId: string,
    newStatus: Booking['status'],
    reason?: string
  ): Promise<boolean> => {
    try {
      setLoading(true)

      // Get current booking details
      const currentBooking = await bookingService.getBooking(bookingId)
      if (!currentBooking) {
        Alert.alert('Error', 'Booking not found')
        return false
      }

      const oldStatus = currentBooking.status

      // Update booking status
      await bookingService.updateBooking(bookingId, { status: newStatus })

      // Get related data for email
      const service = await bookingService.getService(currentBooking.service_id)
      const studio = await bookingService.getStudio(currentBooking.studio_id)

      if (service && studio) {
        const emailData = {
          booking: { ...currentBooking, status: newStatus },
          service,
          studio,
          clientName: currentBooking.client_name,
          clientEmail: currentBooking.client_email,
        }

        // Send appropriate email based on status change
        switch (newStatus) {
          case 'confirmed':
            if (oldStatus === 'pending_payment') {
              await emailService.sendBookingConfirmation(emailData)
            } else {
              await emailService.sendBookingStatusUpdate(emailData, oldStatus, newStatus)
            }
            break
          
          case 'cancelled':
            await emailService.sendBookingCancellation(emailData, reason)
            break
          
          case 'completed':
          case 'in_progress':
          case 'no_show':
            await emailService.sendBookingStatusUpdate(emailData, oldStatus, newStatus)
            break
        }
      }

      return true

    } catch (error: any) {
      console.error('Error updating booking status:', error)
      Alert.alert('Error', 'Failed to update booking status')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelBookingWithRefund = useCallback(async (
    bookingId: string,
    reason?: string
  ): Promise<boolean> => {
    try {
      setLoading(true)

      const booking = await bookingService.getBooking(bookingId)
      if (!booking) {
        Alert.alert('Error', 'Booking not found')
        return false
      }

      // Process refund if payment was made
      if (booking.payment_status === 'paid') {
        const refundResult = await stripeBookingService.processRefund(
          bookingId,
          booking.total_price_cents,
          reason || 'Booking cancelled by studio'
        )

        if (!refundResult.success) {
          Alert.alert('Error', 'Failed to process refund: ' + refundResult.error)
          return false
        }
      }

      // Update booking status to cancelled
      const success = await updateBookingStatus(bookingId, 'cancelled', reason)
      
      if (success) {
        Alert.alert('Success', 'Booking cancelled and refund processed')
      }

      return success

    } catch (error: any) {
      console.error('Error cancelling booking with refund:', error)
      Alert.alert('Error', 'Failed to cancel booking')
      return false
    } finally {
      setLoading(false)
    }
  }, [updateBookingStatus])

  const sendBookingReminder = useCallback(async (
    bookingId: string,
    reminderType: '24h' | '1h'
  ): Promise<boolean> => {
    try {
      setLoading(true)

      const booking = await bookingService.getBooking(bookingId)
      if (!booking) {
        Alert.alert('Error', 'Booking not found')
        return false
      }

      const service = await bookingService.getService(booking.service_id)
      const studio = await bookingService.getStudio(booking.studio_id)

      if (!service || !studio) {
        Alert.alert('Error', 'Missing booking details')
        return false
      }

      const emailData = {
        booking,
        service,
        studio,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
      }

      const reminderSent = await emailService.sendBookingReminder(emailData, reminderType)
      
      if (reminderSent) {
        Alert.alert('Success', `${reminderType} reminder sent to ${booking.client_name}`)
      } else {
        Alert.alert('Error', 'Failed to send reminder')
      }

      return reminderSent

    } catch (error: any) {
      console.error('Error sending booking reminder:', error)
      Alert.alert('Error', 'Failed to send reminder')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const rescheduleBooking = useCallback(async (
    bookingId: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<boolean> => {
    try {
      setLoading(true)

      const booking = await bookingService.getBooking(bookingId)
      if (!booking) {
        Alert.alert('Error', 'Booking not found')
        return false
      }

      // Check if new time slot is available
      const isAvailable = await bookingService.isTimeSlotAvailable(
        booking.studio_id,
        booking.service_id,
        newStartTime,
        newEndTime,
        bookingId // Exclude current booking from availability check
      )

      if (!isAvailable) {
        Alert.alert('Error', 'The selected time slot is not available')
        return false
      }

      // Update booking times
      await bookingService.updateBooking(bookingId, {
        start_time: newStartTime,
        end_time: newEndTime,
        updated_at: new Date().toISOString()
      })

      // Send update notification to client
      const service = await bookingService.getService(booking.service_id)
      const studio = await bookingService.getStudio(booking.studio_id)

      if (service && studio) {
        const emailData = {
          booking: { 
            ...booking, 
            start_time: newStartTime, 
            end_time: newEndTime 
          },
          service,
          studio,
          clientName: booking.client_name,
          clientEmail: booking.client_email,
        }

        await emailService.sendBookingStatusUpdate(
          emailData,
          'confirmed',
          'confirmed' // Same status but with updated time
        )
      }

      Alert.alert('Success', 'Booking rescheduled successfully')
      return true

    } catch (error: any) {
      console.error('Error rescheduling booking:', error)
      Alert.alert('Error', 'Failed to reschedule booking')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    updateBookingStatus,
    cancelBookingWithRefund,
    sendBookingReminder,
    rescheduleBooking,
  }
}