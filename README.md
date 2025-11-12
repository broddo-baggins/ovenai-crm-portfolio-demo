# CRM Demo - AI-Powered Customer Relationship Management

> A comprehensive, production-ready CRM demonstration showcasing modern web development practices, AI integration, and enterprise-grade features.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

## ✨ Features

- **🤖 AI Assistant (NEW!)** - Context-aware AI agent on every page powered by Gemini + Groq fallback
  - Answers questions about the system, architecture, and features
  - Explains design decisions and technical choices
  - GLaDOS-inspired personality: witty, clever, and genuinely helpful
  - Landing page mode: Introduces creator, explains product vision, guides exploration
  - Dashboard mode: Deep technical assistance and feature explanations
- **AI-Powered Lead Management** - Intelligent lead scoring, qualification, and routing
- **Real-Time Conversations** - WhatsApp integration with live chat capabilities
- **Advanced Analytics** - Comprehensive dashboards with charts and reports
- **Project Management** - Full project lifecycle tracking with milestones
- **Calendar & Scheduling** - Integrated booking system with Calendly
- **Multi-Language Support** - English and Hebrew (RTL) with i18next
- **Dark Mode** - Beautiful dark theme with seamless switching
- **Demo Mode** - Full-featured demo with realistic mock data
- **Responsive Design** - Mobile-first approach with optimized layouts
- **Accessibility** - WCAG 2.1 AA compliant with Nagish integration

## 🚀 Quick Start

### Prerequisites

- **Node.js** 14+ (LTS recommended)
- **npm** or **yarn**
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/broddo-baggins/crm-portfolio-demo.git
cd crm-portfolio-demo

# Install dependencies
npm install

# Start development server (Demo Mode enabled)
npm run dev
```

The application will be available at `http://localhost:5173`

### Demo Mode

Demo mode is enabled by default and provides:
- **20 comprehensive leads** with full contact details and BANT scores
- **2 active projects** with milestones and progress tracking
- **7 calendar events** with various meeting types
- **4 conversation threads** with realistic message exchanges
- **Full dashboard analytics** with charts and KPIs
- **AI Assistant** - Click the sparkly purple button (bottom-right) to ask questions!

No authentication required - just start and explore!

### Try the AI Assistant

Look for the **sparkly purple button** in the bottom-right corner on any page! Ask questions like:
- "Who built this?"
- "How do I log in?"
- "What is BANT scoring?"
- "How was the WhatsApp interface built?"
- "What's the tech stack?"

The AI assistant provides context-aware responses and knows the entire system inside and out!

## 📚 Documentation

- **[Getting Started](GETTING_STARTED.md)** - Detailed setup and configuration guide
- **[Contributing](.docs/guides/CONTRIBUTING.md)** - How to contribute to the project
- **[Deployment](.docs/deployment/)** - Production deployment guides
- **[Development](.docs/development/)** - Development workflow and tools
- **[API Documentation](.docs/api/)** - API reference and integration guides
- **[Testing](.docs/testing/)** - Testing strategies and test coverage

## 🛠️ Technology Stack

### Frontend
- **React 18.3** - UI library with hooks and concurrent features
- **TypeScript 5.8** - Type-safe development
- **Vite 6.3** - Lightning-fast build tool
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible component library
- **Framer Motion** - Smooth animations and transitions
- **React Router 6** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **i18next** - Internationalization

### AI Integration
- **Google Gemini** - Primary AI model for natural language understanding
- **Groq (Llama 3.3 70B)** - High-speed fallback AI (14,400 req/day)
- **RAG Knowledge Base** - Retrieval-augmented generation with 100+ documentation chunks
- **Context-Aware Responses** - Different AI behavior for landing page vs. dashboard
- **Streaming Responses** - Real-time message streaming for better UX

### Backend Integration
- **Supabase** - Database and authentication
- **PostgreSQL** - Relational database
- **Row Level Security** - Data access control
- **Edge Functions** - Serverless API endpoints

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **TypeScript** - Static type checking

## 📂 Project Structure

```
/
├── src/                    # Source code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   ├── context/            # React context providers
│   ├── lib/                # Core libraries
│   └── data/               # Mock data and constants
├── public/                 # Static assets
├── scripts/                # Build and deployment scripts
├── tests/                  # Test files
├── quality-validation/     # QA and validation tests
├── supabase/              # Database and backend
├── .docs/                 # Project documentation
└── docs/                  # Public documentation
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:complete

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🏗️ Build & Deploy

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Deploy to Vercel (configured)
npm run deploy
```

## 🎨 Design System

The project uses a comprehensive design system built on:
- **Shadcn/ui** components
- **Radix UI** primitives
- **Tailwind CSS** utilities
- **Custom theme** with CSS variables
- **Dark mode** support
- **Responsive breakpoints** for all screen sizes

## 🔐 Security

- **Row Level Security (RLS)** on all database tables
- **Authentication** with Supabase Auth
- **API rate limiting** to prevent abuse
- **Input validation** on all forms
- **XSS protection** with sanitization
- **CSRF protection** with tokens
- **Secure headers** configuration

## 🌍 Internationalization

Fully localized for:
- **English (en)** - Primary language
- **Hebrew (he)** - RTL support with proper layout

## 📱 Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## 📈 Performance

- **Bundle Size**: ~2.8MB (optimized with code splitting)
- **First Load**: < 2s on 3G
- **Lighthouse Score**: 90+ across all metrics
- **Code Coverage**: 85%+ on critical paths

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](.docs/guides/CONTRIBUTING.md) for details on:
- Code of conduct
- Development workflow
- Pull request process
- Coding standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**Project Lead**: Amit Yogev
**Repository**: [github.com/broddo-baggins/crm-portfolio-demo](https://github.com/broddo-baggins/crm-portfolio-demo)

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Components from [Shadcn/ui](https://ui.shadcn.com/)
- Backend by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)

## 📞 Support

For questions, issues, or feature requests:
- **AI Assistant**: Click the sparkly button in the app for instant help!
- **Issues**: [GitHub Issues](https://github.com/broddo-baggins/crm-portfolio-demo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/broddo-baggins/crm-portfolio-demo/discussions)

---

**Made with ❤️ by the CRM Demo Team**
