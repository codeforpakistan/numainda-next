'use client'

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export function PehchanLoginButton() {
  const handleLogin = () => {
    // Construct the login URL with required parameters
    const loginUrl = new URL(`${process.env.NEXT_PUBLIC_PEHCHAN_URL}/login`)
    
    // Add required parameters
    const params = {
      service_name: 'Numainda',
      client_id: process.env.NEXT_PUBLIC_CLIENT_ID!,
      redirect_uri: `${window.location.origin}/auth/callback`,
      response_type: 'code',
      scope: 'openid profile email',
    }
    
    // Add all parameters
    Object.entries(params).forEach(([key, value]) => {
      loginUrl.searchParams.set(key, value)
    })
    
    // Add state for security
    const state = crypto.randomUUID()
    sessionStorage.setItem('auth_state', state)
    loginUrl.searchParams.set('state', state)
    
    // Log complete URL and parameters for debugging
    console.log('Login URL:', loginUrl.toString())
    console.log('Parameters:', {
      ...params,
      state,
      fullUrl: loginUrl.toString()
    })
    
    window.location.href = loginUrl.toString()
  }

  return (
    <Button 
      onClick={handleLogin}
      className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-white transition-colors bg-green-600 hover:bg-green-700"
    >
      <Icons.whiteLogo />
      Login with Pehchan
    </Button>
  )
}