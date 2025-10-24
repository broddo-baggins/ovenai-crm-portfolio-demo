# Changelog

All notable changes to CRM Demo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Professional project structure with organized documentation
- Comprehensive README with badges and feature overview
- Contributing guidelines and code of conduct
- MIT License
- Git history cleanup guide for legal compliance

### Changed
- Rebranded from OvenAI to CRM Demo across all files
- Moved all documentation to `.docs/` directory
- Reorganized root directory for professional presentation
- Updated sidebar and mobile navigation branding
- Enabled demo mode by default in all build commands

### Fixed
- Final OvenAI references in sidebar and mobile navigation
- Component naming issues after brand replacement
- TypeScript compilation after branding changes

## [2.1.0] - 2025-01-24

### Added
- Demo mode with full mock data support
- 20 comprehensive lead records with BANT scoring
- 2 active projects with milestone tracking
- 7 calendar events with various meeting types
- 4 conversation threads with realistic exchanges
- Complete dashboard analytics with charts

### Changed
- Enabled `VITE_DEMO_MODE=true` for dev and build commands
- Updated site settings with CRM Demo branding
- Improved mock data service integration

### Fixed
- Removed broken test files requiring missing credentials
- Cleaned up duplicate QueueService tests
- Fixed mobile test dependencies

## [2.0.0] - 2025-01-20

### Added
- Enhanced mobile navigation with better UX
- Queue management system for lead workflow
- Advanced analytics dashboard
- Multi-language support (English/Hebrew)
- Dark mode with theme persistence
- Accessibility features (WCAG 2.1 AA)
- Calendar integration with Calendly
- WhatsApp conversation management
- Project milestone tracking
- Advanced reporting with charts

### Changed
- Migrated to Vite 6.3 for faster builds
- Updated to React 18.3 with concurrent features
- Improved TypeScript strict mode compliance
- Enhanced mobile responsiveness
- Optimized bundle size (2.8MB)

### Security
- Implemented Row Level Security (RLS)
- Added rate limiting on API endpoints
- Enhanced input validation
- XSS and CSRF protection

## [1.0.0] - 2024-12-01

### Added
- Initial CRM application structure
- Lead management system
- Basic dashboard with KPIs
- User authentication
- Supabase integration
- Basic responsive design
- Core UI components

---

## Version History Summary

- **2.1.0** - Demo Mode & Mock Data
- **2.0.0** - Feature Complete with Advanced Analytics
- **1.0.0** - Initial Release

## Upgrade Guide

### From 2.0.x to 2.1.x
No breaking changes. Demo mode is now enabled by default.

### From 1.x to 2.x
Major changes include:
- New routing structure
- Updated authentication flow
- Database schema changes (migration required)
- New component library (Shadcn/ui)

---

For detailed commit history, see [GitHub Commits](https://github.com/broddo-baggins/ovenai-crm-portfolio-demo/commits)

