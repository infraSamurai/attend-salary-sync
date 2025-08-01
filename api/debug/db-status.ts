import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../middleware/auth';
import { sql } from '../utils/database';
import { getTeacherCount } from '../models/Teacher';
import { getAttendanceCount } from '../models/Attendance';
import { getUserCount } from '../models/User';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const { method } = req;
  const user = req.user!;

  console.log(`🔍 [DEBUG-DB-STATUS] Request from user: ${user.username} (${user.role})`);

  // Only admin and manager can access debug info
  if (!['admin', 'manager'].includes(user.role)) {
    console.log(`❌ [DEBUG-DB-STATUS] Access denied for role: ${user.role}`);
    return res.status(403).json({ error: 'Only administrators and managers can access debug info' });
  }

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log(`🔍 [DEBUG-DB-STATUS] Starting database connection test...`);
    const startTime = Date.now();
    
    // Test basic connection
    console.log(`🔍 [DEBUG-DB-STATUS] Testing basic SQL connection...`);
    const connectionTest = await sql`SELECT NOW() as current_time, version() as db_version`;
    const connectionTime = Date.now() - startTime;
    console.log(`✅ [DEBUG-DB-STATUS] Connection test passed in ${connectionTime}ms`);
    
    // Test table existence
    console.log(`🔍 [DEBUG-DB-STATUS] Testing table existence...`);
    const tablesTest = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'teachers', 'attendance')
      ORDER BY table_name
    `;
    console.log(`✅ [DEBUG-DB-STATUS] Found ${tablesTest.rows.length} expected tables`);
    
    // Get counts from each table
    console.log(`🔍 [DEBUG-DB-STATUS] Getting record counts...`);
    const userCount = await getUserCount();
    const teacherCount = await getTeacherCount();
    const attendanceCount = await getAttendanceCount();
    
    // Test environment variables
    const envCheck = {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      postgresUrlLength: process.env.POSTGRES_URL?.length || 0
    };
    
    const totalTime = Date.now() - startTime;
    
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      connectionTest: {
        connected: true,
        responseTime: connectionTime,
        serverTime: connectionTest.rows[0].current_time,
        dbVersion: connectionTest.rows[0].db_version
      },
      tables: {
        found: tablesTest.rows.map(row => row.table_name),
        expected: ['users', 'teachers', 'attendance']
      },
      counts: {
        users: userCount,
        teachers: teacherCount,
        attendance: attendanceCount
      },
      environment: envCheck,
      performance: {
        totalTestTime: totalTime
      },
      requestInfo: {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        user: {
          username: user.username,
          role: user.role
        }
      }
    };
    
    console.log(`✅ [DEBUG-DB-STATUS] Database status check completed successfully`);
    console.log(`📊 [DEBUG-DB-STATUS] Summary:`, {
      connected: true,
      tables: tablesTest.rows.length,
      users: userCount,
      teachers: teacherCount,
      attendance: attendanceCount,
      totalTime
    });
    
    res.status(200).json(status);
  } catch (error) {
    console.error('❌ [DEBUG-DB-STATUS] Database status check failed:', error);
    console.error('❌ [DEBUG-DB-STATUS] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Database connection failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// Export the handler with authentication middleware
export default withAuth(handler, ['admin', 'manager']);