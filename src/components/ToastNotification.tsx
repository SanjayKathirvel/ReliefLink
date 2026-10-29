import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  LifeBuoy,
  Radio,
  MapPin,
  X,
  Volume2,
  VolumeX,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.js';
import { RegionalToastAlert } from '../types/index.js';

interface ToastItemProps {
  toast: RegionalToastAlert;
  onDismiss: (id: string) => void;
  onAction?: (tab: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss, onAction }) => {
  const [progress, setProgress] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(toast.durationMs || 12000);
  const totalDuration = toast.durationMs || 12000;

  useEffect(() => {
    if (isPaused) return;

    const interval = 50;
    const timer = setInterval(() => {
      remainingTimeRef.current -= interval;
      const pct = Math.max(0, (remainingTimeRef.current / totalDuration) * 100);
      setProgress(pct);

      if (remainingTimeRef.current <= 0) {
        clearInterval(timer);
        onDismiss(toast.id);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, onDismiss, toast.id, totalDuration]);

  const isDistress = toast.type === 'CRITICAL_DISTRESS';
  const isZone = toast.type === 'DISASTER_ZONE';

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full rounded-2xl overflow-hidden shadow-2xl transition-all border backdrop-blur-md pointer-events-auto transform hover:-translate-y-0.5 ${
        isDistress
          ? 'bg-slate-950/95 border-rose-500/80 text-white'
          : isZone
          ? 'bg-slate-950/95 border-amber-500/80 text-white'
          : 'bg-slate-950/95 border-indigo-500/80 text-white'
      }`}
    >
      {/* Visual Accent Glow Top Bar */}
      <div
        className={`h-1.5 w-full ${
          isDistress
            ? 'bg-gradient-to-r from-rose-500 via-red-600 to-amber-500 animate-pulse'
            : isZone
            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 animate-pulse'
            : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
        }`}
      />

      <div className="p-4 sm:p-5 space-y-3">
        {/* Header Badges and Dismiss */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {isDistress ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                🚨 Critical Distress Signal
              </span>
            ) : isZone ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                ⚠️ New Hazard Zone
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
                Emergency Broadcast
              </span>
            )}

            {/* Regional proximity tag */}
            {toast.distanceKm != null ? (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  toast.isLocalRegion
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                {toast.isLocalRegion ? 'In Your Region' : 'Nearby Sector'} (~{toast.distanceKm} km)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                Active Disaster Grid
              </span>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss alert"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title and Message */}
        <div className="space-y-1">
          <h4 className="font-black text-sm text-slate-100 leading-snug tracking-tight flex items-center gap-1.5">
            {toast.title}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {toast.message}
          </p>
        </div>

        {/* Details & Landmark strip */}
        {(toast.landmark || toast.affectedCount || toast.zoneType) && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            {toast.landmark && (
              <span className="flex items-center gap-1 text-slate-300">
                <span className="text-slate-500 font-semibold">Landmark:</span> {toast.landmark}
              </span>
            )}
            {toast.affectedCount != null && (
              <span className="flex items-center gap-1 text-rose-300 font-bold">
                • {toast.affectedCount} person(s) stranded
              </span>
            )}
            {toast.zoneType && (
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                • Type: {toast.zoneType}
              </span>
            )}
          </div>
        )}

        {/* Action Button Row */}
        <div className="flex items-center justify-between gap-2 pt-2">
          {toast.actionTab && onAction ? (
            <button
              onClick={() => {
                onAction(toast.actionTab!);
                onDismiss(toast.id);
              }}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer transform active:scale-98 ${
                isDistress
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : isZone
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <span>{toast.actionLabel || 'View Incident Details'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onDismiss(toast.id)}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Acknowledge Alert
            </button>
          )}
        </div>
      </div>

      {/* Auto-Dismiss Countdown Progress Bar */}
      <div className="h-1 bg-slate-800 w-full overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ${
            isDistress ? 'bg-rose-500' : isZone ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastNotificationContainer: React.FC<{
  onNavigateTab?: (tab: string) => void;
}> = ({ onNavigateTab }) => {
  const {
    toasts,
    removeToast,
    clearAllToasts,
    soundEnabled,
    setSoundEnabled,
    triggerSimulatedAlert,
  } = useToast();

  const [showTester, setShowTester] = useState<boolean>(false);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0"
    >
      {/* Mini sound toggle & testing header bar if toasts are active or tester open */}
      <div className="flex items-center justify-end gap-1.5 pointer-events-auto">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 rounded-full text-xs font-medium border backdrop-blur-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
            soundEnabled
              ? 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
              : 'bg-slate-900/80 border-slate-700 text-slate-500 hover:text-slate-300'
          }`}
          title={soundEnabled ? 'Alert Chime Sound: Enabled (Click to Mute)' : 'Alert Chime Sound: Muted (Click to Unmute)'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] pr-1 hidden sm:inline">Audio Alert: On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] pr-1 hidden sm:inline">Audio: Muted</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowTester(!showTester)}
          className="p-1.5 px-2.5 rounded-full text-[10px] font-bold bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 backdrop-blur-md shadow-xs transition-colors cursor-pointer flex items-center gap-1"
          title="Simulate Regional Alerts to test real-time toast notification behavior"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Test Toast</span>
        </button>

        {toasts.length > 1 && (
          <button
            onClick={clearAllToasts}
            className="p-1.5 px-2.5 rounded-full text-[10px] font-bold bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 backdrop-blur-md shadow-xs transition-colors cursor-pointer"
          >
            Clear All ({toasts.length})
          </button>
        )}
      </div>

      {/* Simulated Alert Testing Drawer */}
      {showTester && (
        <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl text-xs text-slate-200 space-y-2 pointer-events-auto backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="font-bold text-[11px] text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Simulate Real-Time Regional Alert
            </span>
            <button
              onClick={() => setShowTester(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Trigger a simulated real-time event to test citizen & volunteer toast notification behavior and sound chimes:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                triggerSimulatedAlert('CRITICAL_DISTRESS');
              }}
              className="px-2.5 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
              Critical Distress
            </button>
            <button
              onClick={() => {
                triggerSimulatedAlert('DISASTER_ZONE');
              }}
              className="px-2.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-200 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Disaster Zone
            </button>
          </div>
        </div>
      )}

      {/* Render Active Toasts */}
      <div className="flex flex-col gap-2.5">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={removeToast}
            onAction={onNavigateTab}
          />
        ))}
      </div>
    </div>
  );
};
