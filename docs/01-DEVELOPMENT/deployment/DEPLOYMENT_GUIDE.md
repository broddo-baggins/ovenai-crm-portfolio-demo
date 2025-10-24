# 🚀 DEPLOYMENT GUIDE - OvenAI CRM System

**Purpose**: Complete deployment and environment setup guide  
**Status**: ✅ **PRODUCTION READY** - All deployment scenarios covered  
**Last Updated**: February 2, 2025

---

## 📋 **DEPLOYMENT OVERVIEW**

OvenAI CRM System supports multiple deployment scenarios with comprehensive environment protection and validation. This guide consolidates all deployment documentation and provides step-by-step procedures for production deployment.

### **🎯 Deployment Scenarios**
- **Development**: Local development environment
- **Staging**: Testing environment with production-like configuration
- **Production**: Live production deployment with full security
- **Preview**: Branch preview deployments for testing

---

## 🔧 **PREREQUISITES**

### **Required Tools**
- **Node.js**: v18+ (recommended v20)
- **npm**: v9+ or **yarn**: v1.22+
- **Git**: v2.40+
- **Vercel CLI**: Latest version
- **Supabase CLI**: Latest version (optional)

### **Required Accounts**
- **Vercel**: For hosting and deployment
- **Supabase**: For database and backend services
- **Meta Developer**: For WhatsApp Business API
- **Calendly**: For meeting integration
- **GitHub**: For repository and CI/CD

---

## 📊 **ENVIRONMENT CONFIGURATION**

### **Environment Variables Structure**

#### **Core Application**
```bash
# Application Configuration
VITE_APP_URL=https://your-domain.com
VITE_APP_NAME="OvenAI CRM"
VITE_APP_VERSION="2.1.0"

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# CRITICAL: Never expose service role key in production
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (development only)
```

#### **WhatsApp Business API**
```bash
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_BUSINESS_ID=932479825407655
WHATSAPP_APP_ID=1024037795826202
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_token
WHATSAPP_WEBHOOK_URL=https://your-domain.supabase.co/functions/v1/whatsapp-webhook
```

#### **Integration Services**
```bash
# Calendly Integration
CALENDLY_CLIENT_ID=your_calendly_client_id
CALENDLY_CLIENT_SECRET=your_calendly_client_secret
CALENDLY_REDIRECT_URI=https://your-domain.com/calendly/callback

# Additional Services
REDIS_URL=redis://localhost:6379 (if using Redis)
```

### **Environment Validation**

#### **Pre-deployment Validation**
```bash
# Validate environment configuration
npm run validate-env --env=production

# Run comprehensive health check
npm run health-check

# Verify all environment variables
npm run debug-env
```

#### **Production Safety Checks**
```bash
# Complete deployment readiness check
npm run prepare-deploy

# Validate security configuration
npm run validate-env --env=production --security-check

# Generate environment template
npm run validate-env --generate-template --env=production
```

---

## 🔄 **DEPLOYMENT PROCEDURES**

### **1. Development Environment Setup**

#### **Initial Setup**
```bash
# Clone repository
git clone https://github.com/your-org/oven-ai.git
cd oven-ai

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with development values

# Validate configuration
npm run validate-env --env=development

# Start development server
npm run dev
```

#### **Development Configuration**
```bash
# .env.local (Development)
VITE_APP_URL=http://localhost:5173
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_key  # OK in development
```

### **2. Staging Environment Deployment**

#### **Staging Setup**
```bash
# Create staging environment
npm run validate-env --env=staging

# Build for staging
npm run build:staging

# Deploy to staging
vercel --env=staging
```

#### **Staging Configuration**
```bash
# .env.staging
VITE_APP_URL=https://staging-oven-ai.vercel.app
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key
# No service role key in staging
```

### **3. Production Deployment**

#### **Production Deployment Steps**
```bash
# 1. Pre-deployment validation
npm run validate-env --env=production
npm run prepare-deploy

# 2. Build production version
npm run build:production

# 3. Run production tests
npm run test:production

# 4. Deploy to production
vercel --prod

# 5. Post-deployment verification
npm run health-check --env=production
```

