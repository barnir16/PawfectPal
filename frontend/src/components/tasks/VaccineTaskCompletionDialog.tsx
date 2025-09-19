import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
// Removed date picker imports - using native date input instead
import { VaccineTaskService } from '../../services/tasks/vaccineTaskService';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { VaccineTask } from '../../services/tasks/vaccineTaskService';

interface VaccineTaskCompletionDialogProps {
  open: boolean;
  onClose: () => void;
  vaccineTask: VaccineTask | null;
  onTaskCompleted: () => void;
}

export const VaccineTaskCompletionDialog: React.FC<VaccineTaskCompletionDialogProps> = ({
  open,
  onClose,
  vaccineTask,
  onTaskCompleted,
}) => {
  const { t } = useLocalization();
  const [completionDate, setCompletionDate] = useState<Date | null>(new Date());
  const [veterinarian, setVeterinarian] = useState('');
  const [clinic, setClinic] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!vaccineTask || !completionDate) {
      setError('נדרשים תאריך השלמה ומשימת חיסון');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await VaccineTaskService.completeVaccineTask(vaccineTask.id || 0, {
        completedDate: completionDate.toISOString(),
        veterinarian,
        clinic,
        notes,
      });

      onTaskCompleted();
      onClose();
      
      // Reset form
      setCompletionDate(new Date());
      setVeterinarian('');
      setClinic('');
      setNotes('');
    } catch (err) {
      console.error('Error completing vaccine task:', err);
      setError('שגיאה בהשלמת משימת החיסון. אנא נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form
      setCompletionDate(new Date());
      setVeterinarian('');
      setClinic('');
      setNotes('');
      setError(null);
    }
  };

  if (!vaccineTask) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('vaccines.completeVaccine')}: {vaccineTask.title}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {t('vaccines.completionDescription')}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('vaccines.completionDate')}
            type="datetime-local"
            value={completionDate ? completionDate.toISOString().slice(0, 16) : ''}
            onChange={(e) => setCompletionDate(e.target.value ? new Date(e.target.value) : null)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            label={t('vaccines.veterinarian')}
            value={veterinarian}
            onChange={(e) => setVeterinarian(e.target.value)}
            fullWidth
            placeholder={t('vaccines.veterinarianPlaceholder')}
          />

          <TextField
            label={t('vaccines.clinic')}
            value={clinic}
            onChange={(e) => setClinic(e.target.value)}
            fullWidth
            placeholder={t('vaccines.clinicPlaceholder')}
          />

          <TextField
            label={t('vaccines.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder={t('vaccines.notesPlaceholder')}
          />

          <Alert severity="info">
            <Typography variant="body2">
              {t('vaccines.autoRescheduleInfo')}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || !completionDate}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {isSubmitting ? t('common.loading') : t('vaccines.completeVaccine')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VaccineTaskCompletionDialog;
