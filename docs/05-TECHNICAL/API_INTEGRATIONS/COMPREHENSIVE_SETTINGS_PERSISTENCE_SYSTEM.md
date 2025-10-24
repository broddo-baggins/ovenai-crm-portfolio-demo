# Comprehensive Settings Persistence System

## Overview

The OvenAI Comprehensive Settings Persistence System provides a complete infrastructure for storing and managing user preferences, dashboard configurations, notifications, and application state. This system is specifically designed for BANT/HEAT lead qualification workflows and includes Calendly integration support.

## Architecture

### Database Schema (5 Core Tables)

#### 1. `user_dashboard_settings`

**Purpose**: Project-specific dashboard configurations and widget preferences

```sql
CREATE TABLE user_dashboard_settings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    client_id UUID REFERENCES clients(id),
    project_id UUID REFERENCES projects(id),
    widget_visibility JSONB,  -- Widget show/hide states
    widget_layout JSONB,      -- Grid positions and sizes
    dashboard_preferences JSONB  -- View modes, refresh rates
);
```

**Key Features**:

- Project-specific settings (different layouts per project)
- Widget visibility control for all dashboard components
- Layout persistence (positions, sizes, collapsed states)
- Auto-refresh preferences and view modes

#### 2. `user_notification_settings`

**Purpose**: Email, push, and SMS notification preferences with scheduling

```sql
CREATE TABLE user_notification_settings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    email_notifications JSONB,    -- BANT qualification alerts
    push_notifications JSONB,     -- Real-time lead updates
    sms_notifications JSONB,      -- Urgent meeting reminders
    notification_schedule JSONB   -- Working hours, quiet times
);
```

**BANT/HEAT Specific Notifications**:

- Lead temperature changes (cold→warm→hot→burning)
- BANT qualification completions
- Calendly booking confirmations
- Meeting scheduling alerts
- Heat progression milestones

#### 3. `user_app_preferences`

**Purpose**: Global application preferences and integration settings

```sql
CREATE TABLE user_app_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    interface_settings JSONB,     -- Theme, language, RTL
    data_preferences JSONB,       -- Date formats, currency
    feature_preferences JSONB,    -- Beta features, debug mode
    integration_settings JSONB    -- Calendly, WhatsApp, email
);
```

**Integration Support**:

- **Calendly**: OAuth tokens, auto-sync preferences, booking defaults
- **WhatsApp**: Message sync, template preferences
- **Email**: Provider settings, signature templates

#### 4. `user_session_state`

**Purpose**: Temporary UI state that persists across browser sessions

```sql
CREATE TABLE user_session_state (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    current_context JSONB,       -- Selected project, filters
    ui_state JSONB,              -- Open panels, view modes
    expires_at TIMESTAMPTZ       -- Auto-cleanup after 7 days
);
```

#### 5. `notifications`

**Purpose**: Real-time notification system for BANT/HEAT alerts

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT,
    message TEXT,
    type VARCHAR(50),            -- success, info, warning, error
    read BOOLEAN DEFAULT false,
    action_url TEXT,             -- Deep links to specific pages
    metadata JSONB               -- BANT category, priority, lead_id
);
```

## Service Layer (`userSettingsService.ts`)

### Core Methods

```typescript
// Dashboard Settings
await userSettingsService.getDashboardSettings(projectId);
await userSettingsService.updateDashboardSettings(settings, projectId);

// Notifications
await userSettingsService.getNotificationSettings();
await userSettingsService.updateNotificationSettings(settings);

// App Preferences
await userSettingsService.getAppPreferences();
await userSettingsService.updateAppPreferences(preferences);

// Session State
await userSettingsService.getSessionState(sessionId);
await userSettingsService.updateSessionState(state, sessionId);
```

### BANT/HEAT Integration Examples

```typescript
// Update lead qualification notification preferences
await userSettingsService.updateNotificationSettings({
  email_notifications: {
    bantQualifications: true,
    heatProgressions: true,
    calendlyBookings: true,
    meetingReminders: true,
  },
});

// Configure Calendly integration
await userSettingsService.updateAppPreferences({
  integration_settings: {
    calendly: {
      enabled: true,
      autoSync: true,
      defaultMeetingType: "BANT_qualification",
      bookingNotifications: true,
    },
  },
});
```

## Database Setup Scripts

### Primary Script: `create-comprehensive-user-settings-safe.sql`

**Safety Features**:

- `CREATE TABLE IF NOT EXISTS` - No conflicts with existing tables
- `DROP POLICY IF EXISTS` - Handles existing RLS policies gracefully
- Comprehensive error handling with `DO $$ BEGIN ... EXCEPTION` blocks
- Automatic cleanup functions for expired sessions

**Performance Optimizations**:

- Strategic indexes on user_id, project_id, session_id
- JSONB GIN indexes for complex queries
- Automatic `updated_at` triggers for all tables

**Security Features**:

- Row Level Security (RLS) enabled on all tables
- User-specific policies (`auth.uid() = user_id`)
- Cascade deletes for data cleanup
- Session expiration with automatic cleanup

### Installation Instructions

1. **Copy the script**:

```bash
cat scripts/database/setup/create-comprehensive-user-settings-safe.sql
```

2. **Run in Supabase SQL Editor**:
   - Navigate to Supabase Dashboard → SQL Editor
   - Paste the entire script
   - Execute (handles all safety checks automatically)

3. **Verify Installation**:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'user_%';

-- Verify RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename LIKE 'user_%';
```

