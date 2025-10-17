import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { getFullImageUrl } from '../../utils/image';

interface ServiceBookingModalProps {
  open: boolean;
  onClose: () => void;
  provider: ServiceProvider | null;
  onConfirm: (bookingData: BookingData) => void;
}

export interface BookingData {
  provider_id: number;
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

export const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
  open,
  onClose,
  provider,
  onConfirm,
}) => {
  const { t } = useLocalization();
  const [formData, setFormData] = useState<BookingData>({
    provider_id: provider?.id || 0,
    service_type: 'walking',
    pet_id: 1, // Default pet ID
    start_datetime: '',
    end_datetime: '',
    duration_hours: 1,
    price: provider?.provider_hourly_rate || 0,
    currency: 'ILS',
    pickup_address: '',
    dropoff_address: '',
    customer_notes: '',
  });

  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleServiceTypeChange = (serviceType: ServiceType | '') => {
    if (serviceType) {
      setFormData(prev => ({ ...prev, service_type: serviceType }));
    }
  };

  const handleInputChange = (field: keyof BookingData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!startDate || !startTime) {
        throw new Error(t('services.selectDateAndTime'));
      }

      // Combine date and time for start_datetime
      const startDateTime = new Date(`${startDate}T${startTime}`);
      formData.start_datetime = startDateTime.toISOString();

      // Combine date and time for end_datetime if provided
      if (endTime) {
        const endDateTime = new Date(`${startDate}T${endTime}`);
        formData.end_datetime = endDateTime.toISOString();
      }

      // Calculate total price
      if (provider?.provider_hourly_rate && formData.duration_hours) {
        formData.price = provider.provider_hourly_rate * formData.duration_hours;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call the onConfirm callback
      onConfirm(formData);
      
      // Close the modal
      onClose();
      
    } catch (err: any) {
      setError(err.message || t('services.bookingFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!provider) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img
              src={getFullImageUrl(provider.profile_image)}
              alt={provider.full_name}
              style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }}
            />
            <Box>
              <Typography variant="h6">{provider.full_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t(`services.${provider.provider_services[0]}`)} • ₪{provider.provider_hourly_rate}/hr
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <ServiceTypeDropdown
                  value={formData.service_type}
                  onChange={handleServiceTypeChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('services.duration')}
                  type="number"
                  value={formData.duration_hours}
                  onChange={handleInputChange('duration_hours')}
                  inputProps={{ min: 0.5, step: 0.5 }}
                  helperText={t('services.hours')}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('services.startDate')}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('services.startTime')}
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('services.endTime')}
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('services.price')}
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange('price')}
                  inputProps={{ min: 0, step: 0.01 }}
                  disabled
                  helperText={t('services.calculatedAutomatically')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('services.pickupLocation')}
                  value={formData.pickup_address}
                  onChange={handleInputChange('pickup_address')}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('services.dropoffLocation')}
                  value={formData.dropoff_address}
                  onChange={handleInputChange('dropoff_address')}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('services.notes')}
                  value={formData.customer_notes}
                  onChange={handleInputChange('customer_notes')}
                  multiline
                  rows={3}
                  placeholder={t('services.specialRequests')}
                />
              </Grid>
            </Grid>

            {/* Booking Summary */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                {t('services.bookingSummary')}
              </Typography>
              <Typography variant="body2">
                <strong>{t('services.serviceType')}:</strong> {t(`services.${formData.service_type}`)}
              </Typography>
              <Typography variant="body2">
                <strong>{t('services.duration')}:</strong> {formData.duration_hours} {t('services.hours')}
              </Typography>
              <Typography variant="body2">
                <strong>{t('services.totalCost')}:</strong> ₪{formData.price || 0}
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? t('services.booking') : t('services.confirmBooking')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
  );
};

export default ServiceBookingModal;
