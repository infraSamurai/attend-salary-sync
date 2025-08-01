import { sql } from '@vercel/postgres';

// Database connection and utilities
export { sql };

// Database initialization - creates tables if they don't exist
export async function initializeDatabase() {
  try {
    console.log('🗄️ [DB-INIT] Starting database initialization...');
    console.log('🗄️ [DB-INIT] Environment check:', {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    // Create users table
    console.log('🗄️ [DB-INIT] Creating users table...');
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
    console.log('✅ [DB-INIT] Users table created/verified');

    // Create teachers table
    console.log('🗄️ [DB-INIT] Creating teachers table...');
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
    console.log('✅ [DB-INIT] Teachers table created/verified');

    // Create attendance table
    console.log('🗄️ [DB-INIT] Creating attendance table...');
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
    console.log('✅ [DB-INIT] Attendance table created/verified');

    // Create indexes for better performance
    console.log('🗄️ [DB-INIT] Creating database indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON attendance(teacher_id, date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name)`;
    console.log('✅ [DB-INIT] Database indexes created/verified');

    console.log('✅ [DB-INIT] Database tables initialized successfully');
    
    // Check if we need to seed default data
    await seedDefaultData();
    
  } catch (error) {
    console.error('❌ [DB-INIT] Database initialization failed:', error);
    console.error('❌ [DB-INIT] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Seed default data if tables are empty
async function seedDefaultData() {
  try {
    console.log('🌱 [DB-SEED] Checking if default data seeding is needed...');
    
    // Check if users exist
    const userCount = await sql`SELECT COUNT(*) FROM users`;
    console.log('🌱 [DB-SEED] Current user count:', userCount.rows[0].count);
    
    if (userCount.rows[0].count === '0') {
      console.log('🌱 [DB-SEED] Seeding default users...');
      
      await sql`
        INSERT INTO users (username, password_hash, role, name) VALUES
        ('admin', '$2a$10$w/Tapc6eGFtvZaGvSLYY6e8jnniF5REP1qmdsYb7F5fMABAsZ9WNi', 'admin', 'Administrator'),
        ('manager', '$2a$10$zH1p.I2gs99wE7FWicCGq.ovn7myMD3gT2pXQ4gdDRzYJAbq7Ehwe', 'manager', 'Manager User'),
        ('viewer', '$2a$10$SbtpYG17EV7UDe5hnnlKceuQ36ZZFgB4MhFJlll8x/9Ne6kHJqcxu', 'viewer', 'Viewer User')
      `;
      
      console.log('✅ [DB-SEED] Default users seeded successfully');
    } else {
      console.log('ℹ️ [DB-SEED] Users already exist, skipping user seeding');
    }

    // Check if teachers exist
    const teacherCount = await sql`SELECT COUNT(*) FROM teachers`;
    console.log('🌱 [DB-SEED] Current teacher count:', teacherCount.rows[0].count);
    
    if (teacherCount.rows[0].count === '0') {
      console.log('🌱 [DB-SEED] Seeding default teachers (24 teachers)...');
      
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
      
      console.log('✅ [DB-SEED] Default teachers seeded successfully (24 teachers)');
    } else {
      console.log('ℹ️ [DB-SEED] Teachers already exist, skipping teacher seeding');
    }

    // Check if attendance exists and seed sample data
    const attendanceCount = await sql`SELECT COUNT(*) FROM attendance`;
    console.log('🌱 [DB-SEED] Current attendance count:', attendanceCount.rows[0].count);
    
    if (attendanceCount.rows[0].count === '0') {
      console.log('🌱 [DB-SEED] Seeding sample attendance data...');
      
      // Get current date and last 7 days for sample data
      const today = new Date();
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      // Create sample attendance for last 7 days for first 10 teachers
      const attendanceData = [];
      for (let teacherId = 1; teacherId <= 10; teacherId++) {
        for (const date of dates) {
          // Random attendance status (mostly present)
          const rand = Math.random();
          let status = 'present';
          if (rand < 0.1) status = 'absent';
          else if (rand < 0.2) status = 'late';
          
          attendanceData.push(`(${teacherId}, '${date}', '${status}')`);
        }
      }
      
      if (attendanceData.length > 0) {
        const query = `
          INSERT INTO attendance (teacher_id, date, status) VALUES 
          ${attendanceData.join(', ')}
        `;
        
        await sql.query(query);
        console.log(`✅ [DB-SEED] Sample attendance seeded successfully (${attendanceData.length} records)`);
      }
    } else {
      console.log('ℹ️ [DB-SEED] Attendance data already exists, skipping attendance seeding');
    }

  } catch (error) {
    console.error('❌ [DB-SEED] Failed to seed default data:', error);
    console.error('❌ [DB-SEED] Seed error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    // Don't throw here - the app can still work without default data
  }
}

// Helper function to ensure database is initialized before operations
export async function ensureDatabaseInitialized() {
  try {
    console.log('🔍 [DB-CHECK] Checking if database is initialized...');
    // Try a simple query to check if tables exist
    await sql`SELECT 1 FROM teachers LIMIT 1`;
    console.log('✅ [DB-CHECK] Database tables exist and accessible');
  } catch (error) {
    // If tables don't exist, initialize them
    console.log('⚠️ [DB-CHECK] Database tables not found, initializing...');
    console.log('⚠️ [DB-CHECK] Initialization trigger error:', error instanceof Error ? error.message : 'Unknown error');
    await initializeDatabase();
  }
}

// Error handling wrapper for database operations
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    console.log(`🔄 [DB-OP] Starting operation: ${operationName}`);
    await ensureDatabaseInitialized();
    const result = await operation();
    console.log(`✅ [DB-OP] Operation completed successfully: ${operationName}`);
    return result;
  } catch (error) {
    console.error(`❌ [DB-OP] Database operation failed (${operationName}):`, error);
    console.error(`❌ [DB-OP] Operation error details:`, {
      operation: operationName,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Database operation failed: ${operationName}`);
  }
}