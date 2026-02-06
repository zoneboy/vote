const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npm run make-admin email@example.com');
    process.exit(1);
  }

  try {
    // Check if user exists
    const [user] = await sql`
      SELECT id, email, is_admin FROM users WHERE email = ${email}
    `;

    if (!user) {
      // Create user if doesn't exist
      const [newUser] = await sql`
        INSERT INTO users (email, is_admin)
        VALUES (${email}, true)
        RETURNING id, email, is_admin
      `;
      console.log(`✅ Created new admin user: ${newUser.email}`);
    } else if (user.is_admin) {
      console.log(`ℹ️  User ${email} is already an admin`);
    } else {
      // Update existing user to admin
      await sql`
        UPDATE users
        SET is_admin = true
        WHERE email = ${email}
      `;
      console.log(`✅ Made ${email} an admin`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

makeAdmin();
