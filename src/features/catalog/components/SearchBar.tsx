export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Input de busqueda controlado. El debounce vive en el hook que consume el valor. */
export function SearchBar({ value, onChange, placeholder = 'Buscar productos...' }: SearchBarProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Buscar productos"
        className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
    </div>
  );
}
