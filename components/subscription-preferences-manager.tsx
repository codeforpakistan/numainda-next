'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionPreferences {
  id: string;
  email: string;
  includeBills: boolean;
  includeProceedings: boolean;
  includeRepresentatives: boolean;
  isActive: boolean;
}

interface SubscriptionPreferencesProps {
  subscriptionId: string;
}

export function SubscriptionPreferencesManager({
  subscriptionId,
}: SubscriptionPreferencesProps) {
  const [preferences, setPreferences] = useState<SubscriptionPreferences | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState<Partial<SubscriptionPreferences>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchPreferences()
  }, [subscriptionId])

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`)
      if (!response.ok) throw new Error('Failed to fetch preferences')

      const data = await response.json()
      setPreferences(data)
      setChanges({})
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load preferences',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (field: keyof SubscriptionPreferences) => {
    if (!preferences) return

    setChanges({
      ...changes,
      [field]: !preferences[field],
    })
  }

  const handleSave = async () => {
    if (!preferences || Object.keys(changes).length === 0) return

    setSaving(true)

    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })

      if (!response.ok) throw new Error('Failed to update preferences')

      const data = await response.json()
      setPreferences(data)
      setChanges({})

      toast({
        title: 'Success',
        description: 'Preferences updated',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUnsubscribe = async () => {
    if (!preferences) return

    if (!confirm('Are you sure you want to unsubscribe?')) return

    setSaving(true)

    try {
      const response = await fetch('/api/subscriptions/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: preferences.email }),
      })

      if (!response.ok) throw new Error('Failed to unsubscribe')

      toast({
        title: 'Unsubscribed',
        description: 'You have been removed from the mailing list',
      })

      setPreferences(null)
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to unsubscribe',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading preferences...</div>
  }

  if (!preferences) {
    return <div className="text-center py-4">Subscription not found</div>
  }

  const hasChanges = Object.keys(changes).length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Subscription Preferences
        </h2>
        <p className="text-gray-600">
          Email: <strong>{preferences.email}</strong>
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">What to include in monthly digest:</h3>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="bills"
              checked={preferences.includeBills}
              onChange={(e) => {
                setPreferences({ ...preferences, includeBills: e.target.checked })
                setChanges({ ...changes, includeBills: e.target.checked })
              }}
              className="w-4 h-4"
            />
            <label htmlFor="bills" className="ml-2 cursor-pointer">
              <strong>Bills & Acts</strong> - New legislative bills and acts
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="proceedings"
              checked={preferences.includeProceedings}
              onChange={(e) => {
                setPreferences({ ...preferences, includeProceedings: e.target.checked })
                setChanges({ ...changes, includeProceedings: e.target.checked })
              }}
              className="w-4 h-4"
            />
            <label htmlFor="proceedings" className="ml-2 cursor-pointer">
              <strong>Parliamentary Proceedings</strong> - Summary of parliamentary activities
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="representatives"
              checked={preferences.includeRepresentatives}
              onChange={(e) => {
                setPreferences({ ...preferences, includeRepresentatives: e.target.checked })
                setChanges({ ...changes, includeRepresentatives: e.target.checked })
              }}
              className="w-4 h-4"
            />
            <label htmlFor="representatives" className="ml-2 cursor-pointer">
              <strong>Representative Updates</strong> - Updates on elected representatives
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setChanges({})
          }}
          disabled={!hasChanges}
        >
          Cancel
        </Button>

        <Button
          variant="destructive"
          onClick={handleUnsubscribe}
          disabled={saving}
        >
          Unsubscribe
        </Button>
      </div>
    </div>
  )
}
