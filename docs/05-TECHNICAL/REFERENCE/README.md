# 📖 REFERENCE Documentation

**Purpose**: Architectural references, diagrams, and system knowledge base  
**Status**: ✅ **COMPREHENSIVE** - Complete reference materials available  
**Last Updated**: February 2, 2025

---

## 📁 **REFERENCE DOCUMENTS (4)**

### **📁 folder-structure.md** ✅ **PROJECT ORGANIZATION**
**Lines**: 217 | **Purpose**: Complete project structure documentation
**Key Sections**:
- **Project Structure**: 200+ folders and files organized by domain
- **Component Organization**: Feature-based architecture patterns
- **State Management**: Contexts, stores, hooks, and services
- **Architecture Patterns**: Layer separation and utility-first design
- **Core Files**: Application entry points and configuration
- **Development Workflow**: Build validation and environment management

**Use When**: Project onboarding, understanding codebase organization, architectural decisions

### **📊 diagrams.md** ✅ **VISUAL ARCHITECTURE**
**Lines**: 238 | **Purpose**: Mermaid diagrams for system architecture
**Key Sections**:
- **Database ERD**: Complete entity relationship diagrams
- **Table Relationships**: Visual representation of foreign keys
- **Data Flow Diagrams**: System integration patterns
- **Component Relationships**: Frontend/backend connections
- **User Flow Diagrams**: Business process visualization

**Use When**: System visualization, stakeholder presentations, architectural planning

### **🏗️ architecture.md** ✅ **SYSTEM OVERVIEW**
**Lines**: 63 | **Purpose**: High-level system architecture overview
**Key Sections**:
- **System Components**: WhatsApp API, n8n, Redis, Supabase, Web Dashboard
- **Data Flow**: Standard lead processing pipeline
- **Key Data Stores**: Redis cache layer and Supabase primary database
- **Conversation Flow**: Message processing and state management
- **Security & Authentication**: Multi-layer security implementation
- **Deployment Architecture**: Cloud-ready scalable design

**Use When**: High-level system understanding, architectural discussions, new team member orientation

### **💡 kb.md** ✅ **KNOWLEDGE BASE**
**Lines**: 127 | **Purpose**: Technical knowledge base and troubleshooting
**Key Sections**:
- **Tech Stack Overview**: Component purposes and integration advantages
- **Environment Setup**: Required variables and local development
- **Scheduled Jobs**: Automated tasks and maintenance
- **Security Protocols**: Authentication flow and data protection
- **Troubleshooting**: Common issues and monitoring solutions

**Use When**: Technical troubleshooting, environment setup, operational procedures

---

## 🎯 **NAVIGATION BY PURPOSE**

### **For System Understanding**
1. **Start Here**: `architecture.md` - High-level system overview
2. **Visual**: `diagrams.md` - See the system architecture visually
3. **Structure**: `folder-structure.md` - Understand code organization
4. **Details**: `kb.md` - Deep technical knowledge

### **For New Developers**
1. **Architecture**: `architecture.md` - Understand the system design
2. **Code Organization**: `folder-structure.md` - Navigate the codebase
3. **Setup**: `kb.md` - Environment configuration and setup
4. **Visual Aid**: `diagrams.md` - See how components connect

### **For Architects & Leads**
1. **System Design**: `architecture.md` - Overall architecture patterns
2. **Visual Documentation**: `diagrams.md` - Presentation-ready diagrams
3. **Code Standards**: `folder-structure.md` - Organizational principles
4. **Technical Decisions**: `kb.md` - Implementation rationale

### **For Troubleshooting**
1. **Issues**: `kb.md` - Common problems and solutions
2. **Data Flow**: `diagrams.md` - Trace data through the system
3. **Component Location**: `folder-structure.md` - Find relevant code
4. **System Health**: `architecture.md` - Check component status

---

## 🏗️ **SYSTEM ARCHITECTURE REFERENCE**

### **Core Components**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WhatsApp®     │────│     n8n          │────│     Redis       │
│   Business API  │    │   Workflows      │    │     Cache       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Supabase      │────│  Web Dashboard   │────│   Lead System   │
│   Database      │    │    (React)       │    │   Processing    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Data Flow Pattern**
```
Lead Message → WhatsApp API → n8n → Redis → Supabase → Dashboard
```

### **Technology Stack Summary**
| Component | Technology | Purpose | Status |
|-----------|------------|---------|---------|
| **Database** | Supabase + PostgreSQL | Primary data storage | ✅ Operational |
| **Cache** | Redis | Session state & conversation tracking | ✅ Operational |
| **Automation** | n8n | Workflow orchestration | ✅ Operational |
| **Messaging** | WhatsApp Business API | Customer communication | ✅ Production Ready |
| **Web App** | React + TypeScript | Lead management dashboard | ✅ Production Ready |
| **Hosting** | Railway/Render | Application deployment | ✅ Auto-deploy |

---

## 📊 **PROJECT STRUCTURE REFERENCE**

