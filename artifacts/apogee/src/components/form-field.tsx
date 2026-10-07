import { CheckIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

export function FormField({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-stone-700">{label}</Label>
      {children}
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ToggleChip<T extends string>({
  value,
  selected,
  onToggle,
}: {
  value: T;
  selected: boolean;
  onToggle: (value: T) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(value)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        selected
          ? "bg-amber-100 border-amber-400 text-amber-900"
          : "bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
      }`}
    >
      {selected && <CheckIcon className="h-3 w-3" />}
      {value}
    </button>
  );
}

// Add or remove one value from a multi-select list.
export function toggled<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
