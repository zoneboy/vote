const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create sample categories
    const categories = [
      {
        name: 'Best Artist of the Year',
        description: 'Vote for the artist who has made the biggest impact this year',
        displayOrder: 1,
      },
      {
        name: 'Song of the Year',
        description: 'The most memorable song of the year',
        displayOrder: 2,
      },
      {
        name: 'Best New Artist',
        description: 'Rising stars who made their breakthrough this year',
        displayOrder: 3,
      },
      {
        name: 'Best Album',
        description: 'The complete body of work that defined the year',
        displayOrder: 4,
      },
    ];

    const categoryIds = [];
    for (const cat of categories) {
      const [category] = await sql`
        INSERT INTO categories (name, description, display_order)
        VALUES (${cat.name}, ${cat.description}, ${cat.displayOrder})
        RETURNING id
      `;
      categoryIds.push(category.id);
      console.log(`✅ Created category: ${cat.name}`);
    }

    // Create sample nominees for Best Artist
    const artists = [
      'Burna Boy',
      'Wizkid',
      'Davido',
      'Asake',
      'Rema',
    ];

    for (let i = 0; i < artists.length; i++) {
      await sql`
        INSERT INTO nominees (category_id, name, display_order)
        VALUES (${categoryIds[0]}, ${artists[i]}, ${i + 1})
      `;
    }
    console.log('✅ Created nominees for Best Artist');

    // Create sample nominees for Song of the Year
    const songs = [
      'Calm Down - Rema ft. Selena Gomez',
      'Last Last - Burna Boy',
      'Terminator - Asake',
      'Love Nwantiti - CKay',
      'Peru - Fireboy DML',
    ];

    for (let i = 0; i < songs.length; i++) {
      await sql`
        INSERT INTO nominees (category_id, name, display_order)
        VALUES (${categoryIds[1]}, ${songs[i]}, ${i + 1})
      `;
    }
    console.log('✅ Created nominees for Song of the Year');

    // Create sample nominees for Best New Artist
    const newArtists = [
      'Young Jonn',
      'Victony',
      'BNXN (Buju)',
      'Ruger',
      'Magixx',
    ];

    for (let i = 0; i < newArtists.length; i++) {
      await sql`
        INSERT INTO nominees (category_id, name, display_order)
        VALUES (${categoryIds[2]}, ${newArtists[i]}, ${i + 1})
      `;
    }
    console.log('✅ Created nominees for Best New Artist');

    // Create sample nominees for Best Album
    const albums = [
      'Love, Damini - Burna Boy',
      'More Love, Less Ego - Wizkid',
      'Timeless - Davido',
      'Work of Art - Asake',
      'Rave & Roses - Rema',
    ];

    for (let i = 0; i < albums.length; i++) {
      await sql`
        INSERT INTO nominees (category_id, name, display_order)
        VALUES (${categoryIds[3]}, ${albums[i]}, ${i + 1})
      `;
    }
    console.log('✅ Created nominees for Best Album');

    console.log('✨ Seeding completed successfully!');
    console.log('📊 Created:');
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${artists.length + songs.length + newArtists.length + albums.length} nominees`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seed();
