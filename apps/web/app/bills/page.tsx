'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, FileText, ChevronRight } from 'lucide-react';

// Define the type for a bill
interface Bill {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  summary?: string;
  passageDate?: string;
}

export default function BillsPage() {
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/bills');
        if (!response.ok) {
          throw new Error('Failed to fetch bills');
        }
        const data = await response.json();
        setAllBills(data);
        setFilteredBills(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  useEffect(() => {
    let filtered = allBills;

    if (searchQuery) {
      filtered = filtered.filter(bill =>
        bill.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.status === statusFilter);
    }

    setFilteredBills(filtered);
  }, [searchQuery, statusFilter, allBills]);

  const getStatusVariant = (status: string): "passed" | "pending" | "rejected" => {
    switch (status) {
      case 'passed': return 'passed';
      case 'rejected': return 'rejected';
      default: return 'pending';
    }
  };

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="border-b bg-white">
        <div className="container px-4 py-8">
          <nav className="mb-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="mx-2 inline size-4" />
            <span>Acts</span>
          </nav>
          <h1 className="mb-3 text-4xl font-bold text-primary">Browse Legislation</h1>
          <p className="text-lg text-muted-foreground">
            Explore bills and laws across all assemblies from 1973 to present
          </p>
        </div>
      </div>

      <div className="container px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filter Panel */}
          <aside className="lg:w-64">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Filters</h3>

              {/* Search */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">Search</label>
                <Input
                  type="text"
                  placeholder="Search bills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">Status</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="all"
                      checked={statusFilter === 'all'}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">All</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="passed"
                      checked={statusFilter === 'passed'}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Passed</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="pending"
                      checked={statusFilter === 'pending'}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Pending</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="rejected"
                      checked={statusFilter === 'rejected'}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Rejected</span>
                  </label>
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Reset Filters
              </Button>
            </Card>
          </aside>

          {/* Bills Grid */}
          <div className="flex-1">
            {loading && (
              <div className="grid gap-6 md:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <Skeleton key={index} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive bg-destructive/10 p-6 text-center">
                <p className="text-destructive">Error loading bills: {error}</p>
              </div>
            )}

            {!loading && !error && filteredBills.length === 0 && (
              <div className="rounded-xl border p-12 text-center">
                <FileText className="mx-auto mb-4 size-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No bills found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search term
                </p>
              </div>
            )}

            {!loading && !error && filteredBills.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredBills.map((bill) => (
                  <Card key={bill.id} hover className="flex flex-col">
                    <div className="flex-1 p-6">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <h2 className="text-xl font-semibold leading-tight text-foreground">
                          {bill.title}
                        </h2>
                      </div>

                      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant={getStatusVariant(bill.status)}>
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </Badge>
                        {bill.passageDate && (
                          <>
                            <span>•</span>
                            <span>{new Date(bill.passageDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>

                      {bill.summary && (
                        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                          {bill.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 border-t p-4">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/bills/${bill.id}`}>
                          <FileText className="mr-2 size-4" />
                          Read Full Text
                        </Link>
                      </Button>
                      <Button size="sm" asChild className="flex-1">
                        <Link href={`/chat?bill=${bill.id}`}>
                          <MessageCircle className="mr-2 size-4" />
                          Chat About This
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
