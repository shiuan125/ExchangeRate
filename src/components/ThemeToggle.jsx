import { useTheme } from '../hooks/useTheme';

const ICONS = {
  light: (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="3.2" />
      <path d="M8 1.3v1.6M8 13.1v1.6M2.6 8H1M15 8h-1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1" strokeLinecap="round" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M13.8 9.4A5.6 5.6 0 1 1 6.6 2.2a4.4 4.4 0 0 0 7.2 7.2Z" strokeLinejoin="round" />
    </svg>
  ),
};

const LABELS = { light: '亮', dark: '深' };
const TITLES = { light: '亮色', dark: '深色' };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="segment segment--theme" role="group" aria-label="外觀主題">
      {['light', 'dark'].map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={theme === t}
          aria-label={TITLES[t]}
          title={TITLES[t]}
          onClick={() => setTheme(t)}
        >
          {ICONS[t]}
          <span className="sr-only">{LABELS[t]}</span>
        </button>
      ))}
    </div>
  );
}
