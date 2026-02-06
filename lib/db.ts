import postgres from 'postgres';
import type { Category, Nominee, Vote, User, Settings } from '@/types';

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// User operations
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

// Category operations
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
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push(`name = $${values.length + 1}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${values.length + 1}`);
    values.push(data.description);
  }
  if (data.displayOrder !== undefined) {
    updates.push(`display_order = $${values.length + 1}`);
    values.push(data.displayOrder);
  }

  if (updates.length === 0) return getCategoryById(id);

  updates.push('updated_at = NOW()');

  const [category] = await sql<Category[]>`
    UPDATE categories
    SET ${sql(updates.join(', '))}
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

// Nominee operations
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

// Vote operations
export async function castVote(data: {
  userId: string;
  categoryId: string;
  nomineeId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<Vote> {
  const [vote] = await sql<Vote[]>`
    INSERT INTO votes (user_id, category_id, nominee_id, ip_address, user_agent)
    VALUES (${data.userId}, ${data.categoryId}, ${data.nomineeId}, 
            ${data.ipAddress || null}, ${data.userAgent || null})
    ON CONFLICT (user_id, category_id) DO UPDATE
    SET nominee_id = ${data.nomineeId}, voted_at = NOW()
    RETURNING id, user_id as "userId", category_id as "categoryId", 
              nominee_id as "nomineeId", ip_address as "ipAddress",
              user_agent as "userAgent", voted_at as "votedAt"
  `;
  return vote as Vote;
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

// Settings operations
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

// Statistics
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

export default sql;