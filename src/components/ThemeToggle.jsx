import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="segment segment--theme" role="group" aria-label="外觀主題">
      <button type="button" aria-pressed={theme === 'system'} onClick={() => setTheme('system')} title="跟隨系統">自動</button>
      <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')} title="亮色">亮</button>
      <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')} title="深色">深</button>
    </div>
  );
}
