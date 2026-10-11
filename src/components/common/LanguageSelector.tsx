import React from 'react';
import { SupportedLocale } from '../../services/i18nService';

interface LanguageSelectorProps {
  value: SupportedLocale;
  onChange: (locale: SupportedLocale) => void;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange, className = '' }) => {
  const options: { value: SupportedLocale; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'kn', label: 'ಕನ್ನಡ' },
  ];

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-[#d9d3c5] bg-white/80 p-1 shadow-sm backdrop-blur-sm ${className}`}>
      <span className="hidden px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#514533] sm:inline">Lang</span>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={`Switch language to ${option.label}`}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-2 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315C4A] sm:px-3 sm:text-sm ${
              isActive ? 'bg-[#315C4A] text-white shadow-sm' : 'text-[#171A17] hover:bg-[#F7F4EA]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
