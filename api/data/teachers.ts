import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from './_lib/middleware/auth';
import { 
  getAllTeachers, 
  createTeacher, 
  updateTeacher as updateTeacherInDB, 
  deleteTeacher as deleteTeacherFromDB,
  getTeacherById
} from './_lib/models/Teacher';

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
    console.log(`🔍 [API-TEACHERS-GET] Request started`);
    console.log(`🔍 [API-TEACHERS-GET] User details:`, {
      username: user.username,
      role: user.role,
      userId: user.userId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🗄️ [API-TEACHERS-GET] Calling database to fetch teachers...`);
    const teachers = await getAllTeachers();
    console.log(`📊 [API-TEACHERS-GET] Database returned ${teachers.length} teachers`);
    
    let filteredTeachers = [...teachers];

    // Role-based filtering
    console.log(`🔐 [API-TEACHERS-GET] Applying role-based filtering for role: ${user.role}`);
    switch (user.role) {
      case 'admin':
      case 'manager':
        // Full access to all teacher data
        console.log(`✅ [API-TEACHERS-GET] Admin/Manager access: returning ${teachers.length} teachers`);
        break;
      case 'viewer':
        // Only basic info (name, designation)
        filteredTeachers = teachers.map(teacher => ({
          id: teacher.id,
          name: teacher.name,
          designation: teacher.designation,
          join_date: teacher.join_date
        })) as any;
        console.log(`✅ [API-TEACHERS-GET] Viewer access: returning basic info for ${filteredTeachers.length} teachers`);
        break;
      case 'teacher':
        // Only their own data (if they have a teacher record)
        filteredTeachers = teachers.filter(teacher => 
          teacher.name.toLowerCase() === user.name.toLowerCase()
        );
        console.log(`✅ [API-TEACHERS-GET] Teacher access: returning ${filteredTeachers.length} matching teachers`);
        break;
      default:
        console.log(`❌ [API-TEACHERS-GET] Access denied for role: ${user.role}`);
        return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`🎯 [API-TEACHERS-GET] Final response: ${filteredTeachers.length} teachers`);
    console.log(`🎯 [API-TEACHERS-GET] Response sample:`, filteredTeachers.slice(0, 2).map(t => ({
      id: t.id,
      name: t.name
    })));
    
    res.status(200).json({ teachers: filteredTeachers });
  } catch (error) {
    console.error('❌ [API-TEACHERS-GET] Error fetching teachers:', error);
    console.error('❌ [API-TEACHERS-GET] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      user: user.username,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Only admin can create teachers
  if (user.role !== 'admin') {
    console.log(`❌ Create teacher blocked: insufficient role ${user.role}`);
    return res.status(403).json({ error: 'Only administrators can create teachers' });
  }

  try {
    const { name, designation, baseSalary, joinDate, contact, photo } = req.body;

    if (!name || !designation) {
      console.log('❌ Create teacher failed: missing required fields');
      return res.status(400).json({ error: 'Name and designation are required' });
    }

    const teacherData = {
      name,
      designation,
      base_salary: baseSalary || 0,
      join_date: joinDate || new Date().toISOString().split('T')[0],
      contact: contact || '',
      photo: photo || ''
    };

    console.log(`💾 Creating teacher: ${teacherData.name}`);
    const newTeacher = await createTeacher(teacherData);
    
    console.log(`✅ Teacher created with ID: ${newTeacher.id}`);
    res.status(201).json({ teacher: newTeacher });
  } catch (error) {
    console.error('❌ Error creating teacher:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePut(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Only admin can update teachers
  if (user.role !== 'admin') {
    console.log(`❌ Update teacher blocked: insufficient role ${user.role}`);
    return res.status(403).json({ error: 'Only administrators can update teachers' });
  }

  try {
    const { id } = req.query;
    const updates = req.body;

    if (!id) {
      console.log('❌ Update teacher failed: missing ID');
      return res.status(400).json({ error: 'Teacher ID is required' });
    }

    // Convert frontend field names to database field names
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.designation !== undefined) dbUpdates.designation = updates.designation;
    if (updates.baseSalary !== undefined) dbUpdates.base_salary = updates.baseSalary;
    if (updates.joinDate !== undefined) dbUpdates.join_date = updates.joinDate;
    if (updates.contact !== undefined) dbUpdates.contact = updates.contact;
    if (updates.photo !== undefined) dbUpdates.photo = updates.photo;

    console.log(`💾 Updating teacher ID: ${id}`);
    const updatedTeacher = await updateTeacherInDB(parseInt(id as string), dbUpdates);
    
    if (!updatedTeacher) {
      console.log(`❌ Teacher with ID ${id} not found`);
      return res.status(404).json({ error: 'Teacher not found' });
    }

    console.log(`✅ Teacher updated: ${updatedTeacher.name}`);
    res.status(200).json({ teacher: updatedTeacher });
  } catch (error) {
    console.error('❌ Error updating teacher:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(req: AuthenticatedRequest, res: VercelResponse, user: any) {
  // Only admin can delete teachers
  if (user.role !== 'admin') {
    console.log(`❌ Delete teacher blocked: insufficient role ${user.role}`);
    return res.status(403).json({ error: 'Only administrators can delete teachers' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      console.log('❌ Delete teacher failed: missing ID');
      return res.status(400).json({ error: 'Teacher ID is required' });
    }
    
    console.log(`🗑️ Attempting to delete teacher ID: ${id}`);
    const deleted = await deleteTeacherFromDB(parseInt(id as string));
    
    if (!deleted) {
      console.log(`❌ Teacher with ID ${id} not found for deletion`);
      return res.status(404).json({ error: 'Teacher not found' });
    }

    console.log(`✅ Teacher deleted successfully: ID ${id}`);
    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting teacher:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export the handler with authentication middleware
export default withAuth(handler);