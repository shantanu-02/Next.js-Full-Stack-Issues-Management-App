'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, MessageSquare, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: number;
  email: string;
}

interface Issue {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_by: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  author?: User;
  assignee?: User;
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface IssuesListProps {
  currentUser: {
    id: number;
    email: string;
    role: string;
  };
}

export function IssuesList({ currentUser }: IssuesListProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
  });

  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    fetchIssues();
  }, [searchParams]);

  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const response = await fetch(`/api/issues?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to first page when filtering
    
    router.push(`/?${params}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/?${params}`);
  };

  const handleDelete = async (issueId: number) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    setIsDeleting(issueId);
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Optimistically remove from list
        setIssues(issues.filter(issue => issue.id !== issueId));
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to delete issue');
      }
    } catch (error) {
      alert('Failed to delete issue');
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleStatus = async (issue: Issue) => {
    const newStatus = issue.status === 'open' ? 'closed' : 'open';
    
    // Optimistic update
    setIssues(issues.map(i => 
      i.id === issue.id ? { ...i, status: newStatus } : i
    ));

    try {
      const response = await fetch(`/api/issues/${issue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...issue, status: newStatus }),
      });

      if (!response.ok) {
        // Revert optimistic update
        setIssues(issues.map(i => 
          i.id === issue.id ? { ...i, status: issue.status } : i
        ));
        const result = await response.json();
        alert(result.error || 'Failed to update issue');
      }
    } catch (error) {
      // Revert optimistic update
      setIssues(issues.map(i => 
        i.id === issue.id ? { ...i, status: issue.status } : i
      ));
      alert('Failed to update issue');
    }
  };

  const canEditIssue = (issue: Issue) => {
    return currentUser.role === 'admin' || issue.created_by === currentUser.id;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'open' ? 'default' : 'secondary';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search issues..."
                value={filters.search}
                onChange={(e) => updateFilters('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilters('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => updateFilters('priority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setFilters({ search: '', status: '', priority: '' });
                router.push('/');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      {issues.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No issues found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {issues.map((issue) => (
            <Card key={issue.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle 
                      className="text-lg mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => router.push(`/issues/${issue.id}`)}
                    >
                      {issue.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getStatusColor(issue.status)}>
                        {issue.status}
                      </Badge>
                      <Badge variant={getPriorityColor(issue.priority)}>
                        {issue.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(issue)}
                      disabled={!canEditIssue(issue)}
                    >
                      {issue.status === 'open' ? 'Close' : 'Reopen'}
                    </Button>
                    {canEditIssue(issue) && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/issues/${issue.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(issue.id)}
                          disabled={isDeleting === issue.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/issues/${issue.id}`)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3 line-clamp-2">{issue.description}</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <div>Created by {issue.author?.email} {formatDistanceToNow(new Date(issue.created_at))} ago</div>
                  {issue.assignee && (
                    <div>Assigned to {issue.assignee.email}</div>
                  )}
                  {issue.updated_at !== issue.created_at && (
                    <div>Updated {formatDistanceToNow(new Date(issue.updated_at))} ago</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pagination.total_pages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}