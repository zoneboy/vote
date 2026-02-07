// ============================================================================
// PRODUCTION DATABASE LAYER - Complete with All Security Fixes
// ============================================================================
// Includes:
// - Serverless-optimized connection pooling (CRITICAL for Netlify/Vercel)
// - Vote manipulation prevention (SECURITY FIX)
// - Session management with IP binding (SECURITY FIX)
// - All original database functions
// ============================================================================

import postgres from 'postgres';
import type { Category, Nominee, Vote, User, Settings } from '@/types';

// ============================================================================
// SERVERLESS-OPTIMIZED DATABASE CONNECTION
// ============================================================================

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isServerless = !!(process.env.NETLIFY || process.env.VERCEL);

// Connection string selection
// Priority: POOLER_URL (serverless) > DATABASE_URL (direct)
const connectionString = process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_POOLER_URL must be set');
}

// Log connection info (non-sensitive)
console.log('[DB] Initializing:', {
  type: process.env.DATABASE_POOLER_URL ? 'POOLED' : 'DIRECT',
  env: isProduction ? 'production' : 'development',
  serverless: isServerless,
});

// Serverless-optimized PostgreSQL connection
const sql = postgres(connectionString, {
  // CRITICAL: In serverless, use 1 connection per instance
  // External pooler (Neon/PgBouncer) handles the actual pooling
  // In traditional server, use larger pool
  max: isServerless ? 1 : 10,
  
  // Aggressive timeouts for serverless (fail fast)
  idle_timeout: isServerless ? 10 : 30,      // Close idle connections quickly
  connect_timeout: 10,                        // Fail fast on connection issues
  max_lifetime: isServerless ? 60 * 10 : 60 * 60,  // Recycle connections
  
  // Better application identification
  connection: {
    application_name: `voting-${isProduction ? 'prod' : 'dev'}`,
  },
  
  // Prevent hanging queries (30 second timeout)
  statement_timeout: 30000,
  
  // Transform snake_case to camelCase automatically
  transform: postgres.camel,
  
  // Debug mode (only in development with explicit flag)
  debug: !isProduction && process.env.DEBUG_SQL === 'true',
});

// ============================================================================
// HEALTH CHECK & MONITORING
// ============================================================================

/**
 * Check database connectivity
 * Use in health check endpoints
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await sql`SELECT 1 as health_check`;
    return true;
  } catch (error) {
    console.error('[DB] Health check failed:', error);
    return false;
  }
}

/**
 * Get connection pool statistics
 * Useful for monitoring and debugging
 */
export function getPoolStats() {
  return {
    maxConnections: isServerless ? 1 : 10,
    environment: isProduction ? 'production' : 'development',
    isPooled: !!process.env.DATABASE_POOLER_URL,
    isServerless,
    connectionType: process.env.DATABASE_POOLER_URL ? 'pooled' : 'direct',
  };
}

