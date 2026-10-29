import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../db/index.js';
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';
import { detectDuplicateRequest } from '../services/duplicateDetector.js';

const router = Router();
let ioInstance: any = null;

export function setRequestsIo(io: any) {
  ioInstance = io;
}

const createRequestSchema = z.object({
  emergencyType: z.enum(['FOOD', 'MEDICAL', 'SHELTER', 'RESCUE', 'WATER', 'OTHER']),
  urgency: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  affectedCount: z.number().int().min(1).default(1),
  description: z.string().min(5, 'Detailed description is required'),
  landmark: z.string().optional(),
  contactPhone: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  evidenceUrl: z.string().optional(),
});

function calculateEmergencyPriority(emergencyType: string, urgency: string, affectedCount: number): string {
  if (urgency === 'CRITICAL' || emergencyType === 'RESCUE' || affectedCount >= 10) {
    return 'CRITICAL';
  }
  if (urgency === 'HIGH' || emergencyType === 'MEDICAL' || affectedCount >= 5) {
    return 'HIGH';
  }
  if (urgency === 'MEDIUM') {
    return 'MEDIUM';
  }
  return 'LOW';
}

// 1. Submit a Distress Request (Citizens & Public)
router.post('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues.map(i => i.message).join(', ') },
      });
    }

    const {
      emergencyType,
      urgency,
      affectedCount,
      description,
      landmark,
      contactPhone,
      latitude,
      longitude,
      evidenceUrl,
    } = parseResult.data;

    let citizenId = req.user?.id;
    let actorEmail = req.user?.email || 'citizen@relieflink.org';
    let actorRole = req.user?.role || 'CITIZEN';

    if (!citizenId) {
      const defaultCitizen = await query("SELECT id, email, role FROM users WHERE role = 'CITIZEN' LIMIT 1");
      citizenId = defaultCitizen.rows[0]?.id || 'usr-cit-001';
      actorEmail = defaultCitizen.rows[0]?.email || 'citizen@relieflink.org';
    }

    const requestId = 'req-' + crypto.randomUUID();

    // Generate real sequential request code from actual database count
    const countRes = await query('SELECT COUNT(*) as total FROM distress_requests');
    const seq = parseInt(countRes.rows[0]?.total || '0', 10) + 1;
    const year = new Date().getFullYear();
    const requestCode = `RL-${year}-${seq.toString().padStart(6, '0')}`;

    const priority = calculateEmergencyPriority(emergencyType, urgency, affectedCount);

    // Save persistent request
    await query(
      `INSERT INTO distress_requests 
       (id, request_code, citizen_id, emergency_type, urgency, affected_count, description, landmark, contact_phone, latitude, longitude, status, priority, evidence_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'OPEN', $12, $13)`,
      [
        requestId,
        requestCode,
        citizenId,
        emergencyType,
        urgency,
        affectedCount,
        description,
        landmark || null,
        contactPhone || actorEmail,
        latitude,
        longitude,
        priority,
        evidenceUrl || null,
      ]
    );

    // Record initial status history
    const historyId = 'rsh-' + crypto.randomUUID();
    await query(
      `INSERT INTO request_status_histories (id, request_id, previous_status, new_status, changed_by_user_id, reason)
       VALUES ($1, $2, NULL, 'OPEN', $3, 'Distress request logged to ReliefLink emergency ledger.')`,
      [historyId, requestId, citizenId]
    );

    // Perform real duplicate analysis
    const dupResult = await detectDuplicateRequest({
      id: requestId,
      emergencyType,
      latitude,
      longitude,
      affectedCount,
      description,
    });

    // Record audit log
    await recordAuditLog({
      actorId: citizenId,
      actorEmail: actorEmail,
      actorRole: actorRole,
      action: 'CREATE_DISTRESS_REQUEST',
      entity: 'distress_requests',
      entityId: requestId,
      newValues: { requestCode, emergencyType, urgency, priority, latitude, longitude, duplicate: dupResult.isDuplicate },
      ipAddress: req.ip,
    });

    // Create notifications for Volunteers, Citizens, and Government Command
    const notifVolId = 'notif-' + crypto.randomUUID();
    await query(
      `INSERT INTO notifications (id, target_role, title, message, type, reference_id)
       VALUES ($1, 'VOLUNTEER', $2, $3, 'EMERGENCY', $4)`,
      [
        notifVolId,
        `NEW EMERGENCY: ${requestCode}`,
        `[${urgency}] ${emergencyType} emergency reported for ${affectedCount} person(s). Location: ${landmark || 'GPS Coordinates provided'}.`,
        requestId,
      ]
    );

    const notifCitId = 'notif-' + crypto.randomUUID();
    await query(
      `INSERT INTO notifications (id, target_role, title, message, type, reference_id)
       VALUES ($1, 'CITIZEN', $2, $3, 'EMERGENCY', $4)`,
      [
        notifCitId,
        `🚨 NEIGHBOR DISTRESS ALERT: ${requestCode}`,
        `[${urgency}] ${emergencyType} emergency reported for ${affectedCount} person(s). As a community responder, you can respond "I will go and help"! Location: ${landmark || 'Nearby coordinates'}.`,
        requestId,
      ]
    );

    const fullRequestRes = await query(
      `SELECT r.*, u.full_name as citizen_name, u.phone as citizen_phone
       FROM distress_requests r
       LEFT JOIN users u ON r.citizen_id = u.id
       WHERE r.id = $1`,
      [requestId]
    );

    const savedRequest = fullRequestRes.rows[0];

    // Real-time broadcast to all connected dashboards (Volunteers, Gov, Admin)
    if (ioInstance) {
      ioInstance.emit('request:created', savedRequest);
    }

    return res.status(201).json({
      success: true,
      data: {
        request: savedRequest,
        duplicateWarning: dupResult.isDuplicate,
        duplicateConfidence: dupResult.confidenceScore,
      },
    });
  } catch (err: any) {
    console.error('[Create Request Error]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to record emergency distress report.' },
    });
  }
});

