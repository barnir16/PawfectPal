import { ToggleButton, ToggleButtonGroup, Button } from "@mui/material";
import {
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Add as AddIcon,
} from "@mui/icons-material";

interface TasksToolbarProps {
  view: "list" | "grid";
  onViewChange: (
    event: React.MouseEvent<HTMLElement>,
    newView: "list" | "grid" | null
  ) => void;
  onAddTask: () => void;
  children?: React.ReactNode;
}

export const TasksToolbar = ({
  view,
  onViewChange,
  onAddTask,
  children,
}: TasksToolbarProps) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddTask}
        >
          Add Task
        </Button>
        {children}
      </div>

      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={onViewChange}
        aria-label="task view"
        size="small"
      >
        <ToggleButton value="list" aria-label="list view">
          <ViewListIcon />
        </ToggleButton>
        <ToggleButton value="grid" aria-label="grid view">
          <ViewModuleIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};
