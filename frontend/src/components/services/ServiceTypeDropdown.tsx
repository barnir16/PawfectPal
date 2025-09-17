import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { ServiceType } from '../../types/services';

interface ServiceTypeDropdownProps {
  value: ServiceType | '';
  onChange: (serviceType: ServiceType | '') => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

const SERVICE_TYPES: ServiceType[] = ['walking', 'sitting', 'boarding', 'grooming', 'veterinary'];

export const ServiceTypeDropdown: React.FC<ServiceTypeDropdownProps> = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  fullWidth = true,
  size = 'medium',
}) => {
  const { t } = useLocalization();

  const handleChange = (event: SelectChangeEvent<ServiceType | ''>) => {
    const selectedValue = event.target.value as ServiceType | '';
    onChange(selectedValue);
  };

  return (
    <FormControl 
      fullWidth={fullWidth} 
      required={required} 
      disabled={disabled}
      size={size}
    >
      <InputLabel id="service-type-label">
        {label || t('services.selectServiceType')}
      </InputLabel>
      <Select
        labelId="service-type-label"
        value={value}
        label={label || t('services.selectServiceType')}
        onChange={handleChange}
      >
        <MenuItem value="">
          {t('services.allServices')}
        </MenuItem>
        {SERVICE_TYPES.map((serviceType) => (
          <MenuItem key={serviceType} value={serviceType}>
            {t(`services.${serviceType}`)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ServiceTypeDropdown;
