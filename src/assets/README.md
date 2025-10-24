# Assets Inventory

This document provides a comprehensive overview of all assets in the project, organized by category for easy searching and management.

## Quick Search Guide

Use Ctrl+F (Cmd+F on Mac) to search for:
- **Asset names** (e.g., "whatsapp-bg", "logo", "icon")
- **Usage context** (e.g., "landing page", "dashboard", "chat")
- **File types** (e.g., "svg", "png", "woff2")
- **Categories** (e.g., "background", "icon", "font")

## Asset Categories

### Images (`src/assets/images/`)

#### Avatars (`src/assets/images/avatars/`)
| Asset Name | File | Type | Size | Usage | Description | Component/Page |
|------------|------|------|------|-------|-------------|----------------|
| Michal Profile | `michal-profile.jpg` | JPG | ~1.4MB | Chat agent avatar | ✅ **ACTIVE** - Professional headshot of Michal, the real estate sales agent | `ChatMockup.tsx` |
| Michal Avatar (Copy) | `michal-avatar.jpg` | JPG | ~1.4MB | Build compatibility | ⚠️ **TEMPORARY** - Copy of michal-profile.jpg for build system compatibility | Build process |

#### Backgrounds (`src/assets/images/backgrounds/`)
| Asset Name | File | Type | Size | Usage | Description | Component/Page |
|------------|------|------|------|-------|-------------|----------------|
| WhatsApp Background | `whatsapp-bg.svg` | SVG | 1.5KB | Chat mockup background | Green WhatsApp-style chat background pattern | `ChatMockup.tsx` |

#### Logos (`src/assets/images/logos/`)
| Asset Name | File | Type | Size | Usage | Description | Component/Page |
|------------|------|------|------|-------|-------------|----------------|
| *Currently empty* | - | - | - | - | Directory ready for logo assets | - |

#### Illustrations (`src/assets/images/illustrations/`)
| Asset Name | File | Type | Size | Usage | Description | Component/Page |
|------------|------|------|------|-------|-------------|----------------|
| *Currently empty* | - | - | - | - | Directory ready for illustration assets | - |

#### Screenshots (`src/assets/images/screenshots/`)
| Asset Name | File | Type | Size | Usage | Description | Component/Page |
|------------|------|------|------|-------|-------------|----------------|
| *Currently empty* | - | - | - | - | Directory ready for screenshot assets | - |

### Icons (`src/assets/icons/`)

| Asset Name | File | Type | Size | Usage | Description | Component/Page |
|------------|------|------|------|-------|-------------|----------------|
| *Currently empty* | `.gitkeep` | - | - | - | Placeholder to maintain directory structure | - |

**Note**: Most icons are provided by:
- `@radix-ui/react-icons` (UI components)
- `lucide-react` (general purpose icons)

### Fonts (`src/assets/fonts/`)

| Asset Name | File | Type | Size | Usage | Description | Component/Page |
|------------|------|------|------|-------|-------------|----------------|
| Geist Variable | `Geist/Geist-VariableFont_wght.ttf` | TTF | 149KB | Primary UI font | ✅ **ACTIVE** - Variable weight font (100-900) for all UI elements | All components |
| Geist Regular | `Geist/static/Geist-Regular.ttf` | TTF | 78KB | Fallback font | ✅ **ACTIVE** - Static weight fallback for compatibility | Fallback system |
| Geist Static Weights | `Geist/static/*.ttf` | TTF | ~60-80KB each | Static weights | ✅ **AVAILABLE** - Individual weight files (Thin, Light, Medium, etc.) | On-demand loading |
| Rubik Variable | `Rubik/Rubik-VariableFont_wght.ttf` | TTF | 354KB | Hebrew typography | ✅ **ACTIVE** - Variable weight font (300-700) for Hebrew/RTL text | Hebrew interface |
| Rubik Regular | `Rubik/static/Rubik-Regular.ttf` | TTF | 208KB | Hebrew fallback | ✅ **ACTIVE** - Static weight fallback for Hebrew text | Hebrew fallback |
| Rubik Static Weights | `Rubik/static/*.ttf` | TTF | ~180-220KB each | Hebrew weights | ✅ **AVAILABLE** - Individual Hebrew weight files | Hebrew styling |

**Configuration**: Fonts are loaded via local `@font-face` declarations in `src/index.css` and configured in `tailwind.config.ts` for optimal performance and bundling.

### Public Assets (`public/`)

| Asset Name | File | Type | Size | Usage | Description | Component/Page |
|------------|------|------|------|-------|-------------|----------------|
| Favicon | `favicon.ico` | ICO | 1.1KB | Browser tab icon | Default favicon for the application | Browser tab |
| Sitemap | `sitemap.xml` | XML | 1.2KB | SEO | Search engine sitemap | SEO/Crawlers |
| Robots | `robots.txt` | TXT | 203B | SEO | Search engine crawling instructions | SEO/Crawlers |

### Localization Assets (`public/locales/`)

| Asset Name | Directory | Type | Usage | Description | Languages |
|------------|-----------|------|-------|-------------|-----------|
| Translation Files | `locales/` | JSON | i18n | Internationalization files | Multiple languages |

## Asset Usage Guidelines

### Adding New Assets

1. **Images**: Place in appropriate subdirectory under `src/assets/images/`
   - `backgrounds/` - Background images and patterns
   - `logos/` - Company and brand logos
   - `illustrations/` - Decorative illustrations
   - `screenshots/` - Application screenshots

2. **Icons**: 
   - Prefer using existing icon libraries (`lucide-react`, `@radix-ui/react-icons`)
   - Custom icons go in `src/assets/icons/`
   - Use SVG format for scalability

3. **Fonts**: Place in `src/assets/fonts/`
   - ✅ **Current setup**: Geist (UI) and Rubik (Hebrew) with variable + static weights
   - Include multiple formats (TTF with variable font support recommended)
   - Update Tailwind config and `@font-face` declarations in `src/index.css`

### Optimization Guidelines

- **Images**: Use WebP format when possible, optimize file sizes
- **Icons**: Use SVG format, optimize with SVGO
- **Fonts**: Use woff2 format for modern browsers, include fallbacks

### Naming Conventions

- Use kebab-case for file names (e.g., `whatsapp-bg.svg`)
- Be descriptive but concise
- Include size indicators for multiple versions (e.g., `logo-small.svg`, `logo-large.svg`)

## Content Management

### Landing Page Demo Content

To change content in the landing page demo:

1. **Agent Name**: Search for "Agent" in the codebase
2. **Company Name**: Search for the current company name
3. **Demo Data**: Check `src/data/` directory for mock data
4. **Text Content**: Check translation files in `public/locales/`

### Asset References

All asset imports use the `@/assets/` alias. To find where an asset is used:

1. Search for the filename without extension
2. Search for the full import path
3. Check the "Component/Page" column in the tables above

## Maintenance

This README should be updated whenever:
- New assets are added
- Assets are moved or renamed
- Asset usage changes
- New asset categories are created

Last updated: Phase 5 Asset Organization (December 2024) 