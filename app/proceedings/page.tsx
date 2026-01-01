'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

interface Proceeding {
  id: string;
  title: string;
  date: string;
  createdAt: string;
}

interface ProceedingsResponse {
  data: Proceeding[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function ProceedingsPage() {
  const [proceedings, setProceedings] = useState<Proceeding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const fetchProceedings = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          ...(searchQuery && { search: searchQuery }),
        });
        const response = await fetch(`/api/proceedings?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch proceedings');
        }
        const data: ProceedingsResponse = await response.json();
        setProceedings(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProceedings();
  }, [currentPage, searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">Parliamentary Proceedings</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search proceedings by title..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500">Error loading proceedings: {error}</p>
      )}

      {!loading && !error && (
        <>
          {proceedings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No proceedings found matching your search.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                {proceedings.map((proceeding) => (
                  <Link
                    key={proceeding.id}
                    href={`/proceedings/${proceeding.id}`}
                    className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">{proceeding.title}</h2>
                      <span className="text-gray-500">
                        {format(new Date(proceeding.date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center gap-4">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
                <p className="text-sm text-muted-foreground">
                  Showing {proceedings.length} of {pagination.totalCount} proceedings
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
} 