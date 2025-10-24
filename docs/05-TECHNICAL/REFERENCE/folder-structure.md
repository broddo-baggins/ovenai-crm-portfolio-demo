# OvenAI CRM Folder Structure

This document explains the project's file organization and architecture.

## Project Structure

```
oven-ai/
├── docs/                     # Documentation files
│   ├── bugs/                 # Bug tracking and resolution
│   ├── guides/               # Development and implementation guides
│   ├── database/             # Database documentation
│   ├── planning/             # Project planning documents
│   ├── reports/              # Analysis and test reports
│   └── archive/              # Archived documentation
│
├── packages/                 # Monorepo packages
│   ├── server/               # Backend API server
│   │   ├── prisma/           # Database schema and migrations
│   │   ├── scripts/          # Server utility scripts
│   │   └── src/              # Server source code
│   └── web/                  # Frontend web application (legacy)
│
├── scripts/                  # Development and utility scripts
│   ├── database-setup/       # Database initialization scripts
│   ├── database-fixes/       # Database migration and fix scripts
│   ├── utilities/            # General utility scripts
│   └── jsx-validator.js      # JSX structure validation tool
│
├── src/                      # Main frontend source code
│   ├── api/                  # API integration layer
│   │   └── whatsapp/         # WhatsApp API endpoints
│   │
│   ├── assets/               # Static assets
│   │   ├── fonts/            # Custom fonts
│   │   ├── icons/            # Icon assets
│   │   └── images/           # Image assets
│   │
│   ├── components/           # React components
│   │   ├── auth/             # Authentication components
│   │   ├── charts/           # Chart and analytics components
│   │   ├── clients/          # Client management components
│   │   ├── common/           # Shared common components
│   │   ├── dashboard/        # Dashboard widgets and components
│   │   ├── debug/            # Development and debug components
│   │   ├── demo/             # Demo and preview components
│   │   ├── drag-drop/        # Drag and drop functionality
│   │   ├── forms/            # Form components and validation
│   │   ├── icons/            # Icon components
│   │   ├── kanban/           # Kanban board components
│   │   ├── landing/          # Landing page components
│   │   ├── layout/           # Layout and navigation components
│   │   ├── leads/            # Lead management components
│   │   ├── mobile/           # Mobile-specific components
│   │   ├── notifications/    # Notification system components
│   │   ├── projects/         # Project management components
│   │   ├── reports/          # Reporting and analytics components
│   │   ├── shared/           # Shared utility components
│   │   ├── tables/           # Data table components
│   │   ├── ui/               # UI component library (shadcn/ui)
│   │   └── whatsapp/         # WhatsApp integration components
│   │
│   ├── config/               # Application configuration
│   ├── constants/            # Constants and enumerations
│   ├── context/              # React context providers (legacy)
│   ├── contexts/             # React context providers (current)
│   ├── data/                 # Static data and mock data
│   │   └── conversations/    # Sample conversation data
│   ├── features/             # Feature-based component organization
│   │   └── auth/             # Authentication feature module
│   ├── hooks/                # Custom React hooks
│   ├── integrations/         # Third-party integrations
│   │   └── supabase/         # Supabase client and utilities
│   ├── lib/                  # Core utilities and libraries
│   ├── pages/                # Route-level components
│   ├── services/             # API service layer
│   │   └── base/             # Base service configurations
│   ├── stores/               # State management (Zustand)
│   ├── styles/               # Global styles and themes
│   ├── test/                 # Test utilities and helpers
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
│
├── supabase/                 # Supabase configuration
│   ├── config/               # Supabase configuration files
│   ├── functions/            # Supabase Edge Functions
│   │   ├── create-admin-user/
│   │   ├── lead-management/
│   │   ├── password-reset/
│   │   ├── user-management/
│   │   └── whatsapp-webhook/
│   ├── migrations/           # Database migrations
│   ├── scripts/              # Database scripts
│   │   ├── setup/
│   │   ├── maintenance/
│   │   └── testing/
│   └── sql/                  # SQL scripts and queries
│
├── testing/                  # Test files and configuration
│   ├── e2e/                  # End-to-end tests
│   ├── integration/          # Integration tests
│   ├── unit/                 # Unit tests
│   └── visual/               # Visual regression tests
│
├── functions/                # Serverless functions (Vercel)
│   └── api/                  # API endpoints
│
├── debug-tools/              # Development debugging tools
├── backups/                  # Database and configuration backups
├── credentials/              # Credential management
└── migrations_backup/        # Migration history backups
```

