import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/database";
import { issueSchema, issueQuerySchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = issueQuerySchema.parse(Object.fromEntries(searchParams));

    const page = parseInt(query.page);
    const pageSize = parseInt(query.page_size);
    const offset = (page - 1) * pageSize;

    // Build query
    let supabaseQuery = supabase.from("issues").select(`
        *,
        author:users!created_by(id, email),
        assignee:users!assigned_to(id, email)
      `);

    // Apply filters
    if (query.status) {
      supabaseQuery = supabaseQuery.eq("status", query.status);
    }

    if (query.priority) {
      supabaseQuery = supabaseQuery.eq("priority", query.priority);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
      );
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from("issues")
      .select("*", { count: "exact", head: true });

    if (countError) {
      throw countError;
    }

    // Get issues with pagination
    const { data: issues, error: issuesError } = await supabaseQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (issuesError) {
      throw issuesError;
    }

    const formattedIssues =
      issues?.map((issue) => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        created_by: issue.created_by,
        assigned_to: issue.assigned_to,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        author: issue.author,
        assignee: issue.assignee,
      })) || [];

    return NextResponse.json({
      issues: formattedIssues,
      pagination: {
        page,
        page_size: pageSize,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-Id") || "";
    const body = await request.json();
    const data = issueSchema.parse(body);

    const { data: issue, error } = await supabase
      .from("issues")
      .insert({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        created_by: userId,
        assigned_to: data.assigned_to || null,
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        author:users!created_by(id, email),
        assignee:users!assigned_to(id, email)
      `
      )
      .single();

    if (error) {
      throw error;
    }

    const formattedIssue = {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      created_by: issue.created_by,
      assigned_to: issue.assigned_to,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      author: issue.author,
      assignee: issue.assignee,
    };

    return NextResponse.json(formattedIssue, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
