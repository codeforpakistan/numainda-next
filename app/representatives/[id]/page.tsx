'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Home, Building2, Calendar, Users, Loader2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Representative {
  id: string
  name: string
  nameClean: string
  fatherName: string | null
  constituency: string
  constituencyCode: string
  constituencyName: string | null
  district: string | null
  province: string
  party: string
  oathTakingDate: string | null
  phone: string | null
  permanentAddress: string | null
  islamabadAddress: string | null
  profileUrl: string | null
  imageUrl: string | null
  imageLocalPath: string | null
  latitude: number | null
  longitude: number | null
  scrapedAt: string | null
  geocodedAt: string | null
  createdAt: string
  updatedAt: string
}

export default function RepresentativeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [representative, setRepresentative] = useState<Representative | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchRepresentative = async () => {
      try {
        const response = await fetch(`/api/representatives/${params.id}`)

        if (!response.ok) {
          setError(true)
          return
        }

        const data = await response.json()
        setRepresentative(data.data)
      } catch (error) {
        console.error('Failed to fetch representative:', error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchRepresentative()
  }, [params.id])

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <Skeleton className="mx-auto mb-4 size-32 rounded-full" />
              <Skeleton className="mx-auto h-8 w-48" />
              <Skeleton className="mx-auto mt-2 h-4 w-32" />
            </CardHeader>
          </Card>
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !representative) {
    return (
      <div className="container py-8">
        <Link
          href="/representatives"
          className={buttonVariants({ variant: 'ghost', className: 'mb-6' })}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Representatives
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              Representative not found
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/representatives')}
            >
              View All Representatives
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="container py-8">
      <Link
        href="/representatives"
        className={buttonVariants({ variant: 'ghost', className: 'mb-6' })}
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to Representatives
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 size-32 overflow-hidden rounded-full bg-muted">
              {representative.imageUrl ? (
                <img
                  src={representative.imageUrl}
                  alt={representative.nameClean}
                  className="size-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      parent.innerHTML = `<div class="flex size-full items-center justify-center text-4xl font-bold text-muted-foreground">${representative.nameClean.charAt(0)}</div>`
                    }
                  }}
                />
              ) : (
                <div className="flex size-full items-center justify-center text-4xl font-bold text-muted-foreground">
                  {representative.nameClean.charAt(0)}
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">{representative.nameClean}</CardTitle>
            {representative.fatherName && (
              <p className="text-sm text-muted-foreground">
                S/O {representative.fatherName}
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge variant="default" className="text-sm">
                {representative.party}
              </Badge>
              {representative.province && (
                <Badge variant="secondary" className="text-sm">
                  {representative.province}
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Details Cards */}
        <div className="space-y-6 lg:col-span-2">
          {/* Constituency Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MapPin className="mr-2 size-5" />
                Constituency Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Constituency</p>
                <p className="text-base">
                  {representative.constituencyCode}
                  {representative.constituencyName &&
                    ` - ${representative.constituencyName}`}
                </p>
              </div>
              {representative.district && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">District</p>
                  <p className="text-base">{representative.district}</p>
                </div>
              )}
              {representative.province && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Province</p>
                  <p className="text-base">{representative.province}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          {(representative.phone ||
            representative.permanentAddress ||
            representative.islamabadAddress) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Phone className="mr-2 size-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {representative.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-base">
                      <a
                        href={`tel:${representative.phone}`}
                        className="text-primary hover:underline"
                      >
                        {representative.phone}
                      </a>
                    </p>
                  </div>
                )}
                {representative.permanentAddress && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      <Home className="mr-1 inline size-4" />
                      Permanent Address
                    </p>
                    <p className="text-base">{representative.permanentAddress}</p>
                  </div>
                )}
                {representative.islamabadAddress && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      <Building2 className="mr-1 inline size-4" />
                      Islamabad Address
                    </p>
                    <p className="text-base">{representative.islamabadAddress}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="mr-2 size-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {representative.oathTakingDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Oath Taking Date
                  </p>
                  <p className="text-base">{formatDate(representative.oathTakingDate)}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Political Party
                </p>
                <p className="text-base">{representative.party}</p>
              </div>
              {representative.profileUrl && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Official Profile
                  </p>
                  <a
                    href={representative.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-primary hover:underline"
                  >
                    View on na.gov.pk →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map Location */}
          {representative.latitude && representative.longitude && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="mr-2 size-5" />
                  Constituency Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${representative.longitude - 0.1},${representative.latitude - 0.1},${representative.longitude + 0.1},${representative.latitude + 0.1}&layer=mapnik&marker=${representative.latitude},${representative.longitude}`}
                    allowFullScreen
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Approximate constituency location
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