// 2. Query Distress Requests (with filtering, pagination, role awareness)
router.get('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      status,
      emergencyType,
      urgency,
      priority,
      mine,
      search,
      page = '1',
      limit = '50',
    } = req.query as any;

    const user = req.user;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    // If mine=true, filter to user's own submitted requests. Otherwise allow citizens to view nearby distress calls to respond and help.
    if (user && mine === 'true') {
      conditions.push(`r.citizen_id = $${pIdx++}`);
      params.push(user.id);
    }

    if (status) {
      conditions.push(`r.status = $${pIdx++}`);
      params.push(status);
    }

    if (emergencyType) {
      conditions.push(`r.emergency_type = $${pIdx++}`);
      params.push(emergencyType);
    }

    if (urgency) {
      conditions.push(`r.urgency = $${pIdx++}`);
      params.push(urgency);
    }

    if (priority) {
      conditions.push(`r.priority = $${pIdx++}`);
      params.push(priority);
    }

    if (search) {
      conditions.push(`(r.request_code ILIKE $${pIdx} OR r.description ILIKE $${pIdx} OR r.landmark ILIKE $${pIdx})`);
      params.push(`%${search}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const countRes = await query(
      `SELECT COUNT(*) as total FROM distress_requests r ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const dataSql = `
      SELECT r.*, 
             u.full_name as citizen_name, u.phone as citizen_phone,
             a.volunteer_id as assigned_volunteer_id,
             vu.full_name as assigned_volunteer_name, vu.phone as assigned_volunteer_phone
      FROM distress_requests r
      LEFT JOIN users u ON r.citizen_id = u.id
      LEFT JOIN request_assignments a ON r.id = a.request_id AND a.status != 'CANCELLED'
      LEFT JOIN users vu ON a.volunteer_id = vu.id
      ${whereClause}
      ORDER BY 
        CASE r.priority 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          ELSE 4 
        END ASC,
        r.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;

    const listRes = await query(dataSql, [...params, parseInt(limit, 10), offset]);

    return res.json({
      success: true,
      data: {
        requests: listRes.rows,
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
    });
  } catch (err: any) {
    console.error('[List Requests Error]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve distress requests.' },
    });
  }
});

const OFFICIAL_RESCUE_TEAMS = [
  {
    id: 'team-ndrf-04',
    name: 'NDRF 4th Battalion Swift Water & Flood Rescue Unit',
    agency: 'National Disaster Response Force (NDRF)',
    category: 'WATER_RESCUE',
    baseLocation: 'Arakkonam / Central Chennai Sector',
    latitude: 13.0604,
    longitude: 80.2496,
    contactNumber: '+91 44 2841 8108',
    vehicleTypes: ['Inflatable Motorized Zodiac Boats', 'High-Clearance All-Terrain Unimog', 'Amphibious Drone'],
    equipment: ['Deep-Diving SCUBA Kits', 'Hydraulic Life-Saving Cutters', 'High-Capacity Submersible Dewatering Pumps', 'Thermal Imaging Sonar'],
    leadOfficer: 'Commandant R. K. Sharma (Battalion 04)',
    status: 'READY',
  },
  {
    id: 'team-sdrf-01',
    name: 'State Disaster Response Force (SDRF) Quick Action Task Force',
    agency: 'State Disaster Management Authority (SDMA)',
    category: 'URBAN_SEARCH',
    baseLocation: 'Marina / Coastal Sector Base',
    latitude: 13.0475,
    longitude: 80.2785,
    contactNumber: '+91 44 2844 7721',
    vehicleTypes: ['Heavy High-Water Rescue 4x4', 'Emergency Transit Troop Carrier'],
    equipment: ['Search & Rescue Acoustic Sensors', 'Pneumatic Concrete Breakers', 'Emergency Ropes & Harnesses', 'Satellite Comms Transceiver'],
    leadOfficer: 'Deputy Commandant V. Sundaram',
    status: 'READY',
  },
  {
    id: 'team-tnfrs-12',
    name: 'Fire & Rescue Services High-Clearance Disaster Tender',
    agency: 'Tamil Nadu Fire and Rescue Services (TNFRS)',
    category: 'FIRE_HAZMAT',
    baseLocation: 'Velachery Emergency Fire Station 12',
    latitude: 12.9815,
    longitude: 80.2180,
    contactNumber: '101 / +91 44 2243 0101',
    vehicleTypes: ['High-Capacity Water Rescue Tender', 'Quick Response Light Vehicle'],
    equipment: ['Submersible Trash Pumps', 'Aluminum Flat-Bottom Rescue Skiffs', 'Inflatable Life Rafts', 'Searchlights & Loudhailers'],
    leadOfficer: 'Station Officer K. Anand',
    status: 'READY',
  },
  {
    id: 'team-als-108',
    name: '108 Advanced Life Support (ALS) Disaster Paramedic Unit',
    agency: 'GVK EMRI Emergency Healthcare Services',
    category: 'MEDICAL_ALS',
    baseLocation: 'Guindy Government Multi-Specialty Staging Hub',
    latitude: 13.0067,
    longitude: 80.2038,
    contactNumber: '108 / +91 44 2235 0108',
    vehicleTypes: ['Type-C Advanced Life Support Ambulance', 'Mobile Field Clinic Van'],
    equipment: ['Portable Ventilators & Oxygen Concentrators', 'Automated External Defibrillator (AED)', 'Trauma Stabilization Kits', 'Emergency Anti-Venom & Saline'],
    leadOfficer: 'Dr. Meenakshi Raman (Emergency Medical Officer)',
    status: 'READY',
  },
  {
    id: 'team-cg-patrol',
    name: 'Indian Coast Guard Inshore Coastal Patrol Rescue Skiff',
    agency: 'Indian Coast Guard (Eastern Region)',
    category: 'WATER_RESCUE',
    baseLocation: 'Chennai Port Inshore Maritime Basin',
    latitude: 13.0878,
    longitude: 80.2985,
    contactNumber: '1554 / +91 44 2539 0088',
    vehicleTypes: ['Rigid Inflatable Gemini Boats', 'Inshore Patrol Hovercraft'],
    equipment: ['Marine Night-Vision Scopes', 'Life Floats & Throw Rings', 'Helicopter Winch Harnesses', 'Emergency Survival Rations'],
    leadOfficer: 'Sub-Inspector M. Joseph (ICG)',
    status: 'READY',
  },
];

// 2.5 Query Available Official Rescue Teams (Government & Admin Dispatch)
router.get('/rescue-teams', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const lon = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;

    const teams = OFFICIAL_RESCUE_TEAMS.map(team => {
      let distanceKm: number | undefined;
      if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
        const R = 6371;
        const dLat = (team.latitude - lat) * (Math.PI / 180);
        const dLon = (team.longitude - lon) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat * (Math.PI / 180)) * Math.cos(team.latitude * (Math.PI / 180)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceKm = Math.round(R * c * 10) / 10;
      }
      return { ...team, distanceKm };
    });

    if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
      teams.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return res.json({
      success: true,
      data: { teams },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve available rescue teams.' },
    });
  }
});

// 3. Get Single Request Details (History, Assignments, Allocations)
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const reqRes = await query(
      `SELECT r.*, 
              u.full_name as citizen_name, u.phone as citizen_phone, u.email as citizen_email,
              a.volunteer_id as assigned_volunteer_id,
              vu.full_name as assigned_volunteer_name, vu.phone as assigned_volunteer_phone
       FROM distress_requests r
       LEFT JOIN users u ON r.citizen_id = u.id
       LEFT JOIN request_assignments a ON r.id = a.request_id AND a.status != 'CANCELLED'
       LEFT JOIN users vu ON a.volunteer_id = vu.id
       WHERE r.id = $1`,
      [id]
    );

    if (reqRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Distress request not found.' },
      });
    }

    const request = reqRes.rows[0];

    // Status histories
    const histRes = await query(
      `SELECT h.*, u.full_name as changed_by_name, u.role as changed_by_role
       FROM request_status_histories h
       LEFT JOIN users u ON h.changed_by_user_id = u.id
       WHERE h.request_id = $1
       ORDER BY h.created_at ASC`,
      [id]
    );

    // Resource allocations
    const allocRes = await query(
      `SELECT ra.*, res.name as resource_name, res.unit, res.category
       FROM resource_allocations ra
       JOIN resources res ON ra.resource_id = res.id
       WHERE ra.request_id = $1
       ORDER BY ra.created_at DESC`,
      [id]
    );

    // Duplicate candidates
    const dupRes = await query(
      `SELECT dc.*, dr.request_code as candidate_code, dr.emergency_type as candidate_type, dr.urgency as candidate_urgency
       FROM duplicate_candidates dc
       JOIN distress_requests dr ON dc.candidate_id = dr.id
       WHERE dc.request_id = $1 OR dc.candidate_id = $1`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        request,
        history: histRes.rows,
        allocations: allocRes.rows,
        duplicateCandidates: dupRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve request details.' },
    });
  }
});

// 4. ATOMIC CONCURRENT CLAIM (Volunteer, Citizen Responder, or Admin)
router.post('/:id/claim', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // ATOMIC TEST-AND-SET:
    // Only claim if request is in 'OPEN', 'ESCALATED', or 'VERIFIED' status.
    const claimRes = await query(
      `UPDATE distress_requests
       SET status = 'CLAIMED', updated_at = NOW()
       WHERE id = $1 AND status IN ('OPEN', 'ESCALATED', 'VERIFIED')
       RETURNING id, request_code, citizen_id`,
      [id]
    );

    if (claimRes.rows.length === 0) {
      // Concurrency conflict: Another volunteer already claimed this request!
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONCURRENT_CLAIM_CONFLICT',
          message: 'This emergency request has already been claimed by another volunteer or is no longer open.',
        },
      });
    }

    const claimed = claimRes.rows[0];

    // Create assignment
    const assignId = 'asg-' + crypto.randomUUID();
    await query(
      `INSERT INTO request_assignments (id, request_id, volunteer_id, status)
       VALUES ($1, $2, $3, 'ASSIGNED')`,
      [assignId, id, user.id]
    );

    // Update volunteer availability to BUSY
    await query(
      `UPDATE volunteer_profiles SET availability_status = 'BUSY' WHERE user_id = $1`,
      [user.id]
    );

    // Record status history
    const histId = 'rsh-' + crypto.randomUUID();
    await query(
      `INSERT INTO request_status_histories (id, request_id, previous_status, new_status, changed_by_user_id, reason)
       VALUES ($1, $2, 'OPEN', 'CLAIMED', $3, 'Emergency response claimed by volunteer/citizen responder.')`,
      [histId, id, user.id]
    );

    // Record audit log
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CLAIM_DISTRESS_REQUEST',
      entity: 'distress_requests',
      entityId: id,
      newValues: { status: 'CLAIMED', volunteerId: user.id },
      ipAddress: req.ip,
    });

    // Notify citizen
    const notifId = 'notif-' + crypto.randomUUID();
    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, reference_id)
       VALUES ($1, $2, 'HELP IS ON THE WAY', $3, 'STATUS', $4)`,
      [
        notifId,
        claimed.citizen_id,
        `Responder ${user.fullName} has claimed your distress request (${claimed.request_code}). Responders are preparing dispatch.`,
        id,
      ]
    );

    const payload = {
      requestId: id,
      requestCode: claimed.request_code,
      status: 'CLAIMED',
      volunteerId: user.id,
      volunteerName: user.fullName,
    };

    if (ioInstance) {
      ioInstance.emit('request:claimed', payload);
      ioInstance.emit('request:updated', payload);
    }

    return res.json({
      success: true,
      data: {
        message: 'Request successfully claimed and assigned.',
        ...payload,
      },
    });
  } catch (err: any) {
    console.error('[Claim Request Error]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to claim request due to an unexpected error.' },
    });
  }
});