// Graceful shutdown (development only)
if (!isProduction) {
  const cleanup = async () => {
    console.log('[DB] Closing connections...');
    await sql.end({ timeout: 5 });
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function createUser(email: string): Promise<User> {
  const [user] = await sql<User[]>`
    INSERT INTO users (email, is_admin, created_at)
    VALUES (${email}, false, NOW())
    ON CONFLICT (email) DO UPDATE
    SET last_login = NOW()
    RETURNING id, email, is_admin as "isAdmin", created_at as "createdAt", last_login as "lastLogin"
  `;
  return user as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await sql<User[]>`
    SELECT id, email, is_admin as "isAdmin", created_at as "createdAt", last_login as "lastLogin"
    FROM users
    WHERE email = ${email}
  `;
  return user || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await sql<User[]>`
    SELECT id, email, is_admin as "isAdmin", created_at as "createdAt", last_login as "lastLogin"
    FROM users
    WHERE id = ${id}
  `;
  return user || null;
}

export async function makeUserAdmin(email: string): Promise<boolean> {
  const result = await sql`
    UPDATE users
    SET is_admin = true
    WHERE email = ${email}
  `;
  return result.count > 0;
}

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

export async function getAllCategories(): Promise<Category[]> {
  const categories = await sql<Category[]>`
    SELECT id, name, description, display_order as "displayOrder", 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM categories
    ORDER BY display_order ASC, name ASC
  `;
  return categories;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const [category] = await sql<Category[]>`
    SELECT id, name, description, display_order as "displayOrder",
           created_at as "createdAt", updated_at as "updatedAt"
    FROM categories
    WHERE id = ${id}
  `;
  return category || null;
}

export async function createCategory(data: {
  name: string;
  description?: string;
  displayOrder?: number;
}): Promise<Category> {
  const [category] = await sql<Category[]>`
    INSERT INTO categories (name, description, display_order)
    VALUES (${data.name}, ${data.description || null}, ${data.displayOrder || 0})
    RETURNING id, name, description, display_order as "displayOrder",
              created_at as "createdAt", updated_at as "updatedAt"
  `;
  return category as Category;
}

export async function updateCategory(
  id: string,
  data: { name?: string; description?: string; displayOrder?: number }
): Promise<Category | null> {
  const updates: any = {};
  
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.displayOrder !== undefined) updates.display_order = data.displayOrder;

  if (Object.keys(updates).length === 0) return getCategoryById(id);

  updates.updated_at = sql`NOW()`;

  const [category] = await sql<Category[]>`
    UPDATE categories
    SET ${sql(updates)}
    WHERE id = ${id}
    RETURNING id, name, description, display_order as "displayOrder",
              created_at as "createdAt", updated_at as "updatedAt"
  `;
  return category || null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const result = await sql`DELETE FROM categories WHERE id = ${id}`;
  return result.count > 0;
}

// ============================================================================
// NOMINEE OPERATIONS
// ============================================================================

export async function getNomineesByCategory(categoryId: string): Promise<Nominee[]> {
  const nominees = await sql<Nominee[]>`
    SELECT id, category_id as "categoryId", name, description, image_url as "imageUrl",
           display_order as "displayOrder", created_at as "createdAt"
    FROM nominees
    WHERE category_id = ${categoryId}
    ORDER BY display_order ASC, name ASC
  `;
  return nominees;
}

export async function getNomineeById(id: string): Promise<Nominee | null> {
  const [nominee] = await sql<Nominee[]>`
    SELECT id, category_id as "categoryId", name, description, image_url as "imageUrl",
           display_order as "displayOrder", created_at as "createdAt"
    FROM nominees
    WHERE id = ${id}
  `;
  return nominee || null;
}

export async function createNominee(data: {
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
}): Promise<Nominee> {
  const [nominee] = await sql<Nominee[]>`
    INSERT INTO nominees (category_id, name, description, image_url, display_order)
    VALUES (${data.categoryId}, ${data.name}, ${data.description || null}, 
            ${data.imageUrl || null}, ${data.displayOrder || 0})
    RETURNING id, category_id as "categoryId", name, description, image_url as "imageUrl",
              display_order as "displayOrder", created_at as "createdAt"
  `;
  return nominee as Nominee;
}

export async function updateNominee(
  id: string,
  data: { name?: string; description?: string; imageUrl?: string; displayOrder?: number }
): Promise<Nominee | null> {
  const updates: any = {};
  
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.imageUrl !== undefined) updates.image_url = data.imageUrl;
  if (data.displayOrder !== undefined) updates.display_order = data.displayOrder;

  if (Object.keys(updates).length === 0) return getNomineeById(id);

  const [nominee] = await sql<Nominee[]>`
    UPDATE nominees
    SET ${sql(updates)}
    WHERE id = ${id}
    RETURNING id, category_id as "categoryId", name, description, image_url as "imageUrl",
              display_order as "displayOrder", created_at as "createdAt"
  `;
  return nominee || null;
}

export async function deleteNominee(id: string): Promise<boolean> {
  const result = await sql`DELETE FROM nominees WHERE id = ${id}`;
  return result.count > 0;
}

// ============================================================================
// VOTE OPERATIONS (WITH SECURITY FIX)
// ============================================================================

/**
 * SECURITY FIX: Cast a vote - FINAL and IMMUTABLE
 * Prevents vote manipulation by rejecting duplicate votes
 * @throws Error if user has already voted in this category
 */
