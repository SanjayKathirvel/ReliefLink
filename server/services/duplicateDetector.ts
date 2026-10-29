import { query } from '../db/index.js';
import crypto from 'node:crypto';

// Haversine formula to compute distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function detectDuplicateRequest(newRequest: {
  id: string;
  emergencyType: string;
  latitude: number;
  longitude: number;
  affectedCount: number;
  description: string;
}): Promise<{ isDuplicate: boolean; duplicateCandidateId?: string; confidenceScore?: number }> {
  const radiusKm = parseFloat(process.env.DUPLICATE_RADIUS_KM || '2.0');
  const windowHours = parseInt(process.env.DUPLICATE_WINDOW_HOURS || '12', 10);

  // Fetch recent active requests within time window (excluding the new request itself)
  const candidatesRes = await query(
    `SELECT id, emergency_type, latitude, longitude, affected_count, description, created_at
     FROM distress_requests
     WHERE id != $1
       AND status NOT IN ('RESOLVED', 'CANCELLED', 'REJECTED')
       AND created_at >= NOW() - ($2 || ' hours')::interval`,
    [newRequest.id, windowHours.toString()]
  );

  for (const existing of candidatesRes.rows) {
    const dist = calculateDistanceKm(
      newRequest.latitude,
      newRequest.longitude,
      parseFloat(existing.latitude),
      parseFloat(existing.longitude)
    );

    if (dist <= radiusKm && existing.emergency_type === newRequest.emergencyType) {
      // Calculate confidence based on proximity and affected count comparison
      let score = 0.6; // Base matching emergency type within radius

      if (dist < 0.5) score += 0.25;
      else if (dist < 1.0) score += 0.15;

      if (Math.abs(existing.affected_count - newRequest.affectedCount) <= 2) {
        score += 0.1;
      }

      score = Math.min(0.98, score);

      if (score >= 0.7) {
        // Flag as duplicate candidate
        const candId = 'dc-' + crypto.randomUUID();
        await query(
          `INSERT INTO duplicate_candidates (id, request_id, candidate_id, confidence_score, status)
           VALUES ($1, $2, $3, $4, 'PENDING_REVIEW')`,
          [candId, newRequest.id, existing.id, score]
        );

        await query(
          `UPDATE distress_requests
           SET duplicate_flag = TRUE, duplicate_of_id = $1
           WHERE id = $2`,
          [existing.id, newRequest.id]
        );

        return {
          isDuplicate: true,
          duplicateCandidateId: existing.id,
          confidenceScore: score,
        };
      }
    }
  }

  return { isDuplicate: false };
}
