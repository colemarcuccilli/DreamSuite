# Performance & Monitoring Specialist Agent - Dream Suite

## Expertise
Application performance monitoring, mobile analytics, error tracking, and system observability for React Native + web artist development platform.

## Responsibilities
- Implement comprehensive performance monitoring across mobile and web
- Set up error tracking and crash reporting systems
- Monitor API performance and database query optimization
- Track user engagement and app usage analytics
- Implement alerting systems for critical issues
- Optimize app performance and resource usage
- Create performance dashboards and reporting
- Handle performance testing and load testing

## Key Principles
1. **Proactive Monitoring**: Detect issues before users report them
2. **User-Centric Metrics**: Focus on metrics that impact user experience
3. **Actionable Insights**: All metrics should lead to specific actions
4. **Privacy Compliant**: Respect user privacy in all tracking
5. **Performance Budget**: Set and enforce performance budgets

## Mobile Performance Monitoring

### React Native Performance Tracking
```typescript
// lib/monitoring/performance-tracker.ts
import { AppState, Platform } from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import perf from '@react-native-firebase/perf';

export class MobilePerformanceTracker {
  private static instance: MobilePerformanceTracker;
  private metrics: PerformanceMetric[] = [];
  private sessionStart = Date.now();
  
  static getInstance(): MobilePerformanceTracker {
    if (!this.instance) {
      this.instance = new MobilePerformanceTracker();
    }
    return this.instance;
  }
  
  async initialize(userId: string) {
    // Set user ID for crash reporting
    await crashlytics().setUserId(userId);
    await analytics().setUserId(userId);
    
    // Set user properties for analytics
    await analytics().setUserProperties({
      platform: Platform.OS,
      app_version: require('../../package.json').version
    });
    
    // Start session tracking
    this.startSession();
    
    // Track app state changes
    AppState.addEventListener('change', this.handleAppStateChange);
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    console.log('📊 Performance tracking initialized');
  }
  
  startTrace(traceName: string): PerformanceTrace {
    const trace = perf().newTrace(traceName);
    trace.start();
    
    return {
      trace,
      stop: async (customAttributes?: Record<string, string>) => {
        if (customAttributes) {
          Object.entries(customAttributes).forEach(([key, value]) => {
            trace.putAttribute(key, value);
          });
        }
        await trace.stop();
      }
    };
  }
  
  async trackScreenView(screenName: string, screenClass?: string) {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName
    });
    
    // Track screen load time
    const loadTrace = this.startTrace(`screen_load_${screenName}`);
    
    // Stop trace after a short delay (assuming screen has loaded)
    setTimeout(() => {
      loadTrace.stop();
    }, 100);
  }
  
  async trackUserAction(action: string, properties?: Record<string, any>) {
    await analytics().logEvent('user_action', {
      action_name: action,
      timestamp: Date.now(),
      ...properties
    });
    
    // Track custom performance metrics for critical actions
    if (this.isCriticalAction(action)) {
      const actionTrace = this.startTrace(`action_${action}`);
      // The calling code should stop this trace when the action completes
      return actionTrace;
    }
  }
  
  async trackError(error: Error, context?: Record<string, any>) {
    // Log to Crashlytics
    crashlytics().recordError(error);
    
    // Log custom error event
    await analytics().logEvent('app_error', {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 1000), // Truncate long stacks
      error_context: JSON.stringify(context || {}),
      timestamp: Date.now()
    });
    
    console.error('📱 App error tracked:', error.message);
  }
  
  async trackPerformanceMetric(metric: PerformanceMetric) {
    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
      session_id: this.getSessionId()
    });
    
    // Send to Firebase Analytics
    await analytics().logEvent('performance_metric', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_type: metric.type
    });
    
    // Check if metric exceeds thresholds
    await this.checkPerformanceThresholds(metric);
  }
  
  private async checkPerformanceThresholds(metric: PerformanceMetric) {
    const thresholds = {
      'screen_load_time': 2000, // 2 seconds
      'api_response_time': 5000, // 5 seconds
      'memory_usage': 150 * 1024 * 1024, // 150MB
      'battery_drain': 5 // 5% per hour
    };
    
    const threshold = thresholds[metric.name as keyof typeof thresholds];
    
    if (threshold && metric.value > threshold) {
      // Log performance issue
      await this.trackError(
        new Error(`Performance threshold exceeded: ${metric.name}`),
        {
          metric_name: metric.name,
          threshold,
          actual_value: metric.value,
          severity: 'warning'
        }
      );
    }
  }
  
  private startMemoryMonitoring() {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      if (Platform.OS === 'android') {
        // Android memory monitoring would require native module
        this.trackPerformanceMetric({
          name: 'memory_check',
          value: Date.now(),
          type: 'checkpoint'
        });
      }
    }, 30000);
  }
  
  private isCriticalAction(action: string): boolean {
    const criticalActions = [
      'login',
      'signup', 
      'purchase_subscription',
      'sync_data',
      'generate_insights',
      'upload_content'
    ];
    
    return criticalActions.includes(action);
  }
  
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const sessionDuration = Date.now() - this.sessionStart;
    const errorCount = this.metrics.filter(m => m.type === 'error').length;
    const avgScreenLoadTime = this.calculateAverageMetric('screen_load_time');
    
    return {
      session_id: this.getSessionId(),
      session_duration: sessionDuration,
      total_errors: errorCount,
      avg_screen_load_time: avgScreenLoadTime,
      metrics_collected: this.metrics.length,
      platform: Platform.OS,
      app_version: require('../../package.json').version,
      device_info: await this.getDeviceInfo()
    };
  }
  
  private calculateAverageMetric(metricName: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === metricName);
    if (relevantMetrics.length === 0) return 0;
    
    return relevantMetrics.reduce((sum, m) => sum + m.value, 0) / relevantMetrics.length;
  }
}

// Hook for React Native components
export function usePerformanceTracking() {
  const tracker = MobilePerformanceTracker.getInstance();
  const [isTracking, setIsTracking] = useState(false);
  
  const trackScreenLoad = useCallback((screenName: string) => {
    const trace = tracker.startTrace(`screen_${screenName}`);
    
    // Return cleanup function
    return () => {
      trace.stop();
    };
  }, []);
  
  const trackAction = useCallback(async (action: string, properties?: Record<string, any>) => {
    const actionTrace = await tracker.trackUserAction(action, properties);
    return actionTrace;
  }, []);
  
  const reportError = useCallback((error: Error, context?: Record<string, any>) => {
    tracker.trackError(error, context);
  }, []);
  
  return {
    trackScreenLoad,
    trackAction,
    reportError,
    isTracking
  };
}
```