#### **Production Configuration**
```bash
# Environment Variables (Set in Vercel Dashboard)
VITE_APP_URL=https://oven-ai.com
VITE_SUPABASE_URL=https://imnyrhjdoaccxenxyfam.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# WhatsApp Production
WHATSAPP_ACCESS_TOKEN=production_token
WHATSAPP_BUSINESS_ID=932479825407655

# Security: Service role key ONLY in Vercel environment variables
# NEVER in client-side code
```

---

## 🔐 **SECURITY CONFIGURATION**

### **Production Security Checklist**

#### **Environment Security**
- [ ] ✅ No service role keys in client-side code
- [ ] ✅ HTTPS-only URLs in production
- [ ] ✅ Secure webhook tokens
- [ ] ✅ Environment validation passing
- [ ] ✅ All secrets in Vercel environment variables

#### **Database Security**
- [ ] ✅ RLS policies enabled and tested
- [ ] ✅ Database backup configured
- [ ] ✅ Connection limits configured
- [ ] ✅ SSL connections enforced
- [ ] ✅ Access logs enabled

#### **API Security**
- [ ] ✅ Rate limiting configured
- [ ] ✅ Webhook signature verification
- [ ] ✅ CORS properly configured
- [ ] ✅ Error handling implemented
- [ ] ✅ API keys properly secured

### **Security Validation**
```bash
# Run security validation
npm run validate-env --env=production --security-check

# Check for exposed secrets
npm run security-scan

# Validate webhook security
curl -X GET "https://your-domain.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test"
```

---

## 📱 **SERVICE INTEGRATION SETUP**

### **WhatsApp Business API Setup**

#### **Meta Developer Console Configuration**
1. **Create WhatsApp Business App**
   - Go to Meta Developer Console
   - Create new app with WhatsApp Business product
   - Configure webhook URL: `https://your-domain.supabase.co/functions/v1/whatsapp-webhook`

2. **Webhook Configuration**
   ```bash
   # Webhook URL
   https://your-domain.supabase.co/functions/v1/whatsapp-webhook
   
   # Verify Token
   ovenai_webhook_verify_token
   
   # Subscribe to: messages, message_status
   ```

3. **Business Verification**
   - Submit business verification documents
   - Meta Business ID: 932479825407655
   - Phone number verification

#### **Template Configuration**
```bash
# Submit message templates
node scripts/meta-integration/submit-templates.mjs

# Templates ready for submission:
# - property_inquiry_confirmation
# - viewing_confirmation
# - contact_information_share
# - welcome_new_lead
# - follow_up_reminder
```

### **Calendly Integration Setup**

#### **OAuth Configuration**
1. **Calendly Developer Account**
   - Create developer account
   - Register OAuth application
   - Configure redirect URI: `https://your-domain.com/calendly/callback`

2. **Integration Testing**
   ```bash
   # Test Calendly OAuth flow
   curl -X POST "https://your-domain.supabase.co/functions/v1/calendly-webhook" \
     -H "Content-Type: application/json" \
     -d '{"event": "test"}'
   ```

### **Database Setup**

#### **Supabase Configuration**
1. **Project Setup**
   - Create production Supabase project
   - Configure database settings
   - Enable real-time subscriptions

2. **Schema Deployment**
   ```bash
   # Deploy database schema
   npx supabase db push
   
   # Run initial migrations
   npx supabase migration up
   
   # Verify schema
   npm run verify-database-schema
   ```

3. **Edge Functions Deployment**
   ```bash
   # Deploy all edge functions
   npx supabase functions deploy
   
   # Test functions
   npm run test-edge-functions
   ```

---

## 🔄 **CI/CD PIPELINE**

### **GitHub Actions Configuration**

#### **Automated Deployment Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Validate environment
        run: npm run validate-env --env=production
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Run tests
        run: npm run test:production
        
      - name: Build application
        run: npm run build:production
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### **Quality Gates**
- [ ] ✅ Environment validation passes
- [ ] ✅ All tests pass (492+ tests)
- [ ] ✅ Security scan passes
- [ ] ✅ Build succeeds
- [ ] ✅ Performance tests pass

---

## 📊 **MONITORING & HEALTH CHECKS**

### **Production Monitoring**

