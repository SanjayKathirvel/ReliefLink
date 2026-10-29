import { Router, Response } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = Router();
let ioInstance: any = null;

export function setVolunteersIo(io: any) {
  ioInstance = io;
}

// 1. List all volunteers (Government, Admin, or Volunteers)
router.get('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listRes = await query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.status as user_status,
             vp.skills, vp.vehicle_type, vp.availability_status,
             vp.current_latitude, vp.current_longitude, vp.last_ping_at,
             (SELECT COUNT(*) FROM request_assignments ra WHERE ra.volunteer_id = u.id AND ra.status != 'CANCELLED') as total_assignments,
             (SELECT COUNT(*) FROM request_assignments ra WHERE ra.volunteer_id = u.id AND ra.status IN ('ASSIGNED', 'EN_ROUTE', 'ARRIVED')) as active_assignments
      FROM users u
      JOIN volunteer_profiles vp ON u.id = vp.user_id
      WHERE u.role = 'VOLUNTEER' OR u.role = 'CITIZEN'
      ORDER BY vp.availability_status ASC, u.full_name ASC
    `);

    return res.json({
      success: true,
      data: {
        volunteers: listRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch volunteers' },
    });
  }
});

// 2. Volunteer or Citizen Responder updates own availability
router.patch('/availability', authenticateToken, requireRole(['VOLUNTEER', 'CITIZEN', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_BREAK'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Availability status must be one of: ${validStatuses.join(', ')}` },
      });
    }

    const user = req.user!;
    await query(
      `UPDATE volunteer_profiles SET availability_status = $1 WHERE user_id = $2`,
      [status, user.id]
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_VOLUNTEER_AVAILABILITY',
      entity: 'volunteer_profiles',
      entityId: user.id,
      newValues: { availabilityStatus: status },
      ipAddress: req.ip,
    });

    if (ioInstance) {
      ioInstance.emit('volunteer:availability_changed', {
        volunteerId: user.id,
        status,
        fullName: user.fullName,
      });
    }

    return res.json({
      success: true,
      data: { message: `Availability set to ${status}.`, status },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update availability.' },
    });
  }
});

// 3. Volunteer or Citizen Responder live GPS ping
router.post('/location', authenticateToken, requireRole(['VOLUNTEER', 'CITIZEN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Valid latitude and longitude are required.' },
      });
    }

    const user = req.user!;
    await query(
      `UPDATE volunteer_profiles
       SET current_latitude = $1, current_longitude = $2, last_ping_at = NOW()
       WHERE user_id = $3`,
      [latitude, longitude, user.id]
    );

    if (ioInstance) {
      ioInstance.emit('volunteer:location_updated', {
        volunteerId: user.id,
        fullName: user.fullName,
        latitude,
        longitude,
      });
    }

    return res.json({
      success: true,
      data: { message: 'GPS location recorded successfully.' },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to record location.' },
    });
  }
});

// 4. Get active and completed assignments for logged-in volunteer
router.get('/my-assignments', authenticateToken, requireRole(['VOLUNTEER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const resAssignments = await query(
      `SELECT ra.*, 
              dr.request_code, dr.emergency_type, dr.urgency, dr.priority,
              dr.description, dr.landmark, dr.latitude, dr.longitude, dr.status as request_status,
              dr.contact_phone, dr.evidence_url,
              u.full_name as citizen_name, u.phone as citizen_phone
       FROM request_assignments ra
       JOIN distress_requests dr ON ra.request_id = dr.id
       JOIN users u ON dr.citizen_id = u.id
       WHERE ra.volunteer_id = $1
       ORDER BY ra.assigned_at DESC`,
      [user.id]
    );

    return res.json({
      success: true,
      data: {
        assignments: resAssignments.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve assignments.' },
    });
  }
});

export default router;
