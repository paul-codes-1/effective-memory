interface SearchInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

const SearchInput = ({ label, placeholder, value, onChange }: SearchInputProps) => {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {label && <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>{label}</span>}
      <input
        className="input"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
};

export default SearchInput;
