export type UserRole = 'CITIZEN' | 'VOLUNTEER' | 'GOVERNMENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  volunteer_profile?: {
    skills?: string[];
    vehicle_type?: string;
    availability_status?: string;
    current_latitude?: number;
    current_longitude?: number;
    last_ping_at?: string;
  };
}

export type EmergencyType = 'FOOD' | 'MEDICAL' | 'SHELTER' | 'RESCUE' | 'WATER' | 'OTHER';
export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RequestStatus =
  | 'OPEN'
  | 'VERIFIED'
  | 'CLAIMED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'DUPLICATE'
  | 'REJECTED'
  | 'ESCALATED';

export interface DistressRequest {
  id: string;
  request_code: string;
  citizen_id: string;
  emergency_type: EmergencyType;
  urgency: UrgencyLevel;
  affected_count: number;
  description: string;
  landmark?: string;
  contact_phone?: string;
  latitude: number;
  longitude: number;
  status: RequestStatus;
  priority: UrgencyLevel;
  duplicate_flag: boolean;
  duplicate_of_id?: string;
  evidence_url?: string;
  created_at: string;
  updated_at: string;
  citizen_name?: string;
  citizen_phone?: string;
  assigned_volunteer_id?: string;
  assigned_volunteer_name?: string;
  assigned_volunteer_phone?: string;
  assigned_rescue_team?: string;
  assigned_rescue_team_at?: string;
  community_responder_id?: string;
  community_responder_name?: string;
  community_responder_phone?: string;
  community_responder_status?: string;
  community_responder_note?: string;
}

export interface RescueTeam {
  id: string;
  name: string;
  agency: string;
  category: 'WATER_RESCUE' | 'MEDICAL_ALS' | 'URBAN_SEARCH' | 'FIRE_HAZMAT' | 'EVACUATION';
  baseLocation: string;
  latitude: number;
  longitude: number;
  contactNumber: string;
  vehicleTypes: string[];
  equipment: string[];
  leadOfficer: string;
  status: 'READY' | 'DEPLOYED' | 'STANDBY';
  distanceKm?: number;
}

export interface RequestStatusHistory {
  id: string;
  request_id: string;
  previous_status?: string;
  new_status: string;
  changed_by_user_id?: string;
  changed_by_name?: string;
  changed_by_role?: string;
  reason?: string;
  created_at: string;
}

export type VolunteerAvailability = 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON_BREAK';

export interface VolunteerItem {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  skills?: string;
  vehicle_type?: string;
  availability_status: VolunteerAvailability;
  current_latitude?: number;
  current_longitude?: number;
  last_ping_at?: string;
  active_assignments: number;
  total_assignments: number;
}

export interface ResourceItem {
  id: string;
  name: string;
  category: 'FOOD' | 'WATER' | 'MEDICINE' | 'BLANKETS' | 'EMERGENCY_KITS' | 'OTHER';
  total_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  allocated_quantity: number;
  delivered_quantity: number;
  damaged_quantity: number;
  unit: string;
  relief_center_id?: string;
  relief_center_name?: string;
}

export interface ReliefCenter {
  id: string;
  name: string;
  center_type: 'SHELTER' | 'FOOD' | 'MEDICAL' | 'RESCUE' | 'WATER';
  capacity: number;
  occupancy: number;
  available_beds: number;
  occupancy_percentage: number;
  latitude: number;
  longitude: number;
  contact_phone?: string;
  operating_status: 'OPERATIONAL' | 'FULL' | 'LIMITED' | 'CLOSED';
  address?: string;
}

export interface DisasterZone {
  id: string;
  disaster_id: string;
  name: string;
  zone_type: 'HIGH_RISK' | 'EVACUATION' | 'AFFECTED' | 'SAFE';
  severity: UrgencyLevel;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface Disaster {
  id: string;
  name: string;
  type: string;
  severity: string;
  affected_region: string;
  status: string;
  description?: string;
  zones?: DisasterZone[];
}

export interface EmergencyBroadcast {
  id: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'ADVISORY';
  target_audience: string;
  target_zone?: string;
  sender_name?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id?: string;
  target_role?: string;
  title: string;
  message: string;
  type: 'EMERGENCY' | 'ALERT' | 'STATUS' | 'BROADCAST' | 'INFO';
  read: boolean;
  reference_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_email?: string;
  actor_role?: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_values?: string;
  new_values?: string;
  reason?: string;
  ip_address?: string;
  created_at: string;
}

export interface DuplicateCandidate {
  id: string;
  request_id: string;
  candidate_id: string;
  confidence_score: number;
  status: 'PENDING_REVIEW' | 'CONFIRMED_DUPLICATE' | 'REJECTED';
  req_code: string;
  req_type: string;
  req_urgency: string;
  req_desc: string;
  req_lat: number;
  req_lon: number;
  cand_code: string;
  cand_type: string;
  cand_urgency: string;
  cand_desc: string;
  cand_lat: number;
  cand_lon: number;
}

export interface CoverageGap {
  requestId: string;
  requestCode: string;
  latitude: number;
  longitude: number;
  urgency: string;
  priority: string;
  affectedCount: number;
  emergencyType: string;
  nearestVolunteerDistKm: number | null;
  gapSeverity: string;
}

export interface AnalyticsOverview {
  requests: {
    total_requests: number;
    open_requests: number;
    claimed_requests: number;
    active_operations: number;
    resolved_requests: number;
    escalated_requests: number;
    critical_unresolved: number;
    total_affected_people: number;
  };
  volunteers: {
    total_volunteers: number;
    available_volunteers: number;
    busy_volunteers: number;
    offline_volunteers: number;
  };
  shelters: {
    total_centers: number;
    total_capacity: number;
    total_occupancy: number;
    available_capacity: number;
    full_centers: number;
  };
  resourcesByCategory: { category: string; total: number; available: number; allocated: number }[];
  requestsByType: { emergency_type: string; count: number }[];
  slaMetrics: {
    avg_claim_minutes: number | null;
    avg_resolution_minutes: number | null;
    overdue_requests: number;
  };
  coverageGaps: CoverageGap[];
}

export type ToastAlertType = 'DISASTER_ZONE' | 'CRITICAL_DISTRESS' | 'BROADCAST';

export interface RegionalToastAlert {
  id: string;
  type: ToastAlertType;
  title: string;
  message: string;
  severity: UrgencyLevel;
  region?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  isLocalRegion?: boolean;
  affectedCount?: number;
  requestCode?: string;
  zoneType?: string;
  radiusMeters?: number;
  landmark?: string;
  timestamp: string;
  durationMs?: number;
  actionTab?: 'citizen' | 'volunteer' | 'government' | 'live-map';
  actionLabel?: string;
}
