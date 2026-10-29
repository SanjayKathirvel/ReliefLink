import { query } from '../db/index.js';
import crypto from 'node:crypto';

export interface AuditLogEntry {
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  reason?: string;
  ipAddress?: string;
}

export async function recordAuditLog(entry: AuditLogEntry) {
  try {
    const id = 'aud-' + crypto.randomUUID();
    await query(
      `INSERT INTO audit_logs (id, actor_id, actor_email, actor_role, action, entity, entity_id, old_values, new_values, reason, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        entry.actorId || null,
        entry.actorEmail || null,
        entry.actorRole || null,
        entry.action,
        entry.entity,
        entry.entityId || null,
        entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
        entry.reason || null,
        entry.ipAddress || null,
      ]
    );
  } catch (err: any) {
    console.error('[ReliefLink Audit Log Error] Failed to write audit record:', err.message);
  }
}
