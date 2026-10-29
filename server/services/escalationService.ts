import { query } from '../db/index.js';
import { recordAuditLog } from './auditService.js';
import crypto from 'node:crypto';

let ioInstance: any = null;

export function setIoInstance(io: any) {
  ioInstance = io;
}

export async function runEscalationCycle() {
  try {
    const timeoutMinutes = parseInt(process.env.ESCALATION_TIMEOUT_MINUTES || '15', 10);

    // Find critical/high priority requests in OPEN status exceeding the timeout
    const overdueRes = await query(
      `SELECT id, request_code, emergency_type, urgency, priority, latitude, longitude, created_at
       FROM distress_requests
       WHERE status = 'OPEN'
         AND priority IN ('CRITICAL', 'HIGH')
         AND created_at <= NOW() - ($1 || ' minutes')::interval`,
      [timeoutMinutes.toString()]
    );

    for (const req of overdueRes.rows) {
      console.log(`[ReliefLink Escalation] Auto-escalating overdue emergency: ${req.request_code}`);

      // Update status to ESCALATED
      await query(
        `UPDATE distress_requests
         SET status = 'ESCALATED', updated_at = NOW()
         WHERE id = $1 AND status = 'OPEN'`,
        [req.id]
      );

      // Record status history
      const historyId = 'rsh-' + crypto.randomUUID();
      await query(
        `INSERT INTO request_status_histories (id, request_id, previous_status, new_status, reason)
         VALUES ($1, $2, 'OPEN', 'ESCALATED', $3)`,
        [historyId, req.id, `SLA Timeout breached: Emergency remained unclaimed for over ${timeoutMinutes} minutes.`]
      );

      // Record audit log
      await recordAuditLog({
        action: 'AUTO_ESCALATE_REQUEST',
        entity: 'distress_requests',
        entityId: req.id,
        newValues: { status: 'ESCALATED', reason: 'SLA_TIMEOUT' },
        reason: `Emergency exceeded ${timeoutMinutes} min response SLA without volunteer claim.`,
      });

      // Insert persistent government/admin notification
      const notifId = 'notif-' + crypto.randomUUID();
      await query(
        `INSERT INTO notifications (id, target_role, title, message, type, reference_id)
         VALUES ($1, 'GOVERNMENT', $2, $3, 'ALERT', $4)`,
        [
          notifId,
          `CRITICAL ESCALATION: ${req.request_code}`,
          `Distress request ${req.request_code} (${req.emergency_type}, Urgency: ${req.urgency}) has been unclaimed for >${timeoutMinutes} minutes and is now ESCALATED!`,
          req.id,
        ]
      );

      // Emit socket notification
      if (ioInstance) {
        ioInstance.emit('request:escalated', {
          id: req.id,
          requestCode: req.request_code,
          emergencyType: req.emergency_type,
          urgency: req.urgency,
          status: 'ESCALATED',
          message: `Distress request ${req.request_code} has been auto-escalated to Government Command.`,
        });
      }
    }
  } catch (err: any) {
    console.error('[ReliefLink Escalation Error] Failed running cycle:', err.message);
  }
}

export function startEscalationWorker(intervalMs: number = 60000) {
  // Run on startup, then every minute
  runEscalationCycle();
  const timer = setInterval(runEscalationCycle, intervalMs);
  return timer;
}
