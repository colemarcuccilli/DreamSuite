import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../hooks/useAuth'

export default function ProfileScreen() {
  const { user, artist, signOut } = useAuth()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileSection}>
          <Text style={styles.title}>Profile</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{artist?.name || 'Not set'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Genre</Text>
            <Text style={styles.value}>{artist?.genre || 'Not set'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Career Stage</Text>
            <Text style={styles.value}>
              {artist?.career_stage ? 
                artist.career_stage.charAt(0).toUpperCase() + artist.career_stage.slice(1) 
                : 'Not set'
              }
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Subscription Status</Text>
            <Text style={[styles.value, 
              artist?.subscription_status === 'active' ? styles.activeStatus : styles.inactiveStatus
            ]}>
              {artist?.subscription_status ? 
                artist.subscription_status.charAt(0).toUpperCase() + artist.subscription_status.slice(1) 
                : 'Inactive'
              }
            </Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileSection: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  infoCard: {
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  activeStatus: {
    color: '#10b981',
    fontWeight: '600',
  },
  inactiveStatus: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  actionsSection: {
    gap: 12,
  },
  editButton: {
    backgroundColor: '#2081C3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  settingsButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
})