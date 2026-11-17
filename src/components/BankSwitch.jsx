const LABELS = { cathay: '國泰', sinopac: '永豐' };
const KEYS = Object.keys(LABELS);

export function BankSwitch({ bank, onChange }) {
  const index = Math.max(0, KEYS.indexOf(bank));
  return (
    <nav className="bank-bar" aria-label="銀行" style={{ '--count': KEYS.length, '--index': index }}>
      {/* Liquid Glass 的選取「鏡片」，切換時滑到目前的銀行 */}
      <span className="bank-bar-lens" aria-hidden="true" />
      {KEYS.map((key) => (
        <button key={key} type="button" aria-pressed={bank === key} onClick={() => onChange(key)}>
          {LABELS[key]}
        </button>
      ))}
    </nav>
  );
}
