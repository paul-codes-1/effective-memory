import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

interface SearchInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

const SearchInput = ({ label, placeholder, value, onChange }: SearchInputProps) => {
  return (
    <TextField
      size="small"
      fullWidth
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export default SearchInput;
