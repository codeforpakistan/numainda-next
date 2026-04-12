import { Skeleton } from "@/components/ui/skeleton"

export default function BillDetailLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-3xl">
        {/* Title */}
        <Skeleton className="mb-6 h-9 w-3/4" />

        {/* Status + Passage Date grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Skeleton className="mb-1 h-4 w-12" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <div>
            <Skeleton className="mb-1 h-4 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
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