// 4.1 COMMUNITY CITIZEN RESPONDER: "I Will Go and Help"
// Every citizen is a volunteer; nearby citizens can mark they are going to help.
// Alerts Admin & Government to quickly assign nearby official rescue backup!
router.post('/:id/respond-help', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { note, etaMinutes, contactPhone } = req.body;

    const requestRes = await query(
      `SELECT r.*, u.full_name as citizen_name, u.phone as citizen_phone
       FROM distress_requests r
       LEFT JOIN users u ON r.citizen_id = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (requestRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Distress request not found.' },
      });
    }

    const currentReq = requestRes.rows[0];

    // Update community responder info and move status to IN_PROGRESS if currently OPEN
    const updateRes = await query(
      `UPDATE distress_requests
       SET community_responder_id = $1,
           community_responder_name = $2,
           community_responder_phone = $3,
           community_responder_status = 'I_WILL_GO',
           community_responder_note = $4,
           status = CASE WHEN status = 'OPEN' THEN 'IN_PROGRESS' ELSE status END,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        user.id,
        user.fullName,
        user.phone || contactPhone || null,
        note || 'Nearby citizen volunteer declared: I will go and help',
        id,
      ]
    );

    const updatedReq = updateRes.rows[0];

    // Ensure responder profile is recorded as BUSY / responding
    await query(
      `UPDATE volunteer_profiles SET availability_status = 'BUSY' WHERE user_id = $1`,
      [user.id]
    );

    // Record in request assignments
    const assignId = 'asg-' + crypto.randomUUID();
    await query(
      `INSERT INTO request_assignments (id, request_id, volunteer_id, status)
       VALUES ($1, $2, $3, 'ASSIGNED')
       ON CONFLICT DO NOTHING`,
      [assignId, id, user.id]
    );

    // Record history
    const histId = 'rsh-' + crypto.randomUUID();
    await query(
      `INSERT INTO request_status_histories (id, request_id, previous_status, new_status, changed_by_user_id, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        histId,
        id,
        currentReq.status,
        updatedReq.status,
        user.id,
        `Community Citizen Responder ${user.fullName} declared: "I will go and help!" (ETA: ${etaMinutes || '10'}m). Backup rescue team urgently requested.`,
      ]
    );

    // Record audit log
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'COMMUNITY_RESPONDER_GOING',
      entity: 'distress_requests',
      entityId: id,
      newValues: { responderId: user.id, responderName: user.fullName, note, etaMinutes },
      ipAddress: req.ip,
    });

    // URGENT NOTIFICATIONS TO GOVERNMENT & ADMIN COMMAND:
    // "This should be known to admin and government so admin and government should assign a nearby rescue team quickly"
    const notifGovId = 'notif-' + crypto.randomUUID();
    await query(
      `INSERT INTO notifications (id, target_role, title, message, type, reference_id)
       VALUES ($1, 'GOVERNMENT', $2, $3, 'ALERT', $4)`,
      [
        notifGovId,
        `🚨 CITIZEN RESPONDER EN ROUTE: ${currentReq.request_code}`,
        `Nearby citizen responder ${user.fullName} (${user.phone || 'Phone registered'}) declared: "I will go and help" for ${currentReq.emergency_type} at ${currentReq.landmark || 'Incident coordinates'}. QUICKLY ASSIGN NEARBY RESCUE TEAM BACKUP!`,
        id,
      ]
    );

    const notifAdminId = 'notif-' + crypto.randomUUID();
    await query(
      `INSERT INTO notifications (id, target_role, title, message, type, reference_id)
       VALUES ($1, 'ADMIN', $2, $3, 'ALERT', $4)`,
      [
        notifAdminId,
        `🚨 CITIZEN RESPONDER EN ROUTE: ${currentReq.request_code}`,
        `Citizen volunteer ${user.fullName} is on the way to help at ${currentReq.landmark || 'Sector GPS'}. Government dispatch of professional rescue unit recommended.`,
        id,
      ]
    );

    // NOTIFY VICTIM
    if (currentReq.citizen_id && currentReq.citizen_id !== user.id) {
      const notifVicId = 'notif-' + crypto.randomUUID();
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, reference_id)
         VALUES ($1, $2, 'COMMUNITY HELP IS ON THE WAY', $3, 'STATUS', $4)`,
        [
          notifVicId,
          currentReq.citizen_id,
          `Nearby citizen volunteer ${user.fullName} has stated "I will go and help" and is en route. Government command is also dispatching an official rescue team.`,
          id,
        ]
      );
    }

    const fullUpdatedRes = await query(
      `SELECT r.*, 
              u.full_name as citizen_name, u.phone as citizen_phone,
              a.volunteer_id as assigned_volunteer_id,
              vu.full_name as assigned_volunteer_name, vu.phone as assigned_volunteer_phone
       FROM distress_requests r
       LEFT JOIN users u ON r.citizen_id = u.id
       LEFT JOIN request_assignments a ON r.id = a.request_id AND a.status != 'CANCELLED'
       LEFT JOIN users vu ON a.volunteer_id = vu.id
       WHERE r.id = $1`,
      [id]
    );
    const completeRequest = fullUpdatedRes.rows[0] || updatedReq;

    if (ioInstance) {
      ioInstance.emit('request:community_responder_joined', {
        requestId: id,
        requestCode: currentReq.request_code,
        communityResponderId: user.id,
        communityResponderName: user.fullName,
        communityResponderPhone: user.phone || contactPhone,
        communityResponderStatus: 'I_WILL_GO',
        communityResponderNote: note,
        request: completeRequest,
      });
      ioInstance.emit('request:updated', completeRequest);
    }

    return res.json({
      success: true,
      data: {
        request: completeRequest,
        message: 'Thank you! Your response "I will go and help" has been registered. Government and official rescue teams have been alerted.',
      },
    });
  } catch (err: any) {
    console.error('[Respond Help Error]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to record response.' },
    });
  }
});

