"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, MessageSquare, ArrowLeft, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  email: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  priority: "low" | "medium" | "high";
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  author?: User;
  assignee?: User;
}

interface Comment {
  id: string;
  issue_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: User;
}

const commentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
});

type CommentForm = z.infer<typeof commentSchema>;

interface IssueDetailProps {
  issueId: string;
  currentUser: {
    id: string;
    email: string;
    role: string;
  };
}

export function IssueDetail({ issueId, currentUser }: IssueDetailProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
  });

  useEffect(() => {
    fetchIssue();
    fetchComments();
  }, [issueId]);

  const fetchIssue = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}`);
      if (response.ok) {
        const data = await response.json();
        setIssue(data);
      } else if (response.status === 404) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to fetch issue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this issue?")) return;

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/");
      } else {
        const result = await response.json();
        setError(result.error || "Failed to delete issue");
      }
    } catch (error) {
      setError("Failed to delete issue");
    }
  };

  const toggleStatus = async () => {
    if (!issue) return;

    const newStatus = issue.status === "open" ? "closed" : "open";

    // Optimistic update
    setIssue({ ...issue, status: newStatus });

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...issue, status: newStatus }),
      });

      if (!response.ok) {
        // Revert optimistic update
        setIssue({ ...issue, status: issue.status });
        const result = await response.json();
        setError(result.error || "Failed to update issue");
      }
    } catch (error) {
      // Revert optimistic update
      setIssue({ ...issue, status: issue.status });
      setError("Failed to update issue");
    }
  };

  const onSubmitComment = async (data: CommentForm) => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([...comments, newComment]);
        reset();
      } else {
        const result = await response.json();
        setError(result.error || "Failed to add comment");
      }
    } catch (error) {
      setError("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEditIssue = (issue: Issue) => {
    return currentUser.role === "admin" || issue.created_by === currentUser.id;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "open" ? "default" : "secondary";
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Issue not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Issue Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-3">{issue.title}</CardTitle>
              <div className="flex items-center gap-2 mb-3">
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
                variant="outline"
                onClick={toggleStatus}
                disabled={!canEditIssue(issue)}
              >
                {issue.status === "open" ? "Close Issue" : "Reopen Issue"}
              </Button>
              {canEditIssue(issue) && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/issues/${issue.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">
            {issue.description}
          </p>
          <div className="text-sm text-gray-500 space-y-1 border-t pt-3">
            <div>
              Created by {issue.author?.email}{" "}
              {formatDistanceToNow(new Date(issue.created_at))} ago
            </div>
            {issue.assignee && <div>Assigned to {issue.assignee.email}</div>}
            {issue.updated_at !== issue.created_at && (
              <div>
                Last updated {formatDistanceToNow(new Date(issue.updated_at))}{" "}
                ago
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Comment Form */}
          <form onSubmit={handleSubmit(onSubmitComment)} className="space-y-3">
            <Textarea
              {...register("content")}
              placeholder="Add a comment..."
              className="min-h-20"
            />
            {errors.content && (
              <p className="text-sm text-red-600 mt-1">
                {errors.content.message}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Comment
            </Button>
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No comments yet.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {comment.author?.email}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.created_at))} ago
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
