import { Box, Button, Divider } from '@mui/material';
import { Save as SaveIcon, Delete as DeleteIcon, Cancel as CancelIcon } from '@mui/icons-material';

type FormActionsProps = {
  isEditing: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onDelete?: () => void;
};

export const FormActions = ({
  isEditing,
  isSubmitting,
  onCancel,
  onDelete,
}: FormActionsProps) => {
  return (
    <Box sx={{ mt: 4 }}>
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          {isEditing && onDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
              sx={{ mr: 2 }}
            >
              Delete Task
            </Button>
          )}
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
          >
            {isEditing ? 'Update Task' : 'Create Task'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default FormActions;