## Key Code Organization Principles

### 1. Component Organization

Components are organized by:
- **Feature**: Authentication, dashboard, leads, projects
- **Scope**: UI (reusable) vs. domain-specific components
- **Layout**: Components that define the application structure
- **Functionality**: Charts, forms, tables, notifications

### 2. State Management

- **Contexts**: Application-wide state (authentication, theme, i18n)
- **Stores**: Zustand stores for complex state management
- **Hooks**: Reusable state logic and API interactions
- **Services**: API interaction and data fetching layer

### 3. Architecture Patterns

- **Feature-based**: Components grouped by business domain
- **Layer separation**: Clear separation of concerns (UI, logic, data)
- **Utility-first**: Reusable utilities and helper functions
- **Type safety**: Comprehensive TypeScript coverage

## Core Files

### Application Entry

- `src/main.tsx`: Application entry point
- `src/App.tsx`: Main application component
- `src/index.css`: Global styles and Tailwind imports
- `index.html`: HTML template

### Authentication & Security

- `src/contexts/ClientAuthContext.tsx`: Authentication context provider
- `src/hooks/useSupabaseAuth.ts`: Supabase authentication hook
- `src/components/auth/LoginForm.tsx`: Main login component
- `src/features/auth/`: Feature-based auth organization

### API Integration

- `src/integrations/supabase/client.ts`: Supabase client configuration
- `src/services/`: API service layer
- `src/api/whatsapp/`: WhatsApp API integration
- `supabase/functions/`: Serverless edge functions

### Application Layout

- `src/components/layout/Layout.tsx`: Main application layout
- `src/components/layout/Sidebar.tsx`: Navigation sidebar
- `src/components/layout/TopBar.tsx`: Top navigation bar
- `src/components/theme-provider.tsx`: Theme management

### Configuration & Setup

- `src/config/`: Centralized configuration
- `src/lib/`: Core utilities and setup
- `vite.config.ts`: Build configuration
- `tailwind.config.ts`: Styling configuration

### Development Tools

- `scripts/jsx-validator.js`: JSX structure validation
- `docs/guides/DEVELOPMENT_GUIDELINES.md`: Development best practices
- `eslint.config.js`: Code quality configuration
- `playwright.config.ts`: E2E testing configuration

## Data Flow Architecture

1. **User Interaction**: React components handle user inputs
2. **State Management**: Context providers and Zustand stores manage state
3. **API Layer**: Custom hooks call service layer
4. **Services**: Services interact with Supabase and external APIs
5. **Database**: Supabase handles data persistence and real-time updates
6. **Integration**: WhatsApp and other third-party services

## Development Workflow

### Build & Validation
```bash
npm run jsx-validator     # Validate JSX structure
npm run pre-commit       # Full pre-commit validation
npm run build           # Production build
npm run test           # Run test suite
```

### Environment Management
```bash
npm run validate-env    # Validate environment variables
npm run dev            # Development server
npm run preview        # Preview production build
```

## Architecture Benefits

- **Scalability**: Feature-based organization supports growth
- **Maintainability**: Clear separation of concerns
- **Type Safety**: Comprehensive TypeScript coverage
- **Testing**: Comprehensive test coverage with multiple test types
- **Developer Experience**: Rich tooling and validation
- **Documentation**: Extensive guides and best practices
