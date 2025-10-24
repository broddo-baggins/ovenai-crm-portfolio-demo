import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardProvider } from '../DashboardContext'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}))

// Mock logger
vi.mock('@/services/base/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock dashboard persistence
vi.mock('@/services/dashboardPersistence', () => ({
  default: {
    saveDashboardLayout: vi.fn().mockResolvedValue({ success: true }),
    forceSaveToServer: vi.fn().mockResolvedValue({ success: true }),
    loadDashboardLayout: vi.fn().mockResolvedValue({ widgets: [] }),
  },
}))

describe('Dashboard Context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should provide dashboard context', () => {
    const TestComponent = () => <div data-testid="test-component">Test</div>
    
    render(
      <DashboardProvider>
        <TestComponent />
      </DashboardProvider>
    )
    
    expect(screen.getByTestId('test-component')).toBeInTheDocument()
  })
}) 