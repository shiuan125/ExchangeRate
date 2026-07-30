import { useElderMode } from '../hooks/useElderMode';

export function ElderModeToggle() {
  const { elderMode, toggle } = useElderMode();

  return (
    <button
      type="button"
      className="elder-toggle"
      aria-pressed={elderMode}
      aria-label="大字模式：放大字體、加強對比"
      title="大字模式：放大字體、加強對比"
      onClick={toggle}
    >
      <span aria-hidden="true">大</span>
      <span className="sr-only">大字模式</span>
    </button>
  );
}
