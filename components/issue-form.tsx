'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const issueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['open', 'closed']).optional().default('open'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  assigned_to: z.number().optional(),
});

type IssueForm = z.infer<typeof issueSchema>;

interface User {
  id: number;
  email: string;
  role: string;
}

interface Issue {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: number;
}

interface IssueFormProps {
  issue?: Issue;
  mode: 'create' | 'edit';
}

export function IssueForm({ issue, mode }: IssueFormProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IssueForm>({
    resolver: zodResolver(issueSchema),
    defaultValues: issue ? {
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      assigned_to: issue.assigned_to,
    } : {
      status: 'open',
      priority: 'medium',
    },
  });

  const watchedStatus = watch('status');
  const watchedPriority = watch('priority');
  const watchedAssignedTo = watch('assigned_to');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const onSubmit = async (data: IssueForm) => {
    setIsLoading(true);
    setError('');

    try {
      const url = mode === 'create' ? '/api/issues' : `/api/issues/${issue?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save issue');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Create New Issue' : 'Edit Issue'}
          </CardTitle>
          <CardDescription>
            {mode === 'create'
              ? 'Describe the issue you want to report'
              : 'Update the issue details'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter issue title"
                className="w-full"
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe the issue in detail"
                className="w-full min-h-32"
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={watchedStatus}
                  onValueChange={(value) => setValue('status', value as 'open' | 'closed')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={watchedPriority}
                  onValueChange={(value) => setValue('priority', value as 'low' | 'medium' | 'high')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select
                  value={watchedAssignedTo?.toString()}
                  onValueChange={(value) => setValue('assigned_to', value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Issue' : 'Update Issue'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}