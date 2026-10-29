import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../db/index.js';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  role: z.enum(['CITIZEN', 'VOLUNTEER', 'GOVERNMENT', 'ADMIN']),
  // Profile specific fields
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  medicalNotes: z.string().optional(),
  skills: z.string().optional(),
  vehicleType: z.string().optional(),
  agencyName: z.string().optional(),
  badgeId: z.string().optional(),
  jurisdiction: z.string().optional(),
});

router.post('/register', async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.issues.map(e => e.message).join(', '),
        },
      });
    }

    const {
      email,
      password,
      fullName,
      phone,
      role,
      emergencyContact,
      address,
      medicalNotes,
      skills,
      vehicleType,
      agencyName,
      badgeId,
      jurisdiction,
    } = parseResult.data;

    // Check duplicate email
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email address already exists.' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'usr-' + crypto.randomUUID();

    // Insert user
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')`,
      [userId, email.toLowerCase().trim(), passwordHash, fullName.trim(), phone || null, role]
    );

    // Insert role-specific profile
    if (role === 'CITIZEN') {
      await query(
        `INSERT INTO citizen_profiles (user_id, emergency_contact, address, medical_notes)
         VALUES ($1, $2, $3, $4)`,
        [userId, emergencyContact || null, address || null, medicalNotes || null]
      );
      // All citizen signups are also registered as Community Volunteers / First Responders!
      await query(
        `INSERT INTO volunteer_profiles (user_id, skills, vehicle_type, availability_status, current_latitude, current_longitude)
         VALUES ($1, $2, $3, 'AVAILABLE', 13.0827, 80.2707)
         ON CONFLICT (user_id) DO UPDATE SET availability_status = 'AVAILABLE'`,
        [userId, skills || 'Community First Responder / Local Citizen Volunteer', vehicleType || 'Personal Vehicle / Foot Patrol']
      );
    } else if (role === 'VOLUNTEER') {
      await query(
        `INSERT INTO volunteer_profiles (user_id, skills, vehicle_type, availability_status)
         VALUES ($1, $2, $3, 'AVAILABLE')`,
        [userId, skills || 'General Assistance', vehicleType || 'None']
      );
    } else if (role === 'GOVERNMENT') {
      await query(
        `INSERT INTO government_profiles (user_id, agency_name, badge_id, jurisdiction)
         VALUES ($1, $2, $3, $4)`,
        [userId, agencyName || 'Disaster Relief Agency', badgeId || null, jurisdiction || 'Regional']
      );
    }

    const userObj = {
      id: userId,
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      role: role as any,
      status: 'ACTIVE',
    };

    const token = generateToken(userObj);

    await recordAuditLog({
      actorId: userId,
      actorEmail: userObj.email,
      actorRole: userObj.role,
      action: 'USER_REGISTER',
      entity: 'users',
      entityId: userId,
      newValues: { email: userObj.email, role: userObj.role },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: userObj,
      },
    });
  } catch (err: any) {
    console.error('[Auth Register Error]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Registration failed due to an unexpected server error.' },
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' },
      });
    }

    const userRes = await query(
      `SELECT id, email, password_hash, full_name, phone, role, status
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    const user = userRes.rows[0];

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by administration.' },
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    const userObj = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    };

    const token = generateToken(userObj);

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entity: 'users',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      data: {
        token,
        user: userObj,
      },
    });
  } catch (err: any) {
    console.error('[Auth Login Error]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Login failed due to a server error.' },
    });
  }
});

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    let profileData: any = {};

    if (user.role === 'CITIZEN') {
      const p = await query('SELECT * FROM citizen_profiles WHERE user_id = $1', [user.id]);
      const vp = await query('SELECT * FROM volunteer_profiles WHERE user_id = $1', [user.id]);
      profileData = {
        ...(p.rows[0] || {}),
        volunteerProfile: vp.rows[0] || {
          skills: 'Community First Responder / Local Citizen Volunteer',
          vehicle_type: 'Personal Vehicle / Foot Patrol',
          availability_status: 'AVAILABLE',
        },
      };
    } else if (user.role === 'VOLUNTEER') {
      const p = await query('SELECT * FROM volunteer_profiles WHERE user_id = $1', [user.id]);
      profileData = p.rows[0] || {};
    } else if (user.role === 'GOVERNMENT') {
      const p = await query('SELECT * FROM government_profiles WHERE user_id = $1', [user.id]);
      profileData = p.rows[0] || {};
    }

    return res.json({
      success: true,
      data: {
        user,
        profile: profileData,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve profile.' },
    });
  }
});

router.patch('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { phone, address, emergencyContact, skills, vehicleType, availabilityStatus, latitude, longitude } = req.body;

    if (phone) {
      await query('UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2', [phone, user.id]);
    }

    if (user.role === 'CITIZEN') {
      await query(
        `INSERT INTO citizen_profiles (user_id, emergency_contact, address)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET
           emergency_contact = COALESCE($2, citizen_profiles.emergency_contact),
           address = COALESCE($3, citizen_profiles.address)`,
        [user.id, emergencyContact || null, address || null]
      );
    }

    // Always ensure and update volunteer profile for citizen or volunteer
    await query(
      `INSERT INTO volunteer_profiles (user_id, skills, vehicle_type, availability_status, current_latitude, current_longitude, last_ping_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         skills = COALESCE($2, volunteer_profiles.skills),
         vehicle_type = COALESCE($3, volunteer_profiles.vehicle_type),
         availability_status = COALESCE($4, volunteer_profiles.availability_status),
         current_latitude = COALESCE($5, volunteer_profiles.current_latitude),
         current_longitude = COALESCE($6, volunteer_profiles.current_longitude),
         last_ping_at = NOW()`,
      [
        user.id,
        skills || 'Community First Responder / Local Citizen Volunteer',
        vehicleType || 'Personal Vehicle / Foot Patrol',
        availabilityStatus || 'AVAILABLE',
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
      ]
    );

    return res.json({
      success: true,
      data: {
        message: 'Community volunteer profile updated successfully.',
      },
    });
  } catch (err: any) {
    console.error('[Update Profile Error]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update profile.' },
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email is required' },
    });
  }

  const userRes = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (userRes.rows.length === 0) {
    // Return generic message for privacy
    return res.json({
      success: true,
      data: { message: 'If that email exists in ReliefLink, recovery instructions have been recorded.' },
    });
  }

  // Generate secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  await recordAuditLog({
    actorId: userRes.rows[0].id,
    actorEmail: email,
    action: 'PASSWORD_RESET_REQUESTED',
    entity: 'users',
    entityId: userRes.rows[0].id,
    reason: `Reset token created: ${resetToken.substring(0, 8)}... (Development secure configuration)`,
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    data: {
      message: 'Password reset token generated and logged to secure audit ledger.',
      developmentToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    },
  });
});

export default router;
