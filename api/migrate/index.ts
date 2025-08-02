import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from './_lib/middleware/auth';
import { bulkInsertTeachers, getTeacherCount } from './_lib/models/Teacher';
import { bulkInsertAttendance, getAttendanceCount } from './_lib/models/Attendance';
import { initializeDatabase } from './_lib/utils/database';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const { method } = req;
  const user = req.user!;

  // Only admin can perform migration
  if (user.role !== 'admin') {
    console.log(`❌ Migration blocked: insufficient role ${user.role}`);
    return res.status(403).json({ error: 'Only administrators can perform data migration' });
  }

  if (method === 'POST') {
    return handleMigration(req, res, user);
  } else if (method === 'GET') {
    return handleStatus(req, res, user);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleStatus(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  try {
    console.log('📊 Getting migration status...');
    
    // Initialize database to ensure tables exist
    await initializeDatabase();
    
    const teacherCount = await getTeacherCount();
    const attendanceCount = await getAttendanceCount();
    
    console.log(`✅ Current database status: ${teacherCount} teachers, ${attendanceCount} attendance records`);
    
    res.status(200).json({
      database: {
        teachers: teacherCount,
        attendance: attendanceCount,
        initialized: true
      },
      message: 'Database status retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting migration status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleMigration(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  try {
    console.log(`🚀 Starting data migration initiated by: ${user.username}`);
    const { teachers = [], attendance = [], force = false } = req.body;

    // Initialize database to ensure tables exist
    await initializeDatabase();

    // Check current database state
    const currentTeachers = await getTeacherCount();
    const currentAttendance = await getAttendanceCount();

    console.log(`📊 Current database state: ${currentTeachers} teachers, ${currentAttendance} attendance records`);

    if ((currentTeachers > 0 || currentAttendance > 0) && !force) {
      console.log('⚠️ Database contains data, migration requires force flag');
      return res.status(400).json({
        error: 'Database already contains data. Use force=true to proceed.',
        current: {
          teachers: currentTeachers,
          attendance: currentAttendance
        }
      });
    }

    let migratedTeachers = 0;
    let migratedAttendance = 0;

    // Migrate teachers if provided
    if (teachers.length > 0) {
      console.log(`👥 Migrating ${teachers.length} teachers...`);
      
      // Convert frontend format to database format
      const teacherData = teachers.map((teacher: any) => ({
        name: teacher.name,
        designation: teacher.designation || '',
        base_salary: teacher.baseSalary || teacher.base_salary || 0,
        join_date: teacher.joinDate || teacher.join_date || new Date().toISOString().split('T')[0],
        contact: teacher.contact || '',
        photo: teacher.photo || ''
      }));

      migratedTeachers = await bulkInsertTeachers(teacherData);
      console.log(`✅ Migrated ${migratedTeachers} teachers`);
    }

    // Migrate attendance if provided
    if (attendance.length > 0) {
      console.log(`📅 Migrating ${attendance.length} attendance records...`);
      
      // Convert frontend format to database format
      const attendanceData = attendance.map((record: any) => ({
        teacher_id: record.teacherId || record.teacher_id,
        date: record.date,
        status: record.status
      }));

      migratedAttendance = await bulkInsertAttendance(attendanceData);
      console.log(`✅ Migrated ${migratedAttendance} attendance records`);
    }

    const totalTeachers = await getTeacherCount();
    const totalAttendance = await getAttendanceCount();

    console.log(`🎉 Migration completed successfully!`);
    console.log(`📊 Final database state: ${totalTeachers} teachers, ${totalAttendance} attendance records`);

    res.status(200).json({
      success: true,
      migrated: {
        teachers: migratedTeachers,
        attendance: migratedAttendance
      },
      total: {
        teachers: totalTeachers,
        attendance: totalAttendance
      },
      message: 'Data migration completed successfully'
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Export the handler with authentication middleware
export default withAuth(handler);