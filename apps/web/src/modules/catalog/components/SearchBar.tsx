interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Controlled search input. Debouncing is the caller's responsibility (see useDebouncedValue). */
export function SearchBar({ value, onChange, placeholder = "Search products…" }: SearchBarProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label="Search catalog"
    />
  );
}
