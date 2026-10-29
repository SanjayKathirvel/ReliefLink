import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../db/index.js';
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = Router();
let ioInstance: any = null;

export function setDisastersIo(io: any) {
  ioInstance = io;
}

// 1. List Disasters and Zones
router.get('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const disastersRes = await query(`
      SELECT d.*,
             COALESCE(json_agg(dz.*) FILTER (WHERE dz.id IS NOT NULL), '[]') as zones
      FROM disasters d
      LEFT JOIN disaster_zones dz ON d.id = dz.disaster_id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `);

    return res.json({
      success: true,
      data: {
        disasters: disastersRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve disasters.' },
    });
  }
});

// 2. Create Disaster (Government or Admin)
router.post('/', authenticateToken, requireRole(['GOVERNMENT', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(3),
      type: z.enum(['FLOOD', 'CYCLONE', 'EARTHQUAKE', 'LANDSLIDE', 'TSUNAMI', 'FIRE', 'OTHER']),
      severity: z.enum(['CRITICAL', 'SEVERE', 'MODERATE', 'MINOR']),
      affectedRegion: z.string().min(2),
      description: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues.map(i => i.message).join(', ') },
      });
    }

    const { name, type, severity, affectedRegion, description } = parsed.data;
    const user = req.user!;
    const id = 'dis-' + crypto.randomUUID();

    await query(
      `INSERT INTO disasters (id, name, type, severity, affected_region, status, description)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6)`,
      [id, name, type, severity, affectedRegion, description || null]
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_DISASTER',
      entity: 'disasters',
      entityId: id,
      newValues: { name, type, severity, affectedRegion },
      ipAddress: req.ip,
    });

    if (ioInstance) {
      ioInstance.emit('disaster:created', { id, name, type, severity, affectedRegion });
    }

    return res.status(201).json({
      success: true,
      data: { id, name, type, severity, affectedRegion, status: 'ACTIVE' },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to declare disaster.' },
    });
  }
});

// 3. Add Hazard Zone to Disaster
router.post('/:id/zones', authenticateToken, requireRole(['GOVERNMENT', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      name: z.string().min(2),
      zoneType: z.enum(['HIGH_RISK', 'EVACUATION', 'AFFECTED', 'SAFE']),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radiusMeters: z.number().positive().default(1500),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues.map(i => i.message).join(', ') },
      });
    }

    const { name, zoneType, severity, latitude, longitude, radiusMeters } = parsed.data;
    const user = req.user!;
    const zoneId = 'dz-' + crypto.randomUUID();

    await query(
      `INSERT INTO disaster_zones (id, disaster_id, name, zone_type, severity, latitude, longitude, radius_meters)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [zoneId, id, name, zoneType, severity, latitude, longitude, radiusMeters]
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_DISASTER_ZONE',
      entity: 'disaster_zones',
      entityId: zoneId,
      newValues: { disasterId: id, name, zoneType, latitude, longitude, radiusMeters },
      ipAddress: req.ip,
    });

    if (ioInstance) {
      ioInstance.emit('disaster:zone_added', { zoneId, disasterId: id, name, zoneType, severity, latitude, longitude, radiusMeters });
    }

    return res.status(201).json({
      success: true,
      data: { id: zoneId, disasterId: id, name, zoneType, severity, latitude, longitude, radiusMeters },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to define disaster zone.' },
    });
  }
});

// 4. List Relief Centers & Shelters
router.get('/relief-centers', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rcRes = await query(`
      SELECT rc.*,
             (rc.capacity - rc.occupancy) as available_beds,
             ROUND((rc.occupancy::numeric / NULLIF(rc.capacity, 0) * 100), 1) as occupancy_percentage
      FROM relief_centers rc
      ORDER BY rc.center_type ASC, rc.name ASC
    `);

    return res.json({
      success: true,
      data: {
        centers: rcRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch relief centers.' },
    });
  }
});

// 5. Create Relief Center
router.post('/relief-centers', authenticateToken, requireRole(['GOVERNMENT', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(3),
      centerType: z.enum(['SHELTER', 'FOOD', 'MEDICAL', 'RESCUE', 'WATER']),
      capacity: z.number().int().positive(),
      occupancy: z.number().int().min(0).default(0),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues.map(i => i.message).join(', ') },
      });
    }

    const { name, centerType, capacity, occupancy, latitude, longitude, contactPhone, address } = parsed.data;

    if (occupancy > capacity) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Initial occupancy cannot exceed maximum capacity.' },
      });
    }

    const id = 'rc-' + crypto.randomUUID();
    const user = req.user!;
    const status = occupancy >= capacity ? 'FULL' : 'OPERATIONAL';

    await query(
      `INSERT INTO relief_centers (id, name, center_type, capacity, occupancy, latitude, longitude, contact_phone, operating_status, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, name, centerType, capacity, occupancy, latitude, longitude, contactPhone || null, status, address || null]
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_RELIEF_CENTER',
      entity: 'relief_centers',
      entityId: id,
      newValues: { name, centerType, capacity, occupancy, status },
      ipAddress: req.ip,
    });

    if (ioInstance) {
      ioInstance.emit('center:updated', { id, name, capacity, occupancy, status });
    }

    return res.status(201).json({
      success: true,
      data: { id, name, centerType, capacity, occupancy, status },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create relief center.' },
    });
  }
});

// 6. Update Shelter Occupancy with Strict Capacity Validation
router.patch('/relief-centers/:id/occupancy', authenticateToken, requireRole(['VOLUNTEER', 'GOVERNMENT', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { occupancyChange, setAbsoluteOccupancy } = req.body;
    const user = req.user!;

    const curRes = await query('SELECT * FROM relief_centers WHERE id = $1', [id]);
    if (curRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Relief center not found' } });
    }

    const center = curRes.rows[0];
    let newOccupancy = center.occupancy;

    if (typeof setAbsoluteOccupancy === 'number') {
      newOccupancy = setAbsoluteOccupancy;
    } else if (typeof occupancyChange === 'number') {
      newOccupancy += occupancyChange;
    } else {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Specify either occupancyChange or setAbsoluteOccupancy.' },
      });
    }

    if (newOccupancy < 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CAPACITY', message: 'Occupancy cannot be less than 0.' },
      });
    }

    if (newOccupancy > center.capacity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CAPACITY_EXCEEDED',
          message: `Cannot exceed maximum capacity (${center.capacity}). Requested: ${newOccupancy}.`,
        },
      });
    }

    const newStatus = newOccupancy >= center.capacity ? 'FULL' : 'OPERATIONAL';

    await query(
      `UPDATE relief_centers
       SET occupancy = $1, operating_status = $2
       WHERE id = $3`,
      [newOccupancy, newStatus, id]
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_SHELTER_OCCUPANCY',
      entity: 'relief_centers',
      entityId: id,
      oldValues: { occupancy: center.occupancy, status: center.operating_status },
      newValues: { occupancy: newOccupancy, status: newStatus },
      ipAddress: req.ip,
    });

    if (ioInstance) {
      ioInstance.emit('center:updated', { id, name: center.name, occupancy: newOccupancy, capacity: center.capacity, status: newStatus });
    }

    return res.json({
      success: true,
      data: {
        id,
        name: center.name,
        capacity: center.capacity,
        occupancy: newOccupancy,
        availableBeds: center.capacity - newOccupancy,
        status: newStatus,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update occupancy.' },
    });
  }
});

export default router;