// 4.2 QUICK-ASSIGN NEARBY RESCUE TEAM (Government Command & Admin)
router.post('/:id/assign-rescue-team', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'GOVERNMENT' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Only Government Command or Admin can assign official rescue teams.' },
      });
    }

    const { teamName, estimatedEta, teamAgency, notes } = req.body;
    if (!teamName) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Rescue team name is required.' },
      });
    }

    const requestRes = await query('SELECT * FROM distress_requests WHERE id = $1', [id]);
    if (requestRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Distress request not found.' },
      });
    }

    const currentReq = requestRes.rows[0];

    const updateRes = await query(
      `UPDATE distress_requests
       SET assigned_rescue_team = $1,
           assigned_rescue_team_at = NOW(),
           status = 'EN_ROUTE',
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [teamName, id]
    );

    const updatedReq = updateRes.rows[0];

    // Status history
    const histId = 'rsh-' + crypto.randomUUID();
    await query(
      `INSERT INTO request_status_histories (id, request_id, previous_status, new_status, changed_by_user_id, reason)
       VALUES ($1, $2, $3, 'EN_ROUTE', $4, $5)`,
      [
        histId,
        id,
        currentReq.status,
        user.id,
        `Government Command dispatched ${teamName} (ETA: ${estimatedEta || '10-15 mins'}). ${notes || ''}`,
      ]
    );

    // Audit log
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'ASSIGN_RESCUE_TEAM',
      entity: 'distress_requests',
      entityId: id,
      newValues: { assignedRescueTeam: teamName, estimatedEta },
      ipAddress: req.ip,
    });

    // Notify victim
    if (currentReq.citizen_id) {
      const notifId = 'notif-' + crypto.randomUUID();
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, reference_id)
         VALUES ($1, $2, 'OFFICIAL RESCUE TEAM DISPATCHED', $3, 'STATUS', $4)`,
        [
          notifId,
          currentReq.citizen_id,
          `Government Command has dispatched ${teamName} to your location (ETA: ${estimatedEta || '15 mins'}). Hold position in high ground.`,
          id,
        ]
      );
    }

    // Notify community responder if on site
    if (currentReq.community_responder_id) {
      const notifRespId = 'notif-' + crypto.randomUUID();
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, reference_id)
         VALUES ($1, $2, 'OFFICIAL RESCUE BACKUP DISPATCHED', $3, 'STATUS', $4)`,
        [
          notifRespId,
          currentReq.community_responder_id,
          `Official rescue unit ${teamName} has been assigned to backup your response at ${currentReq.request_code}. Coordinate safety upon their arrival.`,
          id,
        ]
      );
    }

    const fullUpdatedRes = await query(
      `SELECT r.*, 
              u.full_name as citizen_name, u.phone as citizen_phone,
              a.volunteer_id as assigned_volunteer_id,
              vu.full_name as assigned_volunteer_name, vu.phone as assigned_volunteer_phone
       FROM distress_requests r
       LEFT JOIN users u ON r.citizen_id = u.id
       LEFT JOIN request_assignments a ON r.id = a.request_id AND a.status != 'CANCELLED'
       LEFT JOIN users vu ON a.volunteer_id = vu.id
       WHERE r.id = $1`,
      [id]
    );
    const completeRequest = fullUpdatedRes.rows[0] || updatedReq;

    if (ioInstance) {
      ioInstance.emit('request:rescue_team_assigned', {
        requestId: id,
        requestCode: currentReq.request_code,
        assignedRescueTeam: teamName,
        status: 'EN_ROUTE',
        request: completeRequest,
      });
      ioInstance.emit('request:updated', completeRequest);
    }

    return res.json({
      success: true,
      data: {
        request: completeRequest,
        message: `Official rescue team ${teamName} successfully dispatched to ${currentReq.request_code}.`,
      },
    });
  } catch (err: any) {
    console.error('[Assign Rescue Team Error]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to assign rescue team.' },
    });
  }
});

// 5. Update Status Pipeline (CLAIMED -> EN_ROUTE -> ARRIVED -> IN_PROGRESS -> RESOLVED)
router.patch('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const user = req.user!;

    const validStatuses = [
      'OPEN',
      'VERIFIED',
      'CLAIMED',
      'EN_ROUTE',
      'ARRIVED',
      'IN_PROGRESS',
      'RESOLVED',
      'CANCELLED',
      'DUPLICATE',
      'REJECTED',
      'ESCALATED',
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Status must be one of: ${validStatuses.join(', ')}` },
      });
    }

    const curRes = await query('SELECT * FROM distress_requests WHERE id = $1', [id]);
    if (curRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Request not found.' },
      });
    }

    const current = curRes.rows[0];

    // Authorization checks
    if (user.role === 'CITIZEN') {
      if (current.citizen_id !== user.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You can only manage your own requests.' },
        });
      }
      if (status !== 'CANCELLED') {
        return res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Citizens can only cancel distress requests.' },
        });
      }
    }

    // Update status
    await query(
      'UPDATE distress_requests SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    // Update assignment status if resolving or moving
    if (status === 'RESOLVED') {
      await query(
        `UPDATE request_assignments SET status = 'COMPLETED', completed_at = NOW() WHERE request_id = $1`,
        [id]
      );
      if (user.role === 'VOLUNTEER') {
        // Free up volunteer back to AVAILABLE
        await query(`UPDATE volunteer_profiles SET availability_status = 'AVAILABLE' WHERE user_id = $1`, [user.id]);
      }
    } else if (status === 'ARRIVED') {
      await query(
        `UPDATE request_assignments SET status = 'ARRIVED', arrived_at = NOW() WHERE request_id = $1`,
        [id]
      );
    } else if (status === 'EN_ROUTE') {
      await query(
        `UPDATE request_assignments SET status = 'EN_ROUTE' WHERE request_id = $1`,
        [id]
      );
    }

    // Status history
    const histId = 'rsh-' + crypto.randomUUID();
    await query(
      `INSERT INTO request_status_histories (id, request_id, previous_status, new_status, changed_by_user_id, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [histId, id, current.status, status, user.id, reason || `Status changed by ${user.fullName} (${user.role})`]
    );

    // Audit log
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_REQUEST_STATUS',
      entity: 'distress_requests',
      entityId: id,
      oldValues: { status: current.status },
      newValues: { status, reason },
      reason,
      ipAddress: req.ip,
    });

    // Notify Citizen
    const notifId = 'notif-' + crypto.randomUUID();
    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, reference_id)
       VALUES ($1, $2, $3, $4, 'STATUS', $5)`,
      [
        notifId,
        current.citizen_id,
        `Status Update: ${status}`,
        `Your distress request ${current.request_code} is now marked as ${status}.`,
        id,
      ]
    );

    const payload = {
      requestId: id,
      requestCode: current.request_code,
      previousStatus: current.status,
      newStatus: status,
      updatedBy: user.fullName,
      updatedByRole: user.role,
      reason,
    };

    if (ioInstance) {
      ioInstance.emit('request:status_changed', payload);
      ioInstance.emit('request:updated', payload);
    }

    return res.json({
      success: true,
      data: payload,
    });
  } catch (err: any) {
    console.error('[Update Status Error]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update request status.' },
    });
  }
});

// 6. Citizen cancels own request
router.post('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user!;

    const cur = await query('SELECT * FROM distress_requests WHERE id = $1', [id]);
    if (cur.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } });
    }

    if (user.role === 'CITIZEN' && cur.rows[0].citizen_id !== user.id) {
      return res.status(403).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    await query(`UPDATE distress_requests SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`, [id]);
    await query(`UPDATE request_assignments SET status = 'CANCELLED' WHERE request_id = $1`, [id]);

    const histId = 'rsh-' + crypto.randomUUID();
    await query(
      `INSERT INTO request_status_histories (id, request_id, previous_status, new_status, changed_by_user_id, reason)
       VALUES ($1, $2, $3, 'CANCELLED', $4, $5)`,
      [histId, id, cur.rows[0].status, user.id, reason || 'Cancelled by requester']
    );

    if (ioInstance) {
      ioInstance.emit('request:updated', { requestId: id, status: 'CANCELLED' });
    }

    return res.json({ success: true, data: { message: 'Request cancelled successfully.' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to cancel.' } });
  }
});

export default router;