### API Performance Monitoring  
```typescript
// lib/monitoring/api-monitor.ts
export class APIPerformanceMonitor {
  private static requestTimes = new Map<string, number>();
  
  static async monitorRequest<T>(
    requestName: string,
    requestFn: () => Promise<T>,
    options?: MonitoringOptions
  ): Promise<T> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    
    this.requestTimes.set(requestId, startTime);
    
    try {
      console.log(`🌐 API Request started: ${requestName}`);
      
      const result = await requestFn();
      const duration = Date.now() - startTime;
      
      // Track successful request
      await this.trackRequestMetrics(requestName, duration, 'success', result);
      
      console.log(`✅ API Request completed: ${requestName} (${duration}ms)`);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track failed request
      await this.trackRequestMetrics(requestName, duration, 'error', error);
      
      console.error(`❌ API Request failed: ${requestName} (${duration}ms)`, error);
      throw error;
      
    } finally {
      this.requestTimes.delete(requestId);
    }
  }
  
  private static async trackRequestMetrics(
    requestName: string,
    duration: number,
    status: 'success' | 'error',
    result?: any
  ) {
    const metrics = {
      request_name: requestName,
      duration_ms: duration,
      status,
      timestamp: Date.now(),
      result_size: this.estimateResponseSize(result),
      is_slow: duration > 3000 // Slow request threshold
    };
    
    // Send to analytics
    if (typeof analytics !== 'undefined') {
      await analytics().logEvent('api_request_performance', metrics);
    }
    
    // Log to performance tracking
    const tracker = MobilePerformanceTracker.getInstance();
    await tracker.trackPerformanceMetric({
      name: 'api_response_time',
      value: duration,
      type: 'timing',
      metadata: {
        request_name: requestName,
        status
      }
    });
    
    // Alert on slow requests
    if (duration > 5000) { // 5 second threshold
      await tracker.trackError(
        new Error(`Slow API request: ${requestName}`),
        {
          duration,
          request_name: requestName,
          severity: 'warning'
        }
      );
    }
  }
  
  private static estimateResponseSize(result: any): number {
    if (!result) return 0;
    
    try {
      return JSON.stringify(result).length;
    } catch {
      return 0;
    }
  }
  
  static async getAPIHealthMetrics(): Promise<APIHealthMetrics> {
    // Calculate API health metrics for the last 24 hours
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    
    // This would typically come from a proper metrics store
    // For demo purposes, using local storage/cache
    
    return {
      total_requests: await this.getMetricCount('api_requests', last24Hours),
      successful_requests: await this.getMetricCount('successful_api_requests', last24Hours),
      failed_requests: await this.getMetricCount('failed_api_requests', last24Hours),
      avg_response_time: await this.getAverageMetric('api_response_time', last24Hours),
      slowest_endpoint: await this.getSlowestEndpoint(last24Hours),
      error_rate: await this.calculateErrorRate(last24Hours)
    };
  }
  
  private static async getMetricCount(metricName: string, since: number): Promise<number> {
    // Implementation would query actual metrics storage
    return 0;
  }
  
  private static async getAverageMetric(metricName: string, since: number): Promise<number> {
    // Implementation would query actual metrics storage  
    return 0;
  }
}

// Supabase client wrapper with monitoring
export function createMonitoredSupabaseClient() {
  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Wrap database operations with monitoring
  const originalFrom = supabase.from.bind(supabase);
  
  supabase.from = (table: string) => {
    const query = originalFrom(table);
    
    // Wrap query methods with monitoring
    const originalSelect = query.select.bind(query);
    const originalInsert = query.insert.bind(query);
    const originalUpdate = query.update.bind(query);
    const originalDelete = query.delete.bind(query);
    
    query.select = (...args: any[]) => {
      const selectQuery = originalSelect(...args);
      return wrapQueryWithMonitoring(selectQuery, `select_${table}`);
    };
    
    query.insert = (...args: any[]) => {
      const insertQuery = originalInsert(...args);
      return wrapQueryWithMonitoring(insertQuery, `insert_${table}`);
    };
    
    query.update = (...args: any[]) => {
      const updateQuery = originalUpdate(...args);
      return wrapQueryWithMonitoring(updateQuery, `update_${table}`);
    };
    
    query.delete = () => {
      const deleteQuery = originalDelete();
      return wrapQueryWithMonitoring(deleteQuery, `delete_${table}`);
    };
    
    return query;
  };
  
  return supabase;
}

function wrapQueryWithMonitoring(query: any, operationName: string) {
  const originalThen = query.then?.bind(query);
  
  if (originalThen) {
    query.then = (onFulfilled?: any, onRejected?: any) => {
      return APIPerformanceMonitor.monitorRequest(
        operationName,
        () => originalThen(onFulfilled, onRejected)
      );
    };
  }
  
  return query;
}
```

