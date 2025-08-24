import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { issueSchema, issueQuerySchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = issueQuerySchema.parse(Object.fromEntries(searchParams));
    
    const page = parseInt(query.page);
    const pageSize = parseInt(query.page_size);
    const offset = (page - 1) * pageSize;

    let whereClause = '1=1';
    const params: any[] = [];

    if (query.status) {
      whereClause += ' AND i.status = ?';
      params.push(query.status);
    }

    if (query.priority) {
      whereClause += ' AND i.priority = ?';
      params.push(query.priority);
    }

    if (query.search) {
      whereClause += ' AND (i.title LIKE ? OR i.description LIKE ?)';
      params.push(`%${query.search}%`, `%${query.search}%`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM issues i 
      WHERE ${whereClause}
    `;
    const { total } = db.prepare(countQuery).get(...params) as { total: number };

    // Get issues with user data
    const issuesQuery = `
      SELECT 
        i.*,
        author.id as author_id,
        author.email as author_email,
        assignee.id as assignee_id,
        assignee.email as assignee_email
      FROM issues i
      LEFT JOIN users author ON i.created_by = author.id
      LEFT JOIN users assignee ON i.assigned_to = assignee.id
      WHERE ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const issues = db.prepare(issuesQuery).all(...params, pageSize, offset) as any[];

    const formattedIssues = issues.map(issue => ({
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
    }));

    return NextResponse.json({
      issues: formattedIssues,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get('X-User-Id') || '0');
    const body = await request.json();
    const data = issueSchema.parse(body);

    const result = db.prepare(`
      INSERT INTO issues (title, description, status, priority, created_by, assigned_to, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      data.title,
      data.description,
      data.status,
      data.priority,
      userId,
      data.assigned_to || null
    );

    // Get the created issue with user data
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
    `).get(result.lastInsertRowid) as any;

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

    return NextResponse.json(formattedIssue, { status: 201 });
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