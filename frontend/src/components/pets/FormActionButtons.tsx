import { Box, Button, CircularProgress } from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';

interface FormActionButtonsProps {
  isEditing: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onDelete?: () => void;
  deleteButtonText?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  showDelete?: boolean;
}

export const FormActionButtons = ({
  isEditing,
  isSubmitting,
  onCancel,
  onDelete,
  deleteButtonText,
  submitButtonText,
  cancelButtonText,
  showDelete = true,
}: FormActionButtonsProps) => {
  const { t } = useLocalization();
  const deleteText = deleteButtonText || t('common.delete');
  const submitText = submitButtonText || t('common.save');
  const cancelText = cancelButtonText || t('common.cancel');

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2,
        px: 0.5,
      }}
    >
      {/* Left — destructive action */}
      <Box>
        {isEditing && showDelete && onDelete && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon fontSize="small" />}
            onClick={onDelete}
            disabled={isSubmitting}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              opacity: 0.85,
              '&:hover': { opacity: 1 },
            }}
          >
            {deleteText}
          </Button>
        )}
      </Box>

      {/* Right — cancel + save */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Button
          variant="text"
          onClick={onCancel}
          disabled={isSubmitting}
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            px: 2,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: 'text.primary' },
          }}
        >
          {cancelText}
        </Button>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          startIcon={
            isSubmitting
              ? <CircularProgress size={16} color="inherit" />
              : <SaveIcon fontSize="small" />
          }
          sx={{
            px: 3.5,
            py: 1,
            fontWeight: 700,
            fontSize: '0.95rem',
            boxShadow: '0 2px 10px rgba(244,162,97,0.35)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(244,162,97,0.45)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.15s ease',
          }}
        >
          {submitText}
        </Button>
      </Box>
    </Box>
  );
};

export default FormActionButtons;
