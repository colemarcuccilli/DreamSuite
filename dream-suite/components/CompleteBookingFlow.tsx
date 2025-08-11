import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
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

interface Service {
  id: string
  name: string
  description: string
  duration_minutes: number
  price_cents: number
  category: string
  requires_deposit: boolean
  deposit_percentage: number
}

interface BookingFormData {
  clientName: string
  clientEmail: string
  clientPhone: string
  notes: string
}

type BookingStep = 'services' | 'datetime' | 'details' | 'payment' | 'confirmation'

interface Props {
  navigation: any
  user?: any
  userProfile?: any
}

export default function CompleteBookingFlow({ navigation, user, userProfile }: Props) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('services')
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    clientName: userProfile?.full_name || '',
    clientEmail: user?.email || '',
    clientPhone: userProfile?.phone || '',
    notes: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigation.navigate('Auth')
      return
    }
    
    loadServices()
    
    // Update form with user data when user/userProfile changes
    setBookingForm(prev => ({
      ...prev,
      clientName: userProfile?.full_name || prev.clientName,
      clientEmail: user?.email || prev.clientEmail,
      clientPhone: userProfile?.phone || prev.clientPhone,
    }))
  }, [user, userProfile])

  const loadServices = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('studio_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .eq('active', true)
        .order('price_cents', { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading services:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
    }
    return `${mins}m`
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setCurrentStep('datetime')
  }

  const handleDateTimeSelect = (date: string, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setCurrentStep('details')
  }

  const handleFormUpdate = (field: keyof BookingFormData, value: string) => {
    setBookingForm(prev => ({ ...prev, [field]: value }))
  }

  const validateBookingForm = (): boolean => {
    if (!bookingForm.clientName.trim()) {
      Alert.alert('Error', 'Please enter your name')
      return false
    }
    if (!bookingForm.clientEmail.trim()) {
      Alert.alert('Error', 'Please enter your email')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingForm.clientEmail)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return false
    }
    return true
  }

  const handleSubmitBooking = async () => {
    if (!validateBookingForm() || !selectedService) return

    try {
      setLoading(true)

      // Create booking in database
      const startDateTime = new Date(`${selectedDate}T${selectedTime}`)
      const endDateTime = new Date(startDateTime.getTime() + selectedService.duration_minutes * 60000)

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          studio_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          service_id: selectedService.id,
          user_id: user?.id,
          client_name: bookingForm.clientName,
          client_email: bookingForm.clientEmail,
          client_phone: bookingForm.clientPhone || null,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          total_price_cents: selectedService.price_cents,
          status: 'pending_payment',
          notes: bookingForm.notes || null,
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // For now, just show success - later integrate with Stripe
      Alert.alert(
        'Booking Created!', 
        `Your booking for ${selectedService.name} has been created. In the full version, you would now proceed to payment.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              setCurrentStep('confirmation')
              // navigation.navigate('Home')
            }
          }
        ]
      )

    } catch (err: any) {
      console.error('Error creating booking:', err)
      Alert.alert('Error', 'Failed to create booking: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    return slots
  }

  const generateDateOptions = () => {
    const dates = []
    const today = new Date()
    for (let i = 1; i <= 14; i++) { // Next 14 days
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  // Step 1: Service Selection
  if (currentStep === 'services') {
    if (loading) {
      return (
        <SafeAreaView style={styles.container}>
          <ResponsiveContainer>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2081C3" />
              <Text style={styles.loadingText}>Loading services...</Text>
            </View>
          </ResponsiveContainer>
        </SafeAreaView>
      )
    }

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={[styles.content, isWeb && styles.webContent]}>
          <ResponsiveContainer>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.backButtonText}>← Back to Home</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Sweet Dreams Music Studio</Text>
              <Text style={styles.subtitle}>Choose your service</Text>
            </View>

            <ResponsiveGrid spacing={responsive({ mobile: 16, desktop: 24 })}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleServiceSelect(service)}
                >
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.servicePrice}>{formatPrice(service.price_cents)}</Text>
                  </View>
                  
                  <Text style={styles.serviceDuration}>
                    {formatDuration(service.duration_minutes)}
                  </Text>
                  
                  {service.description && (
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                  )}
                  
                  <View style={styles.serviceCategory}>
                    <Text style={styles.categoryText}>{service.category.toUpperCase()}</Text>
                  </View>

                  {service.requires_deposit && (
                    <View style={styles.depositBadge}>
                      <Text style={styles.depositText}>
                        {service.deposit_percentage}% deposit required
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ResponsiveGrid>
          </ResponsiveContainer>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // Step 2: Date & Time Selection
  if (currentStep === 'datetime') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={[styles.content, isWeb && styles.webContent]}>
          <ResponsiveContainer>
            <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentStep('services')}
            >
              <Text style={styles.backButtonText}>← Back to Services</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Select Date & Time</Text>
            <Text style={styles.subtitle}>
              {selectedService?.name} - {formatDuration(selectedService?.duration_minutes || 0)}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                {generateDateOptions().map((date) => (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.dateOption,
                      selectedDate === date && styles.dateOptionSelected
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      selectedDate === date && styles.dateOptionTextSelected
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
            </View>

            {selectedDate && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Time</Text>
                <ScrollView contentContainerStyle={styles.timeGrid}>
                  {generateTimeSlots().map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        selectedTime === time && styles.timeOptionSelected
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedTime === time && styles.timeOptionTextSelected
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {selectedDate && selectedTime && (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => setCurrentStep('details')}
              >
                <Text style={styles.continueButtonText}>Continue to Details</Text>
              </TouchableOpacity>
            )}
          </View>
          </ResponsiveContainer>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // Step 3: Client Details
  if (currentStep === 'details') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={[styles.content, isWeb && styles.webContent]}>
          <ResponsiveContainer>
            <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentStep('datetime')}
            >
              <Text style={styles.backButtonText}>← Back to Date/Time</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Booking Details</Text>
            <Text style={styles.subtitle}>
              {selectedService?.name} on {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
            </Text>
            {user && (
              <Text style={styles.userNote}>
                📝 Your account information is pre-filled below
              </Text>
            )}
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, user && styles.inputReadonly]}
                value={bookingForm.clientName}
                onChangeText={(text) => handleFormUpdate('clientName', text)}
                placeholder="Enter your full name"
                autoCapitalize="words"
                editable={!user}
              />
              {user && <Text style={styles.readonlyNote}>From your account</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, user && styles.inputReadonly]}
                value={bookingForm.clientEmail}
                onChangeText={(text) => handleFormUpdate('clientEmail', text)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!user}
              />
              {user && <Text style={styles.readonlyNote}>From your account</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={bookingForm.clientPhone}
                onChangeText={(text) => handleFormUpdate('clientPhone', text)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bookingForm.notes}
                onChangeText={(text) => handleFormUpdate('notes', text)}
                placeholder="Any special requests or notes..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service:</Text>
                <Text style={styles.summaryValue}>{selectedService?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>{selectedTime}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total:</Text>
                <Text style={styles.summaryTotalValue}>
                  {formatPrice(selectedService?.price_cents || 0)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.continueButton, loading && styles.continueButtonDisabled]}
              onPress={handleSubmitBooking}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.continueButtonText}>Create Booking</Text>
              )}
            </TouchableOpacity>
          </View>
          </ResponsiveContainer>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // Step 4: Confirmation
  if (currentStep === 'confirmation') {
    return (
      <SafeAreaView style={styles.container}>
        <ResponsiveContainer>
          <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationTitle}>🎉 Booking Created!</Text>
          <Text style={styles.confirmationText}>
            Your booking request has been submitted. In the full version, you would proceed to payment.
          </Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.continueButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
        </ResponsiveContainer>
      </SafeAreaView>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  webContent: {
    minHeight: isWeb ? '100vh' : 'auto',
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
  header: {
    backgroundColor: 'white',
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: responsive({ mobile: 24, desktop: 32 }),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    alignItems: isDesktop() ? 'center' : 'stretch',
    maxWidth: isDesktop() ? 800 : '100%',
    alignSelf: isDesktop() ? 'center' : 'stretch',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#2081C3',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: isDesktop() ? 'center' : 'left',
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    textAlign: isDesktop() ? 'center' : 'left',
  },
  servicesList: {
    padding: 20,
    gap: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: getResponsivePadding(),
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: isDesktop() ? 250 : 'auto',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  servicePrice: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#10b981',
  },
  serviceDuration: {
    fontSize: getResponsiveFontSize(14),
    color: '#2081C3',
    fontWeight: '500',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    lineHeight: responsive({ mobile: 20, desktop: 24 }),
    marginBottom: 12,
  },
  serviceCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: getResponsiveFontSize(10),
    fontWeight: '600',
    color: '#666',
  },
  depositBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  depositText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400e',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 100,
  },
  dateScroll: {
    flexGrow: 0,
  },
  dateOption: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  dateOptionSelected: {
    backgroundColor: '#2081C3',
    borderColor: '#2081C3',
  },
  dateOptionText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  dateOptionTextSelected: {
    color: 'white',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    minWidth: 80,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: '#2081C3',
    borderColor: '#2081C3',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  timeOptionTextSelected: {
    color: 'white',
  },
  summaryCard: {
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
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 8,
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  continueButton: {
    backgroundColor: '#2081C3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  confirmationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  userNote: {
    fontSize: 14,
    color: '#2081C3',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  inputReadonly: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  readonlyNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
})