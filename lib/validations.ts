import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "admin"]).optional().default("user"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const issueSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["open", "closed"]).optional().default("open"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  assigned_to: z.string().uuid().optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
});

export const issueQuerySchema = z.object({
  page: z.string().optional().default("1"),
  page_size: z.string().optional().default("10"),
  status: z.enum(["open", "closed"]).optional(),
  search: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});
