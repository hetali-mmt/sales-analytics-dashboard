# 🧪 Test Commands Guide

## 🚀 Quick Start Testing

### One Command to Run All Tests
```bash
npm run test:all
```

### Quick Tests (No E2E)
```bash
npm run test:quick
```

## 📋 Step-by-Step Commands

### 1. Install Dependencies
```bash
npm install
npx playwright install
```

### 2. Run Individual Test Types
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

### 3. Advanced Testing Options
```bash
# Unit tests with UI
npm run test:ui

# Unit tests in watch mode
npm run test:watch

# E2E tests with visible browser
npm run test:e2e:headed

# E2E tests in debug mode
npm run test:e2e:debug

# Specific E2E test file
npm run test:e2e team-overview.spec.ts
```

## 🎯 Test Files Created

### Unit Tests
- `src/components/ui/__tests__/Button.test.tsx`
- `src/hooks/__tests__/useUrlState.test.ts`
- `src/services/__tests__/api.test.ts`
- `src/pages/__tests__/TeamOverview.test.tsx`

### E2E Tests
- `tests/e2e/team-overview.spec.ts`
- `tests/e2e/session-list.spec.ts`
- `tests/e2e/navigation.spec.ts`

## 🔧 Test Configuration
- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E test configuration
- `src/test/setup.ts` - Test setup and mocks
- `src/test/test-utils.tsx` - Test utilities

## 📊 Test Reports
```bash
# View E2E test report
npx playwright show-report

# Run tests with coverage
npm run test -- --coverage
```

## ⚡ Complete Test Suite
```bash
# Run everything (recommended)
./scripts/test-all.sh
```

This will run:
1. ✅ TypeScript type checking
2. ✅ ESLint code quality
3. ✅ Unit tests with Vitest
4. ✅ Production build verification
5. ✅ E2E tests with Playwright