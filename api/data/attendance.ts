import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../middleware/auth';

// Temporary in-memory storage (will be replaced with database)
let attendance: any[] = [];

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
    const { teacherId, startDate, endDate } = req.query;
    let filteredAttendance = [...attendance];

    // Role-based filtering
    switch (user.role) {
      case 'admin':
      case 'manager':
        // Full access to all attendance data
        break;
      case 'viewer':
        // Read-only access to all attendance
        break;
      case 'teacher':
        // Only their own attendance data
        // Note: This would need proper mapping between user and teacher records
        filteredAttendance = attendance.filter(record => {
          // For now, we'll assume teacherId matches or filter by name
          return teacherId ? record.teacherId === teacherId : true;
        });
        break;
      default:
        return res.status(403).json({ error: 'Access denied' });
    }

    // Apply additional filters
    if (teacherId) {
      filteredAttendance = filteredAttendance.filter(record => record.teacherId === teacherId);
    }

    if (startDate && endDate) {
      filteredAttendance = filteredAttendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= new Date(startDate as string) && recordDate <= new Date(endDate as string);
      });
    }

    res.status(200).json({ attendance: filteredAttendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Admin and Manager can add attendance
  if (!['admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions to add attendance' });
  }

  try {
    const { teacherId, date, status } = req.body;

    if (!teacherId || !date || !status) {
      return res.status(400).json({ error: 'Teacher ID, date, and status are required' });
    }

    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ error: 'Status must be present, absent, or late' });
    }

    // Check if attendance record already exists
    const existingIndex = attendance.findIndex(
      record => record.teacherId === teacherId && record.date === date
    );

    const attendanceRecord = {
      teacherId,
      date,
      status,
      updatedBy: user.username,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      // Update existing record
      attendance[existingIndex] = { ...attendance[existingIndex], ...attendanceRecord };
      res.status(200).json({ attendance: attendance[existingIndex] });
    } else {
      // Create new record
      attendance.push(attendanceRecord);
      res.status(201).json({ attendance: attendanceRecord });
    }
  } catch (error) {
    console.error('Error adding attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePut(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Admin and Manager can update attendance
  if (!['admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions to update attendance' });
  }

  try {
    const { teacherId, date, status } = req.body;

    if (!teacherId || !date) {
      return res.status(400).json({ error: 'Teacher ID and date are required' });
    }

    const recordIndex = attendance.findIndex(
      record => record.teacherId === teacherId && record.date === date
    );

    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    attendance[recordIndex] = {
      ...attendance[recordIndex],
      status,
      updatedBy: user.username,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({ attendance: attendance[recordIndex] });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Only admin can delete attendance records
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can delete attendance records' });
  }

  try {
    const { teacherId, date } = req.query;

    const recordIndex = attendance.findIndex(
      record => record.teacherId === teacherId && record.date === date
    );

    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    attendance.splice(recordIndex, 1);
    res.status(200).json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export the handler with authentication middleware
export default withAuth(handler);