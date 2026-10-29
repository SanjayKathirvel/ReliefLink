import { Router, Response } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js';

const router = Router();

function convertToCSV(items: any[]): string {
  if (items.length === 0) return '';
  const headers = Object.keys(items[0]);
  const rows = items.map(item => {
    return headers
      .map(header => {
        const val = item[header];
        if (val === null || val === undefined) return '""';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

router.get('/requests/csv', authenticateToken, requireRole(['GOVERNMENT', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listRes = await query(`
      SELECT r.request_code, r.emergency_type, r.urgency, r.priority, r.status,
             r.affected_count, r.latitude, r.longitude, r.landmark, r.description,
             u.full_name as citizen_name, u.email as citizen_email, r.created_at, r.updated_at
      FROM distress_requests r
      LEFT JOIN users u ON r.citizen_id = u.id
      ORDER BY r.created_at DESC
    `);

    const csv = convertToCSV(listRes.rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="relieflink-requests-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to export CSV.' } });
  }
});

router.get('/resources/csv', authenticateToken, requireRole(['GOVERNMENT', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listRes = await query(`
      SELECT r.name, r.category, r.total_quantity, r.available_quantity, r.allocated_quantity,
             r.delivered_quantity, r.damaged_quantity, r.unit, rc.name as relief_center, r.updated_at
      FROM resources r
      LEFT JOIN relief_centers rc ON r.relief_center_id = rc.id
      ORDER BY r.category ASC, r.name ASC
    `);

    const csv = convertToCSV(listRes.rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="relieflink-resources-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to export CSV.' } });
  }
});

router.get('/audit-logs/csv', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listRes = await query(`
      SELECT id, actor_email, actor_role, action, entity, entity_id, reason, ip_address, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 1000
    `);

    const csv = convertToCSV(listRes.rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="relieflink-audit-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to export CSV.' } });
  }
});

export default router;
