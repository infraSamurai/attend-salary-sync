import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../middleware/auth';
import { saveTeachers, saveAttendance } from '../utils/storage';
import { setGlobalTeacherIdCounter } from '../utils/globalStorage';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const { method } = req;
  const user = req.user!;

  console.log('🚀 Migration endpoint called:', {
    method,
    user: { username: user.username, role: user.role },
    bodyKeys: Object.keys(req.body || {}),
    timestamp: new Date().toISOString()
  });

  // Only admin and manager can migrate data
  if (!['admin', 'manager'].includes(user.role)) {
    console.log('❌ Migration blocked: insufficient role', user.role);
    return res.status(403).json({ error: 'Only administrators and managers can migrate data' });
  }

  if (method !== 'POST') {
    console.log('❌ Migration blocked: wrong method', method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { teachers: importTeachers, attendance: importAttendance, teacher_id_counter } = req.body;

    console.log('📊 Migration data received:', {
      teachers: importTeachers ? importTeachers.length : 0,
      attendance: importAttendance ? importAttendance.length : 0,
      teacher_id_counter
    });

    if (!importTeachers && !importAttendance) {
      console.log('❌ Migration failed: no data provided');
      return res.status(400).json({ error: 'No data provided for migration' });
    }

    let migratedTeachers = 0;
    let migratedAttendance = 0;

    // Migrate teachers
    if (importTeachers && Array.isArray(importTeachers)) {
      console.log('💾 Saving teachers to server storage...');
      await saveTeachers(importTeachers);
      migratedTeachers = importTeachers.length;
      console.log('✅ Teachers saved successfully:', migratedTeachers);
    }

    // Migrate attendance
    if (importAttendance && Array.isArray(importAttendance)) {
      console.log('💾 Saving attendance to server storage...');
      await saveAttendance(importAttendance);
      migratedAttendance = importAttendance.length;
      console.log('✅ Attendance saved successfully:', migratedAttendance);
    }

    // Migrate teacher ID counter
    if (teacher_id_counter) {
      console.log('💾 Setting teacher ID counter:', teacher_id_counter);
      setGlobalTeacherIdCounter(teacher_id_counter);
      console.log('✅ Teacher ID counter set successfully');
    }

    // Log migration for audit
    console.log(`✅ Data migration completed by ${user.username}:`);
    console.log(`- Teachers: ${migratedTeachers}`);
    console.log(`- Attendance records: ${migratedAttendance}`);
    console.log(`- Teacher ID counter: ${teacher_id_counter || 'not provided'}`);

    res.status(200).json({ 
      success: true,
      message: 'Data migration completed successfully',
      migrated: {
        teachers: migratedTeachers,
        attendance: migratedAttendance,
        teacher_id_counter
      }
    });
  } catch (error) {
    console.error('💥 Error during data migration:', error);
    res.status(500).json({ error: 'Internal server error during migration', details: error.message });
  }
}

// Export the handler with authentication middleware (admin and manager)
export default withAuth(handler, ['admin', 'manager']);