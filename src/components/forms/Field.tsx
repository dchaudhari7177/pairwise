export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-rose/20 bg-rose-soft px-3 py-2 text-sm text-rose-2">
      {message}
    </p>
  );
}

export function Check({
  checked,
  onChange,
  children,
  required,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2 text-sm text-ink-2 hover:bg-paper-2/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--rose)]"
      />
      <span>{children}</span>
    </label>
  );
}
