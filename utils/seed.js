// seed.js
const db = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    const saltRounds = 10;
    // sample users
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const userPassword = await bcrypt.hash('user123', saltRounds);

    // insert users if not exist
    await db.query(
      `INSERT IGNORE INTO users (id, name, email, password, role_type)
       VALUES
       (1, 'Admin', 'admin@example.com', ?, 'a'),
       (2, 'User 1', 'user1@example.com', ?, 'u'),
       (3, 'User 2', 'user2@example.com', ?, 'u')`,
      [adminPassword, userPassword, userPassword]
    );

    // // sample listings (around some coordinate)
    // const listings = [
    //   ['Starbucks Mid Valley', 3.118, 101.677, 2],
    //   ['Burger King', 3.120, 101.678, 2],
    //   ['Pizza Hut', 3.130, 101.680, 2],
    //   ['Sunway Pyramid', 3.073, 101.606, 2]
    // ];

    // for (const [name, lat, lon, userId] of listings) {
    //   // prevent duplicates by name for seed simplicity
    //   const [rows] = await db.query(`SELECT id FROM listings WHERE name = ? LIMIT 1`, [name]);
    //   if (rows.length === 0) {
    //     await db.query(
    //       `INSERT INTO listings (name, latitude, longitude, user_id) VALUES (?, ?, ?, ?)`,
    //       [name, lat, lon, userId]
    //     );
    //   }
    // }

    console.log('✅ Seed completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();