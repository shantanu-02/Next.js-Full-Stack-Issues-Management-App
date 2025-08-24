import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/database";
import { commentSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = params.id;

    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        author:users!user_id(id, email)
      `
      )
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    const formattedComments =
      comments?.map((comment) => ({
        id: comment.id,
        issue_id: comment.issue_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        author: comment.author,
      })) || [];

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("X-User-Id") || "";
    const issueId = params.id;

    // Check if issue exists
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("id")
      .eq("id", issueId)
      .single();

    if (issueError) {
      if (issueError.code === "PGRST116") {
        return NextResponse.json({ error: "Issue not found" }, { status: 404 });
      }
      throw issueError;
    }

    const body = await request.json();
    const { content } = commentSchema.parse(body);

    const { data: comment, error: insertError } = await supabase
      .from("comments")
      .insert({
        issue_id: issueId,
        user_id: userId,
        content: content,
      })
      .select(
        `
        *,
        author:users!user_id(id, email)
      `
      )
      .single();

    if (insertError) {
      throw insertError;
    }

    const formattedComment = {
      id: comment.id,
      issue_id: comment.issue_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      author: comment.author,
    };

    return NextResponse.json(formattedComment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
