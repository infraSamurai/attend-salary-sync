import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../middleware/auth';
import { bulkInsertAttendance } from '../models/Attendance';
import { getAllTeachers } from '../models/Teacher';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const { method } = req;
  const user = req.user!;

  console.log(`🌱 [SEED-ATTENDANCE] Request from user: ${user.username} (${user.role})`);

  // Only admin can seed data
  if (user.role !== 'admin') {
    console.log(`❌ [SEED-ATTENDANCE] Access denied for role: ${user.role}`);
    return res.status(403).json({ error: 'Only administrators can seed attendance data' });
  }

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log(`🌱 [SEED-ATTENDANCE] Starting attendance data seeding...`);
    
    // Get all teachers to ensure we have valid teacher IDs
    const teachers = await getAllTeachers();
    console.log(`📊 [SEED-ATTENDANCE] Found ${teachers.length} teachers in database`);
    
    if (teachers.length === 0) {
      return res.status(400).json({ error: 'No teachers found. Please seed teachers first.' });
    }

    // Generate sample attendance for the last 30 days
    const today = new Date();
    const attendanceRecords = [];
    
    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateString = date.toISOString().split('T')[0];
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }
      
      // Create attendance for each teacher
      for (const teacher of teachers) {
        // Generate realistic attendance (90% present, 5% late, 5% absent)
        const rand = Math.random();
        let status = 'present';
        if (rand < 0.05) status = 'absent';
        else if (rand < 0.10) status = 'late';
        
        attendanceRecords.push({
          teacher_id: teacher.id,
          date: dateString,
          status: status as 'present' | 'absent' | 'late'
        });
      }
    }
    
    console.log(`🌱 [SEED-ATTENDANCE] Generated ${attendanceRecords.length} attendance records`);
    
    // Bulk insert attendance records
    const insertedCount = await bulkInsertAttendance(attendanceRecords);
    
    console.log(`✅ [SEED-ATTENDANCE] Successfully seeded ${insertedCount} attendance records`);
    
    res.status(200).json({
      success: true,
      message: 'Attendance data seeded successfully',
      generated: attendanceRecords.length,
      inserted: insertedCount,
      teachers: teachers.length,
      dateRange: {
        from: attendanceRecords[0]?.date,
        to: attendanceRecords[attendanceRecords.length - 1]?.date
      }
    });
    
  } catch (error) {
    console.error('❌ [SEED-ATTENDANCE] Failed to seed attendance data:', error);
    console.error('❌ [SEED-ATTENDANCE] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Failed to seed attendance data', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Export the handler with authentication middleware
export default withAuth(handler, ['admin']);