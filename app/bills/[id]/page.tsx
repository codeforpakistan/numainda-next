import { db } from '@/lib/db';
import { bills } from '@/lib/db/schema/bills';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown'
import { BillViewTracker } from '@/components/bill-view-tracker'

export default async function BillPage({ params }: { params: { id: string } }) {
  const [bill] = await db
    .select()
    .from(bills)
    .where(eq(bills.id, params.id));

  if (!bill) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <BillViewTracker billId={bill.id} />
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold">{bill.title}</h1>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* <div>
            <p className="text-sm text-gray-600">Bill Number</p>
            <p className="font-medium">{bill.billNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Session Number</p>
            <p className="font-medium">{bill.sessionNumber}</p>
          </div> */}
          <div>
            <p className="text-sm">Status</p>
            <p className={`inline-block px-2 py-1 rounded-full text-sm
              ${bill.status === 'passed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                bill.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}
            `}>
              {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
            </p>
          </div>
          {bill.passageDate && (
            <div>
              <p className="text-sm">Passage Date</p>
              <p className="font-medium">
                {new Date(bill.passageDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
        <div className="prose max-w-none dark:prose-invert">
          <h2 className="mb-4 text-xl font-semibold">Summary</h2>
          <div className="whitespace-pre-wrap"><ReactMarkdown>{bill.summary}</ReactMarkdown></div>
        </div>
      </div>
    </div>
  );
} 