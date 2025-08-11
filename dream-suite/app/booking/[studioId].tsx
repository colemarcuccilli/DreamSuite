import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { bookingService } from '../../lib/supabase-booking'
import { stripeBookingService } from '../../lib/stripe-booking'
import { Studio, Service, CreateBookingForm } from '../../types/booking'

export default function BookingScreen() {
  const { studioId } = useLocalSearchParams<{ studioId: string }>()
  const router = useRouter()
  
  const [studio, setStudio] = useState<Studio | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'service' | 'datetime' | 'details' | 'payment'>('service')
  
  const [bookingForm, setBookingForm] = useState<CreateBookingForm>({
    service_id: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    start_time: '',
    notes: '',
  })

  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    if (studioId) {
      loadStudioData()
    }
  }, [studioId])

  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedService, selectedDate])

  const loadStudioData = async () => {
    try {
      setLoading(true)
      
      const studioData = await bookingService.getStudio(studioId!)
      if (!studioData || !studioData.onboarded) {
        Alert.alert('Error', 'Studio not found or not accepting bookings')
        return
      }

      setStudio(studioData)
      
      const servicesData = await bookingService.getStudioServices(studioId!, true)
      setServices(servicesData)
      
    } catch (error: any) {
      console.error('Error loading studio:', error)
      Alert.alert('Error', 'Failed to load studio information')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    if (!selectedService || !selectedDate) return

    try {
      const slots = await bookingService.getAvailableTimeSlots(
        studioId!,
        selectedService.id,
        selectedDate
      )
      setAvailableSlots(slots)
    } catch (error: any) {
      console.error('Error loading time slots:', error)
      Alert.alert('Error', 'Failed to load available times')
    }
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setBookingForm({
      ...bookingForm,
      service_id: service.id
    })
    setStep('datetime')
  }

  const handleDateTimeSelect = () => {
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot')
      return
    }

    setBookingForm({
      ...bookingForm,
      start_time: selectedTime
    })
    setStep('details')
  }

  const handleBookingSubmit = async () => {
    if (!bookingForm.client_name || !bookingForm.client_email) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    if (!selectedService) return

    try {
      setLoading(true)

      // Calculate end time
      const startTime = new Date(bookingForm.start_time)
      const endTime = new Date(startTime.getTime() + (selectedService.duration_minutes * 60 * 1000))

      // Create the booking
      const booking = await bookingService.createBooking({
        studio_id: studioId!,
        service_id: bookingForm.service_id,
        client_name: bookingForm.client_name,
        client_email: bookingForm.client_email,
        client_phone: bookingForm.client_phone,
        start_time: bookingForm.start_time,
        end_time: endTime.toISOString(),
        total_price_cents: selectedService.price_cents,
        status: 'pending_payment',
        notes: bookingForm.notes,
      })

      // Create payment session
      const returnUrl = `dreamsuite://booking/success/${booking.id}`
      const paymentResult = await stripeBookingService.createBookingPayment(
        booking,
        selectedService,
        returnUrl
      )

      if (paymentResult.success && paymentResult.session) {
        // Open payment URL
        await stripeBookingService.openPaymentUrl(paymentResult.session.url)
      } else {
        Alert.alert('Payment Error', paymentResult.error || 'Failed to create payment')
      }

    } catch (error: any) {
      console.error('Error creating booking:', error)
      Alert.alert('Error', 'Failed to create booking. Please try again.')
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

  // Generate next 30 days for date selection
  const getAvailableDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    return dates
  }

  if (loading && !studio) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading studio...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!studio) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Studio Not Found</Text>
          <Text style={styles.errorText}>This booking link may be invalid or the studio is not accepting bookings.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Studio Header */}
      <View style={styles.header}>
        <Text style={styles.studioName}>{studio.name}</Text>
        {studio.description && (
          <Text style={styles.studioDescription}>{studio.description}</Text>
        )}
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressStep,
            step === 'service' && styles.progressStepActive,
            ['datetime', 'details', 'payment'].includes(step) && styles.progressStepComplete
          ]}>
            <Text style={[
              styles.progressStepText,
              (step === 'service' || ['datetime', 'details', 'payment'].includes(step)) && styles.progressStepTextActive
            ]}>1</Text>
          </View>
          
          <View style={[
            styles.progressLine,
            ['datetime', 'details', 'payment'].includes(step) && styles.progressLineActive
          ]} />
          
          <View style={[
            styles.progressStep,
            step === 'datetime' && styles.progressStepActive,
            ['details', 'payment'].includes(step) && styles.progressStepComplete
          ]}>
            <Text style={[
              styles.progressStepText,
              (step === 'datetime' || ['details', 'payment'].includes(step)) && styles.progressStepTextActive
            ]}>2</Text>
          </View>
          
          <View style={[
            styles.progressLine,
            ['details', 'payment'].includes(step) && styles.progressLineActive
          ]} />
          
          <View style={[
            styles.progressStep,
            ['details', 'payment'].includes(step) && styles.progressStepActive
          ]}>
            <Text style={[
              styles.progressStepText,
              ['details', 'payment'].includes(step) && styles.progressStepTextActive
            ]}>3</Text>
          </View>
        </View>
        
        <View style={styles.progressLabels}>
          <Text style={[
            styles.progressLabel,
            step === 'service' && styles.progressLabelActive
          ]}>Service</Text>
          <Text style={[
            styles.progressLabel,
            step === 'datetime' && styles.progressLabelActive
          ]}>Date & Time</Text>
          <Text style={[
            styles.progressLabel,
            ['details', 'payment'].includes(step) && styles.progressLabelActive
          ]}>Details</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Step 1: Service Selection */}
        {step === 'service' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choose a Service</Text>
            
            <View style={styles.servicesList}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleServiceSelect(service)}
                >
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.servicePrice}>
                      {formatCurrency(service.price_cents)}
                    </Text>
                  </View>
                  
                  <Text style={styles.serviceDuration}>
                    {formatDuration(service.duration_minutes)}
                  </Text>
                  
                  {service.description && (
                    <Text style={styles.serviceDescription}>
                      {service.description}
                    </Text>
                  )}
                  
                  {service.requires_deposit && (
                    <Text style={styles.depositInfo}>
                      {service.deposit_percentage}% deposit required
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 'datetime' && selectedService && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choose Date & Time</Text>
            
            <View style={styles.selectedServiceSummary}>
              <Text style={styles.selectedServiceName}>{selectedService.name}</Text>
              <Text style={styles.selectedServiceDetails}>
                {formatDuration(selectedService.duration_minutes)} • {formatCurrency(selectedService.price_cents)}
              </Text>
            </View>

            {/* Date Selection */}
            <Text style={styles.sectionTitle}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {getAvailableDates().map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateButton,
                    selectedDate === date && styles.dateButtonActive
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dateButtonText,
                    selectedDate === date && styles.dateButtonTextActive
                  ]}>
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Time Selection */}
            {selectedDate && (
              <>
                <Text style={styles.sectionTitle}>Available Times</Text>
                {availableSlots.length > 0 ? (
                  <View style={styles.timeSlotsGrid}>
                    {availableSlots.map((slot) => (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.timeSlot,
                          selectedTime === slot && styles.timeSlotActive
                        ]}
                        onPress={() => setSelectedTime(slot)}
                      >
                        <Text style={[
                          styles.timeSlotText,
                          selectedTime === slot && styles.timeSlotTextActive
                        ]}>
                          {formatTime(slot)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noSlotsContainer}>
                    <Text style={styles.noSlotsText}>
                      No available times for this date. Please select another date.
                    </Text>
                  </View>
                )}
              </>
            )}

            {selectedTime && (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleDateTimeSelect}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 3: Client Details */}
        {step === 'details' && selectedService && selectedTime && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your Details</Text>
            
            {/* Booking Summary */}
            <View style={styles.bookingSummary}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service:</Text>
                <Text style={styles.summaryValue}>{selectedService.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>{formatDate(selectedTime)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>{formatTime(selectedTime)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>{formatDuration(selectedService.duration_minutes)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total:</Text>
                <Text style={styles.summaryTotalValue}>{formatCurrency(selectedService.price_cents)}</Text>
              </View>
            </View>

            {/* Client Form */}
            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.client_name}
                  onChangeText={(text) => setBookingForm({...bookingForm, client_name: text})}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email Address *</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.client_email}
                  onChangeText={(text) => setBookingForm({...bookingForm, client_email: text})}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.client_phone}
                  onChangeText={(text) => setBookingForm({...bookingForm, client_phone: text})}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Additional Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={bookingForm.notes}
                  onChangeText={(text) => setBookingForm({...bookingForm, notes: text})}
                  placeholder="Any special requests or information..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={handleBookingSubmit}
              disabled={loading}
            >
              <Text style={styles.bookButtonText}>
                {loading ? 'Creating Booking...' : 'Book & Pay'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  studioName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  studioDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepActive: {
    backgroundColor: '#2081C3',
  },
  progressStepComplete: {
    backgroundColor: '#10b981',
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  progressStepTextActive: {
    color: 'white',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e5e5',
    marginHorizontal: 12,
  },
  progressLineActive: {
    backgroundColor: '#10b981',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    minWidth: 60,
  },
  progressLabelActive: {
    color: '#2081C3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  servicesList: {
    gap: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    paddingRight: 12,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#2081C3',
    fontWeight: '600',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  depositInfo: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  selectedServiceSummary: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedServiceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  selectedServiceDetails: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  dateScroll: {
    marginBottom: 24,
  },
  dateButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  dateButtonActive: {
    backgroundColor: '#2081C3',
    borderColor: '#2081C3',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  dateButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  timeSlot: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  timeSlotActive: {
    backgroundColor: '#2081C3',
    borderColor: '#2081C3',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#666',
  },
  timeSlotTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  noSlotsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  noSlotsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#2081C3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bookingSummary: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  formContainer: {
    gap: 20,
    marginBottom: 32,
  },
  formGroup: {},
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  bookButton: {
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
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
})