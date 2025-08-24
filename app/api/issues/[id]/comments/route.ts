import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { commentSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = parseInt(params.id);
    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    const comments = db.prepare(`
      SELECT 
        c.*,
        u.id as author_id,
        u.email as author_email
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.issue_id = ?
      ORDER BY c.created_at ASC
    `).all(issueId) as any[];

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      issue_id: comment.issue_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      author: comment.author_id ? {
        id: comment.author_id,
        email: comment.author_email
      } : null,
    }));

    return NextResponse.json(formattedComments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(request.headers.get('X-User-Id') || '0');
    const issueId = parseInt(params.id);
    
    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    // Check if issue exists
    const issue = db.prepare('SELECT id FROM issues WHERE id = ?').get(issueId);
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = commentSchema.parse(body);

    const result = db.prepare(`
      INSERT INTO comments (issue_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(issueId, userId, content);

    // Get the created comment with user data
    const comment = db.prepare(`
      SELECT 
        c.*,
        u.id as author_id,
        u.email as author_email
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid) as any;

    const formattedComment = {
      id: comment.id,
      issue_id: comment.issue_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      author: comment.author_id ? {
        id: comment.author_id,
        email: comment.author_email
      } : null,
    };

    return NextResponse.json(formattedComment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}