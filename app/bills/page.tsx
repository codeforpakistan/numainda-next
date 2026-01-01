'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

// Define the type for a bill
interface Bill {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  billNumber?: string;
}

interface BillsResponse {
  data: Bill[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function BillsPage() {
  const [allBills, setAllBills] = useState<Bill[]>([]);
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
    const fetchBills = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          ...(searchQuery && { search: searchQuery }),
        });
        const response = await fetch(`/api/bills?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bills');
        }
        const data: BillsResponse = await response.json();
        setAllBills(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [currentPage, searchQuery]);

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Acts of Parliament</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search bills by title, number, or status..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="grid gap-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500">Error loading bills: {error}</p>
      )}

      {!loading && !error && (
        <>
          {allBills.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No bills found matching your search.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 mb-8">
                {allBills.map((bill) => (
                  <Link
                    key={bill.id}
                    href={`/bills/${bill.id}`}
                    className="block p-6 rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
                  >
                    <h2 className="text-xl font-semibold mb-2 tracking-tight">{bill.title}</h2>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-medium
                        ${getStatusClassName(bill.status)}
                      `}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
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
                  Showing {allBills.length} of {pagination.totalCount} bills
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
} 
