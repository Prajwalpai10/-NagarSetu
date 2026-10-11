import React from 'react';
import { useApp } from '../../context/AppContext';

export const PublicLandingView: React.FC = () => {
  const { setPersona, setCurrentView, locale, setLocale, translations } = useApp();

  const handleCategorySelect = (categoryName: string) => {
    setPersona('citizen');
    setCurrentView('report_issue', { category: categoryName });
  };

  return (
    <div className="flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <section className="civic-landing-hero relative w-full border-b border-surface-container py-12 md:py-20">
        <div className="civic-landing-layout mx-auto px-margin md:px-margin-desktop">
          <div className="civic-landing-copy">
          <div className="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-secondary-container w-max mb-space-md">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-label-caps text-label-caps text-on-secondary-fixed-variant uppercase tracking-wider font-semibold">
              {locale === 'kn' ? 'ನಾಗರಿಕ ಸೇವಾ ವೇದಿಕೆ' : 'Civic service platform'}
            </span>
          </div>

          <h1 className="font-headline-xl text-4xl sm:text-5xl md:text-6xl text-on-surface tracking-tight font-bold mb-space-md leading-tight">
            {translations.betterCities} <span className="text-secondary">{translations.fasterAction}</span>
          </h1>

          <p className="font-body-lg text-lg sm:text-xl text-on-surface-variant max-w-2xl leading-relaxed mb-space-xl">
            {translations.publicLandingSubtitle}
          </p>

          {/* Primary Action Buttons */}
          <div className="civic-landing-actions flex flex-col sm:flex-row items-center justify-center gap-space-md w-full max-w-md">
            <button
              onClick={() => { setPersona('citizen'); setCurrentView('report_issue'); }}
              className="w-full sm:w-auto flex-1 bg-primary-container text-on-surface px-8 py-3.5 rounded-xl font-headline-md text-base font-bold hover:brightness-95 active:scale-95 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">add_location_alt</span>
              <span>{translations.reportIssue}</span>
            </button>

            <button
              onClick={() => { setPersona('citizen'); setCurrentView('track_complaint'); }}
              className="w-full sm:w-auto flex-1 bg-surface-container-lowest border-2 border-secondary text-secondary px-8 py-3.5 rounded-xl font-body-md text-base font-bold hover:bg-secondary-container/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">search</span>
              <span>{translations.trackComplaint}</span>
            </button>
          </div>

          {/* Emergency Assistance Link */}
          <div className="mt-space-lg flex items-center gap-2 text-body-sm text-tertiary font-semibold">
            <span className="material-symbols-outlined text-lg">emergency</span>
            <span>{translations.emergencyQuestion}</span>
            <button
              onClick={() => { setPersona('citizen'); setCurrentView('emergency'); }}
              className="underline hover:text-tertiary/80 cursor-pointer font-bold"
            >
              {translations.emergencyAction}
            </button>
          </div>
          </div>
          <div className="civic-landing-art-wrap" aria-hidden="true">
            <img
              className="civic-landing-art"
              src="/images/karnataka-civic-building.svg"
              alt=""
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* 2. SIMPLE 3-STEP PROCESS */}
      <section className="w-full py-16 bg-surface-container-low border-b border-surface-container" id="how-it-works">
        <div className="max-w-6xl mx-auto px-margin md:px-margin-desktop">
          <div className="text-center mb-12">
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface">{translations.howItWorks}</h2>
            <p className="font-body-md text-on-surface-variant mt-2 text-base">{translations.howItWorksSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-surface flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">{translations.reportTheProblem}</h3>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                {translations.reportTheProblemBody}
              </p>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">{translations.municipalDispatch}</h3>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                {translations.municipalDispatchBody}
              </p>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary-container text-secondary flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">{translations.verifiedResolution}</h3>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                {translations.verifiedResolutionBody}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POPULAR ISSUE CATEGORIES */}
      <section className="w-full py-16 bg-surface-container-lowest border-b border-surface-container">
        <div className="max-w-6xl mx-auto px-margin md:px-margin-desktop">
          <div className="text-center mb-10">
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface">{translations.commonIssues}</h2>
            <p className="font-body-md text-on-surface-variant mt-2 text-base">{translations.issueCategoryPrompt}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { title: 'Potholes & Roads', icon: 'traffic' },
              { title: 'Garbage & Waste', icon: 'delete_sweep' },
              { title: 'Streetlights', icon: 'lightbulb' },
              { title: 'Water Leakage', icon: 'water_drop' },
              { title: 'Drainage & Floods', icon: 'waves' },
              { title: 'Traffic Signals', icon: 'traffic_jam' },
            ].map((cat, i) => (
              <button
                key={i}
                onClick={() => handleCategorySelect(cat.title)}
                className="p-5 rounded-xl border border-surface-container hover:border-secondary hover:shadow-md transition-all cursor-pointer bg-surface flex flex-col items-center text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-container-low text-secondary flex items-center justify-center mb-3 group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                  <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                </div>
                <span className="font-body-md text-sm font-semibold text-on-surface group-hover:text-secondary transition-colors">
                  {cat.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. EMERGENCY BANNER */}
      <section className="w-full bg-surface-container py-10 border-b border-surface-container">
        <div className="max-w-5xl mx-auto px-margin md:px-margin-desktop flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">call</span>
            </div>
            <div>
              <div className="font-headline-md text-lg font-bold text-tertiary">Immediate Danger or Severe Hazard?</div>
              <div className="font-body-sm text-sm text-on-surface-variant">Live electric wires, gas leaks, or roadway cave-ins.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setPersona('citizen'); setCurrentView('emergency'); }}
              className="px-6 py-2.5 rounded-xl bg-tertiary text-on-tertiary font-bold text-sm hover:brightness-105 transition-all shadow-sm cursor-pointer"
            >
              Emergency Helplines (112 / 1913)
            </button>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="w-full bg-surface-container-low py-10">
        <div className="max-w-6xl mx-auto px-margin md:px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-6 text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">account_balance</span>
            </div>
            <div>
              <span className="font-bold text-secondary text-base">NagarSetu</span>
              <span className="ml-2 text-xs text-on-surface-variant">Better Cities. Faster Action.</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span>{translations.language}:</span>
            <button type="button" onClick={() => setLocale('en')} className={`cursor-pointer ${locale === 'en' ? 'font-bold underline text-secondary' : 'hover:underline'}`}>English</button>
            <span>•</span>
            <button type="button" onClick={() => setLocale('kn')} className={`cursor-pointer ${locale === 'kn' ? 'font-bold underline text-secondary' : 'hover:underline'}`}>ಕನ್ನಡ</button>
          </div>

          <div className="text-xs text-on-surface-variant/80">
            Interactive Municipal Prototype • © {new Date().getFullYear()} NagarSetu
          </div>
        </div>
      </footer>
    </div>
  );
};
