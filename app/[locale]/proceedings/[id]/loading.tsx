import { Skeleton } from "@/components/ui/skeleton"

export default function ProceedingDetailLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-3xl">
        {/* Back arrow */}
        <Skeleton className="mb-6 h-4 w-4" />

        {/* Title + Date */}
        <div className="mb-6">
          <Skeleton className="mb-2 h-9 w-3/4" />
          <Skeleton className="h-5 w-40" />
        </div>

        {/* Summary section */}
        <div>
          <Skeleton className="mb-4 h-7 w-28" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}
