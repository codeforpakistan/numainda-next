'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EmailSubscriptionForm } from '@/components/email-subscription-form'
import { SubscriptionPreferencesManager } from '@/components/subscription-preferences-manager'
import { useToast } from '@/hooks/use-toast'

export default function SubscriptionsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [pehchanId, setPehchanId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'subscribe' | 'manage'>('subscribe')

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('access_token')
        const userInfo = localStorage.getItem('user_info')
        const pehchanIdLocal = localStorage.getItem('pehchan_id')

        if (accessToken && pehchanIdLocal) {
          setPehchanId(pehchanIdLocal)
          if (userInfo) {
            const info = JSON.parse(userInfo)
            setUserName(info.profile?.name)
          }

          // Check if has existing subscription
          const response = await fetch(`/api/subscriptions/${pehchanIdLocal}`)
          if (response.ok) {
            const data = await response.json()
            setSubscriptionId(data.id)
            setTab('manage')
          }
        }

        // Check URL params for subscription verification
        const params = new URLSearchParams(window.location.search)
        if (params.get('verified') === 'true') {
          toast({
            title: 'Email verified',
            description: 'Your subscription is now active',
          })
          // Clear URL param
          window.history.replaceState({}, '', '/settings/subscriptions')
        }

        if (params.get('unsubscribed') === 'true') {
          toast({
            title: 'Unsubscribed',
            description: 'You have been removed from the mailing list',
          })
          window.history.replaceState({}, '', '/settings/subscriptions')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    // Empty dependency array - only run once on mount
  }, [])

  if (loading) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Newsletter & Subscriptions</h1>
        <p className="text-gray-600">
          Stay informed with Numainda&apos;s monthly digest of parliamentary updates
        </p>
      </div>

      {subscriptionId ? (
        <div className="space-y-4">
          <div className="flex border-b">
            <button
              onClick={() => setTab('manage')}
              className={`px-4 py-2 font-medium ${
                tab === 'manage'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600'
              }`}
            >
              Manage Subscription
            </button>
            <button
              onClick={() => setTab('subscribe')}
              className={`px-4 py-2 font-medium ${
                tab === 'subscribe'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600'
              }`}
            >
              Add Email
            </button>
          </div>

          <div>
            {tab === 'manage' ? (
              <SubscriptionPreferencesManager subscriptionId={subscriptionId} />
            ) : (
              <EmailSubscriptionForm pehchanId={pehchanId || undefined} userName={userName || undefined} />
            )}
          </div>
        </div>
      ) : (
        <div>
          <EmailSubscriptionForm
            pehchanId={pehchanId || undefined}
            userName={userName || undefined}
          />
        </div>
      )}

      <div className="mt-12 pt-8 border-t">
        <h2 className="text-lg font-semibold mb-4">About Our Monthly Digest</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">📜 Bills & Acts</h3>
            <p className="text-sm">
              Stay updated on new legislation and parliamentary acts from Pakistan&apos;s National Assembly
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold mb-2">🏛️ Proceedings</h3>
            <p className="text-sm">
              Get summaries of parliamentary proceedings and debates
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold mb-2">👥 Representatives</h3>
            <p className="text-sm">
              Know your elected representatives and their contact information
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
