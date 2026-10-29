import React, { useState } from 'react';
import { LifeBuoy, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';

interface Props {
  onSuccess: () => void;
  onGoToLogin: () => void;
}

export const Register: React.FC<Props> = ({ onSuccess, onGoToLogin }) => {
  const { register } = useAuth();
  const [role, setRole] = useState<UserRole>('CITIZEN');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  // Role specific
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [skills, setSkills] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('');
  const [agencyName, setAgencyName] = useState<string>('');
  const [badgeId, setBadgeId] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    const payload: any = {
      role,
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
    };

    if (role === 'CITIZEN') {
      payload.emergencyContact = emergencyContact.trim() || undefined;
      payload.address = address.trim() || undefined;
    } else if (role === 'VOLUNTEER') {
      payload.skills = skills.trim() || undefined;
      payload.vehicleType = vehicleType.trim() || undefined;
    } else if (role === 'GOVERNMENT') {
      payload.agencyName = agencyName.trim() || 'Emergency Services Agency';
      payload.badgeId = badgeId.trim() || undefined;
    }

    const res = await register(payload);
    setIsLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs mb-3 font-bold text-sm">
            RL
          </div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Create ReliefLink Account</h2>
          <p className="text-xs text-slate-400 mt-0.5">Register for disaster relief & operational coordination</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Role Picker */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['CITIZEN', 'VOLUNTEER', 'GOVERNMENT', 'ADMIN'] as UserRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                    role === r
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {role === 'CITIZEN' && (
              <div className="mt-2.5 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 text-xs flex items-start gap-2.5">
                <span className="text-base">🤝</span>
                <div>
                  <strong className="font-bold block text-indigo-950">Dual Citizen & Volunteer Responder Active</strong>
                  <span className="text-indigo-700 text-[11px] leading-relaxed block mt-0.5">
                    All citizen accounts automatically receive volunteer responder alerts. If an emergency occurs nearby, you can mark "I will go and help" to assist neighbors while Government & NDRF rescue teams are dispatched.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Priya Sundaram"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Contact Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Role specific profile fields */}
          {role === 'CITIZEN' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Primary Emergency Contact (Family / Next of Kin)
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+91 98450 11223 (Family contact)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Home Residential Address / District
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat 4B, Kaveri Enclave, Velachery, Chennai"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {role === 'VOLUNTEER' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Skills & Certifications
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Emergency First Aid, Swift Water Rescue, Boat Navigation, CPR"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Available Vehicle / Transport
                </label>
                <input
                  type="text"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  placeholder="Mahindra Bolero 4x4, Rescue Boat, Force Trax Ambulance"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {role === 'GOVERNMENT' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Agency / Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="National Disaster Response Force (NDRF) / SDMA"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Official Badge / Incident Command ID
                </label>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  placeholder="NDRF-04-CMD"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-full shadow-xs hover:shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Creating Verified Account...
              </>
            ) : (
              <>
                Complete Registration <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already registered on ReliefLink?{' '}
            <button
              type="button"
              onClick={onGoToLogin}
              className="text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Sign In Here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
