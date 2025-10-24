# Contributing to CRM Demo

Thank you for your interest in contributing to CRM Demo! This document provides guidelines and instructions for contributing.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (browser, OS, Node version)

### Suggesting Features

1. **Check roadmap** in discussions
2. **Open a feature request** with:
   - Clear use case
   - Proposed solution
   - Alternative considerations
   - Mockups/examples if helpful

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our coding standards
4. **Write/update tests** for your changes
5. **Run the test suite**:
   ```bash
   npm run test
   npm run type-check
   npm run lint
   ```
6. **Commit with meaningful messages**:
   ```bash
   git commit -m "Add feature: brief description"
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request** with:
   - Description of changes
   - Related issue numbers
   - Screenshots/videos for UI changes
   - Testing notes

## Development Setup

### Prerequisites
- Node.js 14+ (LTS recommended)
- npm or yarn
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/ovenai-crm-portfolio-demo.git
cd ovenai-crm-portfolio-demo

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Prefer interfaces over types for object shapes
- Use type inference where appropriate
- Avoid `any` - use `unknown` if type is truly unknown

### React
- Functional components with hooks
- Use custom hooks for reusable logic
- Proper prop types with TypeScript
- Meaningful component and variable names

### Styling
- Use Tailwind CSS utilities
- Follow existing component patterns
- Responsive design (mobile-first)
- Support dark mode

### File Organization
```
src/
├── components/         # Reusable UI components
│   ├── ui/            # Base UI components (Shadcn)
│   ├── layout/        # Layout components
│   └── [feature]/     # Feature-specific components
├── pages/             # Page components (routes)
├── services/          # API and business logic
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
└── types/             # TypeScript type definitions
```

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with "use" prefix (`useAuth.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`UserData`, `ApiResponse`)

### Code Style
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in objects/arrays
- Semicolons required
- Line length: 100 characters (soft limit)

## Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style/formatting
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(leads): add bulk import functionality

- Implement CSV upload
- Add validation for required fields
- Show progress indicator during import

Closes #123
```

```
fix(calendar): resolve event overlap rendering issue

Events with same start time now stack properly
instead of overlapping.

Fixes #456
```

## Testing

### Unit Tests
- Test business logic thoroughly
- Mock external dependencies
- Use descriptive test names
- Aim for 80%+ coverage on new code

```typescript
describe('formatDate', () => {
  it('should format date in ISO format', () => {
    const date = new Date('2025-01-15');
    expect(formatDate(date)).toBe('2025-01-15');
  });
});
```

### E2E Tests
- Test critical user flows
- Use Playwright for E2E
- Keep tests maintainable
- Test happy path and error cases

## Documentation

- Update README if adding features
- Add JSDoc comments for complex functions
- Update type definitions
- Include usage examples
- Keep documentation up-to-date

## Review Process

1. **Automated Checks**: All tests and linting must pass
2. **Code Review**: At least one approval required
3. **Testing**: Changes tested in demo mode
4. **Documentation**: Updated if needed
5. **Merge**: Squash and merge to keep history clean

## Questions?

- **Documentation**: See `.docs/` folder
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Email**: demo@example.com

## Recognition

Contributors will be:
- Listed in CHANGELOG
- Credited in release notes
- Added to contributors list

Thank you for contributing! 🎉

