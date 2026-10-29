import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import bcrypt from 'bcryptjs';

let pgliteInstance: PGlite | null = null;
let pgPoolInstance: pg.Pool | null = null;
let isInitialized = false;

export async function getDb() {
  if (isInitialized) {
    return { pglite: pgliteInstance, pool: pgPoolInstance };
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    console.log('[ReliefLink Database] Connecting to external PostgreSQL at', databaseUrl.replace(/:[^:@]+@/, ':***@'));
    pgPoolInstance = new pg.Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
    await pgPoolInstance.query('SELECT 1');
  } else {
    console.log('[ReliefLink Database] Initializing embedded persistent PostgreSQL (PGlite v16)...');
    const dataDir = path.resolve(process.cwd(), 'data', 'pgdata');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    } else {
      const pidFile = path.join(dataDir, 'postmaster.pid');
      if (fs.existsSync(pidFile)) {
        try {
          fs.unlinkSync(pidFile);
          console.log('[ReliefLink Database] Cleared stale postmaster.pid lock file.');
        } catch (e) {
          // ignore
        }
      }
    }

    try {
      pgliteInstance = new PGlite(dataDir);
      await pgliteInstance.waitReady;
      console.log('[ReliefLink Database] Embedded PostgreSQL storage ready at', dataDir);
    } catch (err) {
      console.warn('[ReliefLink Database] Error opening persistent directory, resetting directory:', err);
      try {
        fs.rmSync(dataDir, { recursive: true, force: true });
        fs.mkdirSync(dataDir, { recursive: true });
        pgliteInstance = new PGlite(dataDir);
        await pgliteInstance.waitReady;
        console.log('[ReliefLink Database] Reset and re-initialized persistent PostgreSQL storage at', dataDir);
      } catch (recoveryErr) {
        console.warn('[ReliefLink Database] Falling back to memory storage:', recoveryErr);
        pgliteInstance = new PGlite();
        await pgliteInstance.waitReady;
      }
    }
  }

  isInitialized = true;
  await runMigrations();
  return { pglite: pgliteInstance, pool: pgPoolInstance };
}

export async function query<T = any>(sqlText: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  await getDb();

  if (pgPoolInstance) {
    const res = await pgPoolInstance.query(sqlText, params);
    return { rows: res.rows as T[], rowCount: res.rowCount || res.rows.length };
  }

  if (pgliteInstance) {
    const res = await pgliteInstance.query(sqlText, params);
    return { rows: (res.rows as unknown as T[]) || [], rowCount: res.rows?.length || 0 };
  }

  throw new Error('Database not initialized');
}

export async function runMigrations() {
  console.log('[ReliefLink Database] Running schema verification and migrations...');
  const schemaPath = path.resolve(process.cwd(), 'server', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    if (pgPoolInstance) {
      await pgPoolInstance.query(schemaSql);
    } else if (pgliteInstance) {
      await pgliteInstance.exec(schemaSql);
    }
  } catch (err: any) {
    console.warn('[ReliefLink Migration] Direct script execution warning, running sanitized statements:', err.message);
    // Strip single-line comments and split by semicolon
    const cleanSql = schemaSql.replace(/--.*$/gm, '');
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        if (pgPoolInstance) {
          await pgPoolInstance.query(stmt);
        } else if (pgliteInstance) {
          await pgliteInstance.exec(stmt);
        }
      } catch (stmtErr: any) {
        console.warn('[ReliefLink Migration] Notice on statement execution:', stmtErr.message);
      }
    }
  }

  // Ensure distress_requests has community responder & rescue team assignment columns
  const alterStatements = [
    `ALTER TABLE distress_requests ADD COLUMN IF NOT EXISTS assigned_rescue_team VARCHAR(255)`,
    `ALTER TABLE distress_requests ADD COLUMN IF NOT EXISTS assigned_rescue_team_at TIMESTAMPTZ`,
    `ALTER TABLE distress_requests ADD COLUMN IF NOT EXISTS community_responder_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL`,
    `ALTER TABLE distress_requests ADD COLUMN IF NOT EXISTS community_responder_name VARCHAR(255)`,
    `ALTER TABLE distress_requests ADD COLUMN IF NOT EXISTS community_responder_phone VARCHAR(50)`,
    `ALTER TABLE distress_requests ADD COLUMN IF NOT EXISTS community_responder_status VARCHAR(64)`,
    `ALTER TABLE distress_requests ADD COLUMN IF NOT EXISTS community_responder_note TEXT`,
    // Auto-seed volunteer profiles for all citizens because all citizen signups are also volunteers!
    `INSERT INTO volunteer_profiles (user_id, skills, vehicle_type, availability_status, current_latitude, current_longitude)
     SELECT u.id, 'Community First Responder / Local Citizen Volunteer', 'Personal / Foot Patrol', 'AVAILABLE', 13.0827, 80.2707
     FROM users u
     WHERE u.role = 'CITIZEN'
     ON CONFLICT (user_id) DO NOTHING`
  ];

  for (const stmt of alterStatements) {
    try {
      if (pgPoolInstance) await pgPoolInstance.query(stmt);
      else if (pgliteInstance) await pgliteInstance.exec(stmt);
    } catch (stmtErr: any) {
      console.warn('[ReliefLink Migration] Notice on column/volunteer statement:', stmtErr.message);
    }
  }

  console.log('[ReliefLink Database] Schema migrations complete.');
  await ensureInitialDefaults();
}