## Integration Patterns

### Dashboard Widget Integration

```typescript
// Component integration example
const DashboardWidget = ({ projectId }) => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      const dashboardSettings =
        await userSettingsService.getDashboardSettings(projectId);
      setSettings(dashboardSettings);
    }
    loadSettings();
  }, [projectId]);

  const toggleWidget = async (widgetName) => {
    const updated = {
      ...settings,
      widget_visibility: {
        ...settings.widget_visibility,
        [widgetName]: !settings.widget_visibility[widgetName],
      },
    };

    await userSettingsService.updateDashboardSettings(updated, projectId);
    setSettings(updated);
  };
};
```

### Notification System Integration

```typescript
// Create BANT qualification notification
await userSettingsService.createNotification({
  title: "BANT Qualification Complete",
  message: `Lead ${leadName} has completed BANT qualification and is ready for meeting scheduling.`,
  type: "success",
  action_url: `/leads/${leadId}`,
  metadata: {
    category: "bant_qualification",
    priority: "high",
    lead_id: leadId,
    heat_level: "hot",
  },
});
```

## Data Flow Architecture

```
User Action → Component → Service Layer → Database → Cache Update → UI Update
```

1. **User Action**: Widget toggle, preference change, notification read
2. **Component**: React component with settings hooks
3. **Service Layer**: `userSettingsService` with error handling
4. **Database**: Supabase with RLS policies
5. **Cache Update**: Local state management
6. **UI Update**: Immediate visual feedback

## Default Configurations

### Dashboard Settings Defaults

```json
{
  "widget_visibility": {
    "metrics": true,
    "monthlyPerformance": true,
    "leadsConversions": true,
    "revenueChannel": true,
    "pieCharts": true,
    "recentActivity": true,
    "insights": true,
    "performanceTargets": true
  },
  "dashboard_preferences": {
    "defaultView": "enhanced",
    "autoRefresh": true,
    "refreshInterval": 300000,
    "compactMode": false
  }
}
```

### Notification Settings Defaults

```json
{
  "email_notifications": {
    "leadUpdates": true,
    "meetingReminders": true,
    "bantQualifications": true,
    "calendlyBookings": true,
    "heatProgressions": true
  },
  "notification_schedule": {
    "workingHours": { "start": "09:00", "end": "18:00" },
    "timezone": "UTC",
    "quietHours": { "enabled": true, "start": "22:00", "end": "08:00" }
  }
}
```

## Error Handling & Fallbacks

### Graceful Degradation

```typescript
// Service with fallbacks
async getDashboardSettings(projectId) {
  try {
    const settings = await this.fetchFromDatabase(projectId);
    return settings || this.getDefaultSettings();
  } catch (error) {
    console.error('Settings fetch failed:', error);
    return this.getDefaultSettings(); // Always functional
  }
}
```

### Database Connection Issues

- Service returns default configurations
- UI remains functional with standard layouts
- Background sync retries when connection restored
- User changes cached locally until sync possible

## Performance Considerations

### Caching Strategy

- Settings cached in component state
- Project-specific caching (different settings per project)
- Session state cached for duration of session
- Background updates don't block UI

### Database Optimization

- Indexed queries for fast retrieval
- JSONB for flexible schema evolution
- Batch updates for multiple preference changes
- Automatic cleanup of expired session data

## Security Model

### Row Level Security (RLS)

- Users can only access their own settings
- Project-specific settings require project membership
- Session state isolated per user
- Notification access restricted to recipient

### Data Privacy

- No sensitive data in metadata fields
- Integration tokens encrypted at rest
- Session cleanup prevents data leakage
- Audit trail for preference changes

## Migration & Maintenance

### Schema Evolution

- JSONB fields support adding new preferences
- Backward compatibility maintained
- Default values for new fields
- Gradual rollout of new features

### Maintenance Tasks

```sql
-- Cleanup expired sessions (run daily)
SELECT cleanup_expired_sessions();

-- Analyze table statistics (run weekly)
ANALYZE user_dashboard_settings, user_notification_settings,
        user_app_preferences, user_session_state, notifications;
```

## Future Enhancements

### Planned Features

- **Team Settings**: Shared configurations for team workspaces
- **Settings Templates**: Pre-configured setups for different roles
- **Advanced Notifications**: Smart scheduling based on lead activity
- **Integration Marketplace**: Easy setup for new integrations
- **Settings Backup**: Export/import configurations
- **A/B Testing**: Different dashboard layouts for optimization

### Calendly V2 API Migration

**⚠️ Important**: [Calendly V1 API will be deprecated on August 27, 2025](https://developer.calendly.com/api-docs/d7755e2f9e5fe-calendly-api). Current integration uses V2 API patterns for future compatibility.

This system provides a comprehensive foundation for user preference management while maintaining flexibility for future BANT/HEAT workflow enhancements and integration requirements.
