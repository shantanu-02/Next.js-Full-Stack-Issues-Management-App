import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/database';
import { signupSchema } from '@/lib/validations';
import { encrypt } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hash(password, 12);
    const result = db.prepare(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)'
    ).run(email, hashedPassword, role);

    // Create session
    const user = { id: result.lastInsertRowid, email, role };
    const session = await encrypt({ userId: user.id });

    const response = NextResponse.json(
      { message: 'User created successfully', user: { id: user.id, email, role } },
      { status: 201 }
    );

    response.cookies.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
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