import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import { AuthProvider } from '../../contexts/AuthContext'
import { LocalizationProvider } from '../../contexts/LocalizationContext'
import { ProtectedRoute } from '../ProtectedRoute'

// Mock the useAuth hook
const mockUseAuth = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme()
  
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <LocalizationProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'testuser' },
      isAuthenticated: true,
    })

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('redirects to auth when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    })

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    )

    // Should not render the protected content
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('redirects when requireProvider is true but user is not a provider', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', is_provider: false },
      isAuthenticated: true,
    })

    render(
      <TestWrapper>
        <ProtectedRoute requireProvider>
          <div data-testid="provider-content">Provider Content</div>
        </ProtectedRoute>
      </TestWrapper>
    )

    // Should not render the provider content
    expect(screen.queryByTestId('provider-content')).not.toBeInTheDocument()
  })

  it('renders provider content when user is a provider', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', is_provider: true },
      isAuthenticated: true,
    })

    render(
      <TestWrapper>
        <ProtectedRoute requireProvider>
          <div data-testid="provider-content">Provider Content</div>
        </ProtectedRoute>
      </TestWrapper>
    )

    expect(screen.getByTestId('provider-content')).toBeInTheDocument()
  })
})
