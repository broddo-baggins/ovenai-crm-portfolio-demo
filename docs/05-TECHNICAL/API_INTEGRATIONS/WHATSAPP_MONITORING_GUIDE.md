# WhatsApp Monitoring System Guide

## Overview

The WhatsApp monitoring system provides comprehensive real-time monitoring and compliance tracking for Meta App Provider requirements. It consists of multiple interconnected services that ensure your WhatsApp Business API integration meets Meta's quality and compliance standards.

## Architecture Components

### 1. WhatsApp Logging Service (`src/services/whatsapp-logging.ts`)

**Purpose**: Stores all WhatsApp-related activities in the database for Meta compliance and audit trails.

**Key Features**:
- Outbound/inbound message logging with delivery status tracking
- Template usage analytics for Meta approval compliance
- Webhook processing logs with error handling
- Rate limiting violation tracking
- User interaction and lead association logging

**Usage Example**:
```typescript
import { whatsappLoggingService } from '../services/whatsapp-logging';

// Log outbound message
await whatsappLoggingService.logOutboundMessage({
  phoneNumber: '+1234567890',
  templateName: 'hello_world',
  templateLanguage: 'en',
  userId: 'user-123',
  leadId: 'lead-456'
});

// Update delivery status
await whatsappLoggingService.updateDeliveryStatus(
  messageId, 
  'delivered'
);
```

### 2. WhatsApp Monitoring Service (`src/services/whatsapp-monitoring.ts`)

**Purpose**: Real-time monitoring with configurable alerts and compliance tracking.

**Key Features**:
- 5-minute interval monitoring cycles
- Delivery rate calculations (target: >95%)
- Failure rate tracking (alert threshold: >5%)
- Quality score computation for Meta compliance
- Automated alert generation for violations

**Configuration**:
```typescript
const config = {
  deliveryRateThreshold: 0.95,    // 95% delivery rate required
  failureRateThreshold: 0.05,     // 5% failure rate triggers alert
  qualityScoreThreshold: 0.90,    // 90% quality score minimum
  monitoringInterval: 5 * 60 * 1000  // 5 minutes
};
```

### 3. Uptime Monitoring Service (`src/services/whatsapp-uptime-monitoring.ts`)

**Purpose**: Monitors WhatsApp API endpoint availability and webhook responsiveness.

**Key Features**:
- API endpoint health checks
- Webhook response time monitoring
- Service availability tracking
- Historical uptime metrics storage

### 4. Alert Service (`src/services/whatsapp-alert-service.ts`)

**Purpose**: Centralized alert management for compliance violations and system issues.

**Alert Types**:
- `DELIVERY_RATE_LOW`: When delivery rate drops below threshold
- `FAILURE_RATE_HIGH`: When failure rate exceeds threshold  
- `QUALITY_SCORE_LOW`: When quality score falls below Meta requirements
- `WEBHOOK_TIMEOUT`: When webhooks fail to respond within time limits
- `API_ENDPOINT_DOWN`: When WhatsApp API becomes unreachable

## Admin Dashboard Integration

### Quality Dashboard (`src/components/admin/WhatsAppQualityDashboard.tsx`)

**Features**:
- Real-time metrics display
- Compliance status indicators
- Historical trend charts
- Alert summary with severity levels

**Access**: Available in Admin Console under "WhatsApp Quality Monitoring"

### Logs Viewer (`src/components/admin/WhatsAppLogsViewer.tsx`)

**Features**:
- Searchable message logs with filters
- Delivery status tracking
- Template usage analytics
- Export functionality for Meta compliance reports

**Access**: Available in Admin Console under "WhatsApp Logs"

## Monitoring Initialization

### Auto-Start Configuration

The monitoring system automatically initializes in production environments:

```typescript
// src/services/whatsapp-monitoring-init.ts
if (process.env.NODE_ENV === 'production') {
  await initializeMonitoring();
}
```

### Manual Control

For development or manual control:

```typescript
import { 
  startMonitoring, 
  stopMonitoring, 
  restartMonitoring 
} from '../services/whatsapp-monitoring-init';

// Start monitoring
await startMonitoring();

// Stop monitoring  
await stopMonitoring();

// Restart monitoring
await restartMonitoring();
```

## Database Schema

### Core Tables

1. **whatsapp_message_queue**: Message delivery tracking
2. **conversations**: User interaction context
3. **agent_interaction_logs**: AI agent activity logs
4. **whatsapp_logs**: Comprehensive activity logging
5. **monitoring_metrics**: Real-time monitoring data
6. **alert_history**: Alert tracking and resolution

### Compliance Data

All logging includes Meta-specific flags:
- `meta_compliance_purpose`: Marks logs for Meta review
- `template_approval_status`: Tracks approved template usage
- `quality_rating`: Meta quality score calculation
- `compliance_status`: Real-time compliance assessment

## Meta App Provider Compliance

### Required Metrics

The system automatically tracks all Meta-required metrics:

1. **Message Delivery Rate**: Must maintain >95%
2. **Template Usage**: Only approved templates allowed
3. **Response Times**: Webhook responses <20 seconds
4. **Error Rates**: Failure rates <5%
5. **Quality Scores**: Composite score >90%

### Reporting

Generate compliance reports:

```typescript
import { whatsappLoggingService } from '../services/whatsapp-logging';

// Generate monthly compliance report
const report = await whatsappLoggingService.generateComplianceReport(
  startDate,
  endDate
);
```

## Troubleshooting

### Common Issues

1. **High Failure Rate Alert**
   - Check WhatsApp API credentials
   - Verify template approval status
   - Review rate limiting logs

2. **Low Delivery Rate**
   - Validate phone number formats
   - Check template parameter formatting
   - Review Meta API status

3. **Webhook Timeouts**
   - Optimize webhook response logic
   - Check server resource usage
   - Review database connection pool

### Monitoring Health Check

```typescript
import { whatsappMonitoringService } from '../services/whatsapp-monitoring';

// Check monitoring system health
const status = await whatsappMonitoringService.getSystemStatus();
console.log('Monitoring Status:', status);
```

## Configuration

### Environment Variables

```env
# Required for production monitoring
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_TOKEN=your_whatsapp_token
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# Monitoring configuration
MONITORING_ENABLED=true
ALERT_EMAIL=admin@yourcompany.com
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### Custom Thresholds

Modify monitoring thresholds in `whatsapp-monitoring.ts`:

```typescript
const customConfig = {
  deliveryRateThreshold: 0.98,     // Stricter 98% requirement
  qualityScoreThreshold: 0.95,     // Higher quality standard
  monitoringInterval: 3 * 60 * 1000 // 3-minute intervals
};
```

## Testing

The monitoring system includes comprehensive tests:

```bash
# Run monitoring tests
npm test tests/api/whatsapp-integration.test.ts

# Run specific test suites
npm test -- --grep "WhatsApp Monitoring"
```

## Security Considerations

1. **Access Control**: Admin-only access to monitoring dashboards
2. **Data Retention**: Automatic log rotation and archival
3. **API Security**: Secure token management and rotation
4. **Audit Trails**: Complete activity logging for compliance

## Performance Impact

- **Monitoring Overhead**: <1% CPU usage during normal operation
- **Database Growth**: ~100KB per 1000 messages logged
- **Memory Usage**: ~50MB for monitoring services
- **Network Impact**: Minimal (monitoring API calls every 5 minutes)

## Future Enhancements

- Real-time dashboard notifications
- Predictive failure analysis
- Advanced analytics and reporting
- Integration with external monitoring tools
- Automated compliance report generation 