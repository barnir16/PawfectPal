import { Box, Button } from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
  
  // Set default values after getting the t function
  const defaultDeleteText = deleteButtonText || t('common.delete');
  const defaultSubmitText = submitButtonText || t('common.save');
  const defaultCancelText = cancelButtonText || t('common.cancel');
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 4,
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box>
        {isEditing && showDelete && onDelete && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onDelete}
            disabled={isSubmitting}
            sx={{ mr: 2 }}
          >
            {defaultDeleteText}
          </Button>
        )}
      </Box>
      
      <Box>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isSubmitting}
          sx={{ mr: 2 }}
          startIcon={<CancelIcon />}
        >
          {defaultCancelText}
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          startIcon={<SaveIcon />}
        >
                      {isSubmitting ? t('pets.saving') : defaultSubmitText}
        </Button>
      </Box>
    </Box>
  );
};

export default FormActionButtons;
