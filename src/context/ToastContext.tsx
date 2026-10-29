import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RegionalToastAlert, ToastAlertType, UrgencyLevel } from '../types/index.js';
import { getSocket } from '../lib/socket.js';
import { useAuth } from './AuthContext.js';

interface ToastContextType {
  toasts: RegionalToastAlert[];
  addToast: (toast: Omit<RegionalToastAlert, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  userCoords: { latitude: number; longitude: number } | null;
  regionRadiusKm: number;
  setRegionRadiusKm: (radius: number) => void;
  triggerSimulatedAlert: (type: 'DISASTER_ZONE' | 'CRITICAL_DISTRESS') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Haversine formula for calculating distance between two coordinates in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Emergency notification chime via Web Audio API
function playAlertChime(severity: UrgencyLevel = 'CRITICAL') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    if (severity === 'CRITICAL') {
      // High-priority urgent two-tone chime
      osc1.frequency.setValueAtTime(784, now); // G5
      osc1.frequency.setValueAtTime(880, now + 0.15); // A5
      osc2.frequency.setValueAtTime(523.25, now); // C5
      osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
    } else {
      // Informative, mellow advisory chime
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.15); // E5
      osc2.frequency.setValueAtTime(392, now); // G4
      osc2.frequency.setValueAtTime(523.25, now + 0.15); // C5
    }

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.14, now + 0.18);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.55);
    osc2.stop(now + 0.55);

    setTimeout(() => {
      try {
        audioCtx.close();
      } catch (e) {}
    }, 800);
  } catch (err) {
    // Browsers block autoplay before user interaction; ignore silently
    console.warn('[ReliefLink Toast] Web Audio autoplay prevented', err);
  }
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<RegionalToastAlert[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('relieflink_toast_sound') !== 'false';
  });
  const [regionRadiusKm, setRegionRadiusKm] = useState<number>(50);
  // Default user coordinates to Indian disaster monitoring center (Chennai coastal headquarters)
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 13.0827,
    longitude: 80.2707,
  });

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('relieflink_toast_sound', enabled ? 'true' : 'false');
  };

  // Attempt to acquire high accuracy GPS location of citizen/volunteer
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          // Keep regional default coordinates
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (item: Omit<RegionalToastAlert, 'id' | 'timestamp'>) => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

      // Compute regional proximity if coordinates provided
      let distanceKm: number | undefined;
      let isLocalRegion = false;

      if (item.latitude != null && item.longitude != null && userCoords) {
        distanceKm = calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          item.latitude,
          item.longitude
        );
        isLocalRegion = distanceKm <= regionRadiusKm;
      } else {
        // If no coordinates provided, assume within active regional cluster
        isLocalRegion = true;
      }

      const newToast: RegionalToastAlert = {
        ...item,
        id,
        distanceKm,
        isLocalRegion,
        timestamp: new Date().toISOString(),
        durationMs: item.durationMs || (item.severity === 'CRITICAL' ? 14000 : 10000),
      };

      setToasts((prev) => {
        // Guard against duplicate alerts for same request or zone
        if (item.requestCode && prev.some((p) => p.requestCode === item.requestCode)) {
          return prev;
        }
        // Limit active toasts to top 4 to prevent screen clutter
        return [newToast, ...prev.slice(0, 3)];
      });

      if (soundEnabled) {
        playAlertChime(item.severity);
      }
    },
    [soundEnabled, userCoords, regionRadiusKm]
  );

  // Subscribe to real-time disaster and emergency socket events
  useEffect(() => {
    const socket = getSocket();

    // 1. New Distress Request broadcast
    const handleNewRequest = (req: any) => {
      // Alert citizens and volunteers if critical distress or rescue needed
      const isCritical =
        req.urgency === 'CRITICAL' ||
        req.priority === 'CRITICAL' ||
        req.emergency_type === 'RESCUE' ||
        req.emergency_type === 'MEDICAL';

      if (isCritical) {
        const affected = req.affected_count ? `${req.affected_count} person(s) affected` : 'Immediate assistance required';
        const roleLabel =
          user?.role === 'VOLUNTEER'
            ? '⚡ Field Unit Action Required'
            : user?.role === 'GOVERNMENT' || user?.role === 'ADMIN'
            ? '🚨 Critical Distress Signal'
            : '🚨 Emergency Near You: Community Help Needed';

        addToast({
          type: 'CRITICAL_DISTRESS',
          title: `${roleLabel}: ${req.request_code || 'RL-EMERGENCY'}`,
          message: `${req.emergency_type} Emergency: ${req.description?.substring(0, 90) || 'Critical rescue requested'}... (${affected})`,
          severity: 'CRITICAL',
          latitude: Number(req.latitude),
          longitude: Number(req.longitude),
          landmark: req.landmark,
          requestCode: req.request_code,
          affectedCount: req.affected_count,
          actionTab:
            user?.role === 'VOLUNTEER'
              ? 'volunteer'
              : user?.role === 'GOVERNMENT' || user?.role === 'ADMIN'
              ? 'government'
              : 'citizen',
          actionLabel:
            user?.role === 'VOLUNTEER'
              ? 'Claim Operation'
              : user?.role === 'GOVERNMENT' || user?.role === 'ADMIN'
              ? 'Dispatch Force'
              : '✋ I Will Go & Help',
        });
      }
    };

    // 2. Community Citizen Responder declared "I will go and help"
    const handleCommunityResponderJoined = (data: any) => {
      const isGovOrAdmin = user?.role === 'GOVERNMENT' || user?.role === 'ADMIN';
      addToast({
        type: 'CRITICAL_DISTRESS',
        title: `🏃 Citizen Responder En Route: ${data.responderName || 'Citizen'}`,
        message: `${data.responderName || 'A citizen volunteer'} declared: "I will go and help" for ${data.requestCode}. ${
          isGovOrAdmin
            ? 'Government Command: Please dispatch nearby official rescue unit (NDRF/SDRF) to support!'
            : 'Operational help is on the way.'
        }`,
        severity: 'HIGH',
        requestCode: data.requestCode,
        actionTab: isGovOrAdmin ? 'government' : 'citizen',
        actionLabel: isGovOrAdmin ? '🚒 Dispatch Rescue Team' : 'View Operations',
      });
    };

    // 3. Official Rescue Team Assigned by Government
    const handleRescueTeamAssigned = (data: any) => {
      addToast({
        type: 'CRITICAL_DISTRESS',
        title: `🚒 Official Rescue Team Dispatched`,
        message: `${data.teamName || 'Official Rescue Force'} deployed to ${data.requestCode} (${
          data.etaMinutes ? data.etaMinutes + ' min ETA' : 'En route'
        }). Backup confirmed.`,
        severity: 'HIGH',
        requestCode: data.requestCode,
        actionTab: user?.role === 'GOVERNMENT' || user?.role === 'ADMIN' ? 'government' : 'citizen',
        actionLabel: 'View Dispatch Status',
      });
    };

    // 4. New Hazard / Evacuation Zone added
    const handleZoneAdded = (zone: any) => {
      const typeLabel =
        zone.zoneType === 'EVACUATION'
          ? 'Mandatory Evacuation Zone'
          : zone.zoneType === 'HIGH_RISK'
          ? 'High-Risk Hazard Zone'
          : 'Hazard Perimeter';

      addToast({
        type: 'DISASTER_ZONE',
        title: `⚠️ New ${typeLabel} Declared`,
        message: `${zone.name}. Active perimeter: ${zone.radiusMeters || 1500}m radius. Please check safety cordons.`,
        severity: (zone.severity as UrgencyLevel) || 'HIGH',
        latitude: Number(zone.latitude),
        longitude: Number(zone.longitude),
        zoneType: zone.zoneType,
        radiusMeters: zone.radiusMeters,
        actionTab: 'live-map',
        actionLabel: 'View Evacuation Perimeter',
      });
    };

    // 5. New Major Disaster declared
    const handleDisasterCreated = (dis: any) => {
      addToast({
        type: 'DISASTER_ZONE',
        title: `🚨 Disaster Declared: ${dis.name}`,
        message: `${dis.type} disaster declared in ${dis.affectedRegion}. All regional units & citizens on alert.`,
        severity: (dis.severity as UrgencyLevel) || 'CRITICAL',
        actionTab: 'citizen',
        actionLabel: 'Check Relief Shelters',
      });
    };

    // 6. Official Emergency Broadcast
    const handleBroadcast = (bc: any) => {
      addToast({
        type: 'BROADCAST',
        title: `📢 NDRF Emergency Broadcast: ${bc.title || 'Official Advisory'}`,
        message: bc.message || 'National disaster response forces have issued a public safety advisory.',
        severity: (bc.severity as UrgencyLevel) || 'HIGH',
        actionTab: 'citizen',
        actionLabel: 'View Safety Protocols',
      });
    };

    socket.on('request:created', handleNewRequest);
    socket.on('request:community_responder_joined', handleCommunityResponderJoined);
    socket.on('request:rescue_team_assigned', handleRescueTeamAssigned);
    socket.on('disaster:zone_added', handleZoneAdded);
    socket.on('disaster:created', handleDisasterCreated);
    socket.on('broadcast:created', handleBroadcast);
    socket.on('broadcast:emergency', handleBroadcast);

    return () => {
      socket.off('request:created', handleNewRequest);
      socket.off('request:community_responder_joined', handleCommunityResponderJoined);
      socket.off('request:rescue_team_assigned', handleRescueTeamAssigned);
      socket.off('disaster:zone_added', handleZoneAdded);
      socket.off('disaster:created', handleDisasterCreated);
      socket.off('broadcast:created', handleBroadcast);
      socket.off('broadcast:emergency', handleBroadcast);
    };
  }, [addToast, user?.role]);

  // Test simulation trigger so users can easily test the toast alerts
  const triggerSimulatedAlert = (type: 'DISASTER_ZONE' | 'CRITICAL_DISTRESS') => {
    if (type === 'CRITICAL_DISTRESS') {
      const demoNum = Math.floor(1000 + Math.random() * 9000);
      addToast({
        type: 'CRITICAL_DISTRESS',
        title: `${user?.role === 'VOLUNTEER' ? '⚡ Field Responder Alert' : '🚨 Critical Distress in Sector'}`,
        message: `RESCUE Emergency: 5 people stranded on rooftop due to canal overflow near Marina Coastal Sector.`,
        severity: 'CRITICAL',
        latitude: 13.0401,
        longitude: 80.2801,
        landmark: 'Near Marina Light House & Canal',
        requestCode: `RL-2026-00${demoNum}`,
        affectedCount: 5,
        actionTab: user?.role === 'VOLUNTEER' ? 'volunteer' : 'live-map',
        actionLabel: user?.role === 'VOLUNTEER' ? 'Review & Claim Ticket' : 'Track on Tactical Map',
      });
    } else {
      addToast({
        type: 'DISASTER_ZONE',
        title: `⚠️ New High-Risk Hazard Zone Declared`,
        message: `Adyar River Overflow & Inundation Sector declared by NDRF Command. Evacuation perimeter: 2,500m.`,
        severity: 'HIGH',
        latitude: 13.0067,
        longitude: 80.2575,
        zoneType: 'EVACUATION',
        radiusMeters: 2500,
        actionTab: 'live-map',
        actionLabel: 'Inspect Evacuation Map',
      });
    }
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        clearAllToasts,
        soundEnabled,
        setSoundEnabled,
        userCoords,
        regionRadiusKm,
        setRegionRadiusKm,
        triggerSimulatedAlert,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
