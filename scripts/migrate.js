const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function migrate() {
  console.log('🚀 Starting database migration...');

  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `;
    console.log('✅ Users table created');

    // Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Categories table created');

    // Create nominees table
    await sql`
      CREATE TABLE IF NOT EXISTS nominees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Nominees table created');

    // Create votes table
    await sql`
      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
        nominee_id UUID REFERENCES nominees(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category_id)
      )
    `;
    console.log('✅ Votes table created');

    // Create settings table
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Settings table created');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_votes_user_category ON votes(user_id, category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_votes_category ON votes(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nominees_category ON nominees(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_votes_ip ON votes(ip_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    console.log('✅ Indexes created');

    // Insert default settings
    await sql`
      INSERT INTO settings (key, value, updated_at)
      VALUES 
        ('voting_open', 'false', NOW()),
        ('results_public', 'false', NOW()),
        ('maintenance_mode', 'false', NOW())
      ON CONFLICT (key) DO NOTHING
    `;
    console.log('✅ Default settings inserted');

    console.log('✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
