import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../middleware/auth';
import {
  getAllAttendance,
  getAttendanceByTeacherId,
  getAttendanceByDateRange,
  upsertAttendance,
  deleteAttendanceByTeacherAndDate
} from '../models/Attendance';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const { method } = req;
  const user = req.user!;

  switch (method) {
    case 'GET':
      return handleGet(req, res, user);
    case 'POST':
      return handlePost(req, res, user);
    case 'PUT':
      return handlePut(req, res, user);
    case 'DELETE':
      return handleDelete(req, res, user);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  try {
    console.log(`🔍 Fetching attendance for user: ${user.username} (${user.role})`);
    const { teacherId, startDate, endDate } = req.query;
    
    let attendance;
    
    // Fetch attendance based on query parameters
    if (teacherId) {
      attendance = await getAttendanceByTeacherId(parseInt(teacherId as string));
    } else if (startDate && endDate) {
      attendance = await getAttendanceByDateRange(startDate as string, endDate as string);
    } else {
      attendance = await getAllAttendance();
    }
    
    let filteredAttendance = [...attendance];

    // Role-based filtering
    switch (user.role) {
      case 'admin':
      case 'manager':
        // Full access to all attendance data
        console.log(`✅ Admin/Manager access: returning ${attendance.length} attendance records`);
        break;
      case 'viewer':
        // Read-only access to all attendance
        console.log(`✅ Viewer access: returning ${filteredAttendance.length} attendance records`);
        break;
      case 'teacher':
        // Only their own attendance data
        // Note: This would need proper mapping between user and teacher records
        if (!teacherId) {
          console.log(`❌ Teacher access requires teacherId parameter`);
          return res.status(400).json({ error: 'Teacher ID is required for teacher role' });
        }
        console.log(`✅ Teacher access: returning attendance for teacher ${teacherId}`);
        break;
      default:
        console.log(`❌ Access denied for role: ${user.role}`);
        return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json({ attendance: filteredAttendance });
  } catch (error) {
    console.error('❌ Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Admin and Manager can add attendance
  if (!['admin', 'manager'].includes(user.role)) {
    console.log(`❌ Add attendance blocked: insufficient role ${user.role}`);
    return res.status(403).json({ error: 'Insufficient permissions to add attendance' });
  }

  try {
    const { teacherId, date, status } = req.body;

    if (!teacherId || !date || !status) {
      console.log('❌ Add attendance failed: missing required fields');
      return res.status(400).json({ error: 'Teacher ID, date, and status are required' });
    }

    if (!['present', 'absent', 'late'].includes(status)) {
      console.log(`❌ Add attendance failed: invalid status ${status}`);
      return res.status(400).json({ error: 'Status must be present, absent, or late' });
    }

    const attendanceData = {
      teacher_id: parseInt(teacherId),
      date,
      status
    };

    console.log(`💾 Adding/updating attendance for teacher ${teacherId} on ${date}`);
    const savedRecord = await upsertAttendance(attendanceData);
    
    console.log(`✅ Attendance record saved with ID: ${savedRecord.id}`);
    res.status(200).json({ attendance: savedRecord });
  } catch (error) {
    console.error('❌ Error adding attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePut(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Admin and Manager can update attendance
  if (!['admin', 'manager'].includes(user.role)) {
    console.log(`❌ Update attendance blocked: insufficient role ${user.role}`);
    return res.status(403).json({ error: 'Insufficient permissions to update attendance' });
  }

  try {
    const { teacherId, date, status } = req.body;

    if (!teacherId || !date) {
      console.log('❌ Update attendance failed: missing required fields');
      return res.status(400).json({ error: 'Teacher ID and date are required' });
    }

    if (status && !['present', 'absent', 'late'].includes(status)) {
      console.log(`❌ Update attendance failed: invalid status ${status}`);
      return res.status(400).json({ error: 'Status must be present, absent, or late' });
    }

    const attendanceData = {
      teacher_id: parseInt(teacherId),
      date,
      status
    };

    console.log(`💾 Updating attendance for teacher ${teacherId} on ${date}`);
    const updatedRecord = await upsertAttendance(attendanceData);
    
    console.log(`✅ Attendance record updated with ID: ${updatedRecord.id}`);
    res.status(200).json({ attendance: updatedRecord });
  } catch (error) {
    console.error('❌ Error updating attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Only admin can delete attendance records
  if (user.role !== 'admin') {
    console.log(`❌ Delete attendance blocked: insufficient role ${user.role}`);
    return res.status(403).json({ error: 'Only administrators can delete attendance records' });
  }

  try {
    const { teacherId, date } = req.query;

    if (!teacherId || !date) {
      console.log('❌ Delete attendance failed: missing required parameters');
      return res.status(400).json({ error: 'Teacher ID and date are required' });
    }

    console.log(`🗑️ Attempting to delete attendance for teacher ${teacherId} on ${date}`);
    const deleted = await deleteAttendanceByTeacherAndDate(parseInt(teacherId as string), date as string);
    
    if (!deleted) {
      console.log(`❌ Attendance record not found for teacher ${teacherId} on ${date}`);
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    console.log(`✅ Attendance record deleted for teacher ${teacherId} on ${date}`);
    res.status(200).json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export the handler with authentication middleware
export default withAuth(handler);