export async function castVote(data: {
  userId: string;
  categoryId: string;
  nomineeId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<Vote> {
  // SECURITY: Check if already voted BEFORE attempting insert
  const existing = await hasUserVotedInCategory(data.userId, data.categoryId);
  if (existing) {
    throw new Error('You have already voted in this category. Votes are final and cannot be changed.');
  }

  // SECURITY: Use INSERT-only with NO UPDATE clause
  // This prevents any vote manipulation even if check is bypassed
  try {
    const [vote] = await sql<Vote[]>`
      INSERT INTO votes (user_id, category_id, nominee_id, ip_address, user_agent)
      VALUES (${data.userId}, ${data.categoryId}, ${data.nomineeId}, 
              ${data.ipAddress || null}, ${data.userAgent || null})
      RETURNING id, user_id as "userId", category_id as "categoryId", 
                nominee_id as "nomineeId", ip_address as "ipAddress",
                user_agent as "userAgent", voted_at as "votedAt"
    `;
    
    return vote as Vote;
  } catch (error: any) {
    // Catch unique constraint violation
    if (error.code === '23505') { // PostgreSQL unique violation
      throw new Error('Vote already recorded for this category');
    }
    throw error;
  }
}

export async function getUserVotes(userId: string): Promise<Vote[]> {
  const votes = await sql<Vote[]>`
    SELECT id, user_id as "userId", category_id as "categoryId",
           nominee_id as "nomineeId", ip_address as "ipAddress",
           user_agent as "userAgent", voted_at as "votedAt"
    FROM votes
    WHERE user_id = ${userId}
    ORDER BY voted_at DESC
  `;
  return votes;
}

export async function hasUserVotedInCategory(
  userId: string,
  categoryId: string
): Promise<boolean> {
  const [result] = await sql<{ count: string }[]>`
    SELECT COUNT(*) as count
    FROM votes
    WHERE user_id = ${userId} AND category_id = ${categoryId}
  `;
  return parseInt(result.count) > 0;
}

export async function getVoteCountByNominee(nomineeId: string): Promise<number> {
  const [result] = await sql<{ count: string }[]>`
    SELECT COUNT(*) as count
    FROM votes
    WHERE nominee_id = ${nomineeId}
  `;
  return parseInt(result.count);
}

export async function getVoteCountByCategory(categoryId: string): Promise<number> {
  const [result] = await sql<{ count: string }[]>`
    SELECT COUNT(*) as count
    FROM votes
    WHERE category_id = ${categoryId}
  `;
  return parseInt(result.count);
}

export async function getCategoryResults(categoryId: string) {
  const results = await sql<Array<{
    nomineeId: string;
    nomineeName: string;
    voteCount: string;
  }>>`
    SELECT 
      n.id as "nomineeId",
      n.name as "nomineeName",
      COUNT(v.id) as "voteCount"
    FROM nominees n
    LEFT JOIN votes v ON v.nominee_id = n.id
    WHERE n.category_id = ${categoryId}
    GROUP BY n.id, n.name
    ORDER BY "voteCount" DESC, n.name ASC
  `;
  return results;
}

export async function getAllResults() {
  const results = await sql<Array<{
    categoryId: string;
    categoryName: string;
    nomineeId: string;
    nomineeName: string;
    voteCount: string;
  }>>`
    SELECT 
      c.id as "categoryId",
      c.name as "categoryName",
      n.id as "nomineeId",
      n.name as "nomineeName",
      COUNT(v.id) as "voteCount"
    FROM categories c
    LEFT JOIN nominees n ON n.category_id = c.id
    LEFT JOIN votes v ON v.nominee_id = n.id
    GROUP BY c.id, c.name, n.id, n.name
    ORDER BY c.display_order ASC, "voteCount" DESC
  `;
  return results;
}

// ============================================================================
// SESSION OPERATIONS (WITH SECURITY ENHANCEMENTS)
// ============================================================================

/**
 * Create session with IP binding (security enhancement)
 */
export async function createSession(data: {
  id: string;
  userId: string;
  email: string;
  expiresAt: Date;
  ipAddress?: string;
}) {
  await sql`
    INSERT INTO sessions (id, user_id, email, expires_at, ip_address, last_activity)
    VALUES (${data.id}, ${data.userId}, ${data.email}, ${data.expiresAt}, 
            ${data.ipAddress || null}, NOW())
  `;
}

/**
 * Get session with all security metadata
 */
export async function getSession(sessionId: string) {
  const [session] = await sql<Array<{
    id: string;
    userId: string;
    email: string;
    expiresAt: Date;
    ipAddress?: string;
    lastActivity?: Date;
    createdAt?: Date;
  }>>`
    SELECT 
      id, 
      user_id as "userId", 
      email, 
      expires_at as "expiresAt",
      ip_address as "ipAddress",
      last_activity as "lastActivity",
      created_at as "createdAt"
    FROM sessions
    WHERE id = ${sessionId} AND expires_at > NOW()
  `;
  return session || null;
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string) {
  await sql`
    UPDATE sessions 
    SET last_activity = NOW() 
    WHERE id = ${sessionId}
  `;
}

/**
 * Delete session (logout)
 */
export async function deleteSession(sessionId: string) {
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions() {
  await sql`DELETE FROM sessions WHERE expires_at < NOW()`;
}

// ============================================================================
// SETTINGS OPERATIONS
// ============================================================================

export async function getSetting(key: string): Promise<string | null> {
  const [setting] = await sql<{ value: string }[]>`
    SELECT value FROM settings WHERE key = ${key}
  `;
  return setting?.value || null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES (${key}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = ${value}, updated_at = NOW()
  `;
}

export async function getSettings(): Promise<Settings> {
  const votingOpen = (await getSetting('voting_open')) === 'true';
  const resultsPublic = (await getSetting('results_public')) === 'true';
  const maintenanceMode = (await getSetting('maintenance_mode')) === 'true';
  const votingStartDate = await getSetting('voting_start_date');
  const votingEndDate = await getSetting('voting_end_date');
  const maxVotesPerIp = await getSetting('max_votes_per_ip');

  return {
    votingOpen,
    resultsPublic,
    maintenanceMode,
    votingStartDate: votingStartDate ? new Date(votingStartDate) : undefined,
    votingEndDate: votingEndDate ? new Date(votingEndDate) : undefined,
    maxVotesPerIp: maxVotesPerIp ? parseInt(maxVotesPerIp) : undefined,
  };
}

// ============================================================================
// STATISTICS & ADMIN
// ============================================================================

export async function getAdminStats() {
  const [stats] = await sql<Array<{
    totalVotes: string;
    totalUsers: string;
    totalCategories: string;
    totalNominees: string;
  }>>`
    SELECT 
      (SELECT COUNT(*) FROM votes) as "totalVotes",
      (SELECT COUNT(*) FROM users) as "totalUsers",
      (SELECT COUNT(*) FROM categories) as "totalCategories",
      (SELECT COUNT(*) FROM nominees) as "totalNominees"
  `;

  const recentVotes = await sql<Array<{
    id: string;
    votedAt: Date;
    email: string;
    categoryName: string;
    nomineeName: string;
  }>>`
    SELECT v.id, v.voted_at as "votedAt", u.email, c.name as "categoryName", n.name as "nomineeName"
    FROM votes v
    JOIN users u ON u.id = v.user_id
    JOIN categories c ON c.id = v.category_id
    JOIN nominees n ON n.id = v.nominee_id
    ORDER BY v.voted_at DESC
    LIMIT 10
  `;

  const topCategories = await sql<Array<{
    categoryId: string;
    name: string;
    voteCount: string;
  }>>`
    SELECT c.id as "categoryId", c.name, COUNT(v.id) as "voteCount"
    FROM categories c
    LEFT JOIN votes v ON v.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY "voteCount" DESC
    LIMIT 5
  `;

  return {
    totalVotes: parseInt(stats.totalVotes),
    totalUsers: parseInt(stats.totalUsers),
    totalCategories: parseInt(stats.totalCategories),
    totalNominees: parseInt(stats.totalNominees),
    recentVotes,
    topCategories,
  };
}

export async function getIpVoteCount(ipAddress: string): Promise<number> {
  const [result] = await sql<{ count: string }[]>`
    SELECT COUNT(*) as count
    FROM votes
    WHERE ip_address = ${ipAddress}
  `;
  return parseInt(result.count);
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default sql;
