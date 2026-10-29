import { Router, Response } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.get('/overview', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Distress Requests stats
    const reqStats = await query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'OPEN') as open_requests,
        COUNT(*) FILTER (WHERE status = 'CLAIMED') as claimed_requests,
        COUNT(*) FILTER (WHERE status = 'EN_ROUTE' OR status = 'ARRIVED' OR status = 'IN_PROGRESS') as active_operations,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_requests,
        COUNT(*) FILTER (WHERE status = 'ESCALATED') as escalated_requests,
        COUNT(*) FILTER (WHERE priority = 'CRITICAL' AND status NOT IN ('RESOLVED', 'CANCELLED')) as critical_unresolved,
        COALESCE(SUM(affected_count) FILTER (WHERE status NOT IN ('RESOLVED', 'CANCELLED')), 0) as total_affected_people,
        COUNT(*) FILTER (WHERE community_responder_status = 'I_WILL_GO') as community_responders_active,
        COUNT(*) FILTER (WHERE assigned_rescue_team IS NOT NULL) as rescue_teams_assigned
      FROM distress_requests
    `);

    // 2. Volunteers & Community Responders stats
    const volStats = await query(`
      SELECT 
        COUNT(*) as total_volunteers,
        COUNT(*) FILTER (WHERE vp.availability_status = 'AVAILABLE') as available_volunteers,
        COUNT(*) FILTER (WHERE vp.availability_status = 'BUSY') as busy_volunteers,
        COUNT(*) FILTER (WHERE vp.availability_status = 'OFFLINE') as offline_volunteers
      FROM users u
      JOIN volunteer_profiles vp ON u.id = vp.user_id
      WHERE u.role = 'VOLUNTEER' OR u.role = 'CITIZEN'
    `);

    // 3. Shelters and Relief Centers
    const shelterStats = await query(`
      SELECT 
        COUNT(*) as total_centers,
        COALESCE(SUM(capacity), 0) as total_capacity,
        COALESCE(SUM(occupancy), 0) as total_occupancy,
        COALESCE(SUM(capacity - occupancy), 0) as available_capacity,
        COUNT(*) FILTER (WHERE operating_status = 'FULL') as full_centers
      FROM relief_centers
    `);

    // 4. Resource categories aggregate
    const resourceStats = await query(`
      SELECT 
        category,
        COALESCE(SUM(total_quantity), 0) as total,
        COALESCE(SUM(available_quantity), 0) as available,
        COALESCE(SUM(allocated_quantity), 0) as allocated
      FROM resources
      GROUP BY category
      ORDER BY category ASC
    `);

    // 5. Emergency types breakdown
    const typeStats = await query(`
      SELECT emergency_type, COUNT(*) as count
      FROM distress_requests
      GROUP BY emergency_type
      ORDER BY count DESC
    `);

    // 6. SLA and Response Metrics (Actual minutes from database timestamps)
    const slaMetrics = await query(`
      SELECT 
        ROUND(AVG(EXTRACT(EPOCH FROM (ra.assigned_at - dr.created_at)) / 60)::numeric, 1) as avg_claim_minutes,
        ROUND(AVG(EXTRACT(EPOCH FROM (ra.completed_at - dr.created_at)) / 60)::numeric, 1) as avg_resolution_minutes,
        COUNT(*) FILTER (WHERE dr.status = 'ESCALATED') as overdue_requests
      FROM distress_requests dr
      LEFT JOIN request_assignments ra ON dr.id = ra.request_id AND ra.status != 'CANCELLED'
    `);

    // 7. Coverage Gap Calculation
    // Find clusters of OPEN / ESCALATED requests that are > 3km away from any available volunteer
    const unservedReqs = await query(`
      SELECT r.id, r.request_code, r.latitude, r.longitude, r.urgency, r.priority, r.emergency_type, r.affected_count
      FROM distress_requests r
      WHERE r.status IN ('OPEN', 'ESCALATED')
    `);

    const availVolunteers = await query(`
      SELECT vp.current_latitude, vp.current_longitude, u.full_name
      FROM volunteer_profiles vp
      JOIN users u ON vp.user_id = u.id
      WHERE vp.availability_status = 'AVAILABLE' AND vp.current_latitude IS NOT NULL
    `);

    const coverageGaps: any[] = [];
    for (const req of unservedReqs.rows) {
      const lat1 = parseFloat(req.latitude);
      const lon1 = parseFloat(req.longitude);
      let nearestDistKm = 99999;

      for (const vol of availVolunteers.rows) {
        const lat2 = parseFloat(vol.current_latitude);
        const lon2 = parseFloat(vol.current_longitude);
        const d = 6371 * 2 * Math.asin(Math.sqrt(
          Math.sin(((lat2 - lat1) * Math.PI / 180) / 2) ** 2 +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(((lon2 - lon1) * Math.PI / 180) / 2) ** 2
        ));
        if (d < nearestDistKm) nearestDistKm = d;
      }

      // If no volunteer within 3.5 km or no available volunteers at all
      if (nearestDistKm > 3.5 || availVolunteers.rows.length === 0) {
        coverageGaps.push({
          requestId: req.id,
          requestCode: req.request_code,
          latitude: lat1,
          longitude: lon1,
          urgency: req.urgency,
          priority: req.priority,
          affectedCount: req.affected_count,
          emergencyType: req.emergency_type,
          nearestVolunteerDistKm: nearestDistKm < 90000 ? Math.round(nearestDistKm * 10) / 10 : null,
          gapSeverity: req.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        });
      }
    }

    return res.json({
      success: true,
      data: {
        requests: reqStats.rows[0],
        volunteers: volStats.rows[0],
        shelters: shelterStats.rows[0],
        resourcesByCategory: resourceStats.rows,
        requestsByType: typeStats.rows,
        slaMetrics: slaMetrics.rows[0],
        coverageGaps,
      },
    });
  } catch (err: any) {
    console.error('[Analytics Error]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to compute analytics.' },
    });
  }
});

export default router;
