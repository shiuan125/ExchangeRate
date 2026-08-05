import { version } from '../../package.json';

export function Footer() {
  return (
    <footer className="app-footer">
      <span>v{version}</span>
    </footer>
  );
}
