import React, { useState } from 'react';
import { Navigation, AlertCircle, Upload, Check, MapPin } from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { LiveMap } from './LiveMap.js';
import { DistressRequest, EmergencyType, UrgencyLevel } from '../types/index.js';

interface Props {
  onSuccess: (newReq: DistressRequest) => void;
  onCancel?: () => void;
}

export const DistressForm: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('RESCUE');
  const [urgency, setUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [affectedCount, setAffectedCount] = useState<number>(2);
  const [description, setDescription] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [evidenceBase64, setEvidenceBase64] = useState<string | null>(null);
  const [evidenceFileName, setEvidenceFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Real Browser Geolocation
  const requestGpsLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your current browser. Please pick location manually on the map.');
      setGpsLoading(false);
      setShowMapPicker(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAccuracy(Math.round(pos.coords.accuracy));
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        let msg = 'Could not acquire GPS position.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location access was denied. Please allow location permissions or pin your location manually on the map below.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'GPS signal request timed out. Please select location manually on the map.';
        }
        setGpsError(msg);
        setShowMapPicker(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 2. Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEvidenceBase64(reader.result as string);
      setEvidenceFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // 3. Form Submit to PostgreSQL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (latitude === null || longitude === null) {
      setErrorMessage('Location coordinates are required. Use GPS or click the map to pin your location.');
      setShowMapPicker(true);
      return;
    }

    if (!description || description.trim().length < 5) {
      setErrorMessage('Please describe the emergency situation in detail.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      emergencyType,
      urgency,
      affectedCount: Number(affectedCount),
      description: description.trim(),
      landmark: landmark.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      latitude,
      longitude,
      evidenceUrl: evidenceBase64 || undefined,
    };

    const res = await apiRequest('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (res.success && res.data?.request) {
      onSuccess(res.data.request);
    } else {
      setErrorMessage(res.error?.message || 'Failed to submit distress request.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-slate-800">
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Emergency Type & Urgency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Emergency Category <span className="text-rose-600">*</span>
          </label>
          <select
            id="select-emergency-type"
            value={emergencyType}
            onChange={(e) => setEmergencyType(e.target.value as EmergencyType)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
          >
            <option value="RESCUE">Immediate Search & Rescue</option>
            <option value="MEDICAL">Medical Emergency / Trauma</option>
            <option value="FOOD">Food & Nutrition Ration Needs</option>
            <option value="WATER">Clean Drinking Water Deprivation</option>
            <option value="SHELTER">Emergency Evacuation Shelter</option>
            <option value="OTHER">Other Disaster Assistance</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Reported Urgency <span className="text-rose-600">*</span>
          </label>
          <select
            id="select-urgency-level"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none font-semibold text-rose-700"
          >
            <option value="CRITICAL">CRITICAL (Imminent danger to life)</option>
            <option value="HIGH">HIGH (Severe condition, urgent response)</option>
            <option value="MEDIUM">MEDIUM (Moderate urgency, standard relief)</option>
            <option value="LOW">LOW (Advisory / Non-immediate request)</option>
          </select>
        </div>
      </div>

      {/* Affected People & Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Number of Affected People <span className="text-rose-600">*</span>
          </label>
          <input
            id="input-affected-count"
            type="number"
            min="1"
            max="1000"
            value={affectedCount}
            onChange={(e) => setAffectedCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Direct Contact Phone Number
          </label>
          <input
            id="input-contact-phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Description & Landmark */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
          Emergency Description & Current Status <span className="text-rose-600">*</span>
        </label>
        <textarea
          id="textarea-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="State what is happening, visible injuries, rising water levels, structural damage, etc..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none leading-relaxed"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
          Nearest Landmark / Physical Address
        </label>
        <input
          id="input-landmark"
          type="text"
          placeholder="e.g. Near Velachery MRTS Station, South Buckingham Canal or Temple Road"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
        />
      </div>

      {/* Geolocation Section */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-600" />
              Accurate GPS Location <span className="text-rose-600">*</span>
            </span>
            <p className="text-xs text-slate-500 mt-0.5">Emergency teams navigate using accurate coordinates.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-get-gps"
              type="button"
              onClick={requestGpsLocation}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              {gpsLoading ? 'Acquiring GPS...' : 'Acquire My GPS'}
            </button>

            <button
              id="btn-toggle-map-picker"
              type="button"
              onClick={() => setShowMapPicker(!showMapPicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {showMapPicker ? 'Hide Pin Map' : 'Select on Map'}
            </button>
          </div>
        </div>

        {latitude !== null && longitude !== null ? (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Coordinates: <strong>{latitude.toFixed(5)}, {longitude.toFixed(5)}</strong>
                {accuracy ? ` (Accuracy: ±${accuracy}m)` : ''}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-amber-700 italic">No GPS coordinates acquired yet. Click 'Acquire My GPS' or select on map.</p>
        )}

        {gpsError && <p className="text-xs text-rose-600 font-medium">{gpsError}</p>}

        {showMapPicker && (
          <div className="pt-2">
            <LiveMap
              heightClass="h-56"
              center={latitude && longitude ? [latitude, longitude] : [13.0827, 80.2707]}
              zoom={latitude && longitude ? 15 : 11}
              interactiveSelect={true}
              selectedLocation={latitude && longitude ? { lat: latitude, lng: longitude } : null}
              onSelectLocation={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
                setAccuracy(null);
                setGpsError(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Evidence Upload */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
          Optional Photographic Evidence
        </label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 border-dashed rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors bg-white">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>{evidenceFileName ? 'Change Photo' : 'Upload Scene Photo (Max 5MB)'}</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
          {evidenceFileName && (
            <span className="text-xs text-slate-600 truncate max-w-xs font-mono">{evidenceFileName}</span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}

        <button
          id="btn-submit-distress-report"
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Broadcasting to Rescue Ledger...
            </>
          ) : (
            'Broadcast Emergency Distress'
          )}
        </button>
      </div>
    </form>
  );
};
