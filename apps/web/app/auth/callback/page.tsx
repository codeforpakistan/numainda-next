'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function AuthCallback() {
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        console.log('Callback URL params:', Object.fromEntries(params.entries()))
        
        // Check for direct token response first (implicit flow)
        const accessToken = params.get('access_token')
        const idToken = params.get('id_token')
        const error = params.get('error')

        console.log('Received params:', {
          hasAccessToken: !!accessToken,
          hasIdToken: !!idToken,
          hasError: !!error
        })

        if (error) {
          throw new Error(error)
        }

        // Handle implicit flow (direct token response)
        if (accessToken) {
          localStorage.setItem('access_token', accessToken)
          if (idToken) localStorage.setItem('id_token', idToken)

          // Dispatch custom event for same-tab updates
          window.dispatchEvent(new Event('localStorageChange'))

          // Use our proxy endpoint instead
          const userResponse = await fetch('/api/auth/userinfo', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          })

          if (!userResponse.ok) {
            throw new Error('Failed to fetch user info')
          }

          const userInfo = await userResponse.json()
          console.log('User info:', userInfo)
          localStorage.setItem('user_info', JSON.stringify(userInfo))
          localStorage.setItem('pehchan_id', userInfo.profile.cnic)

          toast({
            title: "Login successful",
            description: "Welcome to Numainda"
          })

          router.push('/chat')
          return
        }

        // If we get here and don't have tokens, something went wrong
        throw new Error(
          `Authentication failed. ` +
          `Received parameters: ${JSON.stringify(Object.fromEntries(params.entries()))}`
        )

      } catch (error) {
        console.error('Auth callback error:', error)
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error instanceof Error ? error.message : "An error occurred during login"
        })
        router.push('/chat')
      } finally {
        sessionStorage.removeItem('auth_state')
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [router, toast])

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Processing your login...</p>
        </div>
      </div>
    )
  }

  return null
} 