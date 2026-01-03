'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

export function RepresentativeSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/representatives?search=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location not supported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      })
      return
    }

    setLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        toast({
          title: 'Location detected',
          description: `Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}`,
        })
        router.push(`/representatives?lat=${latitude}&lng=${longitude}`)
        setLocationLoading(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast({
          title: 'Location access denied',
          description: 'Please enable location access to find representatives near you.',
          variant: 'destructive',
        })
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or constituency (e.g. 'Imran Khan' or 'NA-125')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 text-base h-12"
          />
        </div>
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Searching
            </>
          ) : (
            'Search'
          )}
        </Button>
      </form>

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleUseLocation}
        disabled={locationLoading}
        className="w-full"
      >
        {locationLoading ? (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" />
            Getting your location...
          </>
        ) : (
          <>
            <MapPin className="mr-2 size-5" />
            Use My Location
          </>
        )}
      </Button>
    </div>
  )
}
