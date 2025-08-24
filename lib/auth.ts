import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { db } from './database';

const secretKey = 'your-secret-key';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function getUser() {
  const session = cookies().get('session')?.value;
  if (!session) return null;

  try {
    const payload = await decrypt(session);
    const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(payload.userId);
    return user;
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  if (!session) return null;

  try {
    const payload = await decrypt(session);
    const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(payload.userId);
    return user;
  } catch (error) {
    return null;
  }
}