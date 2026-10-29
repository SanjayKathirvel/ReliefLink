import { Router, Response } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = Router();

// 1. List Users
router.get('/users', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usersRes = await query(`
      SELECT id, email, full_name, phone, role, status, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      data: { users: usersRes.rows },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch users.' } });
  }
});

// 2. Change User Status (ACTIVE, SUSPENDED)
router.patch('/users/:id/status', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUser = req.user!;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } });
    }

    const cur = await query('SELECT email, status FROM users WHERE id = $1', [id]);
    if (cur.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    await query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);

    await recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'UPDATE_USER_STATUS',
      entity: 'users',
      entityId: id,
      oldValues: { status: cur.rows[0].status },
      newValues: { status },
      ipAddress: req.ip,
    });

    return res.json({ success: true, data: { id, status } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update user status.' } });
  }
});

// 3. Change User Role
router.patch('/users/:id/role', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminUser = req.user!;

    if (!['CITIZEN', 'VOLUNTEER', 'GOVERNMENT', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid role' } });
    }

    const cur = await query('SELECT role, email FROM users WHERE id = $1', [id]);
    if (cur.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, id]);

    await recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'UPDATE_USER_ROLE',
      entity: 'users',
      entityId: id,
      oldValues: { role: cur.rows[0].role },
      newValues: { role },
      ipAddress: req.ip,
    });

    return res.json({ success: true, data: { id, role } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to change role.' } });
  }
});

// 4. Duplicate Candidates Review List
router.get('/duplicates', authenticateToken, requireRole(['ADMIN', 'GOVERNMENT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dupsRes = await query(`
      SELECT dc.*,
             r1.request_code as req_code, r1.emergency_type as req_type, r1.urgency as req_urgency, r1.description as req_desc, r1.latitude as req_lat, r1.longitude as req_lon,
             r2.request_code as cand_code, r2.emergency_type as cand_type, r2.urgency as cand_urgency, r2.description as cand_desc, r2.latitude as cand_lat, r2.longitude as cand_lon
      FROM duplicate_candidates dc
      JOIN distress_requests r1 ON dc.request_id = r1.id
      JOIN distress_requests r2 ON dc.candidate_id = r2.id
      ORDER BY dc.created_at DESC
    `);

    return res.json({
      success: true,
      data: { duplicates: dupsRes.rows },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch duplicates.' } });
  }
});

// 5. Review Duplicate Candidate (CONFIRM or REJECT)
router.post('/duplicates/:id/review', authenticateToken, requireRole(['ADMIN', 'GOVERNMENT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { decision } = req.body; // 'CONFIRM' or 'REJECT'
    const user = req.user!;

    if (!['CONFIRM', 'REJECT'].includes(decision)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Decision must be CONFIRM or REJECT.' } });
    }

    const dupRes = await query('SELECT * FROM duplicate_candidates WHERE id = $1', [id]);
    if (dupRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Candidate record not found.' } });
    }

    const cand = dupRes.rows[0];
    const newStatus = decision === 'CONFIRM' ? 'CONFIRMED_DUPLICATE' : 'REJECTED';

    await query(
      `UPDATE duplicate_candidates SET status = $1, reviewed_by_id = $2 WHERE id = $3`,
      [newStatus, user.id, id]
    );

    if (decision === 'CONFIRM') {
      // Mark candidate request as duplicate of primary
      await query(
        `UPDATE distress_requests SET status = 'DUPLICATE', duplicate_flag = TRUE, duplicate_of_id = $1 WHERE id = $2`,
        [cand.candidate_id, cand.request_id]
      );
    } else {
      // Reject duplicate suspicion
      await query(
        `UPDATE distress_requests SET duplicate_flag = FALSE, duplicate_of_id = NULL WHERE id = $1`,
        [cand.request_id]
      );
    }

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'REVIEW_DUPLICATE_CANDIDATE',
      entity: 'duplicate_candidates',
      entityId: id,
      newValues: { decision, status: newStatus },
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      data: { id, decision, status: newStatus },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to record review.' } });
  }
});

// 6. Audit Logs Query
router.get('/audit-logs', authenticateToken, requireRole(['ADMIN', 'GOVERNMENT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, entity, page = '1', limit = '50' } = req.query as any;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (action) {
      conditions.push(`action ILIKE $${pIdx++}`);
      params.push(`%${action}%`);
    }

    if (entity) {
      conditions.push(`entity = $${pIdx++}`);
      params.push(entity);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const countRes = await query(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const listRes = await query(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`,
      [...params, parseInt(limit, 10), offset]
    );

    return res.json({
      success: true,
      data: {
        logs: listRes.rows,
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to retrieve audit logs.' } });
  }
});

export default router;
