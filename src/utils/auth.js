/**
 * Database utility functions
 */

// Simple SHA-256 hashing function for passwords
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Verify password against hash
export async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Generate JWT token (simple implementation)
export async function generateToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = await hashPassword(`${encodedHeader}.${encodedPayload}.${secret}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify JWT token
export async function verifyToken(token, secret) {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    const expectedSignature = await hashPassword(`${encodedHeader}.${encodedPayload}.${secret}`);

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(atob(encodedPayload));

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}
