'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

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
      } else {
        setError('Invalid password');
      }
    } catch (error) {
      setError('Something went wrong');
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('adminAuthorized') === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  if (!isAuthorized) {
    return (
      <div className="container max-w-md py-8">
        <h1 className="mb-8 text-2xl font-bold">Admin Access</h1>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button onClick={() => checkPassword(password)}>Submit</Button>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setUploadProgress(0);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    try {
      // Create upload record
      const uploadResponse = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to create upload record');
      }

      const upload = await uploadResponse.json();
      setMessage('Upload started. You can monitor progress in the dashboard.');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);

    } catch (error) {
      setMessage('Error: ' + (error as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Upload Document</h1>
        <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
          View Dashboard
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Document Title</Label>
          <Input id="title" name="title" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Document Type</Label>
          <Select 
            name="type" 
            required
            onValueChange={(value) => setDocumentType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="constitution">Constitution</SelectItem>
              <SelectItem value="election_law">Election Law</SelectItem>
              <SelectItem value="parliamentary_bulletin">Parliamentary Bulletin</SelectItem>
              <SelectItem value="bill">National Assembly Bill</SelectItem>
              <SelectItem value="amendment">Amendment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {documentType === 'parliamentary_bulletin' && (
          <div className="space-y-2">
            <Label htmlFor="date">Bulletin Date</Label>
            <Input 
              id="date" 
              name="date" 
              type="date" 
              required={documentType === 'parliamentary_bulletin'}
            />
          </div>
        )}

        {documentType === 'bill' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill Number</Label>
              <Input 
                id="billNumber" 
                name="billNumber" 
                required={documentType === 'bill'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionNumber">Session Number</Label>
              <Input 
                id="sessionNumber" 
                name="sessionNumber" 
                required={documentType === 'bill'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Bill Status</Label>
              <Select 
                name="status" 
                required={documentType === 'bill'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passageDate">Passage Date</Label>
              <Input 
                id="passageDate" 
                name="passageDate" 
                type="date"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="file">PDF File</Label>
          <Input id="file" name="file" type="file" accept=".pdf" required />
        </div>

        {uploadProgress > 0 && (
          <div className="space-y-2">
            <Label>Upload Progress</Label>
            <Progress value={uploadProgress} />
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Starting Upload...' : 'Upload Document'}
        </Button>

        {message && (
          <p className={`mt-4 ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
} 