'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface EmailSubscriptionForm {
  pehchanId?: string;
  userName?: string;
}

export function EmailSubscriptionForm({ pehchanId, userName }: EmailSubscriptionForm) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const { toast } = useToast()

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email && !pehchanId) {
      toast({
        title: 'Error',
        description: 'Email address required',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          pehchanId: pehchanId || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      const data = await response.json()
      setSubscribed(true)

      toast({
        title: 'Success',
        description: pehchanId
          ? 'Successfully subscribed to monthly digest!'
          : 'Check your email to verify your subscription.',
      })

      setEmail('')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to subscribe',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (subscribed) {
    return (
      <div className="rounded-lg bg-green-50 p-4 border border-green-200">
        <p className="text-sm text-green-800">
          ✓ You&apos;re subscribed to Numainda&apos;s monthly digest!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubscribe} className="space-y-4">
      <div >
        <h3 className="text-lg font-semibold mb-2">
          📬 Monthly Digest Subscription
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Get updates on bills, parliamentary proceedings, and representative information delivered to your inbox monthly.
        </p>
      </div>

      {!pehchanId && (
        <div>
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
      )}

      {pehchanId && (
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <p className="text-sm">
            <strong>{userName || 'User'}</strong> - Connected via Pehchan
          </p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Subscribing...' : 'Subscribe to Monthly Digest'}
      </Button>

      <p className="text-xs text-gray-500">
        We respect your privacy. Unsubscribe anytime.
      </p>
    </form>
  )
}
