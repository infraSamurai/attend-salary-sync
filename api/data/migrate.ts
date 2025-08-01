import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../middleware/auth';
import { saveTeachers, saveAttendance } from '../utils/storage';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const { method } = req;
  const user = req.user!;

  // Only admin and manager can migrate data
  if (!['admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Only administrators and managers can migrate data' });
  }

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { teachers: importTeachers, attendance: importAttendance, teacher_id_counter } = req.body;

    if (!importTeachers && !importAttendance) {
      return res.status(400).json({ error: 'No data provided for migration' });
    }

    let migratedTeachers = 0;
    let migratedAttendance = 0;

    // Migrate teachers
    if (importTeachers && Array.isArray(importTeachers)) {
      // Save imported teachers to persistent storage
      await saveTeachers(importTeachers);
      migratedTeachers = importTeachers.length;
    }

    // Migrate attendance
    if (importAttendance && Array.isArray(importAttendance)) {
      // Save imported attendance to persistent storage
      await saveAttendance(importAttendance);
      migratedAttendance = importAttendance.length;
    }

    // Log migration for audit
    console.log(`Data migration completed by ${user.username}:`);
    console.log(`- Teachers: ${migratedTeachers}`);
    console.log(`- Attendance records: ${migratedAttendance}`);

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
    console.error('Error during data migration:', error);
    res.status(500).json({ error: 'Internal server error during migration' });
  }
}

// Export the handler with authentication middleware (admin and manager)
export default withAuth(handler, ['admin', 'manager']);