import React, { useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native'
import {
  getResponsivePadding,
  responsive,
  getResponsiveFontSize,
} from '../utils/responsive'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  marginBottom?: number
  style?: any
}

const SkeletonBox = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  marginBottom = 0,
  style 
}: SkeletonProps) => {
  const shimmerValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const shimmer = () => {
      shimmerValue.setValue(0)
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => shimmer())
    }
    shimmer()
  }, [shimmerValue])

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  })

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          marginBottom,
          opacity,
        },
        style,
      ]}
    />
  )
}

export const AuthScreenSkeleton = () => (
  <View style={styles.authContainer}>
    <View style={styles.authHeader}>
      <SkeletonBox width="60%" height={32} marginBottom={8} borderRadius={8} />
      <SkeletonBox width="80%" height={16} marginBottom={32} borderRadius={4} />
    </View>
    
    <View style={styles.authForm}>
      <View style={styles.authInputGroup}>
        <SkeletonBox width="30%" height={16} marginBottom={8} borderRadius={4} />
        <SkeletonBox width="100%" height={48} marginBottom={20} borderRadius={8} />
      </View>
      
      <View style={styles.authInputGroup}>
        <SkeletonBox width="40%" height={16} marginBottom={8} borderRadius={4} />
        <SkeletonBox width="100%" height={48} marginBottom={20} borderRadius={8} />
      </View>
      
      <SkeletonBox width="100%" height={50} marginBottom={16} borderRadius={12} />
      <SkeletonBox width="40%" height={16} marginBottom={32} borderRadius={4} />
    </View>
  </View>
)

export const DashboardSkeleton = () => (
  <View style={styles.dashboardContainer}>
    <View style={styles.dashboardHeader}>
      <SkeletonBox width="50%" height={32} marginBottom={8} borderRadius={8} />
      <SkeletonBox width="70%" height={16} marginBottom={24} borderRadius={4} />
    </View>
    
    <View style={styles.dashboardCards}>
      <View style={styles.cardRow}>
        <SkeletonBox width="48%" height={120} marginBottom={16} borderRadius={12} />
        <SkeletonBox width="48%" height={120} marginBottom={16} borderRadius={12} />
      </View>
      <View style={styles.cardRow}>
        <SkeletonBox width="48%" height={120} marginBottom={16} borderRadius={12} />
        <SkeletonBox width="48%" height={120} marginBottom={16} borderRadius={12} />
      </View>
    </View>
    
    <SkeletonBox width="100%" height={200} marginBottom={16} borderRadius={12} />
  </View>
)

export const BookingFlowSkeleton = () => (
  <View style={styles.bookingContainer}>
    <View style={styles.bookingHeader}>
      <SkeletonBox width="60%" height={28} marginBottom={8} borderRadius={8} />
      <SkeletonBox width="80%" height={16} marginBottom={24} borderRadius={4} />
    </View>
    
    <View style={styles.serviceGrid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.serviceCard}>
          <SkeletonBox width="100%" height={24} marginBottom={8} borderRadius={6} />
          <SkeletonBox width="80%" height={16} marginBottom={8} borderRadius={4} />
          <SkeletonBox width="40%" height={20} marginBottom={12} borderRadius={6} />
          <SkeletonBox width="60%" height={14} borderRadius={4} />
        </View>
      ))}
    </View>
  </View>
)

export const AdminDashboardSkeleton = () => (
  <View style={styles.adminContainer}>
    <View style={styles.adminHeader}>
      <SkeletonBox width="40%" height={32} marginBottom={8} borderRadius={8} />
      <SkeletonBox width="60%" height={16} marginBottom={24} borderRadius={4} />
    </View>
    
    <View style={styles.adminTabs}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonBox key={i} width="22%" height={40} borderRadius={8} />
      ))}
    </View>
    
    <View style={styles.adminStats}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.statCard}>
          <SkeletonBox width="60%" height={24} marginBottom={8} borderRadius={6} />
          <SkeletonBox width="40%" height={14} borderRadius={4} />
        </View>
      ))}
    </View>
    
    <View style={styles.adminContent}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.listItem}>
          <SkeletonBox width="70%" height={18} marginBottom={6} borderRadius={4} />
          <SkeletonBox width="50%" height={14} marginBottom={6} borderRadius={4} />
          <SkeletonBox width="30%" height={12} borderRadius={4} />
        </View>
      ))}
    </View>
  </View>
)

export const GenericLoadingSkeleton = ({ 
  lines = 3, 
  showHeader = true 
}: { 
  lines?: number
  showHeader?: boolean 
}) => (
  <View style={styles.genericContainer}>
    {showHeader && (
      <View style={styles.genericHeader}>
        <SkeletonBox width="50%" height={24} marginBottom={8} borderRadius={6} />
        <SkeletonBox width="75%" height={16} marginBottom={24} borderRadius={4} />
      </View>
    )}
    
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBox 
        key={i}
        width={`${Math.random() * 40 + 60}%`} 
        height={16} 
        marginBottom={12} 
        borderRadius={4} 
      />
    ))}
  </View>
)

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e2e8f0',
  },
  
  // Auth Screen Skeleton
  authContainer: {
    padding: getResponsivePadding(),
    alignItems: 'center',
  },
  authHeader: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  authForm: {
    backgroundColor: 'white',
    padding: getResponsivePadding(),
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  authInputGroup: {
    marginBottom: 20,
  },
  
  // Dashboard Skeleton
  dashboardContainer: {
    padding: getResponsivePadding(),
  },
  dashboardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  dashboardCards: {
    marginBottom: 24,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  // Booking Flow Skeleton
  bookingContainer: {
    padding: getResponsivePadding(),
  },
  bookingHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: responsive({ mobile: '100%', tablet: '48%', desktop: '31%' }),
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  
  // Admin Dashboard Skeleton
  adminContainer: {
    padding: getResponsivePadding(),
  },
  adminHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  adminTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  adminStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  adminContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  
  // Generic Skeleton
  genericContainer: {
    padding: getResponsivePadding(),
  },
  genericHeader: {
    marginBottom: 24,
  },
})