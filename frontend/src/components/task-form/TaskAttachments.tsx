import { type Control, Controller } from "react-hook-form";
import {
  Grid,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";
import type { TaskFormData } from "../../pages/TaskForm.new";

type TaskAttachmentsProps = {
  control: Control<TaskFormData>;
  onFileUpload: (file: File) => void;
  onFileDelete: (fileId: string) => void;
  attachments: Array<{ id: string; name: string; size: string }>;
};

export const TaskAttachments = ({
  control,
  onFileUpload,
  onFileDelete,
  attachments = [],
}: TaskAttachmentsProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Notes & Attachments
        </Typography>

        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Notes"
              variant="outlined"
              multiline
              rows={4}
              placeholder="Add any additional notes or instructions..."
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <input
          type="file"
          id="file-upload"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Button
          component="label"
          htmlFor="file-upload"
          variant="outlined"
          startIcon={<UploadIcon />}
        >
          Upload File
        </Button>

        {attachments.length > 0 && (
          <List dense>
            {attachments.map((file) => (
              <ListItem
                key={file.id}
                secondaryAction={
                  <IconButton edge="end" onClick={() => onFileDelete(file.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <FileIcon sx={{ mr: 1 }} />
                <ListItemText primary={file.name} secondary={file.size} />
              </ListItem>
            ))}
          </List>
        )}
      </Grid>
    </Grid>
  );
};

export default TaskAttachments;
