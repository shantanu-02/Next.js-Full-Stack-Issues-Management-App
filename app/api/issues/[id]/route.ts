import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { issueSchema } from '@/lib/validations';
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

    const issue = db.prepare(`
      SELECT 
        i.*,
        author.id as author_id,
        author.email as author_email,
        assignee.id as assignee_id,
        assignee.email as assignee_email
      FROM issues i
      LEFT JOIN users author ON i.created_by = author.id
      LEFT JOIN users assignee ON i.assigned_to = assignee.id
      WHERE i.id = ?
    `).get(issueId) as any;

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
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
      author: issue.author_id ? {
        id: issue.author_id,
        email: issue.author_email
      } : null,
      assignee: issue.assignee_id ? {
        id: issue.assignee_id,
        email: issue.assignee_email
      } : null,
    };

    return NextResponse.json(formattedIssue);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(request.headers.get('X-User-Id') || '0');
    const userRole = request.headers.get('X-User-Role');
    const issueId = parseInt(params.id);
    
    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    // Check if issue exists and get current data
    const existingIssue = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId) as any;
    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check permissions: admin can edit any issue, user can only edit their own
    if (userRole !== 'admin' && existingIssue.created_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = issueSchema.parse(body);

    db.prepare(`
      UPDATE issues 
      SET title = ?, description = ?, status = ?, priority = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.title,
      data.description,
      data.status,
      data.priority,
      data.assigned_to || null,
      issueId
    );

    // Get updated issue with user data
    const issue = db.prepare(`
      SELECT 
        i.*,
        author.id as author_id,
        author.email as author_email,
        assignee.id as assignee_id,
        assignee.email as assignee_email
      FROM issues i
      LEFT JOIN users author ON i.created_by = author.id
      LEFT JOIN users assignee ON i.assigned_to = assignee.id
      WHERE i.id = ?
    `).get(issueId) as any;

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
      author: issue.author_id ? {
        id: issue.author_id,
        email: issue.author_email
      } : null,
      assignee: issue.assignee_id ? {
        id: issue.assignee_id,
        email: issue.assignee_email
      } : null,
    };

    return NextResponse.json(formattedIssue);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(request.headers.get('X-User-Id') || '0');
    const userRole = request.headers.get('X-User-Role');
    const issueId = parseInt(params.id);
    
    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    // Check if issue exists
    const existingIssue = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId) as any;
    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check permissions: admin can delete any issue, user can only delete their own
    if (userRole !== 'admin' && existingIssue.created_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare('DELETE FROM issues WHERE id = ?').run(issueId);

    return NextResponse.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}