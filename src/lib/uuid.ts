/**
 * UUID Utility Functions
 * Provides consistent UUID generation for user identification
 */

/**
 * Generate a deterministic UUID based on email for consistency
 * In production, you'd want to store this mapping in the database
 */
export function generateUserUUID(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hashStr = Math.abs(hash).toString(16).padStart(32, '0');
  return `${hashStr.slice(0,8)}-${hashStr.slice(8,12)}-4${hashStr.slice(12,15)}-8${hashStr.slice(15,18)}-${hashStr.slice(18,30)}`;
}

/**
 * Generate a demo UUID for non-authenticated users
 * Using the real demo user ID from auth.users table
 */
export function generateDemoUUID(): string {
  // Real demo user ID created in Supabase auth.users
  return '9205d8ab-06b7-4983-b816-1071195c02c7';
}