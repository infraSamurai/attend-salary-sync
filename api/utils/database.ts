import { sql } from '@vercel/postgres';

// Database connection and utilities
export { sql };

// Database initialization - creates tables if they don't exist
export async function initializeDatabase() {
  try {
    console.log('🗄️ Initializing database tables...');

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'viewer', 'teacher')),
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create teachers table
    await sql`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        designation VARCHAR(100),
        base_salary INTEGER DEFAULT 0,
        join_date DATE,
        contact VARCHAR(50),
        photo TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create attendance table
    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(teacher_id, date)
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON attendance(teacher_id, date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name)`;

    console.log('✅ Database tables initialized successfully');
    
    // Check if we need to seed default data
    await seedDefaultData();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Seed default data if tables are empty
async function seedDefaultData() {
  try {
    // Check if users exist
    const userCount = await sql`SELECT COUNT(*) FROM users`;
    if (userCount.rows[0].count === '0') {
      console.log('🌱 Seeding default users...');
      
      await sql`
        INSERT INTO users (username, password_hash, role, name) VALUES
        ('admin', '$2a$10$w/Tapc6eGFtvZaGvSLYY6e8jnniF5REP1qmdsYb7F5fMABAsZ9WNi', 'admin', 'Administrator'),
        ('manager', '$2a$10$zH1p.I2gs99wE7FWicCGq.ovn7myMD3gT2pXQ4gdDRzYJAbq7Ehwe', 'manager', 'Manager User'),
        ('viewer', '$2a$10$SbtpYG17EV7UDe5hnnlKceuQ36ZZFgB4MhFJlll8x/9Ne6kHJqcxu', 'viewer', 'Viewer User')
      `;
      
      console.log('✅ Default users seeded');
    }

    // Check if teachers exist
    const teacherCount = await sql`SELECT COUNT(*) FROM teachers`;
    if (teacherCount.rows[0].count === '0') {
      console.log('🌱 Seeding default teachers...');
      
      // Insert the 24 teachers from your backup data
      await sql`
        INSERT INTO teachers (id, name, designation, base_salary, join_date, contact, photo) VALUES
        (1, 'Jyotsana', 'Principal', 12000, '2025-04-01', '999999999', ''),
        (2, 'Pritam', 'Computer Teacher', 10000, '2025-04-01', '99999999', ''),
        (3, 'Santosh', 'Misc', 9000, '2025-04-01', '9', ''),
        (4, 'Rajkumari', 'Misc', 5500, '2025-04-01', '9', ''),
        (5, 'Shabnam', 'Nur', 5000, '2025-04-01', '9', ''),
        (6, 'Savita', 'Pre', 6000, '2025-04-01', '9', ''),
        (7, 'Archana', 'Misc', 7000, '2025-04-01', '9', ''),
        (8, 'Akanksha Jaisawal', 'Pre', 3500, '2025-04-01', '9', ''),
        (9, 'Manisha Pal', 'Misc', 7500, '2025-04-01', '9', ''),
        (10, 'Aanchal', 'Misc', 5000, '2025-04-01', '9', ''),
        (11, 'Varsha Verma', 'Pre', 4500, '2025-04-01', '9', ''),
        (12, 'Anuj', 'Misc', 10000, '2025-04-01', '9', ''),
        (13, 'Anjali Patel', 'Pre', 3500, '2025-04-01', '9', ''),
        (14, 'Suman', 'Misc', 6000, '2025-04-01', '9', ''),
        (15, 'Pratima Kumari', 'Misc', 6500, '2025-04-01', '9', ''),
        (16, 'Rima Vishwakarma', 'Misc', 4000, '2025-04-01', '9', ''),
        (17, 'Usha', 'Misc', 6000, '2025-04-01', '9', ''),
        (18, 'Ashish Verma', 'Misc', 8000, '2025-04-01', '9', ''),
        (19, 'Anju Jaisawal', 'Misc', 4500, '2025-04-01', '9', ''),
        (20, 'Pratima Sharma', 'Misc', 6000, '2025-04-01', '9', ''),
        (21, 'Jaswant', 'Misc', 10000, '2025-04-01', '9', ''),
        (22, 'Dimple', 'Misc', 2500, '2025-04-01', '9', ''),
        (23, 'Divya Singh', 'Misc', 5000, '2025-04-01', '9', ''),
        (24, 'Pinky Sharma', 'Misc', 3000, '2025-04-01', '9', '')
      `;

      // Update the sequence to start from 25
      await sql`SELECT setval('teachers_id_seq', 25, false)`;
      
      console.log('✅ Default teachers seeded (24 teachers)');
    }

  } catch (error) {
    console.error('❌ Failed to seed default data:', error);
    // Don't throw here - the app can still work without default data
  }
}

// Helper function to ensure database is initialized before operations
export async function ensureDatabaseInitialized() {
  try {
    // Try a simple query to check if tables exist
    await sql`SELECT 1 FROM teachers LIMIT 1`;
  } catch (error) {
    // If tables don't exist, initialize them
    console.log('Database tables not found, initializing...');
    await initializeDatabase();
  }
}

// Error handling wrapper for database operations
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    await ensureDatabaseInitialized();
    return await operation();
  } catch (error) {
    console.error(`❌ Database operation failed (${operationName}):`, error);
    throw new Error(`Database operation failed: ${operationName}`);
  }
}