async function ensureInitialDefaults() {
  // Check if initial users exist. If not, seed default demonstration accounts for each role:
  // Admin: admin@relieflink.org / Admin@123
  // Government: gov@relieflink.org / Gov@123
  // Volunteer: volunteer@relieflink.org / Vol@123
  // Citizen: citizen@relieflink.org / Citizen@123
  const userCheck = await query('SELECT COUNT(*) as count FROM users');
  const count = parseInt(userCheck.rows[0]?.count || '0', 10);

  if (count === 0) {
    console.log('[ReliefLink Database] Initializing verified starter role accounts and essential disaster relief infrastructure for India...');
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const govPass = await bcrypt.hash('Gov@123', 10);
    const volPass = await bcrypt.hash('Vol@123', 10);
    const citizenPass = await bcrypt.hash('Citizen@123', 10);

    // 1. Admin
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['usr-admin-001', 'admin@relieflink.org', adminPass, 'Dr. Rajesh Sharma (Chief Admin, NDMA)', '+91 98100 12345', 'ADMIN', 'ACTIVE']
    );

    // 2. Government Commander
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['usr-gov-001', 'gov@relieflink.org', govPass, 'Commandant Vikram Singh (NDRF)', '+91 98200 54321', 'GOVERNMENT', 'ACTIVE']
    );
    await query(
      `INSERT INTO government_profiles (user_id, agency_name, badge_id, jurisdiction)
       VALUES ($1, $2, $3, $4)`,
      ['usr-gov-001', 'National Disaster Response Force (NDRF)', 'NDRF-04-CMD', 'National Incident Command - Southern & Coastal Sectors']
    );

    // 3. Volunteer
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['usr-vol-001', 'volunteer@relieflink.org', volPass, 'Aarav Patel (NDRF First Responder)', '+91 98401 67890', 'VOLUNTEER', 'ACTIVE']
    );
    await query(
      `INSERT INTO volunteer_profiles (user_id, skills, vehicle_type, availability_status, current_latitude, current_longitude)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['usr-vol-001', 'Swift Water Rescue, CPR & Emergency Trauma First Aid, Boat Navigation, Ham Radio', 'Mahindra Bolero 4x4 Rescue Vehicle', 'AVAILABLE', 13.0827, 80.2707]
    );

    // 4. Citizen
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['usr-cit-001', 'citizen@relieflink.org', citizenPass, 'Priya Sundaram', '+91 98450 11223', 'CITIZEN', 'ACTIVE']
    );
    await query(
      `INSERT INTO citizen_profiles (user_id, emergency_contact, address, medical_notes)
       VALUES ($1, $2, $3, $4)`,
      ['usr-cit-001', '+91 98450 99881 (Family contact)', 'Flat 4B, Kaveri Enclave, 100 Feet Road, Velachery, Chennai', 'Asthma condition, elderly member in household needing mobility support']
    );

    // Initial Relief Centers in India
    await query(
      `INSERT INTO relief_centers (id, name, center_type, capacity, occupancy, latitude, longitude, contact_phone, operating_status, address)
       VALUES 
       ('rc-001', 'NDRF Central Evacuation Camp (Jawaharlal Nehru Stadium)', 'SHELTER', 1500, 420, 13.0827, 80.2707, '+91 44 2855 0100', 'OPERATIONAL', 'Sydenhams Rd, Periyamet, Chennai, Tamil Nadu'),
       ('rc-002', 'Stanley Disaster Emergency Medical Field Station', 'MEDICAL', 350, 140, 13.1042, 80.2878, '+91 44 2833 0200', 'OPERATIONAL', 'Old Jail Rd, Royapuram, Chennai, Tamil Nadu'),
       ('rc-003', 'Red Cross Disaster Food & Ration Depot (Guindy)', 'FOOD', 2500, 920, 13.0102, 80.2157, '+91 44 2235 0300', 'OPERATIONAL', 'Industrial Estate, Guindy, Chennai, Tamil Nadu'),
       ('rc-004', 'Kochi Coastal Disaster Relief Hub', 'RESCUE', 800, 210, 9.9575, 76.2711, '+91 484 266 2200', 'OPERATIONAL', 'Willingdon Island, Kochi, Kerala'),
       ('rc-005', 'Odisha SDMA Multi-Purpose Cyclone Shelter', 'SHELTER', 1200, 350, 19.8135, 85.8312, '+91 6752 222 100', 'OPERATIONAL', 'VIP Road, Puri, Odisha')`
    );

    // Initial Critical Resources in India
    await query(
      `INSERT INTO resources (id, name, category, total_quantity, available_quantity, reserved_quantity, allocated_quantity, delivered_quantity, unit, relief_center_id)
       VALUES
       ('res-001', 'High-Energy Ready-to-Eat Ration Packets (Khichdi/Poha)', 'FOOD', 2500, 1950, 150, 400, 0, 'packs', 'rc-003'),
       ('res-002', 'Purified Packaged Drinking Water (20L Cans & Bottles)', 'WATER', 4000, 3100, 200, 700, 0, 'liters', 'rc-003'),
       ('res-003', 'Emergency Trauma, ORS & Anti-Venom Medical Kits', 'MEDICINE', 350, 260, 20, 70, 0, 'kits', 'rc-002'),
       ('res-004', 'Disaster Shelter Heavy Tarpaulins & Thermal Blankets', 'BLANKETS', 1200, 850, 50, 300, 0, 'units', 'rc-001'),
       ('res-005', 'NDRF Inflatable Gemini Motorized Rescue Boats', 'EMERGENCY_KITS', 40, 28, 2, 10, 0, 'boats', 'rc-001')`
    );

    // Initial Active Disaster in India
    await query(
      `INSERT INTO disasters (id, name, type, severity, affected_region, status, description)
       VALUES ('dis-001', 'Bay of Bengal Severe Cyclonic Storm & Coastal Surge', 'FLOOD', 'CRITICAL', 'Coastal Tamil Nadu & Andhra Pradesh River Basins', 'ACTIVE', 'Monsoon cyclonic depression causing torrential rainfall in excess of 350mm, canal overflow, and urban waterlogging across coastal lowlands.')`
    );

    // Initial Disaster Zones in India
    await query(
      `INSERT INTO disaster_zones (id, disaster_id, name, zone_type, severity, latitude, longitude, radius_meters)
       VALUES 
       ('dz-001', 'dis-001', 'Velachery - Pallikaranai Flood Basin Inundation Zone', 'HIGH_RISK', 'CRITICAL', 12.9815, 80.2180, 3500),
       ('dz-002', 'dis-001', 'Adyar River Delta Coastal Evacuation Corridor', 'EVACUATION', 'HIGH', 13.0067, 80.2570, 4200),
       ('dz-003', 'dis-001', 'St. Thomas Mount Elevated Safe Staging Ground', 'SAFE', 'LOW', 13.0038, 80.1932, 2500)`
    );

    // Initial Distress Requests in India
    await query(
      `INSERT INTO distress_requests (id, request_code, citizen_id, emergency_type, urgency, affected_count, description, landmark, contact_phone, latitude, longitude, status, priority)
       VALUES 
       ('req-seed-001', 'RL-2026-000001', 'usr-cit-001', 'RESCUE', 'CRITICAL', 4, 'Ground floor completely inundated by 4.5 feet of fast-moving flood water. Two senior citizens and a toddler stranded on terrace without power or clean drinking water.', 'Near Velachery MRTS Station, South Buckingham Canal bank', '+91 98450 11223', 12.9784, 80.2212, 'OPEN', 'CRITICAL'),
       ('req-seed-002', 'RL-2026-000002', 'usr-cit-001', 'MEDICAL', 'HIGH', 2, 'Elderly diabetic patient urgently requiring insulin and asthma nebulizer support. Road access flooded.', 'Near Alwarpet Canal Bridge', '+91 98450 11223', 13.0336, 80.2520, 'OPEN', 'HIGH'),
       ('req-seed-003', 'RL-2026-000003', 'usr-cit-001', 'FOOD', 'MEDIUM', 6, 'Drinking water and food ration packets needed for 6 stranded people sheltered on 1st floor.', 'Saidapet Court Road Compound', '+91 98450 11223', 13.0213, 80.2231, 'CLAIMED', 'MEDIUM')`
    );

    await query(
      `INSERT INTO request_status_histories (id, request_id, previous_status, new_status, changed_by_user_id, reason)
       VALUES ('rsh-seed-001', 'req-seed-001', NULL, 'OPEN', 'usr-cit-001', 'Initial emergency distress report registered by citizen.')`
    );

    console.log('[ReliefLink Database] Initial baseline data successfully established for India.');
  } else {
    // Check if database contains legacy US-coordinates and migrate to Indian context
    const sfCheck = await query('SELECT COUNT(*) as sf_count FROM relief_centers WHERE longitude < 0');
    const sfCount = parseInt(sfCheck.rows[0]?.sf_count || '0', 10);

    if (sfCount > 0) {
      console.log('[ReliefLink Database] Upgrading existing records to India locations and disaster coordination data...');
      
      // Update Users
      await query(`UPDATE users SET full_name = 'Dr. Rajesh Sharma (Chief Admin, NDMA)', phone = '+91 98100 12345' WHERE id = 'usr-admin-001'`);
      await query(`UPDATE users SET full_name = 'Commandant Vikram Singh (NDRF)', phone = '+91 98200 54321' WHERE id = 'usr-gov-001'`);
      await query(`UPDATE users SET full_name = 'Aarav Patel (NDRF First Responder)', phone = '+91 98401 67890' WHERE id = 'usr-vol-001'`);
      await query(`UPDATE users SET full_name = 'Priya Sundaram', phone = '+91 98450 11223' WHERE id = 'usr-cit-001'`);

      // Update Profiles
      await query(`
        UPDATE government_profiles 
        SET agency_name = 'National Disaster Response Force (NDRF)',
            badge_id = 'NDRF-04-CMD',
            jurisdiction = 'National Incident Command - Southern & Coastal Sectors'
        WHERE user_id = 'usr-gov-001'
      `);

      await query(`
        UPDATE volunteer_profiles
        SET skills = 'Swift Water Rescue, CPR & Emergency Trauma First Aid, Boat Navigation, Ham Radio',
            vehicle_type = 'Mahindra Bolero 4x4 Rescue Vehicle',
            current_latitude = 13.0827,
            current_longitude = 80.2707
        WHERE user_id = 'usr-vol-001'
      `);

      await query(`
        UPDATE citizen_profiles
        SET emergency_contact = '+91 98450 99881 (Family contact)',
            address = 'Flat 4B, Kaveri Enclave, 100 Feet Road, Velachery, Chennai',
            medical_notes = 'Asthma condition, elderly member in household needing mobility support'
        WHERE user_id = 'usr-cit-001'
      `);

      // Update Disaster
      await query(`
        UPDATE disasters
        SET name = 'Bay of Bengal Severe Cyclonic Storm & Coastal Surge',
            type = 'FLOOD',
            severity = 'CRITICAL',
            affected_region = 'Coastal Tamil Nadu & Andhra Pradesh River Basins',
            description = 'Monsoon cyclonic depression causing torrential rainfall in excess of 350mm, canal overflow, and urban waterlogging across coastal lowlands.'
        WHERE id = 'dis-001'
      `);

      // Update Disaster Zones
      await query(`
        UPDATE disaster_zones SET
          name = 'Velachery - Pallikaranai Flood Basin Inundation Zone',
          latitude = 12.9815,
          longitude = 80.2180,
          radius_meters = 3500
        WHERE id = 'dz-001'
      `);

      await query(`
        UPDATE disaster_zones SET
          name = 'Adyar River Delta Coastal Evacuation Corridor',
          latitude = 13.0067,
          longitude = 80.2570,
          radius_meters = 4200
        WHERE id = 'dz-002'
      `);

      await query(`
        UPDATE disaster_zones SET
          name = 'St. Thomas Mount Elevated Safe Staging Ground',
          latitude = 13.0038,
          longitude = 80.1932,
          radius_meters = 2500
        WHERE id = 'dz-003'
      `);

      // Update Relief Centers
      await query(`
        UPDATE relief_centers SET
          name = 'NDRF Central Evacuation Camp (Jawaharlal Nehru Stadium)',
          latitude = 13.0827,
          longitude = 80.2707,
          contact_phone = '+91 44 2855 0100',
          address = 'Sydenhams Rd, Periyamet, Chennai, Tamil Nadu',
          capacity = 1500,
          occupancy = 420
        WHERE id = 'rc-001'
      `);

      await query(`
        UPDATE relief_centers SET
          name = 'Stanley Disaster Emergency Medical Field Station',
          latitude = 13.1042,
          longitude = 80.2878,
          contact_phone = '+91 44 2833 0200',
          address = 'Old Jail Rd, Royapuram, Chennai, Tamil Nadu',
          capacity = 350,
          occupancy = 140
        WHERE id = 'rc-002'
      `);

      await query(`
        UPDATE relief_centers SET
          name = 'Red Cross Disaster Food & Ration Depot (Guindy)',
          latitude = 13.0102,
          longitude = 80.2157,
          contact_phone = '+91 44 2235 0300',
          address = 'Industrial Estate, Guindy, Chennai, Tamil Nadu',
          capacity = 2500,
          occupancy = 920
        WHERE id = 'rc-003'
      `);

      // Add extra pan-India relief centers if not present
      await query(`
        INSERT INTO relief_centers (id, name, center_type, capacity, occupancy, latitude, longitude, contact_phone, operating_status, address)
        VALUES 
        ('rc-004', 'Kochi Coastal Disaster Relief Hub', 'RESCUE', 800, 210, 9.9575, 76.2711, '+91 484 266 2200', 'OPERATIONAL', 'Willingdon Island, Kochi, Kerala'),
        ('rc-005', 'Odisha SDMA Multi-Purpose Cyclone Shelter', 'SHELTER', 1200, 350, 19.8135, 85.8312, '+91 6752 222 100', 'OPERATIONAL', 'VIP Road, Puri, Odisha')
        ON CONFLICT (id) DO NOTHING
      `);

      // Update Resources
      await query(`UPDATE resources SET name = 'High-Energy Ready-to-Eat Ration Packets (Khichdi/Poha)' WHERE id = 'res-001'`);
      await query(`UPDATE resources SET name = 'Purified Packaged Drinking Water (20L Cans & Bottles)', unit = 'liters' WHERE id = 'res-002'`);
      await query(`UPDATE resources SET name = 'Emergency Trauma, ORS & Anti-Venom Medical Kits' WHERE id = 'res-003'`);
      await query(`UPDATE resources SET name = 'Disaster Shelter Heavy Tarpaulins & Thermal Blankets' WHERE id = 'res-004'`);
      await query(`UPDATE resources SET name = 'NDRF Inflatable Gemini Motorized Rescue Boats' WHERE id = 'res-005'`);

      // Update Distress Request
      await query(`
        UPDATE distress_requests SET
          description = 'Ground floor completely inundated by 4.5 feet of fast-moving flood water. Two senior citizens and a toddler stranded on terrace without power or clean drinking water.',
          landmark = 'Near Velachery MRTS Station, South Buckingham Canal bank',
          contact_phone = '+91 98450 11223',
          latitude = 12.9784,
          longitude = 80.2212
        WHERE id = 'req-seed-001'
      `);

      // Add additional realistic emergency requests in India if not already present
      await query(`
        INSERT INTO distress_requests (id, request_code, citizen_id, emergency_type, urgency, affected_count, description, landmark, contact_phone, latitude, longitude, status, priority)
        VALUES 
        ('req-seed-002', 'RL-2026-000002', 'usr-cit-001', 'MEDICAL', 'HIGH', 2, 'Elderly diabetic patient urgently requiring insulin and asthma nebulizer support. Road access flooded.', 'Near Alwarpet Canal Bridge', '+91 98450 11223', 13.0336, 80.2520, 'OPEN', 'HIGH'),
        ('req-seed-003', 'RL-2026-000003', 'usr-cit-001', 'FOOD', 'MEDIUM', 6, 'Drinking water and food ration packets needed for 6 stranded people sheltered on 1st floor.', 'Saidapet Court Road Compound', '+91 98450 11223', 13.0213, 80.2231, 'CLAIMED', 'MEDIUM')
        ON CONFLICT (id) DO NOTHING
      `);

      console.log('[ReliefLink Database] Records successfully localized to India.');
    }
  }
}