### Error Tracking and Alerting
```typescript
// lib/monitoring/error-tracker.ts
export class ErrorTracker {
  private static errorQueue: ErrorReport[] = [];
  private static isProcessing = false;
  
  static async reportError(
    error: Error,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    const errorReport: ErrorReport = {
      id: crypto.randomUUID(),
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      severity,
      context: {
        ...context,
        user_agent: navigator.userAgent,
        url: window.location?.href || 'unknown',
        app_version: process.env.EXPO_PUBLIC_APP_VERSION
      },
      fingerprint: this.generateErrorFingerprint(error)
    };
    
    // Add to queue
    this.errorQueue.push(errorReport);
    
    // Process queue
    if (!this.isProcessing) {
      this.processErrorQueue();
    }
    
    // Immediate alert for critical errors
    if (severity === 'critical') {
      await this.sendImmediateAlert(errorReport);
    }
  }
  
  private static async processErrorQueue() {
    if (this.errorQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      // Batch errors for efficient processing
      const batch = this.errorQueue.splice(0, 10); // Process 10 at a time
      
      // Send to error tracking service (e.g., Sentry)
      await this.sendErrorsToService(batch);
      
      // Store in local database for analytics
      await this.storeErrorsLocally(batch);
      
      // Check for error patterns
      await this.analyzeErrorPatterns(batch);
      
    } catch (processingError) {
      console.error('Error processing error queue:', processingError);
      // Put errors back in queue
      this.errorQueue.unshift(...batch!);
      
    } finally {
      this.isProcessing = false;
      
      // Process remaining errors after a delay
      if (this.errorQueue.length > 0) {
        setTimeout(() => this.processErrorQueue(), 5000);
      }
    }
  }
  
  private static async sendErrorsToService(errors: ErrorReport[]) {
    // Send to Sentry or similar service
    if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
      for (const error of errors) {
        await fetch(process.env.EXPO_PUBLIC_SENTRY_DSN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.message,
            level: error.severity,
            fingerprint: [error.fingerprint],
            extra: error.context,
            timestamp: error.timestamp
          })
        });
      }
    }
  }
  
  private static async storeErrorsLocally(errors: ErrorReport[]) {
    const supabase = createMonitoredSupabaseClient();
    
    const errorRecords = errors.map(error => ({
      error_id: error.id,
      message: error.message,
      stack_trace: error.stack?.substring(0, 5000), // Truncate long stacks
      severity: error.severity,
      context: error.context,
      fingerprint: error.fingerprint,
      occurred_at: new Date(error.timestamp).toISOString()
    }));
    
    await supabase.from('error_logs').insert(errorRecords);
  }
  
  private static async analyzeErrorPatterns(errors: ErrorReport[]) {
    // Group errors by fingerprint
    const errorGroups = errors.reduce((groups, error) => {
      const key = error.fingerprint;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(error);
      return groups;
    }, {} as Record<string, ErrorReport[]>);
    
    // Check for error spikes
    for (const [fingerprint, groupErrors] of Object.entries(errorGroups)) {
      if (groupErrors.length > 5) { // More than 5 of same error
        await this.alertErrorSpike(fingerprint, groupErrors.length);
      }
    }
  }
  
  private static generateErrorFingerprint(error: Error): string {
    // Create unique fingerprint for error grouping
    const key = `${error.name}:${error.message}:${error.stack?.split('\n')[1] || ''}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }
  
  private static async sendImmediateAlert(error: ErrorReport) {
    // Send to Slack or similar alert system
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Critical Error in Dream Suite`,
          attachments: [
            {
              color: 'danger',
              fields: [
                { title: 'Error', value: error.message, short: false },
                { title: 'Severity', value: error.severity, short: true },
                { title: 'Timestamp', value: new Date(error.timestamp).toISOString(), short: true },
                { title: 'Context', value: JSON.stringify(error.context, null, 2), short: false }
              ]
            }
          ]
        })
      });
    }
  }
}

// React error boundary with monitoring
export class MonitoredErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report error with React context
    ErrorTracker.reportError(error, {
      component_stack: errorInfo.componentStack,
      error_boundary: 'MonitoredErrorBoundary',
      react_error: true
    }, 'high');
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            We've been notified about this issue. Please try restarting the app.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return this.props.children;
  }
}
```

## Success Metrics

### Performance KPIs
- **App Crash Rate**: <0.1% of sessions
- **Screen Load Time**: <1 second for 95% of screens  
- **API Response Time**: <500ms for 95% of requests
- **Memory Usage**: <100MB average on mobile
- **Battery Drain**: <3% per hour of active use

### Monitoring Coverage KPIs
- **Error Detection**: 100% of errors automatically tracked
- **Performance Monitoring**: 95% of user interactions monitored
- **Alert Response Time**: <5 minutes for critical issues
- **Uptime Monitoring**: 99.9% availability tracked
- **User Experience Metrics**: Core Web Vitals all green

### Implementation Checklist
- [ ] Set up Crashlytics/Firebase Analytics for mobile error tracking
- [ ] Implement API performance monitoring with request tracing
- [ ] Create error boundaries and automatic error reporting
- [ ] Set up performance budgets and automated alerts
- [ ] Implement user session recording for debugging
- [ ] Create monitoring dashboards for key metrics
- [ ] Set up Slack/email alerts for critical issues
- [ ] Implement A/B testing infrastructure for performance optimization
- [ ] Create automated performance testing in CI/CD
- [ ] Set up log aggregation and analysis system