#### **Health Check Endpoints**
```bash
# Application health
curl https://your-domain.com/api/health

# Database health
curl https://your-domain.supabase.co/functions/v1/health-check

# WhatsApp integration health
curl https://your-domain.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test
```

#### **Performance Monitoring**
```bash
# Lighthouse performance check
npm run lighthouse-check

# Database performance
npm run db-performance-check

# API response times
npm run api-performance-check
```

### **Error Monitoring**

#### **Error Tracking Setup**
- **Application errors**: Browser console and error boundaries
- **API errors**: Edge function logs and error tracking
- **Database errors**: Supabase logs and monitoring
- **Integration errors**: WhatsApp/Calendly webhook failure tracking

#### **Alert Configuration**
- **Critical errors**: Immediate Slack/email alerts
- **Performance degradation**: Threshold-based monitoring
- **Security issues**: Real-time security alerts
- **Service downtime**: Uptime monitoring and alerts

---

## 🔧 **TROUBLESHOOTING**

### **Common Deployment Issues**

#### **Environment Variable Issues**
```bash
# Issue: Missing environment variables
# Solution: Run validation and fix missing variables
npm run validate-env --env=production
npm run debug-env

# Issue: Service role key exposed
# Solution: Remove from client code, add to Vercel environment
```

#### **Build Failures**
```bash
# Issue: Build fails with TypeScript errors
# Solution: Fix TypeScript issues and rebuild
npm run type-check
npm run build:production

# Issue: Asset optimization failures
# Solution: Run asset optimization separately
npm run optimize-assets
```

#### **Integration Failures**
```bash
# Issue: WhatsApp webhook not working
# Solution: Verify webhook configuration
curl -X GET "https://your-webhook-url?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test"

# Issue: Database connection issues
# Solution: Check database health and connectivity
npm run db-health-check
```

### **Recovery Procedures**

#### **Rollback Process**
```bash
# Rollback to previous deployment
vercel rollback

# Rollback database migration
npx supabase migration down

# Verify rollback success
npm run health-check --env=production
```

#### **Emergency Procedures**
1. **Service Degradation**: Scale down features temporarily
2. **Database Issues**: Switch to read-only mode
3. **Integration Failures**: Enable fallback mechanisms
4. **Security Breach**: Immediate credential rotation

---

## 📋 **DEPLOYMENT CHECKLIST**

### **Pre-deployment Checklist**
- [ ] ✅ Environment validation passes
- [ ] ✅ All tests pass (100% unit, 95%+ E2E)
- [ ] ✅ Security scan passes
- [ ] ✅ Performance tests meet targets
- [ ] ✅ Database migrations ready
- [ ] ✅ Integration services tested
- [ ] ✅ Backup procedures verified
- [ ] ✅ Rollback plan prepared

### **Deployment Execution**
- [ ] ✅ Deploy database changes
- [ ] ✅ Deploy edge functions
- [ ] ✅ Deploy application code
- [ ] ✅ Update environment variables
- [ ] ✅ Verify integrations
- [ ] ✅ Run smoke tests
- [ ] ✅ Monitor error rates
- [ ] ✅ Verify performance

### **Post-deployment Verification**
- [ ] ✅ Application loads correctly
- [ ] ✅ Authentication working
- [ ] ✅ Database operations functional
- [ ] ✅ WhatsApp integration operational
- [ ] ✅ Calendly integration working
- [ ] ✅ Error rates within normal range
- [ ] ✅ Performance metrics healthy
- [ ] ✅ Monitoring alerts configured

---

## 🚀 **MAINTENANCE & UPDATES**

### **Regular Maintenance**
- **Weekly**: Dependency updates and security patches
- **Monthly**: Performance optimization and monitoring review
- **Quarterly**: Security audit and compliance review
- **Annually**: Architecture review and technology updates

### **Update Procedures**
1. **Development testing**: Comprehensive testing in development
2. **Staging deployment**: Deploy to staging environment
3. **Integration testing**: Test all integrations and workflows
4. **Production deployment**: Deploy to production with monitoring
5. **Post-deployment monitoring**: Monitor for issues and performance

---

**Status**: ✅ **COMPLETE** - Comprehensive deployment guide covering all scenarios  
**Next Review**: March 1, 2025  
**Maintained By**: DevOps & Technical Team 