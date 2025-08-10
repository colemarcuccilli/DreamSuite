import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../hooks/useAuth'
import { supabase, Metric, Insight } from '../../lib/supabase'

export default function DashboardScreen() {
  const { user, artist, signOut } = useAuth()
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadDashboardData()
      setupRealtimeSubscriptions()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load recent metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('metrics')
        .select('*')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (metricsError) throw metricsError
      setMetrics(metricsData || [])

      // Load unread insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('insights')
        .select('*')
        .eq('artist_id', user.id)
        .eq('status', 'unread')
        .order('created_at', { ascending: false })
        .limit(5)

      if (insightsError) throw insightsError
      setInsights(insightsData || [])

    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscriptions = () => {
    if (!user) return

    // Subscribe to metrics changes
    const metricsChannel = supabase
      .channel('metrics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'metrics',
          filter: `artist_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMetrics((prev) => [payload.new as Metric, ...prev.slice(0, 9)])
          }
        }
      )
      .subscribe()

    // Subscribe to insights changes
    const insightsChannel = supabase
      .channel('insights-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'insights',
          filter: `artist_id=eq.${user.id}`,
        },
        (payload) => {
          setInsights((prev) => [payload.new as Insight, ...prev])
        }
      )
      .subscribe()

    return () => {
      metricsChannel.unsubscribe()
      insightsChannel.unsubscribe()
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{artist?.name || user?.email}! 🎵</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Metrics Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Performance</Text>
          {metrics.length > 0 ? (
            <View style={styles.metricsGrid}>
              {metrics.slice(0, 4).map((metric) => (
                <View key={metric.id} style={styles.metricCard}>
                  <Text style={styles.metricPlatform}>{metric.platform}</Text>
                  <Text style={styles.metricValue}>
                    {metric.followers?.toLocaleString() || '0'}
                  </Text>
                  <Text style={styles.metricLabel}>followers</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Connect your social media accounts to see metrics here
              </Text>
            </View>
          )}
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Insights</Text>
          {insights.length > 0 ? (
            <View style={styles.insightsList}>
              {insights.map((insight) => (
                <View key={insight.id} style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <View style={[styles.priorityBadge, 
                      { backgroundColor: getPriorityColor(insight.priority) }]}>
                      <Text style={styles.priorityText}>
                        {insight.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {insight.description && (
                    <Text style={styles.insightDescription} numberOfLines={2}>
                      {insight.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                AI insights will appear here as you use the platform
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionEmoji}>📱</Text>
              <Text style={styles.actionText}>Connect Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionEmoji}>🎵</Text>
              <Text style={styles.actionText}>Connect Spotify</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionEmoji}>📊</Text>
              <Text style={styles.actionText}>View Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionEmoji}>✨</Text>
              <Text style={styles.actionText}>AI Insights</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high': return '#ef4444'
    case 'medium': return '#f59e0b'
    case 'low': return '#10b981'
    default: return '#6b7280'
  }
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
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  signOutText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricPlatform: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2081C3',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
})