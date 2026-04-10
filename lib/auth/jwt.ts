import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret');

export type SessionPayload = {
  userId: string;
  storeId: string;
  roleCode: string;
  permissions: string[];
};

export async function signToken(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const result = await jwtVerify(token, secret);
    return result.payload as SessionPayload;
  } catch {
    return null;
  }
}
