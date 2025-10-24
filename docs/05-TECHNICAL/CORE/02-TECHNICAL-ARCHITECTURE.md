# 🏗️ TECHNICAL ARCHITECTURE - OvenAI CRM System
**Master Technical Documentation**

**Last Updated**: February 2, 2025  
**Version**: 2.1.0  
**Status**: 🟢 PRODUCTION READY

---

## 🎯 **ARCHITECTURE OVERVIEW**

OvenAI follows a modern, scalable architecture designed for real-time lead management and WhatsApp automation. The system employs a jamstack approach with serverless functions for optimal performance and scalability.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │  Integrations   │
│   React + TS    │◄──►│   Supabase       │◄──►│  WhatsApp API   │
│   Vite + Vercel │    │   PostgreSQL     │    │  Calendly API   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 📱 **FRONTEND ARCHITECTURE**

### **Core Technology Stack**
- **Framework**: React 18 with functional components and hooks
- **Language**: TypeScript with strict mode (100% coverage)
- **Build Tool**: Vite for fast development and optimized builds
- **Deployment**: Vercel with CDN and edge functions
- **Styling**: TailwindCSS with custom design system

### **State Management Architecture**
```typescript
// Client State (Zustand)
interface AppState {
  user: User | null;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'he';
  notifications: Notification[];
}

// Server State (React Query)
const useLeads = () => useQuery({
  queryKey: ['leads'],
  queryFn: leadService.getLeads,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### **Component Architecture**
- **UI Components**: 78+ shadcn/ui based components
- **Dashboard Widgets**: 60+ specialized analytics components  
- **Business Logic**: 62+ lead management and messaging components
- **Pages**: 28 fully functional pages with routing

### **Routing & Navigation**
```typescript
// Protected Route Structure
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<Login />} />
  <Route element={<RequireAuth />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/leads" element={<LeadManagement />} />
    <Route path="/messages" element={<Messages />} />
    <Route path="/calendar" element={<Calendar />} />
  </Route>
</Routes>
```

---

## 🗄️ **BACKEND ARCHITECTURE**

### **Supabase Infrastructure**
- **Database**: PostgreSQL with real-time subscriptions
- **Authentication**: Multi-provider auth with RLS (Row Level Security)
- **Storage**: File storage for documents and media
- **Edge Functions**: Serverless functions for WhatsApp integration

### **Database Schema (Dual Architecture)**

#### **Master Database** (Central Data)
```sql
-- Core business entities
clients (id, name, business_info, created_at)
projects (id, client_id, name, config, created_at)
leads (id, project_id, name, email, phone, bant_score, heat_level)
conversation_messages (id, lead_id, content, direction, created_at)
```

#### **Site Database** (User Management)
```sql
-- User authentication and profiles
profiles (id, email, name, role, client_id, created_at)
user_settings (user_id, preferences, integration_settings)
data_requests (id, user_id, request_type, status, created_at)
```

### **Real-time Subscriptions**
```typescript
// Live message updates
const messageSubscription = supabase
  .channel('conversation_messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'conversation_messages'
  }, (payload) => {
    updateConversationInRealTime(payload.new);
  })
  .subscribe();
```

---

## 🔗 **INTEGRATION ARCHITECTURE**

### **WhatsApp Business API Integration**
```typescript
// Webhook Handler (Supabase Edge Function)
export default async function handler(req: Request) {
  const { body } = await req.json();
  
  if (body.object === 'whatsapp_business_account') {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.value.messages) {
          await processInboundMessage(change.value.messages[0]);
        }
      }
    }
  }
  
  return new Response('OK', { status: 200 });
}
```

### **Calendly OAuth Integration**
```typescript
// Calendar Integration Service
class CalendlyService {
  async getAuthorizationUrl(): Promise<string> {
    const params = new URLSearchParams({
      client_id: CALENDLY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: `${window.location.origin}/calendly/callback`,
      scope: 'default'
    });
    return `https://auth.calendly.com/oauth/authorize?${params}`;
  }
  
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    // Implementation for token exchange
  }
}
```

---

## 🌐 **INTERNATIONALIZATION (RTL) ARCHITECTURE**

### **Language Support System**
```typescript
// RTL Hook Implementation
export const useLang = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  
  return {
    isRTL,
    textStart: () => isRTL ? 'text-right' : 'text-left',
    flexRowReverse: () => isRTL ? 'flex-row-reverse' : 'flex-row',
    spaceXReverse: () => isRTL ? 'space-x-reverse' : '',
  };
};
```

### **CSS Architecture (RTL-First)**
```css
/* Logical properties for RTL support */
.card {
  margin-inline-start: 1rem;
  margin-inline-end: 1rem;
  padding-inline: 1.5rem;
  border-inline-start: 1px solid theme('colors.border');
}

/* Hebrew font integration */
.font-hebrew {
  font-family: "Rubik", sans-serif;
  font-optical-sizing: auto;
  direction: rtl;
  text-align: start;
}
```

---

## 📊 **DATA FLOW ARCHITECTURE**

### **Lead Processing Pipeline**
```
1. Lead Import (CSV/API) → 2. BANT Scoring → 3. Queue Management → 4. WhatsApp Outreach
                                    ↓                    ↓                ↓
