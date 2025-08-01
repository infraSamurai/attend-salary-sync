import { sql, withDatabaseErrorHandling } from '../utils/database';

export interface Attendance {
  id: number;
  teacher_id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  created_at?: string;
  updated_at?: string;
}

export interface CreateAttendanceData {
  teacher_id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface UpdateAttendanceData {
  status: 'present' | 'absent' | 'late';
}

// Get all attendance records
export async function getAllAttendance(): Promise<Attendance[]> {
  return withDatabaseErrorHandling(async () => {
    console.log('📖 Fetching all attendance records from database...');
    
    const result = await sql`
      SELECT id, teacher_id, date, status, created_at, updated_at 
      FROM attendance 
      ORDER BY date DESC, teacher_id ASC
    `;
    
    console.log(`✅ Found ${result.rows.length} attendance records in database`);
    return result.rows as Attendance[];
  }, 'getAllAttendance');
}

// Get attendance by teacher ID
export async function getAttendanceByTeacherId(teacherId: number): Promise<Attendance[]> {
  return withDatabaseErrorHandling(async () => {
    console.log(`📖 Fetching attendance for teacher ID: ${teacherId}`);
    
    const result = await sql`
      SELECT id, teacher_id, date, status, created_at, updated_at 
      FROM attendance 
      WHERE teacher_id = ${teacherId}
      ORDER BY date DESC
    `;
    
    console.log(`✅ Found ${result.rows.length} attendance records for teacher ${teacherId}`);
    return result.rows as Attendance[];
  }, 'getAttendanceByTeacherId');
}

// Get attendance by date
export async function getAttendanceByDate(date: string): Promise<Attendance[]> {
  return withDatabaseErrorHandling(async () => {
    console.log(`📖 Fetching attendance for date: ${date}`);
    
    const result = await sql`
      SELECT a.id, a.teacher_id, a.date, a.status, a.created_at, a.updated_at,
             t.name as teacher_name
      FROM attendance a
      JOIN teachers t ON a.teacher_id = t.id
      WHERE a.date = ${date}
      ORDER BY t.name ASC
    `;
    
    console.log(`✅ Found ${result.rows.length} attendance records for ${date}`);
    return result.rows as Attendance[];
  }, 'getAttendanceByDate');
}

// Get attendance by date range
export async function getAttendanceByDateRange(startDate: string, endDate: string): Promise<Attendance[]> {
  return withDatabaseErrorHandling(async () => {
    console.log(`📖 Fetching attendance from ${startDate} to ${endDate}`);
    
    const result = await sql`
      SELECT id, teacher_id, date, status, created_at, updated_at 
      FROM attendance 
      WHERE date >= ${startDate} AND date <= ${endDate}
      ORDER BY date DESC, teacher_id ASC
    `;
    
    console.log(`✅ Found ${result.rows.length} attendance records in date range`);
    return result.rows as Attendance[];
  }, 'getAttendanceByDateRange');
}

// Create or update attendance record (upsert)
export async function upsertAttendance(attendanceData: CreateAttendanceData): Promise<Attendance> {
  return withDatabaseErrorHandling(async () => {
    console.log(`💾 Upserting attendance for teacher ${attendanceData.teacher_id} on ${attendanceData.date}`);
    
    const result = await sql`
      INSERT INTO attendance (teacher_id, date, status)
      VALUES (${attendanceData.teacher_id}, ${attendanceData.date}, ${attendanceData.status})
      ON CONFLICT (teacher_id, date) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id, teacher_id, date, status, created_at, updated_at
    `;
    
    const attendance = result.rows[0] as Attendance;
    console.log(`✅ Upserted attendance record with ID: ${attendance.id}`);
    
    return attendance;
  }, 'upsertAttendance');
}

// Update attendance record
export async function updateAttendance(id: number, updateData: UpdateAttendanceData): Promise<Attendance | null> {
  return withDatabaseErrorHandling(async () => {
    console.log(`💾 Updating attendance ID: ${id}`);
    
    const result = await sql`
      UPDATE attendance 
      SET status = ${updateData.status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, teacher_id, date, status, created_at, updated_at
    `;
    
    if (result.rows.length === 0) {
      console.log(`❌ Attendance record with ID ${id} not found for update`);
      return null;
    }
    
    const updatedAttendance = result.rows[0] as Attendance;
    console.log(`✅ Updated attendance record: ${updatedAttendance.status}`);
    
    return updatedAttendance;
  }, 'updateAttendance');
}

// Delete attendance record
export async function deleteAttendance(id: number): Promise<boolean> {
  return withDatabaseErrorHandling(async () => {
    console.log(`🗑️ Deleting attendance ID: ${id}`);
    
    const result = await sql`
      DELETE FROM attendance 
      WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.rows.length === 0) {
      console.log(`❌ Attendance record with ID ${id} not found for deletion`);
      return false;
    }
    
    console.log(`✅ Deleted attendance record with ID: ${id}`);
    return true;
  }, 'deleteAttendance');
}

// Delete attendance by teacher and date
export async function deleteAttendanceByTeacherAndDate(teacherId: number, date: string): Promise<boolean> {
  return withDatabaseErrorHandling(async () => {
    console.log(`🗑️ Deleting attendance for teacher ${teacherId} on ${date}`);
    
    const result = await sql`
      DELETE FROM attendance 
      WHERE teacher_id = ${teacherId} AND date = ${date}
      RETURNING id
    `;
    
    if (result.rows.length === 0) {
      console.log(`❌ Attendance record not found for teacher ${teacherId} on ${date}`);
      return false;
    }
    
    console.log(`✅ Deleted attendance record for teacher ${teacherId} on ${date}`);
    return true;
  }, 'deleteAttendanceByTeacherAndDate');
}

// Bulk insert attendance records (for migration)
export async function bulkInsertAttendance(attendanceRecords: CreateAttendanceData[]): Promise<number> {
  return withDatabaseErrorHandling(async () => {
    console.log(`💾 Bulk inserting ${attendanceRecords.length} attendance records...`);
    
    if (attendanceRecords.length === 0) {
      return 0;
    }

    // Build values for bulk insert
    const values: any[] = [];
    const valueStrings: string[] = [];
    let paramCount = 1;

    for (const record of attendanceRecords) {
      valueStrings.push(`($${paramCount++}, $${paramCount++}, $${paramCount++})`);
      values.push(record.teacher_id, record.date, record.status);
    }

    const query = `
      INSERT INTO attendance (teacher_id, date, status)
      VALUES ${valueStrings.join(', ')}
      ON CONFLICT (teacher_id, date) DO NOTHING
      RETURNING id
    `;

    const result = await sql.query(query, values);
    
    console.log(`✅ Bulk inserted ${result.rows.length} attendance records`);
    return result.rows.length;
  }, 'bulkInsertAttendance');
}

// Get attendance statistics
export async function getAttendanceStats(startDate?: string, endDate?: string): Promise<{
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  presentPercentage: number;
}> {
  return withDatabaseErrorHandling(async () => {
    console.log('📊 Calculating attendance statistics...');
    
    let whereClause = '';
    const params: string[] = [];
    
    if (startDate && endDate) {
      whereClause = 'WHERE date >= $1 AND date <= $2';
      params.push(startDate, endDate);
    } else if (startDate) {
      whereClause = 'WHERE date >= $1';
      params.push(startDate);
    } else if (endDate) {
      whereClause = 'WHERE date <= $1';
      params.push(endDate);
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count
      FROM attendance 
      ${whereClause}
    `;
    
    const result = await sql.query(query, params);
    const stats = result.rows[0];
    
    const totalRecords = parseInt(stats.total_records);
    const presentCount = parseInt(stats.present_count);
    const absentCount = parseInt(stats.absent_count);
    const lateCount = parseInt(stats.late_count);
    const presentPercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
    
    console.log(`✅ Attendance stats: ${presentCount}/${totalRecords} present (${presentPercentage}%)`);
    
    return {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      presentPercentage
    };
  }, 'getAttendanceStats');
}

// Get attendance count
export async function getAttendanceCount(): Promise<number> {
  return withDatabaseErrorHandling(async () => {
    const result = await sql`SELECT COUNT(*) as count FROM attendance`;
    return parseInt(result.rows[0].count);
  }, 'getAttendanceCount');
}