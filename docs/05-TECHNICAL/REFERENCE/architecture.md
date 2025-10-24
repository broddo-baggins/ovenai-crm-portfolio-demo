# Architecture Overview

## System Components

The Lead-Reviver system consists of four main components:

- **WhatsApp Business API**: Primary communication channel for customer interactions
- **n8n**: Workflow automation handling message processing and lead progression
- **Redis**: High-speed cache for conversation state and session management
- **Supabase**: Primary database storage and application backend
- **Web Dashboard**: React-based user interface for lead management and analytics

## Data Flow

### Standard Lead Processing Flow

```
WhatsApp → n8n workflows → Redis (state) → Supabase (storage) → Dashboard (display)
```

### Key Data Stores

1. **Redis (Cache Layer)**
   - Conversation state and session data
   - Real-time lead status updates
   - Message history and context

2. **Supabase (Primary Database)**: Lead records, user management, and application data

## Conversation Flow

1. Lead sends WhatsApp message
2. n8n webhook receives message and processes through workflow
3. LLM processes message context and generates response
4. Response sent back through WhatsApp API
5. Lead state updated in Redis cache
6. Conversation metrics updated in Redis and synced to Supabase

## Security & Authentication

### Storage Security
1. **Redis**: Session tokens, no persistent sensitive data
2. **Supabase**: Row Level Security (RLS) for data access control
3. **n8n**: Workflow credentials stored in encrypted vault
4. **Dashboard**: JWT tokens with role-based access control

### API Security
1. **WhatsApp**: Webhook signature verification
2. **n8n → Redis**: Internal network, Redis AUTH
3. **n8n → Supabase**: Service role key with limited permissions
4. **Dashboard → Supabase**: User authentication with RLS policies

## Deployment Architecture

The system is designed for scalable cloud deployment with the following characteristics:

- **Stateless Components**: n8n workflows and dashboard can be horizontally scaled
- **Managed Services**: Utilizing Supabase, Redis Cloud, and WhatsApp Business API
- **Container Ready**: All custom components containerized for easy deployment
- **Environment Separation**: Clear separation between development, staging, and production

This architecture ensures high availability, scalability, and maintainability while keeping operational complexity manageable.
