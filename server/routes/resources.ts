import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../db/index.js';
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = Router();
let ioInstance: any = null;

export function setResourcesIo(io: any) {
  ioInstance = io;
}

// 1. List all resources
router.get('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listRes = await query(`
      SELECT r.*, rc.name as relief_center_name
      FROM resources r
      LEFT JOIN relief_centers rc ON r.relief_center_id = rc.id
      ORDER BY r.category ASC, r.name ASC
    `);

    return res.json({
      success: true,
      data: {
        resources: listRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve resources.' },
    });
  }
});

// 2. Add New Resource Item (Admin or Government)
router.post('/', authenticateToken, requireRole(['GOVERNMENT', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      category: z.enum(['FOOD', 'WATER', 'MEDICINE', 'BLANKETS', 'EMERGENCY_KITS', 'OTHER']),
      totalQuantity: z.number().int().min(0),
      unit: z.string().default('units'),
      reliefCenterId: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues.map(i => i.message).join(', ') },
      });
    }

    const { name, category, totalQuantity, unit, reliefCenterId } = parsed.data;
    const resourceId = 'res-' + crypto.randomUUID();
    const user = req.user!;

    await query(
      `INSERT INTO resources 
       (id, name, category, total_quantity, available_quantity, reserved_quantity, allocated_quantity, delivered_quantity, damaged_quantity, unit, relief_center_id)
       VALUES ($1, $2, $3, $4, $4, 0, 0, 0, 0, $5, $6)`,
      [resourceId, name, category, totalQuantity, unit, reliefCenterId || null]
    );

    // Record initial transaction
    const txId = 'rtx-' + crypto.randomUUID();
    await query(
      `INSERT INTO resource_transactions (id, resource_id, type, quantity, user_id, reason)
       VALUES ($1, $2, 'RECEIVED', $3, $4, 'Initial resource depot intake')`,
      [txId, resourceId, totalQuantity, user.id]
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_RESOURCE',
      entity: 'resources',
      entityId: resourceId,
      newValues: { name, category, totalQuantity, unit },
      ipAddress: req.ip,
    });

    if (ioInstance) {
      ioInstance.emit('resource:inventory_changed', { resourceId, name, availableQuantity: totalQuantity });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: resourceId,
        name,
        category,
        totalQuantity,
        availableQuantity: totalQuantity,
        unit,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create resource.' },
    });
  }
});

// 3. Stock Movement / Inventory Adjustment Transaction
router.post('/:id/transaction', authenticateToken, requireRole(['GOVERNMENT', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, quantity, reason } = req.body;
    const user = req.user!;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Quantity must be a positive integer.' },
      });
    }

    const validTypes = ['RECEIVED', 'DAMAGED', 'EXPIRED', 'ADJUSTED', 'RETURNED'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TYPE', message: `Transaction type must be one of: ${validTypes.join(', ')}` },
      });
    }

    // Atomic query to prevent negative inventory
    let updateSql = '';
    let params: any[] = [];

    if (type === 'RECEIVED' || type === 'RETURNED') {
      updateSql = `
        UPDATE resources
        SET total_quantity = total_quantity + $1,
            available_quantity = available_quantity + $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *`;
      params = [qty, id];
    } else if (type === 'DAMAGED' || type === 'EXPIRED') {
      updateSql = `
        UPDATE resources
        SET available_quantity = available_quantity - $1,
            damaged_quantity = damaged_quantity + $1,
            updated_at = NOW()
        WHERE id = $2 AND available_quantity >= $1
        RETURNING *`;
      params = [qty, id];
    } else if (type === 'ADJUSTED') {
      // Direct adjustment safely
      updateSql = `
        UPDATE resources
        SET total_quantity = total_quantity + $1,
            available_quantity = available_quantity + $1,
            updated_at = NOW()
        WHERE id = $2 AND (available_quantity + $1) >= 0
        RETURNING *`;
      params = [qty, id];
    }

    const result = await query(updateSql, params);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_INVENTORY',
          message: 'Operation would result in negative available inventory. Action rejected.',
        },
      });
    }

    const updatedResource = result.rows[0];

    // Log transaction
    const txId = 'rtx-' + crypto.randomUUID();
    await query(
      `INSERT INTO resource_transactions (id, resource_id, type, quantity, user_id, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [txId, id, type, qty, user.id, reason || null]
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'RESOURCE_TRANSACTION',
      entity: 'resources',
      entityId: id,
      newValues: { type, quantity: qty, availableQuantity: updatedResource.available_quantity },
      reason,
      ipAddress: req.ip,
    });

    if (ioInstance) {
      ioInstance.emit('resource:inventory_changed', {
        resourceId: id,
        name: updatedResource.name,
        availableQuantity: updatedResource.available_quantity,
        totalQuantity: updatedResource.total_quantity,
      });
    }

    return res.json({
      success: true,
      data: {
        resource: updatedResource,
        transactionId: txId,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to record stock transaction.' },
    });
  }
});