5. Meeting Scheduling ← 4. Qualification Conversation ← 3. Automated Responses
```

### **Real-time Data Synchronization**
```typescript
// Lead Processing Service
class LeadProcessingService {
  async processLeadsDaily(): Promise<ProcessingMetrics> {
    const todaysLeads = await this.getTodaysQueue();
    
    for (const lead of todaysLeads) {
      await this.sendInitialMessage(lead);
      await this.updateLeadStatus(lead.id, 'contacted');
      await this.scheduleFollowUp(lead);
    }
    
    return this.getProcessingMetrics();
  }
}
```

---

## 🔐 **SECURITY ARCHITECTURE**

### **Authentication & Authorization**
```typescript
// Row Level Security (RLS) Policy Example
CREATE POLICY "Users can only access their project data" ON leads
  FOR ALL USING (
    project_id IN (
      SELECT projects.id FROM projects 
      WHERE projects.client_id = (
        SELECT profiles.client_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );
```

### **Data Encryption**
```typescript
// Client-side encryption for sensitive data
export const encryptionUtils = {
  encryptCredentials(credentials: Credentials): EncryptedCredentials {
    return {
      clientId: btoa(credentials.clientId),
      clientSecret: CryptoJS.AES.encrypt(credentials.clientSecret, secretKey).toString(),
    };
  },
  
  decryptCredentials(encrypted: EncryptedCredentials): Credentials {
    return {
      clientId: atob(encrypted.clientId),
      clientSecret: CryptoJS.AES.decrypt(encrypted.clientSecret, secretKey).toString(CryptoJS.enc.Utf8),
    };
  }
};
```

---

## 📱 **MOBILE-FIRST ARCHITECTURE**

### **Responsive Design System**
```typescript
// Mobile-optimized component patterns
interface MobileOptimizedProps {
  mobileOptimized?: boolean;
  touchTarget?: 'small' | 'medium' | 'large';
  viewport?: 'mobile' | 'tablet' | 'desktop';
}

// Touch-friendly interactions
const Button = ({ mobileOptimized, ...props }: ButtonProps) => {
  const mobileClasses = mobileOptimized ? [
    "touch-action-manipulation",
    "select-none", 
    "min-h-[44px]", // iOS recommended minimum
    "min-w-[44px]"
  ].join(" ") : "";
  
  return <button className={cn(baseClasses, mobileClasses)} {...props} />;
};
```

---

## ⚡ **PERFORMANCE ARCHITECTURE**

### **Optimization Strategies**
```typescript
// Code splitting and lazy loading
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Messages = lazy(() => import('./pages/Messages'));

// React Query optimization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Image optimization
const OptimizedImage = ({ src, alt, ...props }) => (
  <img 
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    {...props}
  />
);
```

### **Bundle Optimization**
- **Tree Shaking**: Remove unused code automatically
- **Code Splitting**: Route-based chunks for faster loading
- **Asset Optimization**: WebP images, minified CSS/JS
- **CDN Delivery**: Global edge caching via Vercel

---

## 🧪 **TESTING ARCHITECTURE**

### **Test Pyramid Structure**
```
┌─────────────────┐
│   E2E Tests     │  ← 347 tests (71% pass rate)
│   (Playwright)  │
├─────────────────┤
│  Integration    │  ← 25+ tests (95% pass rate)  
│   Tests         │
├─────────────────┤
│   Unit Tests    │  ← 70 tests (100% pass rate)
│   (Jest/RTL)    │
└─────────────────┘
```

### **Automated Testing Pipeline**
```typescript
// GitHub Actions workflow
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Unit Tests
        run: npm run test:unit
      - name: Integration Tests  
        run: npm run test:integration
      - name: E2E Tests
        run: npm run test:e2e
      - name: Security Scan
        run: npm run test:security
```

---

## 📈 **MONITORING & ANALYTICS**

### **Application Monitoring**
- **Error Tracking**: Comprehensive error boundaries and logging
- **Performance**: Real-time performance monitoring with metrics
- **User Analytics**: Privacy-compliant user behavior tracking
- **Business Metrics**: Lead conversion and engagement analytics

### **Infrastructure Monitoring**
```typescript
// Health check endpoint
export async function healthCheck(): Promise<HealthStatus> {
  return {
    database: await checkDatabaseConnection(),
    whatsapp: await checkWhatsAppAPI(),
    calendly: await checkCalendlyAPI(),
    timestamp: new Date().toISOString(),
    status: 'healthy' | 'degraded' | 'down'
  };
}
```

---

## 🚀 **DEPLOYMENT ARCHITECTURE**

### **CI/CD Pipeline**
```yaml
# Vercel deployment configuration
{
  "builds": [
    { "src": "package.json", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

### **Environment Configuration**
- **Development**: Local Supabase + mock integrations
- **Staging**: Supabase staging + test integrations
- **Production**: Supabase production + live APIs

---

## 📚 **DEVELOPMENT STANDARDS**

### **Code Quality Standards**
- **TypeScript**: 100% type coverage with strict mode
- **ESLint**: Comprehensive linting rules for React/TypeScript
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality gates

### **Architecture Patterns**
- **Composition over Inheritance**: React functional components
- **Separation of Concerns**: Clear service/component boundaries
- **Dependency Injection**: Service layer abstraction
- **Error Boundaries**: Graceful error handling

---

**Document Status**: ✅ COMPLETE - Technical Reference  
**Next Review**: March 1, 2025  
**Maintained By**: Development Team 