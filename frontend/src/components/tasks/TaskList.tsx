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
} from "@mui/material";
import { styled } from "@mui/material/styles";

type Task = {
  id: number | string;
  title: string;
  dueDate: string;
  pet: string;
  completed: boolean;
};

type TaskListProps = {
  tasks: Task[];
  onTaskToggle?: (taskId: number | string) => void;
  onTaskClick?: (taskId: number | string) => void;
};

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: 0,
  "&:not(:last-child)": {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

export const TaskList = ({
  tasks,
  onTaskToggle,
  onTaskClick,
}: TaskListProps) => {
  const handleToggle =
    (taskId: number | string) => (event: React.MouseEvent) => {
      event.stopPropagation();
      onTaskToggle?.(taskId);
    };

  const handleClick = (taskId: number | string) => () => {
    onTaskClick?.(taskId);
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
      {tasks.map((task) => {
        const labelId = `checkbox-list-label-${task.id}`;

        return (
          <StyledListItem
            key={task.id}
            secondaryAction={
              <Typography variant="body2" color="text.secondary">
                {task.pet}
              </Typography>
            }
            disablePadding
          >
            <ListItemButton
              role={undefined}
              onClick={handleClick(task.id)}
              dense
              sx={{
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Checkbox
                  edge="start"
                  checked={task.completed}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ "aria-labelledby": labelId }}
                  onClick={handleToggle(task.id)}
                />
              </ListItemIcon>
              <ListItemText
                id={labelId}
                primary={
                  <Typography
                    variant="body1"
                    sx={{
                      textDecoration: task.completed ? "line-through" : "none",
                      color: task.completed ? "text.disabled" : "text.primary",
                    }}
                  >
                    {task.title}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color={task.completed ? "text.disabled" : "text.secondary"}
                  >
                    {task.dueDate}
                  </Typography>
                }
              />
            </ListItemButton>
          </StyledListItem>
        );
      })}
    </List>
  );
};

export default TaskList;
