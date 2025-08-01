import { sql, withDatabaseErrorHandling } from '../utils/database';

export interface Teacher {
  id: number;
  name: string;
  designation: string;
  base_salary: number;
  join_date: string;
  contact: string;
  photo: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTeacherData {
  name: string;
  designation: string;
  base_salary: number;
  join_date: string;
  contact: string;
  photo?: string;
}

export interface UpdateTeacherData {
  name?: string;
  designation?: string;
  base_salary?: number;
  join_date?: string;
  contact?: string;
  photo?: string;
}

// Get all teachers
export async function getAllTeachers(): Promise<Teacher[]> {
  return withDatabaseErrorHandling(async () => {
    console.log('📖 [TEACHER-GET-ALL] Executing SELECT query for all teachers...');
    
    const startTime = Date.now();
    const result = await sql`
      SELECT id, name, designation, base_salary, join_date, contact, photo, created_at, updated_at 
      FROM teachers 
      ORDER BY id ASC
    `;
    const queryTime = Date.now() - startTime;
    
    console.log(`✅ [TEACHER-GET-ALL] Query executed in ${queryTime}ms`);
    console.log(`✅ [TEACHER-GET-ALL] Found ${result.rows.length} teachers in database`);
    console.log(`📊 [TEACHER-GET-ALL] Sample data:`, result.rows.slice(0, 3).map(t => ({
      id: t.id,
      name: t.name,
      designation: t.designation
    })));
    
    return result.rows as Teacher[];
  }, 'getAllTeachers');
}

// Get teacher by ID
export async function getTeacherById(id: number): Promise<Teacher | null> {
  return withDatabaseErrorHandling(async () => {
    console.log(`📖 Fetching teacher by ID: ${id}`);
    
    const result = await sql`
      SELECT id, name, designation, base_salary, join_date, contact, photo, created_at, updated_at 
      FROM teachers 
      WHERE id = ${id}
    `;
    
    if (result.rows.length === 0) {
      console.log(`❌ Teacher with ID ${id} not found`);
      return null;
    }
    
    console.log(`✅ Found teacher: ${result.rows[0].name}`);
    return result.rows[0] as Teacher;
  }, 'getTeacherById');
}

// Create new teacher
export async function createTeacher(teacherData: CreateTeacherData): Promise<Teacher> {
  return withDatabaseErrorHandling(async () => {
    console.log(`💾 Creating new teacher: ${teacherData.name}`);
    
    const result = await sql`
      INSERT INTO teachers (name, designation, base_salary, join_date, contact, photo)
      VALUES (${teacherData.name}, ${teacherData.designation}, ${teacherData.base_salary}, 
              ${teacherData.join_date}, ${teacherData.contact}, ${teacherData.photo || ''})
      RETURNING id, name, designation, base_salary, join_date, contact, photo, created_at, updated_at
    `;
    
    const newTeacher = result.rows[0] as Teacher;
    console.log(`✅ Created teacher with ID: ${newTeacher.id}`);
    
    return newTeacher;
  }, 'createTeacher');
}

// Update teacher
export async function updateTeacher(id: number, updateData: UpdateTeacherData): Promise<Teacher | null> {
  return withDatabaseErrorHandling(async () => {
    console.log(`💾 Updating teacher ID: ${id}`);
    
    // Build dynamic update query based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.designation !== undefined) {
      updateFields.push(`designation = $${paramCount++}`);
      values.push(updateData.designation);
    }
    if (updateData.base_salary !== undefined) {
      updateFields.push(`base_salary = $${paramCount++}`);
      values.push(updateData.base_salary);
    }
    if (updateData.join_date !== undefined) {
      updateFields.push(`join_date = $${paramCount++}`);
      values.push(updateData.join_date);
    }
    if (updateData.contact !== undefined) {
      updateFields.push(`contact = $${paramCount++}`);
      values.push(updateData.contact);
    }
    if (updateData.photo !== undefined) {
      updateFields.push(`photo = $${paramCount++}`);
      values.push(updateData.photo);
    }

    if (updateFields.length === 0) {
      console.log('❌ No fields to update');
      return null;
    }

    // Add updated_at field
    updateFields.push(`updated_at = NOW()`);
    values.push(id); // WHERE clause parameter

    const query = `
      UPDATE teachers 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, designation, base_salary, join_date, contact, photo, created_at, updated_at
    `;

    const result = await sql.query(query, values);
    
    if (result.rows.length === 0) {
      console.log(`❌ Teacher with ID ${id} not found for update`);
      return null;
    }
    
    const updatedTeacher = result.rows[0] as Teacher;
    console.log(`✅ Updated teacher: ${updatedTeacher.name}`);
    
    return updatedTeacher;
  }, 'updateTeacher');
}

// Delete teacher
export async function deleteTeacher(id: number): Promise<boolean> {
  return withDatabaseErrorHandling(async () => {
    console.log(`🗑️ Deleting teacher ID: ${id}`);
    
    const result = await sql`
      DELETE FROM teachers 
      WHERE id = ${id}
      RETURNING id, name
    `;
    
    if (result.rows.length === 0) {
      console.log(`❌ Teacher with ID ${id} not found for deletion`);
      return false;
    }
    
    console.log(`✅ Deleted teacher: ${result.rows[0].name}`);
    return true;
  }, 'deleteTeacher');
}

// Bulk insert teachers (for migration)
export async function bulkInsertTeachers(teachers: CreateTeacherData[]): Promise<number> {
  return withDatabaseErrorHandling(async () => {
    console.log(`💾 Bulk inserting ${teachers.length} teachers...`);
    
    if (teachers.length === 0) {
      return 0;
    }

    // Build values for bulk insert
    const values: any[] = [];
    const valueStrings: string[] = [];
    let paramCount = 1;

    for (const teacher of teachers) {
      valueStrings.push(`($${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++})`);
      values.push(
        teacher.name,
        teacher.designation,
        teacher.base_salary,
        teacher.join_date,
        teacher.contact,
        teacher.photo || ''
      );
    }

    const query = `
      INSERT INTO teachers (name, designation, base_salary, join_date, contact, photo)
      VALUES ${valueStrings.join(', ')}
      RETURNING id
    `;

    const result = await sql.query(query, values);
    
    console.log(`✅ Bulk inserted ${result.rows.length} teachers`);
    return result.rows.length;
  }, 'bulkInsertTeachers');
}

// Get teacher count
export async function getTeacherCount(): Promise<number> {
  return withDatabaseErrorHandling(async () => {
    const result = await sql`SELECT COUNT(*) as count FROM teachers`;
    return parseInt(result.rows[0].count);
  }, 'getTeacherCount');
}