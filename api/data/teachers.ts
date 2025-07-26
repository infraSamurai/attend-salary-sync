import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../middleware/auth';

// Temporary in-memory storage (will be replaced with database)
let teachers = [
  {
    id: '1',
    name: 'Jyotsana',
    designation: 'Principal',
    baseSalary: 12000,
    joinDate: '2025-04-01',
    contact: '999999999',
    photo: ''
  },
  {
    id: '2',
    name: 'Pritam',
    designation: 'Computer Teacher',
    baseSalary: 10000,
    joinDate: '2025-04-01',
    contact: '99999999',
    photo: ''
  }
];

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
    let filteredTeachers = [...teachers];

    // Role-based filtering
    switch (user.role) {
      case 'admin':
      case 'manager':
        // Full access to all teacher data
        break;
      case 'viewer':
        // Only basic info (name, designation)
        filteredTeachers = teachers.map(teacher => ({
          id: teacher.id,
          name: teacher.name,
          designation: teacher.designation,
          joinDate: teacher.joinDate
        })) as any;
        break;
      case 'teacher':
        // Only their own data (if they have a teacher record)
        filteredTeachers = teachers.filter(teacher => 
          teacher.name.toLowerCase() === user.name.toLowerCase()
        );
        break;
      default:
        return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json({ teachers: filteredTeachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Only admin can create teachers
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can create teachers' });
  }

  try {
    const { name, designation, baseSalary, joinDate, contact, photo } = req.body;

    if (!name || !designation) {
      return res.status(400).json({ error: 'Name and designation are required' });
    }

    const newTeacher = {
      id: Date.now().toString(),
      name,
      designation,
      baseSalary: baseSalary || 0,
      joinDate: joinDate || new Date().toISOString().split('T')[0],
      contact: contact || '',
      photo: photo || ''
    };

    teachers.push(newTeacher);
    res.status(201).json({ teacher: newTeacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePut(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Only admin can update teachers
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can update teachers' });
  }

  try {
    const { id } = req.query;
    const updates = req.body;

    const teacherIndex = teachers.findIndex(t => t.id === id);
    if (teacherIndex === -1) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    teachers[teacherIndex] = { ...teachers[teacherIndex], ...updates };
    res.status(200).json({ teacher: teachers[teacherIndex] });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Only admin can delete teachers
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can delete teachers' });
  }

  try {
    const { id } = req.query;
    
    const teacherIndex = teachers.findIndex(t => t.id === id);
    if (teacherIndex === -1) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    teachers.splice(teacherIndex, 1);
    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export the handler with authentication middleware
export default withAuth(handler);