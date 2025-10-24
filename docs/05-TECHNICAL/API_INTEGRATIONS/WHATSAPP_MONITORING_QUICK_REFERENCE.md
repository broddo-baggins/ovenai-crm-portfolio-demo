# WhatsApp Monitoring Quick Reference

## Service Status Commands

### Check Monitoring Status
```typescript
import { whatsappMonitoringService } from '../services/whatsapp-monitoring';

// Get current system status
const status = await whatsappMonitoringService.getSystemStatus();
console.log('Status:', status.overallStatus); // 'compliant' | 'warning' | 'violation'
```

### Start/Stop Monitoring
```typescript
import { startMonitoring, stopMonitoring } from '../services/whatsapp-monitoring-init';

// Start monitoring
await startMonitoring();

// Stop monitoring
await stopMonitoring();
```

## Key Metrics Thresholds

| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| Delivery Rate | >95% | Critical if below |
| Failure Rate | <5% | Critical if above |
| Quality Score | >90% | Warning if below |
| Webhook Response | <20s | Warning if above |

## Quick Troubleshooting

### High Failure Rate
1. Check API credentials: `WHATSAPP_TOKEN`
2. Verify template approval status
3. Review phone number format validation
4. Check rate limiting logs

### Low Delivery Rate  
1. Verify WhatsApp API status
2. Check template parameters
3. Review recipient phone numbers
4. Monitor rate limiting

### Webhook Timeouts
1. Check server CPU/memory usage
2. Review database connection pool
3. Optimize webhook handler logic
4. Check network latency

## Common API Calls

### Log Message
```typescript
await whatsappLoggingService.logOutboundMessage({
  phoneNumber: '+1234567890',
  templateName: 'hello_world',
  templateLanguage: 'en',
  userId: 'user-id',
  leadId: 'lead-id'
});
```

### Update Delivery Status
```typescript
await whatsappLoggingService.updateDeliveryStatus(
  messageId, 
  'delivered' // 'sent' | 'delivered' | 'read' | 'failed'
);
```

### Get Recent Metrics
```typescript
const metrics = await whatsappMonitoringService.getRecentMetrics(24); // last 24 hours
```

## Environment Variables

### Required
```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_TOKEN=your_token
WEBHOOK_VERIFY_TOKEN=verify_token
```

### Optional Monitoring Config
```env
MONITORING_ENABLED=true
DELIVERY_RATE_THRESHOLD=0.95
FAILURE_RATE_THRESHOLD=0.05
QUALITY_SCORE_THRESHOLD=0.90
MONITORING_INTERVAL=300000  # 5 minutes in ms
```

## Database Tables

### Primary Logging Tables
- `whatsapp_message_queue` - Message delivery tracking
- `whatsapp_logs` - Comprehensive activity logs  
- `monitoring_metrics` - Real-time metrics
- `alert_history` - Alert tracking

### Key Columns
```sql
-- Check recent messages
SELECT phone_number, template_name, status, created_at 
FROM whatsapp_message_queue 
ORDER BY created_at DESC LIMIT 10;

-- Check alert history
SELECT alert_type, severity, message, created_at
FROM alert_history 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

## Admin Console Navigation

### Quality Dashboard
`Admin Console → WhatsApp Quality Monitoring`
- Real-time metrics
- Compliance status
- Active alerts

### Logs Viewer  
`Admin Console → WhatsApp Logs`
- Message history
- Template usage
- Error analysis
- Export functions

## Alert Severity Levels

### Critical (Red)
- Delivery rate <95%
- Failure rate >5%
- API endpoint unreachable
- Webhook failures >10/hour

### Warning (Yellow)  
- Quality score <90%
- Response time >15s
- Rate limiting approaching
- Template approval pending

### Info (Blue)
- System status updates
- Scheduled maintenance
- Configuration changes
- Routine notifications

## Emergency Procedures

### System Down
1. Check WhatsApp API status
2. Verify server connectivity
3. Review error logs
4. Contact technical support

### Compliance Violation
1. Generate immediate compliance report
2. Identify root cause
3. Implement corrective action
4. Document incident
5. Report to Meta if required

### Data Loss
1. Stop all messaging immediately
2. Check database integrity  
3. Restore from backup
4. Verify monitoring functionality
5. Resume operations gradually

## Testing Commands

### Run Monitoring Tests
```bash
npm test tests/api/whatsapp-integration.test.ts
```

### Manual Health Check
```typescript
// Test all monitoring components
const health = await Promise.all([
  whatsappLoggingService.healthCheck(),
  whatsappMonitoringService.healthCheck(),
  whatsappUptimeMonitoring.healthCheck(),
  whatsappAlertService.healthCheck()
]);
```

## Performance Monitoring

### Key Performance Indicators
- Database query response time <100ms
- Memory usage <100MB per service
- CPU usage <5% during normal operation
- Disk I/O <10MB/s for logging

### Optimization Tips
1. Use database indexes on frequently queried columns
2. Implement log rotation and archival
3. Monitor memory leaks in long-running services
4. Cache frequently accessed data

## Support Contacts

### Internal Escalation
- Level 1: Admin team
- Level 2: Technical team  
- Level 3: Vendor support

### External Support
- WhatsApp Business API: business.whatsapp.com/support
- Meta Developer Support: developers.facebook.com/support
- Emergency Hotline: [Configure your emergency contact] 