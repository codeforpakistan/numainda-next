'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, FileText, MessageCircle, Calendar, FileCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Bill {
  id: string;
  title: string;
  status: string;
  summary: string;
  originalText?: string;
  createdAt: string;
  passageDate?: string;
}

export default function BillPage() {
  const params = useParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'fulltext'>('summary');

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const response = await fetch(`/api/bills/${params.id}`);
        if (!response.ok) {
          throw new Error('Bill not found');
        }
        const data = await response.json();
        setBill(data);
      } catch (error) {
        console.error('Error fetching bill:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [params.id]);

  const getStatusVariant = (status: string): "passed" | "pending" | "rejected" => {
    switch (status) {
      case 'passed': return 'passed';
      case 'rejected': return 'rejected';
      default: return 'pending';
    }
  };

  if (loading) {
    return (
      <div className="container px-4 py-8">
        <Skeleton className="mb-4 h-8 w-3/4" />
        <Skeleton className="mb-8 h-6 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="container px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Bill not found</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Bill Header */}
      <div className="border-b bg-white">
        <div className="container px-4 py-8">
          <nav className="mb-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="mx-2 inline size-4" />
            <Link href="/bills" className="hover:text-primary">Acts</Link>
            <ChevronRight className="mx-2 inline size-4" />
            <span>Bill Details</span>
          </nav>

          <h1 className="mb-4 text-3xl font-bold text-primary md:text-4xl">
            {bill.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Badge variant={getStatusVariant(bill.status)}>
              {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
            </Badge>
            {bill.passageDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4" />
                <span>{new Date(bill.passageDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-white">
        <div className="container px-4">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('summary')}
              className={`relative border-b-2 py-4 text-base font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'border-accent text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('fulltext')}
              className={`relative border-b-2 py-4 text-base font-medium transition-colors ${
                activeTab === 'fulltext'
                  ? 'border-accent text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Full Text
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container px-4 py-8">
        {activeTab === 'summary' && (
          <div className="mx-auto max-w-4xl space-y-8">
            {/* AI Summary Card */}
            <Card className="border-l-4 border-l-accent bg-secondary-bg">
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <MessageCircle className="size-5 text-accent" />
                  <h2 className="text-lg font-semibold text-foreground">AI-Generated Summary</h2>
                </div>

                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown>{bill.summary}</ReactMarkdown>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
                  <span>Generated by Numainda AI</span>
                  <Button variant="link" size="sm" asChild>
                    <Link href={`/chat?bill=${bill.id}`}>
                      View Sources →
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Key Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6 text-center">
                <FileText className="mx-auto mb-2 size-8 text-primary" />
                <div className="text-2xl font-bold text-primary">
                  {bill.originalText?.split(' ').length || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Words</div>
              </Card>
              <Card className="p-6 text-center">
                <FileCheck className="mx-auto mb-2 size-8 text-primary" />
                <div className="text-2xl font-bold text-primary">
                  {bill.summary?.split('\n').filter(s => s.trim()).length || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Key Points</div>
              </Card>
              <Card className="p-6 text-center">
                <Calendar className="mx-auto mb-2 size-8 text-primary" />
                <div className="text-2xl font-bold text-primary">
                  {bill.passageDate
                    ? Math.ceil(
                        (new Date(bill.passageDate).getTime() - new Date(bill.createdAt).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Days to Passage</div>
              </Card>
            </div>

            {/* Chat Widget */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="p-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  Questions about this bill?
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Chat with our AI to understand the implications, key provisions, and how this affects you.
                </p>
                <Button asChild>
                  <Link href={`/chat?bill=${bill.id}`}>
                    <MessageCircle className="mr-2 size-4" />
                    Start Chatting
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'fulltext' && (
          <div className="mx-auto max-w-4xl">
            <Card className="p-8">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{bill.originalText || bill.summary}</ReactMarkdown>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 