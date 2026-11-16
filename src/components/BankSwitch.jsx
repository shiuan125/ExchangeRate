const LABELS = { cathay: '國泰', sinopac: '永豐' };

export function BankSwitch({ bank, onChange }) {
  return (
    <div className="segment bank-switch" role="group" aria-label="銀行">
      {Object.entries(LABELS).map(([key, label]) => (
        <button key={key} type="button" aria-pressed={bank === key} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}
