import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useLocalization } from '../../contexts/LocalizationContext';
import { ServiceTypeDropdown } from './ServiceTypeDropdown';
import type { ServiceType } from '../../types/services';

interface ServiceBookingFormProps {
  onSubmit: (serviceData: ServiceBookingData) => void;
  onCancel: () => void;
  petId?: number;
}

export interface ServiceBookingData {
  service_type: ServiceType;
  pet_id: number;
  start_datetime: string;
  end_datetime?: string;
  duration_hours?: number;
  price?: number;
  currency: string;
  pickup_address?: string;
  dropoff_address?: string;
  customer_notes?: string;
}

export const ServiceBookingForm: React.FC<ServiceBookingFormProps> = ({
  onSubmit,
  onCancel,
  petId = 1, // Default pet ID for demo
}) => {
  const { t } = useLocalization();
  const [formData, setFormData] = useState<ServiceBookingData>({
    service_type: 'walking',
    pet_id: petId,
    start_datetime: '',
    end_datetime: '',
    duration_hours: 1,
    price: 0,
    currency: 'USD',
    pickup_address: '',
    dropoff_address: '',
    customer_notes: '',
  });

  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<Date | null>(new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);

  const handleServiceTypeChange = (serviceType: ServiceType | '') => {
    if (serviceType) {
      setFormData(prev => ({ ...prev, service_type: serviceType }));
    }
  };

  const handleInputChange = (field: keyof ServiceBookingData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    // Combine date and time for start_datetime
    if (startDate && startTime) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      formData.start_datetime = startDateTime.toISOString();
    }

    // Combine date and time for end_datetime if provided
    if (endTime) {
      const endDateTime = new Date(startDate || new Date());
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      formData.end_datetime = endDateTime.toISOString();
    }

    onSubmit(formData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('services.bookService')}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <ServiceTypeDropdown
                value={formData.service_type}
                onChange={handleServiceTypeChange}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('services.price')}
                type="number"
                value={formData.price}
                onChange={handleInputChange('price')}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label={t('services.startDate')}
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TimePicker
                label={t('services.startTime')}
                value={startTime}
                onChange={setStartTime}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TimePicker
                label={t('services.endTime')}
                value={endTime}
                onChange={setEndTime}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('services.duration')}
                type="number"
                value={formData.duration_hours}
                onChange={handleInputChange('duration_hours')}
                inputProps={{ min: 0.5, step: 0.5 }}
                helperText={t('services.hours')}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('services.pickupLocation')}
                value={formData.pickup_address}
                onChange={handleInputChange('pickup_address')}
                multiline
                rows={2}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('services.dropoffLocation')}
                value={formData.dropoff_address}
                onChange={handleInputChange('dropoff_address')}
                multiline
                rows={2}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('services.notes')}
                value={formData.customer_notes}
                onChange={handleInputChange('customer_notes')}
                multiline
                rows={3}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={onCancel}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="contained">
                  {t('services.confirmBooking')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default ServiceBookingForm;
