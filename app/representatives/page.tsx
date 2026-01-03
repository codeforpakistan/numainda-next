'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, Loader2, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import Image from 'next/image'

interface Representative {
  id: string
  name: string
  nameClean: string
  constituency: string
  constituencyCode: string
  constituencyName: string | null
  district: string | null
  province: string
  party: string
  imageUrl: string | null
  imageLocalPath: string | null
  phone: string | null
  latitude: number | null
  longitude: number | null
  distance?: number
}

interface FilterOptions {
  provinces: string[]
  parties: string[]
  districts: string[]
}

export default function RepresentativesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [representatives, setRepresentatives] = useState<Representative[]>([])
  const [filters, setFilters] = useState<FilterOptions>({ provinces: [], parties: [], districts: [] })
  const [loading, setLoading] = useState(true)
  const [locationLoading, setLocationLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  })

  // Get query parameters
  const search = searchParams.get('search') || ''
  const province = searchParams.get('province') || undefined
  const party = searchParams.get('party') || undefined
  const district = searchParams.get('district') || undefined
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const page = parseInt(searchParams.get('page') || '1', 10)

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch('/api/representatives/filters')
        const data = await response.json()
        setFilters(data.data)
      } catch (error) {
        console.error('Failed to fetch filters:', error)
      }
    }
    fetchFilters()
  }, [])

  // Fetch representatives
  useEffect(() => {
    const fetchRepresentatives = async () => {
      setLoading(true)
      try {
        let url = '/api/representatives?'
        const params = new URLSearchParams()

        if (lat && lng) {
          // Location-based search
          url = '/api/representatives/by-location?'
          params.append('lat', lat)
          params.append('lng', lng)
          params.append('radius', '50')
          params.append('limit', '20')
        } else {
          // Regular search
          if (search) params.append('search', search)
          if (province) params.append('province', province)
          if (party) params.append('party', party)
          if (district) params.append('district', district)
          params.append('page', page.toString())
          params.append('limit', '20')
        }

        const response = await fetch(url + params.toString())
        const data = await response.json()

        setRepresentatives(data.data || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error('Failed to fetch representatives:', error)
        toast({
          title: 'Error',
          description: 'Failed to load representatives. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRepresentatives()
  }, [search, province, party, district, lat, lng, page, toast])

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Reset page when changing filters
    if (Object.keys(updates).some(k => k !== 'page')) {
      params.delete('page')
    }

    router.push(`/representatives?${params.toString()}`)
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
        // Clear other filters when using location
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

  const clearAllFilters = () => {
    router.push('/representatives')
  }

  const hasActiveFilters = search || province || party || district || lat || lng

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">National Assembly Representatives</h1>
        <p className="text-muted-foreground">
          Find your representative from Pakistan&apos;s National Assembly
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or constituency..."
              value={search}
              onChange={(e) => updateSearchParams({ search: e.target.value || null })}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleUseLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <MapPin className="mr-2 size-4" />
                Use Location
              </>
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={province}
            onValueChange={(value) => updateSearchParams({ province: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Provinces" />
            </SelectTrigger>
            <SelectContent>
              {filters.provinces.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={party}
            onValueChange={(value) => updateSearchParams({ party: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Parties" />
            </SelectTrigger>
            <SelectContent>
              {filters.parties.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={district}
            onValueChange={(value) => updateSearchParams({ district: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent>
              {filters.districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="mr-2 size-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Location Info Banner */}
      {lat && lng && (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-primary">Searching by location</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your detected location: Latitude {parseFloat(lat).toFixed(4)}, Longitude {parseFloat(lng).toFixed(4)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing representatives within 50km of this location
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {loading ? (
          'Loading...'
        ) : (
          <>
            Showing {representatives.length} of {pagination.totalCount} representatives
          </>
        )}
      </div>

      {/* Representatives Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="size-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : representatives.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No representatives found. Try adjusting your search criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {representatives.map((rep) => (
            <Link key={rep.id} href={`/representatives/${rep.id}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="relative size-16 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                    {rep.imageUrl ? (
                      <img
                        src={rep.imageUrl}
                        alt={rep.nameClean}
                        className="size-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement!.innerHTML = `<div class="flex size-full items-center justify-center text-2xl font-bold text-muted-foreground">${rep.nameClean.charAt(0)}</div>`
                        }}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-2xl font-bold text-muted-foreground">
                        {rep.nameClean.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold leading-tight">{rep.nameClean}</h3>
                    <p className="text-sm text-muted-foreground">
                      {rep.constituencyCode}
                      {rep.constituencyName && ` - ${rep.constituencyName}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="secondary">{rep.party}</Badge>
                      {rep.province && <Badge variant="outline">{rep.province}</Badge>}
                    </div>
                    {rep.distance && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        <MapPin className="mr-1 inline size-3" />
                        {rep.distance.toFixed(1)} km away
                      </p>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && !lat && !lng && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => updateSearchParams({ page: (page - 1).toString() })}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2 px-4">
            Page {page} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page === pagination.totalPages}
            onClick={() => updateSearchParams({ page: (page + 1).toString() })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
