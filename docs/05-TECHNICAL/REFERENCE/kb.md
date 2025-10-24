# Lead-Reviver Knowledge Base

## System Overview

Lead-Reviver is a WhatsApp-first CRM designed to revive cold property leads and book meetings. The system automates lead engagement through intelligent conversation flows.

### Tech Stack

|Component|Technology|Purpose|Notes|
|---------|----------|-------|-----|
|**Database**|Supabase + PostgreSQL|Primary data storage|Auth, RLS, real-time subscriptions|
|**Cache**|Redis|Session state & conversation tracking|High-speed key-value store|
|**Automation**|n8n|Workflow orchestration|Self-hosted workflow engine|
|**Messaging**|WhatsApp Business API|Customer communication|Primary channel for lead interaction|
|**Web App**|React + TypeScript|Lead management dashboard|SPA with modern UI components|
|**Hosting**|Railway/Render|Application deployment|Auto-deploy from Git|

### Integration Advantages

|Integration Type|Business Value|Technical Challenge|Solution|
|---------------|-------------|-------------------|--------|
|**Database**|Unified data view|Complex schema design|Supabase RLS, migrations|
|**Real-time**|Live updates|State synchronization|WebSockets, Redis pub/sub|
|**No-Code Builder**|Add new project fast|Credentials sprawl|ENV map, Supabase presets|
|**WhatsApp API**|Customer preferred channel|Rate limits, webhook reliability|Queue management, retry logic|

## System Architecture

### Data Flow

```
Lead Message → WhatsApp API → n8n → Redis → Supabase → Dashboard
```

### Key Components

1. **Redis Cache**: Fast session storage
2. **Supabase**: Primary database with real-time features
3. **n8n Workflows**: Automated message processing
4. **WhatsApp API**: Customer communication channel

## Environment Setup

### Required Variables

The application requires several environment variables for proper operation:

#### Database Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Public API key
- `SUPABASE_SERVICE_ROLE_KEY`: Admin API key

#### Redis Configuration
- `REDIS_URL`: Redis connection string

#### Authentication
- `JWT_SECRET`: Token signing secret
- `GOOGLE_CLIENT_ID`: OAuth client ID
- `GOOGLE_CLIENT_SECRET`: OAuth secret

#### External Services
- `N8N_BASE_URL`: n8n instance URL

### Scheduled Jobs

|Job|Frequency|Purpose|
|---|---------|-------|
|syncLeadData|Hourly|Sync lead updates from Redis to Supabase|
|cleanupSessions|Daily|Remove expired conversation sessions|
|generateReports|Daily|Create performance analytics|

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# fill SUPABASE_URL, SUPABASE_ANON_KEY, REDIS_URL

# Start services
docker-compose up -d

# Run migrations
npx supabase db reset

# Start application
npm run dev
```

## Security

### Authentication Flow
1. User enters credentials
2. Supabase validates and returns JWT
3. JWT stored in secure HTTP-only cookie
4. All API requests include JWT in Authorization header

### Data Protection
- Row Level Security (RLS) in Supabase
- Environment variables for secrets
- Secure credential storage in n8n

## Troubleshooting

### Common Issues

1. **Redis Connection Fails**
   - Check REDIS_URL format
   - Verify network connectivity

2. **WhatsApp Webhooks Not Working**
   - Verify webhook URL configuration
   - Check n8n workflow activation

3. **Authentication Errors**
   - Verify JWT_SECRET matches across services
   - Check Supabase project configuration

### Monitoring

- Application logs via structured logging
- Redis monitoring through built-in commands
- Supabase dashboard for database metrics
