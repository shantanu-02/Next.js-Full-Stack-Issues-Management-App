import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/database";
import { issueSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = params.id;

    const { data: issue, error } = await supabase
      .from("issues")
      .select(
        `
        *,
        author:users!created_by(id, email),
        assignee:users!assigned_to(id, email)
      `
      )
      .eq("id", issueId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Issue not found" }, { status: 404 });
      }
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

    return NextResponse.json(formattedIssue);
  } catch (error) {
    console.error("Error fetching issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("X-User-Id") || "";
    const userRole = request.headers.get("X-User-Role");
    const issueId = params.id;

    // Check if issue exists and get current data
    const { data: existingIssue, error: fetchError } = await supabase
      .from("issues")
      .select("*")
      .eq("id", issueId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Issue not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Check permissions: admin can edit any issue, user can only edit their own
    if (userRole !== "admin" && existingIssue.created_by !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = issueSchema.parse(body);

    const { data: issue, error: updateError } = await supabase
      .from("issues")
      .update({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigned_to: data.assigned_to || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId)
      .select(
        `
        *,
        author:users!created_by(id, email),
        assignee:users!assigned_to(id, email)
      `
      )
      .single();

    if (updateError) {
      throw updateError;
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

    return NextResponse.json(formattedIssue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("X-User-Id") || "";
    const userRole = request.headers.get("X-User-Role");
    const issueId = params.id;

    // Check if issue exists
    const { data: existingIssue, error: fetchError } = await supabase
      .from("issues")
      .select("*")
      .eq("id", issueId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Issue not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Check permissions: admin can delete any issue, user can only delete their own
    if (userRole !== "admin" && existingIssue.created_by !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("issues")
      .delete()
      .eq("id", issueId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
