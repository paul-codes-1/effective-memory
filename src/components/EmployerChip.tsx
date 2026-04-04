import { Link } from 'react-router-dom';
import Chip, { type ChipProps } from '@mui/material/Chip';
import { slugify, normalizeEmployerKey } from '../data/utils';

interface EmployerChipProps extends Omit<ChipProps, 'label' | 'component'> {
  employer: string;
}

const EmployerChip = ({ employer, ...chipProps }: EmployerChipProps) => {
  const key = normalizeEmployerKey(employer);
  if (key) {
    return (
      <Chip
        label={employer}
        component={Link as React.ElementType}
        to={`/employers/${slugify(key)}`}
        clickable
        {...chipProps}
      />
    );
  }
  return <Chip label={employer} {...chipProps} />;
};

export default EmployerChip;
