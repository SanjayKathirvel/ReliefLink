import React, { useState } from 'react';
import { LifeBuoy, AlertCircle, ArrowRight, Shield, User, HeartHandshake, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface Props {
  onSuccess: () => void;
  onGoToRegister: () => void;
}

export const Login: React.FC<Props> = ({ onSuccess, onGoToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const quickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        {/* Header */}
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs mb-3 font-bold text-sm">
            RL
          </div>
          <h2 className="text-xl font-semibold text-slate-900 font-sans tracking-tight">
            Sign In to <span className="text-indigo-600">ReliefLink</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Official Disaster Relief & Incident Coordination
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              id="input-login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Password
              </label>
            </div>
            <input
              id="input-login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-600 focus:outline-none transition-colors"
            />
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-full shadow-xs hover:shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Authenticating...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick-Fill Verification Credentials for All Roles */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 text-center">
            Quick-Login with Role-Based Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickFill('citizen@relieflink.org', 'Citizen@123')}
              className="p-2.5 border border-slate-100 hover:border-slate-200 rounded-xl text-left bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <User className="w-3.5 h-3.5 text-emerald-600" /> Citizen
              </div>
              <span className="text-[10px] text-slate-400 block truncate font-mono">citizen@relieflink.org</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('volunteer@relieflink.org', 'Vol@123')}
              className="p-2.5 border border-slate-100 hover:border-slate-200 rounded-xl text-left bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <HeartHandshake className="w-3.5 h-3.5 text-indigo-600" /> Volunteer
              </div>
              <span className="text-[10px] text-slate-400 block truncate font-mono">volunteer@relieflink.org</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('gov@relieflink.org', 'Gov@123')}
              className="p-2.5 border border-slate-100 hover:border-slate-200 rounded-xl text-left bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Building2 className="w-3.5 h-3.5 text-amber-600" /> Government
              </div>
              <span className="text-[10px] text-slate-400 block truncate font-mono">gov@relieflink.org</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('admin@relieflink.org', 'Admin@123')}
              className="p-2.5 border border-slate-100 hover:border-slate-200 rounded-xl text-left bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Shield className="w-3.5 h-3.5 text-rose-600" /> Admin
              </div>
              <span className="text-[10px] text-slate-400 block truncate font-mono">admin@relieflink.org</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              className="text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
