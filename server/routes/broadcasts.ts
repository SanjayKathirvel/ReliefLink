import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = Router();
let ioInstance: any = null;

export function setBroadcastsIo(io: any) {
  ioInstance = io;
}

// 1. Get active broadcasts
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await query(`
      SELECT eb.*, u.full_name as sender_name
      FROM emergency_broadcasts eb
      LEFT JOIN users u ON eb.sender_id = u.id
      WHERE eb.active = TRUE
      ORDER BY eb.created_at DESC
      LIMIT 20
    `);

    return res.json({
      success: true,
      data: {
        broadcasts: list.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch broadcasts' },
    });
  }
});

// 2. Issue Emergency Broadcast (Government or Admin)
router.post('/', authenticateToken, requireRole(['GOVERNMENT', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      title: z.string().min(3),
      message: z.string().min(5),
      severity: z.enum(['CRITICAL', 'HIGH', 'ADVISORY']),
      targetAudience: z.enum(['ALL', 'VOLUNTEERS', 'CITIZENS', 'ZONE']).default('ALL'),
      targetZone: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues.map(i => i.message).join(', ') },
      });
    }

    const { title, message, severity, targetAudience, targetZone } = parsed.data;
    const user = req.user!;
    const id = 'eb-' + crypto.randomUUID();

    await query(
      `INSERT INTO emergency_broadcasts (id, sender_id, title, message, severity, target_audience, target_zone, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
      [id, user.id, title, message, severity, targetAudience, targetZone || null]
    );

    // Create persistent notifications for target group
    const notifId = 'notif-' + crypto.randomUUID();
    const targetRole = targetAudience === 'VOLUNTEERS' ? 'VOLUNTEER' : targetAudience === 'CITIZENS' ? 'CITIZEN' : null;
    await query(
      `INSERT INTO notifications (id, target_role, title, message, type, reference_id)
       VALUES ($1, $2, $3, $4, 'BROADCAST', $5)`,
      [notifId, targetRole, `BROADCAST: ${title}`, message, id]
    );

    // Record audit log
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'EMERGENCY_BROADCAST',
      entity: 'emergency_broadcasts',
      entityId: id,
      newValues: { title, severity, targetAudience, targetZone },
      ipAddress: req.ip,
    });

    const payload = {
      id,
      title,
      message,
      severity,
      targetAudience,
      targetZone,
      senderName: user.fullName,
      createdAt: new Date().toISOString(),
    };

    if (ioInstance) {
      ioInstance.emit('broadcast:emergency', payload);
    }

    return res.status(201).json({
      success: true,
      data: payload,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to issue broadcast.' },
    });
  }
});

export default router;
