/**
 * NagarSetu – Citizen Registration Page
 */

import React, { useState, useId } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { LanguageSelector } from '../common/LanguageSelector';
import type { PortalChoice } from './LoginPage';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onLoginClick: () => void;
  portal: PortalChoice;
}

const EYE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EYE_OFF_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function passwordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: '', color: 'bg-transparent', width: 'w-0' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: 'Weak', color: 'bg-[#ba1a1a]', width: 'w-1/4' };
  if (score <= 4) return { label: 'Fair', color: 'bg-[#F2A900]', width: 'w-1/2' };
  if (score === 5) return { label: 'Good', color: 'bg-[#315C4A]', width: 'w-3/4' };
  return { label: 'Strong', color: 'bg-[#315C4A]', width: 'w-full' };
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onLoginClick, portal }) => {
  const { register, backendOffline } = useAuth();
  const { locale, setLocale, translations } = useApp();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const consentId = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);

  const validate = (): string | null => {
    if (!name.trim() || name.trim().length < 2) return 'Full name must be at least 2 characters.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one digit.';
    if (!consent) return 'You must accept the data processing consent to register.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    const result = await register({ email: email.trim(), password, name: name.trim(), consent });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onRegisterSuccess();
    }
  };

  return (
    <div className="login-page register-page min-h-screen bg-[#F7F4EA] flex flex-col">
      <header className="login-header flex items-center justify-between gap-3 border-b border-[#ebe3d0] bg-white/90 px-4 py-4 shadow-sm backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#315C4A] text-white shadow-sm">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">account_balance</span>
          </div>
          <div>
            <span className="block text-lg font-bold tracking-tight text-[#171A17]">{translations.portalName}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#315C4A]">
              {portal === 'officer' ? 'Ops Field Access' : portal === 'admin' ? 'Admin Access' : 'Citizen Registration'}
            </span>
          </div>
        </div>

        <LanguageSelector value={locale} onChange={setLocale} />
      </header>

      <main className="login-main flex-1 flex items-center justify-center px-4 py-10">
        <div className="login-layout">
          <aside className="login-visual" aria-hidden="true">
            <div className="login-visual__caption">
              <span>{locale === 'kn' ? 'ನಾಗರಿಕ ಸೇವೆಗಳು' : 'Civic services'}</span>
              <strong>{translations.betterCities}<br />{translations.fasterAction}</strong>
              <p>{translations.publicLandingSubtitle}</p>
            </div>
          </aside>
          <div className="login-form-column w-full max-w-md">
          {portal !== 'citizen' ? (
            <div className="bg-white rounded-2xl shadow-lg border border-surface-container overflow-hidden">
              <div className="bg-secondary px-8 py-6 text-on-secondary">
                <h1 className="text-xl font-bold tracking-tight">
                  {portal === 'officer' ? 'Ops Field accounts are invitation-only' : 'Admin accounts are provisioned securely'}
                </h1>
                <p className="text-sm opacity-85 mt-1 font-medium">
                  {portal === 'officer'
                    ? 'Public officer registration is not available.'
                    : 'Public administrator registration is not available.'}
                </p>
              </div>
              <div className="px-8 py-7">
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {portal === 'officer'
                    ? 'Officer accounts must be provisioned by an authorized administrator or through an approved invitation. If you are a municipal field officer, contact your department administrator to request access.'
                    : 'Admin accounts must be provisioned securely by an authorized administrator. Do not use public registration to obtain Command Centre access.'}
                </p>
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-[#315C4A] hover:bg-[#3c6754] text-white font-bold py-3 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Back to {portal === 'officer' ? 'Ops Field' : 'Admin'} login
                </button>
              </div>
            </div>
          ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-surface-container overflow-hidden">
            <div className="bg-primary-container px-8 py-6">
              <h1 className="text-xl font-bold text-[#614200] tracking-tight">Create Citizen Account</h1>
              <p className="text-sm text-[#614200]/80 mt-1 font-medium">
                Public self-registration for residents. Officers &amp; Admins are provisioned by administrators.
              </p>
            </div>

            <div className="px-8 py-7">
              {backendOffline && (
                <div role="alert" className="mb-5 flex items-start gap-3 p-3 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/30">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-lg mt-0.5" aria-hidden="true">wifi_off</span>
                  <div className="text-sm text-[#93000a]">
                    <strong>Backend offline.</strong> Start the API server with{' '}
                    <code className="font-mono text-xs bg-[#ffdad6]/60 px-1 py-0.5 rounded">npm run server:dev</code> first.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-4">
                  <div>
                    <label htmlFor={nameId} className="block text-sm font-semibold text-[#171A17] mb-1.5">
                      Full name
                    </label>
                    <input
                      id={nameId}
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={e => { setName(e.target.value); setError(''); }}
                      placeholder="Your full name"
                      className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary transition"
                    />
                  </div>

                  <div>
                    <label htmlFor={emailId} className="block text-sm font-semibold text-[#171A17] mb-1.5">
                      Email address
                    </label>
                    <input
                      id={emailId}
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary transition"
                    />
                  </div>

                  <div>
                    <label htmlFor={passwordId} className="block text-sm font-semibold text-[#171A17] mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id={passwordId}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="Min. 8 chars, uppercase, digit"
                        className="w-full px-4 py-2.5 pr-12 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                      >
                        {showPassword ? EYE_OFF_ICON : EYE_ICON}
                      </button>
                    </div>
                    {/* Password strength bar */}
                    {password && (
                      <div className="mt-2">
                        <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Strength: <span className="font-semibold">{strength.label}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Consent */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low border border-surface-container">
                    <input
                      id={consentId}
                      type="checkbox"
                      checked={consent}
                      onChange={e => { setConsent(e.target.checked); setError(''); }}
                      className="mt-0.5 w-4 h-4 accent-secondary cursor-pointer"
                    />
                    <label htmlFor={consentId} className="text-xs text-on-surface-variant leading-relaxed cursor-pointer">
                      I consent to NagarSetu processing my name, email, and complaint data for the purpose of civic service delivery, as required by the Sakala Services Act. My data will not be shared with third parties.
                    </label>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-[#ba1a1a] font-medium">
                    <span className="material-symbols-outlined text-base" aria-hidden="true">error</span>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || backendOffline}
                  className="mt-5 w-full flex items-center justify-center gap-2 bg-[#F2A900] hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed text-[#171A17] font-bold py-3 rounded-xl transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#171A17]/30 border-t-[#171A17] rounded-full animate-spin" aria-hidden="true" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">person_add</span>
                      Create Citizen Account
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-surface-container text-center">
                <p className="text-sm text-on-surface-variant">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onLoginClick}
                    className="text-secondary font-bold hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
};
