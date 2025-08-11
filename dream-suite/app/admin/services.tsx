import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../hooks/useAuth'
import { bookingService } from '../../lib/supabase-booking'
import { Studio, Service, CreateServiceForm } from '../../types/booking'

export default function ServicesScreen() {
  const { user } = useAuth()
  const [studio, setStudio] = useState<Studio | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<CreateServiceForm>({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    category: 'recording',
    requires_deposit: false,
    deposit_percentage: 50,
    max_advance_booking_days: 30,
    min_advance_booking_hours: 24,
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const studioData = await bookingService.getStudioByOwner(user.id)
      if (!studioData) {
        Alert.alert('Error', 'Studio not found')
        return
      }

      setStudio(studioData)
      const servicesData = await bookingService.getStudioServices(studioData.id, false)
      setServices(servicesData)
    } catch (error: any) {
      console.error('Error loading services:', error)
      Alert.alert('Error', 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      duration_minutes: 60,
      price: 0,
      category: 'recording',
      requires_deposit: false,
      deposit_percentage: 50,
      max_advance_booking_days: 30,
      min_advance_booking_hours: 24,
    })
    setModalVisible(true)
  }

  const openEditModal = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price_cents / 100,
      category: service.category,
      requires_deposit: service.requires_deposit,
      deposit_percentage: service.deposit_percentage || 50,
      max_advance_booking_days: service.max_advance_booking_days || 30,
      min_advance_booking_hours: service.min_advance_booking_hours || 24,
    })
    setModalVisible(true)
  }

  const handleSaveService = async () => {
    if (!studio) return

    try {
      const serviceData = {
        ...formData,
        price_cents: Math.round(formData.price * 100),
        studio_id: studio.id,
      }

      if (editingService) {
        await bookingService.updateService(editingService.id, serviceData)
      } else {
        await bookingService.createService(serviceData)
      }

      setModalVisible(false)
      await loadData()
      
      Alert.alert(
        'Success',
        `Service ${editingService ? 'updated' : 'created'} successfully!`
      )
    } catch (error: any) {
      console.error('Error saving service:', error)
      Alert.alert('Error', 'Failed to save service')
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      await bookingService.updateService(service.id, {
        active: !service.active
      })
      await loadData()
    } catch (error: any) {
      console.error('Error toggling service:', error)
      Alert.alert('Error', 'Failed to update service')
    }
  }

  const handleDeleteService = async (service: Service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.deleteService(service.id)
              await loadData()
              Alert.alert('Success', 'Service deleted successfully')
            } catch (error: any) {
              console.error('Error deleting service:', error)
              Alert.alert('Error', 'Failed to delete service')
            }
          }
        }
      ]
    )
  }

  const formatCurrency = (cents: number) => {
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Studio Services</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Text style={styles.addButtonText}>+ Add Service</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {services.length > 0 ? (
          <View style={styles.servicesList}>
            {services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceCategory}>
                      {service.category.toUpperCase()} • {formatDuration(service.duration_minutes)}
                    </Text>
                  </View>
                  <Switch
                    value={service.active}
                    onValueChange={() => handleToggleActive(service)}
                    trackColor={{ false: '#e5e5e5', true: '#2081C3' }}
                    thumbColor={service.active ? 'white' : '#f4f3f4'}
                  />
                </View>

                {service.description && (
                  <Text style={styles.serviceDescription}>
                    {service.description}
                  </Text>
                )}

                <View style={styles.serviceDetails}>
                  <Text style={styles.servicePrice}>
                    {formatCurrency(service.price_cents)}
                  </Text>
                  
                  {service.requires_deposit && (
                    <Text style={styles.depositInfo}>
                      {service.deposit_percentage}% deposit required
                    </Text>
                  )}
                </View>

                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(service)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteService(service)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Services Yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first service to start accepting bookings
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={openCreateModal}>
              <Text style={styles.emptyStateButtonText}>Create First Service</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Service Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingService ? 'Edit Service' : 'New Service'}
            </Text>
            <TouchableOpacity onPress={handleSaveService}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="e.g., Recording Session"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Describe your service..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Duration (minutes) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.duration_minutes.toString()}
                  onChangeText={(text) => setFormData({
                    ...formData, 
                    duration_minutes: parseInt(text) || 0
                  })}
                  placeholder="60"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Price ($) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price.toString()}
                  onChangeText={(text) => setFormData({
                    ...formData, 
                    price: parseFloat(text) || 0
                  })}
                  placeholder="100.00"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryButtons}>
                {['recording', 'mixing', 'mastering', 'consultation', 'other'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      formData.category === category && styles.categoryButtonActive
                    ]}
                    onPress={() => setFormData({...formData, category: category as any})}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      formData.category === category && styles.categoryButtonTextActive
                    ]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Require Deposit</Text>
                <Switch
                  value={formData.requires_deposit}
                  onValueChange={(value) => setFormData({...formData, requires_deposit: value})}
                  trackColor={{ false: '#e5e5e5', true: '#2081C3' }}
                  thumbColor={formData.requires_deposit ? 'white' : '#f4f3f4'}
                />
              </View>
              
              {formData.requires_deposit && (
                <View style={styles.formGroupIndented}>
                  <Text style={styles.label}>Deposit Percentage</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.deposit_percentage?.toString() || '50'}
                    onChangeText={(text) => setFormData({
                      ...formData, 
                      deposit_percentage: parseInt(text) || 50
                    })}
                    placeholder="50"
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#2081C3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  servicesList: {
    padding: 20,
    gap: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: 16,
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
  serviceInfo: {
    flex: 1,
    paddingRight: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceDetails: {
    marginBottom: 16,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  depositInfo: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2081C3',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    backgroundColor: '#2081C3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#ef4444',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#2081C3',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formGroupIndented: {
    marginTop: 12,
    marginLeft: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  categoryButtonActive: {
    backgroundColor: '#2081C3',
    borderColor: '#2081C3',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
})