import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { ServiceStatus } from '../../types/services';

interface ServiceStatusDropdownProps {
  value: ServiceStatus | '';
  onChange: (serviceStatus: ServiceStatus | '') => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

const SERVICE_STATUSES: ServiceStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

export const ServiceStatusDropdown: React.FC<ServiceStatusDropdownProps> = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  fullWidth = true,
  size = 'medium',
}) => {
  const { t } = useLocalization();

  const handleChange = (event: SelectChangeEvent<ServiceStatus | ''>) => {
    const selectedValue = event.target.value as ServiceStatus | '';
    onChange(selectedValue);
  };

  return (
    <FormControl 
      fullWidth={fullWidth} 
      required={required} 
      disabled={disabled}
      size={size}
    >
      <InputLabel id="service-status-label">
        {label || t('services.status')}
      </InputLabel>
      <Select
        labelId="service-status-label"
        value={value}
        label={label || t('services.status')}
        onChange={handleChange}
      >
        {SERVICE_STATUSES.map((status) => (
          <MenuItem key={status} value={status}>
            {t(`services.${status}`)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ServiceStatusDropdown;
