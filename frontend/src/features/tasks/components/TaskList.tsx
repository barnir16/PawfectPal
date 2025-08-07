import React from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Box,
  Typography,
  IconButton,
  Chip
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: number | string;
  title: string;
  description: string;
  dueDate: string;
  pet: string;
  priority: Priority;
  completed: boolean;
}

type TaskListProps = {
  tasks: Task[];
  onEdit: (id: number | string) => void;
  onDelete: (id: number | string) => void;
  onToggleComplete: (id: number | string, completed: boolean) => void;
  onTaskToggle?: (taskId: number | string) => void; // For backward compatibility
  onTaskClick?: (taskId: number | string) => void;  // For backward compatibility
};

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: 0,
  "&:not(:last-child)": {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

export const TaskList = ({
  tasks,
  onEdit,
  onDelete,
  onToggleComplete,
  onTaskToggle,
  onTaskClick,
}: TaskListProps) => {
  const handleToggle = (taskId: number | string, currentStatus: boolean) => (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    onToggleComplete?.(taskId, !currentStatus);
    onTaskToggle?.(taskId);
  };

  const handleClick = (taskId: number | string) => () => {
    onTaskClick?.(taskId);
  };

  const handleEdit = (taskId: number | string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    onEdit?.(taskId);
  };

  const handleDelete = (taskId: number | string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete?.(taskId);
  };

  if (tasks.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography color="text.secondary">No tasks found</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: "100%", bgcolor: "background.paper" }}>
      {tasks.map((task) => (
        <StyledListItem 
          key={task.id} 
          disablePadding
          secondaryAction={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                edge="end" 
                aria-label="edit" 
                onClick={handleEdit(task.id)}
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                edge="end" 
                aria-label="delete" 
                onClick={handleDelete(task.id)}
                size="small"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          <ListItemButton
            role={undefined}
            onClick={handleClick(task.id)}
            dense
          >
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={task.completed}
                tabIndex={-1}
                disableRipple
                onChange={handleToggle(task.id, task.completed)}
              />
            </ListItemIcon>
            <ListItemText
              primary={task.title}
              secondary={
                <Box sx={{ display: "flex", gap: 2, alignItems: 'center' }}>
                  <Typography variant="caption">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </Typography>
                  <Chip 
                    label={task.priority} 
                    size="small" 
                    color={
                      task.priority === 'high' ? 'error' : 
                      task.priority === 'medium' ? 'warning' : 'default'
                    }
                    variant="outlined"
                  />
                  <Typography variant="caption">{task.pet}</Typography>
                </Box>
              }
              primaryTypographyProps={{
                sx: {
                  textDecoration: task.completed ? "line-through" : "none",
                  color: task.completed ? "text.secondary" : "text.primary",
                },
              }}
            />
          </ListItemButton>
        </StyledListItem>
      ))}
    </List>
  );
};

export default TaskList;
