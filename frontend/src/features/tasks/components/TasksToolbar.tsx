import { ToggleButton, ToggleButtonGroup, Button, Tooltip } from "@mui/material";
import {
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Sync as SyncIcon,
} from "@mui/icons-material";

interface TasksToolbarProps {
  view: "list" | "grid";
  onViewChange: (
    event: React.MouseEvent<HTMLElement>,
    newView: "list" | "grid" | null
  ) => void;
  onAddTask: () => void;
  onExportTasks?: () => void;
  onSyncWithGoogleCalendar?: () => void;
  children?: React.ReactNode;
}

export const TasksToolbar = ({
  view,
  onViewChange,
  onAddTask,
  onExportTasks,
  onSyncWithGoogleCalendar,
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
        
        {onExportTasks && (
          <Tooltip title="Export tasks to iCal file">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={onExportTasks}
            >
              Export
            </Button>
          </Tooltip>
        )}
        
        {onSyncWithGoogleCalendar && (
          <Tooltip title="Sync tasks with Google Calendar">
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={onSyncWithGoogleCalendar}
            >
              Sync Calendar
            </Button>
          </Tooltip>
        )}
        
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
