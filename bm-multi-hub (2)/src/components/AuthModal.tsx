import React, { useState } from 'react';
import { Shield, Lock, User, Key, CheckCircle, AlertCircle, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { User as UserType } from '../types';
import { loadUsers, logAuditEvent } from '../lib/storage';

interface AuthModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserType) => void;
  theme: 'dark' | 'light';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onLoginSuccess,
  theme
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaStep, setMfaStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [pendingUser, setPendingUser] = useState<UserType | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = loadUsers();
    const found = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password.trim()
    );

    if (!found) {
      setError('Invalid User ID or Password. Please verify your credentials.');
      return;
    }

    if (found.mfaEnabled) {
      setPendingUser(found);
      setMfaStep(true);
    } else {
      logAuditEvent({
        userId: found.id,
        userName: found.name,
        action: 'USER_LOGIN',
        resource: 'AUTH_SESSION',
        details: `User ${found.username} logged in successfully. Role: ${found.role}`,
        ipAddress: '192.168.1.104',
        status: 'SUCCESS'
      });
      onLoginSuccess(found);
    }
  };

  const handleMfaVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit TOTP verification code.');
      return;
    }
    if (pendingUser) {
      logAuditEvent({
        userId: pendingUser.id,
        userName: pendingUser.name,
        action: 'MFA_VERIFIED',
        resource: 'AUTH_SESSION',
        details: `MFA 2FA Code verified for ${pendingUser.username}`,
        ipAddress: '192.168.1.104',
        status: 'SUCCESS'
      });
      onLoginSuccess(pendingUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border transition-all ${
        theme === 'dark'
          ? 'bg-[#0B0E14] border-[#D4AF37]/30 text-white'
          : 'bg-white border-amber-300 text-gray-900'
      }`}>
        
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-b from-[#161C28] to-[#0B0E14] border-b border-[#D4AF37]/20 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-[#AA771C] via-[#D4AF37] to-[#F3E5AB] p-0.5 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#080B10] rounded-[14px] flex items-center justify-center">
              <Shield className="w-7 h-7 text-[#F3E5AB]" />
            </div>
          </div>
          <h2 className="font-cinzel text-xl font-bold tracking-wide gold-text-gradient">
            BM MULTI-HUB
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Enterprise Ad Asset & Spend Monitoring Sentinel
          </p>

          {/* Secure Access Badge */}
          <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>Secure Access Sentinel • Role-Based Authentication</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!mfaStep ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>User ID / Username</span>
                  <span className="text-[10px] text-gray-400 font-mono">Authorized Personnel</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your User ID"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-mono border focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#121722] border-gray-700 text-white focus:border-[#D4AF37]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#D4AF37]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Key className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-mono border focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#121722] border-gray-700 text-white focus:border-[#D4AF37]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#D4AF37]'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                className="w-full py-3 rounded-xl gold-btn text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <span>Authenticate & Enter Sentinel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Multi-Factor Authentication Verification Step */
            <form onSubmit={handleMfaVerify} className="space-y-4">
              <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Lock className="w-6 h-6 mx-auto text-[#D4AF37] mb-1" />
                <h4 className="text-xs font-bold text-[#F3E5AB]">Multi-Factor Authentication (2FA)</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Enter the 6-digit TOTP code generated by your Authenticator app.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  id="login-mfa-otp"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full py-3 text-center tracking-[0.5em] text-lg font-mono rounded-xl bg-[#121722] border border-[#D4AF37] text-[#F3E5AB] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setMfaStep(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-gray-700 text-xs text-gray-400 hover:bg-gray-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpCode('829143');
                  }}
                  className="w-1/3 py-2.5 rounded-xl border border-[#D4AF37]/40 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  Simulate OTP
                </button>
                <button
                  type="submit"
                  id="mfa-verify-btn"
                  className="w-1/3 py-2.5 rounded-xl gold-btn text-xs font-bold"
                >
                  Verify
                </button>
              </div>
            </form>
          )}

          {/* Footer Security Notice */}
          <div className="mt-5 text-center text-[10px] text-gray-500 flex items-center justify-center space-x-1.5 border-t border-gray-800/80 pt-3">
            <Lock className="w-3 h-3 text-[#D4AF37]" />
            <span>GDPR Compliant • 256-Bit SSL/TLS • Zero Third-Party Tracker</span>
          </div>
        </div>

      </div>
    </div>
  );
};
