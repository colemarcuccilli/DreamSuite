import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView
} from 'react-native'
import ResponsiveContainer from '../components/ui/ResponsiveContainer'
import ResponsiveGrid from '../components/ui/ResponsiveGrid'
import {
  getResponsiveFontSize,
  getResponsivePadding,
  responsive,
  isDesktop,
  isWeb
} from '../utils/responsive'

interface Props {
  navigation: any
  user: any
  userProfile: any
  onSignOut: () => void
}

export default function HomeScreen({ navigation, user, userProfile, onSignOut }: Props) {
  const handleBookingPress = () => {
    if (!user) {
      // User not authenticated, redirect to auth
      navigation.navigate('Auth')
      return
    }
    // User is authenticated, proceed to booking
    navigation.navigate('Booking')
  }

  const handleAdminPress = () => {
    if (!user) {
      // User not authenticated, redirect to auth
      navigation.navigate('Auth')
      return
    }
    
    if (userProfile?.is_super_admin) {
      // User is super admin, go to admin dashboard
      navigation.navigate('Admin')
    } else {
      // Regular user, show message
      alert('Admin dashboard access requires super admin privileges. Contact support if you need studio owner access.')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.content, isWeb && styles.webContent]}
        showsVerticalScrollBar={isDesktop()}
      >
        <ResponsiveContainer>
        {/* Header */}
        <View style={[styles.header, isDesktop() && styles.desktopHeader]}>
          <Text style={styles.title}>Dream Suite</Text>
          <Text style={styles.subtitle}>Music Studio Booking Platform</Text>
          
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome back, {userProfile?.full_name || user.email}!</Text>
              {userProfile?.is_super_admin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>🎵 Super Admin</Text>
                </View>
              )}
              <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <ResponsiveGrid spacing={responsive({ mobile: 16, desktop: 24 })}>
          
          {/* Booking Access */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Book a Studio Session</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleBookingPress}
            >
              <Text style={styles.primaryButtonText}>
                {user ? '📅 Book Sweet Dreams Studio' : '📅 Sign In to Book Studio'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helpText}>
              {user 
                ? 'Book recording, mixing, mastering, and consultation sessions'
                : 'Create an account or sign in to book studio sessions'
              }
            </Text>
          </View>

          {/* Admin Access */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Studio Management</Text>
            
            {userProfile?.is_super_admin ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Admin')}
              >
                <Text style={styles.secondaryButtonText}>🎵 Super Admin Dashboard</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleAdminPress}
                >
                  <Text style={styles.secondaryButtonText}>
                    {user ? '🔐 Admin Dashboard' : '🔐 Studio Owner Sign In'}
                  </Text>
                </TouchableOpacity>
                
                {!user && (
                  <TouchableOpacity
                    style={styles.tertiaryButton}
                    onPress={() => navigation.navigate('Auth')}
                  >
                    <Text style={styles.tertiaryButtonText}>📝 Create Account</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            
            <Text style={styles.helpText}>
              {userProfile?.is_super_admin 
                ? 'Manage all studios and bookings on the platform'
                : user
                  ? 'Studio management requires admin privileges'
                  : 'Sign in or create an account to manage your studio'
              }
            </Text>
          </View>

        </ResponsiveGrid>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Professional music studio booking and management platform
          </Text>
        </View>
        </ResponsiveContainer>
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
    flexGrow: 1,
    minHeight: isWeb ? '100vh' : 'auto',
  },
  webContent: {
    justifyContent: isDesktop() ? 'flex-start' : 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: responsive({ mobile: 40, desktop: 60 }),
    paddingTop: responsive({ mobile: 20, desktop: 40 }),
  },
  desktopHeader: {
    maxWidth: 800,
    alignSelf: 'center',
  },
  title: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: 'bold',
    color: '#2081C3',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    textAlign: 'center',
  },
  // Removed actionsContainer - now using ResponsiveGrid
  section: {
    backgroundColor: 'white',
    padding: getResponsivePadding(),
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: isDesktop() ? 300 : 'auto',
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: isDesktop() ? 'left' : 'center',
  },
  primaryButton: {
    backgroundColor: '#2081C3',
    paddingVertical: responsive({ mobile: 16, desktop: 18 }),
    paddingHorizontal: responsive({ mobile: 24, desktop: 32 }),
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#10b981',
    paddingVertical: responsive({ mobile: 14, desktop: 16 }),
    paddingHorizontal: responsive({ mobile: 24, desktop: 32 }),
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: responsive({ mobile: 14, desktop: 16 }),
    paddingHorizontal: responsive({ mobile: 24, desktop: 32 }),
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  tertiaryButtonText: {
    color: '#2081C3',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
  },
  helpText: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: responsive({ mobile: 20, desktop: 24 }),
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    alignItems: 'center',
  },
  footerText: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    textAlign: 'center',
  },
  userInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  adminBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  adminBadgeText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
})