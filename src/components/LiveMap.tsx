import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DistressRequest, VolunteerItem, ReliefCenter, DisasterZone } from '../types/index.js';

interface Props {
  requests?: DistressRequest[];
  volunteers?: VolunteerItem[];
  reliefCenters?: ReliefCenter[];
  zones?: DisasterZone[];
  center?: [number, number];
  zoom?: number;
  interactiveSelect?: boolean;
  onSelectLocation?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  heightClass?: string;
  onRequestClick?: (req: DistressRequest) => void;
}

export const LiveMap: React.FC<Props> = ({
  requests = [],
  volunteers = [],
  reliefCenters = [],
  zones = [],
  center = [20.5937, 78.9629], // Geographic Center of India
  zoom = 5,
  interactiveSelect = false,
  onSelectLocation,
  selectedLocation,
  heightClass = 'h-[500px]',
  onRequestClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const selectionMarkerRef = useRef<L.Marker | null>(null);
  const hasAutoFitRef = useRef<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center as L.LatLngTuple,
        zoom,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap | ReliefLink India Disaster Network' }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      if (interactiveSelect) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          if (onSelectLocation) {
            onSelectLocation(e.latlng.lat, e.latlng.lng);
          }
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when explicitly provided and changed
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom());
    }
  }, [center[0], center[1]]);

  // Quick navigation handlers
  const handleResetToIndia = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([20.5937, 78.9629], 5);
    }
  };

  const handleFocusIncidents = () => {
    if (!mapInstanceRef.current) return;
    const points: [number, number][] = [];
    requests.forEach(r => { if (r.latitude && r.longitude) points.push([r.latitude, r.longitude]); });
    reliefCenters.forEach(c => { if (c.latitude && c.longitude) points.push([c.latitude, c.longitude]); });
    zones.forEach(z => { if (z.latitude && z.longitude) points.push([z.latitude, z.longitude]); });
    volunteers.forEach(v => { if (v.current_latitude && v.current_longitude) points.push([v.current_latitude, v.current_longitude]); });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      mapInstanceRef.current.setView([20.5937, 78.9629], 5);
    }
  };

  // Render Markers & Disaster Zones
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    // 1. Disaster Hazard & Evacuation Zones
    zones.forEach(zone => {
      let color = '#ef4444'; // Red for HIGH_RISK
      if (zone.zone_type === 'EVACUATION') color = '#f97316'; // Orange
      if (zone.zone_type === 'SAFE') color = '#10b981'; // Green
      if (zone.zone_type === 'AFFECTED') color = '#eab308'; // Yellow

      const circle = L.circle([zone.latitude, zone.longitude], {
        color,
        fillColor: color,
        fillOpacity: 0.18,
        weight: 2,
        radius: zone.radius_meters || 1500,
      });

      circle.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: ${color}; font-size: 13px;">${zone.name}</strong><br/>
          <strong>Zone Type:</strong> ${zone.zone_type.replace(/_/g, ' ')}<br/>
          <strong>Severity:</strong> ${zone.severity}<br/>
          <strong>Radius:</strong> ${(zone.radius_meters / 1000).toFixed(1)} km
        </div>
      `);
      circle.addTo(layer);
    });

    // 2. Relief Centers / Shelters
    reliefCenters.forEach(center => {
      const isFull = center.operating_status === 'FULL';
      const iconHtml = `
        <div style="background-color: ${isFull ? '#e11d48' : '#7c3aed'}; color: white; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
          RC
        </div>
      `;
      const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
      const marker = L.marker([center.latitude, center.longitude], { icon });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="font-size: 13px; color: #1e293b;">${center.name}</strong><br/>
          <span style="color: #64748b;">${center.center_type} Center</span><br/>
          <div style="margin-top: 4px; padding: 4px 8px; background-color: #f1f5f9; border-radius: 4px;">
            <strong>Capacity:</strong> ${center.occupancy} / ${center.capacity} (${center.occupancy_percentage}%)<br/>
            <strong>Available Beds:</strong> ${center.available_beds}<br/>
            <strong>Status:</strong> <span style="font-weight:bold; color: ${isFull ? '#e11d48' : '#10b981'};">${center.operating_status}</span>
          </div>
          ${center.contact_phone ? `<div style="margin-top:4px;">📞 ${center.contact_phone}</div>` : ''}
        </div>
      `);
      marker.addTo(layer);
    });

    // 3. Field Volunteers
    volunteers.forEach(vol => {
      if (vol.current_latitude && vol.current_longitude) {
        const isAvail = vol.availability_status === 'AVAILABLE';
        const color = isAvail ? '#0284c7' : '#94a3b8';
        const iconHtml = `
          <div style="background-color: ${color}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
            V
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        const marker = L.marker([vol.current_latitude, vol.current_longitude], { icon });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
            <strong style="color: #0369a1;">Volunteer: ${vol.full_name}</strong><br/>
            <strong>Status:</strong> ${vol.availability_status}<br/>
            ${vol.skills ? `<strong>Skills:</strong> ${vol.skills}<br/>` : ''}
            ${vol.vehicle_type ? `<strong>Vehicle:</strong> ${vol.vehicle_type}<br/>` : ''}
            ${vol.phone ? `<strong>Contact:</strong> ${vol.phone}` : ''}
          </div>
        `);
        marker.addTo(layer);
      }
    });

    // 4. Distress Requests
    requests.forEach(req => {
      let bg = '#e11d48'; // Critical red
      if (req.priority === 'HIGH') bg = '#f97316';
      else if (req.priority === 'MEDIUM') bg = '#eab308';
      else if (req.status === 'RESOLVED') bg = '#10b981';

      if (req.status === 'CLAIMED' || req.status === 'EN_ROUTE' || req.status === 'ARRIVED') {
        bg = '#0284c7'; // Active Blue
      }

      const pulse = req.priority === 'CRITICAL' && req.status === 'OPEN' ? 'animation: pulse 1.5s infinite;' : '';

      const iconHtml = `
        <div style="background-color: ${bg}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.35); ${pulse}">
          !
        </div>
      `;
      const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
      const marker = L.marker([req.latitude, req.longitude], { icon });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 180px;">
          <strong style="color: ${bg}; font-size: 13px;">${req.request_code}</strong>
          <span style="float: right; font-size: 10px; font-weight: bold; background: #e2e8f0; padding: 1px 5px; border-radius: 3px;">${req.status}</span><br/>
          <strong>Type:</strong> ${req.emergency_type} (${req.urgency})<br/>
          <strong>Affected People:</strong> ${req.affected_count}<br/>
          <p style="margin: 4px 0; color: #334155; font-size: 11px;">"${req.description?.substring(0, 100)}${req.description?.length > 100 ? '...' : ''}"</p>
          ${req.landmark ? `<strong>Landmark:</strong> ${req.landmark}<br/>` : ''}
          ${req.assigned_volunteer_name ? `<div style="margin-top: 4px; color: #0284c7; font-weight: bold;">Assigned: ${req.assigned_volunteer_name}</div>` : ''}
        </div>
      `);

      if (onRequestClick) {
        marker.on('click', () => onRequestClick(req));
      }

      marker.addTo(layer);
    });

    // 5. Selected location marker (for form selection)
    if (selectedLocation) {
      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
      } else {
        const pinIcon = L.divIcon({
          html: `<div style="background-color: #0f172a; color: #38bdf8; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid #38bdf8; box-shadow: 0 4px 8px rgba(0,0,0,0.4);">📍</div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const pinMarker = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: pinIcon }).addTo(layer);
        pinMarker.bindPopup('Selected Emergency Location').openPopup();
        selectionMarkerRef.current = pinMarker;
      }
    }

    // Auto-frame active disaster incidents on first data load if not manually positioning
    if (!hasAutoFitRef.current && !selectedLocation && !interactiveSelect) {
      const points: [number, number][] = [];
      requests.forEach(r => { if (r.latitude && r.longitude) points.push([r.latitude, r.longitude]); });
      reliefCenters.forEach(c => { if (c.latitude && c.longitude) points.push([c.latitude, c.longitude]); });
      zones.forEach(z => { if (z.latitude && z.longitude) points.push([z.latitude, z.longitude]); });
      volunteers.forEach(v => { if (v.current_latitude && v.current_longitude) points.push([v.current_latitude, v.current_longitude]); });

      if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
        hasAutoFitRef.current = true;
      }
    }
  }, [requests, volunteers, reliefCenters, zones, selectedLocation]);

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 z-0`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Top Controls Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        {interactiveSelect ? (
          <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            Click map to pin emergency GPS in India
          </div>
        ) : (
          <div className="bg-slate-900/90 text-white backdrop-blur-xs px-3 py-1 rounded-lg shadow-md text-xs font-semibold flex items-center gap-1.5 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Live Map: India Disaster Response</span>
          </div>
        )}

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleFocusIncidents}
            title="Fit view to all active distress reports, shelters and zones"
            className="px-2.5 py-1 bg-white/95 hover:bg-white text-slate-800 text-[11px] font-bold rounded-md shadow-md border border-slate-200 transition-colors cursor-pointer"
          >
            📍 Focus Incidents
          </button>
          <button
            type="button"
            onClick={handleResetToIndia}
            title="Reset view to full India map"
            className="px-2.5 py-1 bg-white/95 hover:bg-white text-slate-800 text-[11px] font-bold rounded-md shadow-md border border-slate-200 transition-colors cursor-pointer"
          >
            🇮🇳 All India
          </button>
        </div>
      </div>
    </div>
  );
};