### **Key Directories**
```
oven-ai/
├── src/                      # Main application source
│   ├── components/           # React components (200+)
│   ├── services/             # API service layer (41 files)
│   ├── pages/                # Route-level components (40 files)
│   ├── hooks/                # Custom React hooks (15 files)
│   └── types/                # TypeScript definitions (12 files)
├── docs/                     # Documentation (organized)
├── scripts/                  # Development utilities
├── supabase/                 # Database configuration
└── tests/                    # Testing infrastructure
```

### **Component Organization Principles**
- **Feature-based**: Components grouped by business domain
- **Layer separation**: Clear separation of concerns (UI, logic, data)
- **Utility-first**: Reusable utilities and helper functions
- **Type safety**: Comprehensive TypeScript coverage

---

## 🔧 **DEVELOPMENT REFERENCE**

### **Core Configuration Files**
- `src/main.tsx`: Application entry point
- `src/App.tsx`: Main application component
- `vite.config.ts`: Build configuration
- `tailwind.config.ts`: Styling configuration
- `playwright.config.ts`: E2E testing configuration

### **Build & Validation**
```bash
npm run jsx-validator     # Validate JSX structure
npm run pre-commit       # Full pre-commit validation
npm run build           # Production build
npm run test           # Run test suite
```

### **Environment Management**
```bash
npm run validate-env    # Validate environment variables
npm run dev            # Development server
npm run preview        # Preview production build
```

---

## 🗄️ **DATABASE REFERENCE**

### **Schema Overview (from diagrams.md)**
- **Core Tables**: clients, projects, leads, conversations, messages
- **Relationships**: Comprehensive foreign key structure
- **Security**: Row Level Security (RLS) for multi-tenant access
- **Performance**: Strategic indexing and optimization

### **Key Relationships**
```
clients ← projects ← leads ← conversations ← messages
    ↓       ↓         ↓         ↓           ↓
  users   users     users    agents      AI interactions
```

---

## 🔍 **TROUBLESHOOTING REFERENCE**

### **Common Issues (from kb.md)**

#### **Redis Connection Fails**
- Check REDIS_URL format
- Verify network connectivity
- Review connection pooling settings

#### **WhatsApp Webhooks Not Working**
- Verify webhook URL configuration
- Check n8n workflow activation
- Validate signature verification

#### **Authentication Errors**
- Verify JWT_SECRET matches across services
- Check Supabase project configuration
- Review RLS policy implementation

### **Monitoring Tools**
- Application logs via structured logging
- Redis monitoring through built-in commands
- Supabase dashboard for database metrics
- Real-time error tracking and alerting

---

## 📈 **PERFORMANCE REFERENCE**

### **Architecture Benefits**
- **Scalability**: Feature-based organization supports growth
- **Maintainability**: Clear separation of concerns
- **Type Safety**: Comprehensive TypeScript coverage
- **Testing**: 492+ tests with multiple test types
- **Developer Experience**: Rich tooling and validation
- **Documentation**: Extensive guides and best practices

### **Optimization Patterns**
- **Code Splitting**: Route-based chunks for faster loading
- **Lazy Loading**: Components loaded on demand
- **Caching**: Redis for high-speed data access
- **Connection Pooling**: Efficient database connections
- **Asset Optimization**: WebP images, minified CSS/JS

---

## 🚀 **QUICK REFERENCE ACTIONS**

### **For System Overview**
- **High Level**: Read `architecture.md` system components section
- **Visual Understanding**: Review `diagrams.md` ERD and data flow
- **Code Navigation**: Check `folder-structure.md` directory structure
- **Technical Details**: Reference `kb.md` tech stack section

### **For Development Setup**
- **Environment**: Follow `kb.md` local development setup
- **Project Structure**: Study `folder-structure.md` organization
- **Build Process**: Reference development workflow section
- **Architecture**: Understand patterns from `architecture.md`

### **For Troubleshooting**
- **Common Issues**: Check `kb.md` troubleshooting section
- **Data Flow**: Trace through `diagrams.md` visual flows
- **Component Location**: Use `folder-structure.md` to find code
- **System Status**: Verify `architecture.md` component health

### **For Documentation**
- **Diagrams**: Use `diagrams.md` for presentations
- **Architecture**: Reference `architecture.md` for high-level docs
- **Code Examples**: Find patterns in `folder-structure.md`
- **Technical Specs**: Detail from `kb.md` knowledge base

---

## 📋 **MAINTENANCE NOTES**

### **Document Updates**
1. **Architecture Changes**: Update `architecture.md` first
2. **New Diagrams**: Add to `diagrams.md` with proper Mermaid syntax
3. **Structure Changes**: Update `folder-structure.md` organization
4. **Knowledge Updates**: Add troubleshooting to `kb.md`

### **Reference Quality**
- **Diagrams**: Keep visual documentation current
- **Structure**: Maintain accurate folder organization
- **Knowledge**: Update troubleshooting with new solutions
- **Architecture**: Reflect current system state

---

**Navigation**: [← API Integrations](../API_INTEGRATIONS/README.md) | [Technical Docs Home](../README.md) | [Reports →](../REPORTS/README.md)  
**Status**: ✅ **COMPREHENSIVE** - Complete reference materials available  
**Maintained By**: Technical Documentation Team 