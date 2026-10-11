/**
 * NagarSetu – Login Page
 *
 * Portal selection is sent to the server as a constraint. The granted role
 * always comes from the stored account, never from this UI choice.
 */

import React, { useState, useId } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { LanguageSelector } from '../common/LanguageSelector';

export type PortalChoice = 'citizen' | 'officer' | 'admin';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onRegisterClick: () => void;
  portal: PortalChoice;
  onPortalChange: (portal: PortalChoice) => void;
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

const PORTALS: { key: PortalChoice; label: string; icon: string; description: string }[] = [
  {
    key: 'citizen',
    label: 'Citizen',
    icon: 'person',
    description: 'File complaints & track civic issues',
  },
  {
    key: 'officer',
    label: 'Ops Field',
    icon: 'engineering',
    description: 'Municipal field officer access',
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: 'admin_panel_settings',
    description: 'Command centre & administration',
  },
];

const PORTAL_TITLES: Record<PortalChoice, { heading: string; subtitle: string; emailPlaceholder: string }> = {
  citizen: {
    heading: 'Citizen Portal',
    subtitle: 'Sign in with a Citizen account to file and track civic issues.',
    emailPlaceholder: 'you@example.com',
  },
  officer: {
    heading: 'Ops Field Portal',
    subtitle: 'Authorized municipal officers only. Public officer registration is not available.',
    emailPlaceholder: 'officer@bbmp.gov.in',
  },
  admin: {
    heading: 'Admin Portal',
    subtitle: 'Authorized administrators only. Admin accounts must be provisioned securely.',
    emailPlaceholder: 'admin@nagarsetu.gov.in',
  },
};

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onRegisterClick,
  portal,
  onPortalChange,
}) => {
  const { login, backendOffline } = useAuth();
  const { locale, setLocale, translations } = useApp();
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const portalCopy = PORTAL_TITLES[portal];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }

    setLoading(true);
    const result = await login(email.trim(), password, portal);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onLoginSuccess();
    }
  };

  return (
    <div className="login-page min-h-screen bg-[#F7F4EA] flex flex-col">
      <header className="login-header flex items-center justify-between gap-3 border-b border-[#ebe3d0] bg-white/90 px-4 py-4 shadow-sm backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#315C4A] text-white shadow-sm">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">account_balance</span>
          </div>
          <div>
            <span className="block text-lg font-bold tracking-tight text-[#171A17]">{translations.portalName}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#315C4A]">{translations.smartCity}</span>
          </div>
        </div>

        <LanguageSelector value={locale} onChange={setLocale} />
      </header>

      <main className="login-main flex flex-1 items-center justify-center px-4 py-10">
        <div className="login-layout">
          <aside className="login-visual" aria-hidden="true">
            <div className="login-visual__caption">
              <span>{locale === 'kn' ? 'ನಾಗರಿಕ ಸೇವೆಗಳು' : 'Civic services'}</span>
              <strong>{translations.betterCities}<br />{translations.fasterAction}</strong>
              <p>{translations.publicLandingSubtitle}</p>
            </div>
          </aside>
          <div className="login-form-column w-full max-w-md">
          <div className="login-card-enter overflow-hidden rounded-[28px] border border-[#e7dfd2] bg-white shadow-[0_18px_50px_rgba(23,26,23,0.08)]">
            <div className="bg-[#315C4A] px-8 py-6 text-white">
              <h1 className="text-xl font-bold leading-tight tracking-tight">{portalCopy.heading}</h1>
              <p className="mt-1 text-sm font-medium text-white/85">{portalCopy.subtitle}</p>
            </div>

            <div className="px-8 py-7">
              {backendOffline && (
                <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-[#ba1a1a]/25 bg-[#ffdad6] p-3 text-sm text-[#93000a]">
                  <span className="material-symbols-outlined mt-0.5 text-lg" aria-hidden="true">wifi_off</span>
                  <div>
                    <strong>Backend offline.</strong> Start the API server with{' '}
                    <code className="rounded bg-[#ffdad6]/60 px-1 py-0.5 font-mono text-[11px]">npm run server:dev</code>
                    {' '}in a separate terminal, then try again.
                  </div>
                </div>
              )}

              <fieldset className="mb-6">
                <legend className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#514533]">
                  {translations.selectPortal}
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {PORTALS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => { onPortalChange(p.key); setError(''); }}
                      aria-pressed={portal === p.key}
                      className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315C4A] ${
                        portal === p.key
                          ? 'border-[#315C4A] bg-[#eaf3ef] text-[#315C4A]'
                          : 'border-[#e7dfd2] bg-[#f9f7f2] text-[#171A17] hover:border-[#315C4A]/60'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl" aria-hidden="true">{p.icon}</span>
                      <span className="text-[11px] font-bold leading-tight">{p.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 flex items-start gap-1 text-xs text-[#514533]">
                  <span className="material-symbols-outlined mt-0.5 text-sm" aria-hidden="true">info</span>
                  <span>{PORTALS.find((p) => p.key === portal)?.description}</span>
                </p>
              </fieldset>

              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-4">
                  <div>
                    <label htmlFor={emailId} className="mb-1.5 block text-sm font-semibold text-[#171A17]">
                      {translations.emailAddress}
                    </label>
                    <input
                      id={emailId}
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder={portalCopy.emailPlaceholder}
                      aria-describedby={error ? 'login-error' : undefined}
                      className="w-full rounded-lg border border-[#d9d3c5] bg-[#f9f7f2] px-4 py-2.5 text-[#171A17] placeholder:text-[#514533]/60 focus:outline-none focus:ring-2 focus:ring-[#315C4A]"
                    />
                  </div>

                  <div>
                    <label htmlFor={passwordId} className="mb-1.5 block text-sm font-semibold text-[#171A17]">
                      {translations.password}
                    </label>
                    <div className="relative">
                      <input
                        id={passwordId}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="Enter password"
                        aria-describedby={error ? 'login-error' : undefined}
                        className="w-full rounded-lg border border-[#d9d3c5] bg-[#f9f7f2] px-4 py-2.5 pr-11 text-[#171A17] placeholder:text-[#514533]/60 focus:outline-none focus:ring-2 focus:ring-[#315C4A]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#514533] hover:text-[#315C4A]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? EYE_OFF_ICON : EYE_ICON}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <p id="login-error" role="alert" className="mt-3 flex items-center gap-2 text-sm font-medium text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-base" aria-hidden="true">error</span>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || backendOffline}
                  className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#315C4A] py-3 font-bold text-white shadow-sm transition-all hover:bg-[#3c6754] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315C4A]"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">login</span>
                      {translations.signIn}
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 border-t border-[#ebe3d0] pt-5 text-center">
                {portal === 'citizen' ? (
                  <>
                    <p className="text-sm text-[#514533]">
                      New citizen account?{' '}
                      <button
                        type="button"
                        onClick={onRegisterClick}
                        className="font-bold text-[#315C4A] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#315C4A]"
                      >
                        {translations.registerHere}
                      </button>
                    </p>
                    <p className="mt-2 text-xs text-[#514533]/70">
                      Officer &amp; Admin accounts are provisioned by administrators only.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed text-[#514533]">
                      {portal === 'officer'
                        ? 'Officer accounts must be provisioned by an authorized administrator or through an approved invitation. Public officer registration is not available.'
                        : 'Admin accounts must be provisioned securely. Public administrator registration is not available.'}
                    </p>
                    <button
                      type="button"
                      onClick={onRegisterClick}
                      className="mt-3 text-sm font-bold text-[#315C4A] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#315C4A]"
                    >
                      Registration details
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#514533]/70">
            NagarSetu • Municipal Smart Urban Operations Portal<br />
            Your credentials are never stored in the browser.
          </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#e7dfd2] bg-[#fffefa] px-4 py-5 text-xs text-[#514533] md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a className="inline-flex items-center gap-2 font-semibold text-[#315C4A] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315C4A]" href="tel:1913">
            <span className="material-symbols-outlined text-base" aria-hidden="true">support_agent</span>
            <span>{translations.helpLine}: 1913</span>
          </a>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-6">
            <p>
              <span className="block font-bold text-[#171A17]">{translations.accessibilityLabel}</span>
              {translations.accessibilityNote}
            </p>
            <p>
              <span className="block font-bold text-[#171A17]">{translations.privacyLabel}</span>
              {translations.privacyNote}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