// 4. ATOMIC RESOURCE ALLOCATION WITH CONCURRENCY AND PARTIAL FULFILLMENT SUPPORT
router.post('/allocate', authenticateToken, requireRole(['VOLUNTEER', 'GOVERNMENT', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId, resourceId, requestedQty } = req.body;
    const user = req.user!;

    const qty = parseInt(requestedQty, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Requested quantity must be positive.' },
      });
    }

    // Check request exists
    const reqRes = await query('SELECT id, request_code FROM distress_requests WHERE id = $1', [requestId]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Target distress request does not exist.' },
      });
    }

    // Inspect current resource availability
    const resRes = await query('SELECT * FROM resources WHERE id = $1', [resourceId]);
    if (resRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found.' },
      });
    }

    const resource = resRes.rows[0];
    const available = resource.available_quantity;

    if (available <= 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'OUT_OF_STOCK',
          message: `Resource "${resource.name}" has 0 available quantity. Cannot allocate.`,
        },
      });
    }

    // Support partial fulfillment if available < requested
    const allocQty = Math.min(available, qty);
    const isPartial = allocQty < qty;

    // ATOMIC CONCURRENCY UPDATE:
    // Subtract allocQty ensuring available_quantity >= allocQty
    const atomicUpdate = await query(
      `UPDATE resources
       SET available_quantity = available_quantity - $1,
           allocated_quantity = allocated_quantity + $1,
           updated_at = NOW()
       WHERE id = $2 AND available_quantity >= $1
       RETURNING *`,
      [allocQty, resourceId]
    );

    if (atomicUpdate.rows.length === 0) {
      // Concurrent race condition occurred: another operator grabbed stock!
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONCURRENT_ALLOCATION_CONFLICT',
          message: 'Available inventory was modified by a concurrent operation. Please review refreshed balance.',
        },
      });
    }

    const updatedRes = atomicUpdate.rows[0];
    const allocStatus = isPartial ? 'PARTIAL' : 'ALLOCATED';

    // Record allocation
    const allocId = 'ra-' + crypto.randomUUID();
    await query(
      `INSERT INTO resource_allocations (id, request_id, resource_id, requested_qty, allocated_qty, status, allocated_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [allocId, requestId, resourceId, qty, allocQty, allocStatus, user.id]
    );

    // Record transaction
    const txId = 'rtx-' + crypto.randomUUID();
    await query(
      `INSERT INTO resource_transactions (id, resource_id, type, quantity, user_id, reason, reference_request_id)
       VALUES ($1, $2, 'ALLOCATED', $3, $4, $5, $6)`,
      [
        txId,
        resourceId,
        allocQty,
        user.id,
        `Allocated to ${reqRes.rows[0].request_code} (${allocStatus})`,
        requestId,
      ]
    );

    // Audit log
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'ALLOCATE_RESOURCE',
      entity: 'resource_allocations',
      entityId: allocId,
      newValues: {
        requestId,
        requestCode: reqRes.rows[0].request_code,
        resourceName: resource.name,
        requestedQty: qty,
        allocatedQty: allocQty,
        status: allocStatus,
      },
      ipAddress: req.ip,
    });

    if (ioInstance) {
      ioInstance.emit('resource:inventory_changed', {
        resourceId,
        name: resource.name,
        availableQuantity: updatedRes.available_quantity,
        allocatedQuantity: updatedRes.allocated_quantity,
      });
    }

    return res.json({
      success: true,
      data: {
        allocationId: allocId,
        requestId,
        resourceId,
        resourceName: resource.name,
        requestedQty: qty,
        allocatedQty: allocQty,
        status: allocStatus,
        remainingUnfulfilled: qty - allocQty,
        availableRemaining: updatedRes.available_quantity,
      },
    });
  } catch (err: any) {
    console.error('[Allocate Resource Error]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to allocate resource.' },
    });
  }
});

export default router;
