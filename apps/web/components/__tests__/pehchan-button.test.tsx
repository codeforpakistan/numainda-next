import '@testing-library/jest-dom'
import { afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { PehchanLoginButton } from '../pehchan-button'

// Mock the Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  )
}))

// Mock the Icons component
jest.mock('@/components/icons', () => ({
  Icons: {
    whiteLogo: () => <div data-testid="mock-white-logo">Logo</div>
  }
}))

describe('PehchanLoginButton', () => {
  const originalEnv = process.env
  const mockUUID = '123e4567-e89b-12d3-a456-426614174000'
  
  beforeEach(() => {
    // Mock environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_PEHCHAN_URL: 'https://pehchan.test',
      NEXT_PUBLIC_CLIENT_ID: 'test-client-id'
    }

    // Mock window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: 'https://numainda.test',
        href: '',
        assign: jest.fn()
      }
    })

    // Mock crypto.randomUUID
    jest.spyOn(crypto, 'randomUUID').mockImplementation(() => mockUUID)
  })

  afterEach(() => {
    process.env = originalEnv
    jest.clearAllMocks()
    sessionStorage.clear()
  })

  it('renders correctly', () => {
    render(<PehchanLoginButton />)
    expect(screen.getByText('Login with Pehchan')).toBeInTheDocument()
    expect(screen.getByTestId('mock-white-logo')).toBeInTheDocument()
  })

  it('constructs correct login URL with all required parameters when clicked', () => {
    render(<PehchanLoginButton />)
    fireEvent.click(screen.getByText('Login with Pehchan'))

    const expectedUrl = new URL('https://pehchan.test/login')
    expectedUrl.searchParams.set('service_name', 'Numainda')
    expectedUrl.searchParams.set('client_id', 'test-client-id')
    expectedUrl.searchParams.set('redirect_uri', 'https://numainda.test/auth/callback')
    expectedUrl.searchParams.set('response_type', 'code')
    expectedUrl.searchParams.set('scope', 'openid profile email')
    expectedUrl.searchParams.set('state', '123e4567-e89b-12d3-a456-426614174000')

    expect(sessionStorage.getItem('auth_state')).toBe('123e4567-e89b-12d3-a456-426614174000')
    expect(window.location.href).toBe(expectedUrl.toString())
  })

  it('handles missing environment variables gracefully', () => {
    delete process.env.NEXT_PUBLIC_PEHCHAN_URL
    delete process.env.NEXT_PUBLIC_CLIENT_ID

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<PehchanLoginButton />)
    fireEvent.click(screen.getByText('Login with Pehchan'))

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('applies correct styling to the button', () => {
    render(<PehchanLoginButton />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass(
      'hover:bg-green-700',
      'gap-2',
      'text-white',
      'py-2',
      'px-4',
      'rounded-md',
      'flex',
      'items-center',
      'justify-center',
      'transition-colors'
    )
  })
}) 