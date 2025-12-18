'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from 'date-fns';

type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface DocumentUpload {
  id: string;
  status: UploadStatus;
  originalFileName: string;
  fileSize: number;
  uploadProgress: number;
  processingProgress: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const checkPassword = async (inputPassword: string) => {
    try {
      const response = await fetch('/api/admin/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: inputPassword }),
      });
      
      if (response.ok) {
        setIsAuthorized(true);
        sessionStorage.setItem('adminAuthorized', 'true');
        fetchUploads();
      } else {
        setError('Invalid password');
      }
    } catch (error) {
      setError('Something went wrong');
    }
  };

  const fetchUploads = async () => {
    try {
      const response = await fetch('/api/admin/uploads');
      const data = await response.json();
      setUploads(data);
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('adminAuthorized') === 'true') {
      setIsAuthorized(true);
      fetchUploads();
    }
  }, []);

  if (!isAuthorized) {
    return (
      <div className="container max-w-md py-8">
        <h1 className="mb-8 text-2xl font-bold">Admin Access</h1>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
          <Button onClick={() => checkPassword(password)}>Submit</Button>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: UploadStatus) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'success',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Upload Dashboard</h1>
        <Button onClick={fetchUploads}>Refresh</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Upload Progress</TableHead>
              <TableHead>Processing Progress</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploads.map((upload) => (
              <TableRow key={upload.id}>
                <TableCell className="font-medium">{upload.originalFileName}</TableCell>
                <TableCell>{getStatusBadge(upload.status)}</TableCell>
                <TableCell>{formatFileSize(upload.fileSize)}</TableCell>
                <TableCell>
                  <Progress value={upload.uploadProgress} className="w-[100px]" />
                </TableCell>
                <TableCell>
                  <Progress value={upload.processingProgress} className="w-[100px]" />
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(upload.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-red-500">
                  {upload.error || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 