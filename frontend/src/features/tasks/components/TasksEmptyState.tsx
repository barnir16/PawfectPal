import { Box, Button, Paper, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

interface TasksEmptyStateProps {
  hasFilters: boolean;
  onResetFilters?: () => void;
  onAddTask?: () => void;
}

export const TasksEmptyState = ({
  hasFilters,
  onResetFilters,
  onAddTask,
}: TasksEmptyStateProps) => {
  return (
    <Paper
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        textAlign: 'center',
        backgroundColor: 'background.paper',
      }}
      elevation={0}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          {hasFilters ? 'No tasks match your filters' : 'No tasks found'}
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {hasFilters
            ? 'Try adjusting your search or filter criteria'
            : 'Get started by adding a new task'}
        </Typography>
      </Box>
      
      {hasFilters && onResetFilters && (
        <Button
          variant="outlined"
          color="primary"
          onClick={onResetFilters}
          sx={{ mb: 2 }}
        >
          Clear all filters
        </Button>
      )}
      
      {onAddTask && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddTask}
        >
          Add your first task
        </Button>
      )}
    </Paper>
  );
};

export default TasksEmptyState;
